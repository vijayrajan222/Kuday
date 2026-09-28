import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { InputOTP } from '@/components/ui/input-otp';
import { MESSAGES } from '@/constants/messages';
import { ROUTES } from '@/constants/routes';
import { useVerifyOtp } from '@/hooks/useVerifyOtp';
import { verifyOtpSchema } from '@/shared/schema/auth/VerifyOtpSchema';
import { formatSeconds, maskEmail } from '@/utils/formatters';

export default function Otp() {
  const { email, verify, resend, isVerifying, isResending, secondsLeft, canResend } = useVerifyOtp();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string>();

  // Opened /otp directly (or refreshed after tab closed) - nothing to verify
  if (!email) return <Navigate to={ROUTES.SIGN_UP} replace />;

  const submit = async (code: string) => {
    if (isVerifying) return;
    const parsed = verifyOtpSchema.safeParse({ email, otp: code });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? MESSAGES.OTP_INCOMPLETE);
      return;
    }
    setError(undefined);
    const failure = await verify(parsed.data.otp);
    if (failure) {
      setError(failure);
      setOtp('');
    }
  };

  const handleResend = async () => {
    setOtp('');
    setError(undefined);
    await resend();
  };

  return (
    <AuthLayout
      title="Verify Email"
      subtitle={
        <>
          We sent a 6-digit code to <span className="font-medium text-slate-700">{maskEmail(email)}</span>
        </>
      }
      footer={
        <a href={ROUTES.SIGN_UP} className="font-medium text-emerald-600 hover:underline">
          Use a different email
        </a>
      }
    >
      <div className="mb-6 flex justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <MailCheck className="h-8 w-8" />
        </span>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(otp);
        }}
        className="space-y-5"
      >
        <InputOTP
          value={otp}
          onChange={(v) => {
            setOtp(v);
            if (error) setError(undefined);
          }}
          onComplete={(code) => void submit(code)}
          disabled={isVerifying}
          hasError={Boolean(error)}
        />

        {error && (
          <p role="alert" className="text-center text-sm font-medium text-rose-600">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" fullWidth isLoading={isVerifying} disabled={otp.length < 6}>
          Verify Email
        </Button>

        <p className="text-center text-sm text-slate-500">
          Didn&apos;t get the code?{' '}
          {canResend ? (
            <button
              type="button"
              onClick={() => void handleResend()}
              disabled={isResending}
              className="font-semibold text-emerald-600 hover:underline disabled:opacity-60"
            >
              Resend OTP Code
            </button>
          ) : (
            <span className="font-medium tabular-nums text-slate-700">Resend in {formatSeconds(secondsLeft)}</span>
          )}
        </p>
      </form>
    </AuthLayout>
  );
}
