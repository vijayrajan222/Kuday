import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MESSAGES } from '@/constants/messages';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/useToast';
import { authService } from '@/services/authService';
import type { LoginUserFormValues } from '@/shared/schema/auth/LoginUserSchema';
import { getErrorMessage } from '@/utils/errorHandler';

export function useLogin() {
  const navigate = useNavigate();
  const { loginSuccess, setPendingSignup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(
    async (values: LoginUserFormValues) => {
      setIsLoading(true);
      try {
        const result = await authService.login(values);
        if (result.token) {
          loginSuccess(result.token, {
            id: result.id,
            email: result.email ?? values.email,
            firstName: result.firstName ?? 'User',
            lastName: result.lastName,
            isOnboarded: result.isOnboarded,
            role: result.role,
            identityVerified: result.identityVerified,
          });
          toast.success(result.message || MESSAGES.LOGIN_SUCCESS);
          // Navigate to dashboard if onboarded, or onboarding profile if not
          if (result.isOnboarded) {
            navigate(ROUTES.DASHBOARD, { replace: true });
          } else {
            navigate(ROUTES.ONBOARDING_PROFILE, { replace: true });
          }
        } else {
          toast.error(MESSAGES.OTP_NO_TOKEN);
        }
      } catch (error) {
        const message = getErrorMessage(error);
        toast.error(message);
        if (message.toLowerCase().includes('verify your email')) {
          setPendingSignup({ email: values.email, firstName: 'User' });
          navigate(ROUTES.OTP, { replace: true });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [loginSuccess, setPendingSignup, navigate],
  );

  return { login, isLoading };
}
