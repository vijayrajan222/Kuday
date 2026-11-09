export interface Plan {
  id: string;
  name: string;
  price: number; // Integer in paise
  durationDays: number;
  audience?: 'host' | string;
  description?: string;
  features?: string[];
  isActive?: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'pending' | 'active' | 'cancelled' | 'refunded' | 'expired';
  startDate?: string;
  endDate?: string;
  purchasedAt?: string;
  paymentId?: string;
  benefitsUsedAt?: string | null;
  cancelledAt?: string;
  refundAmount?: number;
  refundStatus?: 'none' | 'pending' | 'completed' | 'failed';
}

export interface ActiveSubscriptionResponse {
  subscription: Subscription | null;
  plan: {
    id: string;
    name: string;
    price: number;
    durationDays: number;
  } | null;
  remainingDays: number;
  estimatedRefund: number; // in paise
  isFullRefundEligible: boolean;
  isRefundEligible?: boolean;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number; // in paise
  currency: string;
  keyId: string;
  plan: {
    id: string;
    name: string;
    price: number;
    durationDays: number;
  };
}

export interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number; // in paise
  balanceAfter: number; // in paise
  reason: 'topup' | 'premium_purchase' | 'premium_refund' | 'refund';
  referenceId?: string;
  description?: string;
  createdAt: string;
}

export interface WalletResponse {
  wallet: {
    id: string;
    userId: string;
    balance: number;
    version: number;
  };
  balancePaise: number;
  balanceRupees: number;
  transactions: WalletTransaction[];
  totalTransactions: number;
  isBalanced: boolean;
}
