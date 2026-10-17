import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { api } from '../../services/api';
import {
  Sparkles,
  Send,
  BookOpen,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Bot,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  AlertCircle
} from 'lucide-react';

const INITIAL_MESSAGES = [
  {
    id: 'm1',
    sender: 'coach',
    text: 'Namaste! I am your FinLearn Money Coach. I can explain budgeting frameworks, reducing-balance loan math, investment risk categories, and common scam red flags using verified Indian financial education sources. How can I help you today?',
    sources: [
      { title: 'FinLearn Approved Curriculum', url: '/learning' },
      { title: 'RBI Digital Lending Guidelines', url: 'https://rbi.org.in' }
    ],
    isGrounded: true,
    hasSufficientEvidence: true,
  }
];

export function AiCoachPage() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const messagesEndRef = useRef(null);

  // Auto scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load conversation from backend on mount
  useEffect(() => {
    async function loadConversation() {
      try {
        const res = await api.get('/ai-coach/conversation');
        if (res?.data?.messages && res.data.messages.length > 0) {
          const formatted = res.data.messages.map((m, idx) => ({
            id: m._id || `msg_${idx}`,
            sender: m.sender === 'coach' || m.sender === 'ai' ? 'coach' : 'user',
            text: m.text,
            sources: m.sources || [],
            isGrounded: m.isGrounded !== false,
            hasSufficientEvidence: m.hasSufficientEvidence !== false,
          }));
          setMessages(formatted);
        }
      } catch (err) {
        // Fallback to initial local welcome if guest/unauthenticated or network down
        console.warn('Using offline initial state for AI Coach:', err.message);
      }
    }

    loadConversation();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userQuery = prompt.trim();
    const tempUserMsg = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: userQuery,
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setPrompt('');
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.post('/ai-coach/query', { message: userQuery });
      if (res?.data?.reply) {
        const reply = res.data.reply;
        setMessages((prev) => [
          ...prev,
          {
            id: `coach_${Date.now()}`,
            sender: 'coach',
            text: reply.text,
            sources: reply.sources || [],
            isGrounded: reply.isGrounded !== false,
            hasSufficientEvidence: reply.hasSufficientEvidence !== false,
          },
        ]);
      }
    } catch (err) {
      console.warn('AI Coach query error:', err.message);
      setErrorMsg(err.message || 'Failed to communicate with coach');

      // Educational fallback grounded in FinLearn principles
      let replyText = '';
      let replySources = [];

      if (userQuery.toLowerCase().includes('stock') || userQuery.toLowerCase().includes('invest')) {
        replyText = 'FinLearn provides educational guidance on asset classes and risk diversification, but does NOT provide personalized buy/sell stock tips or guaranteed return predictions. In India, always consult a SEBI-registered investment adviser (RIA) before committing capital.';
        replySources = [
          { title: 'SEBI Registered Intermediary Directory', url: 'https://investor.sebi.gov.in/investment_advisor.html' },
          { title: 'Investment Learning & Risk Guide', url: '/investments' }
        ];
      } else if (userQuery.toLowerCase().includes('scam') || userQuery.toLowerCase().includes('pin') || userQuery.toLowerCase().includes('otp')) {
        replyText = 'Critical Safety Rule: Entering a UPI PIN or sharing an SMS OTP ALWAYS debits funds from your account—never credits it. Legitimate transfers require zero action on your phone. If you have been defrauded, call 1930 immediately or visit cybercrime.gov.in.';
        replySources = [
          { title: 'National Cyber Crime Reporting Portal (1930)', url: 'https://www.cybercrime.gov.in' },
          { title: 'FinLearn Safety Lab', url: '/safety' }
        ];
      } else if (userQuery.toLowerCase().includes('loan') || userQuery.toLowerCase().includes('emi')) {
        replyText = 'When comparing loans, ensure you calculate the true reducing-balance Annual Percentage Rate (APR). Flat interest rates advertised as 8% often equate to ~14.5% reducing APR because you pay interest on already repaid principal. Also verify upfront processing fees.';
        replySources = [
          { title: 'FinLearn Smart Borrowing & EMI Calculator', url: '/loans' },
          { title: 'RBI Master Directions on Digital Lending', url: 'https://rbi.org.in' }
        ];
      } else {
        replyText = `Thank you for your question on "${userQuery}". FinLearn recommends grounding all personal financial decisions in a disciplined 50-30-20 budget allocation, keeping a 3-6 month emergency fund, and tracking monthly recurring commitments.`;
        replySources = [
          { title: 'Money Management Fundamentals (Lesson 1)', url: '/learning' }
        ];
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `fallback_${Date.now()}`,
          sender: 'coach',
          text: replyText,
          sources: replySources,
          isGrounded: true,
          hasSufficientEvidence: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset this conversation history? A fresh educational session will begin.')) {
      return;
    }
    setResetting(true);
    setErrorMsg('');
    try {
      const res = await api.post('/ai-coach/reset');
      if (res?.data?.messages) {
        const formatted = res.data.messages.map((m, idx) => ({
          id: m._id || `msg_${idx}`,
          sender: 'coach',
          text: m.text,
          sources: m.sources || [],
          isGrounded: true,
          hasSufficientEvidence: true,
        }));
        setMessages(formatted);
      } else {
        setMessages(INITIAL_MESSAGES);
      }
    } catch (err) {
      console.warn('Reset error:', err.message);
      setMessages(INITIAL_MESSAGES);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-aubergine">
              AI Money Coach
            </h1>
            <Badge variant="terracotta" size="sm">Grounded Education</Badge>
          </div>
          <p className="text-xs text-aubergine/70">
            Backed by approved learning sources • Zero personalized advice • Uncertainty disclosed
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={RotateCcw}
          onClick={handleReset}
          disabled={resetting || loading}
        >
          {resetting ? 'Resetting...' : 'New Session'}
        </Button>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-3.5 rounded-xl bg-ivory-dark border border-brass/25 flex items-start gap-2.5 text-xs text-aubergine/80">
        <ShieldAlert className="w-4 h-4 text-terracotta shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Educational Grounding Guardrail:</strong> The AI Coach answers strictly using FinLearn's reviewed curriculum and official sources. It never provides speculative stock tips, asks for OTPs/PINs, or promises loan approvals.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Notice: Server connection issue. Displaying local grounded safety response.</span>
        </div>
      )}

      {/* Chat Messages Card */}
      <Card className="bg-white/80 border-brass/25 min-h-[460px] flex flex-col justify-between p-4 sm:p-6 space-y-4">
        {/* Messages List */}
        <div className="space-y-4 overflow-y-auto max-h-[520px] pr-2">
          {messages.map((m) => {
            const isCoach = m.sender === 'coach' || m.sender === 'ai';
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isCoach ? 'items-start' : 'items-end justify-end'}`}
              >
                {isCoach && (
                  <div className="w-8 h-8 rounded-lg bg-aubergine text-ivory flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-4 h-4 text-brass-light" />
                  </div>
                )}

                <div className={`p-4 rounded-2xl max-w-xl text-xs sm:text-sm space-y-2.5 ${
                  isCoach
                    ? 'bg-ivory-dark border border-brass/20 text-aubergine shadow-xs'
                    : 'bg-terracotta text-white font-medium ml-12 rounded-br-xs'
                }`}>
                  <p className="leading-relaxed whitespace-pre-line">{m.text}</p>

                  {/* Sources citation block if Coach */}
                  {isCoach && (
                    <div className="pt-2 border-t border-brass/15 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-aubergine/60 font-bold uppercase tracking-wider">
                        <span>Verified Sources & Citations:</span>
                        {m.hasSufficientEvidence ? (
                          <span className="flex items-center gap-1 text-emerald-700 font-semibold lowercase">
                            <CheckCircle2 className="w-3 h-3" /> high evidence
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-700 font-semibold lowercase">
                            <HelpCircle className="w-3 h-3" /> uncertainty stated
                          </span>
                        )}
                      </div>

                      {m.sources && m.sources.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {m.sources.map((s, idx) => (
                            <a
                              key={idx}
                              href={s.url}
                              target={s.url?.startsWith('http') ? '_blank' : '_self'}
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/70 border border-brass/25 text-[10px] font-semibold text-aubergine hover:text-terracotta transition-colors"
                            >
                              <span>{s.title}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-aubergine/50 italic">
                          No specific curriculum excerpts cited for general safety guidance.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3 text-xs text-aubergine/60 italic p-2">
              <Bot className="w-4 h-4 animate-spin text-terracotta" />
              <span>Grounded coach evaluating approved educational materials...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="pt-4 border-t border-brass/15 flex items-center gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask about reducing EMI, emergency funds, SIPs, or scam red flags..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-brass/30 bg-ivory-surface text-xs sm:text-sm text-aubergine focus:outline-none focus:ring-2 focus:ring-terracotta"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={Send}
            disabled={!prompt.trim() || loading}
          >
            Send
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default AiCoachPage;
