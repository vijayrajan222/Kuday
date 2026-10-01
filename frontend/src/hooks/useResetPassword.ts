import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MESSAGES } from '@/constants/messages';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/useToast';
import { authService } from '@/services/authService';
import type { ResetPasswordFormValues } from '@/shared/schema/auth/ResetPasswordSchema';
import { getErrorMessage } from '@/utils/errorHandler';

export function useResetPassword() {
  const navigate = useNavigate();
  const { pendingSignup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const resetPassword = useCallback(
    async (values: ResetPasswordFormValues) => {
      const email = pendingSignup?.email;
      if (!email) {
        toast.error('Session expired. Please request a password reset again.');
        navigate(ROUTES.FORGOT_PASSWORD, { replace: true });
        return;
      }

      setIsLoading(true);
      try {
        const result = await authService.resetPassword({
          email,
          newPassword: values.newPassword,
          confirmPassword: values.confirmPassword,
        });
        toast.success(result.message || MESSAGES.RESET_PASSWORD_SUCCESS);
        navigate(ROUTES.LOGIN, { replace: true });
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    },
    [pendingSignup, navigate],
  );

  return { resetPassword, isLoading };
}
