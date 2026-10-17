import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import config from '../src/config/env.js';
import { createApp } from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Source } from '../src/models/source.model.js';
import { generateToken } from '../src/utils/token.js';
import { calculateLoanEmi, calculateInvestmentProjection } from '../src/utils/financialCalculators.js';

test('FinLearn Phase 7 Safety, Borrowing & Investments Suite', async (suite) => {
  let app;
  let server;
  let baseUrl;

  let adminUser;
  let learnerUser;
  let adminToken;
  let learnerToken;

  suite.before(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(config.mongodbUri, { serverSelectionTimeoutMS: 5000 });
    }

    // Clean up test records
    await Promise.all([
      User.deleteMany({ email: { $regex: /@guidancetest\.local$/i } }),
      Source.deleteMany({}),
    ]);

    // Admin
    adminUser = new User({
      name: 'Governance Admin',
      email: 'admin@guidancetest.local',
      passwordHash: 'ValidPassword123!',
      role: 'admin',
    });
    await adminUser.save();
    adminToken = generateToken(adminUser);

    // Learner
    learnerUser = new User({
      name: 'Rohan Verma',
      email: 'rohan@guidancetest.local',
      passwordHash: 'ValidPassword123!',
      role: 'user',
    });
    await learnerUser.save();
    learnerToken = generateToken(learnerUser);

    app = createApp();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  suite.after(async () => {
    await Promise.all([
      User.deleteMany({ email: { $regex: /@guidancetest\.local$/i } }),
      Source.deleteMany({}),
    ]);
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  // 1. EMI Benchmark Validation (SRS 4.12: ₹5,00,000 at 12% over 60 months)
  await suite.test('LOAN-001: EMI benchmark matches SRS ₹11,122 and includes 18% GST on processing fees', async () => {
    const calc = calculateLoanEmi({
      principal: 500000,
      annualRatePct: 12,
      tenureMonths: 60,
      processingFeePct: 1.5,
      upfrontFixedCharges: 500,
    });

    assert.equal(calc.monthlyEmi, 11122, 'EMI must be ₹11,122 for standard SRS benchmark');
    assert.equal(calc.totalRepayment, 11122 * 60);
    assert.equal(calc.totalInterest, 11122 * 60 - 500000);
    // 1.5% of 500000 = 7500. 18% GST of 7500 = 1350. Fixed = 500. Total upfront = 9350
    assert.equal(calc.processingFee, 7500);
    assert.equal(calc.gstOnFee, 1350);
    assert.equal(calc.totalUpfrontCost, 9350);
    assert.equal(calc.netDisbursedAmount, 500000 - 9350);
  });

  // 2. Zero-Interest Loan Behavior (Zero division prevention)
  await suite.test('LOAN-002: Zero-interest loan calculation handles rate 0% cleanly (P / n)', async () => {
    const calc = calculateLoanEmi({
      principal: 60000,
      annualRatePct: 0,
      tenureMonths: 12,
      processingFeePct: 0,
    });

    assert.equal(calc.monthlyEmi, 5000);
    assert.equal(calc.totalInterest, 0);
    assert.equal(calc.totalRepayment, 60000);
  });

  // 3. Calculator Input Validation Errors
  await suite.test('LOAN-003: Rejection of negative principal, negative rates, or invalid tenure', async () => {
    assert.throws(() => calculateLoanEmi({ principal: -100, annualRatePct: 10, tenureMonths: 12 }));
    assert.throws(() => calculateLoanEmi({ principal: 10000, annualRatePct: -5, tenureMonths: 12 }));
    assert.throws(() => calculateLoanEmi({ principal: 10000, annualRatePct: 10, tenureMonths: 0 }));
    assert.throws(() => calculateLoanEmi({ principal: 10000, annualRatePct: 10, tenureMonths: 12.5 }));
  });

  // 4. Investment SIP & Inflation Discounting
  await suite.test('INV-001: Investment compounding calculates nominal wealth and inflation-adjusted real value', async () => {
    // ₹10,000/mo at 12% for 10 years (120 months) with 6% inflation
    const proj = calculateInvestmentProjection({
      monthlyInvestment: 10000,
      expectedAnnualReturnPct: 12,
      timeHorizonYears: 10,
      inflationRatePct: 6,
    });

    assert.equal(proj.totalInvested, 1200000);
    // Standard future value of ₹10,000/mo at 12% for 10 yrs is ~₹23,23,391
    assert.ok(proj.futureValueNominal > 2300000 && proj.futureValueNominal < 2350000);
    assert.ok(proj.estimatedWealthGain > 1100000);
    // Real value adjusted for 6% inflation over 10 years must be strictly less than nominal
    assert.ok(proj.futureValueReal < proj.futureValueNominal);
    assert.ok(proj.futureValueReal > proj.totalInvested);
  });

  // 5. Guidance API Endpoints (/api/v1/guidance/calculate-loan)
  await suite.test('API-LOAN-001: POST /api/v1/guidance/calculate-loan returns structured response with assumptions', async () => {
    const res = await fetch(`${baseUrl}/api/v1/guidance/calculate-loan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerToken}`,
      },
      body: JSON.stringify({
        principal: 300000,
        annualRatePct: 10.5,
        tenureMonths: 36,
        processingFeePct: 1,
      }),
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.status, 'success');
    assert.ok(json.data.monthlyEmi > 0);
    assert.ok(Array.isArray(json.data.assumptions));
  });

  // 6. Verified Sources Registry (/api/v1/guidance/sources)
  await suite.test('SOURCE-001: GET /api/v1/guidance/sources seeds and returns verified official government portals', async () => {
    const res = await fetch(`${baseUrl}/api/v1/guidance/sources`, {
      headers: { Authorization: `Bearer ${learnerToken}` },
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(json.data.sources.length >= 4);

    // Verify key portals are present
    const urls = json.data.sources.map((s) => s.url);
    assert.ok(urls.includes('https://www.cybercrime.gov.in'));
    assert.ok(urls.includes('https://sachet.rbi.org.in'));
    assert.ok(urls.includes('https://investor.sebi.gov.in'));
    assert.ok(urls.includes('https://www.dicgc.org.in'));

    // Check reviewStatus
    json.data.sources.forEach((s) => {
      assert.equal(s.reviewStatus, 'verified');
      assert.ok(s.lastReviewedDate);
    });
  });

  // 7. Admin Source Governance (RBAC Enforcement)
  await suite.test('SOURCE-ADM-01: Admin can register new reference source; ordinary user is denied (RBAC 403)', async () => {
    // Ordinary user attempt -> 403
    const userRes = await fetch(`${baseUrl}/api/v1/guidance/admin/sources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerToken}`,
      },
      body: JSON.stringify({
        title: 'Unauthorized Portal',
        organization: 'Fake Org',
        url: 'https://fake.portal',
        category: 'Cyber Safety & Scam Protection',
        lastReviewedDate: '2026-10-13',
      }),
    });
    assert.equal(userRes.status, 403);

    // Admin attempt -> 201
    const adminRes = await fetch(`${baseUrl}/api/v1/guidance/admin/sources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'RBI Monetary Policy Framework Reference',
        organization: 'Reserve Bank of India',
        url: 'https://rbi.org.in/scripts/FS_Overview.aspx',
        category: 'Banking & Payment Systems',
        description: 'Official framework on repo rate and monetary guidelines.',
        lastReviewedDate: '2026-10-13',
        reviewStatus: 'verified',
      }),
    });
    assert.equal(adminRes.status, 201);
  });

  // 8. Scam Verification: Suspicious Message Detection (KYC Block Threat + UPI PIN Trap)
  await suite.test('SCAM-01: Suspicious message with KYC block threats and PIN demand returns SUSPICIOUS_EVIDENCE_FOUND', async () => {
    const res = await fetch(`${baseUrl}/api/v1/guidance/verify-scam`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerToken}`,
      },
      body: JSON.stringify({
        messageText: 'URGENT: Your SBI account will be blocked within 2 hours due to KYC expired. Click here to verify or enter your UPI PIN to claim ₹5,000 refund.',
        claimedOrg: 'State Bank of India',
        concernType: 'KYC',
      }),
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.status, 'success');
    assert.equal(json.data.outcomeCategory, 'SUSPICIOUS_EVIDENCE_FOUND');
    assert.ok(json.data.messageAnalysis.indicatorsFound.length >= 2);
    assert.ok(json.data.evidenceExplanation.length > 50);
  });

  // 9. Scam Verification: Verified Official Bank Domain vs Lookalike Phishing Domain
  await suite.test('SCAM-02: Authentic official bank domain is verified, whereas lookalike is flagged suspicious', async () => {
    // A: Authentic HDFC domain
    const authRes = await fetch(`${baseUrl}/api/v1/guidance/verify-scam`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerToken}`,
      },
      body: JSON.stringify({
        url: 'https://www.hdfcbank.com/personal/ways-to-bank/online-banking',
        claimedOrg: 'HDFC Bank',
        concernType: 'General',
      }),
    });

    assert.equal(authRes.status, 200);
    const authJson = await authRes.json();
    assert.equal(authJson.data.outcomeCategory, 'VERIFIED_OFFICIAL_ENTITY');
    assert.equal(authJson.data.domainVerification.isVerifiedOfficial, true);
    assert.equal(authJson.data.domainVerification.matchedEntity, 'HDFC Bank');

    // B: Lookalike phishing domain "hdfc-kyc-update.com"
    const phishRes = await fetch(`${baseUrl}/api/v1/guidance/verify-scam`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerToken}`,
      },
      body: JSON.stringify({
        url: 'http://hdfc-kyc-update.com/login',
        claimedOrg: 'HDFC Bank',
        concernType: 'KYC',
      }),
    });

    assert.equal(phishRes.status, 200);
    const phishJson = await phishRes.json();
    assert.equal(phishJson.data.outcomeCategory, 'SUSPICIOUS_EVIDENCE_FOUND');
    assert.equal(phishJson.data.domainVerification.isVerifiedOfficial, false);
    assert.equal(phishJson.data.domainVerification.mimickedEntity, 'HDFC Bank');
  });

  // 10. Scam Verification: Legitimate Bank Name in Suspicious Context
  await suite.test('SCAM-03: Legitimate bank name in message does not grant immunity if red flags are present', async () => {
    const res = await fetch(`${baseUrl}/api/v1/guidance/verify-scam`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerToken}`,
      },
      body: JSON.stringify({
        messageText: 'Reserve Bank of India officer approved your prize. Pay ₹2,500 advance processing fee immediately via UPI to release funds.',
        claimedOrg: 'Reserve Bank of India',
        concernType: 'General',
      }),
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.outcomeCategory, 'SUSPICIOUS_EVIDENCE_FOUND');
    assert.ok(json.data.officialClaimsCrossReference.length > 0);
    assert.equal(json.data.officialClaimsCrossReference[0].isRegulatedEntity, true);
  });

  // 11. Scam Verification: Unknown URL with insufficient evidence
  await suite.test('SCAM-04: Unknown third-party domain with no indicators returns UNABLE_TO_VERIFY honestly', async () => {
    const res = await fetch(`${baseUrl}/api/v1/guidance/verify-scam`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerToken}`,
      },
      body: JSON.stringify({
        url: 'https://example-unregistered-finance-blog.org',
        messageText: 'Monthly personal newsletter discussing general inflation and interest rates.',
        concernType: 'General',
      }),
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.outcomeCategory, 'UNABLE_TO_VERIFY');
    assert.equal(json.data.domainVerification.isVerifiedOfficial, false);
  });

  // 12. Security & Anti-SSRF: Private IP, Loopback and Unsafe Protocols
  await suite.test('SCAM-05: Rejection of private loopback IPs and unsafe protocols (SSRF Defense)', async () => {
    // Loopback IP
    const loopbackRes = await fetch(`${baseUrl}/api/v1/guidance/verify-scam`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerToken}`,
      },
      body: JSON.stringify({
        url: 'http://127.0.0.1:8080/admin',
      }),
    });
    assert.equal(loopbackRes.status, 400);

    // Private Class C IP
    const privateRes = await fetch(`${baseUrl}/api/v1/guidance/verify-scam`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerToken}`,
      },
      body: JSON.stringify({
        url: 'http://192.168.1.1/setup',
      }),
    });
    assert.equal(privateRes.status, 400);

    // Unsafe protocol (javascript:, ftp:, file:)
    const protoRes = await fetch(`${baseUrl}/api/v1/guidance/verify-scam`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerToken}`,
      },
      body: JSON.stringify({
        url: 'ftp://ftp.example.com/file',
      }),
    });
    assert.equal(protoRes.status, 400);
  });

  // 13. Input Validation: Empty payload and oversized text rejection
  await suite.test('SCAM-06: Empty payload and oversized text rejected with 400', async () => {
    // Empty
    const emptyRes = await fetch(`${baseUrl}/api/v1/guidance/verify-scam`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerToken}`,
      },
      body: JSON.stringify({}),
    });
    assert.equal(emptyRes.status, 400);

    // Oversized text
    const largeRes = await fetch(`${baseUrl}/api/v1/guidance/verify-scam`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerToken}`,
      },
      body: JSON.stringify({
        messageText: 'a'.repeat(3000),
      }),
    });
    assert.equal(largeRes.status, 400);
  });

  // 14. Real-world UPI & Refund Scam Analysis (The 4 Required Verification Scenarios)
  await suite.test('SCAM-07: UPI account block threat evaluates to Critical / Suspicious', async () => {
    const res = await fetch(`${baseUrl}/api/v1/guidance/verify-scam`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerToken}`,
      },
      body: JSON.stringify({
        messageText: 'Your UPI account will be blocked today. Enter your UPI PIN immediately to keep it active.',
        concernType: 'UPI Fraud',
      }),
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.outcomeCategory, 'SUSPICIOUS_EVIDENCE_FOUND');
    assert.equal(json.data.messageAnalysis.severity, 'Critical');
    const categories = json.data.messageAnalysis.indicatorsFound.map((i) => i.category);
    assert.ok(categories.includes('UPI_PIN_RECEIVE_FRAUD') || categories.includes('KYC_EXPIRY_THREAT'));
    assert.equal(json.data.emergencyGuidance.helpline, '1930');
  });

  await suite.test('SCAM-08: UPI refund approval scam evaluates to Critical / Suspicious', async () => {
    const res = await fetch(`${baseUrl}/api/v1/guidance/verify-scam`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerToken}`,
      },
      body: JSON.stringify({
        messageText: 'Your ₹3,499 refund is ready. Enter your UPI PIN and approve the payment request to receive it.',
        concernType: 'UPI Fraud',
      }),
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.outcomeCategory, 'SUSPICIOUS_EVIDENCE_FOUND');
    assert.equal(json.data.messageAnalysis.severity, 'Critical');
    const categories = json.data.messageAnalysis.indicatorsFound.map((i) => i.category);
    assert.ok(categories.includes('UPI_PIN_RECEIVE_FRAUD') || categories.includes('UPI_COLLECT_CASHBACK_SCAM'));
  });

  await suite.test('SCAM-09: UPI cashback collect request trap evaluates to Critical / Suspicious', async () => {
    const res = await fetch(`${baseUrl}/api/v1/guidance/verify-scam`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerToken}`,
      },
      body: JSON.stringify({
        messageText: 'You have won ₹2,000 cashback. Approve the UPI collect request within 5 minutes.',
        concernType: 'UPI Fraud',
      }),
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.outcomeCategory, 'SUSPICIOUS_EVIDENCE_FOUND');
    assert.equal(json.data.messageAnalysis.severity, 'Critical');
    const categories = json.data.messageAnalysis.indicatorsFound.map((i) => i.category);
    assert.ok(categories.includes('UPI_COLLECT_CASHBACK_SCAM'));
  });

  await suite.test('SCAM-10: Benign informational UPI message returns low severity / unable to verify', async () => {
    const res = await fetch(`${baseUrl}/api/v1/guidance/verify-scam`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerToken}`,
      },
      body: JSON.stringify({
        messageText: 'A benign informational UPI message regarding system maintenance schedule.',
        concernType: 'General',
      }),
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.outcomeCategory, 'UNABLE_TO_VERIFY');
    assert.equal(json.data.messageAnalysis.severity, 'Low');
    assert.equal(json.data.messageAnalysis.indicatorsFound.length, 0);
  });

  // 15. Mocked Gemini Integration & Fallback Unit Tests
  await suite.test('GEMINI-MOCK-01: Validates and normalizes structured Gemini JSON payload', async () => {
    const { validateAndNormalizeGeminiResponse } = await import('../src/utils/safetyExplainerService.js');
    const mockGeminiOutput = {
      summaryOfEvidence: 'The message contains an urgent demand for UPI PIN entry disguised as a refund.',
      detectedThreats: [
        {
          category: 'UPI_REFUND_FRAUD',
          label: 'Fake Refund Approval Trap',
          severity: 'Critical',
          supportingPhrase: 'approve the payment request to receive it',
          explanation: 'Payment requests are for sending funds, not receiving refunds.',
        },
      ],
      recommendedSafeActions: [
        'Reject the payment request on your UPI app immediately.',
        'Never enter your UPI PIN to claim refunds.',
      ],
      finalAssessment: 'HIGH_RISK_FRAUD',
    };

    const normalized = validateAndNormalizeGeminiResponse(mockGeminiOutput);
    assert.equal(normalized.finalAssessment, 'HIGH_RISK_FRAUD');
    assert.equal(normalized.detectedThreats.length, 1);
    assert.equal(normalized.detectedThreats[0].severity, 'Critical');
    assert.equal(normalized.recommendedSafeActions.length, 2);
  });

  await suite.test('GEMINI-MOCK-02: Rejects invalid Gemini schema and falls back reliably', async () => {
    const { validateAndNormalizeGeminiResponse } = await import('../src/utils/safetyExplainerService.js');
    assert.throws(() => validateAndNormalizeGeminiResponse(null));
    assert.throws(() => validateAndNormalizeGeminiResponse('not-an-object'));
  });

  // 16. Smart Borrowing & Loan Guide Suite (Phase 7 Expanded Tests)
  await suite.test('LOAN-AMORT-01: Full monthly amortization schedule reduces principal to zero exactly', async () => {
    const res = await fetch(`${baseUrl}/api/v1/guidance/calculate-loan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerToken}`,
      },
      body: JSON.stringify({
        principal: 500000,
        annualRatePct: 12,
        tenureMonths: 60,
        processingFeePct: 1.5,
      }),
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(Array.isArray(json.data.amortizationSchedule));
    assert.equal(json.data.amortizationSchedule.length, 60);

    const firstMonth = json.data.amortizationSchedule[0];
    assert.equal(firstMonth.month, 1);
    assert.equal(firstMonth.beginningBalance, 500000);
    assert.equal(firstMonth.interestPaid, 5000);
    assert.equal(firstMonth.principalPaid, 6122);

    const lastMonth = json.data.amortizationSchedule[59];
    assert.equal(lastMonth.month, 60);
    assert.equal(lastMonth.endingBalance, 0);
  });

  await suite.test('LOAN-PROD-01: GET /api/v1/guidance/loans/products returns verified bank registry data', async () => {
    const res = await fetch(`${baseUrl}/api/v1/guidance/loans/products`, {
      headers: { Authorization: `Bearer ${learnerToken}` },
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.status, 'success');
    assert.ok(json.data.products.length >= 6);

    const educationProducts = json.data.products.filter((p) => p.category === 'Education Loan');
    const personalProducts = json.data.products.filter((p) => p.category === 'Personal Loan');
    assert.ok(educationProducts.length >= 3);
    assert.ok(personalProducts.length >= 3);

    // Verify statutory sources attached
    educationProducts.forEach((p) => {
      assert.ok(p.officialSourceUrl);
      assert.equal(p.verificationStatus, 'verified');
      assert.ok(p.lastVerifiedDate);
    });
  });

  await suite.test('LOAN-COMP-01: POST /api/v1/guidance/loans/compare identifies lowest lifetime cost offer', async () => {
    const res = await fetch(`${baseUrl}/api/v1/guidance/loans/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerToken}`,
      },
      body: JSON.stringify({
        baselinePrincipal: 500000,
        baselineTenureMonths: 60,
        offers: [
          {
            id: 'bank-a',
            lenderName: 'Bank A (Higher rate, zero fee)',
            annualRatePct: 12.0,
            processingFeePct: 0,
          },
          {
            id: 'bank-b',
            lenderName: 'Bank B (Lower rate, but 3% upfront fee)',
            annualRatePct: 11.2,
            processingFeePct: 3.0,
          },
        ],
      }),
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.status, 'success');
    assert.equal(json.data.offers.length, 2);
    assert.ok(json.data.lowestTotalCostOfferId);
  });

  await suite.test('LOAN-AFF-01: POST /api/v1/guidance/loans/affordability classifies DTI accurately', async () => {
    // Case 1: Healthy DTI (Comfortable)
    const res1 = await fetch(`${baseUrl}/api/v1/guidance/loans/affordability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerToken}`,
      },
      body: JSON.stringify({
        monthlyIncome: 100000,
        existingEmis: 10000,
        proposedLoanAmount: 500000,
        annualRatePct: 12,
        tenureMonths: 60,
      }),
    });
    assert.equal(res1.status, 200);
    const json1 = await res1.json();
    assert.equal(json1.data.affordabilityTier, 'COMFORTABLE');
    assert.ok(json1.data.projectedDtiPct <= 40);

    // Case 2: Overburdened DTI
    const res2 = await fetch(`${baseUrl}/api/v1/guidance/loans/affordability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerToken}`,
      },
      body: JSON.stringify({
        monthlyIncome: 40000,
        existingEmis: 15000,
        proposedLoanAmount: 600000,
        annualRatePct: 14,
        tenureMonths: 36,
      }),
    });
    assert.equal(res2.status, 200);
    const json2 = await res2.json();
    assert.equal(json2.data.affordabilityTier, 'CRITICAL_OVERBURDEN');
    assert.ok(json2.data.projectedDtiPct > 60);
  });

  await suite.test('LOAN-EDU-01: POST /api/v1/guidance/loans/education-gap calculates funding gap & moratorium math', async () => {
    const res = await fetch(`${baseUrl}/api/v1/guidance/loans/education-gap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerToken}`,
      },
      body: JSON.stringify({
        tuitionFees: 1200000,
        livingExpenses: 400000,
        booksAndEquipment: 50000,
        travelAndVisa: 100000,
        existingSavings: 350000,
        scholarshipAmount: 150000,
        annualRatePct: 9.5,
        courseDurationMonths: 24,
        repaymentTenureMonths: 120,
      }),
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    // Total cost = 1200000 + 400000 + 50000 + 100000 = 1750000
    // Total own funds = 350000 + 150000 = 500000
    // Funding gap = 1250000
    assert.equal(json.data.fundingGap, 1250000);
    assert.ok(json.data.repaymentEstimate.estimatedMonthlyEmi > 0);
    assert.ok(json.data.moratoriumDetails.estimatedSimpleInterestDuringMoratorium > 0);
  });

  await suite.test('LOAN-LEARN-01: GET /api/v1/guidance/loans/learning provides full curriculum', async () => {
    const res = await fetch(`${baseUrl}/api/v1/guidance/loans/learning`, {
      headers: { Authorization: `Bearer ${learnerToken}` },
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(json.data.topics.length >= 9);
    assert.ok(json.data.topics.some((t) => t.id === 'reducing-vs-flat-rate'));
    assert.ok(json.data.topics.some((t) => t.id === 'moratorium-and-education-loans'));
  });

  await suite.test('LOAN-ASST-01: POST /api/v1/guidance/loans/assistant answers educational questions groundedly', async () => {
    const res = await fetch(`${baseUrl}/api/v1/guidance/loans/assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerToken}`,
      },
      body: JSON.stringify({
        query: 'Why is a flat interest rate considered deceptive in India?',
      }),
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.status, 'success');
    assert.ok(json.data.answer.length > 50);
    assert.ok(json.data.sources.length > 0);
  });
});
