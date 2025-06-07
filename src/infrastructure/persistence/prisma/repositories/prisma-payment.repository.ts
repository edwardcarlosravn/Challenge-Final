import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Payment } from 'src/domain/payment';
import { Prisma, ShopOrder } from '@prisma/client';
import { PrismaPaymentMapper } from '../mappers/payment-mapper';
import { PaymentRepository } from 'src/application/contracts/persistence/payment.interface';

@Injectable()
export class PrismaPaymentRepository implements PaymentRepository {
  constructor(private prisma: PrismaService) {}

  async updatePayment(paymentId: string, data: Payment): Promise<Payment> {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const updatedPayment = await tx.payment.update({
          where: {
            paymentId,
          },
          data: {
            status: data.status,
            paymentAt: data.paymentAt,
            stripePaymentId: data.stripePaymentId,
            updatedAt: new Date(),
          },
        });

        let updatedOrder: ShopOrder | null = null;

        if (data.status === 'PAID') {
          updatedOrder = await tx.shopOrder.update({
            where: {
              id: updatedPayment.orderId,
            },
            data: {
              orderStatus: 'approved',
            },
          });
        }

        return { updatedPayment, updatedOrder };
      });

      return PrismaPaymentMapper.toDomain(result.updatedPayment);
    } catch (error) {
      this.handleDBError(error, 'UPDATE');
      throw error;
    }
  }

  async createPayment(data: Payment): Promise<Payment> {
    try {
      const createdOrder = await this.prisma.payment.create({
        data: {
          paymentId: data.paymentId,
          amount: data.amount,
          currency: data.currency,
          status: data.status,
          stripePaymentId: data.stripePaymentId,
          createdAt: data.createdAt || new Date(),
          order: {
            connect: { id: data.orderId },
          },
        },
      });

      return PrismaPaymentMapper.toDomain(createdOrder);
    } catch (error) {
      this.handleDBError(error, 'CREATE');
      throw error;
    }
  }

  async getPayment(paymentId: string): Promise<Payment | null> {
    try {
      const order = await this.prisma.payment.findUnique({
        where: {
          paymentId,
        },
      });

      if (!order) {
        return null;
      }

      return PrismaPaymentMapper.toDomain(order);
    } catch (error) {
      this.handleDBError(error, 'FIND');
      throw error;
    }
  }

  handleDBError(
    error: Prisma.PrismaClientKnownRequestError,
    action?: string,
  ): void {
    const { meta = {} } = error;
    meta.action = action;

    throw error;
  }
}
