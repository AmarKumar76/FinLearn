import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, AlertCircle, Eye, EyeOff, Info } from 'lucide-react';

export function SignupPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide your full name');
      return;
    }
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must include uppercase, lowercase, and numeric characters');
      return;
    }

    try {
      setLoading(true);
      await register(name.trim(), email.trim(), password);
      // Seamlessly transition new user directly to the unified dashboard
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    setToastMessage('Google sign-in is coming soon.');
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-ivory flex flex-col justify-center py-12 px-6 sm:px-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-terracotta/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brass/10 rounded-full blur-3xl pointer-events-none" />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-aubergine text-ivory text-xs font-semibold shadow-xl border border-brass/30 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <Info className="w-4 h-4 text-terracotta shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            className="ml-2 text-ivory/60 hover:text-ivory transition-colors text-sm font-bold"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 mb-6 text-aubergine font-bold hover:text-terracotta transition-colors">
          <div className="w-8 h-8 rounded-lg bg-terracotta flex items-center justify-center font-bold text-white text-sm">
            ₹
          </div>
          <span className="text-xl font-extrabold tracking-tight">FinLearn</span>
        </Link>

        <Card className="bg-white/90 border-brass/25 shadow-lg p-6 sm:p-8">
          <div className="mb-6 space-y-1">
            <div>
              <h2 className="text-xl font-black text-aubergine">Create Account</h2>
            </div>
            <p className="text-xs text-aubergine/70">
              Start your journey with unified money management & scam defense
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Arjun Sharma"
              autoComplete="name"
              required
            />

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="arjun@example.com"
              autoComplete="email"
              required
            />

            <Input
              label="Password (min 8 chars, uppercase & number)"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              endAdornment={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-aubergine/50 hover:text-aubergine focus:outline-none focus:text-terracotta p-1 transition-colors rounded"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              icon={ArrowRight}
              className="w-full mt-2"
            >
              Create Account & Continue
            </Button>
          </form>

          {/* OR Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brass/20" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-white/95 px-3 text-aubergine/60 font-bold">
                OR
              </span>
            </div>
          </div>

          {/* Google Sign-in Button (UI Only) */}
          <button
            type="button"
            onClick={handleGoogleClick}
            className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg border border-brass/35 bg-ivory/60 hover:bg-ivory text-aubergine text-sm font-semibold transition-all hover:border-brass/70 focus:outline-none focus:ring-2 focus:ring-terracotta shadow-sm active:scale-[0.99]"
            aria-label="Continue with Google"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="mt-6 pt-5 border-t border-brass/15 text-center text-xs text-aubergine/70">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-terracotta hover:underline">
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default SignupPage;

