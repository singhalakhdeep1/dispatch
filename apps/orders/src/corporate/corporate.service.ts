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
export class CorporateService {
    private readonly logger = new Logger(CorporateService.name);

    constructor(
        @Inject(PRISMA_TOKEN) private readonly prisma: PrismaClient,
    ) { }

    // ─── Create corporate account ─────────────────────────────────────────────────

    async createCorporateAccount(dto: {
        companyName: string;
        companyEmail: string;
        contactPerson: string;
        contactPhone: string;
        billingAddress: string;
        taxId?: string;
        creditLimit?: number;
    }) {
        // Check if company email already exists
        const existing = await this.prisma.corporateAccount.findUnique({
            where: { companyEmail: dto.companyEmail },
        });

        if (existing) {
            throw new BadRequestException("Company email already registered");
        }

        const account = await this.prisma.corporateAccount.create({
            data: {
                companyName: dto.companyName,
                companyEmail: dto.companyEmail,
                contactPerson: dto.contactPerson,
                contactPhone: dto.contactPhone,
                billingAddress: dto.billingAddress,
                taxId: dto.taxId || null,
                creditLimit: dto.creditLimit || 0,
                currentBalance: 0,
                status: "ACTIVE",
            },
        });

        return account;
    }

    // ─── Get corporate account ───────────────────────────────────────────────────

