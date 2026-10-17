import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

export function SignupPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      // Seamlessly transition new user to onboarding
      navigate('/onboarding', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex flex-col justify-center py-12 px-6 sm:px-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-terracotta/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brass/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 mb-6 text-aubergine font-bold hover:text-terracotta transition-colors">
          <div className="w-8 h-8 rounded-lg bg-terracotta flex items-center justify-center font-bold text-white text-sm">
            ₹
          </div>
          <span className="text-xl font-extrabold tracking-tight">FinLearn</span>
        </Link>

        <Card className="bg-white/90 border-brass/25 shadow-lg p-6 sm:p-8">
          <div className="mb-6 space-y-1">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-aubergine">Create Account</h2>
              <Badge variant="success" size="sm" className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Phase 3 Secure
              </Badge>
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
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
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
