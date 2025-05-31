// src/infrastructure/common/services/error-handler.service.ts
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class ErrorHandlerService {
  handleDatabaseError(error: unknown, context: string = ''): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const message = this.getPrismaErrorMessage(error, context);
      throw new Error(message);
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      throw new Error(`Validation error in ${context}: ${error.message}`);
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(`Unknown error in ${context}`);
  }

  private getPrismaErrorMessage(
    error: Prisma.PrismaClientKnownRequestError,
    context: string,
  ): string {
    const baseMessage = context ? `Error in ${context}: ` : '';

    switch (error.code) {
      case 'P2002':
        return `${baseMessage}Duplicate record found`;
      case 'P2003':
        return `${baseMessage}Referenced record does not exist`;
      case 'P2004':
        if (error.message.includes('quantity_positive')) {
          return `${baseMessage}Quantity must be greater than 0`;
        }
        if (error.message.includes('stock_positive')) {
          return `${baseMessage}Stock cannot be negative`;
        }
        return `${baseMessage}Constraint violation`;
      case 'P2025':
        return `${baseMessage}Record not found`;
      default:
        return `${baseMessage}Database error: ${error.message}`;
    }
  }
}
