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
export class LoyaltyService {
    private readonly logger = new Logger(LoyaltyService.name);

    constructor(
        @Inject(PRISMA_TOKEN) private readonly prisma: PrismaClient,
    ) { }

    // ─── Get user's loyalty points ─────────────────────────────────────────────────

    async getUserPoints(userId: string) {
        // Get or create default loyalty program enrollment
        let userPoints = await this.prisma.userLoyaltyPoints.findFirst({
            where: { userId },
            include: { program: true },
        });

        if (!userPoints) {
            // Get or create default program
            let program = await this.prisma.loyaltyProgram.findFirst({
                where: { isActive: true },
            });

            if (!program) {
                program = await this.prisma.loyaltyProgram.create({
                    data: {
                        name: "Default Rewards",
                        description: "Earn points on every order",
                        pointsPerRupee: 1,
                        redemptionRate: 100,
                        isActive: true,
                    },
                });
            }

            userPoints = await this.prisma.userLoyaltyPoints.create({
                data: {
                    userId,
                    programId: program.id,
                    tier: "BRONZE",
                },
                include: { program: true },
            });
        }

        return {
            pointsBalance: userPoints.pointsBalance,
            totalEarned: userPoints.totalEarned,
            totalRedeemed: userPoints.totalRedeemed,
            tier: userPoints.tier,
            program: userPoints.program,
            pointsToNextTier: this.calculatePointsToNextTier(userPoints.tier, userPoints.totalEarned),
        };
    }

    // ─── Get available rewards ─────────────────────────────────────────────────────

