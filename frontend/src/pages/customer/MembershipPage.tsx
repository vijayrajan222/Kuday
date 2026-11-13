import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
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
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  // Wallet purchase state
  const [walletConfirmPlan, setWalletConfirmPlan] = useState<Plan | null>(null);
  const [isPayingWithWallet, setIsPayingWithWallet] = useState(false);

  // Refund modal state
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);

  // Load plans, active subscription & wallet balance
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [fetchedPlans, fetchedSub, fetchedWallet] = await Promise.all([
        paymentService.getPlans(),
        paymentService.getActiveSubscription().catch(() => null),
        paymentService.getWallet().catch(() => null),
      ]);
      setPlans(fetchedPlans);
      setActiveSubData(fetchedSub);
      if (fetchedWallet) {
        setWalletBalance(fetchedWallet.balancePaise || 0);
      }
    } catch {
      toast.error('Failed to load membership plans.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'host') {
      loadData();
    }
  }, [user?.role]);

  // Initiate Razorpay Checkout Flow
  const handleSubscribe = async (plan: Plan) => {
    if (!user) {
      toast.error('Please sign in to subscribe.');
      navigate(ROUTES.LOGIN);
      return;
    }

    if (user?.role !== 'host') {
      toast.error('Only users in the Host role can subscribe to premium plans.');
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
        name: 'Kuday Host Premium',
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

      if (!window.Razorpay) {
        toast.error('Razorpay SDK failed to load. Please try again.');
        setProcessingPlanId(null);
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (failedRes: { error?: { description?: string } }) => {
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

  // Pay directly using Wallet Balance
  const handleConfirmWalletPayment = async () => {
    if (!walletConfirmPlan) return;
    if (user?.role !== 'host') {
      toast.error('Only users in the Host role can purchase premium plans.');
      return;
    }
    try {
      setIsPayingWithWallet(true);
      await paymentService.payWithWallet(walletConfirmPlan.id);
      toast.success(`Purchased ${walletConfirmPlan.name} with wallet balance! Welcome to Premium 🎉`);
      setWalletConfirmPlan(null);
      await loadData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to pay with wallet balance.');
    } finally {
      setIsPayingWithWallet(false);
    }
  };

  // Handle Request Refund
  const handleConfirmRefund = async () => {
    if (!activeSubData?.subscription?.id) return;
    try {
      setIsRefunding(true);
      const res = await paymentService.requestRefund(
        activeSubData.subscription.id,
        refundReason.trim()
      );

      const refundRupees = (res.refundAmount / 100).toFixed(2);
      toast.success(
        `Refund successful! ₹${refundRupees} has been credited to your Kuday wallet.`
      );

      setShowRefundModal(false);
      setRefundReason('');
      await loadData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to process refund.');
    } finally {
      setIsRefunding(false);
    }
  };

  if (user && user.role !== 'host') {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const activeSub = activeSubData?.subscription;
  const isSubscribed = Boolean(activeSub && activeSub.status === 'active');
  const isRefundEligible = Boolean(activeSubData?.isRefundEligible);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold tracking-wide">
          <Crown className="h-3.5 w-3.5 text-amber-600 fill-amber-500" />
          <span>KUDAY HOST PREMIUM MEMBERSHIP</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Find Reliable Roommates Faster
        </h1>
        <p className="text-sm text-slate-500">
          Exclusive for Hosts: Get verified VIP badges, priority listing search placement, and instant wallet refunds.
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
                {activeSubData?.plan?.name || 'Host Premium Plan'}
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

              {/* Rule 7: Hide button once ineligible */}
              {isRefundEligible && (
                <button
                  type="button"
                  onClick={() => setShowRefundModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-rose-500/20 border border-white/10 hover:border-rose-400 text-slate-200 hover:text-rose-200 text-xs font-bold transition-all cursor-pointer"
                >
                  Request Refund
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pricing Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isSubscribed ? 'Available Plans' : 'Choose Your Plan'}
            </h2>
            <p className="text-xs text-slate-500">
              One-time purchase with fixed duration. No automatic renewals. 3-day refund window.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(ROUTES.WALLET)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-colors cursor-pointer"
          >
            <Wallet className="h-4 w-4 text-emerald-600" />
            <span>Wallet: ₹{(walletBalance / 100).toFixed(2)}</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 max-w-3xl mx-auto gap-6 items-stretch">
          {plans.map((plan) => {
            const isCurrent = isSubscribed && activeSubData?.plan?.id === plan.id;
            const isYearly = plan.durationDays >= 365;
            const priceRupees = plan.price / 100;
            const monthlyEquivalent = Math.round(priceRupees / (plan.durationDays / 30));

            return (
              <div
                key={plan.id}
                className={`rounded-3xl border p-7 flex flex-col justify-between transition-all relative bg-white ${
                  isYearly
                    ? 'border-2 border-black shadow-lg z-10'
                    : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                {isYearly && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-black px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
                    BEST VALUE
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {plan.description || `${plan.durationDays} days of verified host access.`}
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
                      'Verified Host Badge',
                      'Priority Search Placement for Listings',
                      'Direct Seeker Interest Notifications',
                      '3-Day Full Refund to Wallet',
                    ]).map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                        <Check className="h-4 w-4 text-black shrink-0 mt-0.5 stroke-[2.5]" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-6 space-y-2">
                  {isCurrent ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-3 px-4 rounded-2xl bg-slate-100 text-slate-500 text-xs font-bold text-center cursor-not-allowed"
                    >
                      Current Active Plan
                    </button>
                  ) : isSubscribed ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-3 px-4 rounded-2xl bg-slate-100 text-slate-400 text-xs font-bold text-center cursor-not-allowed"
                    >
                      Active Plan In Progress
                    </button>
                  ) : walletBalance >= plan.price ? (
                    <>
                      <button
                        type="button"
                        disabled={isPayingWithWallet}
                        onClick={() => setWalletConfirmPlan(plan)}
                        className="w-full py-3 px-4 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                      >
                        <Wallet className="h-4 w-4" />
                        <span>Pay with Wallet (₹{priceRupees})</span>
                      </button>

                      <button
                        type="button"
                        disabled={processingPlanId === plan.id}
                        onClick={() => handleSubscribe(plan)}
                        className="w-full py-2 px-3 rounded-xl text-[11px] font-semibold text-slate-600 hover:text-black hover:bg-slate-50 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        {processingPlanId === plan.id ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Connecting Razorpay...</span>
                          </>
                        ) : (
                          <>
                            <span>or Pay with Razorpay</span>
                            <ArrowRight className="h-3 w-3" />
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={processingPlanId === plan.id}
                        onClick={() => handleSubscribe(plan)}
                        className={`w-full py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          isYearly
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
                            <span>Get Started</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>

                      {walletBalance > 0 && (
                        <p className="text-[11px] text-center text-slate-400 font-medium">
                          Wallet: ₹{(walletBalance / 100).toFixed(2)} (Need ₹{((plan.price - walletBalance) / 100).toFixed(2)} more)
                        </p>
                      )}
                    </>
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
              Powered by Razorpay Test API. Use test cards to verify subscription activation and top-ups safely.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <RotateCcw className="h-6 w-6 text-slate-900 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">3-Day Full Refund Window</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Full refund within 3 days of purchase as long as premium benefits haven&apos;t been used.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Wallet className="h-6 w-6 text-slate-900 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">Instant Kuday Wallet Credit</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Refunds are credited to your personal wallet immediately with double-entry ledger tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Request Refund Modal */}
      {showRefundModal && activeSub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-base font-bold text-slate-900">Request Refund?</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRefundModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to request a refund for your{' '}
              <strong>{activeSubData?.plan?.name}</strong>? Your host VIP badge will end immediately, and 100% of your payment will be credited to your Kuday Wallet.
            </p>

            {/* Refund Calculation Card */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Refund Amount to Wallet
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900">
                  ₹{((activeSubData?.estimatedRefund || activeSubData?.plan?.price || 0) / 100).toFixed(2)}
                </span>
                <span className="text-xs font-bold text-emerald-600">
                  100% Wallet Credit
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                The full purchase amount will be credited to your wallet in one atomic transaction.
              </p>
            </div>

            {/* Optional Reason */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 block">
                Reason for refund request (optional)
              </label>
              <textarea
                rows={2}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Changed my mind, testing, etc..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-hidden resize-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRefundModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                Keep Premium
              </button>
              <button
                type="button"
                disabled={isRefunding}
                onClick={handleConfirmRefund}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isRefunding ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Confirm Refund</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Payment Confirmation Modal */}
      {walletConfirmPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-5 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Wallet className="h-5 w-5" />
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Confirm Wallet Purchase
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setWalletConfirmPlan(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                You are about to activate <strong>{walletConfirmPlan.name}</strong> using your Kuday Wallet balance.
              </p>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Current Wallet Balance:</span>
                  <span className="font-bold text-slate-800">₹{(walletBalance / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Plan Cost:</span>
                  <span className="font-bold text-rose-600">-₹{(walletConfirmPlan.price / 100).toFixed(2)}</span>
                </div>
                <hr className="border-slate-200" />
                <div className="flex justify-between text-xs pt-0.5">
                  <span className="font-bold text-slate-700">Remaining Balance:</span>
                  <span className="font-black text-emerald-600">
                    ₹{((walletBalance - walletConfirmPlan.price) / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setWalletConfirmPlan(null)}
                disabled={isPayingWithWallet}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPayingWithWallet}
                onClick={handleConfirmWalletPayment}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
              >
                {isPayingWithWallet ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Confirm &amp; Activate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
