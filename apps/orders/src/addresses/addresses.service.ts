import { Injectable, Inject, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaClient } from "@orderhub/database";
import { PRISMA_TOKEN } from "../database/database.module";

@Injectable()
export class AddressesService {
    constructor(
        @Inject(PRISMA_TOKEN) private readonly prisma: PrismaClient,
    ) { }

    async findAll(userId: string) {
        return this.prisma.address.findMany({
            where: { userId },
            orderBy: { isDefault: "desc" },
        });
    }

    async create(userId: string, dto: {
        label: string;
        fullAddress: string;
        city: string;
        state: string;
        pincode: string;
        latitude: number;
        longitude: number;
        isDefault?: boolean;
    }) {
        if (dto.isDefault) {
            await this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
        }
        return this.prisma.address.create({ data: { ...dto, userId } });
    }

    async update(id: string, userId: string, dto: Partial<{
        label: string;
        fullAddress: string;
        city: string;
        state: string;
        pincode: string;
        latitude: number;
        longitude: number;
        isDefault: boolean;
    }>) {
        await this.assertOwner(id, userId);
        if (dto.isDefault) {
            await this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
        }
        return this.prisma.address.update({ where: { id }, data: dto });
    }

    async remove(id: string, userId: string) {
        await this.assertOwner(id, userId);
        await this.prisma.address.delete({ where: { id } });
    }

    private async assertOwner(id: string, userId: string) {
        const address = await this.prisma.address.findUnique({ where: { id } });
        if (!address) throw new NotFoundException("Address not found");
        if (address.userId !== userId) throw new ForbiddenException("Not your address");
        return address;
    }
}
