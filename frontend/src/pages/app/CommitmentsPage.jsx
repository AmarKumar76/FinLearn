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
  CalendarClock,
  CheckCircle,
  AlertCircle,
  Info,
  Archive,
  Clock
} from 'lucide-react';

const COMMITMENT_TYPES = [
  'EMI',
  'SIP',
  'Rent',
  'Insurance Premium',
  'Utility Bill',
  'Subscription',
  'Education Fee',
  'Credit Card',
  'Custom',
];

export function CommitmentsPage() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState('EMI');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [recurrence, setRecurrence] = useState('Monthly');
  const [notes, setNotes] = useState('');

  const fetchCommitments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/commitments');
      setCommitments(res?.data?.commitments || []);
    } catch (err) {
      setError(err.message || 'Failed to load commitments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommitments();
  }, [fetchCommitments]);

  const upcomingList = commitments.filter((c) => c.status !== 'Paid');
  const historyList = commitments.filter((c) => c.status === 'Paid' || (c.paymentHistory && c.paymentHistory.length > 0));

  const handleMarkPaid = async (commitment) => {
    const idempotencyKey = `pay_${commitment.id}_${Date.now()}`;
    try {
      await api.post(`/commitments/${commitment.id}/payments`, {
        amountPaise: commitment.amountPaise,
        idempotencyKey,
        notes: 'User reported manual payment',
      });
      fetchCommitments();
    } catch (err) {
      alert(err.message || 'Failed to record payment');
    }
  };

  const handleArchive = async (id) => {
    if (!window.confirm('Archive this commitment? Historical payment records will be preserved.')) return;
    try {
      await api.patch(`/commitments/${id}/archive`);
      fetchCommitments();
    } catch (err) {
      alert(err.message || 'Failed to archive commitment');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Commitment name is required');
      return;
    }

    const amountPaise = parseRupeesToPaise(amount);
    if (!amountPaise || amountPaise <= 0) {
      setFormError('Amount must be greater than zero');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/commitments', {
        title: title.trim(),
        type,
        amountPaise,
        dueDate,
        recurrence,
        notes: notes.trim(),
      });

      if (res && res.data) {
        setTitle('');
        setAmount('');
        setNotes('');
        setShowAddModal(false);
        fetchCommitments();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create commitment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-aubergine">
            Commitments & Payment Calendar
          </h1>
          <p className="text-xs text-aubergine/70">
            EMIs, SIPs, Rent, and recurring obligations • Month-end clamped recurrence
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={PlusCircle}
          onClick={() => {
            setFormError('');
            setShowAddModal(true);
          }}
        >
          Add Commitment
        </Button>
      </div>

      {/* Regulatory / Domain disclaimer banner */}
      <div className="p-3.5 rounded-xl bg-ivory-dark border border-brass/25 flex items-start gap-2.5 text-xs text-aubergine/80">
        <Info className="w-4 h-4 text-brass-dark shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>User-Reported Status Notice:</strong> Marking an item as 'Paid' records your personal logging confirmation. FinLearn never initiates bank debits or claims external bank reconciliation.
        </p>
      </div>

      {/* Tabs */}
      <Card className="bg-white/80 border-brass/25">
        <Tabs
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: 'upcoming', label: 'Scheduled & Overdue', count: upcomingList.length },
            { id: 'history', label: 'Payment History', count: historyList.length },
          ]}
        />
      </Card>

      {/* Loading & Error States */}
      {loading ? (
        <Loading message="Loading financial commitments and payment history..." />
      ) : error ? (
        <Card className="p-8 text-center bg-rose-50 border-rose-200">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-rose-800">Error Loading Commitments</h3>
          <p className="text-xs text-rose-600 mt-1">{error}</p>
          <Button variant="secondary" size="sm" onClick={fetchCommitments} className="mt-4">
            Try Again
          </Button>
        </Card>
      ) : activeTab === 'upcoming' ? (
        upcomingList.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No Scheduled Commitments"
            description="Track home loan EMIs, mutual fund SIPs, rent, or insurance premiums with automatic next-cycle recurrence."
            actionLabel="Add First Commitment"
            onAction={() => setShowAddModal(true)}
          />
        ) : (
          <div className="space-y-3">
            {upcomingList.map((com) => {
              const isOverdue = com.isOverdue;
              const isDueToday = com.isDueToday;
              return (
                <Card
                  key={com.id}
                  className={`p-4 flex items-center justify-between transition-colors bg-white/90 ${
                    isOverdue
                      ? 'border-rose-400/80 bg-rose-50/20'
                      : isDueToday
                      ? 'border-amber-400/80 bg-amber-50/20'
                      : 'border-brass/25'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isOverdue
                          ? 'bg-rose-100 text-rose-700'
                          : isDueToday
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-lilac/30 text-aubergine'
                      }`}
                    >
                      <CalendarClock className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-aubergine truncate">
                          {com.title}
                        </h4>
                        <Badge variant="neutral" size="sm">
                          {com.type}
                        </Badge>
                        {isOverdue && (
                          <Badge variant="terracotta" size="sm">
                            Overdue
                          </Badge>
                        )}
                        {isDueToday && (
                          <Badge variant="warning" size="sm">
                            Due Today
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-aubergine/60 mt-0.5">
                        <span>Recurrence: <strong>{com.recurrence}</strong></span>
                        <span>•</span>
                        <span>Due: <strong>{formatDate(com.dueDate)}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono font-bold text-sm sm:text-base text-aubergine">
                      {formatPaiseToINR(com.amountPaise)}
                    </span>

                    <Button
                      variant="primary"
                      size="sm"
                      icon={CheckCircle}
                      onClick={() => handleMarkPaid(com)}
                    >
                      Mark Paid
                    </Button>

                    <button
                      onClick={() => handleArchive(com.id)}
                      className="p-1.5 text-aubergine/30 hover:text-aubergine transition-colors"
                      title="Archive commitment"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        /* History List */
        historyList.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No Payment Records Yet"
            description="When you mark commitments as paid, your auditable payment history will be preserved here."
          />
        ) : (
          <div className="space-y-3">
            {historyList.map((com) => (
              <Card key={com.id} className="p-4 border-brass/25 bg-white/90">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-aubergine">{com.title}</h4>
                    <Badge variant="neutral" size="sm">{com.type}</Badge>
                    <Badge variant="success" size="sm">History Active</Badge>
                  </div>
                  <span className="font-mono font-bold text-xs text-aubergine/70">
                    Recurring: {com.recurrence}
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-brass/10">
                  {com.paymentHistory && com.paymentHistory.length > 0 ? (
                    com.paymentHistory.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded bg-ivory/50"
                      >
                        <span className="text-aubergine/70">
                          Paid on {formatDate(p.paidDate)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-700">
                            {formatPaiseToINR(p.amountPaise)}
                          </span>
                          <span className="text-[10px] text-aubergine/40">(User-Reported)</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-aubergine/60">Marked completed</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Add Commitment Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Recurring Commitment"
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <Input
            label="Commitment Name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. HDFC Home Loan EMI, SIP Bluechip, Monthly Rent"
            required
          />

          <Select
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={COMMITMENT_TYPES.map((t) => ({ value: t, label: t }))}
          />

          <Input
            label="Amount (in Rupees)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 12500"
            required
          />

          <Input
            label="Next Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />

          <Select
            label="Recurrence"
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value)}
            options={[
              { value: 'Monthly', label: 'Monthly (Clamps 31st to 28th/30th)' },
              { value: 'Quarterly', label: 'Quarterly' },
              { value: 'Annually', label: 'Annually' },
              { value: 'One-time', label: 'One-time' },
            ]}
          />

          <Input
            label="Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Account or folio reference"
          />

          {formError && (
            <p className="text-xs text-rose-600 font-semibold">{formError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
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
              Schedule Commitment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default CommitmentsPage;
