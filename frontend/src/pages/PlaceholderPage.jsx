import React from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Link } from 'react-router-dom';
import { Construction, ArrowLeft, ShieldAlert } from 'lucide-react';

export function PlaceholderPage({ title, moduleCode, description, plannedPhase }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/">
          <Button variant="ghost" size="sm" icon={ArrowLeft}>
            Back to Dashboard
          </Button>
        </Link>
        <Badge variant="terracotta" size="sm">Phase {plannedPhase}</Badge>
        <span className="text-xs text-aubergine/60 font-mono">Module: {moduleCode}</span>
      </div>

      <Card
        title={title}
        subtitle={`Scheduled for development in Phase ${plannedPhase}`}
        className="max-w-2xl"
      >
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-lilac/30 flex items-center justify-center text-aubergine">
            <Construction className="w-7 h-7 text-terracotta" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-aubergine">
              Feature Specification Locked
            </h3>
            <p className="text-sm text-aubergine/70 mt-1 max-w-md">
              {description || 'This module has been fully analyzed in the Master Plan and EDGE_CASES.md. Implementation proceeds sequentially following Phase 1 foundation approval.'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-ivory-dark border border-brass/20 text-xs text-aubergine/80 max-w-sm">
            <div className="font-semibold text-aubergine flex items-center justify-center gap-1.5 mb-1">
              <ShieldAlert className="w-3.5 h-3.5 text-brass-dark" />
              <span>Phase 1 Scope Rule</span>
            </div>
            <span>No fake data or partial financial mocks are loaded before authenticated backend contracts exist.</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default PlaceholderPage;
