// filepath: /Users/edward/Documents/FinalChallenge/t-shirts-store/src/infrastructure/graphql/guards/gql-roles.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Role } from '../../http/enums/auth/role.enums';
import { ROLES_KEY } from '../../http/decorators/auth/roles.decorators';

@Injectable()
export class GqlRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const gqlContext = ctx.getContext<{ req: { user?: { role: Role } } }>();
    const user = gqlContext.req?.user;

    if (!user) {
      return false;
    }

    return requiredRoles.some((role) => user.role === role);
  }
}
