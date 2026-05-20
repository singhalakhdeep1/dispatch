import { Controller, Get, Post, Patch, Delete, Body, Param, Headers, HttpCode, HttpStatus } from "@nestjs/common";
import { AddressesService } from "./addresses.service";
import { CreateAddressSchema, UpdateAddressSchema } from "@orderhub/shared";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { z } from "zod";

@Controller("v1/addresses")
export class AddressesController {
    constructor(private readonly service: AddressesService) { }

    @Get()
    findAll(@Headers("x-user-id") userId: string) {
        return this.service.findAll(userId);
    }

    @Post()
    create(
        @Headers("x-user-id") userId: string,
        @Body(new ZodValidationPipe(CreateAddressSchema)) dto: z.infer<typeof CreateAddressSchema>,
    ) {
        return this.service.create(userId, dto);
    }

    @Patch(":id")
    update(
        @Param("id") id: string,
        @Headers("x-user-id") userId: string,
        @Body(new ZodValidationPipe(UpdateAddressSchema)) dto: z.infer<typeof UpdateAddressSchema>,
    ) {
        return this.service.update(id, userId, dto);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param("id") id: string, @Headers("x-user-id") userId: string) {
        return this.service.remove(id, userId);
    }
}
