import type { ReactNode } from 'react';
import { Home, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';

const HIGHLIGHTS = [
  { icon: Users, text: 'Get matched with compatible roommates' },
  { icon: Home, text: 'List your house in minutes' },
  { icon: ShieldCheck, text: 'Verified profiles for peace of mind' },
] as const;

interface AuthLayoutProps {
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-teal-300/20 blur-3xl" />

        <BrandLogo light className="relative" />

        <div className="relative space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm backdrop-blur">
            <Sparkles className="h-4 w-4" /> Roommates made simple
          </div>
          <h2 className="max-w-md text-4xl font-extrabold leading-tight">
            Find your perfect roommate or list your house.
          </h2>
          <ul className="space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-emerald-50">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-emerald-100/80">© {new Date().getFullYear()} KUDAY</p>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center bg-slate-50 px-4 py-10 sm:px-8">
        <div className="w-full max-w-md animate-fade-in-up">
          <BrandLogo className="mb-8 lg:hidden" />
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
          {footer && <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
