import { Payment } from 'src/domain/payment';

export interface PaymentRepository {
  createPayment(data: Payment): Promise<Payment>;
  getPayment(paymentId: string): Promise<Payment | null>;
  updatePayment(paymentId: string, data: Payment): Promise<Payment>;
  handleDBError(error: any): void;
}
