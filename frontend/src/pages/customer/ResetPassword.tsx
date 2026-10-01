import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Navigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { PasswordStrength } from '@/components/common/PasswordStrength';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { useResetPassword } from '@/hooks/useResetPassword';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/shared/schema/auth/ResetPasswordSchema';

export default function ResetPassword() {
  const { pendingSignup } = useAuth();
  const { resetPassword, isLoading } = useResetPassword();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onTouched',
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const newPassword = useWatch({ control, name: 'newPassword' });

  if (!pendingSignup?.email) return <Navigate to={ROUTES.FORGOT_PASSWORD} replace />;

  return (
    <AuthLayout
      title="Set New Password"
      subtitle="Create a new strong password for your KUDAY account."
    >
      <form onSubmit={handleSubmit(resetPassword)} noValidate className="space-y-4">
        <div className="space-y-2">
          <PasswordInput
            label="New Password"
            placeholder="New Password"
            autoComplete="new-password"
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <PasswordStrength password={newPassword} />
        </div>

        <PasswordInput
          label="Confirm New Password"
          placeholder="Confirm New Password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" size="lg" fullWidth isLoading={isLoading}>
          {isLoading ? 'Updating Password...' : 'Reset Password'}
        </Button>
      </form>
    </AuthLayout>
  );
}
