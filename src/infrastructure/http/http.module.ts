import { Module } from '@nestjs/common';
import { AuthModule } from './controllers/auth/auth.module';
import { UsersModule } from './controllers/users/users.module';
import { EmailModule } from './controllers/mails/mails.module';
import { OtpModule } from './controllers/opt/opt.module';
import { StripeModule } from './controllers/payment/stripe/stripe.module';
import { PaymentModule } from './controllers/payment/payment.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    EmailModule,
    OtpModule,
    StripeModule,
    PaymentModule,
  ],
  exports: [
    AuthModule,
    UsersModule,
    EmailModule,
    OtpModule,
    StripeModule,
    PaymentModule,
  ],
})
export class HttpModule {}
