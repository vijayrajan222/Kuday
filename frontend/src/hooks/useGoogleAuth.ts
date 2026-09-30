import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MESSAGES } from '@/constants/messages';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/useToast';
import { authService } from '@/services/authService';
import type { GoogleAuthRequest } from '@/types';
import { getErrorMessage } from '@/utils/errorHandler';

export function useGoogleAuth() {
  const navigate = useNavigate();
  const { loginSuccess } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const googleAuth = useCallback(
    async (payload: GoogleAuthRequest) => {
      setIsLoading(true);
      try {
        const result = await authService.googleAuth(payload);
        if (result.token) {
          loginSuccess(result.token, {
            email: result.email ?? payload.email,
            firstName: result.firstName ?? payload.firstName ?? 'User',
          });
          toast.success(result.message || MESSAGES.GOOGLE_AUTH_SUCCESS);
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

  return { googleAuth, isLoading };
}
