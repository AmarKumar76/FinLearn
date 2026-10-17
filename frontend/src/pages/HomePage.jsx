import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { formatPaiseToINR, parseRupeesToPaise } from '../utils/formatters';
import api from '../services/api';
import {
  ShieldCheck,
  Server,
  Layers,
  Palette,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Code
} from 'lucide-react';

export function HomePage() {
  const [healthData, setHealthData] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [healthError, setHealthError] = useState(null);

  // Quick INR interactive tester to demonstrate integer paise converter
  const [testRupees, setTestRupees] = useState('125000.50');
  const [calculatedPaise, setCalculatedPaise] = useState(12500050);

  const fetchHealth = async () => {
    setLoadingHealth(true);
    setHealthError(null);
    try {
      const data = await api.checkHealth();
      setHealthData(data);
    } catch (err) {
      setHealthError(err.message || 'Failed to reach API server');
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleRupeeChange = (e) => {
    const val = e.target.value;
    setTestRupees(val);
    setCalculatedPaise(parseRupeesToPaise(val));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Welcome Card */}
      <div className="rounded-2xl bg-aubergine text-ivory p-6 sm:p-8 border border-aubergine-light shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="terracotta" size="md">Phase 1 Complete</Badge>
            <Badge variant="brass" size="md">Full-Stack Foundation</Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ivory mb-2">
            Welcome to FinLearn
          </h2>
          <p className="text-sm sm:text-base text-lilac-light leading-relaxed mb-6">
            Empowering students, salaried employees, and self-employed learners across India with verifiable personal financial literacy, responsible debt management, and grounded scam protection.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="md"
              icon={Server}
              onClick={fetchHealth}
              loading={loadingHealth}
            >
              Verify Backend Health
            </Button>
            <a
              href="https://www.cybercrime.gov.in"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-brass-light hover:text-ivory px-3 py-2 rounded-lg border border-brass/30 transition-colors"
            >
              <span>National Cyber Crime Portal (1930)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Decorative background accents */}
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-terracotta/20 to-transparent pointer-events-none" />
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-brass/10 blur-2xl pointer-events-none" />
      </div>

      {/* Grid: System Architecture & Live Health status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backend Connectivity Status Card */}
        <Card
          title="Backend & Database Health"
          subtitle="Real-time connectivity to Express API and MongoDB"
          action={
            <Button variant="ghost" size="sm" onClick={fetchHealth}>
              Refresh
            </Button>
          }
        >
          {loadingHealth ? (
            <div className="py-6 text-center text-sm text-aubergine/70 animate-pulse">
              Querying GET /api/v1/health...
            </div>
          ) : healthError ? (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm space-y-2">
              <div className="flex items-center gap-2 font-semibold text-rose-900">
                <AlertTriangle className="w-4 h-4" />
                <span>Backend Connection Offline</span>
              </div>
              <p className="text-xs text-rose-700">
                {healthError}
              </p>
              <p className="text-[11px] text-rose-600">
                Ensure backend server is running on port 5000 (`npm run dev` in backend/).
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-ivory-dark border border-brass/20">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="text-xs font-semibold text-aubergine block">API Service</span>
                    <span className="text-[11px] text-aubergine/60 font-mono">Status: {healthData?.status}</span>
                  </div>
                </div>
                <Badge variant="success" size="sm">Online</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-ivory-dark border border-brass/20">
                <div className="flex items-center gap-2.5">
                  <span className={`w-3 h-3 rounded-full ${healthData?.database?.status === 'connected' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  <div>
                    <span className="text-xs font-semibold text-aubergine block">MongoDB Persistence</span>
                    <span className="text-[11px] text-aubergine/60 font-mono">State: {healthData?.database?.status || 'disconnected'}</span>
                  </div>
                </div>
                <Badge
                  variant={healthData?.database?.status === 'connected' ? 'success' : 'warning'}
                  size="sm"
                >
                  {healthData?.database?.status === 'connected' ? 'Connected' : 'Standby / Local'}
                </Badge>
              </div>

              <div className="text-[11px] text-aubergine/60 font-mono pt-1">
                Environment: {healthData?.environment || 'development'} • Uptime: {Math.round(healthData?.uptimeSeconds || 0)}s
              </div>
            </div>
          )}
        </Card>

        {/* Financial Domain Invariant: Integer Paise Demonstration */}
        <Card
          title="Monetary Precision Invariant"
          subtitle="DEC-002: Exact integer paise storage (Zero float drift)"
        >
          <div className="space-y-4">
            <p className="text-xs text-aubergine/70 leading-relaxed">
              Every financial transaction, budget limit, and savings target in FinLearn is mathematically enforced as 64-bit integer paise to prevent floating point inaccuracies.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <Input
                label="Enter Amount (INR)"
                value={testRupees}
                onChange={handleRupeeChange}
                placeholder="e.g. 5000.75"
              />

              <div className="p-3 rounded-lg bg-ivory-dark border border-brass/20 space-y-1">
                <span className="text-[10px] uppercase font-bold text-aubergine/60 tracking-wider block">
                  Database Integer Value
                </span>
                <span className="text-lg font-mono font-bold text-terracotta block">
                  {calculatedPaise.toLocaleString()} paise
                </span>
                <span className="text-[11px] text-aubergine/60 block">
                  Formatted: {formatPaiseToINR(calculatedPaise)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Design System Tokens Showcase Card */}
      <Card
        title="Curated Design System Palette"
        subtitle="Mandatory visual aesthetics matching reference collage (No blue or default green)"
      >
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-aubergine text-ivory flex flex-col justify-between h-24 border border-aubergine-light">
            <span className="text-xs font-bold">Aubergine</span>
            <span className="text-[11px] font-mono text-lilac">#321D35</span>
          </div>
          <div className="p-3 rounded-xl bg-terracotta text-white flex flex-col justify-between h-24">
            <span className="text-xs font-bold">Terracotta</span>
            <span className="text-[11px] font-mono text-white/80">#D15C40</span>
          </div>
          <div className="p-3 rounded-xl bg-ivory text-aubergine border border-brass/30 flex flex-col justify-between h-24">
            <span className="text-xs font-bold">Warm Ivory</span>
            <span className="text-[11px] font-mono text-aubergine/70">#FAF5EB</span>
          </div>
          <div className="p-3 rounded-xl bg-brass text-white flex flex-col justify-between h-24">
            <span className="text-xs font-bold">Muted Brass</span>
            <span className="text-[11px] font-mono text-white/80">#B88C56</span>
          </div>
          <div className="p-3 rounded-xl bg-lilac text-aubergine flex flex-col justify-between h-24">
            <span className="text-xs font-bold">Soft Lilac</span>
            <span className="text-[11px] font-mono text-aubergine/70">#D7C5D8</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default HomePage;
