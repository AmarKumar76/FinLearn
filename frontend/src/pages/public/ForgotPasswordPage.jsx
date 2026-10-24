import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';
import { ThemeSelector } from '../../components/common/ThemeSelector';
import { ArrowLeft, Mail, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [devToken, setDevToken] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await forgotPassword(email);
      setSuccess(true);
      if (res && res.data && res.data.resetToken) {
        setDevToken(res.data.resetToken);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-app text-theme-primary flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors">
      {/* Top Bar with Public Theme Selector */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-40">
        <ThemeSelector size="sm" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-theme-muted hover:text-terracotta mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sign In</span>
        </Link>

        <Card className="bg-theme-surface border-theme-border shadow-xl p-6 sm:p-8">
          <div className="mb-6 space-y-1">
            <div className="w-10 h-10 rounded-xl bg-terracotta/10 text-terracotta flex items-center justify-center mb-3">
              <Mail className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-theme-primary">Password Recovery</h2>
            <p className="text-xs text-theme-muted">
              Enter your registered email address to receive password reset instructions.
            </p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Reset link generated</span>
                </div>
                <p className="leading-relaxed">
                  If an account exists for <strong className="text-theme-primary">{email}</strong>, single-use reset credentials have been prepared.
                </p>
              </div>

              {devToken && (
                <div className="p-3.5 rounded-lg bg-theme-subtle border border-theme-border text-xs space-y-2">
                  <span className="font-bold text-brass block">Development Verification Link:</span>
                  <Link
                    to={`/reset-password?token=${devToken}`}
                    className="text-terracotta hover:underline font-mono text-[11px] break-all block"
                  >
                    Click here to reset your password directly
                  </Link>
                </div>
              )}

              <Link to="/login" className="block pt-2">
                <Button variant="outline" size="md" className="w-full">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="learner@finlearn.in"
                required
              />

              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
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
                Send Reset Link
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
