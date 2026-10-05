import {
    Injectable,
    Inject,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    Logger,
} from "@nestjs/common";
import { randomInt } from "crypto";
import { PrismaClient } from "@orderhub/database";
import { PRISMA_TOKEN } from "../database/database.module";

@Injectable()
export class GiftCardsService {
    private readonly logger = new Logger(GiftCardsService.name);

    constructor(
        @Inject(PRISMA_TOKEN) private readonly prisma: PrismaClient,
    ) { }

    // ─── Purchase gift card ───────────────────────────────────────────────────────

    async purchaseGiftCard(userId: string, dto: {
        amount: number;
        recipientEmail?: string;
        recipientPhone?: string;
        message?: string;
    }) {
        // Validate amount
        const validAmounts = [50000, 100000, 250000, 500000, 1000000]; // ₹500, ₹1000, ₹2500, ₹5000, ₹10000
        if (!validAmounts.includes(dto.amount)) {
            throw new BadRequestException("Invalid gift card amount");
        }

        // Generate unique code
        const code = this.generateGiftCardCode();

        // Set expiry (1 year from now)
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        // Process payment (this would integrate with payment service)
        // For now, we'll just create the gift card

        const giftCard = await this.prisma.giftCard.create({
            data: {
                code,
                amount: dto.amount,
                balance: dto.amount,
                senderUserId: userId,
                recipientEmail: dto.recipientEmail || null,
                recipientPhone: dto.recipientPhone || null,
                message: dto.message || null,
                status: "ACTIVE",
                expiresAt,
            },
            include: {
                sender: {
                    select: { id: true, fullName: true, email: true },
                },
            },
        });

        // If recipient email provided, send email notification
        if (dto.recipientEmail) {
            // This would integrate with email service
            this.logger.log(`Gift card ${code} sent to ${dto.recipientEmail}`);
        }

        return giftCard;
    }

    // ─── Redeem gift card ───────────────────────────────────────────────────────

    async redeemGiftCard(userId: string, dto: { code: string; orderId: string }) {
        const giftCard = await this.prisma.giftCard.findUnique({
            where: { code: dto.code },
        });

        if (!giftCard) throw new NotFoundException("Gift card not found");
        if (giftCard.status !== "ACTIVE") {
            throw new BadRequestException("Gift card is not active");
        }

        // Check expiry
        if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
            await this.prisma.giftCard.update({
                where: { id: giftCard.id },
                data: { status: "EXPIRED" },
            });
            throw new BadRequestException("Gift card has expired");
        }

        // Check balance
        if (giftCard.balance <= 0) {
            throw new BadRequestException("Gift card has no remaining balance");
        }

        // Get order to determine redemption amount
        const order = await this.prisma.order.findUnique({
            where: { id: dto.orderId },
        });

        if (!order) throw new NotFoundException("Order not found");
        if (order.userId !== userId) {
            throw new ForbiddenException("Not your order");
        }

        // Determine redemption amount (min of gift card balance and order amount)
        const redemptionAmount = Math.min(giftCard.balance, order.totalAmount);

        // Create redemption record
        await this.prisma.giftCardRedemption.create({
            data: {
                giftCardId: giftCard.id,
                userId,
                orderId: dto.orderId,
                amount: redemptionAmount,
            },
        });

        // Update gift card balance
        const newBalance = giftCard.balance - redemptionAmount;
        await this.prisma.giftCard.update({
            where: { id: giftCard.id },
            data: {
                balance: newBalance,
                status: newBalance === 0 ? "REDEEMED" : "ACTIVE",
            },
        });

        // Update order to reflect gift card redemption
        await this.prisma.order.update({
            where: { id: dto.orderId },
            data: {
                giftCardAmountRedeemed: { increment: redemptionAmount },
                totalAmount: { decrement: redemptionAmount },
            },
        });

        return {
            success: true,
            amountRedeemed: redemptionAmount,
            remainingBalance: newBalance,
        };
    }

    // ─── Get user's gift cards ─────────────────────────────────────────────────

    async getMyGiftCards(userId: string, status?: string, page = 1, pageSize = 20) {
        const skip = (page - 1) * pageSize;

        const where: any = {
            OR: [
                { senderUserId: userId },
                { recipientEmail: (await this.prisma.user.findUnique({ where: { id: userId } }))?.email },
            ],
        };

        if (status) {
            where.status = status;
        }

        const [giftCards, total] = await Promise.all([
            this.prisma.giftCard.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: "desc" },
                include: {
                    sender: {
                        select: { id: true, fullName: true },
                    },
                },
            }),
            this.prisma.giftCard.count({ where }),
        ]);

        return {
            data: giftCards,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }

    // ─── Check gift card balance ───────────────────────────────────────────────

    async checkBalance(code: string) {
        const giftCard = await this.prisma.giftCard.findUnique({
            where: { code },
        });

        if (!giftCard) throw new NotFoundException("Gift card not found");

        return {
            code: giftCard.code,
            balance: giftCard.balance,
            originalAmount: giftCard.amount,
            status: giftCard.status,
            expiresAt: giftCard.expiresAt,
        };
    }

    // ─── Get gift card details ───────────────────────────────────────────────────

    async getGiftCard(id: string) {
        const giftCard = await this.prisma.giftCard.findUnique({
            where: { id },
            include: {
                sender: {
                    select: { id: true, fullName: true, email: true },
                },
                redemptions: {
                    include: {
                        user: {
                            select: { id: true, fullName: true },
                        },
                    },
                },
            },
        });

        if (!giftCard) throw new NotFoundException("Gift card not found");

        return giftCard;
    }

    // ─── Get redemption history ─────────────────────────────────────────────────

    async getRedemptionHistory(userId: string, page = 1, pageSize = 20) {
        const skip = (page - 1) * pageSize;

        const [redemptions, total] = await Promise.all([
            this.prisma.giftCardRedemption.findMany({
                where: { userId },
                skip,
                take: pageSize,
                orderBy: { createdAt: "desc" },
                include: {
                    giftCard: {
                        select: { code: true, amount: true },
                    },
                    order: {
                        select: { id: true, totalAmount: true },
                    },
                },
            }),
            this.prisma.giftCardRedemption.count({ where: { userId } }),
        ]);

        return {
            data: redemptions,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }

    // ─── Private helpers ─────────────────────────────────────────────────────────

    private generateGiftCardCode(): string {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let code = "";
        for (let i = 0; i < 12; i++) {
            if (i > 0 && i % 4 === 0) code += "-";
            code += chars.charAt(randomInt(chars.length));
        }
        return code;
    }

    // ─── Process expired gift cards (called by cron job) ─────────────────────────

    async processExpiredGiftCards() {
        const now = new Date();
        const expiredCards = await this.prisma.giftCard.findMany({
            where: {
                status: "ACTIVE",
                expiresAt: { lte: now },
            },
        });

        for (const card of expiredCards) {
            await this.prisma.giftCard.update({
                where: { id: card.id },
                data: { status: "EXPIRED" },
            });
            this.logger.log(`Expired gift card ${card.code}`);
        }

        return { expired: expiredCards.length };
    }
}