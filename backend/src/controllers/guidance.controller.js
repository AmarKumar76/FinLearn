import {
  calculateLoanEmi,
  calculateInvestmentProjection,
  calculateLoanAffordability,
  calculateEducationLoanGap,
} from '../utils/financialCalculators.js';
import { VERIFIED_LOAN_PRODUCTS, LOAN_LEARNING_TOPICS } from '../config/loanRegistry.js';
import { askLoanAssistantWithGemini } from '../utils/loanAssistantService.js';
import { Source } from '../models/source.model.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import {
  safelyParseUrl,
  inspectDomainAgainstRegistry,
  performSafeDnsCheck,
  analyzeMessageText,
  verifyOfficialEntityClaims,
} from '../utils/scamVerificationEngine.js';
import { explainSafetyEvidenceWithGemini } from '../utils/safetyExplainerService.js';

// Seed sources list if database has no sources initially
const INITIAL_VERIFIED_SOURCES = [
  {
    title: 'National Cyber Crime Reporting Portal (1930 Helpline)',
    organization: 'Ministry of Home Affairs (MHA), Government of India',
    url: 'https://www.cybercrime.gov.in',
    category: 'Cyber Safety & Scam Protection',
    description: 'Central portal to report financial cyber fraud, phishing incidents, and freeze illicit transaction flows within the golden hour.',
    lastReviewedDate: '2026-10-10',
    reviewStatus: 'verified',
    notes: 'National helpline 1930 operational 24/7 across all Indian states and Union Territories.',
  },
  {
    title: 'RBI Sachet Portal (Unregulated Deposit & Illegal App Tracker)',
    organization: 'Reserve Bank of India (RBI)',
    url: 'https://sachet.rbi.org.in',
    category: 'Lending & Borrowing Regulations',
    description: 'Facilitates verification of registered NBFCs and allows citizens to lodge complaints against illegal digital lending apps and Ponzi schemes.',
    lastReviewedDate: '2026-10-10',
    reviewStatus: 'verified',
    notes: 'Check Regulated Entity status before transacting with online lenders.',
  },
  {
    title: 'SEBI Investor Education Portal (Saarthi & SCORES)',
    organization: 'Securities and Exchange Board of India (SEBI)',
    url: 'https://investor.sebi.gov.in',
    category: 'Investment & Securities Education',
    description: 'Official securities regulator guidance on mutual funds, stock market risks, registered intermediaries, and investor grievance redressal (SCORES).',
    lastReviewedDate: '2026-10-10',
    reviewStatus: 'verified',
    notes: 'Verify registered SEBI Investment Advisers and Research Analysts.',
  },
  {
    title: 'Deposit Insurance and Credit Guarantee Corporation (DICGC)',
    organization: 'Reserve Bank of India Subsidiary',
    url: 'https://www.dicgc.org.in',
    category: 'Banking & Payment Systems',
    description: 'Insures commercial bank deposits (savings, current, fixed deposits) up to ₹5,00,000 per depositor per bank in the event of bank liquidation.',
    lastReviewedDate: '2026-10-10',
    reviewStatus: 'verified',
    notes: 'Includes principal and accrued interest up to the ₹5 Lakh ceiling.',
  },
  {
    title: 'Reserve Bank of India (Official Portal & Kehta Hai)',
    organization: 'Reserve Bank of India (RBI)',
    url: 'https://www.rbi.org.in',
    category: 'Banking & Payment Systems',
    description: 'Central banking authority public alerts, regulated commercial banks registry, and Kehta Hai public safety notifications.',
    lastReviewedDate: '2026-10-15',
    reviewStatus: 'verified',
    sourceType: 'regulator',
    domains: ['rbi.org.in', 'sachet.rbi.org.in', 'rbikehtahai.rbi.org.in'],
    threatIndicators: ['Fake RBI lottery prizes', 'Unofficial RBI approval fees'],
    retrievalStatus: 'available',
    notes: 'Official RBI portal. RBI never asks for personal account PINs or charges money to release lottery funds.',
  },
  {
    title: 'NPCI UPI & Digital Payment Fraud Awareness',
    organization: 'National Payments Corporation of India (NPCI)',
    url: 'https://www.npci.org.in/what-we-do/upi/fraud-awareness',
    category: 'Cyber Safety & Scam Protection',
    description: 'Official guidance on UPI security, unauthorized QR code traps, and digital payments fraud protection protocols.',
    lastReviewedDate: '2026-10-15',
    reviewStatus: 'verified',
    sourceType: 'payment_network',
    domains: ['npci.org.in', 'upichalega.com'],
    threatIndicators: ['PIN entry to receive money', 'QR scan cashback debit traps'],
    retrievalStatus: 'available',
    notes: 'UPI PIN is strictly required only to authorize debits (sending money), never for receiving.',
  },
];

