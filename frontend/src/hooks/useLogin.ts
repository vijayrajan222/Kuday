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
  const { loginSuccess } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(
    async (values: LoginUserFormValues) => {
      setIsLoading(true);
      try {
        const result = await authService.login(values);
        if (result.token) {
          loginSuccess(result.token, {
            email: result.email ?? values.email,
            firstName: result.firstName ?? 'User',
          });
          toast.success(result.message || MESSAGES.LOGIN_SUCCESS);
          navigate(ROUTES.DASHBOARD, { replace: true });
        } else {
          toast.error(MESSAGES.OTP_NO_TOKEN);
        }
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    },
    [loginSuccess, navigate],
  );

  return { login, isLoading };
}
