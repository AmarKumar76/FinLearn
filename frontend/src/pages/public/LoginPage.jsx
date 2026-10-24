import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { ThemeSelector } from '../../components/common/ThemeSelector';
import { ArrowRight, AlertCircle, Eye, EyeOff, Info } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
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
    <div className="min-h-screen bg-theme-app text-theme-primary flex flex-col justify-center py-12 px-6 sm:px-12 relative overflow-hidden transition-colors">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-terracotta/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brass/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Brand & Public Theme Selector */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-40">
        <ThemeSelector size="sm" />
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-6 left-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-theme-elevated text-theme-primary text-xs font-semibold shadow-xl border border-theme-border-strong animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <Info className="w-4 h-4 text-terracotta shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            className="ml-2 text-theme-muted hover:text-theme-primary transition-colors text-sm font-bold"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 mb-6 text-theme-primary font-bold hover:text-terracotta transition-colors">
          <div className="w-8 h-8 rounded-lg bg-terracotta flex items-center justify-center font-bold text-white text-sm shadow-xs">
            ₹
          </div>
          <span className="text-xl font-extrabold tracking-tight">FinLearn</span>
        </Link>

        <Card className="bg-theme-surface border-theme-border-strong shadow-xl p-6 sm:p-8">
          <div className="mb-6 space-y-1">
            <div>
              <h2 className="text-xl font-black text-theme-primary">Sign In</h2>
            </div>
            <p className="text-xs text-theme-muted font-medium">
              Access your unified personal finance and learning workspace
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. learner@finlearn.in"
              autoComplete="email"
              required
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              endAdornment={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-theme-muted hover:text-theme-primary focus:outline-none focus:text-terracotta p-1 transition-colors rounded"
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

            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-terracotta hover:text-terracotta-hover transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-xs text-rose-600 dark:text-rose-400">
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
              Sign In to Dashboard
            </Button>
          </form>

          {/* OR Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-theme-border" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-theme-surface px-3 text-theme-muted font-bold">
                OR
              </span>
            </div>
          </div>

          {/* Google Sign-in Button (UI Only) */}
          <button
            type="button"
            onClick={handleGoogleClick}
            className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg border border-theme-border-strong bg-theme-subtle hover:bg-theme-elevated text-theme-primary text-sm font-semibold transition-all hover:border-theme-border focus:outline-none focus:ring-2 focus:ring-terracotta shadow-xs active:scale-[0.99]"
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

          <div className="mt-6 pt-5 border-t border-theme-border text-center text-xs text-theme-muted">
            Don't have an account yet?{' '}
            <Link to="/signup" className="font-bold text-terracotta hover:underline ml-1">
              Create an account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default LoginPage;
