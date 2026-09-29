import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { ROUTES } from '@/constants/routes';
import { useLogin } from '@/hooks/useLogin';
import { loginUserSchema, type LoginUserFormValues } from '@/shared/schema/auth/LoginUserSchema';

export default function Login() {
  const { login, isLoading } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginUserFormValues>({
    resolver: zodResolver(loginUserSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Log in to access your KUDAY account"
      footer={
        <p>
          Don&apos;t have an account?{' '}
          <Link to={ROUTES.SIGN_UP} className="font-semibold text-emerald-600 hover:underline">
            Sign Up
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(login)} noValidate className="space-y-5">
        <Input
          label="Email Address"
          type="email"
          placeholder="Email Address"
          autoComplete="email"
          leftIcon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <PasswordInput
          label="Password"
          placeholder="Password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" size="lg" fullWidth isLoading={isLoading}>
          {isLoading ? 'Logging in...' : 'Log In'}
        </Button>
      </form>
    </AuthLayout>
  );
}
