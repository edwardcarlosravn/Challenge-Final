// src/domain/payment.ts
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';
export type CurrencyType = 'USD';

export class Payment {
  constructor(
    public readonly paymentId: string,
    public readonly orderId: string,
    public stripePaymentId: string,
    public readonly amount: number,
    public readonly currency: CurrencyType,
    public status: PaymentStatus,
    public paymentAt?: Date,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  isPaid(): boolean {
    return this.status === 'PAID';
  }

  isFailed(): boolean {
    return this.status === 'FAILED';
  }

  isPending(): boolean {
    return this.status === 'PENDING';
  }

  isProcessed(): boolean {
    return this.status === 'PAID' || this.status === 'FAILED';
  }

  markAsPaid(paymentDate?: Date): void {
    this.status = 'PAID';
    this.paymentAt = paymentDate || new Date();
  }

  markAsFailed(): void {
    this.status = 'FAILED';
    this.paymentAt = new Date();
  }

  canBeProcessed(): boolean {
    return this.status === 'PENDING' && this.amount > 0;
  }

  validateForProcessing(): void {
    if (!this.canBeProcessed()) {
      throw new Error(
        `Payment ${this.paymentId} cannot be processed: status is ${this.status} or invalid amount ${this.amount}`,
      );
    }
  }
}
