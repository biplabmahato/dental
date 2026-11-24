import { ArrowLeft, Loader2, LogOut, ShieldAlert } from 'lucide-react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { AdminDashboard } from './AdminDashboard';
import { AdminLogin } from './AdminLogin';

interface AdminRouteGuardProps {
  clinicName: string;
  onNavigatePublic: () => void;
  onPublicDataChanged: () => Promise<void>;
}

export function AdminRouteGuard({
  clinicName,
  onNavigatePublic,
  onPublicDataChanged,
}: AdminRouteGuardProps) {
  const { status, user, authError, signIn, signOut } = useAdminAuth();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#F5F8FA] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-7 h-7 text-[#0D7A7E] animate-spin mb-3" />
        <p className="font-display text-base font-medium text-[#0F2430]">
          Verifying administrator access...
        </p>
        <p className="mt-1 text-xs text-[#5A7280]">
          Checking session and clinic authorization
        </p>
      </div>
    );
  }

  if (status === 'unconfigured') {
    return (
      <AdminLogin
        clinicName={clinicName}
        onSignIn={signIn}
        onReturnHome={onNavigatePublic}
        unconfigured
      />
    );
  }

  if (status === 'unauthenticated') {
    return (
      <AdminLogin
        clinicName={clinicName}
        onSignIn={signIn}
        onReturnHome={onNavigatePublic}
      />
    );
  }

  if (status === 'unauthorized') {
    return (
      <div className="min-h-screen bg-[#F5F8FA] flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md bg-white border border-[#DDE7EB] rounded-2xl p-8 shadow-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-5 text-amber-700">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <h1 className="font-display text-xl font-semibold text-[#0F2430]">
            Access Restricted
          </h1>
          <p className="mt-2.5 text-sm text-[#4A606D] leading-relaxed">
            You are signed in, but you are not authorized as an admin.
          </p>

          {user?.email && (
            <p className="mt-3 text-xs text-[#6B8290]">
              Signed in as <span className="font-medium text-[#0F2430]">{user.email}</span>
            </p>
          )}

          {authError && (
            <p className="mt-2 text-xs text-red-700">{authError}</p>
          )}

          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => void signOut()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#0F2430] rounded-xl hover:bg-[#19384A] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>

            <button
              type="button"
              onClick={onNavigatePublic}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[#0F2430] bg-[#F2F6F8] rounded-xl hover:bg-[#E4EEF2] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Website</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <AdminDashboard
      user={user}
      onSignOut={signOut}
      onNavigatePublic={onNavigatePublic}
      onPublicDataChanged={onPublicDataChanged}
    />
  );
}
