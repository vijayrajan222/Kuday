import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

export const Footer = memo(function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-white py-10 mt-16 text-slate-600">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-lg font-black tracking-tight text-slate-900">kudai</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500">Curated Roommates & Living Spaces</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-slate-600 font-medium">
          <Link to={ROUTES.DASHBOARD} className="hover:text-slate-900 transition-colors">
            Discover
          </Link>
          <Link to={ROUTES.PROFILE} className="hover:text-slate-900 transition-colors">
            Profile & Verification
          </Link>
          <span className="text-slate-400">Safety & Trust</span>
          <span className="text-slate-400">House Rules</span>
          <span className="text-slate-400">Terms of Service</span>
          <span className="text-slate-400">Privacy Policy</span>
        </div>

        <div className="text-slate-400">
          © {new Date().getFullYear()} Kudai Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
});
