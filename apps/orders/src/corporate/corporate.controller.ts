import { Controller, Get, Post, Patch, Delete, Body, Param, Headers, Query, DefaultValuePipe, ParseIntPipe } from "@nestjs/common";
import { CorporateService } from "./corporate.service";

@Controller("v1/corporate")
export class CorporateController {
    constructor(private readonly service: CorporateService) { }

    @Post("accounts")
    createCorporateAccount(@Body() dto: {
        companyName: string;
        companyEmail: string;
        contactPerson: string;
        contactPhone: string;
        billingAddress: string;
        taxId?: string;
        creditLimit?: number;
    }) {
        return this.service.createCorporateAccount(dto);
    }

    @Get("accounts/:id")
    getCorporateAccount(@Param("id") id: string) {
        return this.service.getCorporateAccount(id);
    }

    @Patch("accounts/:id")
    updateCorporateAccount(
        @Param("id") id: string,
        @Body() dto: {
            contactPerson?: string;
            contactPhone?: string;
            billingAddress?: string;
            creditLimit?: number;
            status?: string;
        },
    ) {
        return this.service.updateCorporateAccount(id, dto);
    }

    @Get("accounts/:id/employees")
    getEmployees(
        @Param("id") accountId: string,
        @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query("pageSize", new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    ) {
        return this.service.getEmployees(accountId, page, pageSize);
    }

    @Post("accounts/:accountId/employees")
    addEmployee(
        @Param("accountId") accountId: string,
        @Body() dto: {
            userId: string;
            employeeId: string;
            department?: string;
            spendingLimit?: number;
        },
    ) {
        return this.service.addEmployee(accountId, dto);
    }

    @Patch("employees/:id")
    updateEmployee(
        @Param("id") id: string,
        @Body() dto: {
            department?: string;
            spendingLimit?: number;
            isActive?: boolean;
        },
    ) {
        return this.service.updateEmployee(id, dto);
    }

    @Delete("employees/:id")
    removeEmployee(@Param("id") id: string) {
        return this.service.removeEmployee(id);
    }

    @Get("accounts/:id/orders")
    getCorporateOrders(
        @Param("id") accountId: string,
        @Query("status") status?: string,
        @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query("pageSize", new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    ) {
        return this.service.getCorporateOrders(accountId, status, page, pageSize);
    }

    @Post("orders/:orderId/approve")
    approveOrder(
        @Param("orderId") orderId: string,
        @Headers("x-user-id") userId: string,
    ) {
        return this.service.approveOrder(orderId, userId);
    }

    @Post("orders/:orderId/reject")
    rejectOrder(
        @Param("orderId") orderId: string,
        @Headers("x-user-id") userId: string,
        @Body() dto: { reason?: string },
    ) {
        return this.service.rejectOrder(orderId, userId, dto.reason);
    }

    @Get("accounts/:id/billing")
    getBillingSummary(@Param("id") accountId: string) {
        return this.service.getBillingSummary(accountId);
    }
}