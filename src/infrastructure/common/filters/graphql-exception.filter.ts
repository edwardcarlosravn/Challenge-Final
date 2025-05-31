import { Catch } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';

@Catch()
export class GraphQLExceptionFilter implements GqlExceptionFilter {
  catch(exception: unknown): GraphQLError {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return new GraphQLError(this.getPrismaErrorMessage(exception), {
        extensions: {
          code: exception.code,
          prismaError: true,
        },
      });
    }

    if (exception instanceof Error) {
      return new GraphQLError(exception.message, {
        extensions: {
          code: 'INTERNAL_ERROR',
        },
      });
    }

    return new GraphQLError('Internal server error', {
      extensions: {
        code: 'INTERNAL_ERROR',
      },
    });
  }

  private getPrismaErrorMessage(
    error: Prisma.PrismaClientKnownRequestError,
  ): string {
    switch (error.code) {
      case 'P2002':
        return 'Duplicate record found';
      case 'P2003':
        return 'Referenced record does not exist';
      case 'P2004':
        if (error.message.includes('quantity_positive')) {
          return 'Quantity must be greater than 0';
        }
        if (error.message.includes('stock_positive')) {
          return 'Stock cannot be negative';
        }
        return 'Constraint violation';
      case 'P2025':
        return 'Record not found';
      default:
        return 'Database error';
    }
  }
}
