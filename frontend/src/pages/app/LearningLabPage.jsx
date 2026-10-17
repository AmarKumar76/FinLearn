import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { EmptyState } from '../../components/common/EmptyState';
import api from '../../services/api';
import {
  BookOpen,
  GraduationCap,
  Bookmark,
  Sparkles,
  Search,
  AlertCircle,
  FileText,
  Clock,
  Layers,
  CheckCircle2,
  Library,
  Compass,
  ArrowRight
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Budgeting',
  'Savings & Emergency Funds',
  'Loans & EMI',
  'Banking & Digital Safety',
  'Investments',
  'Insurance Basics',
  'Financial Scams',
];

// Curated book spines and themes matching the FinLearn brand palette
const BOOK_COVER_THEMES = [
  {
    bgGradient: 'from-[#321D35] via-[#432348] to-[#251328]',
    spineColor: 'bg-[#B88C56]',
    accentColor: '#D15C40',
    tag: 'border-[#B88C56]/40 text-[#FAF5EB]',
  },
  {
    bgGradient: 'from-[#2F1B32] via-[#52293E] to-[#3B192D]',
    spineColor: 'bg-[#D15C40]',
    accentColor: '#B88C56',
    tag: 'border-[#D7C5D8]/40 text-[#FAF5EB]',
  },
  {
    bgGradient: 'from-[#3A223E] via-[#2D1630] to-[#200F23]',
    spineColor: 'bg-[#8F6A38]',
    accentColor: '#E27D60',
    tag: 'border-[#B88C56]/40 text-[#FAF5EB]',
  },
  {
    bgGradient: 'from-[#28172B] via-[#472238] to-[#2D1630]',
    spineColor: 'bg-[#D7C5D8]',
    accentColor: '#D15C40',
    tag: 'border-[#B88C56]/40 text-[#FAF5EB]',
  },
];

