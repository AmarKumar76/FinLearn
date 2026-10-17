import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { EmptyState } from '../../components/common/EmptyState';
import api from '../../services/api';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Flame,
  Check,
  AlertCircle,
  BookOpen
} from 'lucide-react';

export function QuizPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const quizIdParam = searchParams.get('id');

  // Quizzes list state (if no specific quiz selected)
  const [quizzes, setQuizzes] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState(null);

  // Active quiz state
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizError, setQuizError] = useState(null);

  // Gamification profile state
  const [gameProfile, setGameProfile] = useState(null);
  const [badges, setBadges] = useState([]);

  // Learner attempt interaction state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  // Fetch gamification profile
  const fetchGamification = useCallback(async () => {
    try {
      const res = await api.get('/assessment/gamification/profile');
      if (res && res.data) {
        setGameProfile(res.data.profile);
        setBadges(res.data.badges || []);
      }
    } catch {
      // Non-critical background load
    }
  }, []);

  // Fetch all published quizzes
  const fetchQuizzes = useCallback(async () => {
    try {
      setLoadingList(true);
      setListError(null);
      const res = await api.get('/assessment/quizzes');
      setQuizzes(res?.data?.quizzes || []);
    } catch (err) {
      setListError(err.message || 'Failed to load assessments');
    } finally {
      setLoadingList(false);
    }
  }, []);

  // Fetch specific quiz details
  const fetchQuizDetails = useCallback(async (id) => {
    try {
      setLoadingQuiz(true);
      setQuizError(null);
      setSelectedAnswers({});
      setSubmitResult(null);
      setCurrentIdx(0);

      const res = await api.get(`/assessment/quizzes/${id}`);
      if (res && res.data) {
        setActiveQuiz(res.data.quiz);
      }
    } catch (err) {
      setQuizError(err.message || 'Failed to load quiz');
    } finally {
      setLoadingQuiz(false);
    }
  }, []);

  useEffect(() => {
    fetchGamification();
  }, [fetchGamification]);

  useEffect(() => {
    if (quizIdParam) {
      fetchQuizDetails(quizIdParam);
    } else {
      setActiveQuiz(null);
      fetchQuizzes();
    }
  }, [quizIdParam, fetchQuizDetails, fetchQuizzes]);

  // Handle learner selecting an answer option
  const handleSelectOption = (questionId, optionIdx) => {
    if (submitResult) return; // Locked after submission
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const handleNext = () => {
    if (!activeQuiz?.questions) return;
    if (currentIdx < activeQuiz.questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  // Submit attempt payload to server for authoritative grading
  const handleSubmitAttempt = async () => {
    if (!activeQuiz) return;
    try {
      setSubmitting(true);
      const answersPayload = activeQuiz.questions.map((q) => {
        const qId = q._id || q.id;
        return {
          questionId: qId,
          selectedOptionIndex:
            selectedAnswers[qId] !== undefined ? selectedAnswers[qId] : -1,
        };
      });

      const res = await api.post(`/assessment/quizzes/${activeQuiz.id || activeQuiz._id}/submit`, {
        answers: answersPayload,
      });

      if (res && res.data) {
        setSubmitResult(res.data);
        fetchGamification(); // Refresh XP & streaks
      }
    } catch (err) {
      alert(err.message || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setSubmitResult(null);
    setCurrentIdx(0);
  };

  // VIEW 1: Quiz Catalogue & Gamification Showcase
  if (!quizIdParam || !activeQuiz) {
    return (
      <div className="space-y-8 pb-16 max-w-5xl mx-auto">
        {/* Top Gamification Header Banner */}
        <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-aubergine via-[#3F2244] to-aubergine text-ivory border border-brass/30 shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-brass/30 text-xs font-semibold text-brass-light mb-2">
                <Award className="w-3.5 h-3.5 text-terracotta" />
                <span>Financial Literacy Assessments</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-ivory">
                Assessment Arena & Mastery Badges
              </h1>
              <p className="text-xs sm:text-sm text-ivory/80 mt-1 max-w-xl leading-relaxed">
                Test your financial knowledge on regulatory topics, budgeting, loans, and investment principles. Earn verified XP and unlock digital achievements.
              </p>
            </div>

            {/* Learner Stats Widget */}
            <div className="flex items-center gap-4 bg-aubergine-dark/80 p-4 rounded-2xl border border-brass/25 shrink-0">
              <div className="text-center px-3 border-r border-brass/20">
                <span className="text-[10px] uppercase font-bold text-brass-light block">Total XP</span>
                <span className="text-lg font-black text-ivory font-mono flex items-center justify-center gap-1">
                  <Zap className="w-4 h-4 text-amber-400" />
                  {gameProfile?.totalXp || 0}
                </span>
              </div>
              <div className="text-center px-3 border-r border-brass/20">
                <span className="text-[10px] uppercase font-bold text-brass-light block">Streak</span>
                <span className="text-lg font-black text-ivory font-mono flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4 text-terracotta" />
                  {gameProfile?.currentStreak || 0}d
                </span>
              </div>
              <div className="text-center px-3">
                <span className="text-[10px] uppercase font-bold text-brass-light block">Badges</span>
                <span className="text-lg font-black text-ivory font-mono flex items-center justify-center gap-1">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  {gameProfile?.earnedBadges?.length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Badges Carousel / Showcase */}
        {badges.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-aubergine/70 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-terracotta" />
              Achievements & Badges
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {badges.map((b) => (
                <div
                  key={b.id}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                    b.isEarned
                      ? 'bg-white border-brass/40 shadow-xs'
                      : 'bg-ivory/50 border-brass/15 opacity-50 grayscale'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 shadow-2xs ${
                      b.isEarned ? 'bg-terracotta text-white' : 'bg-aubergine/10 text-aubergine/40'
                    }`}
                  >
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-aubergine block leading-tight">
                    {b.title}
                  </span>
                  <span className="text-[9px] text-aubergine/60 block mt-0.5 line-clamp-2">
                    {b.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quiz Catalog Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-aubergine">
              Available Assessments
            </h2>
            <span className="text-xs font-mono text-aubergine/60">
              {quizzes.length} Quizzes Available
            </span>
          </div>

          {loadingList ? (
            <Loading message="Loading published quizzes..." />
          ) : listError ? (
            <Card className="p-8 text-center bg-rose-50 border-rose-200">
              <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-rose-800">Error Loading Quizzes</h3>
              <p className="text-xs text-rose-600 mt-1">{listError}</p>
            </Card>
          ) : quizzes.length === 0 ? (
            <EmptyState
              icon={HelpCircle}
              title="No Published Quizzes Yet"
              description="Our curriculum team is preparing assessments. Check back shortly or continue reading learning lessons."
              actionLabel="Go to Learning Lab"
              onAction={() => (window.location.href = '/learning')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quizzes.map((q) => {
                const qId = q.id || q._id;
                return (
                  <Card
                    key={qId}
                    className="p-6 bg-white/95 border-brass/25 hover:border-brass/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <Badge variant="terracotta" size="sm">{q.category}</Badge>
                        <Badge variant="neutral" size="sm">{q.difficulty}</Badge>
                      </div>

                      <h3 className="text-base font-bold text-aubergine mb-1">
                        {q.title}
                      </h3>
                      <p className="text-xs text-aubergine/70 line-clamp-2 mb-4 leading-relaxed">
                        {q.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-brass/15 flex items-center justify-between">
                      <div className="text-xs">
                        <span className="text-aubergine/60 block text-[10px]">Questions</span>
                        <span className="font-bold text-aubergine font-mono">
                          {q.questionsCount || 0} Questions
                        </span>
                      </div>

                      <div className="text-xs">
                        <span className="text-aubergine/60 block text-[10px]">Pass Mark</span>
                        <span className="font-bold text-terracotta font-mono">
                          {q.passingScorePercent || 60}%
                        </span>
                      </div>

                      <Button
                        variant={q.hasPassed ? 'secondary' : 'primary'}
                        size="sm"
                        icon={ArrowRight}
                        onClick={() => setSearchParams({ id: qId })}
                      >
                        {q.hasPassed ? 'Retake Quiz' : q.attemptsCount > 0 ? 'Retry' : 'Start Assessment'}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // VIEW 2: Active Quiz Taking / Evaluation Results
  if (loadingQuiz) {
    return <Loading message="Loading assessment questions..." />;
  }

  if (quizError || !activeQuiz) {
    return (
      <Card className="p-8 text-center bg-rose-50 border-rose-200 max-w-xl mx-auto">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-rose-800">Error Opening Assessment</h3>
        <p className="text-xs text-rose-600 mt-1">{quizError || 'Quiz not found'}</p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => setSearchParams({})}
        >
          Back to Quiz Arena
        </Button>
      </Card>
    );
  }

  const questions = activeQuiz.questions || [];
  const currentQ = questions[currentIdx];
  const currentQId = currentQ ? currentQ._id || currentQ.id : null;

  return (
    <div className="space-y-6 pb-16 max-w-3xl mx-auto">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-brass/20">
        <button
          onClick={() => setSearchParams({})}
          className="flex items-center gap-1.5 text-xs font-bold text-aubergine/70 hover:text-aubergine transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Assessment</span>
        </button>

        <div className="flex items-center gap-2">
          {activeQuiz.isPractice && (
            <Badge variant="terracotta" size="sm" className="font-bold">
              Practice Assessment
            </Badge>
          )}
          <Badge variant="brass" size="sm">{activeQuiz.category}</Badge>
          <span className="text-xs text-aubergine/60 font-mono">
            {questions.length} Questions
          </span>
        </div>
      </div>

      {/* EVALUATION RESULTS SCREEN (POST-SUBMISSION) */}
      {submitResult ? (
        <Card className="p-6 sm:p-8 bg-white/95 border-brass/30 space-y-6">
          <div className="text-center space-y-3 pb-6 border-b border-brass/20">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-md ${
                submitResult.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
              }`}
            >
              {submitResult.passed ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
            </div>

            <h2 className="text-2xl font-black text-aubergine">
              {submitResult.passed ? 'Assessment Passed!' : 'Assessment Incomplete'}
            </h2>

            <p className="text-xs text-aubergine/70 max-w-md mx-auto">
              {submitResult.passed
                ? `Congratulations! You scored ${submitResult.scorePercentage}% which meets the ${submitResult.passingScorePercent}% passing threshold.`
                : `You scored ${submitResult.scorePercentage}%. The passing threshold is ${submitResult.passingScorePercent}%. Review the explanations below and try again!`}
            </p>

            {/* Score & XP Pills */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <div className="px-4 py-2 rounded-xl bg-ivory border border-brass/20 text-center">
                <span className="text-[10px] uppercase font-bold text-aubergine/60 block">Score</span>
                <span className="text-base font-black font-mono text-aubergine">
                  {submitResult.score} / {submitResult.maxScore} ({submitResult.scorePercentage}%)
                </span>
              </div>

              {submitResult.xpAwarded > 0 && (
                <div className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-amber-700 block">XP Awarded</span>
                  <span className="text-base font-black font-mono text-amber-600 flex items-center justify-center gap-1">
                    <Zap className="w-4 h-4 fill-amber-500" />
                    +{submitResult.xpAwarded} XP
                  </span>
                </div>
              )}
            </div>

            {/* New Badges Notification */}
            {submitResult.newBadges && submitResult.newBadges.length > 0 && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs inline-flex items-center gap-2 mt-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>
                  <strong>New Badges Unlocked:</strong>{' '}
                  {submitResult.newBadges.map((b) => b.title).join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Question Review & Post-Submission Explanations */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-aubergine">
              Answers & Explanations Review
            </h3>

            <div className="space-y-4 divide-y divide-brass/10">
              {submitResult.review?.map((rev, idx) => (
                <div key={rev.questionId} className="pt-4 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-aubergine">
                      {idx + 1}. {rev.questionText}
                    </span>
                    <Badge variant={rev.isCorrect ? 'success' : 'danger'} size="sm">
                      {rev.isCorrect ? `+${rev.pointsAwarded} pts` : '0 pts'}
                    </Badge>
                  </div>

                  {/* Options */}
                  <div className="space-y-1.5 pl-3">
                    {rev.options.map((opt, oIdx) => {
                      const isUserChoice = rev.selectedOptionIndex === oIdx;
                      const isCorrectChoice = rev.correctAnswerIndex === oIdx;

                      let style = 'bg-ivory border-brass/20 text-aubergine/80';
                      if (isCorrectChoice) {
                        style = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold';
                      } else if (isUserChoice && !rev.isCorrect) {
                        style = 'bg-rose-50 border-rose-300 text-rose-900 font-semibold';
                      }

                      return (
                        <div
                          key={oIdx}
                          className={`p-2 rounded-lg border text-xs flex items-center justify-between ${style}`}
                        >
                          <span>{opt}</span>
                          {isCorrectChoice && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                          {isUserChoice && !rev.isCorrect && (
                            <span className="text-[10px] text-rose-600">Your Answer</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {rev.explanation && (
                    <div className="p-3 rounded-lg bg-ivory-dark border border-brass/20 text-aubergine/80 text-[11px] leading-relaxed">
                      <strong>Explanation:</strong> {rev.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-brass/20 flex items-center justify-between">
            <Button variant="secondary" size="md" icon={RotateCcw} onClick={handleRetry}>
              Retake Assessment
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={ArrowRight}
              onClick={() => setSearchParams({})}
            >
              Return to Arena
            </Button>
          </div>
        </Card>
      ) : (
        /* ACTIVE QUESTION TAKING VIEW */
        <Card className="p-6 sm:p-8 bg-white/95 border-brass/25 space-y-6">
          {/* Question Header & Counter */}
          <div className="flex items-center justify-between pb-3 border-b border-brass/15">
            <span className="text-xs font-bold text-aubergine/70 font-mono">
              Question {currentIdx + 1} of {questions.length}
            </span>

            {/* Stepper Dots */}
            <div className="flex gap-1.5">
              {questions.map((q, idx) => {
                const qId = q._id || q.id;
                const isAnswered = selectedAnswers[qId] !== undefined;
                return (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      currentIdx === idx
                        ? 'bg-terracotta w-6'
                        : isAnswered
                        ? 'bg-brass w-3'
                        : 'bg-brass/20 w-3'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta">
              {currentQ.questionType === 'true_false' ? 'True / False' : 'Multiple Choice'} • {currentQ.points || 10} Points
            </span>
            <h2 className="text-base sm:text-lg font-bold text-aubergine leading-snug">
              {currentQ.questionText}
            </h2>
          </div>

          {/* Options List */}
          <div className="space-y-3 pt-2">
            {currentQ.options?.map((option, optIdx) => {
              const isSelected = selectedAnswers[currentQId] === optIdx;
              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(currentQId, optIdx)}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all select-none ${
                    isSelected
                      ? 'bg-aubergine text-ivory border-aubergine shadow-xs'
                      : 'bg-ivory border-brass/20 text-aubergine hover:bg-white hover:border-brass/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                        isSelected ? 'bg-terracotta text-white' : 'bg-brass/15 text-aubergine'
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span>{option}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-terracotta" />}
                </button>
              );
            })}
          </div>

          {/* Navigation & Submit Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-brass/15">
            <Button
              variant="secondary"
              size="sm"
              icon={ChevronLeft}
              disabled={currentIdx === 0}
              onClick={handlePrev}
            >
              Previous
            </Button>

            {currentIdx < questions.length - 1 ? (
              <Button
                variant="primary"
                size="sm"
                icon={ChevronRight}
                onClick={handleNext}
              >
                Next Question
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle2}
                loading={submitting}
                onClick={handleSubmitAttempt}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Submit Assessment
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

export default QuizPage;
