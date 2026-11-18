import type { AgreementResponseDto } from "./AgreementResponseDto";

export interface AgreementPaymentOrderResponseDto {
  waived: boolean;
  waiverReason?: string | undefined;
  orderId?: string | undefined;
  amount?: number | undefined; // in paise
  currency?: string | undefined;
  provider?: "razorpay" | "mock" | undefined;
  keyId?: string | undefined;
  agreement: AgreementResponseDto;
}