    async getAvailableRewards(programId?: string, page = 1, pageSize = 20) {
        const skip = (page - 1) * pageSize;
        
        const where: any = { isActive: true };
        if (programId) {
            where.programId = programId;
        }

        const [rewards, total] = await Promise.all([
            this.prisma.reward.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { pointsRequired: "asc" },
                include: { program: true },
            }),
            this.prisma.reward.count({ where }),
        ]);

        return {
            data: rewards,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }

    // ─── Redeem reward ───────────────────────────────────────────────────────────

    async redeemReward(rewardId: string, userId: string, orderId?: string) {
        const reward = await this.prisma.reward.findUnique({
            where: { id: rewardId },
            include: { program: true },
        });

        if (!reward) throw new NotFoundException("Reward not found");
        if (!reward.isActive) throw new BadRequestException("Reward is not available");

        // Check user's points
        const userPoints = await this.getUserPoints(userId);
        if (userPoints.pointsBalance < reward.pointsRequired) {
            throw new BadRequestException("Insufficient points");
        }

        // Deduct points
        await this.prisma.userLoyaltyPoints.update({
            where: { id: (await this.prisma.userLoyaltyPoints.findFirst({ where: { userId } }))!.id },
            data: {
                pointsBalance: { decrement: reward.pointsRequired },
                totalRedeemed: { increment: reward.pointsRequired },
            },
        });

        // Create redemption record
        const redemption = await this.prisma.rewardRedemption.create({
            data: {
                rewardId,
                userId,
                orderId: orderId || null,
                pointsUsed: reward.pointsRequired,
            },
        });

        return {
            success: true,
            pointsDeducted: reward.pointsRequired,
            remainingPoints: userPoints.pointsBalance - reward.pointsRequired,
            redemption,
        };
    }

    // ─── Get redemption history ───────────────────────────────────────────────────

    async getRedemptionHistory(userId: string, page = 1, pageSize = 20) {
        const skip = (page - 1) * pageSize;

        const [redemptions, total] = await Promise.all([
            this.prisma.rewardRedemption.findMany({
                where: { userId },
                skip,
                take: pageSize,
                orderBy: { createdAt: "desc" },
                include: {
                    reward: {
                        include: { program: true },
                    },
                },
            }),
            this.prisma.rewardRedemption.count({ where: { userId } }),
        ]);

        return {
            data: redemptions,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }

    // ─── Get user's tier ─────────────────────────────────────────────────────────

    async getUserTier(userId: string) {
        const userPoints = await this.getUserPoints(userId);
        
        const tierBenefits = {
            BRONZE: { pointsMultiplier: 1, freeDeliveryThreshold: 50000 },
            SILVER: { pointsMultiplier: 1.25, freeDeliveryThreshold: 40000 },
            GOLD: { pointsMultiplier: 1.5, freeDeliveryThreshold: 30000 },
            PLATINUM: { pointsMultiplier: 2, freeDeliveryThreshold: 0 },
        };

        return {
            currentTier: userPoints.tier,
            benefits: tierBenefits[userPoints.tier as keyof typeof tierBenefits],
            nextTier: this.getNextTier(userPoints.tier),
            totalEarned: userPoints.totalEarned,
        };
    }

    // ─── Get loyalty programs ─────────────────────────────────────────────────────

    async getLoyaltyPrograms() {
        return this.prisma.loyaltyProgram.findMany({
            where: { isActive: true },
            include: {
                _count: {
                    select: { userPoints: true, rewards: true },
                },
            },
        });
    }

    // ─── Add points from order (called after order completion) ─────────────────────

    async addPointsFromOrder(userId: string, orderAmount: number, orderId: string) {
        const userPoints = await this.getUserPoints(userId);
        const program = userPoints.program;

        // Calculate points earned
        const basePoints = Math.floor(orderAmount / 100 * program.pointsPerRupee);
        const tierMultiplier = this.getTierMultiplier(userPoints.tier);
        const pointsEarned = Math.floor(basePoints * tierMultiplier);

        // Check max points per order
        const pointsToAdd = program.maxPointsPerOrder 
            ? Math.min(pointsEarned, program.maxPointsPerOrder)
            : pointsEarned;

        // Update user points
        await this.prisma.userLoyaltyPoints.update({
            where: { id: (await this.prisma.userLoyaltyPoints.findFirst({ where: { userId } }))!.id },
            data: {
                pointsBalance: { increment: pointsToAdd },
                totalEarned: { increment: pointsToAdd },
            },
        });

        // Check for tier upgrade
        await this.checkTierUpgrade(userId, userPoints.totalEarned + pointsToAdd);

        return {
            pointsEarned: pointsToAdd,
            newBalance: userPoints.pointsBalance + pointsToAdd,
            tier: userPoints.tier,
        };
    }

    // ─── Private helpers ─────────────────────────────────────────────────────────

    private calculatePointsToNextTier(currentTier: string, totalEarned: number): number {
        const tierThresholds: Record<string, number> = {
            BRONZE: 0,
            SILVER: 1000,
            GOLD: 5000,
            PLATINUM: 10000,
        };

        const nextTier = this.getNextTier(currentTier);
        if (!nextTier) return 0;

        return tierThresholds[nextTier] - totalEarned;
    }

    private getNextTier(currentTier: string): string | null {
        const tiers = ["BRONZE", "SILVER", "GOLD", "PLATINUM"];
        const currentIndex = tiers.indexOf(currentTier);
        return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
    }

    private getTierMultiplier(tier: string): number {
        const multipliers: Record<string, number> = {
            BRONZE: 1,
            SILVER: 1.25,
            GOLD: 1.5,
            PLATINUM: 2,
        };
        return multipliers[tier] || 1;
    }

    private async checkTierUpgrade(userId: string, totalEarned: number) {
        const tierThresholds: Record<string, number> = {
            BRONZE: 0,
            SILVER: 1000,
            GOLD: 5000,
            PLATINUM: 10000,
        };

        let newTier = "BRONZE";
        for (const [tier, threshold] of Object.entries(tierThresholds)) {
            if (totalEarned >= threshold) {
                newTier = tier;
            }
        }

        const userPoints = await this.prisma.userLoyaltyPoints.findFirst({ where: { userId } });
        if (userPoints && userPoints.tier !== newTier) {
            await this.prisma.userLoyaltyPoints.update({
                where: { id: userPoints.id },
                data: { tier: newTier },
            });
            this.logger.log(`User ${userId} upgraded to ${newTier} tier`);
        }
    }
}