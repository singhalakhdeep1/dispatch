import {
    Controller,
    Get,
    Post,
    Query,
    Body,
    SetMetadata,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ProxyService } from "../proxy/proxy.service";
import { IS_PUBLIC_KEY } from "../auth/guards/jwt.guard";

@ApiTags("pricing")
@Controller({ path: "pricing", version: "1" })
export class PricingController {
    constructor(private readonly proxy: ProxyService) { }

    @Post("calculate")
    @SetMetadata(IS_PUBLIC_KEY, true)
    @ApiOperation({ summary: "Calculate delivery price + surge" })
    calculate(@Body() body: unknown, @Request() req: any) {
        return this.proxy.forward("pricing", "/pricing/calculate", "POST", body, req as any);
    }

    @Get("surge")
    @SetMetadata(IS_PUBLIC_KEY, true)
    @ApiOperation({ summary: "Get current surge multiplier for a zone" })
    surge(@Query() query: any, @Request() req: any) {
        return this.proxy.forward("pricing", "/pricing/surge", "GET", null, req as any);
    }
}
