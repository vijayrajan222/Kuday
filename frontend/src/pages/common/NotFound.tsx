import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 p-6 text-center">
      <p className="text-7xl font-extrabold text-emerald-600">404</p>
      <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="text-slate-600">The page you are looking for doesn&apos;t exist.</p>
      <Link to={ROUTES.HOME} className="mt-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700">
        Back to home
      </Link>
    </div>
  );
}