/**
 * Public/Learner: Calculate loan EMI and compare scenarios
 * POST /api/v1/guidance/calculate-loan
 */
export async function calculateLoan(req, res, next) {
  try {
    const {
      principal,
      annualRatePct,
      annualInterestRate,
      tenureMonths,
      processingFeePct,
      processingFeePercent,
      upfrontFixedCharges,
    } = req.body;

    const rate = annualRatePct !== undefined ? annualRatePct : annualInterestRate;
    const fee = processingFeePct !== undefined ? processingFeePct : processingFeePercent;

    const result = calculateLoanEmi({
      principal,
      annualRatePct: rate,
      tenureMonths,
      processingFeePct: fee,
      upfrontFixedCharges,
    });

    return successResponse(res, result, 'Loan EMI calculation evaluated');
  } catch (err) {
    return errorResponse(res, err.message, 'VALIDATION_ERROR', 400);
  }
}

/**
 * Public/Learner: Calculate compound investment growth & real value
 * POST /api/v1/guidance/calculate-investment
 */
export async function calculateInvestment(req, res, next) {
  try {
    const {
      monthlyInvestment,
      expectedAnnualReturnPct,
      timeHorizonYears,
      inflationRatePct,
    } = req.body;

    const result = calculateInvestmentProjection({
      monthlyInvestment,
      expectedAnnualReturnPct,
      timeHorizonYears,
      inflationRatePct,
    });

    return successResponse(res, result, 'Investment growth projection evaluated');
  } catch (err) {
    return errorResponse(res, err.message, 'VALIDATION_ERROR', 400);
  }
}

/**
 * Public/Learner: Get verified official regulatory sources and reporting portals
 * GET /api/v1/guidance/sources
 */
export async function getVerifiedSources(req, res, next) {
  try {
    const { category } = req.query;
    const query = { reviewStatus: 'verified' };
    if (category) {
      query.category = category;
    }

    let sources = await Source.find(query).sort({ category: 1, title: 1 });

    // Seed defaults if empty
    if (sources.length === 0 && (!category || category === 'All')) {
      await Source.insertMany(INITIAL_VERIFIED_SOURCES);
      sources = await Source.find(query).sort({ category: 1, title: 1 });
    }

    return successResponse(res, { sources: sources.map((s) => s.toJSON()) }, 'Verified sources retrieved');
  } catch (err) {
    return next(err);
  }
}

/**
 * Admin: Add or update an official reference source
 * POST /api/v1/guidance/admin/sources
 */
export async function adminCreateSource(req, res, next) {
  try {
    const { title, organization, url, category, description, lastReviewedDate, reviewStatus, notes } = req.body;

    if (!title || !organization || !url || !category || !lastReviewedDate) {
      return errorResponse(res, 'Title, organization, url, category, and lastReviewedDate are required', 'VALIDATION_ERROR', 400);
    }

    const source = new Source({
      title: title.trim(),
      organization: organization.trim(),
      url: url.trim(),
      category,
      description: description?.trim() || '',
      lastReviewedDate,
      reviewStatus: reviewStatus || 'verified',
      notes: notes?.trim() || '',
    });

    await source.save();
    return successResponse(res, { source: source.toJSON() }, 'Reference source registered successfully', 201);
  } catch (err) {
    return next(err);
  }
}

