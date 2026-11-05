import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { InputOTP } from '@/components/ui/input-otp';
import { MESSAGES } from '@/constants/messages';
import { ROUTES } from '@/constants/routes';
import { useVerifyResetOtp } from '@/hooks/useVerifyResetOtp';
import { formatSeconds, maskEmail } from '@/utils/formatters';

export default function VerifyResetOtp() {
  const { email, verifyResetOtp, resendResetOtp, isLoading, isResending, secondsLeft, canResend } = useVerifyResetOtp();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string>();

  if (!email) return <Navigate to={ROUTES.FORGOT_PASSWORD} replace />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (cleanOtp.length < 6) {
      setError(MESSAGES.OTP_INCOMPLETE);
      return;
    }
    setError(undefined);
    void verifyResetOtp(cleanOtp);
  };

  const handleResend = async () => {
    setOtp('');
    setError(undefined);
    await resendResetOtp();
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
        <p className="text-center text-sm text-slate-500">
          Entered the wrong email?{' '}
          <Link to={ROUTES.FORGOT_PASSWORD} className="font-medium text-emerald-600 hover:underline">
            Use a different email
          </Link>
        </p>
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
          onComplete={(code) => {
            const clean = code.trim();
            if (clean.length === 6) void verifyResetOtp(clean);
          }}
          disabled={isLoading}
          hasError={Boolean(error)}
        />

        {error && (
          <p role="alert" className="text-center text-sm font-medium text-rose-600">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" fullWidth isLoading={isLoading} disabled={otp.trim().length < 6}>
          Verify Code
        </Button>

        <p className="text-center text-sm text-slate-500">
          Didn&apos;t get the code?{' '}
          {canResend ? (
            <button
              type="button"
              onClick={() => void handleResend()}
              disabled={isResending}
              className="font-semibold text-emerald-600 hover:underline disabled:opacity-60 cursor-pointer"
            >
              Request new code
            </button>
          ) : (
            <span className="font-medium tabular-nums text-slate-700">Resend in {formatSeconds(secondsLeft)}</span>
          )}
        </p>
      </form>
    </AuthLayout>
  );
}
