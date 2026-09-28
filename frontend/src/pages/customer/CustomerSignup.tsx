import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, User } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { PasswordStrength } from '@/components/common/PasswordStrength';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { useSignUp } from '@/hooks/useSignUp';
import { registerUserSchema, type RegisterUserFormValues } from '@/shared/schema/auth/RegisterUserSchema';

export default function CustomerSignup() {
  const { signUp, isLoading } = useSignUp();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterUserFormValues>({
    resolver: zodResolver(registerUserSchema),
    mode: 'onTouched', // errors appear only after the field is touched / submitted
    defaultValues: { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' },
  });

  const password = useWatch({ control, name: 'password' });

  return (
    <AuthLayout
      title="Create Account"
      subtitle="KUDAY - Find your perfect roommate or list your house"
      footer="By signing up you agree to our Terms & Privacy Policy."
    >
      <form onSubmit={handleSubmit(signUp)} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="First Name"
            placeholder="First Name"
            autoComplete="given-name"
            leftIcon={<User className="h-4 w-4" />}
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <Input
            label="Last Name"
            placeholder="Last Name"
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

        <Input
          label="Email Address"
          type="email"
          placeholder="Email Address"
          autoComplete="email"
          leftIcon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="space-y-2">
          <PasswordInput
            label="Password"
            placeholder="Password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <PasswordStrength password={password} />
        </div>

        <PasswordInput
          label="Confirm Password"
          placeholder="Confirm Password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" size="lg" fullWidth isLoading={isLoading}>
          {isLoading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>
    </AuthLayout>
  );
}
