import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Loading } from '../../components/common/Loading';
import { EmptyState } from '../../components/common/EmptyState';
import { formatPaiseToINR, parseRupeesToPaise, formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  PiggyBank,
  CalendarClock,
  Sparkles,
  GraduationCap,
  ShieldAlert,
  AlertCircle,
  Receipt
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CATEGORIES = [
  'Food & Groceries',
  'Housing & Rent',
  'Utilities & Bills',
  'Transportation',
  'Shopping & Essentials',
  'Healthcare & Medical',
  'Education & Courses',
  'Entertainment & Leisure',
  'Salary & Wages',
  'Freelance & Consulting',
  'Other Expense',
  'Other Income',
];

export function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State for quick Add Transaction modal
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState('expense');
  const [newCategory, setNewCategory] = useState('Food & Groceries');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/dashboard/summary');
      if (res && res.data) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard summary');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!newTitle.trim()) {
      setFormError('Please enter a title');
      return;
    }

    const amountPaise = parseRupeesToPaise(newAmount);
    if (!amountPaise || amountPaise <= 0) {
      setFormError('Amount must be greater than zero');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/transactions', {
        title: newTitle.trim(),
        type: newType,
        category: newCategory,
        amountPaise,
        date: new Date().toISOString(),
      });

      setNewTitle('');
      setNewAmount('');
      setShowAddModal(false);
      fetchSummary();
    } catch (err) {
      setFormError(err.message || 'Failed to record transaction');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loading message="Loading unified financial command center..." />;
  }

  if (error) {
    return (
      <Card className="p-8 text-center bg-rose-50 border-rose-200">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-rose-800">Error Loading Financial Summary</h3>
        <p className="text-xs text-rose-600 mt-1">{error}</p>
        <Button variant="secondary" size="sm" onClick={fetchSummary} className="mt-4">
          Try Again
        </Button>
      </Card>
    );
  }

  const financials = data?.financials || { totalIncomePaise: 0, totalExpensePaise: 0, netCashFlowPaise: 0 };
  const budgets = data?.budgets || [];
  const savingsGoals = data?.savingsGoals || [];
  const commitments = data?.commitments || { upcoming: [], overdue: [] };
  const recentTransactions = data?.recentTransactions || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-aubergine text-ivory border border-aubergine-light shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-brass-light uppercase tracking-wider">
              Unified Money Center
            </span>
            <Badge variant="terracotta" size="sm">Phase 4 Active</Badge>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-ivory">
            Namaste, {user?.name || 'Learner'}
          </h2>
          <p className="text-xs text-lilac-light">
            All amounts stored in 64-bit integer paise • Real user data • Zero floating drift
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={PlusCircle}
            onClick={() => {
              setFormError('');
              setShowAddModal(true);
            }}
          >
            Record Transaction
          </Button>
          <Link to="/ai-coach">
            <Button
              variant="outline"
              size="sm"
              icon={Sparkles}
              className="text-ivory border-brass/50 hover:bg-aubergine-light"
            >
              Ask AI Coach
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards Row (Income, Expenses, Net Cash Flow, Gamification XP) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income Card */}
        <Card className="bg-white/80 border-brass/25">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-aubergine/60">
              Total Income
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-aubergine">
            {formatPaiseToINR(financials.totalIncomePaise)}
          </div>
          <p className="text-[11px] text-aubergine/60 mt-1">
            Current reporting period
          </p>
        </Card>

        {/* Total Expenses Card */}
        <Card className="bg-white/80 border-brass/25">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-aubergine/60">
              Total Expenses
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-aubergine">
            {formatPaiseToINR(financials.totalExpensePaise)}
          </div>
          <p className="text-[11px] text-aubergine/60 mt-1">
            Current reporting period
          </p>
        </Card>

        {/* Net Cash Flow Card */}
        <Card className="bg-white/80 border-brass/25">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-aubergine/60">
              Net Cash Flow
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              financials.netCashFlowPaise >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black ${
            financials.netCashFlowPaise >= 0 ? 'text-aubergine' : 'text-rose-700'
          }`}>
            {formatPaiseToINR(financials.netCashFlowPaise)}
          </div>
          <p className="text-[11px] text-aubergine/60 mt-1">
            {financials.netCashFlowPaise >= 0 ? 'Surplus available' : 'Deficit this period'}
          </p>
        </Card>

        {/* Gamification Mastery Card */}
        <Card className="bg-white/80 border-brass/25">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-aubergine/60">
              Learning XP & Streak
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-aubergine font-mono flex items-center gap-1.5">
            <span>{data?.gamification?.totalXp || 0}</span>
            <span className="text-xs font-bold text-amber-600 uppercase font-sans">XP</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-aubergine/60 mt-1">
            <span>{data?.gamification?.currentStreak || 0}d active streak</span>
            <Link to="/quiz" className="font-semibold text-terracotta hover:underline">
              Assessments →
            </Link>
          </div>
        </Card>
      </div>

      {/* Main Grid: Left Column (Commitments + Budgets), Right Column (Recent Transactions + Goals) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Commitments & Due Items Widget */}
          <Card
            title="Scheduled & Overdue Commitments"
            subtitle="Never miss an EMI or utility due date • Avoid penalty fees"
            action={
              <Link to="/commitments">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            }
          >
            {commitments.upcoming.length === 0 && commitments.overdue.length === 0 ? (
              <p className="text-xs text-aubergine/60 py-4 text-center">
                No scheduled commitments. Add an EMI or utility bill to track payment calendars.
              </p>
            ) : (
              <div className="space-y-3">
                {commitments.overdue.slice(0, 2).map((com) => (
                  <div
                    key={com.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-rose-50/30 border border-rose-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                        {com.type}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-aubergine">{com.title}</h4>
                        <p className="text-[11px] text-rose-600 font-medium">Overdue • Due on {formatDate(com.dueDate)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-aubergine block">
                        {formatPaiseToINR(com.amountPaise)}
                      </span>
                      <Badge variant="terracotta" size="sm">Overdue</Badge>
                    </div>
                  </div>
                ))}

                {commitments.upcoming.slice(0, 3).map((com) => (
                  <div
                    key={com.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-ivory-dark border border-brass/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-terracotta/10 text-terracotta flex items-center justify-center font-bold text-xs">
                        {com.type}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-aubergine">{com.title}</h4>
                        <p className="text-[11px] text-aubergine/60">Due on {formatDate(com.dueDate)} • {com.recurrence}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-aubergine block">
                        {formatPaiseToINR(com.amountPaise)}
                      </span>
                      <Badge variant="neutral" size="sm">Scheduled</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Budgets & Spending Utilization Widget */}
          <Card
            title="Budget Utilization"
            subtitle="Current month category thresholds"
            action={
              <Link to="/budgets">
                <Button variant="ghost" size="sm">Manage Budgets</Button>
              </Link>
            }
          >
            {budgets.length === 0 ? (
              <p className="text-xs text-aubergine/60 py-4 text-center">
                No active category budgets. Set a monthly limit to monitor spending thresholds.
              </p>
            ) : (
              <div className="space-y-4">
                {budgets.slice(0, 4).map((bud) => {
                  const pct = Math.min(100, bud.utilizationPct || 0);
                  return (
                    <div key={bud.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-aubergine">{bud.category}</span>
                        <span className="text-aubergine/70 font-mono">
                          {formatPaiseToINR(bud.spentPaise)} / {formatPaiseToINR(bud.limitPaise)} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-ivory-dark overflow-hidden border border-brass/20">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct >= 90 ? 'bg-rose-600' : pct >= 75 ? 'bg-terracotta' : 'bg-brass'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (1 Col wide on desktop) */}
        <div className="space-y-6">
          {/* Savings Goals Widget */}
          <Card
            title="Savings Goals"
            subtitle="Progress toward targets"
            action={
              <Link to="/budgets">
                <Button variant="ghost" size="sm">View</Button>
              </Link>
            }
          >
            {savingsGoals.length === 0 ? (
              <p className="text-xs text-aubergine/60 py-4 text-center">
                No savings goals. Start an emergency fund or milestone target.
              </p>
            ) : (
              <div className="space-y-3">
                {savingsGoals.slice(0, 3).map((goal) => {
                  const pct = Math.min(100, goal.progressPct || 0);
                  return (
                    <div key={goal.id} className="p-3.5 rounded-xl bg-ivory-dark border border-brass/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-aubergine">{goal.name}</span>
                        <span className="text-xs font-black text-terracotta">{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-brass/20 overflow-hidden">
                        <div className="h-full bg-terracotta rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-aubergine/60 font-mono">
                        <span>Saved: {formatPaiseToINR(goal.savedPaise)}</span>
                        <span>Target: {formatPaiseToINR(goal.targetPaise)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Quick Learning Lab Progress Card */}
          <Card
            title="Learning Lab Streak"
            subtitle="Keep your financial literacy sharp"
            variant="brand"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-terracotta flex items-center justify-center text-white">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-ivory">Money Fundamentals</h4>
                  <p className="text-[11px] text-lilac">4 of 6 Lessons Completed (66%)</p>
                </div>
              </div>
              <Link to="/learning">
                <Button variant="primary" size="sm" className="w-full mt-2">
                  Resume Lesson 5
                </Button>
              </Link>
            </div>
          </Card>

          {/* Quick Safety Red Flag Notice */}
          <div className="p-4 rounded-xl bg-terracotta/10 border border-terracotta/25 flex items-start gap-3 text-xs text-aubergine">
            <ShieldAlert className="w-5 h-5 text-terracotta shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-terracotta block">Safety Reminder</span>
              <p className="text-[11px] text-aubergine/80 mt-0.5">
                Never enter your UPI PIN to receive money. If defrauded, contact 1930 immediately.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <Card
        title="Recent Transactions"
        subtitle="Chronological expense diary entries"
        action={
          <Link to="/transactions">
            <Button variant="ghost" size="sm">All Transactions</Button>
          </Link>
        }
      >
        {recentTransactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No Recent Transactions"
            description="Your recent income and expense diary entries will show here."
            actionLabel="Add Transaction"
            onAction={() => setShowAddModal(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-aubergine">
              <thead>
                <tr className="border-b border-brass/20 text-aubergine/60 uppercase tracking-wider font-bold">
                  <th className="py-2.5 px-3">Title / Note</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brass/10">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-ivory-dark/60 transition-colors">
                    <td className="py-3 px-3 font-semibold text-aubergine">
                      {tx.title}
                    </td>
                    <td className="py-3 px-3 text-aubergine/70">
                      <Badge variant="default" size="sm">{tx.category}</Badge>
                    </td>
                    <td className="py-3 px-3 text-aubergine/60 font-mono">
                      {formatDate(tx.date)}
                    </td>
                    <td className={`py-3 px-3 text-right font-bold font-mono ${
                      tx.type === 'income' ? 'text-emerald-700' : 'text-aubergine'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{formatPaiseToINR(tx.amountPaise)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Transaction Modal Dialog */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Record New Transaction"
        subtitle="Stored as integer paise with user data isolation"
      >
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <Input
            label="Transaction Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Metro Card Recharge"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Type"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              options={[
                { value: 'expense', label: 'Expense (-)' },
                { value: 'income', label: 'Income (+)' },
              ]}
            />

            <Select
              label="Category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              options={CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
          </div>

          <Input
            label="Amount (in Rupees)"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            placeholder="e.g. 450.00"
            required
          />

          {formError && (
            <p className="text-xs text-rose-600 font-semibold">{formError}</p>
          )}

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-brass/15">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
            >
              Save Transaction
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default DashboardPage;
