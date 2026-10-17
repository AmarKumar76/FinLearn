import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import {
  User,
  Shield,
  Bell,
  Globe,
  Trash2,
  Save,
  CheckCircle2,
  Lock
} from 'lucide-react';

export function SettingsPage() {
  const [name, setName] = useState('Amar Sharma');
  const [email, setEmail] = useState('amar@example.com');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [currency, setCurrency] = useState('INR');

  // Notification toggles
  const [inAppNotifs, setInAppNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-aubergine">
          Account Profile & Preferences
        </h1>
        <p className="text-xs text-aubergine/70">
          Personal profile • Timezone • Notification channels • Privacy controls
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <Card title="User Identity" subtitle="Basic account details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </Card>

        {/* Regional & Localization */}
        <Card title="Localization & Regional Settings" subtitle="Date and currency conventions">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Configured Timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              options={[
                { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST, UTC+5:30)' },
                { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
              ]}
              helperText="Scheduled reminders and month transitions evaluate against this timezone"
            />

            <Select
              label="Base Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={[
                { value: 'INR', label: 'Indian Rupee (₹, INR - integer paise)' },
              ]}
              disabled
              helperText="Fixed to INR (paise) for reliable financial integrity"
            />
          </div>
        </Card>

        {/* Notification Preferences */}
        <Card title="Reminder Delivery Channels" subtitle="Control where you receive financial alerts">
          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-lg bg-ivory-dark cursor-pointer">
              <div>
                <span className="font-bold text-aubergine block">In-App Notifications</span>
                <span className="text-aubergine/60 text-[11px]">Receive bill due date and budget breach alerts in platform</span>
              </div>
              <input
                type="checkbox"
                checked={inAppNotifs}
                onChange={(e) => setInAppNotifs(e.target.checked)}
                className="w-4 h-4 text-terracotta rounded border-brass/40 focus:ring-terracotta"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-ivory-dark cursor-pointer">
              <div>
                <span className="font-bold text-aubergine block">Email Reminders</span>
                <span className="text-aubergine/60 text-[11px]">Optional email notifications for critical overdue bills</span>
              </div>
              <input
                type="checkbox"
                checked={emailNotifs}
                onChange={(e) => setEmailNotifs(e.target.checked)}
                className="w-4 h-4 text-terracotta rounded border-brass/40 focus:ring-terracotta"
              />
            </label>
          </div>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess && (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Settings saved successfully
            </span>
          )}
          {!savedSuccess && <div />}

          <Button type="submit" variant="primary" size="md" icon={Save}>
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
}

export default SettingsPage;
