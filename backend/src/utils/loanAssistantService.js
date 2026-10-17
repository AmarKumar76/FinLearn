import config from '../config/env.js';
import { VERIFIED_LOAN_PRODUCTS } from '../config/loanRegistry.js';

export const LOAN_ASSISTANT_SYSTEM_PROMPT = `
You are the FinLearn Smart Borrowing & Loan Assistant, an educational AI for Indian consumers.
Your mission is to explain loan mechanics, reducing-balance vs flat-rate interest, APR, amortization, education loan moratoriums, prepayment rules, and trade-offs between verified bank loan products.

MANDATORY REGULATORY AND ETHICAL BORROWING RULES:
1. STRICT SOURCE GROUNDING: Base all lender-specific data ONLY on the verified loan registry provided below. Never invent interest rates, processing fees, or bank schemes.
2. NO GUARANTEED SANCTION: Never promise loan approval, scheme subsidies, or credit score improvements. Always state that final underwriting is at the discretion of the lending bank.
3. FLAT VS REDUCING CLARITY: Whenever explaining interest, clearly explain why flat rates are misleading and how reducing-balance amortization protects the borrower.
4. TRADE-OFF TRANSPARENCY: When comparing offers, explain that a slightly lower advertised rate may be offset by high upfront fees, strict prepayment penalties, or shorter tenures.
5. NO FINANCIAL/LEGAL ADVICE: Provide educational analysis, not individual professional advisory.
6. NO CREDENTIALS: Never request or accept Aadhaar numbers, PAN cards, OTPs, or NetBanking passwords.
7. CLEAR STRUCTURED OUTPUT: Return an objective, well-formatted response with clear bullet points and transparent source links.
`.trim();

/**
 * Validates and sanitizes the user query to prevent prompt injection or credential submission.
 */
export function sanitizeLoanQuery(query) {
  if (!query || typeof query !== 'string') {
    throw new Error('Query must be a non-empty string.');
  }
  const trimmed = query.trim();
  if (trimmed.length > 800) {
    throw new Error('Query cannot exceed 800 characters.');
  }

  // Redact potential 16-digit card numbers or 12-digit Aadhaar
  const sanitized = trimmed
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[REDACTED_CARD]')
    .replace(/\b\d{4}\s\d{4}\s\d{4}\b/g, '[REDACTED_AADHAAR]');

  return sanitized;
}

/**
 * Ask Loan Assistant using Gemini 1.5 Flash with grounded deterministic fallback.
 */
export async function askLoanAssistantWithGemini({ query, category = null, loanContext = null }) {
  const cleanQuery = sanitizeLoanQuery(query);
  const startTime = Date.now();

  // Retrieve relevant verified loan products for context
  const relevantProducts = VERIFIED_LOAN_PRODUCTS.filter((p) => {
    if (!category) return true;
    return p.category.toLowerCase().includes(category.toLowerCase());
  });

  const verifiedContext = relevantProducts
    .map(
      (p) =>
        `[Lender: ${p.lenderName} | Category: ${p.category} | Product: ${p.productName}]
Rate Range: ${p.interestRateRange} (${p.rateType})
Tenure: Up to ${Math.round(p.maxTenureMonths / 12)} years (${p.maxTenureMonths} months)
Processing Fee: ${p.processingFee}
Moratorium / Security: ${p.moratoriumPeriod || 'Nil'} | Collateral: ${p.collateralRequirements}
Prepayment Terms: ${p.prepaymentTerms}
Verified Source: ${p.officialSourceUrl} (Last Verified: ${p.lastVerifiedDate})`
    )
    .join('\n\n');

  // If Gemini API Key is configured, execute API call with timeout
  if (config.geminiApiKey) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

    try {
      const prompt = `
${LOAN_ASSISTANT_SYSTEM_PROMPT}

Verified Indian Loan Products & Official Guidelines:
${verifiedContext}

User Loan Scenario / Parameters (if provided):
${loanContext ? JSON.stringify(loanContext, null, 2) : 'No specific loan numbers provided.'}

User Question:
"${cleanQuery}"

Instructions:
Answer the user's question clearly and objectively. Ground any bank-specific claims in the verified data above.
Include safe next steps, explain relevant trade-offs (e.g. fees vs rates), and link to official sources (rbi.org.in or vidyalakshmi.co.in).
`.trim();

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 900,
            },
          }),
        }
      );

      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (candidate && candidate.trim().length > 40) {
          return {
            answer: candidate.trim(),
            generatedBy: 'gemini-1.5-flash',
            isAiGenerated: true,
            sources: relevantProducts.slice(0, 3).map((p) => ({
              lenderName: p.lenderName,
              productName: p.productName,
              officialSourceUrl: p.officialSourceUrl,
              lastVerifiedDate: p.lastVerifiedDate,
            })),
            latencyMs,
          };
        }
      } else {
        console.warn(`[Loan Assistant] Gemini call returned HTTP ${response.status} (${latencyMs}ms)`);
      }
    } catch (err) {
      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;
      console.warn(`[Loan Assistant] Gemini call failed (${latencyMs}ms): ${err.message}. Using deterministic grounded response.`);
    }
  }

  // Deterministic Grounded Synthesis Fallback
  return synthesizeDeterministicLoanResponse(cleanQuery, relevantProducts, loanContext);
}