/**
 * Public/Learner: Evidence-Based Scam, Message & Website Verification Engine
 * POST /api/v1/guidance/verify-scam
 *
 * Enforces:
 * - Length limits (min 10 chars, max 2000 chars)
 * - Anti-SSRF URL parsing with private IP blocks
 * - Domain registry checks against verified banks and regulators
 * - Linguistic message pattern detection
 * - Official claim verification
 * - Gemini explanation with deterministic grounded fallback
 * - Audit logging without storing sensitive message text
 */
export async function verifyScamOrWebsite(req, res, next) {
  try {
    const { messageText = '', url = '', claimedOrg = '', concernType = 'General' } = req.body;

    const trimmedText = typeof messageText === 'string' ? messageText.trim() : '';
    const trimmedUrl = typeof url === 'string' ? url.trim() : '';
    const trimmedOrg = typeof claimedOrg === 'string' ? claimedOrg.trim() : '';

    // Validate minimum input requirement: user must provide message text OR a url
    if (!trimmedText && !trimmedUrl) {
      return errorResponse(
        res,
        'Please provide either suspicious message text or a website URL for verification.',
        'VALIDATION_ERROR',
        400
      );
    }

    // Input length guardrails
    if (trimmedText.length > 2500) {
      return errorResponse(res, 'Message text exceeds the 2500 character limit.', 'VALIDATION_ERROR', 400);
    }
    if (trimmedUrl.length > 500) {
      return errorResponse(res, 'URL exceeds the 500 character limit.', 'VALIDATION_ERROR', 400);
    }
    if (trimmedOrg.length > 100) {
      return errorResponse(res, 'Claimed organization exceeds the 100 character limit.', 'VALIDATION_ERROR', 400);
    }

    // Privacy warning check: Warn if user pasted clear sensitive banking credentials
    const credentialsWarningRegex = /\b(\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}|\b\d{3}\b(?=\s*(cvv|cvc))|\b(my\s*password|my\s*pin|my\s*otp)\s*is\b)/i;
    const hasPastedCredentials = credentialsWarningRegex.test(trimmedText);

    // 1. Analyze Message Text
    const messageAnalysis = analyzeMessageText(trimmedText, trimmedOrg);

    // 2. Safe URL & Domain Verification with SSRF protection
    let parsedUrl = null;
    let domainAnalysis = null;
    let dnsCheck = null;

    if (trimmedUrl) {
      parsedUrl = safelyParseUrl(trimmedUrl);
      if (!parsedUrl.isValid) {
        return errorResponse(
          res,
          parsedUrl.error || 'The submitted website address is invalid or uses an unsafe protocol.',
          'VALIDATION_ERROR',
          400
        );
      }

      domainAnalysis = inspectDomainAgainstRegistry(parsedUrl.hostname, trimmedOrg);

      // Perform safe server-side DNS resolution (without connecting to HTTP/scripts)
      dnsCheck = await performSafeDnsCheck(parsedUrl.hostname);
    }

    // 3. Official Source Claims Verification
    const officialClaims = await verifyOfficialEntityClaims(
      trimmedOrg,
      trimmedText,
      domainAnalysis?.matchedEntity || domainAnalysis?.mimickedEntity || null
    );

    // 4. Synthesize / Explain Evidence with Gemini (or deterministic fallback)
    const explanationResult = await explainSafetyEvidenceWithGemini({
      userInput: {
        claimedOrg: trimmedOrg,
        concernType,
        url: parsedUrl ? parsedUrl.normalizedUrl : null,
        messageText: trimmedText,
      },
      messageAnalysis,
      domainAnalysis,
      dnsCheck,
      officialClaims,
    });

    // 5. Combine Deterministic Security Indicators with Gemini Contextual Threats
    const combinedIndicators = [...messageAnalysis.indicatorsFound];

    if (explanationResult.isAiExplained && explanationResult.aiAnalysis?.detectedThreats) {
      explanationResult.aiAnalysis.detectedThreats.forEach((aiThreat) => {
        const alreadyExists = combinedIndicators.some(
          (ind) => ind.category === aiThreat.category || ind.label === aiThreat.label
        );
        if (!alreadyExists) {
          combinedIndicators.push({
            category: aiThreat.category,
            label: aiThreat.label,
            severity: aiThreat.severity || 'High',
            description: aiThreat.explanation || `Identified via contextual AI analysis: "${aiThreat.supportingPhrase || ''}"`,
            safeGuidance: 'Do not follow instructions in this message. Financial institutions never demand transactions to receive funds.',
            detectedBy: 'gemini_contextual_analysis',
            supportingPhrase: aiThreat.supportingPhrase || null,
          });
        }
      });
    }

    // Determine final message severity (preserve highest warning level)
    let finalSeverity = messageAnalysis.severity;
    if (combinedIndicators.some((i) => i.severity === 'Critical')) {
      finalSeverity = 'Critical';
    } else if (combinedIndicators.some((i) => i.severity === 'High')) {
      finalSeverity = finalSeverity === 'Critical' ? 'Critical' : 'High';
    } else if (combinedIndicators.some((i) => i.severity === 'Medium')) {
      finalSeverity = ['Critical', 'High'].includes(finalSeverity) ? finalSeverity : 'Medium';
    }

    // 6. Categorize Overall Outcome Category
    // Core rule: Gemini CANNOT override verified facts or declare an unknown domain safe
    let outcomeCategory = 'UNABLE_TO_VERIFY';
    if (
      combinedIndicators.length > 0 ||
      domainAnalysis?.isLookalikeDeception ||
      domainAnalysis?.isMismatchedDomain ||
      dnsCheck?.isPrivateAddressBlocked
    ) {
      outcomeCategory = 'SUSPICIOUS_EVIDENCE_FOUND';
    } else if (domainAnalysis?.isVerifiedOfficial && combinedIndicators.length === 0) {
      outcomeCategory = 'VERIFIED_OFFICIAL_ENTITY';
    } else {
      outcomeCategory = 'UNABLE_TO_VERIFY';
    }

    // 7. Audit Logging (Strict Privacy: DO NOT log full user message or credentials)
    logAuditEvent({
      actor: req.user,
      action: 'SCAM_VERIFICATION_REQUESTED',
      targetType: 'System',
      targetId: null,
      details: {
        concernType,
        hasUrl: Boolean(trimmedUrl),
        domainChecked: domainAnalysis?.hostname || null,
        outcomeCategory,
        severity: finalSeverity,
        indicatorsCount: combinedIndicators.length,
        hasPastedCredentialsWarning: hasPastedCredentials,
        isAiExplained: explanationResult.isAiExplained,
      },
      ipAddress: req.ip || '127.0.0.1',
    });

    const verificationResult = {
      outcomeCategory,
      timestamp: new Date().toISOString(),
      submittedQuerySummary: {
        claimedOrganization: trimmedOrg || null,
        concernType,
        urlInspected: parsedUrl ? parsedUrl.normalizedUrl : null,
        domainInspected: parsedUrl ? parsedUrl.hostname : null,
        hasPastedCredentialsWarning: hasPastedCredentials,
      },
      messageAnalysis: {
        severity: finalSeverity,
        indicatorsFound: combinedIndicators,
        summary:
          combinedIndicators.length > 0
            ? `Detected ${combinedIndicators.length} security indicator(s): ${combinedIndicators.map((i) => i.label).join('; ')}.`
            : 'No high-frequency scam triggers detected in message text.',
      },
      domainVerification: domainAnalysis
        ? {
            hostname: domainAnalysis.hostname || parsedUrl?.hostname,
            status: domainAnalysis.status,
            isVerifiedOfficial: domainAnalysis.isVerifiedOfficial,
            matchedEntity: domainAnalysis.matchedEntity || null,
            mimickedEntity: domainAnalysis.mimickedEntity || null,
            officialDomain: domainAnalysis.officialDomain || null,
            details: domainAnalysis.details,
            dnsCheckStatus: dnsCheck ? dnsCheck.details : null,
          }
        : null,
      officialClaimsCrossReference: officialClaims,
      evidenceExplanation: explanationResult.explanation,
      explainerSource: explanationResult.generatedBy,
      isAiExplained: explanationResult.isAiExplained,
      emergencyGuidance: {
        goldenHourNotice: 'If money was debited or credentials were leaked within the last 2 hours, notify your bank immediately and dial 1930.',
        helpline: '1930',
        reportingPortalUrl: 'https://cybercrime.gov.in',
      },
      disclaimer: 'FinLearn automated security checks are evidentiary evaluations and cannot guarantee complete safety. Never share UPI PINs, passwords, or OTPs.',
    };

    return successResponse(res, verificationResult, 'Safety verification completed');
  } catch (err) {
    return next(err);
  }
}

