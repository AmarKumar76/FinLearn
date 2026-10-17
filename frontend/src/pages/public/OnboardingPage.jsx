import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import {
  GraduationCap,
  Briefcase,
  Building,
  UserCheck,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

const PERSONAS = [
  {
    id: 'student',
    title: 'Student / College Learner',
    description: 'Focus on budgeting pocket money, student loan terms, avoiding digital fraud, and starting small SIPs.',
    icon: GraduationCap,
    badge: 'Popular',
  },
  {
    id: 'salaried',
    title: 'Salaried Professional',
    description: 'Track monthly payroll, EMIs, rent, 80C tax saving fundamentals, emergency funds, and investment risk.',
    icon: Briefcase,
    badge: 'Recommended',
  },
  {
    id: 'self_employed',
    title: 'Self-Employed / Freelancer',
    description: 'Manage variable cash flows, quarterly tax estimates, irregular income buffers, and personal protection.',
    icon: Building,
    badge: 'Flexible',
  },
  {
    id: 'other',
    title: 'Lifelong Learner',
    description: 'General money management, retirement fundamentals, safe borrowing practices, and scam checklists.',
    icon: UserCheck,
    badge: 'General',
  },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const [selectedPersona, setSelectedPersona] = useState('salaried');
  const [step, setStep] = useState(1);

  const handleFinish = () => {
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-ivory flex flex-col justify-center py-12 px-6 sm:px-12 relative overflow-hidden">
      <div className="max-w-3xl mx-auto w-full relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="terracotta" size="sm">Step 1 of 2 • Unified Experience</Badge>
          <h1 className="text-2xl sm:text-3xl font-black text-aubergine">
            Tell Us About Your Financial Profile
          </h1>
          <p className="text-xs sm:text-sm text-aubergine/70 max-w-lg mx-auto">
            FinLearn provides a unified dashboard for all learners while tailoring initial learning suggestions to your life stage.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PERSONAS.map((p) => {
            const Icon = p.icon;
            const isSelected = selectedPersona === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedPersona(p.id)}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-terracotta bg-white shadow-md'
                    : 'border-brass/25 bg-white/60 hover:bg-white hover:border-brass/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-terracotta text-white' : 'bg-ivory-dark text-aubergine'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-terracotta" />
                    )}
                  </div>
                  <h3 className="text-base font-bold text-aubergine mb-1">
                    {p.title}
                  </h3>
                  <p className="text-xs text-aubergine/70 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="pt-4">
                  <Badge variant={isSelected ? 'terracotta' : 'default'} size="sm">
                    {p.badge}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-4">
          <span className="text-xs text-aubergine/60 font-medium">
            Unified workspace model (DEC-004)
          </span>
          <Button
            variant="primary"
            size="md"
            icon={ArrowRight}
            onClick={handleFinish}
          >
            Launch FinLearn Workspace
          </Button>
        </div>
      </div>
    </div>
  );
}

export default OnboardingPage;
