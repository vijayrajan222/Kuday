export interface AgreementPartyFeeInfo {
  id: string;
  isPremium?: boolean | undefined;
  premiumExpiresAt?: Date | string | undefined;
  hasActiveSubscription?: boolean | undefined;
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
 * Rule: The seeker pays AGREEMENT_FEE_INR unless the seeker has an active subscription,
 * in which case fee = 0 and the payment step is skipped.
 * Check subscription active + not expired using existing subscription/premium fields.
 * Host is not charged.
 */
export function getAgreementFee(
  _host: AgreementPartyFeeInfo,
  seeker: AgreementPartyFeeInfo
): AgreementFeeCalculation {
  const feeInr = parseInt(process.env.AGREEMENT_FEE_INR || "250", 10);

  // Check if seeker has an active, unexpired subscription or premium status
  const isSubscriber = Boolean(
    seeker.hasActiveSubscription ||
      (seeker.isPremium &&
        (!seeker.premiumExpiresAt || new Date(seeker.premiumExpiresAt).getTime() > Date.now()))
  );

  if (isSubscriber) {
    return {
      required: false,
      payerId: seeker.id,
      amount: 0,
      amountPaise: 0,
      isWaived: true,
      waiverReason: "Fee waived for Kuday subscriber (active subscription).",
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
