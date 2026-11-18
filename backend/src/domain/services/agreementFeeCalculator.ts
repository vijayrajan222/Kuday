export interface AgreementPartyFeeInfo {
  id: string;
  isPremium?: boolean | undefined;
}

export interface AgreementFeeCalculation {
  required: boolean;
  payerId?: string | undefined;
  amount: number; // in INR
  amountPaise: number; // in paise for payment gateways
  isWaived: boolean;
  waiverReason?: string | undefined;
}

/**
 * Calculates the agreement fee based on host and seeker profiles.
 * Rule: Seeker pays a small agreement fee UNLESS the seeker has an active premium account.
 * A premium host does NOT cover the seeker's fee.
 * Host is free for now, but kept in one function for future modifications.
 */
export function getAgreementFee(
  _host: AgreementPartyFeeInfo,
  seeker: AgreementPartyFeeInfo
): AgreementFeeCalculation {
  const feeInr = parseInt(process.env.AGREEMENT_FEE_INR || "499", 10);

  // If seeker has active premium membership, agreement fee is waived
  if (seeker.isPremium) {
    return {
      required: false,
      payerId: seeker.id,
      amount: 0,
      amountPaise: 0,
      isWaived: true,
      waiverReason: "Fee waived for Kuday Premium member.",
    };
  }

  // Seeker pays standard fee
  return {
    required: true,
    payerId: seeker.id,
    amount: feeInr,
    amountPaise: feeInr * 100,
    isWaived: false,
  };
}
