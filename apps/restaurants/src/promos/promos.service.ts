import {
    Injectable,
    Inject,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    Logger,
} from "@nestjs/common";
import { PrismaClient, PromoType } from "@orderhub/database";
import { PRISMA_TOKEN } from "../database/database.module";

@Injectable()
export class PromosService {
    private readonly logger = new Logger(PromosService.name);

    constructor(
        @Inject(PRISMA_TOKEN) private readonly prisma: PrismaClient,
    ) { }

    // ─── List promos for a restaurant ─────────────────────────────────────────

    async findForRestaurant(restaurantId: string, ownerId: string) {
        await this.assertOwner(restaurantId, ownerId);
        return this.prisma.promoCode.findMany({
            where: { restaurantId },
            include: { _count: { select: { usages: true } } },
            orderBy: { createdAt: "desc" },
        });
    }

    // ─── List active public promos ────────────────────────────────────────────

    async findActive(restaurantId?: string) {
        const now = new Date();
        return this.prisma.promoCode.findMany({
            where: {
                isActive: true,
                validFrom: { lte: now },
                validUntil: { gte: now },
                ...(restaurantId ? { restaurantId } : {}),
            },
            select: {
                id: true,
                code: true,
                description: true,
                type: true,
                value: true,
                minOrderAmount: true,
                maxDiscount: true,
                validUntil: true,
            },
        });
    }

    // ─── Validate + calculate discount ───────────────────────────────────────

    async validate(code: string, userId: string, orderAmount: number, restaurantId: string) {
        const promo = await this.prisma.promoCode.findUnique({ where: { code: code.toUpperCase() } });
        if (!promo) throw new NotFoundException("Promo code not found");

        const now = new Date();
        if (!promo.isActive) throw new BadRequestException("Promo code is inactive");
        if (promo.validFrom > now) throw new BadRequestException("Promo code not yet valid");
        if (promo.validUntil < now) throw new BadRequestException("Promo code has expired");
        if (promo.restaurantId && promo.restaurantId !== restaurantId) {
            throw new BadRequestException("Promo code not valid for this restaurant");
        }
        if (promo.minOrderAmount && orderAmount < promo.minOrderAmount) {
            throw new BadRequestException(`Minimum order amount is ₹${promo.minOrderAmount / 100}`);
        }

        // Check usage limit
        if (promo.usageLimit) {
            const totalUsages = await this.prisma.promoCodeUsage.count({ where: { promoCodeId: promo.id } });
            if (totalUsages >= promo.usageLimit) throw new BadRequestException("Promo code usage limit reached");
        }

        // Check per-user limit
        if (promo.perUserLimit) {
            const userUsages = await this.prisma.promoCodeUsage.count({
                where: { promoCodeId: promo.id, userId },
            });
            if (userUsages >= promo.perUserLimit) throw new BadRequestException("You have already used this promo code");
        }

        // Calculate discount (paise)
        let discount = 0;
        if (promo.type === PromoType.PERCENTAGE) {
            discount = Math.round((orderAmount * promo.value) / 100);
            if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);
        } else if (promo.type === PromoType.FLAT) {
            discount = Math.min(promo.value, orderAmount);
        } else if (promo.type === PromoType.FREE_DELIVERY) {
            discount = promo.value; // value = delivery fee override
        }

        return { promoCodeId: promo.id, discount, type: promo.type, description: promo.description };
    }

    // ─── Create promo (restaurant owner or admin) ─────────────────────────────

    async create(ownerId: string, dto: {
        restaurantId?: string;
        code: string;
        description: string;
        type: PromoType;
        value: number;
        minOrderAmount?: number;
        maxDiscount?: number;
        usageLimit?: number;
        perUserLimit?: number;
        validFrom: Date;
        validUntil: Date;
    }) {
        if (dto.restaurantId) await this.assertOwner(dto.restaurantId, ownerId);
        return this.prisma.promoCode.create({
            data: { ...dto, code: dto.code.toUpperCase() },
        });
    }

    // ─── Toggle active ────────────────────────────────────────────────────────

    async toggle(promoId: string, ownerId: string, isActive: boolean) {
        const promo = await this.prisma.promoCode.findUnique({ where: { id: promoId } });
        if (!promo) throw new NotFoundException("Promo not found");
        if (promo.restaurantId) await this.assertOwner(promo.restaurantId, ownerId);
        return this.prisma.promoCode.update({ where: { id: promoId }, data: { isActive } });
    }

    private async assertOwner(restaurantId: string, ownerId: string) {
        const r = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
        if (!r) throw new NotFoundException("Restaurant not found");
        if (r.ownerId !== ownerId) throw new ForbiddenException("Not your restaurant");
    }
}
