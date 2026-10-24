import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { formatPaiseToINR } from '../../utils/formatters';
import { api } from '../../services/api';
import {
  TrendingUp,
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
  PieChart,
  BarChart2,
  Clock,
  CheckCircle2,
  Info,
  Calculator,
  Percent
} from 'lucide-react';

const ASSET_CLASSES = [
  {
    title: 'Public Provident Fund (PPF)',
    category: 'Government Backed',
    riskLevel: 'Very Low',
    timeHorizon: '15 Years',
    taxStatus: 'EEE (Exempt-Exempt-Exempt)',
    liquidity: 'Low',
    description: 'Sovereign-backed savings instrument offering tax-free interest and long-term capital preservation.',
    highlight: 'Sovereign Guarantee',
  },
  {
    title: 'Bank Fixed Deposits (FD)',
    category: 'Fixed Income',
    riskLevel: 'Low',
    timeHorizon: '7 Days – 10 Years',
    taxStatus: 'Interest Taxable at Slab',
    liquidity: 'High (Penalty on premature)',
    description: 'Predictable capital return backed by DICGC insurance up to ₹5,00,000 per depositor per bank.',
    highlight: 'DICGC Insured up to ₹5L',
  },
  {
    title: 'Index Mutual Funds (Nifty 50)',
    category: 'Equity Market',
    riskLevel: 'Moderate to High',
    timeHorizon: '5+ Years',
    taxStatus: 'LTCG @ 12.5% above ₹1.25L',
    liquidity: 'High (T+2 settlement)',
    description: 'Low-cost passive investment replicating India’s top 50 listed companies. Beats long-term inflation.',
    highlight: 'Historical Inflation Hedge',
  },
  {
    title: 'Direct Equities (Stocks)',
    category: 'Active Equity',
    riskLevel: 'High',
    timeHorizon: 'Variable',
    taxStatus: 'STCG @ 20% / LTCG @ 12.5%',
    liquidity: 'High (T+1 settlement)',
    description: 'Direct ownership in individual companies. High volatility; requires deep fundamental analysis.',
    highlight: 'Requires Active Due Diligence',
  },
];

