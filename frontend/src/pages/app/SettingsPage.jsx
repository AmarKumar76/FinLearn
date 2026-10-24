import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  User,
  Shield,
  Bell,
  Globe,
  Save,
  CheckCircle2,
  Lock,
  Sun,
  Moon,
  Sparkles,
  AlertCircle,
  KeyRound,
  LogOut,
  Eye,
  EyeOff
} from 'lucide-react';

export function SettingsPage() {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  // Profile Form state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [currency, setCurrency] = useState('INR');
  const [isProfilePublic, setIsProfilePublic] = useState(true);

  // Notification toggles
  const [inAppNotifs, setInAppNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(false);

  // Status indicators
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Change Password Modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  // Populate from real authenticated user
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setBio(user.bio || '');
      setTimezone(user.preferences?.timezone || 'Asia/Kolkata');
      setCurrency(user.preferences?.currency || 'INR');
      setIsProfilePublic(user.isProfilePublic !== undefined ? user.isProfilePublic : true);
      setInAppNotifs(user.preferences?.notifications?.inApp ?? true);
      setEmailNotifs(user.preferences?.notifications?.email ?? false);
    }
  }, [user]);

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    try {
      await updateProfile({
        name,
        username: username.trim() || undefined,
        bio,
        isProfilePublic,
        preferences: {
          timezone,
          theme,
          notifications: {
            inApp: inAppNotifs,
            email: emailNotifs,
          },
        },
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordSuccess(false);
        setIsPasswordModalOpen(false);
      }, 2000);
    } catch (err) {
      setPasswordError(err.response?.data?.message || err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-theme-primary">
          Account Profile & Preferences
        </h1>
        <p className="text-xs text-theme-muted">
          Personal profile • Global appearance • Timezone & notifications • Security
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSavePreferences} className="space-y-6">
        {/* Appearance & Themes Card */}
        <Card title="Appearance & Themes" subtitle="Select your preferred global visual experience">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Light Mode */}
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border text-left transition-all relative ${
                theme === 'light'
                  ? 'border-terracotta bg-terracotta/10 ring-2 ring-terracotta/30'
                  : 'border-theme-border hover:border-theme-border-strong bg-theme-surface'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Sun className="w-5 h-5 text-brass" />
                {theme === 'light' && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta bg-terracotta/20 px-1.5 py-0.5 rounded">
                    Active
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-theme-primary">Light Mode</h4>
              <p className="text-[11px] text-theme-muted mt-0.5">
                FinLearn warm ivory, rich aubergine, terracotta & brass.
              </p>
            </button>

            {/* Dark Mode */}
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl border text-left transition-all relative ${
                theme === 'dark'
                  ? 'border-terracotta bg-terracotta/10 ring-2 ring-terracotta/30'
                  : 'border-theme-border hover:border-theme-border-strong bg-theme-surface'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Moon className="w-5 h-5 text-lilac" />
                {theme === 'dark' && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta bg-terracotta/20 px-1.5 py-0.5 rounded">
                    Active
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-theme-primary">Dark Mode</h4>
              <p className="text-[11px] text-theme-muted mt-0.5">
                Deep aubergine surfaces, soft contrast, reduced eye fatigue.
              </p>
            </button>

            {/* AMOLED Mode */}
            <button
              type="button"
              onClick={() => setTheme('amoled')}
              className={`p-4 rounded-xl border text-left transition-all relative ${
                theme === 'amoled'
                  ? 'border-terracotta bg-terracotta/10 ring-2 ring-terracotta/30'
                  : 'border-theme-border hover:border-theme-border-strong bg-theme-surface'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Sparkles className="w-5 h-5 text-terracotta" />
                {theme === 'amoled' && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta bg-terracotta/20 px-1.5 py-0.5 rounded">
                    Active
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-theme-primary">AMOLED Black</h4>
              <p className="text-[11px] text-theme-muted mt-0.5">
                Pure #000000 background for OLED screens & maximum contrast.
              </p>
            </button>
          </div>
        </Card>

        {/* Profile Card */}
        <Card title="User Identity" subtitle="Your authenticated account information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Display Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Unique Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. learner_pro"
              helperText="Used for public profile URL and leaderboard handle"
            />
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-theme-primary uppercase tracking-wider mb-1.5">
                Email Address (Account Identifier)
              </label>
              <div className="px-3.5 py-2.5 rounded-lg border border-theme-border bg-theme-subtle text-theme-muted text-sm font-mono flex items-center justify-between">
                <span>{user?.email || 'learner@finlearn.in'}</span>
                <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                  Verified
                </span>
              </div>
              <p className="text-[11px] text-theme-muted mt-1">
                Account email is immutable to protect multi-factor security and financial audit trails.
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-theme-primary uppercase tracking-wider mb-1.5">
                Bio / Learning Aspirations
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={300}
                rows={2}
                placeholder="Share your financial goals or learning mission..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-theme-border bg-theme-surface text-theme-primary placeholder:text-theme-muted text-sm focus:outline-none focus:ring-2 focus:ring-terracotta"
              />
              <p className="text-[11px] text-theme-muted text-right">{bio.length}/300 characters</p>
            </div>
          </div>
        </Card>

        {/* Regional & Localization */}
        <Card title="Localization & Regional Settings" subtitle="Date, currency conventions and standards">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Configured Timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              options={[
                { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST, UTC+5:30)' },
                { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
              ]}
              helperText="Financial notifications evaluate strictly against this timezone"
            />

            <Select
              label="Base Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={[
                { value: 'INR', label: 'Indian Rupee (₹, INR - integer paise)' },
              ]}
              disabled
              helperText="Mathematically enforced 64-bit integer paise to prevent floating-point inaccuracies"
            />
          </div>
        </Card>

        {/* Notification Preferences */}
        <Card title="Alert Channels" subtitle="Control where you receive financial due date & safety alerts">
          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3.5 rounded-lg bg-theme-subtle border border-theme-border cursor-pointer transition-colors">
              <div>
                <span className="font-bold text-theme-primary block">In-App Notifications</span>
                <span className="text-theme-muted text-[11px]">Receive bill due date and budget alerts directly inside workspace</span>
              </div>
              <input
                type="checkbox"
                checked={inAppNotifs}
                onChange={(e) => setInAppNotifs(e.target.checked)}
                className="w-4 h-4 text-terracotta rounded border-theme-border focus:ring-terracotta"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-lg bg-theme-subtle border border-theme-border cursor-pointer transition-colors">
              <div>
                <span className="font-bold text-theme-primary block">Email Critical Overdue Alerts</span>
                <span className="text-theme-muted text-[11px]">Optional email notifications for critical overdue bills</span>
              </div>
              <input
                type="checkbox"
                checked={emailNotifs}
                onChange={(e) => setEmailNotifs(e.target.checked)}
                className="w-4 h-4 text-terracotta rounded border-theme-border focus:ring-terracotta"
              />
            </label>
          </div>
        </Card>

        {/* Privacy & Security Card */}
        <Card title="Privacy & Security Controls" subtitle="Manage profile visibility and password credentials">
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3.5 rounded-lg bg-theme-subtle border border-theme-border cursor-pointer transition-colors">
              <div>
                <span className="font-bold text-theme-primary block">Public Profile Visibility</span>
                <span className="text-theme-muted text-[11px]">
                  Allow other learners to view your learning streak, badges, and points (email & financial records are always hidden)
                </span>
              </div>
              <input
                type="checkbox"
                checked={isProfilePublic}
                onChange={(e) => setIsProfilePublic(e.target.checked)}
                className="w-4 h-4 text-terracotta rounded border-theme-border focus:ring-terracotta"
              />
            </label>

            <div className="pt-2 flex flex-wrap gap-3 items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={KeyRound}
                onClick={() => setIsPasswordModalOpen(true)}
              >
                Change Password
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={LogOut}
                onClick={logout}
                className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border-rose-500/30"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess && (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
              <CheckCircle2 className="w-4 h-4" /> Preferences saved and synchronized
            </span>
          )}
          {!savedSuccess && <div />}

          <Button type="submit" variant="primary" size="md" icon={Save} loading={saving}>
            Save Preferences
          </Button>
        </div>
      </form>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Account Password"
        subtitle="Ensure your new password contains at least 8 characters"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          {passwordError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Password updated successfully!</span>
            </div>
          )}

          <Input
            label="Current Password"
            type={showCurrentPw ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            endAdornment={
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="text-theme-muted hover:text-theme-primary p-1"
              >
                {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          <Input
            label="New Password"
            type={showNewPw ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min 8 characters"
            required
            endAdornment={
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="text-theme-muted hover:text-theme-primary p-1"
              >
                {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          <Input
            label="Confirm New Password"
            type={showNewPw ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            required
          />

          <div className="flex items-center justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPasswordModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={passwordLoading}
            >
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default SettingsPage;
