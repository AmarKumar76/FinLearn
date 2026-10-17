import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Tabs } from '../../components/common/Tabs';
import { EmptyState } from '../../components/common/EmptyState';
import { formatRupeesToINR } from '../../utils/formatters';
import { api } from '../../services/api';
import {
  Landmark,
  Calculator,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  ArrowRightLeft,
  GraduationCap,
  Briefcase,
  HelpCircle,
  Sparkles,
  BookOpen,
  Send,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sliders,
  DollarSign,
  Scale
} from 'lucide-react';

export function LoanGuidePage() {
  const [activeTab, setActiveTab] = useState('overview');

  // --- LOAN CALCULATOR STATE ---
  const [calcPrincipal, setCalcPrincipal] = useState('500000');
  const [calcRate, setCalcRate] = useState('12');
  const [calcTenureMonths, setCalcTenureMonths] = useState('60');
  const [calcFeePct, setCalcFeePct] = useState('1.5');
  const [calcResult, setCalcResult] = useState(null);
  const [loadingCalc, setLoadingCalc] = useState(false);
  const [calcError, setCalcError] = useState(null);
  const [showAmortization, setShowAmortization] = useState(false);

  // --- VERIFIED PRODUCTS REGISTRY STATE ---
  const [verifiedProducts, setVerifiedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');

  // --- LOAN COMPARISON STATE ---
  const [compareBaselinePrincipal, setCompareBaselinePrincipal] = useState('500000');
  const [compareBaselineTenure, setCompareBaselineTenure] = useState('60');
  const [compareOffers, setCompareOffers] = useState([
    {
      id: 'offer-1',
      lenderName: 'State Bank of India',
      productName: 'SBI Xpress Credit',
      annualRatePct: 11.15,
      processingFeePct: 1.5,
      rateType: 'Floating',
      prepaymentTerms: 'Nil (0%) under RBI Fair Practices Code for floating retail loans',
      isUserProvided: false,
    },
    {
      id: 'offer-2',
      lenderName: 'HDFC Bank',
      productName: 'HDFC Personal Loan',
      annualRatePct: 10.50,
      processingFeePct: 2.5,
      rateType: 'Fixed',
      prepaymentTerms: '2% to 4% + GST on outstanding balance if closed early',
      isUserProvided: false,
    },
  ]);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [comparing, setComparing] = useState(false);

  // --- AFFORDABILITY / DTI STATE ---
  const [monthlyIncome, setMonthlyIncome] = useState('65000');
  const [existingEmis, setExistingEmis] = useState('12000');
  const [proposedLoan, setProposedLoan] = useState('500000');
  const [proposedRate, setProposedRate] = useState('12');
  const [proposedTenure, setProposedTenure] = useState('60');
  const [affordabilityResult, setAffordabilityResult] = useState(null);
  const [loadingAffordability, setLoadingAffordability] = useState(false);

  // --- EDUCATION LOAN GAP STATE ---
  const [tuitionFees, setTuitionFees] = useState('1200000');
  const [livingExpenses, setLivingExpenses] = useState('400000');
  const [booksExpenses, setBooksExpenses] = useState('50000');
  const [travelExpenses, setTravelExpenses] = useState('100000');
  const [familySavings, setFamilySavings] = useState('350000');
  const [scholarship, setScholarship] = useState('150000');
  const [eduRate, setEduRate] = useState('9.5');
  const [eduCourseMonths, setEduCourseMonths] = useState('24');
  const [eduRepayMonths, setEduRepayMonths] = useState('120');
  const [eduGapResult, setEduGapResult] = useState(null);
  const [loadingEduGap, setLoadingEduGap] = useState(false);

  // --- LEARNING CENTER STATE ---
  const [learningTopics, setLearningTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [showQuizResult, setShowQuizResult] = useState(false);

  // --- AI LOAN ASSISTANT STATE ---
  const [assistantQuery, setAssistantQuery] = useState('');
  const [assistantResponse, setAssistantResponse] = useState(null);
  const [loadingAssistant, setLoadingAssistant] = useState(false);
  const [assistantError, setAssistantError] = useState(null);

  // Load Verified Products & Curriculum
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingProducts(true);
        const [prodRes, learnRes] = await Promise.all([
          api.get('/guidance/loans/products'),
          api.get('/guidance/loans/learning'),
        ]);
        if (prodRes?.data?.products) {
          setVerifiedProducts(prodRes.data.products);
        }
        if (learnRes?.data?.topics) {
          setLearningTopics(learnRes.data.topics);
          setSelectedTopic(learnRes.data.topics[0]);
        }
      } catch (err) {
        console.error('Failed to load verified loan data:', err);
      } finally {
        setLoadingProducts(false);
      }
    }
    loadData();
  }, []);

  // Run Real-Time EMI Calculation
  useEffect(() => {
    const timer = setTimeout(async () => {
      const p = parseFloat(calcPrincipal);
      const r = parseFloat(calcRate);
      const n = parseInt(calcTenureMonths, 10);
      const fee = parseFloat(calcFeePct) || 0;

      if (!isNaN(p) && p > 0 && !isNaN(r) && r >= 0 && !isNaN(n) && n > 0) {
        try {
          setLoadingCalc(true);
          setCalcError(null);
          const res = await api.post('/guidance/calculate-loan', {
            principal: p,
            annualRatePct: r,
            tenureMonths: n,
            processingFeePct: fee,
          });
          if (res?.data) {
            setCalcResult(res.data);
          }
        } catch (err) {
          setCalcError(err.message || 'Calculation error');
        } finally {
          setLoadingCalc(false);
        }
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [calcPrincipal, calcRate, calcTenureMonths, calcFeePct]);

  // Execute Comparison
  const handleRunComparison = async () => {
    try {
      setComparing(true);
      const res = await api.post('/guidance/loans/compare', {
        baselinePrincipal: parseFloat(compareBaselinePrincipal) || 500000,
        baselineTenureMonths: parseInt(compareBaselineTenure, 10) || 60,
        offers: compareOffers,
      });
      if (res?.data) {
        setComparisonResult(res.data);
      }
    } catch (err) {
      console.error('Failed to compare offers:', err);
    } finally {
      setComparing(false);
    }
  };

  useEffect(() => {
    handleRunComparison();
  }, [compareBaselinePrincipal, compareBaselineTenure, compareOffers.length]);

  // Execute Affordability Checker
  const handleRunAffordability = async () => {
    try {
      setLoadingAffordability(true);
      const res = await api.post('/guidance/loans/affordability', {
        monthlyIncome: parseFloat(monthlyIncome),
        existingEmis: parseFloat(existingEmis) || 0,
        proposedLoanAmount: parseFloat(proposedLoan),
        annualRatePct: parseFloat(proposedRate),
        tenureMonths: parseInt(proposedTenure, 10),
      });
      if (res?.data) {
        setAffordabilityResult(res.data);
      }
    } catch (err) {
      console.error('Affordability error:', err);
    } finally {
      setLoadingAffordability(false);
    }
  };

  useEffect(() => {
    handleRunAffordability();
  }, [monthlyIncome, existingEmis, proposedLoan, proposedRate, proposedTenure]);

  // Execute Education Gap Calculator
  const handleRunEduGap = async () => {
    try {
      setLoadingEduGap(true);
      const res = await api.post('/guidance/loans/education-gap', {
        tuitionFees: parseFloat(tuitionFees) || 0,
        livingExpenses: parseFloat(livingExpenses) || 0,
        booksAndEquipment: parseFloat(booksExpenses) || 0,
        travelAndVisa: parseFloat(travelExpenses) || 0,
        existingSavings: parseFloat(familySavings) || 0,
        scholarshipAmount: parseFloat(scholarship) || 0,
        annualRatePct: parseFloat(eduRate) || 9.5,
        courseDurationMonths: parseInt(eduCourseMonths, 10) || 24,
        repaymentTenureMonths: parseInt(eduRepayMonths, 10) || 120,
      });
      if (res?.data) {
        setEduGapResult(res.data);
      }
    } catch (err) {
      console.error('Edu gap error:', err);
    } finally {
      setLoadingEduGap(false);
    }
  };

  useEffect(() => {
    handleRunEduGap();
  }, [tuitionFees, livingExpenses, booksExpenses, travelExpenses, familySavings, scholarship, eduRate, eduRepayMonths]);

  // Execute AI Loan Assistant Query
  const handleAskAssistant = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!assistantQuery.trim()) return;

    try {
      setLoadingAssistant(true);
      setAssistantError(null);
      setAssistantResponse(null);

      const res = await api.post('/guidance/loans/assistant', {
        query: assistantQuery.trim(),
        category: activeTab === 'education' ? 'Education Loan' : activeTab === 'personal' ? 'Personal Loan' : null,
        loanContext: calcResult ? { principal: calcResult.principal, ratePct: calcResult.annualRatePct, emi: calcResult.monthlyEmi } : null,
      });

      if (res?.data) {
        setAssistantResponse(res.data);
      }
    } catch (err) {
      setAssistantError(err.message || 'Loan assistant request failed.');
    } finally {
      setLoadingAssistant(false);
    }
  };

  const navTabs = [
    { id: 'overview', label: 'Loan Guide', icon: Landmark },
    { id: 'calculator', label: 'EMI Calculator', icon: Calculator },
    { id: 'comparison', label: 'Offer Comparison', icon: Scale },
    { id: 'education', label: 'Education Loan', icon: GraduationCap },
    { id: 'personal', label: 'Personal Loan', icon: Briefcase },
    { id: 'affordability', label: 'Eligibility & DTI', icon: Sliders },
    { id: 'learning', label: 'Learning Center', icon: BookOpen },
    { id: 'assistant', label: 'AI Loan Assistant', icon: Sparkles },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner with Visual Identity */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-brass/20">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-aubergine tracking-tight">
              Smart Borrowing & Loan Guide
            </h1>
            <Badge variant="terracotta" size="sm">Evidence-Based</Badge>
          </div>
          <p className="text-xs text-aubergine/70 mt-1 max-w-2xl leading-relaxed">
            Transparent reducing-balance calculations • Education & Personal Loans • Verified RBI & bank registry disclosures • Zero commercial bias
          </p>
        </div>

        {/* Global Mandatory Statutory Disclaimer */}
        <div className="px-3.5 py-2 rounded-xl bg-ivory-dark border border-brass/30 text-[11px] text-aubergine/80 flex items-center gap-2 max-w-md">
          <Info className="w-4 h-4 text-terracotta shrink-0" />
          <span>
            <strong>Disclaimer:</strong> FinLearn is an educational platform. We do not broker, approve, or disburse loans. All figures are estimates based on official disclosures.
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="overflow-x-auto pb-1">
        <Tabs tabs={navTabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & CATEGORY CARDS */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Hero Category Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Education Loan */}
            <Card className="bg-gradient-to-br from-white via-ivory-surface to-ivory-dark border-brass/30 hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-aubergine/10 text-aubergine flex items-center justify-center font-bold">
                    <GraduationCap className="w-5 h-5 text-terracotta" />
                  </div>
                  <Badge variant="neutral" size="sm">Moratorium Protected</Badge>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-aubergine">Education Loans</h3>
                  <p className="text-xs text-aubergine/70 mt-1 leading-relaxed">
                    Designed for domestic and foreign higher studies. Features study-period moratoriums, no-collateral thresholds up to ₹7.5 Lakhs, and government interest subsidies.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-white/80 border border-brass/20 space-y-1.5 text-xs text-aubergine/80">
                  <div className="flex justify-between">
                    <span>Benchmark Rate:</span>
                    <span className="font-mono font-bold text-aubergine">8.15% - 10.45% p.a.</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Repayment Holiday:</span>
                    <span className="font-semibold text-emerald-800">Course + 1 Year</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Govt Portal:</span>
                    <span className="font-semibold text-terracotta">Vidya Lakshmi Portal</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="primary" size="sm" onClick={() => setActiveTab('education')}>
                    Explore Education Loans
                  </Button>
                  <span className="text-[11px] text-aubergine/60 font-mono">3 Verified Products</span>
                </div>
              </div>
            </Card>

            {/* Card 2: Personal Loan */}
            <Card className="bg-gradient-to-br from-white via-ivory-surface to-ivory-dark border-brass/30 hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-aubergine/10 text-aubergine flex items-center justify-center font-bold">
                    <Briefcase className="w-5 h-5 text-terracotta" />
                  </div>
                  <Badge variant="neutral" size="sm">Unsecured Credit</Badge>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-aubergine">Personal Loans</h3>
                  <p className="text-xs text-aubergine/70 mt-1 leading-relaxed">
                    Multi-purpose unsecured financing for emergency medical expenses, life events, or home repair. Fast approval, but carries higher interest and strict DTI scrutiny.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-white/80 border border-brass/20 space-y-1.5 text-xs text-aubergine/80">
                  <div className="flex justify-between">
                    <span>Benchmark Rate:</span>
                    <span className="font-mono font-bold text-aubergine">10.50% - 21.00% p.a.</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Collateral:</span>
                    <span className="font-semibold text-aubergine">Zero (Unsecured)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Prudent DTI Cap:</span>
                    <span className="font-semibold text-emerald-800">40% - 50% Net Salary</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="secondary" size="sm" onClick={() => setActiveTab('personal')}>
                    Explore Personal Loans
                  </Button>
                  <span className="text-[11px] text-aubergine/60 font-mono">3 Verified Products</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Interactive Tool Links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setActiveTab('calculator')}
              className="p-4 rounded-xl bg-white border border-brass/25 hover:border-terracotta text-left space-y-1.5 transition-all group"
            >
              <div className="flex items-center justify-between">
                <Calculator className="w-5 h-5 text-terracotta group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-terracotta">Launch →</span>
              </div>
              <h4 className="font-bold text-aubergine text-sm">Monthly EMI Calculator</h4>
              <p className="text-[11px] text-aubergine/70 leading-relaxed">
                Standard reducing-balance formula, 18% GST fee separation, and complete amortization schedules.
              </p>
            </button>

            <button
              onClick={() => setActiveTab('comparison')}
              className="p-4 rounded-xl bg-white border border-brass/25 hover:border-terracotta text-left space-y-1.5 transition-all group"
            >
              <div className="flex items-center justify-between">
                <Scale className="w-5 h-5 text-terracotta group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-terracotta">Compare →</span>
              </div>
              <h4 className="font-bold text-aubergine text-sm">Side-by-Side Offer Comparison</h4>
              <p className="text-[11px] text-aubergine/70 leading-relaxed">
                Compare verified bank offers or custom user loans under equal principal to see real lifetime cost.
              </p>
            </button>

            <button
              onClick={() => setActiveTab('affordability')}
              className="p-4 rounded-xl bg-white border border-brass/25 hover:border-terracotta text-left space-y-1.5 transition-all group"
            >
              <div className="flex items-center justify-between">
                <Sliders className="w-5 h-5 text-terracotta group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-terracotta">Check →</span>
              </div>
              <h4 className="font-bold text-aubergine text-sm">Debt-to-Income Checker</h4>
              <p className="text-[11px] text-aubergine/70 leading-relaxed">
                Evaluate your monthly EMI burden against standard 40-50% Indian banking underwriting limits.
              </p>
            </button>
          </div>

          {/* RBI Digital Lending Safety Protocol */}
          <Card
            title="RBI Digital Lending Consumer Guardrails"
            subtitle="Mandatory checks established by the Reserve Bank of India to protect Indian borrowers"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-ivory-dark border border-brass/20 space-y-1">
                <div className="flex items-center gap-2 font-bold text-aubergine">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Key Fact Statement (KFS) is Legally Mandatory</span>
                </div>
                <p className="text-aubergine/80 text-[11px] leading-relaxed">
                  Lenders MUST provide a standardized KFS disclosing the exact all-inclusive APR, monthly repayment schedule, and all penal fees before agreement execution.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-ivory-dark border border-brass/20 space-y-1">
                <div className="flex items-center gap-2 font-bold text-aubergine">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Direct Bank Account Disbursement</span>
                </div>
                <p className="text-aubergine/80 text-[11px] leading-relaxed">
                  Disbursements and repayments must flow strictly between the regulated bank/NBFC and the borrower, without pass-through via third-party digital wallets.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-ivory-dark border border-brass/20 space-y-1">
                <div className="flex items-center gap-2 font-bold text-aubergine">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Zero Mobile Gallery & Contact Permissions</span>
                </div>
                <p className="text-aubergine/80 text-[11px] leading-relaxed">
                  Lending applications are strictly prohibited from accessing your contacts list, photo gallery, or device files as an underwriting condition.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-ivory-dark border border-brass/20 space-y-1">
                <div className="flex items-center gap-2 font-bold text-aubergine">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Zero Prepayment Penalty on Floating Retail Loans</span>
                </div>
                <p className="text-aubergine/80 text-[11px] leading-relaxed">
                  Banks cannot levy any foreclosure or part-prepayment charges on individual borrowers taking floating-rate term loans.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EMI CALCULATOR & AMORTIZATION */}
      {/* ========================================================================= */}
      {activeTab === 'calculator' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Form */}
            <Card className="lg:col-span-5 bg-white border-brass/30 space-y-4">
              <div className="pb-3 border-b border-brass/15 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-aubergine">Loan Parameters</h3>
                  <p className="text-xs text-aubergine/60">Standard reducing-balance monthly amortization</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCalcPrincipal('500000');
                    setCalcRate('12');
                    setCalcTenureMonths('60');
                    setCalcFeePct('1.5');
                  }}
                  className="gap-1 text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset
                </Button>
              </div>

              <div className="space-y-3.5">
                <Input
                  label="Loan Principal Amount (₹)"
                  type="number"
                  value={calcPrincipal}
                  onChange={(e) => setCalcPrincipal(e.target.value)}
                  placeholder="500000"
                  helperText={`In words: ${calcPrincipal ? formatRupeesToINR(parseFloat(calcPrincipal) || 0) : '₹0'}`}
                  required
                />

                <Input
                  label="Annual Interest Rate (% p.a.)"
                  type="number"
                  step="0.1"
                  value={calcRate}
                  onChange={(e) => setCalcRate(e.target.value)}
                  placeholder="12.0"
                  helperText="Enter 0 for 0% promotional financing schemes"
                  required
                />

                <div>
                  <Input
                    label="Tenure Duration (Months)"
                    type="number"
                    value={calcTenureMonths}
                    onChange={(e) => setCalcTenureMonths(e.target.value)}
                    placeholder="60"
                    helperText={`${calcTenureMonths || 0} months = ${(parseFloat(calcTenureMonths) / 12 || 0).toFixed(1)} years`}
                    required
                  />
                  <div className="flex gap-1.5 mt-2">
                    {[12, 24, 36, 48, 60, 84, 120].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setCalcTenureMonths(String(m))}
                        className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold transition-all ${
                          calcTenureMonths === String(m)
                            ? 'bg-aubergine text-ivory'
                            : 'bg-ivory-dark text-aubergine/70 hover:bg-brass/20'
                        }`}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Upfront Processing Fee (% of principal)"
                  type="number"
                  step="0.1"
                  value={calcFeePct}
                  onChange={(e) => setCalcFeePct(e.target.value)}
                  placeholder="1.5"
                  helperText="18% GST will be applied exclusively to the fee"
                />
              </div>
            </Card>

            {/* Live Numerical Results */}
            <Card className="lg:col-span-7 bg-white border-brass/30 space-y-5">
              <div className="pb-3 border-b border-brass/15">
                <h3 className="text-base font-bold text-aubergine">Calculation Results & Fee Disclosures</h3>
                <p className="text-xs text-aubergine/60">Values update dynamically with zero rounding errors</p>
              </div>

              {calcError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  {calcError}
                </div>
              )}

              {/* Big Monthly EMI Hero Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-aubergine via-[#3d2341] to-aubergine text-ivory shadow-sm space-y-2">
                <span className="text-xs font-bold text-brass-light uppercase tracking-wider block">
                  Estimated Monthly EMI
                </span>
                <div className="text-3xl sm:text-4xl font-black text-ivory font-mono">
                  {calcResult ? formatRupeesToINR(calcResult.monthlyEmi) : '₹0'}
                </div>
                <div className="flex items-center justify-between text-[11px] text-lilac-light pt-1 border-t border-white/10">
                  <span>Payable monthly over {calcTenureMonths || 0} scheduled instalments</span>
                  <span className="font-mono">Rate: {calcRate}% p.a.</span>
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-ivory-dark border border-brass/20 space-y-1">
                  <span className="text-[10px] font-bold text-aubergine/60 uppercase tracking-wider block">
                    Total Interest
                  </span>
                  <span className="text-sm font-black text-aubergine font-mono block">
                    {calcResult ? formatRupeesToINR(calcResult.totalInterest) : '₹0'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-ivory-dark border border-brass/20 space-y-1">
                  <span className="text-[10px] font-bold text-aubergine/60 uppercase tracking-wider block">
                    Total Repayment (EMIs)
                  </span>
                  <span className="text-sm font-black text-aubergine font-mono block">
                    {calcResult ? formatRupeesToINR(calcResult.totalRepayment) : '₹0'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-ivory-dark border border-brass/20 space-y-1">
                  <span className="text-[10px] font-bold text-aubergine/60 uppercase tracking-wider block">
                    Net Disbursed To You
                  </span>
                  <span className="text-sm font-black text-emerald-800 font-mono block">
                    {calcResult ? formatRupeesToINR(calcResult.netDisbursedAmount) : '₹0'}
                  </span>
                </div>
              </div>

              {/* Upfront Fee Deductions */}
              {calcResult && (
                <div className="p-3.5 rounded-xl bg-ivory-surface border border-brass/25 text-xs space-y-2">
                  <span className="font-bold text-aubergine block">Upfront Deductions (Excluded from EMIs):</span>
                  <div className="flex justify-between text-aubergine/70">
                    <span>Processing Fee ({calcFeePct}% of ₹{calcResult.principal.toLocaleString('en-IN')}):</span>
                    <span className="font-mono font-semibold">{formatRupeesToINR(calcResult.processingFee)}</span>
                  </div>
                  <div className="flex justify-between text-aubergine/70">
                    <span>GST on Processing Fee (18%):</span>
                    <span className="font-mono font-semibold">{formatRupeesToINR(calcResult.gstOnFee)}</span>
                  </div>
                  <div className="pt-1.5 border-t border-brass/15 flex justify-between font-bold text-aubergine">
                    <span>Total Upfront Cost Deducted from Loan:</span>
                    <span className="font-mono text-terracotta">{formatRupeesToINR(calcResult.totalUpfrontCost)}</span>
                  </div>
                </div>
              )}

              {/* Toggle Amortization Schedule */}
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAmortization(!showAmortization)}
                  className="w-full gap-2 text-xs"
                >
                  {showAmortization ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  <span>{showAmortization ? 'Hide Monthly Amortization Schedule' : 'View Full Monthly Amortization Schedule'}</span>
                </Button>
              </div>
            </Card>
          </div>

          {/* Monthly Amortization Table */}
          {showAmortization && calcResult?.amortizationSchedule && (
            <Card
              title="Full Monthly Repayment & Amortization Schedule"
              subtitle={`Detailed month-by-month principal reduction over ${calcTenureMonths} months`}
            >
              <div className="overflow-x-auto max-h-96 overflow-y-auto border border-brass/20 rounded-xl">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-aubergine text-ivory sticky top-0">
                    <tr>
                      <th className="p-2.5">Month</th>
                      <th className="p-2.5">Beginning Principal</th>
                      <th className="p-2.5">Monthly EMI</th>
                      <th className="p-2.5">Principal Paid</th>
                      <th className="p-2.5">Interest Paid</th>
                      <th className="p-2.5">Ending Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brass/10 bg-white">
                    {calcResult.amortizationSchedule.map((row) => (
                      <tr key={row.month} className="hover:bg-ivory-dark/40">
                        <td className="p-2 font-bold text-aubergine">{row.month}</td>
                        <td className="p-2">{formatRupeesToINR(row.beginningBalance)}</td>
                        <td className="p-2 font-semibold text-aubergine">{formatRupeesToINR(row.emi)}</td>
                        <td className="p-2 text-emerald-800 font-semibold">{formatRupeesToINR(row.principalPaid)}</td>
                        <td className="p-2 text-terracotta font-semibold">{formatRupeesToINR(row.interestPaid)}</td>
                        <td className="p-2 font-bold">{formatRupeesToINR(row.endingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SIDE-BY-SIDE OFFER COMPARISON */}
      {/* ========================================================================= */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          <Card
            title="Loan Offer Comparison Engine"
            subtitle="Compare multiple bank offers or manually entered quotes under identical principal and tenure"
          >
            {/* Baseline Controls */}
            <div className="p-4 rounded-xl bg-ivory-dark border border-brass/25 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Input
                label="Baseline Principal (₹)"
                type="number"
                value={compareBaselinePrincipal}
                onChange={(e) => setCompareBaselinePrincipal(e.target.value)}
                placeholder="500000"
              />
              <Input
                label="Baseline Tenure (Months)"
                type="number"
                value={compareBaselineTenure}
                onChange={(e) => setCompareBaselineTenure(e.target.value)}
                placeholder="60"
              />
              <div className="flex items-end">
                <Button variant="primary" size="md" onClick={handleRunComparison} loading={comparing} className="w-full">
                  Re-evaluate Comparison
                </Button>
              </div>
            </div>

            {/* Comparison Cards Grid */}
            {comparisonResult?.offers && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {comparisonResult.offers.map((offer, idx) => {
                  const isLowestCost = offer.id === comparisonResult.lowestTotalCostOfferId;
                  return (
                    <div
                      key={offer.id}
                      className={`p-5 rounded-2xl border transition-all space-y-4 ${
                        isLowestCost
                          ? 'bg-gradient-to-b from-white via-emerald-50/20 to-white border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                          : 'bg-white border-brass/30'
                      }`}
                    >
                      <div className="flex items-start justify-between pb-3 border-b border-brass/15">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-aubergine">{offer.lenderName}</span>
                            {isLowestCost && (
                              <Badge variant="success" size="sm">Lowest Lifetime Outflow</Badge>
                            )}
                          </div>
                          <span className="text-xs text-aubergine/70 block mt-0.5">{offer.productName}</span>
                        </div>
                        <Badge variant={offer.isUserProvided ? 'neutral' : 'brass'} size="sm">
                          {offer.isUserProvided ? 'User Provided' : 'Official Registry'}
                        </Badge>
                      </div>

                      {/* Financial Math Comparison Grid */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-ivory-dark space-y-0.5">
                          <span className="text-[10px] text-aubergine/60 uppercase block">Monthly EMI</span>
                          <span className="text-base font-mono font-bold text-aubergine block">
                            {formatRupeesToINR(offer.calculation.monthlyEmi)}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-ivory-dark space-y-0.5">
                          <span className="text-[10px] text-aubergine/60 uppercase block">Interest Rate</span>
                          <span className="text-base font-mono font-bold text-aubergine block">
                            {offer.annualRatePct}% ({offer.rateType})
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-ivory-dark space-y-0.5">
                          <span className="text-[10px] text-aubergine/60 uppercase block">Total Interest</span>
                          <span className="text-sm font-mono font-bold text-aubergine block">
                            {formatRupeesToINR(offer.calculation.totalInterest)}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-ivory-dark space-y-0.5">
                          <span className="text-[10px] text-aubergine/60 uppercase block">Upfront Fee + GST</span>
                          <span className="text-sm font-mono font-bold text-aubergine block">
                            {formatRupeesToINR(offer.calculation.totalUpfrontCost)}
                          </span>
                        </div>
                      </div>

                      {/* Total Lifetime Borrowing Outflow */}
                      <div className="p-3.5 rounded-xl bg-aubergine text-ivory flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-brass-light uppercase block">Total Lifetime Cost</span>
                          <span className="text-xs text-lilac-light">Interest + Upfront Fees</span>
                        </div>
                        <div className="text-lg font-mono font-black text-ivory">
                          {formatRupeesToINR(offer.calculation.totalCostOfBorrowing)}
                        </div>
                      </div>

                      {/* Qualitative Terms */}
                      <div className="space-y-1.5 text-xs text-aubergine/80 pt-1">
                        <div className="flex justify-between">
                          <span className="font-semibold">Prepayment / Foreclosure:</span>
                          <span className="text-right text-[11px] max-w-xs">{offer.prepaymentTerms}</span>
                        </div>
                        {offer.officialSourceUrl && (
                          <div className="pt-2 border-t border-brass/10 flex justify-end">
                            <a
                              href={offer.officialSourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-terracotta hover:underline font-semibold inline-flex items-center gap-1"
                            >
                              <span>Official Disclosure Portal</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: EDUCATION LOAN MODULE & FUNDING GAP */}
      {/* ========================================================================= */}
      {activeTab === 'education' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Form for Funding Gap */}
            <Card className="lg:col-span-5 bg-white border-brass/30 space-y-4">
              <div className="pb-3 border-b border-brass/15">
                <h3 className="text-base font-bold text-aubergine flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-terracotta" />
                  <span>Education Expense & Funding Gap</span>
                </h3>
                <p className="text-xs text-aubergine/60">
                  Calculate the real loan amount required after savings and scholarships
                </p>
              </div>

              <div className="space-y-3">
                <Input
                  label="Estimated Tuition Fees (₹)"
                  type="number"
                  value={tuitionFees}
                  onChange={(e) => setTuitionFees(e.target.value)}
                  placeholder="1200000"
                  required
                />

                <Input
                  label="Living & Accommodation (₹)"
                  type="number"
                  value={livingExpenses}
                  onChange={(e) => setLivingExpenses(e.target.value)}
                  placeholder="400000"
                />

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Books & Laptop (₹)"
                    type="number"
                    value={booksExpenses}
                    onChange={(e) => setBooksExpenses(e.target.value)}
                    placeholder="50000"
                  />
                  <Input
                    label="Travel & Visa (₹)"
                    type="number"
                    value={travelExpenses}
                    onChange={(e) => setTravelExpenses(e.target.value)}
                    placeholder="100000"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-brass/15">
                  <Input
                    label="Family Savings (₹)"
                    type="number"
                    value={familySavings}
                    onChange={(e) => setFamilySavings(e.target.value)}
                    placeholder="350000"
                  />
                  <Input
                    label="Scholarship / Grants (₹)"
                    type="number"
                    value={scholarship}
                    onChange={(e) => setScholarship(e.target.value)}
                    placeholder="150000"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-brass/15">
                  <Input
                    label="Assumed Rate (% p.a.)"
                    type="number"
                    step="0.1"
                    value={eduRate}
                    onChange={(e) => setEduRate(e.target.value)}
                    placeholder="9.5"
                  />
                  <Input
                    label="Repayment Tenure (Mo)"
                    type="number"
                    value={eduRepayMonths}
                    onChange={(e) => setEduRepayMonths(e.target.value)}
                    placeholder="120"
                    helperText="120m = 10 years"
                  />
                </div>
              </div>
            </Card>

            {/* Funding Gap & Moratorium Details */}
            <Card className="lg:col-span-7 bg-white border-brass/30 space-y-5">
              <div className="pb-3 border-b border-brass/15">
                <h3 className="text-base font-bold text-aubergine">Funding Gap & Moratorium Repayment Estimate</h3>
                <p className="text-xs text-aubergine/60">Study-period simple interest and post-moratorium EMI</p>
              </div>

              {eduGapResult && (
                <div className="space-y-4">
                  {/* Big Gap Metric */}
                  <div className="p-5 rounded-2xl bg-aubergine text-ivory space-y-2">
                    <span className="text-xs font-bold text-brass-light uppercase tracking-wider block">
                      Required Education Loan (Funding Gap)
                    </span>
                    <div className="text-3xl sm:text-4xl font-black text-ivory font-mono">
                      {formatRupeesToINR(eduGapResult.fundingGap)}
                    </div>
                    <div className="flex justify-between text-[11px] text-lilac-light pt-1 border-t border-white/10">
                      <span>Total Cost: {formatRupeesToINR(eduGapResult.costBreakdown.totalEducationCost)}</span>
                      <span>Own Contribution: {formatRupeesToINR(eduGapResult.fundingSources.totalOwnFunds)}</span>
                    </div>
                  </div>

                  {/* Post-Moratorium Estimated Repayment */}
                  {eduGapResult.repaymentEstimate && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-xl bg-ivory-dark border border-brass/20 space-y-1">
                        <span className="text-[10px] font-bold text-aubergine/60 uppercase block">Post-Study Monthly EMI</span>
                        <span className="text-base font-bold font-mono text-aubergine block">
                          {formatRupeesToINR(eduGapResult.repaymentEstimate.estimatedMonthlyEmi)}
                        </span>
                        <span className="text-[10px] text-aubergine/70 block">Tenure: {eduRepayMonths / 12} yrs</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-ivory-dark border border-brass/20 space-y-1">
                        <span className="text-[10px] font-bold text-aubergine/60 uppercase block">Study Period Accrued Interest</span>
                        <span className="text-base font-bold font-mono text-terracotta block">
                          ~{formatRupeesToINR(eduGapResult.moratoriumDetails.estimatedSimpleInterestDuringMoratorium)}
                        </span>
                        <span className="text-[10px] text-aubergine/70 block">Over {eduGapResult.moratoriumDetails.totalMoratoriumMonths} mo</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-ivory-dark border border-brass/20 space-y-1">
                        <span className="text-[10px] font-bold text-aubergine/60 uppercase block">Lifetime Total Repayment</span>
                        <span className="text-base font-bold font-mono text-aubergine block">
                          {formatRupeesToINR(eduGapResult.repaymentEstimate.totalRepayment)}
                        </span>
                        <span className="text-[10px] text-aubergine/70 block">Principal + EMIs</span>
                      </div>
                    </div>
                  )}

                  {/* Government CSIS Subsidy Card */}
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1 text-emerald-900">
                    <div className="flex items-center gap-2 font-bold text-emerald-800">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>Central Sector Interest Subsidy (CSIS) Scheme Support</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      If your gross parental annual income is below <strong>₹4.50 Lakhs</strong>, the Government of India provides a 100% interest subsidy during the moratorium period for approved courses in India via the Vidya Lakshmi Portal.
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Verified Education Loan Products from DB */}
          <Card
            title="Verified Education Loan Products (RBI & Vidya Lakshmi Registered)"
            subtitle="Authentic bank terms, collateral thresholds, and official application portals"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {verifiedProducts
                .filter((p) => p.category === 'Education Loan')
                .map((prod) => (
                  <div key={prod.id} className="p-4 rounded-xl bg-white border border-brass/25 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-aubergine text-sm block">{prod.lenderName}</span>
                        <span className="text-xs text-aubergine/70 block">{prod.productName}</span>
                      </div>
                      <Badge variant="terracotta" size="sm">{prod.interestRateRange}</Badge>
                    </div>

                    <div className="space-y-1 text-xs text-aubergine/80">
                      <p><strong>Collateral:</strong> {prod.collateralRequirements}</p>
                      <p><strong>Moratorium:</strong> {prod.moratoriumPeriod}</p>
                      <p><strong>Processing Fee:</strong> {prod.processingFee}</p>
                    </div>

                    <div className="pt-2 border-t border-brass/15 flex items-center justify-between text-xs">
                      <a
                        href={prod.portalRegistrationUrl || prod.officialSourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-terracotta hover:underline font-semibold inline-flex items-center gap-1"
                      >
                        <span>Vidya Lakshmi Application</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <span className="text-[10px] font-mono text-aubergine/60">{prod.lastVerifiedDate}</span>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: PERSONAL LOAN & VERIFIED REGISTRY */}
      {/* ========================================================================= */}
      {activeTab === 'personal' && (
        <div className="space-y-6">
          <Card
            title="Verified Personal Loan Product Registry"
            subtitle="Authentic bank interest rate schedules, fee structures, and regulatory disclosures"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {verifiedProducts
                .filter((p) => p.category === 'Personal Loan')
                .map((prod) => (
                  <div key={prod.id} className="p-4 rounded-xl bg-white border border-brass/25 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-aubergine text-sm block">{prod.lenderName}</span>
                        <span className="text-xs text-aubergine/70 block">{prod.productName}</span>
                      </div>
                      <Badge variant="brass" size="sm">{prod.interestRateRange}</Badge>
                    </div>

                    <div className="space-y-1.5 text-xs text-aubergine/80">
                      <p><strong>Rate Type:</strong> {prod.rateType} ({prod.benchmarkType})</p>
                      <p><strong>Processing Fee:</strong> {prod.processingFee}</p>
                      <p><strong>Prepayment Terms:</strong> {prod.prepaymentTerms}</p>
                      <p><strong>Max Amount:</strong> Up to {formatRupeesToINR(prod.maxAmount)}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-ivory-dark text-[11px] text-aubergine/80 space-y-0.5">
                      <span className="font-bold block text-aubergine">Eligibility Snapshot:</span>
                      <ul className="list-disc list-inside space-y-0.5">
                        {prod.eligibilityCriteria.slice(0, 2).map((crit, idx) => (
                          <li key={idx} className="truncate">{crit}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-brass/15 flex items-center justify-between text-xs">
                      <a
                        href={prod.officialSourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-terracotta hover:underline font-semibold inline-flex items-center gap-1"
                      >
                        <span>Official Bank Disclosure</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <span className="text-[10px] font-mono text-aubergine/60">{prod.lastVerifiedDate}</span>
                    </div>
                  </div>
                ))}
            </div>
          </Card>

          {/* Personal Loan Checklist & Warning */}
          <Card
            title="Personal Loan Consumer Advisory"
            subtitle="Key cautions when taking unsecured debt in India"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-ivory-dark border border-brass/20 space-y-1">
                <span className="font-bold text-aubergine block">Credit Score Impact</span>
                <p className="text-aubergine/70 leading-relaxed text-[11px]">
                  Applying simultaneously with multiple lenders triggers multiple hard inquiries on your CIBIL report, which can depress your score.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-ivory-dark border border-brass/20 space-y-1">
                <span className="font-bold text-aubergine block">High Interest Drag</span>
                <p className="text-aubergine/70 leading-relaxed text-[11px]">
                  Personal loans carry rates up to 21% p.a. Taking an unsecured loan for speculative investments or luxury spending is a primary cause of debt distress.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-ivory-dark border border-brass/20 space-y-1">
                <span className="font-bold text-aubergine block">Foreclosure Penalties</span>
                <p className="text-aubergine/70 leading-relaxed text-[11px]">
                  Unlike floating-rate home loans, fixed-rate personal loans often impose 2% to 4% foreclosure charges if closed before maturity. Always verify in the KFS.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: ELIGIBILITY & DEBT-TO-INCOME (DTI) CHECKER */}
      {/* ========================================================================= */}
      {activeTab === 'affordability' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-5 bg-white border-brass/30 space-y-4">
              <div className="pb-3 border-b border-brass/15">
                <h3 className="text-base font-bold text-aubergine">Income & Existing Debts</h3>
                <p className="text-xs text-aubergine/60">Fixed Obligation to Income Ratio (FOIR) evaluation</p>
              </div>

              <div className="space-y-3.5">
                <Input
                  label="Net Monthly Take-Home Salary (₹)"
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  placeholder="65000"
                  required
                />

                <Input
                  label="Existing Monthly EMIs (₹)"
                  type="number"
                  value={existingEmis}
                  onChange={(e) => setExistingEmis(e.target.value)}
                  placeholder="12000"
                  helperText="Include credit card EMIs, car loan, home loan"
                />

                <Input
                  label="Proposed New Loan Amount (₹)"
                  type="number"
                  value={proposedLoan}
                  onChange={(e) => setProposedLoan(e.target.value)}
                  placeholder="500000"
                  required
                />

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Interest Rate (%)"
                    type="number"
                    step="0.1"
                    value={proposedRate}
                    onChange={(e) => setProposedRate(e.target.value)}
                    placeholder="12"
                  />
                  <Input
                    label="Tenure (Months)"
                    type="number"
                    value={proposedTenure}
                    onChange={(e) => setProposedTenure(e.target.value)}
                    placeholder="60"
                  />
                </div>
              </div>
            </Card>

            <Card className="lg:col-span-7 bg-white border-brass/30 space-y-5">
              <div className="pb-3 border-b border-brass/15">
                <h3 className="text-base font-bold text-aubergine">Affordability Analysis & DTI Benchmark</h3>
                <p className="text-xs text-aubergine/60">Standard 40% - 50% Indian bank underwriting threshold</p>
              </div>

              {affordabilityResult && (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div
                    className={`p-4 rounded-xl border flex items-center justify-between ${
                      affordabilityResult.affordabilityTier === 'COMFORTABLE'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : affordabilityResult.affordabilityTier === 'MODERATE'
                        ? 'bg-amber-50 border-amber-300 text-amber-950'
                        : 'bg-rose-50 border-rose-300 text-rose-950'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base">
                          {affordabilityResult.affordabilityTier === 'COMFORTABLE' && 'Affordable / Safe Debt Profile'}
                          {affordabilityResult.affordabilityTier === 'MODERATE' && 'Moderate Burden (Nearing Ceiling)'}
                          {affordabilityResult.affordabilityTier === 'STRETCHED' && 'Stretched / Above Bank Guidelines'}
                          {affordabilityResult.affordabilityTier === 'CRITICAL_OVERBURDEN' && 'High Risk of Debt Distress'}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5 leading-relaxed opacity-90">
                        {affordabilityResult.tierDescription}
                      </p>
                    </div>

                    <div className="text-right shrink-0 pl-3">
                      <span className="text-[10px] uppercase font-bold tracking-wider block">Projected DTI</span>
                      <span className="text-2xl font-black font-mono">
                        {affordabilityResult.projectedDtiPct}%
                      </span>
                    </div>
                  </div>

                  {/* Numerical Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-ivory-dark border border-brass/20 space-y-1">
                      <span className="text-[10px] font-bold text-aubergine/60 uppercase block">New Loan Monthly EMI</span>
                      <span className="text-base font-bold font-mono text-aubergine block">
                        {formatRupeesToINR(affordabilityResult.proposedEmi)}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-ivory-dark border border-brass/20 space-y-1">
                      <span className="text-[10px] font-bold text-aubergine/60 uppercase block">Total Monthly EMIs</span>
                      <span className="text-base font-bold font-mono text-terracotta block">
                        {formatRupeesToINR(affordabilityResult.totalMonthlyCommitments)}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-ivory-dark border border-brass/20 space-y-1">
                      <span className="text-[10px] font-bold text-aubergine/60 uppercase block">Surplus Cash Remaining</span>
                      <span className="text-base font-bold font-mono text-emerald-800 block">
                        {formatRupeesToINR(affordabilityResult.surplusIncomeAfterEmis)}
                      </span>
                    </div>
                  </div>

                  {/* Underwriting Notes */}
                  <div className="p-3.5 rounded-xl bg-ivory-surface border border-brass/20 text-xs space-y-1.5">
                    <span className="font-bold text-aubergine block">Underwriting Rules of Thumb:</span>
                    <ul className="space-y-1 text-aubergine/80 text-[11px]">
                      {affordabilityResult.underwritingGuidelines.map((rule, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-terracotta font-bold">•</span>
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: LOAN LEARNING CENTER */}
      {/* ========================================================================= */}
      {activeTab === 'learning' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Topic List */}
            <div className="lg:col-span-4 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-aubergine/70 px-1 block">
                Borrowing Curriculum Topics
              </span>
              <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
                {learningTopics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => {
                      setSelectedTopic(topic);
                      setQuizAnswer(null);
                      setShowQuizResult(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedTopic?.id === topic.id
                        ? 'bg-aubergine text-ivory border-aubergine shadow-sm'
                        : 'bg-white hover:bg-ivory-dark border-brass/20 text-aubergine'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className={`font-semibold ${selectedTopic?.id === topic.id ? 'text-brass-light' : 'text-terracotta'}`}>
                        {topic.category}
                      </span>
                      <span className={`font-mono ${selectedTopic?.id === topic.id ? 'text-lilac-light' : 'text-aubergine/50'}`}>
                        {topic.readTimeMinutes} min
                      </span>
                    </div>
                    <span className="font-bold text-xs block leading-snug">{topic.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Topic Reader & Interactive Knowledge Check */}
            <div className="lg:col-span-8">
              {selectedTopic ? (
                <Card className="bg-white border-brass/30 space-y-5">
                  <div className="pb-3 border-b border-brass/15 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="terracotta" size="sm">{selectedTopic.category}</Badge>
                        <span className="text-xs text-aubergine/60 font-mono">{selectedTopic.readTimeMinutes} min read</span>
                      </div>
                      <h2 className="text-lg font-bold text-aubergine mt-1">{selectedTopic.title}</h2>
                    </div>
                  </div>

                  {/* Lesson Markdown Content */}
                  <div className="text-xs text-aubergine/90 leading-relaxed space-y-3 whitespace-pre-line font-sans">
                    {selectedTopic.content}
                  </div>

                  {/* Interactive Knowledge Check */}
                  {selectedTopic.knowledgeCheck && (
                    <div className="p-4 rounded-xl bg-ivory-dark border border-brass/25 space-y-3 pt-3">
                      <div className="flex items-center gap-2 font-bold text-xs text-aubergine">
                        <HelpCircle className="w-4 h-4 text-terracotta" />
                        <span>Knowledge Check</span>
                      </div>

                      <p className="text-xs font-semibold text-aubergine">
                        {selectedTopic.knowledgeCheck.question}
                      </p>

                      <div className="space-y-1.5">
                        {selectedTopic.knowledgeCheck.options.map((opt, oIdx) => {
                          const isSelected = quizAnswer === oIdx;
                          const isCorrect = oIdx === selectedTopic.knowledgeCheck.correctIndex;

                          let btnStyle = 'bg-white border-brass/25 text-aubergine hover:border-terracotta';
                          if (showQuizResult) {
                            if (isCorrect) {
                              btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold';
                            } else if (isSelected && !isCorrect) {
                              btnStyle = 'bg-rose-50 border-rose-400 text-rose-950';
                            }
                          } else if (isSelected) {
                            btnStyle = 'bg-aubergine text-ivory border-aubergine';
                          }

                          return (
                            <button
                              key={oIdx}
                              onClick={() => {
                                setQuizAnswer(oIdx);
                                setShowQuizResult(true);
                              }}
                              className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between ${btnStyle}`}
                            >
                              <span>{opt}</span>
                              {showQuizResult && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>

                      {showQuizResult && (
                        <div className="p-3 rounded-lg bg-white border border-brass/20 text-[11px] text-aubergine/80 space-y-1">
                          <span className="font-bold text-aubergine block">Explanation:</span>
                          <p>{selectedTopic.knowledgeCheck.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ) : (
                <EmptyState title="Select a Topic" description="Choose a topic on the left to read verified borrowing guides." />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: AI LOAN ASSISTANT */}
      {/* ========================================================================= */}
      {activeTab === 'assistant' && (
        <div className="space-y-6">
          <Card
            title="Grounded AI Loan Assistant"
            subtitle="Ask questions on loan terms, amortization math, trade-offs, or education subsidies"
          >
            <div className="space-y-4">
              <form onSubmit={handleAskAssistant} className="space-y-3">
                <div className="relative">
                  <textarea
                    rows={3}
                    value={assistantQuery}
                    onChange={(e) => setAssistantQuery(e.target.value)}
                    placeholder="e.g. Explain why an 8% flat rate loan is actually more expensive than a 12% reducing balance loan..."
                    className="w-full p-3.5 rounded-xl border border-brass/30 bg-ivory-surface text-aubergine text-xs focus:ring-2 focus:ring-terracotta focus:outline-none"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[10px] text-aubergine/50 font-mono">
                      Strict source grounding: Only verified RBI & bank registry data is referenced.
                    </span>
                    <Button type="submit" variant="primary" size="sm" loading={loadingAssistant} className="gap-1.5">
                      <Send className="w-3.5 h-3.5" />
                      Ask Loan Assistant
                    </Button>
                  </div>
                </div>
              </form>

              {/* Sample Prompts */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  'What is a reducing balance loan vs flat rate?',
                  'How does the moratorium period work on an education loan?',
                  'Can my bank charge foreclosure fees if I prepay early?',
                  'What does a 50% Debt-to-Income (DTI) ratio mean for my loan?',
                ].map((sample, sIdx) => (
                  <button
                    key={sIdx}
                    onClick={() => setAssistantQuery(sample)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-ivory-dark hover:bg-brass/20 text-aubergine border border-brass/20 transition-colors"
                  >
                    "{sample}"
                  </button>
                ))}
              </div>

              {/* Error Message */}
              {assistantError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  {assistantError}
                </div>
              )}

              {/* Response Card */}
              {assistantResponse && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-aubergine via-[#391e3b] to-aubergine text-ivory border border-brass/30 shadow-md space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-brass/20">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span className="text-xs font-bold text-ivory uppercase tracking-wider">
                        Educational Explanation
                      </span>
                    </div>
                    <span className="text-[10px] text-brass-light font-mono">
                      {assistantResponse.isAiGenerated ? 'Powered by Gemini 1.5 Flash' : 'Grounded Deterministic Engine'}
                    </span>
                  </div>

                  <div className="text-xs text-ivory/90 leading-relaxed whitespace-pre-line font-sans space-y-2">
                    {assistantResponse.answer}
                  </div>

                  {/* Sources Grounding */}
                  {assistantResponse.sources && assistantResponse.sources.length > 0 && (
                    <div className="pt-3 border-t border-brass/20 space-y-1.5">
                      <span className="text-[10px] text-brass-light font-bold uppercase tracking-wider block">
                        Verified Reference Sources:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {assistantResponse.sources.map((src, idx) => (
                          <a
                            key={idx}
                            href={src.officialSourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] text-ivory transition-colors"
                          >
                            <span>{src.lenderName || src.productName}</span>
                            <ExternalLink className="w-3 h-3 text-brass-light" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default LoanGuidePage;
