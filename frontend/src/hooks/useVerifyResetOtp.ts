import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MESSAGES } from '@/constants/messages';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/useToast';
import { authService } from '@/services/authService';
import { getErrorMessage } from '@/utils/errorHandler';

export function useVerifyResetOtp() {
  const navigate = useNavigate();
  const { pendingSignup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const verifyResetOtp = useCallback(
    async (otp: string) => {
      const email = pendingSignup?.email;
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
    [pendingSignup, navigate],
  );

  return { verifyResetOtp, isLoading };
}
