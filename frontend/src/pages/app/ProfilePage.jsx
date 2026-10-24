import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  User,
  Flame,
  Award,
  BookOpen,
  CheckCircle2,
  Calendar,
  Settings,
  Share2,
  Lock,
  Globe,
  Sparkles,
  Trophy,
  Loader2
} from 'lucide-react';

export function ProfilePage() {
  const { username } = useParams();
  const { user: authUser } = useAuth();
  const isPersonal = !username || username === authUser?.username;

  const [profile, setProfile] = useState(null);
  const [gamification, setGamification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isPersonal) {
        // Load full personal profile from backend endpoint
        const res = await api.get('/users/me/profile');
        const data = res.data?.data || res.data;
        setProfile({
          name: data.user?.name || authUser?.name,
          username: data.user?.username || authUser?.username,
          bio: data.user?.bio ?? authUser?.bio ?? '',
          createdAt: data.user?.createdAt || authUser?.createdAt,
          isProfilePublic: data.user?.isProfilePublic ?? authUser?.isProfilePublic ?? true,
        });
        setGamification(data.gamification);
      } else {
        // Public profile view via /users/profile/:username
        const res = await api.get(`/users/profile/${encodeURIComponent(username)}`);
        const data = res.data?.data || res.data;
        if (data.isPrivate) {
          setProfile({
            name: 'Private Learner',
            username: data.user?.username || username,
            bio: '',
            isProfilePublic: false,
          });
          setGamification(null);
        } else {
          setProfile(data.user);
          setGamification(data.gamification);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [username, isPersonal, authUser]);

  const handleShare = () => {
    const url = window.location.origin + `/profile/${profile?.username || authUser?.username}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center gap-2 text-theme-muted">
        <Loader2 className="w-6 h-6 animate-spin text-terracotta" />
        <span className="text-xs">Loading learner profile...</span>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="py-16 text-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-theme-primary">Profile Unavailable</h2>
        <p className="text-xs text-theme-muted">{error || 'This user profile does not exist.'}</p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="primary" size="sm" onClick={loadProfile}>
            Retry
          </Button>
          <Link to="/leaderboard">
            <Button variant="outline" size="sm">Explore Leaderboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const pData = gamification?.profile;
  const badges = gamification?.badges || [];

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Top Banner & Header Card */}
      <Card className="bg-theme-surface border-theme-border relative overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-aubergine via-aubergine-light to-terracotta -mx-5 -mt-5 mb-4 relative" />
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 relative z-10">
          <div className="flex items-end gap-4">
            <div className="w-20 h-20 rounded-2xl bg-terracotta text-white flex items-center justify-center text-3xl font-black border-4 border-theme-surface shadow-xl">
              {profile.name?.charAt(0).toUpperCase() || 'L'}
            </div>
            <div className="mb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-theme-primary">
                  {profile.name}
                </h1>
                {profile.isProfilePublic ? (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Public
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-theme-muted bg-theme-subtle px-2 py-0.5 rounded flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Private
                  </span>
                )}
              </div>
              <p className="text-xs text-theme-muted font-mono">
                @{profile.username || 'learner'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-1">
            {profile.username && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Share2}
                onClick={handleShare}
              >
                {copiedLink ? 'Copied Link!' : 'Share Profile'}
              </Button>
            )}
            {isPersonal && (
              <Link to="/settings">
                <Button variant="primary" size="sm" icon={Settings}>
                  Edit Profile
                </Button>
              </Link>
            )}
          </div>
        </div>

        {profile.bio && (
          <p className="mt-4 text-xs text-theme-primary leading-relaxed bg-theme-subtle/50 p-3 rounded-xl border border-theme-border">
            {profile.bio}
          </p>
        )}
      </Card>

      {/* LeetCode-style Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="text-center p-4">
          <span className="text-[10px] uppercase font-bold text-theme-muted block">Total XP</span>
          <span className="text-2xl font-black text-brass block mt-1">
            {pData?.totalXp || 0}
          </span>
          <span className="text-[10px] text-theme-muted">Learning Points</span>
        </Card>

        <Card className="text-center p-4">
          <span className="text-[10px] uppercase font-bold text-theme-muted block">Current Streak</span>
          <span className="text-2xl font-black text-emerald-600 flex items-center justify-center gap-1 mt-1">
            <Flame className="w-5 h-5 fill-emerald-500" />
            {pData?.currentStreak || 0}d
          </span>
          <span className="text-[10px] text-theme-muted">Longest: {pData?.longestStreak || 0}d</span>
        </Card>

        <Card className="text-center p-4">
          <span className="text-[10px] uppercase font-bold text-theme-muted block">Lessons Finished</span>
          <span className="text-2xl font-black text-theme-primary block mt-1">
            {pData?.completedLessonsCount || 0}
          </span>
          <span className="text-[10px] text-theme-muted">Curriculum Modules</span>
        </Card>

        <Card className="text-center p-4">
          <span className="text-[10px] uppercase font-bold text-theme-muted block">Quizzes Passed</span>
          <span className="text-2xl font-black text-terracotta block mt-1">
            {pData?.passedQuizzesCount || 0}
          </span>
          <span className="text-[10px] text-theme-muted">Assessments</span>
        </Card>
      </div>

      {/* Badges & Accomplishments */}
      <Card
        title="Earned Badges & Milestones"
        subtitle="Permanent awards earned through verified curriculum milestones"
      >
        {badges.length === 0 ? (
          <div className="py-8 text-center text-xs text-theme-muted">
            <Award className="w-8 h-8 mx-auto mb-2 text-theme-muted/50" />
            Complete lessons and score 60%+ on quizzes to unlock verified badges.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {badges.map((b) => (
              <div
                key={b.id}
                className={`p-3.5 rounded-xl border flex items-center gap-3 transition-colors ${
                  b.isEarned
                    ? 'border-brass/40 bg-theme-surface shadow-xs'
                    : 'border-theme-border/40 bg-theme-subtle/30 opacity-40'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    b.isEarned ? 'bg-brass text-white' : 'bg-theme-subtle text-theme-muted'
                  }`}
                >
                  <Award className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-theme-primary truncate">{b.title}</h4>
                    {b.isEarned && (
                      <span className="text-[9px] text-emerald-600 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded">
                        Earned
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-theme-muted line-clamp-2 mt-0.5">{b.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default ProfilePage;
