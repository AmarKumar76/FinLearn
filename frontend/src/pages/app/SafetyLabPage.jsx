import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { api } from '../../services/api';
import {
  ShieldAlert,
  AlertTriangle,
  PhoneCall,
  ExternalLink,
  CheckCircle2,
  HelpCircle,
  Lock,
  ChevronRight,
  ShieldCheck,
  Search,
  Check,
  X,
  Sparkles,
  Globe,
  FileText,
  Building,
  RotateCcw,
  Info,
  AlertCircle
} from 'lucide-react';

const SCAM_CATEGORIES = [
  {
    id: 'scam_1',
    title: 'Advance-Fee Loan Scam',
    redFlag: 'Demands upfront "processing fee", "insurance charge", or "GST deposit" via UPI before releasing loan funds.',
    explanation: 'Legitimate banks and regulated NBFCs deduct processing charges from the disbursed loan amount. They never require an upfront transfer to a private UPI handle.',
    safeAction: 'Cease communication immediately. Report lender details to the RBI Sachet portal.',
    severity: 'High',
  },
  {
    id: 'scam_2',
    title: 'UPI PIN / Refund Debit Trap',
    redFlag: 'Caller claims to send you money or a refund and asks you to enter your 4/6-digit UPI PIN.',
    explanation: 'Entering your UPI PIN ALWAYS authorizes a debit from your bank account. Receiving funds on UPI requires zero action or PIN entry on your phone.',
    safeAction: 'Never type your PIN. Disconnect call and block the sender handle.',
    severity: 'Critical',
  },
  {
    id: 'scam_3',
    title: 'Telegram / WhatsApp Guaranteed Return Schemes',
    redFlag: 'Promises guaranteed 20% weekly returns, "crypto arbitrage", or insider stock tips with instant withdrawals.',
    explanation: 'No regulated investment entity can guarantee fixed market returns. These are almost always Ponzi or "pig butchering" scams operated out of unregistered channels.',
    safeAction: 'Do not transfer funds. Verify entity registration on the SEBI investor portal.',
    severity: 'Critical',
  },
  {
    id: 'scam_4',
    title: 'Remote Screen-Sharing Apps (AnyDesk, TeamViewer)',
    redFlag: 'Fake customer service agent insists you install a remote management app to "fix KYC" or "unblock SIM".',
    explanation: 'Remote access software allows attackers to view your screen, capture OTPs in real time, and execute unauthorized transfers.',
    safeAction: 'Never install remote software on instructions from an inbound caller.',
    severity: 'Critical',
  },
];

const INTERACTIVE_SCENARIOS = [
  {
    id: 'sim_1',
    title: 'SMS: Electricity Bill Disconnection Alert',
    message: '"Dear consumer, your electricity power will be disconnected tonight at 9:30 PM due to unpaid bill. Immediately contact electricity officer Verma at 98765-XXXXX or download update app: bit.ly/power-upd"',
    isScam: true,
    redFlags: [
      'Sense of extreme artificial urgency (disconnection in 2 hours)',
      'Direct personal mobile number instead of official discom contact',
      'Shortened URL (bit.ly) asking to download an unofficial APK application'
    ],
    safeResponse: 'Never download unsolicited APK files or dial personal numbers. Verify your bill status directly on your state electricity distribution company portal or official consumer app.'
  },
  {
    id: 'sim_2',
    title: 'Bank SMS: Legitimate One-Time Password',
    message: '"123456 is OTP for txn of INR 1,500.00 at AMAZON PAY. Never share OTP with anyone including bank officials. If not done by you, SMS BLOCK to 567676."',
    isScam: false,
    redFlags: [
      'Standard transactional OTP from verified bank shortcode',
      'Explicit warning never to share OTP with anyone',
      'Official automated block instruction provided'
    ],
    safeResponse: 'Keep OTP secret. Only type it on the official Amazon payment checkout screen. Never speak it out or type it into any chat.'
  },
  {
    id: 'sim_3',
    title: 'WhatsApp Message: Part-Time Video Review Job',
    message: '"Earn ₹3,000 to ₹8,000 daily just by liking YouTube videos and rating Google Maps places! No investment required. Complete 3 trial tasks to receive ₹150 instantly via UPI."',
    isScam: true,
    redFlags: [
      'Unsolicited work offer offering unrealistically high pay for trivial tasks',
      'Initial micro-payout bait to build fake trust',
      'Precursor to "prepaid task" fraud where victim is asked to deposit money for higher returns'
    ],
    safeResponse: 'Report and block the sender on WhatsApp. Do not accept initial bait money or provide personal bank accounts.'
  }
];

