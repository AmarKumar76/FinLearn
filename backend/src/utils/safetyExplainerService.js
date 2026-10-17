import config from '../config/env.js';

export const SAFETY_EXPLANATION_SYSTEM_PROMPT = `
You are the FinLearn Financial Safety Explainer and Scam Analyst for Indian consumers.
Your mission is to perform rigorous contextual message analysis and explain factual security evidence in clear, objective language.

MANDATORY SAFETY AND VERIFICATION RULES:
1. NEVER INVENT FINDINGS: You must base your findings strictly on the submitted user message and the factual security evidence provided. Do not invent threat-intelligence reports, domain-registration dates, or police notices.
2. DO NOT GUARANTEE SAFETY: Even if no red flags are found, you must NEVER state that a message or link is "100% safe" or "guaranteed legitimate". State clearly that no automated scan can guarantee complete safety.
3. CONTEXTUAL MESSAGE THREATS TO IDENTIFY:
   - UPI PIN requests or claims that a PIN or QR scan is needed to receive money, refunds, or cashback.
   - Fraudulent UPI collect/payment requests or fake lottery/cashback approvals.
   - Refund scams asking users to authorize or approve transactions.
   - Fake KYC urgency, imminent account block/suspension threats, and panic-inducing deadlines.
   - Advance-fee loan requests demanding upfront processing or security fees.
   - Credential harvesting (requests for OTP, passwords, CVV, NetBanking login).
   - Coercion to install remote access apps (AnyDesk, TeamViewer, RustDesk, APKs).
4. PRESERVE FACTUAL EVIDENCE: Never contradict or dismiss verified domain facts or red flags identified by the security engine.
5. SENSITIVE CREDENTIAL REMINDER: Never ask for or encourage sharing passwords, OTPs, or UPI PINs.
6. STRUCTURED JSON OUTPUT: You must output ONLY a valid JSON object matching the requested schema. No code fences, no extra text.
`.trim();

/**
 * Validates and normalizes Gemini's structured response against the safety schema.
 */
export function validateAndNormalizeGeminiResponse(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Gemini response is not a valid JSON object.');
  }

  const summaryOfEvidence = typeof parsed.summaryOfEvidence === 'string' && parsed.summaryOfEvidence.trim()
    ? parsed.summaryOfEvidence.trim()
    : 'Evidence analysis completed.';

  const detectedThreats = Array.isArray(parsed.detectedThreats)
    ? parsed.detectedThreats
        .filter((t) => t && typeof t === 'object' && t.category)
        .map((t) => ({
          category: String(t.category).slice(0, 80),
          label: String(t.label || t.category).slice(0, 100),
          severity: ['Critical', 'High', 'Medium', 'Low'].includes(t.severity) ? t.severity : 'High',
          supportingPhrase: typeof t.supportingPhrase === 'string' ? t.supportingPhrase.slice(0, 200) : '',
          explanation: typeof t.explanation === 'string' ? t.explanation.slice(0, 300) : '',
        }))
    : [];

  const recommendedSafeActions = Array.isArray(parsed.recommendedSafeActions) && parsed.recommendedSafeActions.length > 0
    ? parsed.recommendedSafeActions.map((a) => String(a).trim()).filter(Boolean)
    : [
        'Do not click unknown links or approve unsolicited UPI requests.',
        'Never enter your UPI PIN to receive money, refunds, or cashbacks.',
        'If suspicious, verify directly with your bank through official contact numbers on your card.',
      ];

  const validAssessments = ['HIGH_RISK_FRAUD', 'SUSPICIOUS', 'INCONCLUSIVE_UNVERIFIED', 'OFFICIAL_INFORMATION'];
  const finalAssessment = validAssessments.includes(parsed.finalAssessment)
    ? parsed.finalAssessment
    : detectedThreats.length > 0
    ? 'HIGH_RISK_FRAUD'
    : 'INCONCLUSIVE_UNVERIFIED';

  return {
    summaryOfEvidence,
    detectedThreats,
    recommendedSafeActions,
    finalAssessment,
  };
}

/**
 * Explains verification evidence using Gemini 1.5 Flash with fallback to deterministic synthesizer.
 * Sends contextual message text and collected security evidence to Gemini with strict schema enforcement.
 */