/**
 * Deterministic explanation generator that builds an objective report from verified loan registry.
 * Guaranteed to operate offline, during rate-limits, or when Gemini API key is absent.
 */
export function synthesizeDeterministicLoanResponse(query, products, loanContext) {
  const lower = query.toLowerCase();
  const parts = [];

  // Match topic
  if (lower.includes('reducing') || lower.includes('flat') || lower.includes('formula')) {
    parts.push('### Reducing-Balance vs Flat-Rate Interest');
    parts.push('• **Reducing-Balance:** Interest is charged strictly on the remaining principal balance. As you pay monthly EMIs, your interest charge declines.');
    parts.push('• **Flat-Rate Trap:** Interest is calculated on the entire original loan amount for the entire tenure, which effectively doubles the real Annual Percentage Rate (APR). Always insist on the reducing-balance rate disclosed in the Key Fact Statement (KFS).');
  } else if (lower.includes('education') || lower.includes('moratorium') || lower.includes('student') || lower.includes('csis')) {
    parts.push('### Education Loan Guidelines & Moratorium Period');
    parts.push('• **Moratorium (Repayment Holiday):** Education loans typically grant course duration + 1 year (or 6 months post-employment) before full EMIs begin.');
    parts.push('• **Simple Interest Accrual:** Simple interest accrues during the moratorium unless covered by the Central Sector Interest Subsidy (CSIS) for families earning under ₹4.5L/year.');
    parts.push('• **Collateral Norms:** Under RBI Model Loan Scheme, loans up to ₹7.5 Lakh require zero collateral (parental co-obligation required). Above ₹7.5 Lakh, tangible security is required.');
    parts.push('• **Official Portal:** Apply through the Government of India [Vidya Lakshmi Portal](https://www.vidyalakshmi.co.in/) to compare verified public sector schemes.');
  } else if (lower.includes('personal') || lower.includes('dti') || lower.includes('salary') || lower.includes('afford')) {
    parts.push('### Personal Loan Affordability & Underwriting');
    parts.push('• **Unsecured Nature:** Personal loans require no collateral, but carry higher interest rates (10.5% - 21% p.a.) and strict credit score requirements (700+ recommended).');
    parts.push('• **Debt-to-Income (DTI) Benchmark:** Indian banks generally cap total monthly EMIs at 40% to 50% of your take-home net salary.');
    parts.push('• **Foreclosure Charges:** Under RBI rules, floating rate retail loans have 0% foreclosure penalty. Fixed-rate personal loans may levy 2% to 4% + GST if closed early.');
  } else if (lower.includes('fee') || lower.includes('gst') || lower.includes('hidden')) {
    parts.push('### Upfront Fees and Additional Charges');
    parts.push('• **Processing Fees:** Banks charge 0.5% to 2.5% of the loan amount.');
    parts.push('• **Mandatory 18% GST:** Under Indian tax law, all bank processing charges, legal vetting fees, and valuation costs attract 18% GST.');
    parts.push('• **Deduction from Disbursal:** Legitimate lenders deduct fees from the disbursed loan amount. Anyone asking for an upfront fee via personal UPI is a scam.');
  } else {
    parts.push('### Smart Borrowing Principles & Verified Insights');
    parts.push('• **Compare Total Outflow:** Do not choose a loan based only on the advertised rate. Account for processing fees, GST, and tenure length.');
    parts.push('• **Verify Lending Entity:** Ensure the lending platform is a licensed commercial bank or RBI-registered NBFC listed on [rbi.org.in](https://www.rbi.org.in/).');
    parts.push('• **Prepayment Strategy:** Prepaying extra principal during the first third of your tenure eliminates the largest portion of lifetime interest.');
  }

  // Attach verified product benchmarks
  if (products && products.length > 0) {
    parts.push('\n### Verified Benchmark Rates from Official Registry');
    products.slice(0, 2).forEach((p) => {
      parts.push(`• **${p.lenderName} (${p.productName}):** ${p.interestRateRange} (${p.rateType}). Fee: ${p.processingFee}. [Official Disclosures](${p.officialSourceUrl})`);
    });
  }

  parts.push('\n*Note: This information is for general educational guidance and does not constitute a loan sanction or individual financial advice.*');

  return {
    answer: parts.join('\n'),
    generatedBy: 'deterministic_loan_engine',
    isAiGenerated: false,
    sources: (products || []).slice(0, 2).map((p) => ({
      lenderName: p.lenderName,
      productName: p.productName,
      officialSourceUrl: p.officialSourceUrl,
      lastVerifiedDate: p.lastVerifiedDate,
    })),
  };
}

export default {
  askLoanAssistantWithGemini,
  sanitizeLoanQuery,
};
