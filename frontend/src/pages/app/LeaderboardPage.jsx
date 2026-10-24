import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import api from '../../services/api';
import {
  Trophy,
  Medal,
  Flame,
  Award,
  BookOpen,
  CheckCircle2,
  Users,
  Search,
  Sparkles
} from 'lucide-react';

export function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/quizzes/gamification/leaderboard');
        if (res && res.data) {
          setLeaderboard(res.data.leaderboard || []);
          setCurrentUser(res.data.currentUser || null);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Unable to load leaderboard');
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  const filteredLeaderboard = leaderboard.filter((entry) => {
    if (!searchTerm) return true;
    return (
      entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.username && entry.username.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-theme-primary flex items-center gap-2">
            <Trophy className="w-6 h-6 text-brass" />
            <span>Learning Leaderboard</span>
          </h1>
          <p className="text-xs text-theme-muted">
            Official ranking grounded in verified lesson completions, passed assessments, and learning streaks.
          </p>
        </div>

        {currentUser && (
          <div className="flex items-center gap-3 bg-theme-surface border border-theme-border-strong px-4 py-2.5 rounded-xl shadow-xs">
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-theme-muted block">Your Rank</span>
              <span className="text-base font-black text-terracotta">
                #{currentUser.rank}
              </span>
            </div>
            <div className="h-6 w-px bg-theme-border" />
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-theme-muted block">Total XP</span>
              <span className="text-base font-black text-brass">
                {currentUser.totalXp}
              </span>
            </div>
            <div className="h-6 w-px bg-theme-border" />
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-theme-muted block">Streak</span>
              <span className="text-base font-black text-emerald-600 flex items-center justify-center gap-0.5">
                <Flame className="w-4 h-4 fill-emerald-500" />
                {currentUser.currentStreak}d
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Top 3 Podium Cards */}
      {!loading && leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Rank 2 */}
          <Card className="bg-theme-surface border-theme-border text-center order-2 sm:order-1 sm:mt-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 flex items-center justify-center font-bold text-lg mb-2 shadow-xs">
              2
            </div>
            <h3 className="font-bold text-theme-primary text-sm truncate">{leaderboard[1].name}</h3>
            {leaderboard[1].username && (
              <p className="text-[11px] text-theme-muted font-mono">@{leaderboard[1].username}</p>
            )}
            <div className="mt-3 flex items-center justify-center gap-3 text-xs">
              <span className="font-bold text-brass">{leaderboard[1].totalXp} XP</span>
              <span className="text-theme-muted">•</span>
              <span className="font-bold text-emerald-600 flex items-center gap-0.5">
                <Flame className="w-3.5 h-3.5 fill-emerald-500" /> {leaderboard[1].currentStreak}d
              </span>
            </div>
          </Card>

          {/* Rank 1 (Gold) */}
          <Card className="bg-gradient-to-b from-brass/15 to-theme-surface border-2 border-brass text-center order-1 sm:order-2 shadow-lg">
            <div className="w-14 h-14 mx-auto rounded-full bg-brass text-white flex items-center justify-center font-black text-xl mb-2 shadow-md">
              👑
            </div>
            <h3 className="font-extrabold text-theme-primary text-base truncate">{leaderboard[0].name}</h3>
            {leaderboard[0].username && (
              <p className="text-xs text-brass font-mono font-bold">@{leaderboard[0].username}</p>
            )}
            <div className="mt-3 flex items-center justify-center gap-3 text-sm">
              <span className="font-black text-brass">{leaderboard[0].totalXp} XP</span>
              <span className="text-theme-muted">•</span>
              <span className="font-bold text-emerald-600 flex items-center gap-0.5">
                <Flame className="w-4 h-4 fill-emerald-500" /> {leaderboard[0].currentStreak}d
              </span>
            </div>
          </Card>

          {/* Rank 3 */}
          <Card className="bg-theme-surface border-theme-border text-center order-3 sm:order-3 sm:mt-6">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-700/20 text-amber-700 flex items-center justify-center font-bold text-lg mb-2 shadow-xs">
              3
            </div>
            <h3 className="font-bold text-theme-primary text-sm truncate">{leaderboard[2].name}</h3>
            {leaderboard[2].username && (
              <p className="text-[11px] text-theme-muted font-mono">@{leaderboard[2].username}</p>
            )}
            <div className="mt-3 flex items-center justify-center gap-3 text-xs">
              <span className="font-bold text-brass">{leaderboard[2].totalXp} XP</span>
              <span className="text-theme-muted">•</span>
              <span className="font-bold text-emerald-600 flex items-center gap-0.5">
                <Flame className="w-3.5 h-3.5 fill-emerald-500" /> {leaderboard[2].currentStreak}d
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* Main Table */}
      <Card
        title="Global Leaderboard Rankings"
        subtitle="Ranked dynamically by verified XP points and consecutive streak days"
        action={
          <div className="relative w-48 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-theme-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search learner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-theme-border bg-theme-surface text-theme-primary text-xs focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </div>
        }
      >
        {loading ? (
          <div className="py-12 text-center text-xs text-theme-muted">
            Calculating authentic learning rankings...
          </div>
        ) : error ? (
          <div className="py-8 text-center text-xs text-rose-500">
            {error}
          </div>
        ) : filteredLeaderboard.length === 0 ? (
          <div className="py-12 text-center text-xs text-theme-muted">
            No learners found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-theme-border text-theme-muted font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Rank</th>
                  <th className="py-3 px-3">Learner</th>
                  <th className="py-3 px-3 text-center">Lessons</th>
                  <th className="py-3 px-3 text-center">Quizzes</th>
                  <th className="py-3 px-3 text-center">Streak</th>
                  <th className="py-3 px-3 text-right">Total XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/50">
                {filteredLeaderboard.map((learner) => (
                  <tr
                    key={learner.userId || learner.rank}
                    className={`transition-colors ${
                      learner.isCurrentUser
                        ? 'bg-terracotta/10 font-bold'
                        : 'hover:bg-theme-subtle/50'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-bold text-xs ${
                          learner.rank === 1
                            ? 'bg-brass text-white'
                            : learner.rank === 2
                            ? 'bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-white'
                            : learner.rank === 3
                            ? 'bg-amber-700/30 text-amber-800 dark:text-amber-200'
                            : 'text-theme-muted'
                        }`}
                      >
                        {learner.rank}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-terracotta text-white flex items-center justify-center font-bold text-xs">
                          {learner.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-theme-primary flex items-center gap-1.5">
                            <span>{learner.name}</span>
                            {learner.isCurrentUser && (
                              <span className="text-[9px] bg-terracotta text-white px-1.5 py-0.2 rounded font-bold uppercase">
                                You
                              </span>
                            )}
                          </div>
                          {learner.username && (
                            <span className="text-[10px] text-theme-muted font-mono block">
                              @{learner.username}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center text-theme-primary font-medium">
                      {learner.completedLessonsCount}
                    </td>
                    <td className="py-3 px-3 text-center text-theme-primary font-medium">
                      {learner.passedQuizzesCount}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-0.5 text-emerald-600 font-bold">
                        <Flame className="w-3.5 h-3.5 fill-emerald-500" />
                        {learner.currentStreak}d
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-black text-brass text-sm">
                      {learner.totalXp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default LeaderboardPage;
