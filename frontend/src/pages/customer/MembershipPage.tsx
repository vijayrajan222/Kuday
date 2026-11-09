import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  Check,
  ShieldCheck,
  Calendar,
  Wallet,
  ArrowRight,
  Loader2,
  X,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/useToast';
import { ROUTES } from '@/constants/routes';
import { paymentService, loadRazorpayScript } from '@/services/paymentService';
import type { Plan, ActiveSubscriptionResponse } from '@/types/payment.types';

export default function MembershipPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeSubData, setActiveSubData] = useState<ActiveSubscriptionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  // Cancellation modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Load plans & active subscription
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [fetchedPlans, fetchedSub] = await Promise.all([
        paymentService.getPlans(),
        paymentService.getActiveSubscription().catch(() => null),
      ]);
      setPlans(fetchedPlans);
      setActiveSubData(fetchedSub);
    } catch {
      toast.error('Failed to load membership plans.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Initiate Razorpay Checkout Flow
  const handleSubscribe = async (plan: Plan) => {
    if (!user) {
      toast.error('Please sign in to subscribe.');
      navigate(ROUTES.LOGIN);
      return;
    }

    if (activeSubData?.subscription && activeSubData.subscription.status === 'active') {
      toast.info('You already have an active premium membership.');
      return;
    }

    try {
      setProcessingPlanId(plan.id);
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        toast.error('Razorpay SDK failed to load. Check your internet connection.');
        setProcessingPlanId(null);
        return;
      }

      // 1. Create server-side order with plan price
      const orderData = await paymentService.createOrder(plan.id);

      // 2. Open Razorpay Checkout modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount, // in paise
        currency: orderData.currency || 'INR',
        name: 'Kuday Premium',
        description: `${plan.name} Membership`,
        order_id: orderData.orderId,
        prefill: {
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email: user.email,
        },
        theme: {
          color: '#000000',
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            toast.info('Verifying payment signature with bank...');
            await paymentService.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            toast.success('Membership activated! Welcome to Kuday Premium 🎉');
            await loadData();
          } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message || 'Payment verification failed.');
          } finally {
            setProcessingPlanId(null);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessingPlanId(null);
            toast.info('Payment checkout closed. You can resume anytime.');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (failedRes: any) => {
        setProcessingPlanId(null);
        toast.error(failedRes.error?.description || 'Payment failed on Razorpay.');
      });
      rzp.open();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to start payment order.');
      setProcessingPlanId(null);
    }
  };

  // Handle Cancellation & Prorated Refund
  const handleConfirmCancel = async () => {
    if (!activeSubData?.subscription?.id) return;
    try {
      setIsCancelling(true);
      const res = await paymentService.cancelSubscription(
        activeSubData.subscription.id,
        cancelReason.trim()
      );

      const refundRupees = (res.refundAmount / 100).toFixed(2);
      toast.success(
        res.isFullRefund
          ? `Subscription cancelled. Full refund of ₹${refundRupees} credited to your wallet!`
          : `Subscription cancelled. Prorated refund of ₹${refundRupees} credited to your wallet!`
      );

      setShowCancelModal(false);
      setCancelReason('');
      await loadData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to cancel subscription.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const activeSub = activeSubData?.subscription;
  const isSubscribed = Boolean(activeSub && activeSub.status === 'active');

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold tracking-wide">
          <Crown className="h-3.5 w-3.5 text-amber-600 fill-amber-500" />
          <span>KUDAY PREMIUM MEMBERSHIP</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Find Your Perfect Match Faster
        </h1>
        <p className="text-sm text-slate-500">
          Unlock verified VIP status, schedule direct property visits, revealed contact information, and flexible refunds.
        </p>
      </div>

      {/* Active Subscription Banner (If Subscribed) */}
      {isSubscribed && activeSub && (
        <div className="rounded-3xl border-2 border-black bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Crown className="h-48 w-48 text-white" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="h-3 w-3" />
                <span>Active VIP Membership</span>
              </div>
              <h2 className="text-2xl font-black">
                {activeSubData?.plan?.name || 'Premium Plan'}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>
                    Valid until:{' '}
                    <strong>
                      {activeSub.endDate ? new Date(activeSub.endDate).toLocaleDateString() : 'N/A'}
                    </strong>
                  </span>
                </span>
                <span className="bg-white/10 px-2 py-0.5 rounded-md font-semibold text-white">
                  {activeSubData?.remainingDays || 0} days remaining
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(ROUTES.WALLET)}
                className="px-4 py-2.5 rounded-xl border border-white/20 hover:bg-white/10 text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Wallet className="h-4 w-4" />
                <span>My Wallet</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-rose-500/20 border border-white/10 hover:border-rose-400 text-slate-200 hover:text-rose-200 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel Membership
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isSubscribed ? 'All Available Plans' : 'Choose Your Plan'}
            </h2>
            <p className="text-xs text-slate-500">
              Safe test mode transactions via Razorpay. Cancel anytime with instant wallet refunds.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(ROUTES.WALLET)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-black transition-colors cursor-pointer"
          >
            <Wallet className="h-4 w-4" />
            <span>Check Wallet Balance</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => {
            const isCurrent = isSubscribed && activeSubData?.plan?.id === plan.id;
            const isPopular = plan.name.toLowerCase().includes('quarterly');
            const priceRupees = plan.price / 100;
            const monthlyEquivalent = Math.round(priceRupees / (plan.durationDays / 30));

            return (
              <div
                key={plan.id}
                className={`rounded-3xl border p-7 flex flex-col justify-between transition-all relative bg-white ${
                  isPopular
                    ? 'border-2 border-black shadow-lg scale-102 z-10'
                    : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-black px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
                    MOST POPULAR
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {plan.description || `${plan.durationDays} days of unlimited access.`}
                    </p>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                        ₹{priceRupees}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        /{plan.durationDays} days
                      </span>
                    </div>
                    {plan.durationDays > 30 && (
                      <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                        Approx ₹{monthlyEquivalent}/month
                      </p>
                    )}
                  </div>

                  <hr className="border-slate-100 my-4" />

                  {/* Features */}
                  <div className="space-y-2.5">
                    {(plan.features || [
                      'Direct chat & visit scheduling',
                      'Verified Profile Badge',
                      'Priority search highlights',
                      'Prorated instant wallet refund',
                    ]).map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                        <Check className="h-4 w-4 text-black shrink-0 mt-0.5 stroke-[2.5]" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-8">
                  {isCurrent ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-3 px-4 rounded-2xl bg-slate-100 text-slate-500 text-xs font-bold text-center cursor-not-allowed"
                    >
                      Current Active Plan
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isSubscribed || processingPlanId === plan.id}
                      onClick={() => handleSubscribe(plan)}
                      className={`w-full py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isPopular
                          ? 'bg-black hover:bg-slate-800 text-white shadow-xs disabled:opacity-50'
                          : 'bg-slate-900 hover:bg-black text-white disabled:opacity-50'
                      }`}
                    >
                      {processingPlanId === plan.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Connecting Razorpay...</span>
                        </>
                      ) : (
                        <>
                          <span>{isSubscribed ? 'Plan Inactive' : 'Get Started'}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trust & Refund Policy Footer Card */}
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-6 w-6 text-slate-900 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">Razorpay Secure Test Gateway</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Powered by Razorpay Test API. Use test card 4111 1111 1111 1111 to test live checkout safely.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <RotateCcw className="h-6 w-6 text-slate-900 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">100% Refund in 3 Days</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Change your mind within 3 days for a full refund. Prorated refunds after 3 days credited to wallet.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Wallet className="h-6 w-6 text-slate-900 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">Instant Wallet Ledger Credit</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Refunds are added to your Kuday wallet immediately with full transaction history and zero hidden fees.
            </p>
          </div>
        </div>
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelModal && activeSub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-base font-bold text-slate-900">Cancel Membership?</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel your{' '}
              <strong>{activeSubData?.plan?.name}</strong>? Your VIP badge and direct visit scheduling benefits will be revoked immediately.
            </p>

            {/* Refund Estimation Card */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Estimated Refund to Wallet
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900">
                  ₹{((activeSubData?.estimatedRefund || 0) / 100).toFixed(2)}
                </span>
                <span className="text-xs font-bold text-emerald-600">
                  {activeSubData?.isFullRefundEligible ? '100% Full Refund' : 'Prorated Unused Days'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                The calculated refund amount will be credited to your Kuday Wallet immediately.
              </p>
            </div>

            {/* Optional Reason */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 block">
                Reason for cancellation (optional)
              </label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Found a room, taking a break, etc..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-hidden resize-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                Keep Membership
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <span>Confirm Cancel &amp; Refund</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
