import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Tabs } from '../../components/common/Tabs';
import { Loading } from '../../components/common/Loading';
import { EmptyState } from '../../components/common/EmptyState';
import { formatPaiseToINR, parseRupeesToPaise, formatDate } from '../../utils/formatters';
import api from '../../services/api';
import {
  PlusCircle,
  PiggyBank,
  Target,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  Trash2
} from 'lucide-react';

const BUDGET_CATEGORIES = [
  'Food & Groceries',
  'Housing & Rent',
  'Utilities & Bills',
  'Transportation',
  'Shopping & Essentials',
  'Healthcare & Medical',
  'Education & Courses',
  'Entertainment & Leisure',
  'Other Expense',
];

export function BudgetsPage() {
  const [activeTab, setActiveTab] = useState('budgets');
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal States
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  // New Budget Form
  const [bCategory, setBCategory] = useState('Food & Groceries');
  const [bLimit, setBLimit] = useState('');
  const [bThreshold, setBThreshold] = useState('80');
  const [bFormError, setBFormError] = useState('');
  const [bSubmitting, setBSubmitting] = useState(false);

  // New Goal Form
  const [gName, setGName] = useState('');
  const [gTarget, setGTarget] = useState('');
  const [gDate, setGDate] = useState('2027-03-31');
  const [gDeposit, setGDeposit] = useState('');
  const [gFormError, setGFormError] = useState('');
  const [gSubmitting, setGSubmitting] = useState(false);

  // Contribution Form
  const [cType, setCType] = useState('deposit');
  const [cAmount, setCAmount] = useState('');
  const [cNote, setCNote] = useState('');
  const [cFormError, setCFormError] = useState('');
  const [cSubmitting, setCSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [budRes, goalRes] = await Promise.all([
        api.get('/budgets'),
        api.get('/savings-goals'),
      ]);

      setBudgets(budRes?.data?.budgets || []);
      setGoals(goalRes?.data?.goals || []);
    } catch (err) {
      setError(err.message || 'Failed to load budgets and savings goals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    setBFormError('');
    const limitPaise = parseRupeesToPaise(bLimit);
    if (limitPaise <= 0) {
      setBFormError('Budget limit must be greater than zero');
      return;
    }

    try {
      setBSubmitting(true);
      const res = await api.post('/budgets', {
        category: bCategory,
        period: 'Current Month',
        limitPaise,
        thresholdPct: parseInt(bThreshold, 10) || 80,
      });

      if (res && res.data) {
        setBLimit('');
        setShowAddBudget(false);
        fetchData();
      }
    } catch (err) {
      setBFormError(err.message || 'Failed to create budget');
    } finally {
      setBSubmitting(false);
    }
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;
    try {
      await api.delete(`/budgets/${id}`);
      setBudgets(budgets.filter((b) => b.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete budget');
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    setGFormError('');
    const targetPaise = parseRupeesToPaise(gTarget);
    if (!gName.trim()) {
      setGFormError('Goal name is required');
      return;
    }
    if (targetPaise <= 0) {
      setGFormError('Target amount must be greater than zero');
      return;
    }

    try {
      setGSubmitting(true);
      const initialDepositPaise = parseRupeesToPaise(gDeposit);
      const res = await api.post('/savings-goals', {
        name: gName.trim(),
        targetPaise,
        targetDate: gDate || null,
        initialDepositPaise: initialDepositPaise > 0 ? initialDepositPaise : undefined,
      });

      if (res && res.data) {
        setGName('');
        setGTarget('');
        setGDeposit('');
        setShowAddGoal(false);
        fetchData();
      }
    } catch (err) {
      setGFormError(err.message || 'Failed to create savings goal');
    } finally {
      setGSubmitting(false);
    }
  };

  const handleContribute = async (e) => {
    e.preventDefault();
    setCFormError('');
    const amountPaise = parseRupeesToPaise(cAmount);
    if (amountPaise <= 0) {
      setCFormError('Amount must be greater than zero');
      return;
    }

    try {
      setCSubmitting(true);
      await api.post(`/savings-goals/${selectedGoal.id}/contributions`, {
        type: cType,
        amountPaise,
        note: cNote.trim(),
      });

      setCAmount('');
      setCNote('');
      setShowContributeModal(false);
      fetchData();
    } catch (err) {
      setCFormError(err.message || 'Transaction failed');
    } finally {
      setCSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-aubergine">
            Budgets & Savings Planner
          </h1>
          <p className="text-xs text-aubergine/70">
            Enforced spending boundaries and verified savings goal progress
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'budgets' ? (
            <Button
              variant="primary"
              size="sm"
              icon={PlusCircle}
              onClick={() => {
                setBFormError('');
                setShowAddBudget(true);
              }}
            >
              New Budget
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              icon={PlusCircle}
              onClick={() => {
                setGFormError('');
                setShowAddGoal(true);
              }}
            >
              New Goal
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Card className="bg-white/80 border-brass/25">
        <Tabs
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: 'budgets', label: 'Category Budgets', count: budgets.length },
            { id: 'goals', label: 'Savings Goals', count: goals.length },
          ]}
        />
      </Card>

      {/* Loading & Error States */}
      {loading ? (
        <Loading message="Loading budget allocations and savings progress..." />
      ) : error ? (
        <Card className="p-8 text-center bg-rose-50 border-rose-200">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-rose-800">Error Loading Data</h3>
          <p className="text-xs text-rose-600 mt-1">{error}</p>
          <Button variant="secondary" size="sm" onClick={fetchData} className="mt-4">
            Try Again
          </Button>
        </Card>
      ) : activeTab === 'budgets' ? (
        /* Budgets Grid */
        budgets.length === 0 ? (
          <EmptyState
            icon={PiggyBank}
            title="No Budgets Created"
            description="Establish spending limits for essential categories like Food, Rent, or Entertainment to guard against overspending."
            actionLabel="Create First Budget"
            onAction={() => setShowAddBudget(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {budgets.map((bud) => {
              const isOver = bud.isOverBudget;
              const isNear = bud.isNearThreshold && !isOver;
              return (
                <Card
                  key={bud.id}
                  className={`p-5 transition-shadow relative overflow-hidden ${
                    isOver
                      ? 'border-rose-400/80 bg-rose-50/20'
                      : isNear
                      ? 'border-amber-400/80 bg-amber-50/15'
                      : 'border-brass/25 bg-white/90'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-base font-bold text-aubergine">
                        {bud.category}
                      </h3>
                      <p className="text-[11px] text-aubergine/60">{bud.period}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isOver ? (
                        <Badge variant="terracotta" size="sm" className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Over Limit
                        </Badge>
                      ) : isNear ? (
                        <Badge variant="warning" size="sm">
                          {bud.utilizationPct}% Used
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          {bud.utilizationPct}% Used
                        </Badge>
                      )}

                      <button
                        onClick={() => handleDeleteBudget(bud.id)}
                        className="p-1 text-aubergine/30 hover:text-rose-600 transition-colors"
                        title="Delete budget"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-aubergine/70">
                        Spent: <strong>{formatPaiseToINR(bud.spentPaise)}</strong>
                      </span>
                      <span className="text-aubergine/70">
                        Limit: <strong>{formatPaiseToINR(bud.limitPaise)}</strong>
                      </span>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-ivory-dark overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOver
                            ? 'bg-rose-600'
                            : isNear
                            ? 'bg-amber-500'
                            : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(100, bud.utilizationPct || 0)}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-brass/15 flex items-center justify-between text-xs">
                    <span className="text-aubergine/70">Remaining</span>
                    <span
                      className={`font-mono font-bold ${
                        isOver ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {formatPaiseToINR(bud.remainingPaise)}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        /* Goals Grid */
        goals.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No Savings Goals Yet"
            description="Set a target for an emergency fund, home deposit, education, or travel to track your steady rupee accumulation."
            actionLabel="Create First Savings Goal"
            onAction={() => setShowAddGoal(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {goals.map((g) => {
              const isCompleted = g.status === 'completed';
              return (
                <Card
                  key={g.id}
                  className="p-5 border-brass/25 bg-white/90 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-base font-bold text-aubergine">{g.name}</h3>
                      <p className="text-[11px] text-aubergine/60">
                        {g.targetDate ? `Target: ${formatDate(g.targetDate)}` : 'No deadline'}
                      </p>
                    </div>

                    {isCompleted ? (
                      <Badge variant="success" size="sm" className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </Badge>
                    ) : (
                      <Badge variant="neutral" size="sm">
                        {g.progressPct}%
                      </Badge>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-aubergine/70">
                        Saved: <strong>{formatPaiseToINR(g.savedPaise)}</strong>
                      </span>
                      <span className="text-aubergine/70">
                        Target: <strong>{formatPaiseToINR(g.targetPaise)}</strong>
                      </span>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-ivory-dark overflow-hidden">
                      <div
                        className="h-full bg-terracotta rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, g.progressPct || 0)}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-brass/15 flex items-center justify-between">
                    <span className="text-xs text-aubergine/70">
                      Need <strong>{formatPaiseToINR(g.remainingPaise)}</strong>
                    </span>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedGoal(g);
                        setCType('deposit');
                        setCAmount('');
                        setCFormError('');
                        setShowContributeModal(true);
                      }}
                    >
                      Update Funds
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* New Budget Modal */}
      <Modal
        isOpen={showAddBudget}
        onClose={() => setShowAddBudget(false)}
        title="Create Category Budget"
      >
        <form onSubmit={handleCreateBudget} className="space-y-4">
          <Select
            label="Category"
            value={bCategory}
            onChange={(e) => setBCategory(e.target.value)}
            options={BUDGET_CATEGORIES.map((c) => ({ value: c, label: c }))}
          />

          <Input
            label="Monthly Limit (in Rupees)"
            value={bLimit}
            onChange={(e) => setBLimit(e.target.value)}
            placeholder="e.g. 15000"
            required
          />

          <Select
            label="Warning Threshold"
            value={bThreshold}
            onChange={(e) => setBThreshold(e.target.value)}
            options={[
              { value: '50', label: '50% of budget' },
              { value: '75', label: '75% of budget' },
              { value: '80', label: '80% of budget (Recommended)' },
              { value: '90', label: '90% of budget' },
            ]}
          />

          {bFormError && (
            <p className="text-xs text-rose-600 font-semibold">{bFormError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowAddBudget(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={bSubmitting}
            >
              Create Budget
            </Button>
          </div>
        </form>
      </Modal>

      {/* New Goal Modal */}
      <Modal
        isOpen={showAddGoal}
        onClose={() => setShowAddGoal(false)}
        title="Create Savings Goal"
      >
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <Input
            label="Goal Name"
            value={gName}
            onChange={(e) => setGName(e.target.value)}
            placeholder="e.g. Emergency Fund, Laptop, Down Payment"
            required
          />

          <Input
            label="Target Amount (in Rupees)"
            value={gTarget}
            onChange={(e) => setGTarget(e.target.value)}
            placeholder="e.g. 100000"
            required
          />

          <Input
            label="Initial Deposit (Optional)"
            value={gDeposit}
            onChange={(e) => setGDeposit(e.target.value)}
            placeholder="e.g. 5000"
          />

          <Input
            label="Target Date"
            type="date"
            value={gDate}
            onChange={(e) => setGDate(e.target.value)}
          />

          {gFormError && (
            <p className="text-xs text-rose-600 font-semibold">{gFormError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowAddGoal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={gSubmitting}
            >
              Start Goal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Contribution / Withdrawal Modal */}
      <Modal
        isOpen={showContributeModal}
        onClose={() => setShowContributeModal(false)}
        title={selectedGoal ? `Update Funds: ${selectedGoal.name}` : 'Update Funds'}
      >
        <form onSubmit={handleContribute} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setCType('deposit')}
              className={`py-2 px-3 text-xs font-bold rounded-lg border transition-colors ${
                cType === 'deposit'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-white border-brass/25 text-aubergine/70 hover:bg-ivory'
              }`}
            >
              Add Contribution (+)
            </button>
            <button
              type="button"
              onClick={() => setCType('withdrawal')}
              className={`py-2 px-3 text-xs font-bold rounded-lg border transition-colors ${
                cType === 'withdrawal'
                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                  : 'bg-white border-brass/25 text-aubergine/70 hover:bg-ivory'
              }`}
            >
              Record Withdrawal (-)
            </button>
          </div>

          <Input
            label="Amount (in Rupees)"
            value={cAmount}
            onChange={(e) => setCAmount(e.target.value)}
            placeholder="e.g. 2000"
            required
          />

          <Input
            label="Note (Optional)"
            value={cNote}
            onChange={(e) => setCNote(e.target.value)}
            placeholder="e.g. Diwal bonus allocation"
          />

          {cFormError && (
            <p className="text-xs text-rose-600 font-semibold">{cFormError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowContributeModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={cSubmitting}
            >
              Confirm
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default BudgetsPage;
