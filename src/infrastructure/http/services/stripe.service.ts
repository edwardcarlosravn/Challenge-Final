import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

interface ICreatePaymentIntentProps {
  amount: number;
  currency: 'USD';
  metadata: { paymentId: string };
}

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor() {
    const stripeApiKey = process.env.STRIPE_SECRET_KEY!;
    this.stripe = new Stripe(stripeApiKey);
  }

  async createPaymentIntent(
    props: ICreatePaymentIntentProps,
  ): Promise<Stripe.Response<Stripe.PaymentIntent>> {
    const { amount, currency, metadata } = props;
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(Number(amount) * 100),
      currency,
      metadata,
    });

    return paymentIntent;
  }

  webhookConstructEvent(body: any, sig: any, endpointSecret: any) {
    return this.stripe.webhooks.constructEvent(body, sig, endpointSecret);
  }
}
