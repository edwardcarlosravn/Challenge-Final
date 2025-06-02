import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Payment } from 'src/domain/payment';
import Stripe from 'stripe';
import { PaymentRepository } from 'src/application/contracts/persistence/payment.interface';
import { StripeService } from 'src/infrastructure/http/services/stripe.service';
import { OrderRepository } from 'src/application/contracts/persistence/order-repository.interface';
import { RedisStockAlert } from 'src/redis/redis-stock-alert.service';

interface IProcessPaymentUseCaseProps {
  paymentId: string;
  rawBody: any;
  signature: string;
  paymentAt: number;
}

@Injectable()
export class ProcessPaymentUseCase {
  constructor(
    @Inject('PaymentRepository')
    private readonly paymentRepository: PaymentRepository,
    private readonly stripeService: StripeService,
    @Inject('OrderRepository')
    private readonly orderRepository: OrderRepository,
    private readonly redisStockAlert: RedisStockAlert,
  ) {}

  async execute({
    paymentId,
    rawBody,
    signature,
    paymentAt,
  }: IProcessPaymentUseCaseProps): Promise<Payment> {
    const payment = await this.paymentRepository.getPayment(paymentId);

    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    const order = await this.orderRepository.getOrder(payment.orderId);

    if (order && order.orderStatus !== 'PENDING') {
      throw new BadRequestException('This order has already been paid');
    }

    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event: Stripe.Event;

    try {
      event = this.stripeService.webhookConstructEvent(
        rawBody,
        signature,
        endpointSecret,
      );
    } catch (error) {
      throw new BadRequestException(`Webhook Error ${error}`);
    }

    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    payment.stripePaymentId = paymentIntent.id;

    switch (event.type) {
      case 'payment_intent.succeeded':
        payment.status = 'PAID';
        payment.paymentAt = new Date(paymentAt * 1000);

        // ✅ AQUÍ: Verificar stock bajo después de pago exitoso
        await this.checkLowStockForOrder(order);
        break;

      case 'payment_intent.payment_failed':
        payment.status = 'FAILED';
        break;

      default:
        throw new BadRequestException(`Unhandled event type: ${event.type}`);
    }

    const updatedPayment = await this.paymentRepository.updatePayment(
      paymentId,
      payment,
    );

    return updatedPayment;
  }

  // ✅ Método privado para verificar stock bajo
  private async checkLowStockForOrder(order: any): Promise<void> {
    try {
      console.log(
        '🔍 Verificando stock bajo después de pago exitoso para orden:',
        order.id,
      );

      // Obtener todos los ProductItems de la orden
      const productItemIds =
        order.orderLines?.map((line: any) => line.productItemId) || [];

      console.log('📦 ProductItems a verificar:', productItemIds);

      // Verificar stock bajo para cada producto de la orden
      const stockCheckPromises = productItemIds.map(
        async (productItemId: number) => {
          try {
            await this.redisStockAlert.checkStockAndNotify(productItemId);
          } catch (error) {
            console.error(
              `❌ Error verificando stock para ProductItem ${productItemId}:`,
              error.message,
            );
            // No lanzar error para que no afecte el procesamiento del pago
          }
        },
      );

      await Promise.allSettled(stockCheckPromises);
      console.log('✅ Verificación de stock bajo completada');
    } catch (error) {
      console.error(
        '❌ Error general en verificación de stock bajo:',
        error.message,
      );
      // No lanzar error para que no afecte el procesamiento del pago
    }
  }
}
