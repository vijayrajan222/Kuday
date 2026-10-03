import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  LogOut,
  Menu,
  X,
  FileCheck2,
  Building2,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { ROUTES } from '@/constants/routes';

export function AdminLayout() {
  const { adminUser, logoutAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutAdmin();
    navigate(ROUTES.ADMIN_LOGIN);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 sm:px-8 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-500 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
                <ShieldCheck className="h-5 w-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                Kuday <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/30">ADMIN PORTAL</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Admin Controls */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 border-r border-slate-800 pr-4">
            <div className="h-8 w-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center border border-indigo-400/30">
              {adminUser?.firstName ? adminUser.firstName[0].toUpperCase() : 'A'}
            </div>
            <div className="text-left text-xs">
              <p className="font-bold text-slate-200">{adminUser?.firstName || 'Admin'} {adminUser?.lastName || ''}</p>
              <p className="text-[10px] text-slate-400">{adminUser?.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-red-950/40 hover:text-red-400 border border-slate-700 hover:border-red-800/50 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Left Admin Navigation Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-20 w-64 transform border-r border-slate-800 bg-slate-950/95 pt-20 transition-transform duration-200 ease-in-out md:static md:translate-x-0 md:pt-0 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 space-y-6">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Admin Control Center
            </div>

            <nav className="space-y-1.5">
              <a
                href="#verifications"
                className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-200 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm"
              >
                <FileCheck2 className="h-4 w-4 text-indigo-400" />
                <span>Identity Verifications</span>
              </a>

              <a
                href="#users"
                className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition-all"
              >
                <Users className="h-4 w-4 text-emerald-400" />
                <span>Seekers & Property Owners</span>
              </a>
            </nav>

            <div className="pt-6 border-t border-slate-800/80 px-3 space-y-2">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] space-y-1.5">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-indigo-400" /> Kuday System
                </span>
                <div className="flex items-center gap-2 text-emerald-400 text-[10px]">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Verification Engine Active</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Admin Content Canvas */}
        <main className="flex-1 p-4 sm:p-8 bg-slate-900 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
