import { Prisma, Payment as PrismaPayment } from '@prisma/client';
import { Payment } from 'src/domain/payment';

export class PrismaPaymentMapper {
  static toDomain(entity: PrismaPayment): Payment {
    return new Payment(
      entity.paymentId,
      entity.orderId,
      entity.stripePaymentId,
      entity.amount.toNumber(),
      entity.currency as 'USD',
      entity.status as 'PENDING' | 'PAID' | 'FAILED',
      entity.paymentAt || undefined,
      entity.createdAt || undefined,
      entity.updatedAt || undefined,
    );
  }

  static toPrisma(domain: Payment): Prisma.PaymentUncheckedCreateInput {
    return {
      paymentId: domain.paymentId,
      orderId: domain.orderId,
      stripePaymentId: domain.stripePaymentId,
      amount: domain.amount,
      currency: domain.currency,
      status: domain.status,
      paymentAt: domain.paymentAt,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
