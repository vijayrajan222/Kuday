import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ROUTES } from '@/constants/routes';
import { useForgotPassword } from '@/hooks/useForgotPassword';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/shared/schema/auth/ForgotPasswordSchema';

export default function ForgotPassword() {
  const { requestReset, isLoading } = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onTouched',
    defaultValues: { email: '' },
  });

  return (
    <AuthLayout
      title="Forgot Password?"
      subtitle="Enter your email address and we'll send you a 6-digit code to reset your password."
      footer={
        <p>
          Remembered your password?{' '}
          <Link to={ROUTES.LOGIN} className="font-semibold text-emerald-600 hover:underline">
            Back to Log In
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(requestReset)} noValidate className="space-y-5">
        <Input
          label="Email Address"
          type="email"
          placeholder="Email Address"
          autoComplete="email"
          leftIcon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Button type="submit" size="lg" fullWidth isLoading={isLoading}>
          {isLoading ? 'Sending OTP Code...' : 'Send Reset Code'}
        </Button>
      </form>
    </AuthLayout>
  );
}
