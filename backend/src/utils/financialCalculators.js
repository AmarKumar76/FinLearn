/**
 * Safe, deterministic financial and loan calculators for FinLearn.
 * Follows SRS 4.12 reducing-balance formula and transparent assumptions.
 */

/**
 * Standard reducing-balance EMI calculation
 * Formula: EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
 * Special case: Zero-interest loan -> EMI = P / n
 *
 * @param {number} principal - Loan principal (₹)
 * @param {number} annualRatePct - Annual interest rate percentage (e.g. 12 for 12%)
 * @param {number} tenureMonths - Tenure in months (e.g. 60)
 * @param {number} processingFeePct - Disclosed processing fee percentage (e.g. 1.5)
 * @param {number} upfrontFixedCharges - Additional fixed charges/documentation in ₹ (e.g. 1000)
 */
export function calculateLoanEmi({
  principal,
  annualRatePct,
  tenureMonths,
  processingFeePct = 0,
  upfrontFixedCharges = 0,
}) {
  const p = Number(principal);
  const rAnnual = Number(annualRatePct);
  const n = Number(tenureMonths);
  const feePct = Number(processingFeePct) || 0;
  const fixedCharges = Number(upfrontFixedCharges) || 0;

  if (isNaN(p) || p <= 0) {
    throw new Error('Principal amount must be a positive number');
  }
  if (isNaN(rAnnual) || rAnnual < 0) {
    throw new Error('Annual interest rate cannot be negative');
  }
  if (isNaN(n) || n <= 0 || !Number.isInteger(n)) {
    throw new Error('Tenure in months must be a positive integer');
  }

  let monthlyEmi = 0;
  let totalRepayment = 0;
  let totalInterest = 0;

  if (rAnnual === 0) {
    monthlyEmi = Math.round((p / n) * 100) / 100;
    totalRepayment = p;
    totalInterest = 0;
  } else {
    const rMonthly = rAnnual / (12 * 100);
    const factor = Math.pow(1 + rMonthly, n);
    const exactEmi = (p * rMonthly * factor) / (factor - 1);
    monthlyEmi = Math.round(exactEmi); // Nearest rupee
    totalRepayment = monthlyEmi * n;
    totalInterest = totalRepayment - p;
  }

  // Generate monthly amortization schedule
  const amortizationSchedule = [];
  let remainingPrincipal = p;
  const rMonthly = rAnnual > 0 ? rAnnual / (12 * 100) : 0;

  for (let month = 1; month <= n; month++) {
    let interestPayment = 0;
    let principalPayment = 0;

    if (rAnnual === 0) {
      interestPayment = 0;
      principalPayment = month === n ? remainingPrincipal : Math.round(monthlyEmi);
    } else {
      interestPayment = Math.round(remainingPrincipal * rMonthly);
      principalPayment = month === n ? remainingPrincipal : Math.min(remainingPrincipal, monthlyEmi - interestPayment);
    }

    const endingBalance = Math.max(0, remainingPrincipal - principalPayment);

    amortizationSchedule.push({
      month,
      beginningBalance: remainingPrincipal,
      emi: principalPayment + interestPayment,
      principalPaid: principalPayment,
      interestPaid: interestPayment,
      endingBalance,
    });

    remainingPrincipal = endingBalance;
    if (remainingPrincipal <= 0) break;
  }

  // Upfront fee computation with standard 18% GST on processing services in India
  const processingFee = (p * feePct) / 100;
  const gstOnFee = processingFee * 0.18;
  const totalUpfrontCost = Math.round(processingFee + gstOnFee + fixedCharges);
  const netDisbursedAmount = Math.max(0, p - totalUpfrontCost);
  const totalCostOfBorrowing = totalInterest + totalUpfrontCost;

  return {
    principal: p,
    annualRatePct: rAnnual,
    tenureMonths: n,
    monthlyEmi,
    totalRepayment,
    totalInterest,
    processingFee: Math.round(processingFee),
    gstOnFee: Math.round(gstOnFee),
    fixedCharges,
    totalUpfrontCost,
    netDisbursedAmount,
    totalCostOfBorrowing,
    amortizationSchedule,
    // Paise-compatible representations for consistent platform UI formatting
    monthlyEmiPaise: Math.round(monthlyEmi * 100),
    totalRepaymentPaise: Math.round(totalRepayment * 100),
    totalInterestPaise: Math.round(totalInterest * 100),
    netDisbursedPaise: Math.round(netDisbursedAmount * 100),
    upfrontFeeBreakdown: {
      processingFeePaise: Math.round(processingFee * 100),
      gstOnFeePaise: Math.round(gstOnFee * 100),
      fixedChargesPaise: Math.round(fixedCharges * 100),
      totalUpfrontCostPaise: Math.round(totalUpfrontCost * 100),
    },
    assumptions: [
      'Standard reducing-balance monthly amortization formula.',
      '18% GST applied exclusively to processing fee as per Indian tax norms.',
      'Estimates do not include pre-payment penalties, delayed EMI charges, or insurance rider premiums.',
      'Actual lender amortizations may vary slightly based on day-count conventions (30/360 vs actual/365).',
    ],
  };
}

