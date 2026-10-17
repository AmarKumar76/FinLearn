import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import {
  ShieldCheck,
  TrendingUp,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Landmark,
  Lock,
  CheckCircle,
  HelpCircle,
  ChevronRight,
  Smartphone,
  AlertTriangle
} from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-ivory text-aubergine flex flex-col">
      {/* Top Navigation */}
      <header className="h-20 border-b border-brass/20 bg-ivory/80 backdrop-blur-md sticky top-0 z-40 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-terracotta flex items-center justify-center font-bold text-white text-xl shadow-md">
            ₹
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-aubergine">FinLearn</span>
            <span className="text-[10px] block text-brass font-bold tracking-widest uppercase -mt-1">
              Financial Literacy & Safety
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-aubergine/80">
          <a href="#features" className="hover:text-terracotta transition-colors">Features</a>
          <a href="#safety" className="hover:text-terracotta transition-colors">Scam Defense</a>
          <a href="#learning" className="hover:text-terracotta transition-colors">Learning Lab</a>
          <a href="#borrowing" className="hover:text-terracotta transition-colors">Loan Calculator</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link to="/signup">
            <Button variant="primary" size="sm">Create Account</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 px-6 sm:px-12 lg:px-20 border-b border-brass/20 bg-gradient-to-b from-ivory to-lilac/10">
        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-terracotta/10 border border-terracotta/20 text-terracotta text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Empowering Indian Learners in Personal Finance
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-aubergine tracking-tight leading-tight max-w-4xl mx-auto">
            Master Your Money, Understand Loans & <span className="text-terracotta underline decoration-brass/40">Defend Against Financial Scams</span>
          </h1>

          <p className="text-base sm:text-xl text-aubergine/75 max-w-2xl mx-auto leading-relaxed">
            The unified financial platform for students, salaried professionals, and self-employed individuals across India. Honest tracking, transparent calculations, and zero misleading investment advice.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link to="/signup">
              <Button variant="primary" size="lg" icon={ArrowRight}>
                Get Started Free
              </Button>
            </Link>
            <Link to="/app">
              <Button variant="outline" size="lg" icon={TrendingUp}>
                Explore Live Demo
              </Button>
            </Link>
          </div>

          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-aubergine/70">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-700" />
              <span>Exact Integer Paise Accounting</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-700" />
              <span>Grounded AI Explanations</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-700" />
              <span>Zero Bank Passwords / OTP Collection</span>
            </div>
          </div>
        </div>

        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-terracotta/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="py-20 px-6 sm:px-12 lg:px-20 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <Badge variant="brass" size="sm">Core Architecture</Badge>
          <h2 className="text-3xl font-extrabold text-aubergine tracking-tight">
            Built for Real-World Indian Finance
          </h2>
          <p className="text-sm text-aubergine/70">
            Everything you need to track spending, meet recurring commitments, and elevate your financial literacy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-white border border-brass/25 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-terracotta/15 flex items-center justify-center text-terracotta">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-aubergine">Command Center & Cash Flow</h3>
            <p className="text-xs text-aubergine/70 leading-relaxed">
              Track income and expenses with exact paise precision. Category-wise budget limits, real-time utilization progress, and savings goals.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-white border border-brass/25 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-aubergine/15 flex items-center justify-center text-aubergine">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-aubergine">Financial Safety Lab</h3>
            <p className="text-xs text-aubergine/70 leading-relaxed">
              Identify advance-fee loan scams, fake KYC threats, and illegal trading groups. Direct emergency reporting links to 1930 & cybercrime.gov.in.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-white border border-brass/25 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-brass/15 flex items-center justify-center text-brass-dark">
              <Landmark className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-aubergine">Smart Borrowing & EMI Guide</h3>
            <p className="text-xs text-aubergine/70 leading-relaxed">
              Calculate standard reducing-balance loan EMIs, handle 0% promotional interest, and compare deceptive flat-rate offers against true APR.
            </p>
          </div>
        </div>
      </section>

      {/* Safety Lab Callout Banner */}
      <section id="safety" className="py-16 px-6 sm:px-12 bg-aubergine text-ivory">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <Badge variant="terracotta" size="sm">National Incident Support</Badge>
            <h2 className="text-2xl sm:text-3xl font-black text-ivory">
              Suspect Financial Cyber Fraud?
            </h2>
            <p className="text-xs sm:text-sm text-lilac-light leading-relaxed">
              Never share your UPI PIN or OTP. If you have transferred money under false pretenses, report immediately to the National Cyber Crime Reporting Portal or call the 1930 helpline within the golden hour.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <a
              href="https://www.cybercrime.gov.in"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-terracotta hover:bg-terracotta-hover text-white font-bold text-sm transition-colors shadow-md"
            >
              <span>Visit Cybercrime.gov.in</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 px-6 sm:px-12 border-t border-brass/20 bg-ivory-dark text-xs text-aubergine/70">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-aubergine">
            <div className="w-6 h-6 rounded bg-terracotta text-white flex items-center justify-center text-xs">₹</div>
            <span>FinLearn Platform</span>
            <span className="text-[11px] font-normal text-aubergine/60">• Version 1.0 (Phase 2 UI)</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/app" className="hover:text-terracotta">App Dashboard</Link>
            <Link to="/login" className="hover:text-terracotta">Sign In</Link>
            <Link to="/signup" className="hover:text-terracotta">Sign Up</Link>
            <Link to="/admin" className="hover:text-terracotta">Admin Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