export async function explainSafetyEvidenceWithGemini({
  userInput,
  messageAnalysis,
  domainAnalysis,
  dnsCheck,
  officialClaims,
}) {
  const startTime = Date.now();
  const evidenceSummary = `
User Input Claims:
- Claimed Organization: ${userInput.claimedOrg || 'None specified'}
- Concern Type: ${userInput.concernType || 'General'}
- Submitted URL: ${userInput.url || 'None provided'}
- Message Text: "${userInput.messageText ? userInput.messageText.slice(0, 1000) : 'None provided'}"

Collected Factual Evidence:
1. Deterministic Message Engine Findings:
- Severity: ${messageAnalysis.severity}
- Indicators Detected: ${messageAnalysis.indicatorsFound.map((i) => `${i.label} [${i.severity}]`).join(', ') || 'None'}

2. Domain & URL Registry Verification:
- Domain: ${domainAnalysis ? domainAnalysis.hostname || 'None' : 'None'}
- Status: ${domainAnalysis ? domainAnalysis.status : 'Not performed'}
- Is Verified Official Entity: ${domainAnalysis ? domainAnalysis.isVerifiedOfficial : false}
- Is Lookalike Deception: ${domainAnalysis ? domainAnalysis.isLookalikeDeception || false : false}
- Details: ${domainAnalysis ? domainAnalysis.details : 'No URL provided'}

3. DNS & Network Resolution Check:
- Checked: ${dnsCheck ? dnsCheck.checked : false}
- Details: ${dnsCheck ? dnsCheck.details : 'Not performed'}

4. Official Regulatory Sources:
${officialClaims.map((c) => `- ${c.organization || c.title}: ${c.warning || c.title || ''} (Source: ${c.sourceUrl || ''})`).join('\n') || 'None'}
`.trim();

  // If Gemini API Key is configured, execute API call with timeout & schema
  if (config.geminiApiKey) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    try {
      const prompt = `
${SAFETY_EXPLANATION_SYSTEM_PROMPT}

Collected Verification Evidence & User Input:
${evidenceSummary}

Task:
Analyze the submitted message and gathered evidence. Identify any UPI PIN receive scams, collect request traps, refund/cashback frauds, account deactivation threats, or advance-fee scams.
Extract specific supporting phrases from the message text for each detected threat.

Return a JSON object matching EXACTLY this structure (no markdown wrappers):
{
  "summaryOfEvidence": "Concise 2-3 sentence explanation of what was verified and any deception found.",
  "detectedThreats": [
    {
      "category": "UPI_PIN_RECEIVE_FRAUD",
      "label": "UPI PIN Entry for Refund Scam",
      "severity": "Critical",
      "supportingPhrase": "Enter your UPI PIN and approve the payment request to receive it",
      "explanation": "UPI PIN is solely used for deducting money, never for receiving refunds."
    }
  ],
  "recommendedSafeActions": [
    "Do not approve the UPI collect request.",
    "Never enter your UPI PIN to claim refunds or cashbacks."
  ],
  "finalAssessment": "HIGH_RISK_FRAUD"
}
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
              temperature: 0.1,
              maxOutputTokens: 1000,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (candidate) {
          let parsed;
          try {
            const cleaned = candidate.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
            parsed = JSON.parse(cleaned);
          } catch (jsonErr) {
            console.warn('[Gemini Safety Explainer] Failed to parse JSON response. Latency:', latencyMs, 'ms. Error:', jsonErr.message);
          }

          if (parsed) {
            const validated = validateAndNormalizeGeminiResponse(parsed);

            // Build rich markdown explanation from validated Gemini structured output
            const explanationMarkdown = [
              '### Summary of Evidence',
              `• ${validated.summaryOfEvidence}`,
              '',
              '### Red Flags & Forensic Warnings',
              ...(validated.detectedThreats.length > 0
                ? validated.detectedThreats.map(
                    (t) =>
                      `• **${t.label} [${t.severity}]:** ${t.explanation}${
                        t.supportingPhrase ? ` *(Matched phrase: "${t.supportingPhrase}")*` : ''
                      }`
                  )
                : ['• No suspicious social engineering threats identified in the message text.']),
              ...(domainAnalysis?.isLookalikeDeception
                ? [`• **Domain Impersonation:** ${domainAnalysis.details}`]
                : []),
              '',
              '### Recommended Safe Next Steps',
              ...validated.recommendedSafeActions.map((action, idx) => `${idx + 1}. **Action:** ${action}`),
            ].join('\n');

            console.log(`[Gemini Safety Explainer] Successfully evaluated with Gemini 1.5 Flash in ${latencyMs}ms.`);

            return {
              explanation: explanationMarkdown,
              generatedBy: 'gemini-1.5-flash',
              isAiExplained: true,
              aiAnalysis: validated,
              latencyMs,
            };
          }
        }
      } else {
        console.warn(`[Gemini Safety Explainer] HTTP ${response.status} ${response.statusText} (${latencyMs}ms)`);
      }
    } catch (err) {
      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;
      console.warn(`[Gemini Safety Explainer] Call failed or timed out (${latencyMs}ms): ${err.message}. Falling back to deterministic engine.`);
    }
  }

  // Deterministic Grounded Explanation Fallback
  return synthesizeDeterministicSafetyExplanation({
    userInput,
    messageAnalysis,
    domainAnalysis,
    dnsCheck,
    officialClaims,
  });
}

/**
 * Deterministic explanation generator that builds an objective report from collected evidence.
 * Guaranteed to run with 100% reliability offline or when Gemini is rate-limited.
 */
export function synthesizeDeterministicSafetyExplanation({
  userInput,
  messageAnalysis,
  domainAnalysis,
  dnsCheck,
  officialClaims,
}) {
  const parts = [];

  // Section 1: Summary of Evidence
  parts.push('### Summary of Evidence');
  if (domainAnalysis?.isVerifiedOfficial) {
    parts.push(
      `• **Verified Domain:** The domain "${domainAnalysis.officialDomain}" is an authentic official digital property belonging to ${domainAnalysis.matchedEntity}.`
    );
  } else if (domainAnalysis?.isLookalikeDeception) {
    parts.push(
      `• **Impersonation Lookalike:** The address "${domainAnalysis.hostname || userInput.url}" mimics ${domainAnalysis.mimickedEntity}, but is NOT their official registered domain.`
    );
  } else if (domainAnalysis?.isMismatchedDomain) {
    parts.push(
      `• **Domain Mismatch:** The sender claims to represent ${domainAnalysis.claimedEntity}, but directs to an unrelated domain.`
    );
  } else if (userInput.url) {
    parts.push(
      `• **Unverified Domain:** The domain "${domainAnalysis?.hostname || userInput.url}" is not in the official verified Indian banking registry.`
    );
  } else {
    parts.push('• **Text-Only Evaluation:** Analysis was performed on the submitted message text (no URL was provided for domain inspection).');
  }

  // Section 2: Red Flags & Warnings
  parts.push('\n### Red Flags & Forensic Warnings');
  if (messageAnalysis.indicatorsFound.length > 0) {
    messageAnalysis.indicatorsFound.forEach((ind) => {
      parts.push(`• **${ind.label} [${ind.severity}]:** ${ind.description} ${ind.safeGuidance}`);
    });
  } else {
    parts.push('• No common high-frequency scam triggers were identified in the text.');
  }

  if (domainAnalysis?.hasSuspiciousTld) {
    parts.push('• The domain uses a high-risk top-level domain frequently utilized in automated phishing campaigns.');
  }

  if (dnsCheck && dnsCheck.checked && !dnsCheck.resolved) {
    parts.push(`• Domain DNS check: ${dnsCheck.details}`);
  }

  // Section 3: Recommended Safe Actions
  parts.push('\n### Recommended Safe Next Steps');
  if (messageAnalysis.hasCriticalIndicators || domainAnalysis?.isLookalikeDeception) {
    parts.push('1. **Do Not Click or Reply:** Do not enter any passwords, UPI PINs, or bank details on this link.');
    parts.push('2. **Never Type PIN to Receive Money:** Remember that receiving money via UPI never requires entering a PIN.');
    parts.push('3. **Dial 1930 Helpline:** If you have already shared credentials or money was deducted, dial the National Cyber Crime Helpline at 1930 immediately to freeze transactions.');
    parts.push('4. **Lodge Complaint:** File an official incident report on the Indian Cyber Crime Reporting Portal at https://cybercrime.gov.in.');
  } else {
    parts.push('1. **Verify Independently:** Contact your bank directly using the official telephone number printed on the back of your debit card or checkbook.');
    parts.push('2. **Check Official Registry:** Visit official regulatory portals like https://www.rbi.org.in or https://sachet.rbi.org.in to confirm registered entities.');
    parts.push('3. **Important Safety Notice:** Automated verification checks can assist you, but they can never guarantee 100% safety. Always exercise vigilant skepticism with unsolicited financial communications.');
  }

  return {
    explanation: parts.join('\n'),
    generatedBy: 'deterministic_safety_engine',
    isAiExplained: false,
    aiAnalysis: null,
  };
}