    async getCorporateAccount(id: string) {
        const account = await this.prisma.corporateAccount.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { employees: true, orders: true },
                },
            },
        });

        if (!account) throw new NotFoundException("Corporate account not found");

        return account;
    }

    // ─── Update corporate account ───────────────────────────────────────────────

    async updateCorporateAccount(id: string, dto: {
        contactPerson?: string;
        contactPhone?: string;
        billingAddress?: string;
        creditLimit?: number;
        status?: string;
    }) {
        const account = await this.prisma.corporateAccount.findUnique({
            where: { id },
        });

        if (!account) throw new NotFoundException("Corporate account not found");

        return this.prisma.corporateAccount.update({
            where: { id },
            data: dto,
        });
    }

    // ─── Get employees ───────────────────────────────────────────────────────────

    async getEmployees(accountId: string, page = 1, pageSize = 20) {
        const skip = (page - 1) * pageSize;

        const [employees, total] = await Promise.all([
            this.prisma.corporateEmployee.findMany({
                where: { corporateAccountId: accountId },
                skip,
                take: pageSize,
                orderBy: { createdAt: "desc" },
                include: {
                    user: {
                        select: { id: true, fullName: true, email: true, phone: true },
                    },
                },
            }),
            this.prisma.corporateEmployee.count({
                where: { corporateAccountId: accountId },
            }),
        ]);

        return {
            data: employees,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }

    // ─── Add employee ───────────────────────────────────────────────────────────

    async addEmployee(accountId: string, dto: {
        userId: string;
        employeeId: string;
        department?: string;
        spendingLimit?: number;
    }) {
        // Check if account exists
        const account = await this.prisma.corporateAccount.findUnique({
            where: { id: accountId },
        });

        if (!account) throw new NotFoundException("Corporate account not found");

        // Check if user exists
        const user = await this.prisma.user.findUnique({
            where: { id: dto.userId },
        });

        if (!user) throw new NotFoundException("User not found");

        // Check if employee ID is unique
        const existing = await this.prisma.corporateEmployee.findUnique({
            where: { employeeId: dto.employeeId },
        });

        if (existing) {
            throw new BadRequestException("Employee ID already exists");
        }

        const employee = await this.prisma.corporateEmployee.create({
            data: {
                corporateAccountId: accountId,
                userId: dto.userId,
                employeeId: dto.employeeId,
                department: dto.department || null,
                spendingLimit: dto.spendingLimit || 0,
                isActive: true,
            },
            include: {
                user: {
                    select: { id: true, fullName: true, email: true },
                },
            },
        });

        return employee;
    }

    // ─── Update employee ───────────────────────────────────────────────────────

    async updateEmployee(id: string, dto: {
        department?: string;
        spendingLimit?: number;
        isActive?: boolean;
    }) {
        const employee = await this.prisma.corporateEmployee.findUnique({
            where: { id },
        });

        if (!employee) throw new NotFoundException("Employee not found");

        return this.prisma.corporateEmployee.update({
            where: { id },
            data: dto,
        });
    }

    // ─── Remove employee ───────────────────────────────────────────────────────

    async removeEmployee(id: string) {
        const employee = await this.prisma.corporateEmployee.findUnique({
            where: { id },
        });

        if (!employee) throw new NotFoundException("Employee not found");

        await this.prisma.corporateEmployee.delete({
            where: { id },
        });

        return { success: true };
    }

    // ─── Get corporate orders ───────────────────────────────────────────────────

    async getCorporateOrders(accountId: string, status?: string, page = 1, pageSize = 20) {
        const skip = (page - 1) * pageSize;

        const where: any = { corporateAccountId: accountId };
        if (status) {
            where.approvalStatus = status;
        }

        const [orders, total] = await Promise.all([
            this.prisma.corporateOrder.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: "desc" },
                include: {
                    order: {
                        include: {
                            restaurant: {
                                select: { id: true, name: true },
                            },
                            user: {
                                select: { id: true, fullName: true },
                            },
                        },
                    },
                },
            }),
            this.prisma.corporateOrder.count({ where }),
        ]);

        return {
            data: orders,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }

    // ─── Approve order ───────────────────────────────────────────────────────

    async approveOrder(orderId: string, userId: string) {
        const corporateOrder = await this.prisma.corporateOrder.findUnique({
            where: { orderId },
            include: {
                corporateAccount: true,
                order: true,
            },
        });

        if (!corporateOrder) throw new NotFoundException("Corporate order not found");

        // Check if user is authorized (admin or account owner)
        // This would typically check user permissions
        // For now, we'll allow any user

        if (corporateOrder.approvalStatus !== "PENDING") {
            throw new BadRequestException("Order is not pending approval");
        }

        // Check credit limit
        const account = corporateOrder.corporateAccount;
        const orderAmount = corporateOrder.order.totalAmount;

        if (account.currentBalance + orderAmount > account.creditLimit) {
            throw new BadRequestException("Order exceeds credit limit");
        }

        // Approve order
        await this.prisma.corporateOrder.update({
            where: { id: corporateOrder.id },
            data: { approvalStatus: "APPROVED", approvedBy: userId },
        });

        // Update account balance
        await this.prisma.corporateAccount.update({
            where: { id: account.id },
            data: { currentBalance: { increment: orderAmount } },
        });

        // Update order to reflect corporate approval
        await this.prisma.order.update({
            where: { id: orderId },
            data: { corporateApproval: "APPROVED" },
        });

        return { success: true };
    }

    // ─── Reject order ───────────────────────────────────────────────────────

    async rejectOrder(orderId: string, userId: string, reason?: string) {
        const corporateOrder = await this.prisma.corporateOrder.findUnique({
            where: { orderId },
        });

        if (!corporateOrder) throw new NotFoundException("Corporate order not found");

        if (corporateOrder.approvalStatus !== "PENDING") {
            throw new BadRequestException("Order is not pending approval");
        }

        await this.prisma.corporateOrder.update({
            where: { id: corporateOrder.id },
            data: { approvalStatus: "REJECTED", approvedBy: userId },
        });

        // Update order to reflect corporate rejection
        await this.prisma.order.update({
            where: { id: orderId },
            data: { corporateApproval: "REJECTED" },
        });

        return { success: true, reason };
    }

    // ─── Get billing summary ─────────────────────────────────────────────────

    async getBillingSummary(accountId: string) {
        const account = await this.prisma.corporateAccount.findUnique({
            where: { id: accountId },
        });

        if (!account) throw new NotFoundException("Corporate account not found");

        const orders = await this.prisma.corporateOrder.findMany({
            where: {
                corporateAccountId: accountId,
                approvalStatus: "APPROVED",
            },
            include: {
                order: true,
            },
        });

        const totalSpent = orders.reduce((sum, co) => sum + co.order.totalAmount, 0);
        const pendingApproval = await this.prisma.corporateOrder.count({
            where: {
                corporateAccountId: accountId,
                approvalStatus: "PENDING",
            },
        });

        return {
            accountId: account.id,
            companyName: account.companyName,
            creditLimit: account.creditLimit,
            currentBalance: account.currentBalance,
            availableCredit: account.creditLimit - account.currentBalance,
            totalOrders: orders.length,
            totalSpent,
            pendingApproval,
            utilizationRate: account.creditLimit > 0 ? (account.currentBalance / account.creditLimit) * 100 : 0,
        };
    }

    // ─── Process corporate order (called when employee places order) ─────────────

    async processCorporateOrder(userId: string, orderId: string) {
        // Check if user is a corporate employee
        const employee = await this.prisma.corporateEmployee.findFirst({
            where: { userId, isActive: true },
            include: { corporateAccount: true },
        });

        if (!employee) {
            return { isCorporate: false };
        }

        // Check spending limit
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) throw new NotFoundException("Order not found");

        if (employee.spendingLimit > 0 && order.totalAmount > employee.spendingLimit) {
            throw new BadRequestException(`Order exceeds spending limit of ₹${employee.spendingLimit / 100}`);
        }

        // Create corporate order record
        await this.prisma.corporateOrder.create({
            data: {
                corporateAccountId: employee.corporateAccountId,
                orderId,
                approvalStatus: "PENDING",
            },
        });

        // Update order to require approval
        await this.prisma.order.update({
            where: { id: orderId },
            data: { corporateApproval: "PENDING" },
        });

        return {
            isCorporate: true,
            requiresApproval: true,
            corporateAccountId: employee.corporateAccountId,
        };
    }
}