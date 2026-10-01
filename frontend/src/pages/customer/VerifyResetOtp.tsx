import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { InputOTP } from '@/components/ui/input-otp';
import { MESSAGES } from '@/constants/messages';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { useVerifyResetOtp } from '@/hooks/useVerifyResetOtp';
import { maskEmail } from '@/utils/formatters';

export default function VerifyResetOtp() {
  const { pendingSignup } = useAuth();
  const { verifyResetOtp, isLoading } = useVerifyResetOtp();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string>();

  const email = pendingSignup?.email;
  if (!email) return <Navigate to={ROUTES.FORGOT_PASSWORD} replace />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      setError(MESSAGES.OTP_INCOMPLETE);
      return;
    }
    setError(undefined);
    void verifyResetOtp(otp);
  };

  return (
    <AuthLayout
      title="Verify Reset Code"
      subtitle={
        <>
          Enter the 6-digit password reset code sent to <span className="font-medium text-slate-700">{maskEmail(email)}</span>
        </>
      }
      footer={
        <a href={ROUTES.FORGOT_PASSWORD} className="font-medium text-emerald-600 hover:underline">
          Request new reset code
        </a>
      }
    >
      <div className="mb-6 flex justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <ShieldCheck className="h-8 w-8" />
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <InputOTP
          value={otp}
          onChange={(v) => {
            setOtp(v);
            if (error) setError(undefined);
          }}
          onComplete={(code) => void verifyResetOtp(code)}
          disabled={isLoading}
          hasError={Boolean(error)}
        />

        {error && (
          <p role="alert" className="text-center text-sm font-medium text-rose-600">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" fullWidth isLoading={isLoading} disabled={otp.length < 6}>
          Verify Code
        </Button>
      </form>
    </AuthLayout>
  );
}