/**
 * Educational Compound Interest / SIP growth projection
 *
 * @param {number} monthlyInvestment - Monthly contribution (₹)
 * @param {number} expectedAnnualReturnPct - Expected annual return (e.g. 12%)
 * @param {number} timeHorizonYears - Investment duration in years
 * @param {number} inflationRatePct - Expected annual inflation rate for real returns (e.g. 6%)
 */
export function calculateInvestmentProjection({
  monthlyInvestment,
  expectedAnnualReturnPct,
  timeHorizonYears,
  inflationRatePct = 6,
}) {
  const p = Number(monthlyInvestment);
  const rAnnual = Number(expectedAnnualReturnPct);
  const years = parseInt(timeHorizonYears, 10);
  const infAnnual = Number(inflationRatePct) || 0;

  if (isNaN(p) || p <= 0) {
    throw new Error('Monthly investment must be greater than zero');
  }
  if (p > 10000000) {
    throw new Error('Monthly investment cannot exceed ₹1 Crore (₹10,000,000)');
  }
  if (isNaN(rAnnual) || rAnnual < 0) {
    throw new Error('Expected annual return cannot be negative');
  }
  if (rAnnual > 100) {
    throw new Error('Expected annual return cannot exceed 100% per annum');
  }
  if (isNaN(years) || years <= 0 || !Number.isInteger(years)) {
    throw new Error('Time horizon in years must be a positive whole number');
  }
  if (years > 60) {
    throw new Error('Time horizon cannot exceed 60 years');
  }
  if (isNaN(infAnnual) || infAnnual < 0 || infAnnual > 100) {
    throw new Error('Annual inflation must be between 0% and 100%');
  }

  const totalMonths = years * 12;
  const totalInvested = p * totalMonths;

  let futureValueNominal = 0;
  if (rAnnual === 0) {
    futureValueNominal = totalInvested;
  } else {
    const rMonthly = rAnnual / (12 * 100);
    // Formula for Future Value of an Annuity (monthly investments at month beginning/end):
    // FV = P * [((1 + r)^n - 1) / r] * (1 + r)
    futureValueNominal = Math.round(
      p * ((Math.pow(1 + rMonthly, totalMonths) - 1) / rMonthly) * (1 + rMonthly)
    );
  }

  const estimatedWealthGain = Math.max(0, futureValueNominal - totalInvested);

  // Purchasing power / inflation adjusted real value:
  // Real FV = Nominal FV / (1 + inflation)^years
  const inflationFactor = Math.pow(1 + infAnnual / 100, years);
  const futureValueReal = Math.round(futureValueNominal / inflationFactor);

  return {
    monthlyInvestment: p,
    expectedAnnualReturnPct: rAnnual,
    timeHorizonYears: years,
    totalMonths,
    totalInvested,
    futureValueNominal,
    estimatedWealthGain,
    inflationRatePct: infAnnual,
    futureValueReal,
    assumptions: [
      'Constant compounding rate over the entire investment horizon.',
      'Actual market performance fluctuates daily and returns are never guaranteed.',
      'Real value estimates future purchasing power adjusted for hypothetical inflation.',
    ],
  };
}

