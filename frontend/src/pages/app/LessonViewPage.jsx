import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { EmptyState } from '../../components/common/EmptyState';
import { PdfReaderModal } from '../../components/learning/PdfReaderModal';
import { MarkdownRenderer } from '../../components/learning/MarkdownRenderer';
import api from '../../services/api';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  BookOpen,
  FileText,
  Clock,
  Bookmark,
  Share2,
  Check,
  AlertCircle,
  Eye,
  ListOrdered,
  Sparkles,
  Layers,
  BookMarked,
  GraduationCap,
  HelpCircle
} from 'lucide-react';

export function LessonViewPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');
  const initialLessonParam = searchParams.get('lessonIdx');

  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentLessonIdx, setCurrentLessonIdx] = useState(
    initialLessonParam ? parseInt(initialLessonParam, 10) : 0
  );
  const [completing, setCompleting] = useState(false);

  // Practice Quiz Generation State
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizDifficulty, setQuizDifficulty] = useState('Beginner');
  const [questionCount, setQuestionCount] = useState(3);
  const [generateError, setGenerateError] = useState(null);

  // PDF In-App Reader State
  const [activePdfModal, setActivePdfModal] = useState({
    isOpen: false,
    materialId: null,
    title: '',
  });

  // Reading position persistence key
  const readingPosKey = courseId ? `finlearn_read_pos_${courseId}` : null;
  const contentAreaRef = useRef(null);

  const fetchCourse = useCallback(async () => {
    if (!courseId) {
      setError('No book specified in reading query.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/learning/courses/${courseId}`);
      if (res && res.data) {
        setCourseData(res.data);

        // Restore saved reading chapter if no query param was provided
        if (!initialLessonParam && readingPosKey) {
          const savedIdx = localStorage.getItem(readingPosKey);
          if (savedIdx !== null) {
            const parsed = parseInt(savedIdx, 10);
            if (!isNaN(parsed) && parsed >= 0 && parsed < (res.data.lessons?.length || 0)) {
              setCurrentLessonIdx(parsed);
            }
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load textbook volume');
    } finally {
      setLoading(false);
    }
  }, [courseId, initialLessonParam, readingPosKey]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  // Persist current reading chapter position
  useEffect(() => {
    if (readingPosKey && currentLessonIdx >= 0) {
      localStorage.setItem(readingPosKey, currentLessonIdx.toString());
    }
    // Smoothly scroll content canvas to top when switching chapters
    if (contentAreaRef.current) {
      contentAreaRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentLessonIdx, readingPosKey]);

  const course = courseData?.course;
  const lessons = courseData?.lessons || [];
  const materials = courseData?.materials || [];
  const currentLesson = lessons[currentLessonIdx];

  const handleCompleteLesson = async () => {
    if (!currentLesson) return;
    try {
      setCompleting(true);
      await api.post(`/learning/lessons/${currentLesson.id}/progress`);
      // Update local completed state
      const updatedLessons = [...lessons];
      updatedLessons[currentLessonIdx] = { ...currentLesson, isCompleted: true };
      setCourseData({ ...courseData, lessons: updatedLessons });
    } catch (err) {
      alert(err.message || 'Failed to record progress');
    } finally {
      setCompleting(false);
    }
  };

  const handleGeneratePracticeQuiz = async () => {
    if (!courseId || generatingQuiz) return;
    try {
      setGeneratingQuiz(true);
      setGenerateError(null);

      const res = await api.post('/assessment/quizzes/generate-practice', {
        courseId,
        difficulty: quizDifficulty,
        questionCount,
      });

      if (res && res.data && res.data.quizId) {
        navigate(`/quiz?id=${res.data.quizId}`);
      }
    } catch (err) {
      setGenerateError(err.message || 'Failed to generate practice quiz. Please try again.');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleNext = () => {
    if (currentLessonIdx < lessons.length - 1) {
      const nextIdx = currentLessonIdx + 1;
      setCurrentLessonIdx(nextIdx);
    }
  };

  const handlePrev = () => {
    if (currentLessonIdx > 0) {
      const prevIdx = currentLessonIdx - 1;
      setCurrentLessonIdx(prevIdx);
    }
  };

  const openPdfReader = (material) => {
    setActivePdfModal({
      isOpen: true,
      materialId: material.id,
      title: material.title,
    });
  };

  if (loading) {
    return <Loading message="Opening book volume & chapters..." />;
  }

  if (error || !course) {
    return (
      <Card className="p-8 text-center bg-rose-50 border-rose-200">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-rose-800">Error Opening Book</h3>
        <p className="text-xs text-rose-600 mt-1">{error || 'Textbook volume not found'}</p>
        <Link to="/learning" className="inline-block mt-4">
          <Button variant="secondary" size="sm" icon={ArrowLeft}>
            Return to Library
          </Button>
        </Link>
      </Card>
    );
  }

  const completedCount = lessons.filter((l) => l.isCompleted).length;
  const progressPct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Breadcrumb & Library Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-brass/20">
        <div className="flex items-center gap-3">
          <Link to="/learning">
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowLeft}
              className="text-aubergine/80 hover:text-aubergine font-bold"
            >
              Library Bookshelf
            </Button>
          </Link>
          <span className="text-brass/40 hidden sm:inline">•</span>
          <div className="hidden sm:flex items-center gap-2 text-xs text-aubergine/70">
            <Badge variant="brass" size="sm">{course.category}</Badge>
            <span className="font-semibold text-aubergine truncate max-w-xs">{course.title}</span>
          </div>
        </div>

        {/* Reading progress badge */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="text-right text-xs">
            <span className="text-aubergine/60 text-[11px] block">Volume Progress</span>
            <span className="font-bold font-mono text-terracotta">
              {completedCount} of {lessons.length} Chapters ({progressPct}%)
            </span>
          </div>
          <div className="w-16 h-2 rounded-full bg-ivory-dark overflow-hidden border border-brass/20">
            <div
              className="h-full bg-terracotta rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {lessons.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Published Chapters in this Book"
          description="The curriculum editorial team has published this title but chapters are undergoing final verification."
          actionLabel="Back to Library"
          onAction={() => window.history.back()}
        />
      ) : (
        /* Textbook Reading Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Table of Contents / Chapter Index (4 Cols on lg) */}
          <aside className="lg:col-span-4 space-y-5">
            {/* Book Spine Info Card */}
            <div className="rounded-2xl p-5 bg-gradient-to-br from-aubergine via-[#3A203C] to-aubergine text-ivory border border-brass/30 shadow-md">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-terracotta flex items-center justify-center font-bold text-white shadow-xs shrink-0">
                  <BookMarked className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-ivory leading-tight">
                    {course.title}
                  </h2>
                  <p className="text-[11px] text-brass-light mt-1">
                    {course.difficulty} Level • {course.language === 'hi' ? 'हिंदी' : 'English Edition'}
                  </p>
                </div>
              </div>

              {course.description && (
                <p className="text-xs text-ivory/70 mt-3 pt-3 border-t border-brass/20 leading-relaxed line-clamp-3">
                  {course.description}
                </p>
              )}
            </div>

            {/* Chapter Outline List */}
            <div className="rounded-2xl bg-white/95 border border-brass/25 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-brass/15 bg-ivory/50 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-aubergine flex items-center gap-1.5">
                  <ListOrdered className="w-4 h-4 text-terracotta" />
                  Table of Contents
                </span>
                <span className="text-[11px] font-mono text-aubergine/60">
                  {lessons.length} Chapters
                </span>
              </div>

              <div className="divide-y divide-brass/10 max-h-[460px] overflow-y-auto">
                {lessons.map((lesson, idx) => {
                  const isCurrent = idx === currentLessonIdx;
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => setCurrentLessonIdx(idx)}
                      className={`w-full text-left p-3.5 text-xs flex items-center justify-between transition-all group ${
                        isCurrent
                          ? 'bg-aubergine text-ivory font-bold shadow-xs'
                          : 'text-aubergine/80 hover:bg-ivory hover:text-aubergine font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 ${
                            isCurrent
                              ? 'bg-terracotta text-white'
                              : 'bg-ivory-dark text-aubergine/70 group-hover:bg-brass/20'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="truncate">{lesson.title}</span>
                      </div>

                      {lesson.isCompleted ? (
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 ${
                            isCurrent ? 'text-emerald-400' : 'text-emerald-600'
                          }`}
                          title="Completed Chapter"
                        />
                      ) : (
                        <span
                          className={`text-[10px] font-mono ${
                            isCurrent ? 'text-ivory/60' : 'text-aubergine/40'
                          }`}
                        >
                          {lesson.durationMinutes || 5}m
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reference Materials / Integrated Reader Trigger Cards */}
            {materials.length > 0 && (
              <div className="rounded-2xl bg-white/95 border border-brass/25 shadow-xs p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-aubergine flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-terracotta" />
                    Integrated Reference Guides
                  </h4>
                  <Badge variant="terracotta" size="sm">In-App PDF</Badge>
                </div>

                <div className="space-y-2">
                  {materials.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => openPdfReader(m)}
                      className="w-full text-left p-3 rounded-xl border border-brass/20 bg-ivory/40 hover:bg-ivory hover:border-brass/40 flex items-center justify-between transition-all group shadow-2xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-aubergine truncate group-hover:text-terracotta transition-colors">
                          {m.title}
                        </p>
                        <p className="text-[10px] text-aubergine/60 mt-0.5">
                          Verified Document • Read inside FinLearn
                        </p>
                      </div>

                      <div className="px-2.5 py-1 rounded-lg bg-terracotta/10 group-hover:bg-terracotta group-hover:text-white text-terracotta text-[11px] font-bold flex items-center gap-1 transition-colors shrink-0">
                        <Eye className="w-3 h-3" />
                        <span>Read</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Right Main Textbook Reader Canvas (8 Cols on lg) */}
          <main className="lg:col-span-8 space-y-6">
            <article
              ref={contentAreaRef}
              className="rounded-3xl bg-[#FFFDF9] border border-brass/25 shadow-sm p-6 sm:p-10 lg:p-12 relative"
            >
              {/* Paper / Textbook Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-brass/20 gap-4 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] uppercase font-bold tracking-widest text-terracotta">
                      Chapter {currentLessonIdx + 1} of {lessons.length}
                    </span>
                    <span className="text-brass/40">•</span>
                    <span className="text-[11px] text-aubergine/60 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {currentLesson?.durationMinutes || 5} min read
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-aubergine tracking-tight">
                    {currentLesson?.title}
                  </h1>
                </div>

                {currentLesson?.isCompleted && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 self-start sm:self-auto shrink-0 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Completed Chapter</span>
                  </div>
                )}
              </div>

              {/* Textbook Chapter Body Typography with Safe Markdown Rendering */}
              <div className="text-aubergine/90 max-w-prose">
                {currentLesson?.content ? (
                  <MarkdownRenderer content={currentLesson.content} />
                ) : (
                  <p className="italic text-aubergine/60 py-6">
                    Content for this textbook chapter is being compiled from verified financial sources.
                  </p>
                )}
              </div>

              {/* Source citations note if provided */}
              {currentLesson?.sourceCitations && currentLesson.sourceCitations.length > 0 && (
                <div className="mt-10 p-4 rounded-xl bg-ivory border border-brass/20 text-xs text-aubergine/70">
                  <span className="font-bold block text-aubergine mb-1">
                    Verified References & Citations:
                  </span>
                  <ul className="list-disc pl-4 space-y-1">
                    {currentLesson.sourceCitations.map((cite, cIdx) => (
                      <li key={cIdx}>{cite}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Lesson Completion Action Bar (Placed at Bottom after all Content) */}
              <div className="mt-12 pt-8 border-t border-brass/25 bg-ivory/40 rounded-2xl p-6 border border-brass/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-aubergine flex items-center gap-2">
                    {currentLesson?.isCompleted ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Chapter Finished & Recorded</span>
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-4 h-4 text-terracotta" />
                        <span>Finished Reading this Chapter?</span>
                      </>
                    )}
                  </h4>
                  <p className="text-xs text-aubergine/60">
                    {currentLesson?.isCompleted
                      ? 'Your reading progress and completion XP have been safely saved to your profile.'
                      : 'Mark this chapter complete to track your textbook progress and unlock assessment XP.'}
                  </p>
                </div>

                <div className="shrink-0">
                  <Button
                    variant={currentLesson?.isCompleted ? 'secondary' : 'primary'}
                    size="md"
                    icon={CheckCircle2}
                    loading={completing}
                    onClick={handleCompleteLesson}
                    disabled={currentLesson?.isCompleted || completing}
                    className="font-bold shadow-xs w-full sm:w-auto justify-center"
                  >
                    {currentLesson?.isCompleted ? 'Completed' : 'Mark as Complete'}
                  </Button>
                </div>
              </div>

              {/* Module-Completion AI Practice Quiz Generation Action */}
              {progressPct === 100 && lessons.length > 0 && (
                <div className="mt-8 rounded-2xl p-6 bg-gradient-to-br from-[#301A33] via-aubergine to-[#231226] text-ivory border border-brass/30 shadow-lg space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-terracotta text-white flex items-center justify-center shadow-xs">
                        <Sparkles className="w-5 h-5 text-amber-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-ivory">
                            Generate AI Practice Quiz
                          </h4>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Module Completed
                          </span>
                        </div>
                        <p className="text-xs text-ivory/70 mt-0.5">
                          Create an instant practice assessment tailored directly to the chapters in "{course.title}".
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] font-medium text-brass-light bg-black/20 px-2.5 py-1 rounded-lg border border-brass/20 self-start sm:self-auto">
                      Ungraded Practice Quiz (Not an Exam)
                    </span>
                  </div>

                  {/* Quiz Configuration Controls */}
                  <div className="pt-3 border-t border-brass/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <label htmlFor="practice-difficulty" className="text-ivory/80 font-medium">Difficulty:</label>
                        <select
                          id="practice-difficulty"
                          value={quizDifficulty}
                          onChange={(e) => setQuizDifficulty(e.target.value)}
                          className="bg-aubergine-dark border border-brass/30 rounded-lg px-2.5 py-1 text-xs text-ivory focus:outline-none focus:ring-1 focus:ring-terracotta"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <label htmlFor="practice-question-count" className="text-ivory/80 font-medium">Questions:</label>
                        <select
                          id="practice-question-count"
                          value={questionCount}
                          onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
                          className="bg-aubergine-dark border border-brass/30 rounded-lg px-2.5 py-1 text-xs text-ivory focus:outline-none focus:ring-1 focus:ring-terracotta"
                        >
                          <option value={3}>3 Questions</option>
                          <option value={5}>5 Questions</option>
                        </select>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Button
                        id="generate-practice-quiz-btn"
                        variant="primary"
                        size="md"
                        icon={GraduationCap}
                        loading={generatingQuiz}
                        disabled={generatingQuiz}
                        onClick={handleGeneratePracticeQuiz}
                        className="w-full sm:w-auto font-bold shadow-md bg-terracotta hover:bg-terracotta-hover border-brass/30"
                      >
                        {generatingQuiz ? 'Synthesizing Questions...' : 'Generate Practice Quiz'}
                      </Button>
                    </div>
                  </div>

                  {generateError && (
                    <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{generateError}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleGeneratePracticeQuiz}
                        className="text-xs text-rose-300 hover:text-white"
                      >
                        Retry
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Next / Previous Chapter Navigation */}
              <div className="flex items-center justify-between pt-8 border-t border-brass/20 mt-8">
                <Button
                  variant="secondary"
                  size="md"
                  icon={ChevronLeft}
                  disabled={currentLessonIdx === 0}
                  onClick={handlePrev}
                  className="font-semibold"
                >
                  Previous Chapter
                </Button>

                <div className="hidden sm:block text-xs font-mono text-aubergine/50">
                  Chapter {currentLessonIdx + 1} of {lessons.length}
                </div>

                <Button
                  variant="primary"
                  size="md"
                  icon={ChevronRight}
                  disabled={currentLessonIdx === lessons.length - 1}
                  onClick={handleNext}
                  className="font-bold"
                >
                  Next Chapter
                </Button>
              </div>
            </article>
          </main>
        </div>
      )}

      {/* Integrated In-App PDF Reader Modal */}
      <PdfReaderModal
        isOpen={activePdfModal.isOpen}
        onClose={() => setActivePdfModal({ isOpen: false, materialId: null, title: '' })}
        materialId={activePdfModal.materialId}
        title={activePdfModal.title}
      />
    </div>
  );
}

export default LessonViewPage;
