import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { EmptyState } from '../../components/common/EmptyState';
import { formatPaiseToINR } from '../../utils/formatters';
import { api } from '../../services/api';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  PieChart,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  Target,
  Clock,
  BookOpen,
  Award
} from 'lucide-react';

const PERIOD_OPTIONS = [
  { label: 'All Time', value: 'all' },
  { label: 'This Month', value: 'this-month' },
  { label: 'Last 30 Days', value: 'last-30' },
  { label: 'Last 90 Days', value: 'last-90' },
];

export function InsightsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchInsights = async (periodKey) => {
    setLoading(true);
    setErrorMsg('');
    try {
      let query = '';
      const now = new Date();
      if (periodKey === 'this-month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        query = `?startDate=${encodeURIComponent(startOfMonth)}`;
      } else if (periodKey === 'last-30') {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        query = `?startDate=${encodeURIComponent(thirtyDaysAgo)}`;
      } else if (periodKey === 'last-90') {
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        query = `?startDate=${encodeURIComponent(ninetyDaysAgo)}`;
      }

      const res = await api.get(`/insights${query}`);
      if (res?.data) {
        setInsights(res.data);
      }
    } catch (err) {
      console.warn('Failed to load insights:', err.message);
      setErrorMsg(err.message || 'Unable to load financial reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights(selectedPeriod);
  }, [selectedPeriod]);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('finlearn_token');
      const response = await fetch(`${api.baseUrl}/insights/export-csv`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate export file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'finlearn_transactions_report.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(`Export error: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const summary = insights?.summary || {
    totalIncomePaise: 0,
    totalExpensePaise: 0,
    netSavingsPaise: 0,
    savingsRatePercent: 0,
    totalTransactionsCount: 0,
  };

  const categoryBreakdown = insights?.categoryBreakdown || [];
  const budgets = insights?.budgets || [];
  const savingsGoals = insights?.savingsGoals || [];
  const commitments = insights?.commitments || {
    totalMonthlyCommitmentsPaise: 0,
    overdueCommitmentsCount: 0,
    activeList: [],
  };
  const learningStats = insights?.learningStats || {
    coursesEnrolled: 0,
    coursesCompleted: 0,
    quizzesAttempted: 0,
    quizzesPassed: 0,
    quizPassRate: 0,
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-aubergine">
            Reports & Financial Insights
          </h1>
          <p className="text-xs text-aubergine/70">
            Reconciled spending analytics • Categorized breakdowns • User-scoped data export
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={handleExportCSV}
            disabled={exporting}
          >
            {exporting ? 'Generating CSV...' : 'Export CSV Report'}
          </Button>
        </div>
      </div>

      {/* Period Filter Card */}
      <Card className="bg-white/80 border-brass/25">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-terracotta" />
            <span className="font-bold text-aubergine">Filter Period:</span>
            <div className="flex items-center gap-1.5 bg-ivory-dark p-1 rounded-lg border border-brass/20">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedPeriod(opt.value)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    selectedPeriod === opt.value
                      ? 'bg-aubergine text-ivory shadow-xs'
                      : 'text-aubergine/70 hover:text-aubergine'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <span className="text-[11px] text-aubergine/60 font-mono">
            Reconciled Transactions: <strong>{summary.totalTransactionsCount}</strong> logged
          </span>
        </div>
      </Card>

      {loading ? (
        <Loading message="Reconciling financial ledgers & reports..." />
      ) : errorMsg ? (
        <Card className="p-6 text-center text-xs text-rose-600 bg-rose-50 border-rose-200">
          <p>{errorMsg}</p>
        </Card>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 bg-white/90 border-brass/25">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-aubergine/60 uppercase">Total Inflow</span>
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-xl font-black font-mono text-emerald-700">
                  {formatPaiseToINR(summary.totalIncomePaise)}
                </span>
                <span className="block text-[11px] text-aubergine/60 mt-0.5">Reconciled Income</span>
              </div>
            </Card>

            <Card className="p-4 bg-white/90 border-brass/25">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-aubergine/60 uppercase">Total Outflow</span>
                <div className="p-2 rounded-lg bg-rose-50 text-rose-700">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-xl font-black font-mono text-rose-700">
                  {formatPaiseToINR(summary.totalExpensePaise)}
                </span>
                <span className="block text-[11px] text-aubergine/60 mt-0.5">Logged Expenses</span>
              </div>
            </Card>

            <Card className="p-4 bg-white/90 border-brass/25">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-aubergine/60 uppercase">Net Saved</span>
                <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className={`text-xl font-black font-mono ${
                  summary.netSavingsPaise >= 0 ? 'text-aubergine' : 'text-rose-700'
                }`}>
                  {formatPaiseToINR(summary.netSavingsPaise)}
                </span>
                <span className="block text-[11px] text-aubergine/60 mt-0.5">Surplus / Deficit</span>
              </div>
            </Card>

            <Card className="p-4 bg-white/90 border-brass/25">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-aubergine/60 uppercase">Savings Rate</span>
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-xl font-black font-mono text-aubergine">
                  {summary.savingsRatePercent}%
                </span>
                <span className="block text-[11px] text-aubergine/60 mt-0.5">
                  {summary.savingsRatePercent >= 20 ? 'Optimal (50-30-20 Rule)' : 'Below 20% Target'}
                </span>
              </div>
            </Card>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Expense Distribution List */}
            <Card
              title="Category-wise Expense Breakdown"
              subtitle="Reconciled distribution across spending categories"
            >
              {categoryBreakdown.length === 0 ? (
                <div className="p-8 text-center text-xs text-aubergine/60">
                  No expenses recorded in this reporting period.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {categoryBreakdown.map((item, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-aubergine">{item.category}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-aubergine/70">{formatPaiseToINR(item.amountPaise)}</span>
                          <span className="font-bold text-terracotta">({item.percentage}%)</span>
                        </div>
                      </div>

                      <div className="w-full h-2 rounded-full bg-ivory-dark overflow-hidden border border-brass/20">
                        <div
                          className="h-full bg-terracotta rounded-full transition-all"
                          style={{ width: `${Math.min(100, item.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Budget Utilization Status */}
            <Card
              title="Budget Utilization Status"
              subtitle="Current category spend reconciled against limits"
            >
              {budgets.length === 0 ? (
                <div className="p-8 text-center text-xs text-aubergine/60">
                  No active category budgets configured.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {budgets.map((b) => (
                    <div key={b.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-aubergine">{b.category}</span>
                          {b.isOverBudget && (
                            <Badge variant="terracotta" size="xs">Exceeded</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span>{formatPaiseToINR(b.spentPaise)}</span>
                          <span className="text-aubergine/40">/</span>
                          <span className="text-aubergine/70">{formatPaiseToINR(b.budgetPaise)}</span>
                          <span className={`font-bold ${b.isOverBudget ? 'text-rose-600' : 'text-aubergine'}`}>
                            ({b.utilizationPercent}%)
                          </span>
                        </div>
                      </div>

                      <div className="w-full h-2 rounded-full bg-ivory-dark overflow-hidden border border-brass/20">
                        <div
                          className={`h-full rounded-full transition-all ${
                            b.isOverBudget ? 'bg-rose-600' : b.utilizationPercent >= 80 ? 'bg-amber-500' : 'bg-emerald-600'
                          }`}
                          style={{ width: `${Math.min(100, b.utilizationPercent)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Bottom Grid: Commitments & Learning Achievements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recurring Commitments Summary */}
            <Card
              title="Monthly Commitments & Due Dates"
              subtitle="Scheduled obligations and recurring payments"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-ivory-dark border border-brass/20 text-xs">
                  <span className="font-bold text-aubergine">Total Monthly Commitments:</span>
                  <span className="font-mono font-bold text-aubergine">
                    {formatPaiseToINR(commitments.totalMonthlyCommitmentsPaise)}
                  </span>
                </div>

                {commitments.activeList && commitments.activeList.length > 0 ? (
                  <div className="divide-y divide-brass/10">
                    {commitments.activeList.slice(0, 4).map((c) => (
                      <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-aubergine block">{c.title}</span>
                          <span className="text-[11px] text-aubergine/60">{c.type}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold block">{formatPaiseToINR(c.amountPaise)}</span>
                          {c.isOverdue ? (
                            <span className="text-[10px] text-rose-600 font-bold">Overdue</span>
                          ) : (
                            <span className="text-[10px] text-aubergine/60">
                              Due {c.dueDate ? new Date(c.dueDate).toLocaleDateString() : 'Active'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-aubergine/60 text-center py-4">No recurring commitments tracked.</p>
                )}
              </div>
            </Card>

            {/* Learning Progression Overview */}
            <Card
              title="Learning Lab Achievements & Progression"
              subtitle="Educational milestone tracking"
            >
              <div className="space-y-3.5 text-xs">
                <div className="p-3.5 rounded-xl bg-ivory-dark border border-brass/20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-terracotta" />
                    <div>
                      <span className="font-bold text-aubergine block">Courses Enrolled & Finished</span>
                      <span className="text-[11px] text-aubergine/60">
                        {learningStats.coursesCompleted} of {learningStats.coursesEnrolled || 1} Completed
                      </span>
                    </div>
                  </div>
                  <Badge variant="terracotta" size="md">
                    {learningStats.coursesEnrolled > 0
                      ? `${Math.round((learningStats.coursesCompleted / learningStats.coursesEnrolled) * 100)}%`
                      : 'Active'}
                  </Badge>
                </div>

                <div className="p-3.5 rounded-xl bg-ivory-dark border border-brass/20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="font-bold text-aubergine block">Quiz Assessments Passed</span>
                      <span className="text-[11px] text-aubergine/60">
                        {learningStats.quizzesPassed} of {learningStats.quizzesAttempted} passed
                      </span>
                    </div>
                  </div>
                  <Badge variant={learningStats.quizPassRate >= 60 ? 'success' : 'default'} size="md">
                    {learningStats.quizPassRate}% Pass Rate
                  </Badge>
                </div>

                <div className="p-3 rounded-xl bg-ivory-surface border border-brass/15 text-[11px] text-aubergine/80 space-y-1">
                  <span className="font-bold text-aubergine">Data Integrity Guarantee:</span>
                  <p>
                    All report metrics are server-computed directly from your user ledger. Individual values reconcile to the exact paisa (1 INR = 100 Paise).
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default InsightsPage;
