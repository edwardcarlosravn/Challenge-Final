import { Module } from '@nestjs/common';
import { CreatePaymentUseCase } from 'src/application/use-cases/payment/create-payment.use-case';
import { ProcessPaymentUseCase } from 'src/application/use-cases/payment/process-payment.use-case';
import { PaymentController } from './stripe/stripe.controller';
import { StripeModule } from './stripe/stripe.module';
import { PrismaModule } from 'src/infrastructure/persistence/prisma/prisma.module';
import { RedisModule } from 'src/redis/redis.module';
@Module({
  imports: [StripeModule, PrismaModule, RedisModule],
  providers: [CreatePaymentUseCase, ProcessPaymentUseCase],
  controllers: [PaymentController],
})
export class PaymentModule {}
