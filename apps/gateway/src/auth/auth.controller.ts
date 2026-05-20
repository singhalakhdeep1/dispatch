import {
    Controller,
    Post,
    Get,
    Body,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
    Version,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt.guard";
import { RegisterSchema, LoginSchema, RegisterDriverSchema } from "@orderhub/shared";
import { ZodValidationPipe } from "../common/zod-validation.pipe";

@ApiTags("auth")
@Controller({ path: "auth", version: "1" })
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post("register")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Register a new customer account" })
    async register(@Body(new ZodValidationPipe(RegisterSchema)) dto: any) {
        return this.authService.register(dto);
    }

    @Post("register/driver")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Register a new driver account" })
    async registerDriver(@Body(new ZodValidationPipe(RegisterDriverSchema)) dto: any) {
        return this.authService.registerDriver(dto);
    }

    @Post("login")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Login and receive JWT" })
    async login(@Body(new ZodValidationPipe(LoginSchema)) dto: any) {
        return this.authService.login(dto);
    }

    @Get("me")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: "Get current user profile" })
    async me(@Request() req: { user: { sub: string } }) {
        return this.authService.me(req.user.sub);
    }
}
