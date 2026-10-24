import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Tabs } from '../../components/common/Tabs';
import { Loading } from '../../components/common/Loading';
import { EmptyState } from '../../components/common/EmptyState';
import api, { API_BASE_URL } from '../../services/api';
import {
  ShieldCheck,
  BookOpen,
  FileText,
  Upload,
  PlusCircle,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Eye,
  Lock,
  AlertCircle,
  HelpCircle,
  Layers,
  Award,
  Sparkles,
  BarChart3,
  Activity,
  Users,
  Clock
} from 'lucide-react';

const CATEGORIES = [
  'Budgeting',
  'Savings & Emergency Funds',
  'Loans & EMI',
  'Banking & Digital Safety',
  'Investments',
  'Insurance Basics',
  'Financial Scams',
];

export function AdminPortalPage() {
  const [activeTab, setActiveTab] = useState('courses');

  // Courses state
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState(null);

  // Quizzes state
  const [quizzes, setQuizzes] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [quizzesError, setQuizzesError] = useState(null);

  // Analytics state
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [auditError, setAuditError] = useState(null);

  // Modals
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [showUploadMaterial, setShowUploadMaterial] = useState(false);
  const [showAddQuiz, setShowAddQuiz] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showAiDraftModal, setShowAiDraftModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  // AI Draft Quiz Form State
  const [aiDraftCategory, setAiDraftCategory] = useState('Budgeting');
  const [aiDraftPrompt, setAiDraftPrompt] = useState('');
  const [aiDraftSubmitting, setAiDraftSubmitting] = useState(false);
  const [aiDraftError, setAiDraftError] = useState('');

  // New Course Form State
  const [cTitle, setCTitle] = useState('');
  const [cDescription, setCDescription] = useState('');
  const [cCategory, setCCategory] = useState('Budgeting');
  const [cDifficulty, setCDifficulty] = useState('Beginner');
  const [cSubmitting, setCSubmitting] = useState(false);
  const [cFormError, setCFormError] = useState('');

  // New Lesson Form State
  const [lTitle, setLTitle] = useState('');
  const [lContent, setLContent] = useState('');
  const [lDuration, setLDuration] = useState('5');
  const [lSubmitting, setLSubmitting] = useState(false);
  const [lFormError, setLFormError] = useState('');

  // Upload Material State
  const [mTitle, setMTitle] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [mSubmitting, setMSubmitting] = useState(false);
  const [mFormError, setMFormError] = useState('');

  // New Quiz Form State
  const [qTitle, setQTitle] = useState('');
  const [qDescription, setQDescription] = useState('');
  const [qCategory, setQCategory] = useState('Budgeting');
  const [qDifficulty, setQDifficulty] = useState('Beginner');
  const [qCourseId, setQCourseId] = useState('');
  const [qPassingScore, setQPassingScore] = useState('60');
  const [qSubmitting, setQSubmitting] = useState(false);
  const [qFormError, setQFormError] = useState('');

  // New Question Form State
  const [quesText, setQuesText] = useState('');
  const [quesType, setQuesType] = useState('mcq');
  const [opt0, setOpt0] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [quesCorrectIdx, setQuesCorrectIdx] = useState('0');
  const [quesExplanation, setQuesExplanation] = useState('');
  const [quesPoints, setQuesPoints] = useState('10');
  const [quesSubmitting, setQuesSubmitting] = useState(false);
  const [quesFormError, setQuesFormError] = useState('');

  const fetchAdminCourses = useCallback(async () => {
    try {
      setLoadingCourses(true);
      setCoursesError(null);
      const res = await api.get('/learning/admin/courses');
      setCourses(res?.data?.courses || []);
    } catch (err) {
      setCoursesError(err.message || 'Failed to load admin courses');
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  const fetchAdminQuizzes = useCallback(async () => {
    try {
      setLoadingQuizzes(true);
      setQuizzesError(null);
      const res = await api.get('/assessment/admin/quizzes');
      setQuizzes(res?.data?.quizzes || []);
    } catch (err) {
      setQuizzesError(err.message || 'Failed to load quizzes');
    } finally {
      setLoadingQuizzes(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const res = await api.get('/admin/analytics');
      if (res?.data?.analytics) {
        setAnalytics(res.data.analytics);
      }
    } catch (err) {
      console.warn('Failed to load admin analytics:', err.message);
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    setLoadingAuditLogs(true);
    setAuditError(null);
    try {
      const res = await api.get('/admin/audit-logs');
      if (res?.data?.auditLogs) {
        setAuditLogs(res.data.auditLogs);
      }
    } catch (err) {
      setAuditError(err.message || 'Failed to load audit logs');
    } finally {
      setLoadingAuditLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminCourses();
    fetchAdminQuizzes();
  }, [fetchAdminCourses, fetchAdminQuizzes]);

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    } else if (activeTab === 'audit-logs') {
      fetchAuditLogs();
    }
  }, [activeTab, fetchAnalytics, fetchAuditLogs]);

  // Course Handlers
  const handleToggleCoursePublish = async (course) => {
    try {
      const newStatus = course.status === 'published' ? 'draft' : 'published';
      await api.patch(`/learning/admin/courses/${course.id}`, { status: newStatus });
      fetchAdminCourses();
    } catch (err) {
      alert(err.message || 'Failed to update course status');
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setCFormError('');

    if (!cTitle.trim()) {
      setCFormError('Course title is required');
      return;
    }
    if (!cDescription.trim()) {
      setCFormError('Course description is required');
      return;
    }

    try {
      setCSubmitting(true);
      await api.post('/learning/admin/courses', {
        title: cTitle.trim(),
        description: cDescription.trim(),
        category: cCategory,
        difficulty: cDifficulty,
        status: 'draft',
      });

      setCTitle('');
      setCDescription('');
      setShowAddCourse(false);
      fetchAdminCourses();
    } catch (err) {
      setCFormError(err.message || 'Failed to create course');
    } finally {
      setCSubmitting(false);
    }
  };

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    setLFormError('');

    if (!lTitle.trim()) {
      setLFormError('Lesson title is required');
      return;
    }
    if (!lContent.trim()) {
      setLFormError('Lesson content is required');
      return;
    }

    try {
      setLSubmitting(true);
      await api.post(`/learning/admin/courses/${selectedCourse.id}/lessons`, {
        title: lTitle.trim(),
        content: lContent.trim(),
        durationMinutes: parseInt(lDuration, 10) || 5,
      });

      setLTitle('');
      setLContent('');
      setShowAddLesson(false);
      fetchAdminCourses();
    } catch (err) {
      setLFormError(err.message || 'Failed to create lesson');
    } finally {
      setLSubmitting(false);
    }
  };

  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    setMFormError('');

    if (!uploadFile) {
      setMFormError('Please select a PDF file');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', mTitle.trim() || uploadFile.name);
    formData.append('courseId', selectedCourse.id);

    try {
      setMSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/learning/admin/materials/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('finlearn_token')}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      setUploadFile(null);
      setMTitle('');
      setShowUploadMaterial(false);
      alert('PDF material verified and uploaded successfully');
    } catch (err) {
      setMFormError(err.message || 'Upload failed');
    } finally {
      setMSubmitting(false);
    }
  };

  // Quiz Handlers
  const handleToggleQuizPublish = async (quiz) => {
    try {
      const newStatus = quiz.status === 'published' ? 'draft' : 'published';
      if (newStatus === 'published' && (!quiz.questions || quiz.questions.length === 0)) {
        alert('Cannot publish a quiz with 0 questions. Add at least one question first.');
        return;
      }
      await api.patch(`/assessment/admin/quizzes/${quiz.id || quiz._id}`, { status: newStatus });
      fetchAdminQuizzes();
    } catch (err) {
      alert(err.message || 'Failed to update quiz status');
    }
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    setQFormError('');

    if (!qTitle.trim()) {
      setQFormError('Quiz title is required');
      return;
    }
    if (!qDescription.trim()) {
      setQFormError('Quiz description is required');
      return;
    }

    try {
      setQSubmitting(true);
      await api.post('/assessment/admin/quizzes', {
        title: qTitle.trim(),
        description: qDescription.trim(),
        category: qCategory,
        difficulty: qDifficulty,
        courseId: qCourseId || null,
        passingScorePercent: parseInt(qPassingScore, 10) || 60,
        status: 'draft',
      });

      setQTitle('');
      setQDescription('');
      setQCourseId('');
      setShowAddQuiz(false);
      fetchAdminQuizzes();
    } catch (err) {
      setQFormError(err.message || 'Failed to create quiz');
    } finally {
      setQSubmitting(false);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    setQuesFormError('');

    if (!quesText.trim()) {
      setQuesFormError('Question text is required');
      return;
    }

    const options =
      quesType === 'true_false'
        ? ['True', 'False']
        : [opt0.trim(), opt1.trim(), opt2.trim(), opt3.trim()].filter(Boolean);

    if (options.length < 2) {
      setQuesFormError('Provide at least 2 answer options');
      return;
    }

    const correctIdx = parseInt(quesCorrectIdx, 10);
    if (isNaN(correctIdx) || correctIdx < 0 || correctIdx >= options.length) {
      setQuesFormError('Please select a valid correct answer option');
      return;
    }

    try {
      setQuesSubmitting(true);
      const targetQuizId = selectedQuiz.id || selectedQuiz._id;
      await api.post(`/assessment/admin/quizzes/${targetQuizId}/questions`, {
        questionText: quesText.trim(),
        questionType: quesType,
        options,
        correctAnswerIndex: correctIdx,
        explanation: quesExplanation.trim(),
        points: parseInt(quesPoints, 10) || 10,
      });

      setQuesText('');
      setOpt0('');
      setOpt1('');
      setOpt2('');
      setOpt3('');
      setQuesExplanation('');
      setShowAddQuestion(false);
      fetchAdminQuizzes();
      alert('Question added successfully');
    } catch (err) {
      setQuesFormError(err.message || 'Failed to add question');
    } finally {
      setQuesSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-aubergine text-ivory border border-aubergine-light shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-brass-light uppercase tracking-wider">
              Educational Governance
            </span>
            <Badge variant="terracotta" size="sm">Admin RBAC Enforced</Badge>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-ivory">
            Admin Content & Assessment Portal
          </h1>
          <p className="text-xs text-lilac-light">
            Course authoring • Lesson ordering • Verified PDF materials • Quiz creation & scoring
          </p>
        </div>

          <div className="flex items-center gap-2">
            {activeTab === 'courses' && (
              <Button
                variant="primary"
                size="sm"
                icon={PlusCircle}
                onClick={() => {
                  setCFormError('');
                  setShowAddCourse(true);
                }}
              >
                Create Course
              </Button>
            )}

            {(activeTab === 'quizzes' || activeTab === 'ai-review') && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Sparkles}
                  onClick={() => {
                    setAiDraftError('');
                    setShowAiDraftModal(true);
                  }}
                >
                  Generate AI Draft
                </Button>
                {activeTab === 'quizzes' && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={PlusCircle}
                    onClick={() => {
                      setQFormError('');
                      setShowAddQuiz(true);
                    }}
                  >
                    Create Quiz
                  </Button>
                )}
              </>
            )}
          </div>
      </div>

      {/* Critical Admin Privacy Boundary Notice */}
      <div className="p-3.5 rounded-xl bg-ivory-dark border border-brass/25 flex items-start gap-2.5 text-xs text-aubergine/80">
        <Lock className="w-4 h-4 text-terracotta shrink-0 mt-0.5" />
        <p>
          <strong>Zero Financial Snooping Rule (SRS 3.1):</strong> Administrative privileges are strictly confined to educational courses, question banks, and audit records. Admins possess zero routine access to private user income, expenses, or debt records.
        </p>
      </div>

      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'courses', label: 'Curriculum & Lessons', count: courses.length },
          { id: 'quizzes', label: 'Quizzes & Question Bank', count: quizzes.length },
          { id: 'ai-review', label: 'AI Quiz Draft Review', count: quizzes.filter((q) => q.isAiGenerated).length },
          { id: 'analytics', label: 'System Analytics' },
          { id: 'audit-logs', label: 'Audit Trail' },
        ]}
      />

      {/* Tab 1: Course Management */}
      {activeTab === 'courses' && (
        <Card title="Curriculum Repository" subtitle="Manage drafts, publication states, and lesson counts">
          {loadingCourses ? (
            <Loading message="Loading curriculum records..." />
          ) : coursesError ? (
            <div className="p-6 text-center text-xs text-rose-600 bg-rose-50 rounded-xl">
              {coursesError}
            </div>
          ) : courses.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No Courses in Database"
              description="Create the first educational course draft to begin authoring curriculum modules."
              actionLabel="Create First Course"
              onAction={() => setShowAddCourse(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-aubergine">
                <thead>
                  <tr className="border-b border-brass/20 text-aubergine/60 uppercase font-bold">
                    <th className="py-2.5 px-3">Course Title</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Lessons</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brass/10">
                  {courses.map((c) => (
                    <tr key={c.id} className="hover:bg-ivory-dark/60">
                      <td className="py-3 px-3 font-bold text-aubergine">{c.title}</td>
                      <td className="py-3 px-3 text-aubergine/70">{c.category}</td>
                      <td className="py-3 px-3">
                        <Badge variant={c.status === 'published' ? 'success' : 'brass'} size="sm">
                          {c.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">{c.lessonCount || 0}</td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleCoursePublish(c)}
                        >
                          {c.status === 'published' ? 'Unpublish' : 'Publish'}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={PlusCircle}
                          onClick={() => {
                            setSelectedCourse(c);
                            setLFormError('');
                            setShowAddLesson(true);
                          }}
                        >
                          Add Lesson
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Upload}
                          onClick={() => {
                            setSelectedCourse(c);
                            setMFormError('');
                            setShowUploadMaterial(true);
                          }}
                        >
                          Upload PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab 2: Quiz Management */}
      {activeTab === 'quizzes' && (
        <Card title="Assessment Question Bank" subtitle="Author quizzes, configure passing thresholds, and manage questions">
          {loadingQuizzes ? (
            <Loading message="Loading quiz records..." />
          ) : quizzesError ? (
            <div className="p-6 text-center text-xs text-rose-600 bg-rose-50 rounded-xl">
              {quizzesError}
            </div>
          ) : quizzes.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No Quizzes Configured"
              description="Create the first financial quiz to provide assessments and award learner XP."
              actionLabel="Create First Quiz"
              onAction={() => setShowAddQuiz(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-aubergine">
                <thead>
                  <tr className="border-b border-brass/20 text-aubergine/60 uppercase font-bold">
                    <th className="py-2.5 px-3">Quiz Title</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Questions</th>
                    <th className="py-2.5 px-3">Passing %</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brass/10">
                  {quizzes.map((q) => {
                    const qId = q.id || q._id;
                    const questionCount = q.questions?.length || 0;
                    return (
                      <tr key={qId} className="hover:bg-ivory-dark/60">
                        <td className="py-3 px-3 font-bold text-aubergine">
                          <div>{q.title}</div>
                          <span className="text-[10px] text-aubergine/60 font-normal">
                            {q.difficulty} Level
                          </span>
                        </td>
                        <td className="py-3 px-3 text-aubergine/70">{q.category}</td>
                        <td className="py-3 px-3 font-mono font-bold">{questionCount}</td>
                        <td className="py-3 px-3 font-mono font-bold text-terracotta">
                          {q.passingScorePercent || 60}%
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant={q.status === 'published' ? 'success' : 'brass'} size="sm">
                            {q.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleQuizPublish(q)}
                          >
                            {q.status === 'published' ? 'Unpublish' : 'Publish'}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={PlusCircle}
                            onClick={() => {
                              setSelectedQuiz(q);
                              setQuesFormError('');
                              setShowAddQuestion(true);
                            }}
                          >
                            Add Question
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab 3: AI Quiz Draft Review Live Gate */}
      {activeTab === 'ai-review' && (
        <Card title="AI Quiz Human-in-the-Loop Review Gate" subtitle="Review AI-generated question drafts before public release">
          {quizzes.filter((q) => q.isAiGenerated).length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No AI Quiz Drafts Pending Review"
              description="Click 'Generate AI Draft' to produce curriculum-grounded question sets for editorial review."
              actionLabel="Generate AI Draft Quiz"
              onAction={() => {
                setAiDraftError('');
                setShowAiDraftModal(true);
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-aubergine">
                <thead>
                  <tr className="border-b border-brass/20 text-aubergine/60 uppercase font-bold">
                    <th className="py-2.5 px-3">Draft Title</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Questions</th>
                    <th className="py-2.5 px-3">Editorial Review</th>
                    <th className="py-2.5 px-3">Publication Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brass/10">
                  {quizzes.filter((q) => q.isAiGenerated).map((q) => (
                    <tr key={q.id} className="hover:bg-ivory-dark/40 transition-colors">
                      <td className="py-3 px-3 font-bold">{q.title}</td>
                      <td className="py-3 px-3">
                        <Badge variant="terracotta" size="xs">{q.category}</Badge>
                      </td>
                      <td className="py-3 px-3 font-mono">{q.questionsCount || q.questions?.length || 0} items</td>
                      <td className="py-3 px-3">
                        <Badge variant={q.aiReviewStatus === 'approved' ? 'success' : 'terracotta'} size="xs">
                          {q.aiReviewStatus === 'approved' ? 'Approved' : 'Pending Review'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={q.status === 'published' ? 'success' : 'default'} size="xs">
                          {q.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => {
                              setSelectedQuiz(q);
                              setShowAddQuestion(true);
                            }}
                          >
                            Add Question
                          </Button>
                          <Button
                            variant={q.status === 'published' ? 'ghost' : 'primary'}
                            size="xs"
                            onClick={() => handleToggleQuizPublish(q)}
                          >
                            {q.status === 'published' ? 'Unpublish' : 'Approve & Publish'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab 4: System Analytics Live Metrics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <Card title="System-wide Learning & Platform Analytics" subtitle="Aggregate performance metrics with zero private transaction access">
            {loadingAnalytics ? (
              <Loading message="Aggregating platform metrics..." />
            ) : analytics ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-ivory-dark border border-brass/20">
                  <div className="flex items-center justify-between text-xs text-aubergine/60 font-bold uppercase">
                    <span>Registered Learners</span>
                    <Users className="w-4 h-4 text-terracotta" />
                  </div>
                  <span className="block text-2xl font-black font-mono text-aubergine mt-2">
                    {analytics.totalLearners}
                  </span>
                  <span className="text-[11px] text-aubergine/60 mt-0.5 block">Active Learner Accounts</span>
                </div>

                <div className="p-4 rounded-xl bg-ivory-dark border border-brass/20">
                  <div className="flex items-center justify-between text-xs text-aubergine/60 font-bold uppercase">
                    <span>Curriculum Courses</span>
                    <BookOpen className="w-4 h-4 text-indigo-700" />
                  </div>
                  <span className="block text-2xl font-black font-mono text-aubergine mt-2">
                    {analytics.totalCourses}
                  </span>
                  <span className="text-[11px] text-aubergine/60 mt-0.5 block">
                    {analytics.publishedCourses} Published to Learners
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-ivory-dark border border-brass/20">
                  <div className="flex items-center justify-between text-xs text-aubergine/60 font-bold uppercase">
                    <span>Quiz Assessments</span>
                    <Award className="w-4 h-4 text-amber-700" />
                  </div>
                  <span className="block text-2xl font-black font-mono text-aubergine mt-2">
                    {analytics.totalQuizzes}
                  </span>
                  <span className="text-[11px] text-aubergine/60 mt-0.5 block">Question Banks Configured</span>
                </div>

                <div className="p-4 rounded-xl bg-ivory-dark border border-brass/20">
                  <div className="flex items-center justify-between text-xs text-aubergine/60 font-bold uppercase">
                    <span>Average Pass Rate</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  </div>
                  <span className="block text-2xl font-black font-mono text-emerald-700 mt-2">
                    {analytics.averagePassRate}%
                  </span>
                  <span className="text-[11px] text-aubergine/60 mt-0.5 block">
                    {analytics.totalAttempts} Attempts Evaluated
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-aubergine/60">No analytics data available.</p>
            )}
          </Card>
        </div>
      )}

      {/* Tab 5: Centralized Audit Trail */}
      {activeTab === 'audit-logs' && (
        <Card title="System Audit Trail & Compliance Log" subtitle="Immutable record of administrative operations with sensitive key redaction">
          {loadingAuditLogs ? (
            <Loading message="Loading system audit entries..." />
          ) : auditError ? (
            <div className="p-6 text-center text-xs text-rose-600 bg-rose-50 rounded-xl">
              {auditError}
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-aubergine/60">
              No audit logs recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-aubergine">
                <thead>
                  <tr className="border-b border-brass/20 text-aubergine/60 uppercase font-bold">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Actor</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Target</th>
                    <th className="py-2.5 px-3">Outcome</th>
                    <th className="py-2.5 px-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brass/10">
                  {auditLogs.map((log) => (
                    <tr key={log._id || log.id} className="hover:bg-ivory-dark/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-aubergine/70 whitespace-nowrap">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold block">{log.actorEmail}</span>
                        <span className="text-[10px] text-aubergine/50 uppercase">{log.actorRole}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-aubergine">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant="terracotta" size="xs">{log.targetType}</Badge>
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant={log.outcome === 'success' ? 'success' : 'default'} size="xs">
                          {log.outcome}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] font-mono text-aubergine/70 max-w-xs truncate">
                        {JSON.stringify(log.details || {})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Create Course Modal */}
      <Modal
        isOpen={showAddCourse}
        onClose={() => setShowAddCourse(false)}
        title="Author Educational Course"
        subtitle="Initial course curriculum in draft state"
      >
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <Input
            label="Course Title"
            value={cTitle}
            onChange={(e) => setCTitle(e.target.value)}
            placeholder="e.g. Personal Income Tax Planning in India"
            required
          />

          <div>
            <label className="block text-xs font-bold text-aubergine mb-1">Description</label>
            <textarea
              value={cDescription}
              onChange={(e) => setCDescription(e.target.value)}
              rows={3}
              className="w-full text-xs rounded-lg border border-brass/30 bg-ivory p-2.5 text-aubergine focus:outline-none focus:ring-2 focus:ring-terracotta"
              placeholder="Summary of course curriculum and learning objectives..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={cCategory}
              onChange={(e) => setCCategory(e.target.value)}
              options={CATEGORIES.map((c) => ({ value: c, label: c }))}
            />

            <Select
              label="Difficulty"
              value={cDifficulty}
              onChange={(e) => setCDifficulty(e.target.value)}
              options={[
                { value: 'Beginner', label: 'Beginner' },
                { value: 'Intermediate', label: 'Intermediate' },
                { value: 'Advanced', label: 'Advanced' },
              ]}
            />
          </div>

          {cFormError && (
            <p className="text-xs text-rose-600 font-semibold">{cFormError}</p>
          )}

          <div className="pt-3 flex justify-end gap-3 border-t border-brass/15">
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowAddCourse(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={cSubmitting}>
              Create Draft Course
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Lesson Modal */}
      <Modal
        isOpen={showAddLesson}
        onClose={() => setShowAddLesson(false)}
        title={selectedCourse ? `Add Lesson to: ${selectedCourse.title}` : 'Add Lesson'}
      >
        <form onSubmit={handleCreateLesson} className="space-y-4">
          <Input
            label="Lesson Title"
            value={lTitle}
            onChange={(e) => setLTitle(e.target.value)}
            placeholder="e.g. Chapter 1: Old vs New Tax Regime Basics"
            required
          />

          <div>
            <label className="block text-xs font-bold text-aubergine mb-1">Lesson Content</label>
            <textarea
              value={lContent}
              onChange={(e) => setLContent(e.target.value)}
              rows={5}
              className="w-full text-xs rounded-lg border border-brass/30 bg-ivory p-2.5 text-aubergine focus:outline-none focus:ring-2 focus:ring-terracotta"
              placeholder="Educational content formatted in paragraphs..."
              required
            />
          </div>

          <Input
            label="Estimated Duration (Minutes)"
            type="number"
            min="1"
            value={lDuration}
            onChange={(e) => setLDuration(e.target.value)}
            required
          />

          {lFormError && (
            <p className="text-xs text-rose-600 font-semibold">{lFormError}</p>
          )}

          <div className="pt-3 flex justify-end gap-3 border-t border-brass/15">
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowAddLesson(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={lSubmitting}>
              Create Lesson
            </Button>
          </div>
        </form>
      </Modal>

      {/* Upload Material Modal */}
      <Modal
        isOpen={showUploadMaterial}
        onClose={() => setShowUploadMaterial(false)}
        title={selectedCourse ? `Upload PDF Material: ${selectedCourse.title}` : 'Upload PDF'}
      >
        <form onSubmit={handleUploadMaterial} className="space-y-4">
          <Input
            label="Material Title"
            value={mTitle}
            onChange={(e) => setMTitle(e.target.value)}
            placeholder="e.g. RBI Handbook on Deposit Insurance"
          />

          <div>
            <label className="block text-xs font-bold text-aubergine mb-1">Select PDF Document</label>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setUploadFile(e.target.files[0])}
              className="w-full text-xs text-aubergine file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-terracotta file:text-white hover:file:bg-terracotta-dark"
              required
            />
            <p className="text-[11px] text-aubergine/60 mt-1">
              Must have valid %PDF- magic signature (max 20MB). File will be verified on the server.
            </p>
          </div>

          {mFormError && (
            <p className="text-xs text-rose-600 font-semibold">{mFormError}</p>
          )}

          <div className="pt-3 flex justify-end gap-3 border-t border-brass/15">
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowUploadMaterial(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={mSubmitting}>
              Upload & Verify PDF
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Quiz Modal */}
      <Modal
        isOpen={showAddQuiz}
        onClose={() => setShowAddQuiz(false)}
        title="Create Financial Quiz"
        subtitle="Initial assessment in draft state"
      >
        <form onSubmit={handleCreateQuiz} className="space-y-4">
          <Input
            label="Quiz Title"
            value={qTitle}
            onChange={(e) => setQTitle(e.target.value)}
            placeholder="e.g. Budgeting & Emergency Fund Mastery"
            required
          />

          <div>
            <label className="block text-xs font-bold text-aubergine mb-1">Description</label>
            <textarea
              value={qDescription}
              onChange={(e) => setQDescription(e.target.value)}
              rows={3}
              className="w-full text-xs rounded-lg border border-brass/30 bg-ivory p-2.5 text-aubergine focus:outline-none focus:ring-2 focus:ring-terracotta"
              placeholder="Overview of assessment topics and learning verification goals..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={qCategory}
              onChange={(e) => setQCategory(e.target.value)}
              options={CATEGORIES.map((c) => ({ value: c, label: c }))}
            />

            <Select
              label="Difficulty"
              value={qDifficulty}
              onChange={(e) => setQDifficulty(e.target.value)}
              options={[
                { value: 'Beginner', label: 'Beginner' },
                { value: 'Intermediate', label: 'Intermediate' },
                { value: 'Advanced', label: 'Advanced' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Associated Course (Optional)"
              value={qCourseId}
              onChange={(e) => setQCourseId(e.target.value)}
              options={[
                { value: '', label: 'General / No Course' },
                ...courses.map((c) => ({ value: c.id, label: c.title })),
              ]}
            />

            <Input
              label="Passing Score (%)"
              type="number"
              min="1"
              max="100"
              value={qPassingScore}
              onChange={(e) => setQPassingScore(e.target.value)}
              required
            />
          </div>

          {qFormError && (
            <p className="text-xs text-rose-600 font-semibold">{qFormError}</p>
          )}

          <div className="pt-3 flex justify-end gap-3 border-t border-brass/15">
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowAddQuiz(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={qSubmitting}>
              Create Draft Quiz
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Question Modal */}
      <Modal
        isOpen={showAddQuestion}
        onClose={() => setShowAddQuestion(false)}
        title={selectedQuiz ? `Add Question to: ${selectedQuiz.title}` : 'Add Question'}
      >
        <form onSubmit={handleAddQuestion} className="space-y-4">
          <Input
            label="Question Text"
            value={quesText}
            onChange={(e) => setQuesText(e.target.value)}
            placeholder="e.g. What percentage of monthly income is recommended for emergency savings?"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Question Type"
              value={quesType}
              onChange={(e) => setQuesType(e.target.value)}
              options={[
                { value: 'mcq', label: 'Multiple Choice (4 options)' },
                { value: 'true_false', label: 'True / False (2 options)' },
              ]}
            />

            <Input
              label="Points Awarded"
              type="number"
              min="1"
              max="100"
              value={quesPoints}
              onChange={(e) => setQuesPoints(e.target.value)}
              required
            />
          </div>

          {quesType === 'mcq' ? (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-aubergine">Answer Options</label>
              <Input
                placeholder="Option 1"
                value={opt0}
                onChange={(e) => setOpt0(e.target.value)}
                required
              />
              <Input
                placeholder="Option 2"
                value={opt1}
                onChange={(e) => setOpt1(e.target.value)}
                required
              />
              <Input
                placeholder="Option 3"
                value={opt2}
                onChange={(e) => setOpt2(e.target.value)}
              />
              <Input
                placeholder="Option 4"
                value={opt3}
                onChange={(e) => setOpt3(e.target.value)}
              />
            </div>
          ) : (
            <div className="p-3 bg-ivory rounded-lg text-xs text-aubergine/70">
              Options will be automatically set to: <strong>1. True</strong> and <strong>2. False</strong>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-aubergine mb-1">Correct Answer</label>
            <Select
              value={quesCorrectIdx}
              onChange={(e) => setQuesCorrectIdx(e.target.value)}
              options={
                quesType === 'true_false'
                  ? [
                      { value: '0', label: 'Option 1: True' },
                      { value: '1', label: 'Option 2: False' },
                    ]
                  : [
                      { value: '0', label: `Option 1: ${opt0 || '(empty)'}` },
                      { value: '1', label: `Option 2: ${opt1 || '(empty)'}` },
                      { value: '2', label: `Option 3: ${opt2 || '(empty)'}` },
                      { value: '3', label: `Option 4: ${opt3 || '(empty)'}` },
                    ]
              }
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-aubergine mb-1">Explanation (Post-Submission)</label>
            <textarea
              value={quesExplanation}
              onChange={(e) => setQuesExplanation(e.target.value)}
              rows={2}
              className="w-full text-xs rounded-lg border border-brass/30 bg-ivory p-2.5 text-aubergine focus:outline-none focus:ring-2 focus:ring-terracotta"
              placeholder="Explain why this answer is correct. Shown to learners only after submission."
            />
          </div>

          {quesFormError && (
            <p className="text-xs text-rose-600 font-semibold">{quesFormError}</p>
          )}

          <div className="pt-3 flex justify-end gap-3 border-t border-brass/15">
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowAddQuestion(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={quesSubmitting}>
              Add Question
            </Button>
          </div>
        </form>
      </Modal>

      {/* Generate AI Draft Quiz Modal */}
      <Modal
        isOpen={showAiDraftModal}
        onClose={() => setShowAiDraftModal(false)}
        title="Generate AI Draft Assessment"
        subtitle="Produce curriculum-grounded assessment draft awaiting human editorial approval"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setAiDraftSubmitting(true);
            setAiDraftError('');
            try {
              await api.post('/assessment/admin/quizzes/generate-draft', {
                category: aiDraftCategory,
                customPrompt: aiDraftPrompt.trim(),
              });
              setShowAiDraftModal(false);
              fetchAdminQuizzes();
              setActiveTab('ai-review');
            } catch (err) {
              setAiDraftError(err.message || 'Failed to generate AI quiz draft');
            } finally {
              setAiDraftSubmitting(false);
            }
          }}
          className="space-y-4"
        >
          <Select
            label="Curriculum Domain"
            value={aiDraftCategory}
            onChange={(e) => setAiDraftCategory(e.target.value)}
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
          />

          <div>
            <label className="block text-xs font-bold text-aubergine mb-1">
              Editorial Instructions / Topics Focus (Optional)
            </label>
            <textarea
              value={aiDraftPrompt}
              onChange={(e) => setAiDraftPrompt(e.target.value)}
              rows={3}
              className="w-full text-xs rounded-lg border border-brass/30 bg-ivory p-2.5 text-aubergine focus:outline-none focus:ring-2 focus:ring-terracotta"
              placeholder="e.g. Focus questions on 50-30-20 emergency fund math and reducing loan APR"
            />
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p>
              <strong>Human-in-the-Loop Safeguard:</strong> Generated quizzes will be created in strictly <em>draft</em> state with status <em>pending_human_review</em>. They are completely hidden from learners until you explicitly verify and publish them.
            </p>
          </div>

          {aiDraftError && (
            <p className="text-xs text-rose-600 font-semibold">{aiDraftError}</p>
          )}

          <div className="pt-3 flex justify-end gap-3 border-t border-brass/15">
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowAiDraftModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={aiDraftSubmitting} icon={Sparkles}>
              Generate Draft
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AdminPortalPage;