/**
 * Public/Learner: Get verified loan products registry with optional category filter
 * GET /api/v1/guidance/loans/products?category=Education+Loan
 */
export async function getLoanProducts(req, res, next) {
  try {
    const { category } = req.query;
    let products = [...VERIFIED_LOAN_PRODUCTS];

    if (category && typeof category === 'string' && category.trim()) {
      const catLower = category.trim().toLowerCase();
      products = products.filter((p) => p.category.toLowerCase().includes(catLower));
    }

    return successResponse(
      res,
      {
        products,
        total: products.length,
        disclaimer:
          'Rates and terms reflect verified official bank disclosures and regulatory portals (RBI & Vidya Lakshmi). Individual terms vary based on underwriting and credit history.',
      },
      'Loan products retrieved successfully'
    );
  } catch (err) {
    return next(err);
  }
}

/**
 * Public/Learner: Compare two or more loan offers side by side under equivalent principal & tenure
 * POST /api/v1/guidance/loans/compare
 */
export async function compareLoans(req, res, next) {
  try {
    const { offers = [], baselinePrincipal = 500000, baselineTenureMonths = 60 } = req.body;

    if (!Array.isArray(offers) || offers.length < 2) {
      return errorResponse(res, 'Please provide at least two loan offers to compare.', 'VALIDATION_ERROR', 400);
    }
    if (offers.length > 5) {
      return errorResponse(res, 'Maximum of 5 offers can be compared simultaneously.', 'VALIDATION_ERROR', 400);
    }

    const principal = Number(baselinePrincipal) || 500000;
    const tenureMonths = Number(baselineTenureMonths) || 60;

    const comparedOffers = offers.map((offer, idx) => {
      const lenderName = String(offer.lenderName || `Offer ${String.fromCharCode(65 + idx)}`).trim();
      const ratePct = Number(offer.annualRatePct ?? offer.minRatePct ?? 12);
      const feePct = Number(offer.processingFeePct ?? 0);
      const isUserProvided = Boolean(offer.isUserProvided ?? false);

      // Run standardized reducing-balance calculation on the offer
      const calculation = calculateLoanEmi({
        principal,
        annualRatePct: ratePct,
        tenureMonths,
        processingFeePct: feePct,
      });

      return {
        id: offer.id || `custom-offer-${idx + 1}`,
        lenderName,
        productName: offer.productName || 'Custom Offer',
        category: offer.category || 'Personal Loan',
        isUserProvided,
        verificationStatus: isUserProvided ? 'user_provided_unverified' : 'verified_official',
        officialSourceUrl: offer.officialSourceUrl || null,
        lastVerifiedDate: offer.lastVerifiedDate || null,
        rateType: offer.rateType || 'Floating',
        interestRateRange: offer.interestRateRange || `${ratePct}% p.a.`,
        annualRatePct: ratePct,
        processingFee: offer.processingFee || `${feePct}%`,
        processingFeePct: feePct,
        prepaymentTerms: offer.prepaymentTerms || 'Verify in Key Fact Statement (KFS)',
        collateralRequirements: offer.collateralRequirements || 'Unspecified',
        moratoriumPeriod: offer.moratoriumPeriod || 'Nil',
        calculation: {
          monthlyEmi: calculation.monthlyEmi,
          monthlyEmiPaise: calculation.monthlyEmiPaise,
          totalRepayment: calculation.totalRepayment,
          totalInterest: calculation.totalInterest,
          totalUpfrontCost: calculation.totalUpfrontCost,
          totalCostOfBorrowing: calculation.totalCostOfBorrowing,
          netDisbursedAmount: calculation.netDisbursedAmount,
        },
      };
    });

    // Sort by total cost of borrowing to highlight transparent financial impact
    const lowestTotalCostOffer = [...comparedOffers].sort(
      (a, b) => a.calculation.totalCostOfBorrowing - b.calculation.totalCostOfBorrowing
    )[0];

    return successResponse(
      res,
      {
        baselinePrincipal: principal,
        baselineTenureMonths: tenureMonths,
        offers: comparedOffers,
        lowestTotalCostOfferId: lowestTotalCostOffer.id,
        comparisonInsights: [
          'Calculations use the identical principal and tenure baseline for direct mathematical comparability.',
          'A lower advertised interest rate does not always mean lowest cost if offset by high processing fees or compulsory charges.',
          'Floating rate loans have zero prepayment charges under RBI guidelines; fixed-rate loans may carry foreclosure fees.',
        ],
      },
      'Loan offers compared successfully'
    );
  } catch (err) {
    return errorResponse(res, err.message, 'VALIDATION_ERROR', 400);
  }
}

