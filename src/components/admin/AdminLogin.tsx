import { useState } from 'react';
import { ArrowLeft, Loader2, Lock, ShieldAlert } from 'lucide-react';

interface AdminLoginProps {
  clinicName: string;
  onSignIn: (email: string, password: string) => Promise<{ error: string | null }>;
  onReturnHome: () => void;
  unconfigured?: boolean;
}

export function AdminLogin({
  clinicName,
  onSignIn,
  onReturnHome,
  unconfigured = false,
}: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setSubmitting(true);
    const { error } = await onSignIn(email, password);
    if (error) {
      setErrorMessage(error);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EFF6F8] via-[#F8FAFB] to-[#E9F2F5] flex flex-col justify-between p-4 sm:p-8">
      <div>
        <button
          type="button"
          onClick={onReturnHome}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#4A606D] hover:text-[#0F2430] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to {clinicName}</span>
        </button>
      </div>

      <div className="w-full max-w-md mx-auto my-12 bg-white border border-[#DDE7EB] rounded-2xl p-8 shadow-sm">
        <div className="w-11 h-11 rounded-xl bg-[#EBF5F6] border border-[#CFE2E6] flex items-center justify-center text-[#0D7A7E] mb-6">
          <Lock className="w-5 h-5" />
        </div>

        <p className="text-xs font-medium text-[#0D7A7E] mb-1">{clinicName}</p>
        <h1 className="font-display text-2xl font-semibold text-[#0F2430] tracking-tight">
          Clinic Admin Sign In
        </h1>
        <p className="mt-2 text-sm text-[#4A606D] leading-relaxed">
          Sign in with your authorized administrator account to manage appointments,
          services, clinic hours, and settings.
        </p>

        {unconfigured ? (
          <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-sm text-amber-900">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-700" />
            <div>
              <p className="font-medium">Supabase connection required</p>
              <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                Set <code className="font-mono">VITE_SUPABASE_URL</code> and{' '}
                <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> in your
                environment to enable administrator authentication.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            {errorMessage && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800"
              >
                {errorMessage}
              </div>
            )}

            <div>
              <label
                htmlFor="admin-email"
                className="block text-sm font-medium text-[#0F2430] mb-1.5"
              >
                Email Address
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@clinic.com"
                className="w-full px-4 py-2.5 text-sm text-[#0F2430] bg-[#FAFDFE] border border-[#CEDCE2] rounded-xl focus:outline-none focus:border-[#0D7A7E] focus:ring-2 focus:ring-[#0D7A7E]/15"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-sm font-medium text-[#0F2430] mb-1.5"
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-2.5 text-sm text-[#0F2430] bg-[#FAFDFE] border border-[#CEDCE2] rounded-xl focus:outline-none focus:border-[#0D7A7E] focus:ring-2 focus:ring-[#0D7A7E]/15"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-white bg-[#0D7A7E] rounded-xl hover:bg-[#095F63] disabled:opacity-60 transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>
          </form>
        )}
      </div>

      <div className="text-center text-xs text-[#6B8290]">
        Protected clinic operations portal
      </div>
    </div>
  );
}
