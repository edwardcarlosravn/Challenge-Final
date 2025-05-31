import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../../enums/auth/role.enums';
import { ROLES_KEY } from '../../../decorators/auth/roles.decorators';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context
      .switchToHttp()
      .getRequest<{ user: { role: Role } }>();
    const user = request.user;
    const hasRequiredRoles = requiredRoles.some((role) => user.role === role);
    return hasRequiredRoles;
  }
}
