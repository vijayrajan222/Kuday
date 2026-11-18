export interface VerifyAgreementPaymentDto {
  orderId: string;
  paymentId: string;
  signature?: string | undefined;
}
