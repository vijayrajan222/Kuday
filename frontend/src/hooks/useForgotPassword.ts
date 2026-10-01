import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MESSAGES } from '@/constants/messages';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/useToast';
import { authService } from '@/services/authService';
import type { ForgotPasswordFormValues } from '@/shared/schema/auth/ForgotPasswordSchema';
import { getErrorMessage } from '@/utils/errorHandler';

export function useForgotPassword() {
  const navigate = useNavigate();
  const { setPendingSignup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const requestReset = useCallback(
    async (values: ForgotPasswordFormValues) => {
      setIsLoading(true);
      try {
        const result = await authService.forgotPassword(values);
        setPendingSignup({ email: values.email, firstName: 'User' });
        toast.success(result.message || MESSAGES.FORGOT_PASSWORD_SUCCESS);
        navigate(ROUTES.VERIFY_RESET_OTP, { replace: true });
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    },
    [setPendingSignup, navigate],
  );

  return { requestReset, isLoading };
}
