import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@orderhub/shared";
import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = "roles";
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!required?.length) return true;

        const { user } = context.switchToHttp().getRequest<{ user?: { role?: string } }>();
        if (!user?.role) throw new ForbiddenException("No role assigned");

        if (!required.includes(user.role as UserRole)) {
            throw new ForbiddenException(`Requires one of: ${required.join(", ")}`);
        }

        return true;
    }
}
