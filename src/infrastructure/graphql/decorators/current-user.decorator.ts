import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    const gqlContext = ctx.getContext<{
      req: { user?: Record<string, unknown> };
    }>();
    const user = gqlContext.req.user;
    if (!data) {
      return user;
    }
    return user?.[data];
  },
);
