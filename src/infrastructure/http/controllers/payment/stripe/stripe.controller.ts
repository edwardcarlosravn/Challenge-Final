import {
  Body,
  Controller,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { CreatePaymentUseCase } from 'src/application/use-cases/payment/create-payment.use-case';
import { Payment } from 'src/domain/payment';
import { ProcessPaymentUseCase } from 'src/application/use-cases/payment/process-payment.use-case';
import { Roles } from 'src/infrastructure/http/decorators/auth/roles.decorators';
import { Role } from 'src/infrastructure/http/enums/auth/role.enums';
import { CurrentUser } from '../../../decorators/auth/current-user.decorator';
import { User } from '@prisma/client';
import { CreatePaymentIntentDto } from './create-payment.dto';
import { JwtAuthGuard } from 'src/infrastructure/http/guards/auth/jwt-auth.guar';
import { RolesGuard } from 'src/infrastructure/http/guards/auth/roles/roles.guard';

@SkipThrottle()
@Controller('api/payments')
export class PaymentController {
  constructor(
    private readonly createPaymentUseCase: CreatePaymentUseCase,
    private readonly processPaymentUseCase: ProcessPaymentUseCase,
  ) {}

  @Roles(Role.CLIENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  async createPayment(
    @Body() paymentIntentDto: CreatePaymentIntentDto,
    @CurrentUser() user: User,
  ): Promise<Partial<Payment>> {
    const { paymentId, orderId, stripePaymentId, amount, currency, status } =
      await this.createPaymentUseCase.execute({
        ...paymentIntentDto,
        userId: String(user.id),
      });

    return { paymentId, orderId, stripePaymentId, amount, currency, status };
  }
  @Post('webhook')
  async stripeWebhook(
    @Req() request: RawBodyRequest<Request>,
  ): Promise<Payment> {
    const signature = request.headers['stripe-signature'] as string;

    const eventData = Buffer.isBuffer(request.body)
      ? JSON.parse(request.body.toString('utf8'))
      : request.body;

    const {
      created,
      data: {
        object: {
          metadata: { paymentId },
        },
      },
    } = eventData;

    const paymentResponse = await this.processPaymentUseCase.execute({
      paymentId,
      rawBody: Buffer.isBuffer(request.body)
        ? request.body
        : Buffer.from(JSON.stringify(eventData)),
      signature,
      paymentAt: created,
    });

    return paymentResponse;
  }
}
