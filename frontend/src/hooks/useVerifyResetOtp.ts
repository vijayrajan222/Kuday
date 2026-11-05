import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OTP_RESEND_SECONDS } from '@/constants/events';
import { MESSAGES } from '@/constants/messages';
import { ROUTES } from '@/constants/routes';
import { useCountdown } from '@/hooks/useCountdown';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/useToast';
import { authService } from '@/services/authService';
import { getErrorMessage } from '@/utils/errorHandler';

export function useVerifyResetOtp() {
  const navigate = useNavigate();
  const { pendingSignup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { secondsLeft, isRunning, restart } = useCountdown(OTP_RESEND_SECONDS);

  const email = pendingSignup?.email;

  const verifyResetOtp = useCallback(
    async (otp: string) => {
      if (!email) {
        toast.error('Session expired. Please request a password reset again.');
        navigate(ROUTES.FORGOT_PASSWORD, { replace: true });
        return;
      }

      setIsLoading(true);
      try {
        const result = await authService.verifyResetOtp({ email, otp });
        toast.success(result.message || MESSAGES.RESET_OTP_SUCCESS);
        navigate(ROUTES.RESET_PASSWORD, { replace: true });
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    },
    [email, navigate],
  );

  const resendResetOtp = useCallback(async () => {
    if (!email || isRunning) return;
    setIsResending(true);
    try {
      await authService.forgotPassword({ email });
      toast.success(MESSAGES.OTP_RESENT);
      restart();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsResending(false);
    }
  }, [email, isRunning, restart]);

  return {
    email,
    verifyResetOtp,
    resendResetOtp,
    isLoading,
    isResending,
    secondsLeft,
    canResend: !isRunning,
  };
}