export function LearningLabPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [search, setSearch] = useState('');

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams();
      if (categoryFilter !== 'All') queryParams.append('category', categoryFilter);
      if (search.trim()) queryParams.append('search', search.trim());

      const res = await api.get(`/learning/courses?${queryParams.toString()}`);
      setCourses(res?.data?.courses || []);
    } catch (err) {
      setError(err.message || 'Failed to load library collection');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, search]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Total statistics across published catalog
  const totalBooks = courses.length;
  const completedBooks = courses.filter((c) => c.progressPct === 100).length;
  const inProgressBooks = courses.filter(
    (c) => c.progressPct > 0 && c.progressPct < 100
  ).length;

  return (
    <div className="space-y-8 pb-16">
      {/* Library Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-aubergine via-[#3E2242] to-aubergine text-ivory p-6 sm:p-10 border border-brass/30 shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-brass/15 to-transparent pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-terracotta/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-brass/30 backdrop-blur-md text-xs font-semibold text-brass-light">
              <Library className="w-3.5 h-3.5 text-terracotta" />
              <span>FinLearn Digital Library & Reading Lab</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-ivory tracking-tight">
              Curated Financial Literacy Bookshelf
            </h1>

            <p className="text-xs sm:text-sm text-ivory/80 leading-relaxed max-w-xl">
              Immerse yourself in structured textbook volumes, verified regulatory guides, and interactive chapters. Read online, study integrated reference PDFs, and track your reading journey chapter by chapter.
            </p>

            {/* Quick stats shelf */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-terracotta" />
                <span className="text-ivory/70">Library Titles:</span>
                <span className="font-bold text-ivory">{totalBooks}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-ivory/70">In Progress:</span>
                <span className="font-bold text-ivory">{inProgressBooks}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-ivory/70">Completed:</span>
                <span className="font-bold text-ivory">{completedBooks}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Button
              id="assess-mastery-btn"
              variant="outline"
              size="md"
              icon={GraduationCap}
              onClick={() => navigate('/quiz')}
              className="w-full sm:w-auto bg-white/10 text-ivory border-brass/40 hover:bg-white/20"
            >
              Assess Mastery (Quiz)
            </Button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bookshelf Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-brass/25 shadow-xs">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                categoryFilter === cat
                  ? 'bg-terracotta text-white shadow-xs'
                  : 'bg-ivory text-aubergine/75 hover:bg-lilac/30 hover:text-aubergine'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-aubergine/40 absolute left-3.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search book titles or concepts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-brass/30 bg-ivory text-aubergine placeholder:text-aubergine/40 focus:outline-none focus:ring-2 focus:ring-terracotta transition-shadow"
          />
        </div>
      </div>

      {/* Content Bookshelf Presentation */}
      {loading ? (
        <Loading message="Browsing authenticated digital library bookshelf..." />
      ) : error ? (
        <Card className="p-8 text-center bg-rose-50 border-rose-200">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-rose-800">Error Loading Library Collection</h3>
          <p className="text-xs text-rose-600 mt-1">{error}</p>
          <Button variant="secondary" size="sm" onClick={fetchCourses} className="mt-4">
            Try Again
          </Button>
        </Card>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Published Titles Found in Library"
          description={
            categoryFilter !== 'All' || search.trim()
              ? 'No books match your selected category or query. Try resetting your search filter.'
              : 'Our editorial board is actively preparing textbook volumes. Check back shortly!'
          }
          actionLabel="Clear Filter & Show All"
          onAction={() => {
            setCategoryFilter('All');
            setSearch('');
          }}
        />
      ) : (
        /* Digital Book Collection Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course, index) => {
            const isCompleted = course.progressPct === 100;
            const hasStarted = course.completedLessons > 0 && !isCompleted;
            const theme = BOOK_COVER_THEMES[index % BOOK_COVER_THEMES.length];

            return (
              <div
                key={course.id}
                className="group relative flex flex-col rounded-2xl bg-white/95 border border-brass/25 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                {/* Book Header / Hardcover Binding Visual */}
                <div
                  className={`relative p-6 bg-gradient-to-br ${theme.bgGradient} text-ivory min-h-[170px] flex flex-col justify-between overflow-hidden`}
                >
                  {/* Faux embossed spine stripe */}
                  <div
                    className={`absolute top-0 bottom-0 left-0 w-3.5 ${theme.spineColor} shadow-inner opacity-90`}
                  />
                  <div className="absolute top-0 bottom-0 left-3.5 w-1 bg-black/20" />

                  {/* Corner bookmark visual indicator */}
                  <div className="flex items-start justify-between gap-2 pl-3">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${theme.tag} bg-black/20 backdrop-blur-xs`}
                    >
                      {course.category}
                    </span>

                    <span className="text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded bg-white/15 text-ivory/90 backdrop-blur-xs">
                      {course.difficulty}
                    </span>
                  </div>

                  {/* Book Title & Embossed Aesthetic */}
                  <div className="pl-3 mt-4 space-y-1">
                    <h3 className="text-lg font-black text-ivory tracking-tight group-hover:text-brass-light transition-colors line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-[11px] text-ivory/70 font-serif italic line-clamp-1">
                      FinLearn Educational Volume • {course.language === 'hi' ? 'हिंदी' : 'English Edition'}
                    </p>
                  </div>

                  {/* Corner Accent Pattern */}
                  <div className="absolute right-3 bottom-3 opacity-15 pointer-events-none">
                    <BookOpen className="w-16 h-16 text-white" />
                  </div>
                </div>

                {/* Book Details & Meta Section */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-5 bg-white">
                  {/* Synopsis */}
                  <p className="text-xs text-aubergine/75 line-clamp-3 leading-relaxed">
                    {course.description || 'Comprehensive financial education module covering practical principles and verified real-world scenarios.'}
                  </p>

                  <div className="space-y-4 pt-4 border-t border-brass/15">
                    {/* Chapter & Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-aubergine/80">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-brass" />
                          <span>{course.totalLessons || 0} Chapters</span>
                        </span>

                        <span className="font-mono text-terracotta font-bold">
                          {course.progressPct || 0}% Read
                        </span>
                      </div>

                      {/* Progress meter */}
                      <div className="w-full h-2 rounded-full bg-ivory-dark overflow-hidden border border-brass/15">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted ? 'bg-emerald-600' : 'bg-terracotta'
                          }`}
                          style={{ width: `${course.progressPct || 0}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-aubergine/60 pt-0.5">
                        <span>
                          {course.completedLessons || 0} of {course.totalLessons || 0} chapters finished
                        </span>
                        {isCompleted && (
                          <span className="flex items-center gap-1 text-emerald-600 font-bold">
                            <CheckCircle2 className="w-3 h-3" /> Completed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Book Action Button */}
                    <Link
                      to={`/lesson?courseId=${course.id}`}
                      className="block pt-1"
                    >
                      <Button
                        variant={isCompleted ? 'outline' : hasStarted ? 'primary' : 'primary'}
                        size="md"
                        icon={ArrowRight}
                        className="w-full justify-center group-hover:scale-[1.01] transition-transform font-bold"
                      >
                        {isCompleted
                          ? 'Re-read Book'
                          : hasStarted
                          ? 'Continue Reading'
                          : 'Read Book'}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LearningLabPage;