/**
 * Preliminary Personal Loan Affordability & DTI (Debt-to-Income) Analyzer
 * Computes FOIR (Fixed Obligation to Income Ratio) against standard Indian banking norms (40% - 50%).
 *
 * @param {number} monthlyIncome - Net take-home monthly salary (₹)
 * @param {number} existingEmis - Existing monthly debt obligations (₹)
 * @param {number} proposedLoanAmount - Requested loan amount (₹)
 * @param {number} annualRatePct - Annual interest rate assumption (%)
 * @param {number} tenureMonths - Proposed tenure in months
 */
export function calculateLoanAffordability({
  monthlyIncome,
  existingEmis = 0,
  proposedLoanAmount,
  annualRatePct,
  tenureMonths,
}) {
  const income = Number(monthlyIncome);
  const currentEmis = Number(existingEmis) || 0;
  const loanAmount = Number(proposedLoanAmount);
  const ratePct = Number(annualRatePct);
  const tenure = Number(tenureMonths);

  if (isNaN(income) || income <= 0) {
    throw new Error('Monthly net income must be a positive number');
  }
  if (isNaN(currentEmis) || currentEmis < 0) {
    throw new Error('Existing EMIs cannot be negative');
  }
  if (isNaN(loanAmount) || loanAmount <= 0) {
    throw new Error('Proposed loan amount must be a positive number');
  }
  if (isNaN(ratePct) || ratePct < 0) {
    throw new Error('Annual interest rate cannot be negative');
  }
  if (isNaN(tenure) || tenure <= 0 || !Number.isInteger(tenure)) {
    throw new Error('Tenure in months must be a positive integer');
  }

  // Calculate proposed EMI
  const emiCalc = calculateLoanEmi({
    principal: loanAmount,
    annualRatePct: ratePct,
    tenureMonths: tenure,
  });

  const proposedEmi = emiCalc.monthlyEmi;
  const totalMonthlyCommitments = currentEmis + proposedEmi;
  const existingDtiPct = Math.round((currentEmis / income) * 1000) / 10;
  const projectedDtiPct = Math.round((totalMonthlyCommitments / income) * 1000) / 10;
  const maxPrudentEmiCapacity = Math.max(0, Math.round(income * 0.50 - currentEmis));
  const surplusIncomeAfterEmis = Math.round(income - totalMonthlyCommitments);

  // Categorize affordability tier
  let affordabilityTier = 'COMFORTABLE';
  let tierDescription = 'Healthy debt profile. Projected total EMIs consume less than 40% of net income.';

  if (projectedDtiPct > 60) {
    affordabilityTier = 'CRITICAL_OVERBURDEN';
    tierDescription = 'High risk of debt distress. Total EMIs exceed 60% of income, leaving minimal buffer for living expenses and emergencies.';
  } else if (projectedDtiPct > 50) {
    affordabilityTier = 'STRETCHED';
    tierDescription = 'Exceeds standard 50% Indian banking underwriting benchmark. Most lenders may require a co-borrower or reduce sanctioned amount.';
  } else if (projectedDtiPct > 40) {
    affordabilityTier = 'MODERATE';
    tierDescription = 'Within acceptable bank thresholds (40%-50%), but offers less flexibility for unexpected monthly expenses.';
  }

  return {
    monthlyIncome: income,
    existingEmis: currentEmis,
    proposedLoanAmount: loanAmount,
    proposedEmi,
    totalMonthlyCommitments,
    existingDtiPct,
    projectedDtiPct,
    maxPrudentEmiCapacity,
    surplusIncomeAfterEmis,
    affordabilityTier,
    tierDescription,
    underwritingGuidelines: [
      'Standard Indian banks cap total Fixed Obligations to Income (FOIR) at 40% to 50% of net monthly income.',
      'This calculation is an educational affordability estimate and does NOT guarantee credit approval or sanction.',
      'Final lender decisions evaluate CIBIL history, employer category, and residential stability.',
    ],
  };
}

