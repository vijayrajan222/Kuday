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

export function useVerifyOtp() {
  const navigate = useNavigate();
  const { pendingSignup: pending, loginSuccess } = useAuth();

  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { secondsLeft, isRunning, restart } = useCountdown(OTP_RESEND_SECONDS);

  /** Resolves to an error message, or null on success. */
  const verify = useCallback(
    async (otp: string): Promise<string | null> => {
      if (!pending) return null;
      setIsVerifying(true);
      try {
        const result = await authService.verifyOtp({ email: pending.email, otp });
        if (!result.token) return MESSAGES.OTP_NO_TOKEN;
        loginSuccess(result.token, { id: result.id, email: pending.email, firstName: pending.firstName });
        toast.success(MESSAGES.OTP_SUCCESS);
        navigate(ROUTES.ONBOARDING_PROFILE, { replace: true });
        return null;
      } catch (error) {
        return getErrorMessage(error);
      } finally {
        setIsVerifying(false);
      }
    },
    [pending, loginSuccess, navigate],
  );

  const resend = useCallback(async () => {
    if (!pending || isRunning) return;
    setIsResending(true);
    try {
      await authService.resendOtp({ email: pending.email });
      toast.success(MESSAGES.OTP_RESENT);
      restart();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsResending(false);
    }
  }, [pending, isRunning, restart]);

  return { email: pending?.email, verify, resend, isVerifying, isResending, secondsLeft, canResend: !isRunning };
}
