import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MESSAGES } from '@/constants/messages';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/useToast';
import { authService } from '@/services/authService';
import type { RegisterUserFormValues } from '@/shared/schema/auth/RegisterUserSchema';
import { getErrorMessage } from '@/utils/errorHandler';

export function useSignUp() {
  const navigate = useNavigate();
  const { setPendingSignup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const signUp = useCallback(
    async (values: RegisterUserFormValues) => {
      setIsLoading(true);
      try {
        await authService.signUp(values);
        setPendingSignup({ email: values.email, firstName: values.firstName });
        toast.success(MESSAGES.SIGNUP_SUCCESS);
        navigate(ROUTES.OTP, { replace: true });
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    },
    [setPendingSignup, navigate],
  );

  return { signUp, isLoading };
}
