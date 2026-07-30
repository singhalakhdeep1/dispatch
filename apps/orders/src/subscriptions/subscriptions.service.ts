import {
    Injectable,
    Inject,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    Logger,
} from "@nestjs/common";
import { PrismaClient } from "@orderhub/database";
import { PRISMA_TOKEN } from "../database/database.module";

@Injectable()
export class SubscriptionsService {
    private readonly logger = new Logger(SubscriptionsService.name);

    constructor(
        @Inject(PRISMA_TOKEN) private readonly prisma: PrismaClient,
    ) { }

    // ─── Get user's subscription ─────────────────────────────────────────────────

    async getUserSubscription(userId: string) {
        const subscription = await this.prisma.subscription.findFirst({
            where: {
                userId,
                status: "ACTIVE",
            },
        });

        if (!subscription) {
            return { hasSubscription: false };
        }

        return {
            hasSubscription: true,
            subscription: {
                id: subscription.id,
                planType: subscription.planType,
                status: subscription.status,
                startDate: subscription.startDate,
                endDate: subscription.endDate,
                autoRenew: subscription.autoRenew,
                nextBillingDate: subscription.nextBillingDate,
            },
        };
    }

    // ─── Create subscription ───────────────────────────────────────────────────────

    async createSubscription(userId: string, dto: { planType: string; paymentMethodId: string }) {
        // Check if user already has active subscription
        const existing = await this.prisma.subscription.findFirst({
            where: {
                userId,
                status: "ACTIVE",
            },
        });

        if (existing) {
            throw new BadRequestException("User already has an active subscription");
        }

        // Validate plan type
        const validPlans = ["MONTHLY", "YEARLY"];
        if (!validPlans.includes(dto.planType)) {
            throw new BadRequestException("Invalid plan type");
        }

        // Calculate subscription period
        const startDate = new Date();
        const endDate = new Date();
        const nextBillingDate = new Date();

        if (dto.planType === "MONTHLY") {
            endDate.setMonth(endDate.getMonth() + 1);
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        } else {
            endDate.setFullYear(endDate.getFullYear() + 1);
            nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
        }

        // Create subscription
        const subscription = await this.prisma.subscription.create({
            data: {
                userId,
                planType: dto.planType,
                status: "ACTIVE",
                startDate,
                endDate,
                autoRenew: true,
                nextBillingDate,
            },
        });

        // Process payment (this would integrate with payment service)
        // For now, we'll just create the subscription

        return subscription;
    }

    // ─── Cancel subscription ────────────────────────────────────────────────────

