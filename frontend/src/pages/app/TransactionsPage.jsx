import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Tabs } from '../../components/common/Tabs';
import { EmptyState } from '../../components/common/EmptyState';
import { Loading } from '../../components/common/Loading';
import { formatPaiseToINR, parseRupeesToPaise, formatDate } from '../../utils/formatters';
import api from '../../services/api';
import {
  PlusCircle,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Calendar,
  AlertCircle,
  Receipt
} from 'lucide-react';

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
  'Investments & Dividends',
  'Gifts & Grants',
  'Other Expense',
  'Other Income',
];

export function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Food & Groceries');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  // Fetch transactions from API
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/transactions?limit=100');
      if (res && res.data && Array.isArray(res.data.transactions)) {
        setTransactions(res.data.transactions);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Client-side quick filter on current batch
  const filtered = transactions.filter((t) => {
    if (activeTab === 'income' && t.type !== 'income') return false;
    if (activeTab === 'expense' && t.type !== 'expense') return false;
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Please enter a transaction title');
      return;
    }

    const amountPaise = parseRupeesToPaise(amount);
    if (!amountPaise || amountPaise <= 0) {
      setFormError('Amount must be greater than zero');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/transactions', {
        title: title.trim(),
        type,
        category,
        amountPaise,
        date,
        description: description.trim(),
      });

      if (res && res.data && res.data.transaction) {
        setTransactions([res.data.transaction, ...transactions]);
        setTitle('');
        setAmount('');
        setDescription('');
        setShowAddModal(false);
      }
    } catch (err) {
      setFormError(err.message || 'Failed to record transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      await api.delete(`/transactions/${id}`);
      setTransactions(transactions.filter((t) => t.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete transaction');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-aubergine">
            Transactions & Expense Diary
          </h1>
          <p className="text-xs text-aubergine/70">
            Real user-owned records stored in integer paise • Zero float rounding distortion
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
          Add Transaction
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-white/80 border-brass/25">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Tabs
            activeTab={activeTab}
            onChange={setActiveTab}
            tabs={[
              { id: 'all', label: 'All Records', count: transactions.length },
              { id: 'expense', label: 'Expenses', count: transactions.filter((t) => t.type === 'expense').length },
              { id: 'income', label: 'Income', count: transactions.filter((t) => t.type === 'income').length },
            ]}
          />

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-aubergine/40 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-brass/30 bg-ivory-surface text-aubergine focus:outline-none focus:ring-2 focus:ring-terracotta"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs px-3 py-2 rounded-lg border border-brass/30 bg-ivory-surface text-aubergine focus:outline-none focus:ring-2 focus:ring-terracotta"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Loading & Error States */}
      {loading ? (
        <Loading message="Loading verified transaction records..." />
      ) : error ? (
        <Card className="p-8 text-center bg-rose-50 border-rose-200">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-rose-800">Error Loading Transactions</h3>
          <p className="text-xs text-rose-600 mt-1">{error}</p>
          <Button variant="secondary" size="sm" onClick={fetchTransactions} className="mt-4">
            Try Again
          </Button>
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={searchQuery || selectedCategory !== 'all' ? 'No Matching Transactions' : 'No Transactions Recorded Yet'}
          description={
            searchQuery || selectedCategory !== 'all'
              ? 'Try adjusting your search query or category filter.'
              : 'Add your first income or expense entry to begin tracking your financial footprint with exact rupee precision.'
          }
          actionLabel="Record First Transaction"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        /* Transactions List */
        <div className="space-y-2.5">
          {filtered.map((txn) => {
            const isIncome = txn.type === 'income';
            return (
              <Card
                key={txn.id}
                className="p-4 flex items-center justify-between hover:border-brass/50 transition-colors bg-white/90"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowDownRight className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-aubergine truncate">
                      {txn.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-aubergine/60 mt-0.5">
                      <span className="font-medium text-aubergine/80">
                        {txn.category}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(txn.date)}
                      </span>
                      {txn.description && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[200px]">
                            {txn.description}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span
                    className={`font-mono font-bold text-sm sm:text-base ${
                      isIncome ? 'text-emerald-700' : 'text-aubergine'
                    }`}
                  >
                    {isIncome ? '+' : '-'}
                    {formatPaiseToINR(txn.amountPaise)}
                  </span>

                  <button
                    onClick={() => handleDelete(txn.id)}
                    className="p-1.5 rounded-lg text-aubergine/40 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete record"
                    aria-label="Delete transaction"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Transaction Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Record New Transaction"
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 px-3 text-xs font-bold rounded-lg border transition-colors ${
                type === 'expense'
                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                  : 'bg-white border-brass/25 text-aubergine/70 hover:bg-ivory'
              }`}
            >
              Expense (-)
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 px-3 text-xs font-bold rounded-lg border transition-colors ${
                type === 'income'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-white border-brass/25 text-aubergine/70 hover:bg-ivory'
              }`}
            >
              Income (+)
            </button>
          </div>

          <Input
            label="Transaction Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Grocery store, Freelance payment"
            required
          />

          <Input
            label="Amount (in Rupees)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 1500 or 1500.50"
            required
          />

          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
          />

          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <Input
            label="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional context or payment reference"
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
              Save Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default TransactionsPage;
