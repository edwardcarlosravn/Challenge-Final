import { Module } from '@nestjs/common';
import { StripeService } from 'src/infrastructure/http/services/stripe.service';

@Module({
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
