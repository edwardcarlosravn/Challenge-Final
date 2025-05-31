import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Payment } from 'src/domain/payment';
import { OrderRepository } from 'src/application/contracts/persistence/order-repository.interface';
import { PaymentRepository } from 'src/application/contracts/persistence/payment.interface';
import { StripeService } from 'src/infrastructure/http/services/stripe.service';
interface ICreatePaymentUseCaseProps {
  orderId: string;
  userId: string;
}
@Injectable()
export class CreatePaymentUseCase {
  constructor(
    @Inject('OrderRepository')
    private readonly orderRepository: OrderRepository,
    @Inject('PaymentRepository')
    private readonly paymentRepository: PaymentRepository,
    private readonly stripeService: StripeService,
  ) {}

  async execute({
    orderId,
    userId,
  }: ICreatePaymentUseCaseProps): Promise<Payment> {
    const order = await this.orderRepository.getOrderOrThrow(orderId);
    if (String(order.userId) !== userId) {
      throw new ForbiddenException(
        `Access denied: Order ${orderId} does not belong to user ${userId}`,
      );
    }

    const payment = new Payment(
      randomUUID(),
      order.id,
      randomUUID(),
      Number(order.orderTotal),
      'USD',
      'PENDING',
      undefined,
      new Date(),
      new Date(),
    );

    const paymentResponse = await this.paymentRepository.createPayment(payment);
    const { amount, currency, paymentId } = paymentResponse;

    if (!paymentId) {
      throw new Error(
        `Payment creation failed: Payment ID was not generated for order ${orderId}`,
      );
    }

    await this.stripeService.createPaymentIntent({
      amount: amount,
      currency: currency,
      metadata: { paymentId: String(paymentId) },
    });

    return paymentResponse;
  }
}
