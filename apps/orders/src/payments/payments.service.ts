import {
    Injectable,
    Inject,
    NotFoundException,
    BadRequestException,
    Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClient, PaymentStatus, PaymentMethod, OrderStatus } from "@orderhub/database";
import { PRISMA_TOKEN } from "../database/database.module";
import { KafkaService } from "../kafka/kafka.service";
import { KafkaTopic } from "@orderhub/shared";
import * as crypto from "crypto";
import Razorpay from "razorpay";

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);
    private readonly razorpay: Razorpay;

    constructor(
        @Inject(PRISMA_TOKEN) private readonly prisma: PrismaClient,
        private readonly config: ConfigService,
        private readonly kafka: KafkaService,
    ) {
        this.razorpay = new Razorpay({
            key_id: config.get<string>("app.razorpay.keyId")!,
            key_secret: config.get<string>("app.razorpay.keySecret")!,
        });
    }

    // ─── Initiate payment ─────────────────────────────────────────────────────

    async initiate(orderId: string, userId: string, method: PaymentMethod) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order) throw new NotFoundException("Order not found");
        if (order.userId !== userId) throw new BadRequestException("Not your order");

        // For COD — no Razorpay needed
        if (method === PaymentMethod.CASH_ON_DELIVERY) {
            const payment = await this.prisma.payment.create({
                data: {
                    orderId,
                    userId,
                    amount: order.totalAmount,
                    method: PaymentMethod.CASH_ON_DELIVERY,
                    status: PaymentStatus.PENDING,
                },
            });
            return { method: "COD", paymentId: payment.id };
        }

        // Create Razorpay order
        const rzpOrder = await this.razorpay.orders.create({
            amount: order.totalAmount, // already in paise
            currency: "INR",
            receipt: orderId,
            notes: { orderId, userId },
        });

        const payment = await this.prisma.payment.upsert({
            where: { orderId },
            create: {
                orderId,
                userId,
                amount: order.totalAmount,
                method,
                status: PaymentStatus.PENDING,
                razorpayOrderId: rzpOrder.id,
            },
            update: {
                method,
                razorpayOrderId: rzpOrder.id,
                status: PaymentStatus.PENDING,
            },
        });

        return {
            razorpayOrderId: rzpOrder.id,
            amount: order.totalAmount,
            currency: "INR",
            paymentId: payment.id,
            keyId: this.config.get<string>("app.razorpay.keyId"),
        };
    }

    // ─── Verify payment ───────────────────────────────────────────────────────

    async verify(dto: {
        razorpayOrderId: string;
        razorpayPaymentId: string;
        razorpaySignature: string;
    }) {
        const expectedSignature = crypto
            .createHmac("sha256", this.config.get<string>("app.razorpay.keySecret")!)
            .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
            .digest("hex");

        if (expectedSignature !== dto.razorpaySignature) {
            throw new BadRequestException("Payment signature verification failed");
        }

        const payment = await this.prisma.payment.findUnique({
            where: { razorpayOrderId: dto.razorpayOrderId },
        });
        if (!payment) throw new NotFoundException("Payment record not found");

        const updated = await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
                razorpayPaymentId: dto.razorpayPaymentId,
                razorpaySignature: dto.razorpaySignature,
                status: PaymentStatus.PAID,
                paidAt: new Date(),
            },
        });

        await this.kafka.emit(KafkaTopic.PAYMENT_SUCCESS, {
            orderId: payment.orderId,
            userId: payment.userId,
            amount: payment.amount,
            razorpayPaymentId: dto.razorpayPaymentId,
        });

        this.logger.log(`Payment verified for order ${payment.orderId}`);
        return updated;
    }

    // ─── Razorpay webhook ─────────────────────────────────────────────────────

    async handleWebhook(body: string, signature: string) {
        const webhookSecret = this.config.get<string>("app.razorpay.webhookSecret")!;
        const expectedSig = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex");

        if (expectedSig !== signature) {
            throw new BadRequestException("Webhook signature mismatch");
        }

        const event = JSON.parse(body);
        this.logger.log(`Razorpay webhook: ${event.event}`);

        if (event.event === "payment.failed") {
            const rzpOrderId = event.payload?.payment?.entity?.order_id;
            if (rzpOrderId) {
                const payment = await this.prisma.payment.findUnique({ where: { razorpayOrderId: rzpOrderId } });
                if (payment) {
                    await this.prisma.payment.update({
                        where: { id: payment.id },
                        data: { status: PaymentStatus.FAILED, failureReason: event.payload?.payment?.entity?.error_description },
                    });
                    await this.kafka.emit(KafkaTopic.PAYMENT_FAILED, {
                        orderId: payment.orderId,
                        userId: payment.userId,
                        reason: event.payload?.payment?.entity?.error_description,
                    });
                }
            }
        }

        return { received: true };
    }

    // ─── Refund ───────────────────────────────────────────────────────────────

    async refund(orderId: string, reason?: string) {
        const payment = await this.prisma.payment.findUnique({ where: { orderId } });
        if (!payment) throw new NotFoundException("No payment found for this order");
        if (payment.status !== PaymentStatus.PAID) throw new BadRequestException("Payment is not in PAID state");

        let refundId: string | undefined;

        if (payment.razorpayPaymentId) {
            const rzpRefund = await this.razorpay.payments.refund(payment.razorpayPaymentId, {
                amount: payment.amount,
                notes: { reason: reason ?? "Order cancelled" },
            });
            refundId = rzpRefund.id;
        }

        const updated = await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: PaymentStatus.REFUNDED,
                refundId,
                refundAmount: payment.amount,
                refundedAt: new Date(),
            },
        });

        await this.kafka.emit(KafkaTopic.PAYMENT_REFUNDED, {
            orderId,
            userId: payment.userId,
            amount: payment.amount,
            refundId,
        });

        this.logger.log(`Refund processed for order ${orderId}`);
        return updated;
    }

    // ─── Wallet ───────────────────────────────────────────────────────────────

    async getWallet(userId: string) {
        return this.prisma.wallet.upsert({
            where: { userId },
            create: { userId, balance: 0 },
            update: {},
            include: {
                transactions: {
                    take: 20,
                    orderBy: { createdAt: "desc" },
                },
            },
        });
    }

    async creditWallet(userId: string, amount: number, description: string, orderId?: string) {
        const wallet = await this.prisma.wallet.upsert({
            where: { userId },
            create: { userId, balance: 0 },
            update: {},
        });

        const newBalance = wallet.balance + amount;

        await this.prisma.$transaction([
            this.prisma.wallet.update({
                where: { userId },
                data: { balance: { increment: amount } },
            }),
            this.prisma.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: "CREDIT",
                    amount,
                    description,
                    orderId,
                    balanceAfter: newBalance,
                },
            }),
        ]);

        return { balance: newBalance };
    }

    async debitWallet(userId: string, amount: number, description: string, orderId?: string) {
        const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        if (!wallet || wallet.balance < amount) throw new BadRequestException("Insufficient wallet balance");

        const newBalance = wallet.balance - amount;

        await this.prisma.$transaction([
            this.prisma.wallet.update({ where: { userId }, data: { balance: { decrement: amount } } }),
            this.prisma.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: "DEBIT",
                    amount,
                    description,
                    orderId,
                    balanceAfter: newBalance,
                },
            }),
        ]);

        return { balance: newBalance };
    }
}