/**
 * Public/Learner: Calculate personal loan affordability and DTI ratio
 * POST /api/v1/guidance/loans/affordability
 */
export async function calculateAffordability(req, res, next) {
  try {
    const {
      monthlyIncome,
      existingEmis = 0,
      proposedLoanAmount,
      annualRatePct,
      tenureMonths,
    } = req.body;

    const result = calculateLoanAffordability({
      monthlyIncome,
      existingEmis,
      proposedLoanAmount,
      annualRatePct,
      tenureMonths,
    });

    return successResponse(res, result, 'Personal loan affordability evaluated');
  } catch (err) {
    return errorResponse(res, err.message, 'VALIDATION_ERROR', 400);
  }
}

/**
 * Public/Learner: Calculate education loan funding gap and estimated post-moratorium repayment
 * POST /api/v1/guidance/loans/education-gap
 */
export async function calculateEducationGap(req, res, next) {
  try {
    const {
      tuitionFees,
      livingExpenses,
      booksAndEquipment,
      travelAndVisa,
      existingSavings,
      scholarshipAmount,
      annualRatePct,
      courseDurationMonths,
      repaymentTenureMonths,
    } = req.body;

    const result = calculateEducationLoanGap({
      tuitionFees,
      livingExpenses,
      booksAndEquipment,
      travelAndVisa,
      existingSavings,
      scholarshipAmount,
      annualRatePct,
      courseDurationMonths,
      repaymentTenureMonths,
    });

    return successResponse(res, result, 'Education loan funding gap evaluated');
  } catch (err) {
    return errorResponse(res, err.message, 'VALIDATION_ERROR', 400);
  }
}