    async cancelSubscription(id: string, userId: string) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { id },
        });

        if (!subscription) throw new NotFoundException("Subscription not found");
        if (subscription.userId !== userId) {
            throw new ForbiddenException("Not your subscription");
        }

        if (subscription.status !== "ACTIVE") {
            throw new BadRequestException("Subscription is not active");
        }

        await this.prisma.subscription.update({
            where: { id },
            data: {
                status: "CANCELLED",
                autoRenew: false,
            },
        });

        return { success: true };
    }

    // ─── Pause subscription ───────────────────────────────────────────────────────

    async pauseSubscription(id: string, userId: string) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { id },
        });

        if (!subscription) throw new NotFoundException("Subscription not found");
        if (subscription.userId !== userId) {
            throw new ForbiddenException("Not your subscription");
        }

        if (subscription.status !== "ACTIVE") {
            throw new BadRequestException("Cannot pause non-active subscription");
        }

        await this.prisma.subscription.update({
            where: { id },
            data: {
                status: "PAUSED",
            },
        });

        return { success: true };
    }

    // ─── Resume subscription ─────────────────────────────────────────────────────

    async resumeSubscription(id: string, userId: string) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { id },
        });

        if (!subscription) throw new NotFoundException("Subscription not found");
        if (subscription.userId !== userId) {
            throw new ForbiddenException("Not your subscription");
        }

        if (subscription.status !== "PAUSED") {
            throw new BadRequestException("Subscription is not paused");
        }

        // Check if subscription has expired
        if (subscription.endDate < new Date()) {
            throw new BadRequestException("Subscription has expired");
        }

        await this.prisma.subscription.update({
            where: { id },
            data: {
                status: "ACTIVE",
            },
        });

        return { success: true };
    }

    // ─── Get available plans ─────────────────────────────────────────────────────

    async getAvailablePlans() {
        return [
            {
                id: "MONTHLY",
                name: "Monthly Pass",
                description: "Free delivery on all orders for 30 days",
                price: 49900, // ₹499 in paise
                duration: "30 days",
                features: [
                    "Free delivery on all orders",
                    "Exclusive restaurant access",
                    "Priority customer support",
                    "5% off on orders above ₹500",
                ],
            },
            {
                id: "YEARLY",
                name: "Annual Pass",
                description: "Free delivery on all orders for 365 days",
                price: 499900, // ₹4,999 in paise
                duration: "365 days",
                features: [
                    "Free delivery on all orders",
                    "Exclusive restaurant access",
                    "Priority customer support",
                    "10% off on all orders",
                    "2 free delivery passes for friends",
                ],
            },
        ];
    }

    // ─── Get subscription history ────────────────────────────────────────────────

    async getSubscriptionHistory(userId: string, page = 1, pageSize = 20) {
        const skip = (page - 1) * pageSize;

        const [subscriptions, total] = await Promise.all([
            this.prisma.subscription.findMany({
                where: { userId },
                skip,
                take: pageSize,
                orderBy: { createdAt: "desc" },
            }),
            this.prisma.subscription.count({ where: { userId } }),
        ]);

        return {
            data: subscriptions,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }

    // ─── Process subscription order (called when user places order) ─────────────

    async processSubscriptionOrder(userId: string, orderId: string) {
        const subscription = await this.prisma.subscription.findFirst({
            where: {
                userId,
                status: "ACTIVE",
            },
        });

        if (!subscription) {
            return { eligible: false };
        }

        // Check if subscription is valid
        if (subscription.endDate < new Date()) {
            // Expire subscription
            await this.prisma.subscription.update({
                where: { id: subscription.id },
                data: { status: "EXPIRED" },
            });
            return { eligible: false };
        }

        // Link order to subscription
        await this.prisma.subscriptionOrder.create({
            data: {
                subscriptionId: subscription.id,
                orderId,
                deliveryFeeWaived: true,
            },
        });

        return {
            eligible: true,
            deliveryFeeWaived: true,
            subscriptionId: subscription.id,
        };
    }

    // ─── Process renewals (called by cron job) ───────────────────────────────────

    async processRenewals() {
        const now = new Date();
        const subscriptionsToRenew = await this.prisma.subscription.findMany({
            where: {
                status: "ACTIVE",
                autoRenew: true,
                nextBillingDate: { lte: now },
            },
        });

        for (const subscription of subscriptionsToRenew) {
            try {
                // Process payment (this would integrate with payment service)
                // For now, we'll just extend the subscription

                const newEndDate = new Date(subscription.endDate);
                const newBillingDate = new Date(subscription.nextBillingDate);

                if (subscription.planType === "MONTHLY") {
                    newEndDate.setMonth(newEndDate.getMonth() + 1);
                    newBillingDate.setMonth(newBillingDate.getMonth() + 1);
                } else {
                    newEndDate.setFullYear(newEndDate.getFullYear() + 1);
                    newBillingDate.setFullYear(newBillingDate.getFullYear() + 1);
                }

                await this.prisma.subscription.update({
                    where: { id: subscription.id },
                    data: {
                        endDate: newEndDate,
                        nextBillingDate: newBillingDate,
                    },
                });

                this.logger.log(`Renewed subscription ${subscription.id}`);
            } catch (error) {
                this.logger.error(`Failed to renew subscription ${subscription.id}:`, error);
                // Cancel subscription on payment failure
                await this.prisma.subscription.update({
                    where: { id: subscription.id },
                    data: { status: "CANCELLED", autoRenew: false },
                });
            }
        }

        return { renewed: subscriptionsToRenew.length };
    }
}