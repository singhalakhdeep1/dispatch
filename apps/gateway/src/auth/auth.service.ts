import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    Inject,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaClient, MemberRole } from "@orderhub/database";
import { PRISMA_TOKEN } from "../database/database.module";
import { RegisterDto, LoginDto, RegisterDriverDto, UserRole } from "@orderhub/shared";
import * as bcrypt from "bcryptjs";

@Injectable()
export class AuthService {
    constructor(
        @Inject(PRISMA_TOKEN) private readonly prisma: PrismaClient,
        private readonly jwtService: JwtService,
    ) {}

    async register(dto: RegisterDto) {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) throw new ConflictException("An account with this email already exists");

        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash,
                fullName: dto.fullName,
                phone: dto.phone,
                role: (dto.role ?? "CUSTOMER") as any,
            },
            select: { id: true, email: true, fullName: true, role: true, phone: true, createdAt: true },
        });

        const token = this.signToken(user.id, user.email, user.role as unknown as UserRole);
        return { user, token };
    }

    async registerDriver(dto: RegisterDriverDto) {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) throw new ConflictException("An account with this email already exists");

        const passwordHash = await bcrypt.hash(dto.password, 12);

        const result = await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: dto.email,
                    passwordHash,
                    fullName: dto.fullName,
                    phone: dto.phone,
                    role: "DRIVER" as any,
                },
            });

            const driver = await tx.driver.create({
                data: {
                    userId: user.id,
                    vehicleType: dto.vehicleType as any,
                    vehicleNumber: dto.vehicleNumber.toUpperCase(),
                    licenseNumber: dto.licenseNumber,
                },
            });

            return { user, driver };
        });

        const token = this.signToken(
            result.user.id,
            result.user.email,
            UserRole.DRIVER,
            result.driver.id,
        );

        return {
            user: this.sanitize(result.user),
            driverId: result.driver.id,
            token,
        };
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user) throw new UnauthorizedException("Invalid credentials");

        const valid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!valid) throw new UnauthorizedException("Invalid credentials");

        let driverId: string | undefined;
        if (user.role === "DRIVER") {
            const driver = await this.prisma.driver.findUnique({ where: { userId: user.id } });
            driverId = driver?.id;
        }

        const token = this.signToken(user.id, user.email, user.role as unknown as UserRole, driverId);
        return { user: this.sanitize(user), token, driverId };
    }

    async me(userId: string) {
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                avatarUrl: true,
                role: true,
                createdAt: true,
                driver: {
                    select: {
                        id: true,
                        vehicleType: true,
                        status: true,
                        rating: true,
                        totalTrips: true,
                        totalEarnings: true,
                    },
                },
            },
        });
        return user;
    }

    private signToken(userId: string, email: string, role: UserRole, driverId?: string) {
        return this.jwtService.sign({
            sub: userId,
            email,
            role,
            ...(driverId ? { driverId } : {}),
        });
    }

    private sanitize(user: { id: string; email: string; fullName: string; role: unknown; phone?: string | null }) {
        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            phone: user.phone,
        };
    }
}