export function InvestmentGuidePage() {
  // Calculator inputs
  const [monthlyAmount, setMonthlyAmount] = useState('5000');
  const [expectedReturn, setExpectedReturn] = useState('12');
  const [horizonYears, setHorizonYears] = useState('10');
  const [inflationRate, setInflationRate] = useState('6');

  // Calculator outputs
  const [projection, setProjection] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState(null);

  // Sources
  const [sources, setSources] = useState([]);

  useEffect(() => {
    async function fetchSources() {
      try {
        const res = await api.get('/guidance/sources');
        if (res.data?.data) {
          setSources(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load guidance sources:', err);
      }
    }
    fetchSources();
  }, []);

  const runInvestmentCalculation = async () => {
    const monthly = parseFloat(monthlyAmount);
    const ret = parseFloat(expectedReturn);
    const years = parseInt(horizonYears, 10);
    const infl = inflationRate === '' ? 0 : parseFloat(inflationRate);

    // Precise client-side validation
    if (isNaN(monthly) || monthly <= 0) {
      setCalcError('Monthly investment must be greater than zero.');
      setProjection(null);
      return;
    }
    if (monthly > 10000000) {
      setCalcError('Monthly investment cannot exceed ₹1 Crore (₹10,000,000).');
      setProjection(null);
      return;
    }
    if (isNaN(ret) || ret < 0) {
      setCalcError('Expected annual return cannot be negative.');
      setProjection(null);
      return;
    }
    if (ret > 100) {
      setCalcError('Expected annual return cannot exceed 100% per annum.');
      setProjection(null);
      return;
    }
    if (isNaN(years) || years <= 0 || !Number.isInteger(years)) {
      setCalcError('Investment horizon must be a positive whole number of years.');
      setProjection(null);
      return;
    }
    if (years > 60) {
      setCalcError('Investment horizon cannot exceed 60 years.');
      setProjection(null);
      return;
    }
    if (isNaN(infl) || infl < 0 || infl > 100) {
      setCalcError('Annual inflation rate must be between 0% and 100%.');
      setProjection(null);
      return;
    }

    try {
      setCalcLoading(true);
      setCalcError(null);
      const res = await api.post('/guidance/calculate-investment', {
        monthlyInvestment: monthly,
        expectedAnnualReturnPct: ret,
        expectedAnnualReturnPercent: ret,
        timeHorizonYears: years,
        horizonYears: years,
        inflationRatePct: infl,
        annualInflationPercent: infl,
      });
      if (res.data?.data) {
        setProjection(res.data.data);
      }
    } catch (err) {
      setCalcError(err.response?.data?.message || 'Unable to evaluate projection with given parameters.');
    } finally {
      setCalcLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (monthlyAmount !== '' && expectedReturn !== '' && horizonYears !== '') {
        runInvestmentCalculation();
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [monthlyAmount, expectedReturn, horizonYears, inflationRate]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-theme-primary">
              Investment Learning & Risk Guide
            </h1>
            <Badge variant="terracotta" size="sm">SEBI Compliant Education</Badge>
          </div>
          <p className="text-xs text-theme-muted mt-1">
            Compounding projections • Inflation discounting • Asset classes • Zero stock tips
          </p>
        </div>
      </div>

      {/* Mandatory SEBI Disclaimer Banner - preserve light amber background and dark text */}
      <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-300 text-xs text-amber-950 flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-amber-900 block uppercase tracking-wider text-[11px]">
            Mandatory Regulatory Disclosure (SRS 4.13, FR-INV-05)
          </span>
          <p className="leading-relaxed">
            FinLearn is an educational platform and is NOT a SEBI-registered investment adviser. Investments in securities markets are subject to market risks; past performance is not indicative of future returns. FinLearn does not provide personalized buy/sell stock recommendations or guarantee capital appreciation.
          </p>
        </div>
      </div>

      {/* Educational SIP Compounding & Inflation Discounting Calculator */}
      <Card
        title="Educational Wealth Compounding & Inflation Simulator"
        subtitle="Understand how systematic compounding grows nominal wealth while inflation impacts true purchasing power"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          {/* Controls */}
          <div className="lg:col-span-5 space-y-3">
            <Input
              label="Monthly Investment (₹)"
              type="number"
              value={monthlyAmount}
              onChange={(e) => setMonthlyAmount(e.target.value)}
              placeholder="e.g. 5000"
              required
            />

            <Input
              label="Assumed Annual Return (% p.a.)"
              type="number"
              step="0.5"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(e.target.value)}
              placeholder="e.g. 12"
              required
              helperText="Hypothetical educational rate; not guaranteed"
            />

            <Input
              label="Investment Horizon (Years)"
              type="number"
              value={horizonYears}
              onChange={(e) => setHorizonYears(e.target.value)}
              placeholder="e.g. 10"
              required
            />

            <Input
              label="Assumed Annual Inflation (% p.a.)"
              type="number"
              step="0.5"
              value={inflationRate}
              onChange={(e) => setInflationRate(e.target.value)}
              placeholder="e.g. 6"
              helperText="Discounts nominal corpus to today's purchasing power"
            />
          </div>

          {/* Results Visuals */}
          <div className="lg:col-span-7 space-y-4">
            {calcError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300">
                {calcError}
              </div>
            )}

            <div className="p-5 rounded-2xl bg-aubergine text-ivory space-y-2 border border-aubergine-light shadow-sm">
              <span className="text-xs font-bold text-brass-light uppercase tracking-wider block">
                Projected Nominal Future Value
              </span>
              <div className="text-3xl sm:text-4xl font-black text-ivory font-mono">
                {projection
                  ? (projection.nominalFutureValuePaise !== undefined
                      ? formatPaiseToINR(projection.nominalFutureValuePaise)
                      : formatRupeesToINR(projection.futureValueNominal))
                  : '₹0.00'}
              </div>
              <p className="text-[11px] text-lilac-light">
                Total invested principal: {projection
                  ? (projection.totalInvestedPaise !== undefined
                      ? formatPaiseToINR(projection.totalInvestedPaise)
                      : formatRupeesToINR(projection.totalInvested))
                  : '₹0'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-theme-subtle border border-theme-border space-y-1">
                <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block">
                  Wealth Gain (Gain from Compounding)
                </span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono block">
                  {projection
                    ? (projection.nominalWealthGainPaise !== undefined
                        ? formatPaiseToINR(projection.nominalWealthGainPaise)
                        : formatRupeesToINR(projection.estimatedWealthGain))
                    : '₹0.00'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-theme-subtle border border-theme-border space-y-1">
                <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block">
                  Inflation-Adjusted Purchasing Power
                </span>
                <span className="text-sm font-black text-theme-primary font-mono block">
                  {projection
                    ? (projection.inflationAdjustedValuePaise !== undefined
                        ? formatPaiseToINR(projection.inflationAdjustedValuePaise)
                        : formatRupeesToINR(projection.futureValueReal))
                    : '₹0.00'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-theme-subtle border border-theme-border text-[11px] text-theme-muted space-y-1">
              <span className="font-bold text-theme-primary">Real World Takeaway:</span>
              <p>
                At a {inflationRate || 0}% annual inflation rate over {horizonYears || 0} years, the purchasing power of your ₹{projection ? Math.round((projection.nominalFutureValuePaise !== undefined ? projection.nominalFutureValuePaise / 100 : projection.futureValueNominal) || 0).toLocaleString('en-IN') : 0} corpus is equivalent to ₹{projection ? Math.round((projection.inflationAdjustedValuePaise !== undefined ? projection.inflationAdjustedValuePaise / 100 : projection.futureValueReal) || 0).toLocaleString('en-IN') : 0} in today's money.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Asset Classes Comparison Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-theme-primary">
          Indian Asset Class Risk & Liquidity Overview
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ASSET_CLASSES.map((asset, idx) => (
            <Card key={idx} className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-bold text-theme-primary">{asset.title}</h4>
                  <span className="text-[11px] text-theme-muted font-semibold">{asset.category}</span>
                </div>
                <Badge
                  variant={asset.riskLevel.includes('High') ? 'terracotta' : 'brass'}
                  size="sm"
                >
                  {asset.riskLevel}
                </Badge>
              </div>

              <p className="text-xs text-theme-muted leading-relaxed">
                {asset.description}
              </p>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-theme-border">
                <div className="p-2 rounded-lg bg-theme-subtle">
                  <span className="text-theme-muted block">Time Horizon:</span>
                  <span className="font-bold text-theme-primary font-mono">{asset.timeHorizon}</span>
                </div>
                <div className="p-2 rounded-lg bg-theme-subtle">
                  <span className="text-theme-muted block">Liquidity:</span>
                  <span className="font-bold text-theme-primary font-mono">{asset.liquidity}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-theme-subtle text-[11px] text-theme-muted flex items-center justify-between border border-theme-border">
                <span>Taxation:</span>
                <span className="font-mono font-semibold text-theme-primary">{asset.taxStatus}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* How to Verify SEBI Registration Card */}
      <Card
        title="How to Verify an Investment Adviser (RIA)"
        subtitle="Protect yourself from illegal Telegram tip channels and fake PMS operators"
      >
        <div className="space-y-3 text-xs leading-relaxed text-theme-muted">
          <p>
            Under SEBI regulations, anyone offering personalized investment advice for a fee must hold a valid <strong className="text-theme-primary">SEBI Registered Investment Adviser (RIA)</strong> or <strong className="text-theme-primary">Research Analyst (RA)</strong> license.
          </p>

          <div className="p-3.5 rounded-xl bg-theme-subtle border border-theme-border flex items-center justify-between gap-4">
            <div>
              <span className="font-bold text-theme-primary block">Official SEBI Intermediary Registry</span>
              <span className="text-[11px] text-theme-muted">Search registered advisers and verify license validity</span>
            </div>
            <a
              href="https://investor.sebi.gov.in/investment_advisor.html"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-terracotta text-white font-bold text-xs hover:bg-terracotta-hover transition-colors shrink-0"
            >
              <span>Check SEBI Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default InvestmentGuidePage;
