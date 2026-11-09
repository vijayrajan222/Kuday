import { api } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type {
  Plan,
  CreateOrderResponse,
  VerifyPaymentRequest,
  ActiveSubscriptionResponse,
  WalletResponse,
  Subscription,
} from '@/types/payment.types';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

/**
 * Dynamically loads Razorpay checkout.js script into the document head.
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export const paymentService = {
  async getPlans(): Promise<Plan[]> {
    const res = await api.get(API_ENDPOINTS.PAYMENT.PLANS);
    return res.data.data || [];
  },

  async getConfig(): Promise<{ keyId: string }> {
    const res = await api.get(API_ENDPOINTS.PAYMENT.CONFIG);
    return res.data.data;
  },

  async createOrder(planId: string, idempotencyKey?: string): Promise<CreateOrderResponse> {
    const res = await api.post(API_ENDPOINTS.PAYMENT.CREATE_ORDER, {
      planId,
      idempotencyKey,
    });
    return res.data.data;
  },

  async verifyPayment(payload: VerifyPaymentRequest): Promise<{
    success: boolean;
    orderId: string;
    paymentId: string;
    status: string;
    subscription?: Subscription;
  }> {
    const res = await api.post(API_ENDPOINTS.PAYMENT.VERIFY, payload);
    return res.data.data;
  },

  async getActiveSubscription(): Promise<ActiveSubscriptionResponse> {
    const res = await api.get(API_ENDPOINTS.PAYMENT.ACTIVE_SUBSCRIPTION);
    return res.data.data;
  },

  async cancelSubscription(
    subscriptionId: string,
    cancellationReason?: string
  ): Promise<{
    subscription: Subscription;
    refundAmount: number;
    isFullRefund: boolean;
    refundStatus: string;
  }> {
    const res = await api.post(
      API_ENDPOINTS.PAYMENT.CANCEL_SUBSCRIPTION(subscriptionId),
      { cancellationReason }
    );
    return res.data.data;
  },

  async retryRefund(subscriptionId: string): Promise<Subscription> {
    const res = await api.post(API_ENDPOINTS.PAYMENT.RETRY_REFUND(subscriptionId));
    return res.data.data;
  },

  async getWallet(limit = 20, skip = 0): Promise<WalletResponse> {
    const res = await api.get(`${API_ENDPOINTS.PAYMENT.WALLET}?limit=${limit}&skip=${skip}`);
    return res.data.data;
  },
};
