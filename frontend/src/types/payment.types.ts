export interface Plan {
  id: string;
  name: string;
  price: number; // Integer in paise
  durationDays: number;
  description?: string;
  features?: string[];
  isActive?: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'pending' | 'active' | 'cancelled' | 'expired';
  startDate?: string;
  endDate?: string;
  paymentId?: string;
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
  reason: 'topup' | 'premium_purchase' | 'refund';
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
