import { Home, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '@/components/common/BrandLogo';
import { Card } from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';

const FEATURES = [
  { icon: Users, title: 'Smart matching', text: 'Find people whose lifestyle and budget fit yours.' },
  { icon: Home, title: 'List your house', text: 'Have a spare room? Post it and reach verified seekers.' },
  { icon: ShieldCheck, title: 'Verified & safe', text: 'Email-verified accounts keep the community trustworthy.' },
] as const;

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const ctaTo = isAuthenticated ? ROUTES.DASHBOARD : ROUTES.SIGN_UP;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-8">
        <BrandLogo />
        <Link to={ctaTo} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
          {isAuthenticated ? 'Dashboard' : 'Get started'}
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-8">
        <section className="py-16 text-center sm:py-24">
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-6xl">
            Find your perfect <span className="text-emerald-600">roommate</span> or list your house
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-600">
            KUDAY connects people looking for a place with people who have one - simply and safely.
          </p>
          <Link
            to={ctaTo}
            className="mt-8 inline-flex h-12 items-center rounded-xl bg-emerald-600 px-8 font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700"
          >
            Create free account
          </Link>
        </section>

        <section className="grid gap-5 pb-24 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="transition hover:-translate-y-1 hover:shadow-lg">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm text-slate-600">{text}</p>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}