/**
 * Public/Learner: Retrieve loan learning topics and curriculum
 * GET /api/v1/guidance/loans/learning
 */
export async function getLoanLearningTopics(req, res, next) {
  try {
    return successResponse(
      res,
      {
        topics: LOAN_LEARNING_TOPICS,
        total: LOAN_LEARNING_TOPICS.length,
      },
      'Loan learning curriculum retrieved successfully'
    );
  } catch (err) {
    return next(err);
  }
}

/**
 * Public/Learner: AI Loan Assistant Query
 * POST /api/v1/guidance/loans/assistant
 */
export async function queryLoanAssistant(req, res, next) {
  try {
    const { query, category = null, loanContext = null } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return errorResponse(res, 'Please provide a loan question or query.', 'VALIDATION_ERROR', 400);
    }

    const result = await askLoanAssistantWithGemini({
      query: query.trim(),
      category: category ? String(category).trim() : null,
      loanContext,
    });

    logAuditEvent({
      actor: req.user,
      action: 'LOAN_ASSISTANT_QUERIED',
      targetType: 'System',
      targetId: null,
      details: {
        category,
        isAiGenerated: result.isAiGenerated,
        generatedBy: result.generatedBy,
      },
      ipAddress: req.ip || '127.0.0.1',
    });

    return successResponse(res, result, 'Loan assistant answered successfully');
  } catch (err) {
    return errorResponse(res, err.message, 'VALIDATION_ERROR', 400);
  }
}

export default {
  calculateLoan,
  calculateInvestment,
  getVerifiedSources,
  adminCreateSource,
  verifyScamOrWebsite,
  getLoanProducts,
  compareLoans,
  calculateAffordability,
  calculateEducationGap,
  getLoanLearningTopics,
  queryLoanAssistant,
};

