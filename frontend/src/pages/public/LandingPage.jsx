import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ThemeSelector } from '../../components/common/ThemeSelector';
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
    <div className="min-h-screen bg-theme-app text-theme-primary flex flex-col transition-colors">
      {/* Top Navigation */}
      <header className="h-20 border-b border-theme-border bg-theme-surface/85 backdrop-blur-md sticky top-0 z-40 px-6 sm:px-12 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-terracotta flex items-center justify-center font-bold text-white text-xl shadow-md">
            ₹
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-theme-primary">FinLearn</span>
            <span className="text-[10px] block text-brass font-bold tracking-widest uppercase -mt-1">
              Financial Literacy & Safety
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-theme-muted">
          <a href="#features" className="hover:text-terracotta transition-colors">Features</a>
          <a href="#safety" className="hover:text-terracotta transition-colors">Scam Defense</a>
          <a href="#learning" className="hover:text-terracotta transition-colors">Learning Lab</a>
          <a href="#borrowing" className="hover:text-terracotta transition-colors">Loan Calculator</a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeSelector size="sm" />
          <Link to="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link to="/signup">
            <Button variant="primary" size="sm">Create Account</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 px-6 sm:px-12 lg:px-20 border-b border-theme-border bg-gradient-to-b from-theme-surface/60 to-theme-subtle/40">
        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-terracotta/10 border border-terracotta/20 text-terracotta text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Empowering Indian Learners in Personal Finance
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-theme-primary tracking-tight leading-tight max-w-4xl mx-auto">
            Master Your Money, Understand Loans & <span className="text-terracotta underline decoration-brass/40">Defend Against Financial Scams</span>
          </h1>

          <p className="text-base sm:text-xl text-theme-muted max-w-2xl mx-auto leading-relaxed">
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

          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-theme-muted">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Exact Integer Paise Accounting</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Grounded AI Explanations</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
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
          <h2 className="text-3xl font-extrabold text-theme-primary tracking-tight">
            Built for Real-World Indian Finance
          </h2>
          <p className="text-sm text-theme-muted">
            Everything you need to track spending, meet recurring commitments, and elevate your financial literacy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-theme-surface border border-theme-border-strong shadow-xs space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-terracotta/15 flex items-center justify-center text-terracotta">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-theme-primary">Command Center & Cash Flow</h3>
            <p className="text-xs text-theme-muted leading-relaxed">
              Track income and expenses with exact paise precision. Category-wise budget limits, real-time utilization progress, and savings goals.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-theme-surface border border-theme-border-strong shadow-xs space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-theme-subtle flex items-center justify-center text-theme-primary">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-theme-primary">Financial Safety Lab</h3>
            <p className="text-xs text-theme-muted leading-relaxed">
              Identify advance-fee loan scams, fake KYC threats, and illegal trading groups. Direct emergency reporting links to 1930 & cybercrime.gov.in.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-theme-surface border border-theme-border-strong shadow-xs space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-brass/15 flex items-center justify-center text-brass-dark dark:text-brass-light">
              <Landmark className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-theme-primary">Smart Borrowing & EMI Guide</h3>
            <p className="text-xs text-theme-muted leading-relaxed">
              Calculate standard reducing-balance loan EMIs, handle 0% promotional interest, and compare deceptive flat-rate offers against true APR.
            </p>
          </div>
        </div>
      </section>

      {/* Safety Lab Callout Banner */}
      <section id="safety" className="py-16 px-6 sm:px-12 bg-theme-sidebar text-theme-sidebar-text border-y border-theme-sidebar-border">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <Badge variant="terracotta" size="sm">National Incident Support</Badge>
            <h2 className="text-2xl sm:text-3xl font-black text-theme-sidebar-text">
              Suspect Financial Cyber Fraud?
            </h2>
            <p className="text-xs sm:text-sm text-theme-sidebar-muted leading-relaxed">
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

      {/* Comprehensive Brand Footer */}
      <footer className="mt-auto py-14 px-6 sm:px-12 border-t border-theme-border bg-theme-surface text-xs text-theme-muted transition-colors">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1: Brand & Mission */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2 font-bold text-theme-primary">
                <div className="w-7 h-7 rounded-lg bg-terracotta text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  ₹
                </div>
                <span className="text-base font-extrabold tracking-tight">FinLearn</span>
              </div>
              <p className="text-[11px] text-theme-muted leading-relaxed">
                Money Lab is an interactive financial literacy and personal money management platform empowering users with practical budgeting, debt management, investment education, and fraud awareness.
              </p>
              <div className="pt-1 text-[10px] text-theme-muted font-mono">
                Integer Paise Math • Zero Hallucinations
              </div>
            </div>

            {/* Col 2: Learning & Guidance */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-theme-primary text-xs uppercase tracking-wider text-brass">
                Curriculum & Labs
              </h4>
              <ul className="space-y-1.5 text-xs text-theme-muted">
                <li><Link to="/learning" className="hover:text-terracotta transition-colors">Digital Reading Lab</Link></li>
                <li><Link to="/loans" className="hover:text-terracotta transition-colors">Smart Borrowing & EMI Math</Link></li>
                <li><Link to="/investments" className="hover:text-terracotta transition-colors">Compounding & Risk Guide</Link></li>
                <li><Link to="/safety" className="hover:text-terracotta transition-colors">Safety Lab & Scam Checker</Link></li>
                <li><Link to="/leaderboard" className="hover:text-terracotta transition-colors">Global Leaderboard</Link></li>
              </ul>
            </div>

            {/* Col 3: Money Management */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-theme-primary text-xs uppercase tracking-wider text-brass">
                Workspace Tools
              </h4>
              <ul className="space-y-1.5 text-xs text-theme-muted">
                <li><Link to="/app" className="hover:text-terracotta transition-colors">Financial Dashboard</Link></li>
                <li><Link to="/transactions" className="hover:text-terracotta transition-colors">Transaction Journal</Link></li>
                <li><Link to="/budgets" className="hover:text-terracotta transition-colors">50/30/20 Budgets & Targets</Link></li>
                <li><Link to="/commitments" className="hover:text-terracotta transition-colors">Recurring Commitments</Link></li>
                <li><Link to="/insights" className="hover:text-terracotta transition-colors">Reports & Analytics</Link></li>
              </ul>
            </div>

            {/* Col 4: Safety & Disclosures */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-theme-primary text-xs uppercase tracking-wider text-brass">
                Legal & Governance
              </h4>
              <p className="text-[11px] text-theme-muted leading-relaxed">
                FinLearn is strictly an educational platform. We do not broker loans, accept user deposits, or provide SEBI-registered stock recommendations.
              </p>
              <div className="pt-2 flex flex-col gap-1 text-[11px] text-theme-muted">
                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-terracotta transition-colors flex items-center gap-1 font-semibold"
                >
                  National Cyber Crime Portal ↗
                </a>
                <span className="text-[10px] text-theme-muted">Helpline: Dial 1930</span>
              </div>
            </div>
          </div>

          <div className="border-t border-theme-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-theme-muted">
            <div>
              © {new Date().getFullYear()} FinLearn — Money Lab. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <Link to="/login" className="hover:text-terracotta">Sign In</Link>
              <Link to="/signup" className="hover:text-terracotta">Create Account</Link>
              <Link to="/admin" className="hover:text-terracotta">Staff Portal</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