export function SafetyLabPage() {
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [activeSimulationIndex, setActiveSimulationIndex] = useState(0);
  const [simulationUserDecision, setSimulationUserDecision] = useState(null); // true = scam, false = legit
  const [sources, setSources] = useState([]);
  const [loadingSources, setLoadingSources] = useState(false);

  // Live Verification Engine State
  const [messageInput, setMessageInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [claimedOrgInput, setClaimedOrgInput] = useState('');
  const [concernTypeInput, setConcernTypeInput] = useState('General');

  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [verificationError, setVerificationError] = useState(null);

  useEffect(() => {
    async function fetchSources() {
      try {
        setLoadingSources(true);
        const res = await api.get('/guidance/sources');
        if (res.data?.data) {
          setSources(res.data.data.sources || res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load guidance sources:', err);
      } finally {
        setLoadingSources(false);
      }
    }
    fetchSources();
  }, []);

  const handleVerifySubmission = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!messageInput.trim() && !urlInput.trim()) {
      setVerificationError('Please enter either a message or website URL to analyze.');
      return;
    }

    try {
      setVerifying(true);
      setVerificationError(null);
      setVerificationResult(null);

      const res = await api.post('/guidance/verify-scam', {
        messageText: messageInput.trim(),
        url: urlInput.trim(),
        claimedOrg: claimedOrgInput.trim(),
        concernType: concernTypeInput,
      });

      if (res && res.data) {
        setVerificationResult(res.data);
      }
    } catch (err) {
      setVerificationError(err.message || 'Verification could not be completed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResetVerification = () => {
    setMessageInput('');
    setUrlInput('');
    setClaimedOrgInput('');
    setConcernTypeInput('General');
    setVerificationResult(null);
    setVerificationError(null);
  };

  const activeSim = INTERACTIVE_SCENARIOS[activeSimulationIndex];

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-aubergine">
              Financial Safety Lab
            </h1>
            <Badge variant="terracotta" size="sm">Evidence-Based Scam Defense</Badge>
          </div>
          <p className="text-xs text-aubergine/70 mt-1">
            Official Indian banking registry • Forensic message inspection • Grounded AI safety explanations
          </p>
        </div>
      </div>

      {/* Emergency Cyber Fraud Help Card */}
      <div className="rounded-2xl bg-aubergine text-ivory p-6 sm:p-8 border border-aubergine-light shadow-md space-y-4">
        <div className="flex items-center gap-2.5">
          <Badge variant="terracotta" size="sm">Immediate Emergency Protocol</Badge>
          <span className="text-xs text-brass-light font-mono">India Financial Cyber Helpline</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-ivory">
          Did You Already Transfer Money or Share Credentials?
        </h2>
        <p className="text-xs sm:text-sm text-lilac-light max-w-3xl leading-relaxed">
          Act within the <strong>Golden Hour</strong>: Immediately notify your bank's fraud desk to freeze the transaction, dial the National Cyber Crime Helpline at <strong>1930</strong>, and lodge an official complaint on the government portal. FinLearn is an educational platform and cannot recover funds or file complaints on your behalf.
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <a
            href="tel:1930"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-terracotta hover:bg-terracotta-hover text-white text-xs font-bold transition-colors shadow-sm"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call 1930 Helpline</span>
          </a>

          <a
            href="https://www.cybercrime.gov.in"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ivory text-aubergine hover:bg-white text-xs font-bold transition-colors border border-brass/30 shadow-sm"
          >
            <span>Lodge Complaint on Cybercrime.gov.in</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* MAIN FEATURE: EVIDENCE-BASED SCAM & WEBSITE VERIFICATION ENGINE */}
      <Card
        id="scam-verification-section"
        title="Evidence-Based Scam & Website Verification Engine"
        subtitle="Evaluate suspicious messages, fake KYC alerts, lottery claims, or URLs against official Indian banking and regulatory registries."
        className="border-brass/40 shadow-sm"
      >
        <div className="space-y-6">
          {/* User Input Form */}
          <form onSubmit={handleVerifySubmission} className="space-y-4">
            {/* Safe Input Notice / Privacy Warning */}
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Privacy & Safety Notice:</strong> Never enter your actual ATM PIN, UPI PIN, netbanking password, full 16-digit debit/credit card number, or OTP. FinLearn will never connect to or execute third-party scripts from submitted URLs.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="verify-concern-type" className="block text-xs font-bold text-aubergine mb-1">
                  Type of Concern / Message:
                </label>
                <select
                  id="verify-concern-type"
                  value={concernTypeInput}
                  onChange={(e) => setConcernTypeInput(e.target.value)}
                  className="w-full text-xs rounded-xl border border-brass/30 bg-ivory px-3 py-2 text-aubergine focus:outline-none focus:ring-2 focus:ring-terracotta"
                >
                  <option value="General">General / Suspicious Message</option>
                  <option value="KYC">KYC Update / Account Block Warning</option>
                  <option value="UPI">UPI Payment / Cashback / PIN Request</option>
                  <option value="Loan">Instant Loan / Advance Processing Fee</option>
                  <option value="Investment">Investment Scheme / Guaranteed High Return</option>
                </select>
              </div>

              <div>
                <label htmlFor="verify-claimed-org" className="block text-xs font-bold text-aubergine mb-1">
                  Claimed Bank or Organization (Optional):
                </label>
                <input
                  id="verify-claimed-org"
                  type="text"
                  placeholder="e.g. State Bank of India, HDFC Bank, RBI, Electricity Board"
                  value={claimedOrgInput}
                  onChange={(e) => setClaimedOrgInput(e.target.value)}
                  maxLength={100}
                  className="w-full text-xs rounded-xl border border-brass/30 bg-ivory px-3 py-2 text-aubergine focus:outline-none focus:ring-2 focus:ring-terracotta placeholder:text-aubergine/40"
                />
              </div>
            </div>

            <div>
              <label htmlFor="verify-url" className="block text-xs font-bold text-aubergine mb-1">
                Website Address or Link (Optional):
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-aubergine/40 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  id="verify-url"
                  type="text"
                  placeholder="e.g. sbi-kyc-verify.com or https://www.hdfcbank.com"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  maxLength={500}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-brass/30 bg-ivory text-aubergine focus:outline-none focus:ring-2 focus:ring-terracotta placeholder:text-aubergine/40 font-mono"
                />
              </div>
              <p className="text-[11px] text-aubergine/60 mt-1">
                Note: FinLearn performs passive domain registry checks and safe server DNS inspection. We never execute scripts or visit untrusted sites.
              </p>
            </div>

            <div>
              <label htmlFor="verify-message-text" className="block text-xs font-bold text-aubergine mb-1">
                Suspicious Message Text:
              </label>
              <textarea
                id="verify-message-text"
                rows={4}
                placeholder="Paste the SMS, WhatsApp message, or email body here (redacting any private phone numbers or personal credentials)..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                maxLength={2500}
                className="w-full text-xs rounded-xl border border-brass/30 bg-ivory p-3 text-aubergine focus:outline-none focus:ring-2 focus:ring-terracotta placeholder:text-aubergine/40 leading-relaxed font-mono"
              />
              <div className="flex justify-between text-[11px] text-aubergine/50 mt-1">
                <span>Provide either message text, a website URL, or both.</span>
                <span>{messageInput.length} / 2500 chars</span>
              </div>
            </div>

            {verificationError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{verificationError}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button
                id="verify-scam-submit-btn"
                type="submit"
                variant="primary"
                size="md"
                loading={verifying}
                disabled={verifying || (!messageInput.trim() && !urlInput.trim())}
                icon={Search}
                className="font-bold shadow-sm"
              >
                {verifying ? 'Verifying Evidence...' : 'Inspect & Verify Evidence'}
              </Button>

              {(messageInput || urlInput || verificationResult) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  icon={RotateCcw}
                  onClick={handleResetVerification}
                  disabled={verifying}
                >
                  Clear Form
                </Button>
              )}
            </div>
          </form>

          {/* VERIFICATION REPORT / OUTCOME SECTION */}
          {verificationResult && (
            <div className="mt-8 pt-8 border-t border-brass/25 space-y-6">
              {/* Category Outcome Banner */}
              <div
                className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
                  verificationResult.outcomeCategory === 'SUSPICIOUS_EVIDENCE_FOUND'
                    ? 'bg-rose-50 border-rose-300 text-rose-950'
                    : verificationResult.outcomeCategory === 'VERIFIED_OFFICIAL_ENTITY'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-amber-50 border-amber-300 text-amber-950'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                      verificationResult.outcomeCategory === 'SUSPICIOUS_EVIDENCE_FOUND'
                        ? 'bg-rose-600 text-white'
                        : verificationResult.outcomeCategory === 'VERIFIED_OFFICIAL_ENTITY'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    {verificationResult.outcomeCategory === 'SUSPICIOUS_EVIDENCE_FOUND' ? (
                      <AlertTriangle className="w-6 h-6" />
                    ) : verificationResult.outcomeCategory === 'VERIFIED_OFFICIAL_ENTITY' ? (
                      <ShieldCheck className="w-6 h-6" />
                    ) : (
                      <Info className="w-6 h-6" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black">
                        {verificationResult.outcomeCategory === 'SUSPICIOUS_EVIDENCE_FOUND' &&
                          'Suspicious — Evidence of Financial Fraud / Impersonation'}
                        {verificationResult.outcomeCategory === 'VERIFIED_OFFICIAL_ENTITY' &&
                          'Verified Authentic Domain Information'}
                        {verificationResult.outcomeCategory === 'UNABLE_TO_VERIFY' &&
                          'Unable to Verify — Insufficient Threat Evidence'}
                      </span>
                    </div>
                    <p className="text-xs opacity-90 mt-1 leading-relaxed">
                      {verificationResult.outcomeCategory === 'SUSPICIOUS_EVIDENCE_FOUND' &&
                        'Concrete red flags or lookalike domains detected. Do not click links, type PINs, or share credentials.'}
                      {verificationResult.outcomeCategory === 'VERIFIED_OFFICIAL_ENTITY' &&
                        'The domain matches an official regulated entity. However, remain vigilant: legitimate institutions never ask for PINs or passwords via SMS.'}
                      {verificationResult.outcomeCategory === 'UNABLE_TO_VERIFY' &&
                        'This domain or sender is not listed in official registries. Inconclusive result does NOT mean safe.'}
                    </p>
                  </div>
                </div>

                <div className="text-right text-[11px] font-mono shrink-0">
                  <span className="opacity-70 block">Evaluated at</span>
                  <span className="font-bold">
                    {new Date(verificationResult.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Forensic Evidence Breakdown Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card 1: Linguistic Indicators */}
                <div className="p-4 rounded-xl bg-ivory-dark border border-brass/25 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-aubergine flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-terracotta" />
                      Message Pattern Analysis
                    </span>
                    <Badge
                      variant={
                        verificationResult.messageAnalysis.severity === 'Critical'
                          ? 'danger'
                          : verificationResult.messageAnalysis.severity === 'High'
                          ? 'danger'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      Severity: {verificationResult.messageAnalysis.severity}
                    </Badge>
                  </div>

                  {verificationResult.messageAnalysis.indicatorsFound.length > 0 ? (
                    <ul className="space-y-2 text-xs">
                      {verificationResult.messageAnalysis.indicatorsFound.map((ind, iIdx) => (
                        <li key={iIdx} className="p-2.5 rounded-lg bg-white border border-brass/20 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-rose-800">{ind.label}</span>
                            <span className="text-[10px] font-mono text-rose-600 font-bold uppercase">[{ind.severity}]</span>
                          </div>
                          <p className="text-aubergine/80 text-[11px] leading-relaxed">{ind.description}</p>
                          <p className="text-[10px] text-emerald-800 font-semibold pt-0.5">{ind.safeGuidance}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-aubergine/70 italic">
                      No high-frequency social engineering triggers or urgency patterns found in message text.
                    </p>
                  )}
                </div>

                {/* Card 2: Domain & Network Registry */}
                <div className="p-4 rounded-xl bg-ivory-dark border border-brass/25 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-aubergine flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-terracotta" />
                      Domain Registry & DNS
                    </span>
                    <Badge
                      variant={
                        verificationResult.domainVerification?.isVerifiedOfficial
                          ? 'success'
                          : verificationResult.domainVerification?.mimickedEntity
                          ? 'danger'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {verificationResult.domainVerification
                        ? verificationResult.domainVerification.isVerifiedOfficial
                          ? 'Official Domain'
                          : verificationResult.domainVerification.mimickedEntity
                          ? 'Impersonation Flag'
                          : 'Third-Party'
                        : 'No URL Supplied'}
                    </Badge>
                  </div>

                  {verificationResult.domainVerification ? (
                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-white border border-brass/20 space-y-1">
                        <span className="text-[10px] font-mono text-aubergine/60 block">Hostname Checked</span>
                        <span className="font-bold font-mono text-aubergine block truncate">
                          {verificationResult.domainVerification.hostname}
                        </span>
                        <p className="text-[11px] text-aubergine/80 leading-relaxed pt-1">
                          {verificationResult.domainVerification.details}
                        </p>
                      </div>

                      {verificationResult.domainVerification.dnsCheckStatus && (
                        <div className="p-2.5 rounded-lg bg-white border border-brass/20 text-[11px] text-aubergine/80">
                          <strong>Safe DNS Check:</strong> {verificationResult.domainVerification.dnsCheckStatus}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-aubergine/70 italic">
                      No website URL was submitted. Live domain registry and DNS inspection was skipped.
                    </p>
                  )}
                </div>
              </div>

              {/* Official Claims Cross-Reference */}
              {verificationResult.officialClaimsCrossReference &&
                verificationResult.officialClaimsCrossReference.length > 0 && (
                  <div className="p-4 rounded-xl bg-ivory border border-brass/30 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-aubergine flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-terracotta" />
                      Official Entity & Regulatory Claims Cross-Reference
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {verificationResult.officialClaimsCrossReference.map((claim, cIdx) => (
                        <div key={cIdx} className="p-3 rounded-lg bg-white border border-brass/20 text-xs space-y-1">
                          <span className="font-bold text-aubergine block">
                            {claim.organization || claim.title}
                          </span>
                          {claim.warning && (
                            <p className="text-[11px] text-aubergine/80 leading-relaxed">{claim.warning}</p>
                          )}
                          {claim.sourceUrl && (
                            <a
                              href={claim.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-terracotta hover:underline font-semibold pt-1"
                            >
                              <span>Official Regulatory Resource</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Gemini / Grounded Safety Explanation Report */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-aubergine via-[#391E3B] to-aubergine text-ivory border border-brass/30 shadow-md space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-brass/20">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span className="text-xs font-bold text-ivory uppercase tracking-wider">
                      Factual Forensic Summary & Guidance
                    </span>
                  </div>
                  <span className="text-[10px] text-brass-light font-mono">
                    {verificationResult.isAiExplained ? 'Explained with Gemini 1.5 Flash' : 'Grounded Deterministic Engine'}
                  </span>
                </div>

                <div className="text-xs text-ivory/90 whitespace-pre-line leading-relaxed font-sans space-y-2">
                  {verificationResult.evidenceExplanation}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="p-3 rounded-xl bg-ivory-dark border border-brass/20 text-[11px] text-aubergine/70 text-center">
                {verificationResult.disclaimer}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Interactive Scenario-Based Scam Detection Check */}
      <Card
        title="Interactive Scam Evaluation Practice"
        subtitle="Practice spotting social-engineering red flags with realistic Indian financial scenarios"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-brass/15">
            <span className="text-xs font-bold text-aubergine">
              Scenario {activeSimulationIndex + 1} of {INTERACTIVE_SCENARIOS.length}: {activeSim.title}
            </span>
            <div className="flex gap-1.5">
              {INTERACTIVE_SCENARIOS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveSimulationIndex(idx);
                    setSimulationUserDecision(null);
                  }}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    idx === activeSimulationIndex
                      ? 'bg-aubergine text-ivory'
                      : 'bg-ivory-dark text-aubergine/70 hover:bg-brass/20'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Simulated Message Box */}
          <div className="p-4 rounded-xl bg-ivory-dark border border-brass/25 font-mono text-xs sm:text-sm text-aubergine/90 leading-relaxed shadow-inner">
            {activeSim.message}
          </div>

          {/* User Decision Buttons */}
          {simulationUserDecision === null ? (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="text-xs font-bold text-aubergine mr-2">How do you classify this message?</span>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setSimulationUserDecision(true)}
                className="gap-1.5"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Mark as Suspicious / Scam</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSimulationUserDecision(false)}
                className="gap-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Mark as Legitimate</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  simulationUserDecision === activeSim.isScam
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}
              >
                {simulationUserDecision === activeSim.isScam ? (
                  <Check className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <X className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="font-bold text-xs sm:text-sm">
                    {simulationUserDecision === activeSim.isScam
                      ? 'Correct Assessment!'
                      : 'Incorrect Assessment!'} (This message is {activeSim.isScam ? 'a fraudulent SCAM' : 'a legitimate notification'})
                  </div>
                  <p className="text-xs opacity-90 leading-relaxed">
                    {activeSim.safeResponse}
                  </p>
                </div>
              </div>

              {/* Red flag indicators */}
              <div className="p-4 rounded-xl bg-ivory border border-brass/20 space-y-2 text-xs">
                <span className="font-bold text-aubergine block">Key Forensic Indicators:</span>
                <ul className="space-y-1.5 list-disc list-inside text-aubergine/80">
                  {activeSim.redFlags.map((flag, fIdx) => (
                    <li key={fIdx}>{flag}</li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const next = (activeSimulationIndex + 1) % INTERACTIVE_SCENARIOS.length;
                    setActiveSimulationIndex(next);
                    setSimulationUserDecision(null);
                  }}
                >
                  <span>Next Scenario</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Prevalent Financial Scams & Red Flag Checklists */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-aubergine">
          Prevalent Financial Scams & Defense Checklists
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SCAM_CATEGORIES.map((s) => (
            <Card
              key={s.id}
              className="bg-white/80 border-brass/25 space-y-3 cursor-pointer hover:border-terracotta/50 transition-colors"
              onClick={() => setSelectedScenario(s)}
            >
              <div className="flex items-start justify-between">
                <h4 className="text-sm font-bold text-aubergine flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-terracotta shrink-0" />
                  <span>{s.title}</span>
                </h4>
                <Badge variant="danger" size="sm">{s.severity}</Badge>
              </div>

              <div className="p-3 rounded-lg bg-ivory-dark text-xs text-aubergine/80 space-y-1 border border-brass/15">
                <span className="font-bold text-terracotta block">Red Flag Warning:</span>
                <p className="leading-relaxed">{s.redFlag}</p>
              </div>

              <div className="text-xs text-aubergine/70 space-y-1">
                <span className="font-bold text-aubergine">Why it is dangerous:</span>
                <p className="leading-relaxed">{s.explanation}</p>
              </div>

              <div className="pt-2 border-t border-brass/10 flex items-center justify-between text-[11px] text-emerald-800 font-bold">
                <span>Safe Next Step:</span>
                <span className="truncate max-w-[200px] text-right">{s.safeAction}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Official External Resources Registry */}
      <Card
        title="Authoritative Educational & Regulatory Registries"
        subtitle="Verified Indian statutory portals with mandatory citations (SRS 10.4)"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {sources.length > 0 ? (
            sources.map((src) => (
              <a
                key={src.id || src._id}
                href={src.url}
                target="_blank"
                rel="noreferrer"
                className="p-3.5 rounded-xl bg-ivory-dark border border-brass/20 text-xs font-semibold text-aubergine hover:text-terracotta hover:border-terracotta/40 transition-colors flex flex-col justify-between space-y-2"
              >
                <div>
                  <span className="font-bold block text-aubergine leading-snug">{src.title}</span>
                  <span className="text-[11px] text-aubergine/60 block mt-0.5">{src.organization}</span>
                </div>
                <div className="flex items-center justify-between pt-1 text-[11px] text-brass-dark">
                  <span>{src.reviewStatus || 'verified'}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </div>
              </a>
            ))
          ) : (
            <>
              <a
                href="https://investor.sebi.gov.in/spot-any-scam.html"
                target="_blank"
                rel="noreferrer"
                className="p-3.5 rounded-xl bg-ivory-dark border border-brass/20 text-xs font-semibold text-aubergine hover:text-terracotta transition-colors flex items-center justify-between"
              >
                <span>SEBI: Spot Any Scam</span>
                <ExternalLink className="w-4 h-4 shrink-0 text-brass-dark" />
              </a>

              <a
                href="https://sachet.rbi.org.in"
                target="_blank"
                rel="noreferrer"
                className="p-3.5 rounded-xl bg-ivory-dark border border-brass/20 text-xs font-semibold text-aubergine hover:text-terracotta transition-colors flex items-center justify-between"
              >
                <span>RBI: Sachet Portal</span>
                <ExternalLink className="w-4 h-4 shrink-0 text-brass-dark" />
              </a>

              <a
                href="https://www.cybercrime.gov.in"
                target="_blank"
                rel="noreferrer"
                className="p-3.5 rounded-xl bg-ivory-dark border border-brass/20 text-xs font-semibold text-aubergine hover:text-terracotta transition-colors flex items-center justify-between"
              >
                <span>National Cyber Crime Portal</span>
                <ExternalLink className="w-4 h-4 shrink-0 text-brass-dark" />
              </a>

              <a
                href="https://www.rbi.org.in"
                target="_blank"
                rel="noreferrer"
                className="p-3.5 rounded-xl bg-ivory-dark border border-brass/20 text-xs font-semibold text-aubergine hover:text-terracotta transition-colors flex items-center justify-between"
              >
                <span>RBI: Kehta Hai Campaign</span>
                <ExternalLink className="w-4 h-4 shrink-0 text-brass-dark" />
              </a>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

export default SafetyLabPage;