/**
 * Education Loan Funding Gap & Repayment Analyzer
 * Analyzes total academic expenses vs available savings, scholarship, and student loan requirement.
 *
 * @param {number} tuitionFees - Total course tuition and institutional fees (₹)
 * @param {number} livingExpenses - Accommodation, food, and living costs (₹)
 * @param {number} booksAndEquipment - Laptops, books, and study materials (₹)
 * @param {number} travelAndVisa - Travel tickets, visa fees, and insurance (₹)
 * @param {number} existingSavings - Family savings earmarked for education (₹)
 * @param {number} scholarshipAmount - Confirmed scholarship or grants (₹)
 * @param {number} annualRatePct - Assumed education loan rate (%)
 * @param {number} courseDurationMonths - Course duration in months
 * @param {number} repaymentTenureMonths - Desired repayment tenure after moratorium (months)
 */
export function calculateEducationLoanGap({
  tuitionFees,
  livingExpenses = 0,
  booksAndEquipment = 0,
  travelAndVisa = 0,
  existingSavings = 0,
  scholarshipAmount = 0,
  annualRatePct = 9.5,
  courseDurationMonths = 24,
  repaymentTenureMonths = 120,
}) {
  const tuition = Number(tuitionFees) || 0;
  const living = Number(livingExpenses) || 0;
  const books = Number(booksAndEquipment) || 0;
  const travel = Number(travelAndVisa) || 0;
  const savings = Number(existingSavings) || 0;
  const scholarship = Number(scholarshipAmount) || 0;
  const ratePct = Number(annualRatePct);
  const courseMonths = Number(courseDurationMonths);
  const repayMonths = Number(repaymentTenureMonths);

  if (tuition <= 0 && living <= 0) {
    throw new Error('Please provide estimated tuition or living expenses');
  }
  if (repayMonths <= 0 || !Number.isInteger(repayMonths)) {
    throw new Error('Repayment tenure in months must be a positive integer');
  }

  const totalEducationCost = tuition + living + books + travel;
  const totalOwnFunds = savings + scholarship;
  const fundingGap = Math.max(0, totalEducationCost - totalOwnFunds);

  // Compute estimated repayment on the funding gap
  let loanEstimate = null;
  if (fundingGap > 0) {
    loanEstimate = calculateLoanEmi({
      principal: fundingGap,
      annualRatePct: ratePct,
      tenureMonths: repayMonths,
    });
  }

  // Moratorium simple interest estimation (Course duration + 12 months)
  const totalMoratoriumMonths = courseMonths + 12;
  const estimatedMoratoriumSimpleInterest = fundingGap > 0
    ? Math.round((fundingGap * (ratePct / 100) * totalMoratoriumMonths) / 12)
    : 0;

  return {
    costBreakdown: {
      tuitionFees: tuition,
      livingExpenses: living,
      booksAndEquipment: books,
      travelAndVisa: travel,
      totalEducationCost,
    },
    fundingSources: {
      existingSavings: savings,
      scholarshipAmount: scholarship,
      totalOwnFunds,
    },
    fundingGap,
    isFullyFunded: fundingGap === 0,
    moratoriumDetails: {
      courseDurationMonths: courseMonths,
      moratoriumBufferMonths: 12,
      totalMoratoriumMonths,
      estimatedSimpleInterestDuringMoratorium: estimatedMoratoriumSimpleInterest,
      csisSubsidyNote: 'Students with parental income under ₹4.5L/yr may qualify for 100% interest subsidy during moratorium under Ministry of Education CSIS via Vidya Lakshmi Portal.',
    },
    repaymentEstimate: loanEstimate
      ? {
          loanPrincipal: fundingGap,
          repaymentTenureMonths: repayMonths,
          estimatedMonthlyEmi: loanEstimate.monthlyEmi,
          estimatedMonthlyEmiPaise: loanEstimate.monthlyEmiPaise,
          totalRepayment: loanEstimate.totalRepayment,
          totalInterest: loanEstimate.totalInterest,
        }
      : null,
    regulatoryNotes: [
      'Loans up to ₹7.5 Lakhs under Model Educational Loan Scheme require no collateral security (parental co-obligation mandatory).',
      'Loans above ₹7.5 Lakhs generally require tangible collateral (residential/commercial property, fixed deposits).',
      'Apply through the Government of India Vidya Lakshmi Portal (vidyalakshmi.co.in) to compare registered public sector schemes.',
    ],
  };
}

export default {
  calculateLoanEmi,
  calculateInvestmentProjection,
  calculateLoanAffordability,
  calculateEducationLoanGap,
};

