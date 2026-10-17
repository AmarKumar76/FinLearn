import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout & Security Guards
import AppLayout from './layouts/AppLayout';
import { ProtectedRoute, AdminRoute } from './components/common/ProtectedRoute';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import SignupPage from './pages/public/SignupPage';
import OnboardingPage from './pages/public/OnboardingPage';

// Authenticated Application Pages
import DashboardPage from './pages/app/DashboardPage';
import TransactionsPage from './pages/app/TransactionsPage';
import BudgetsPage from './pages/app/BudgetsPage';
import CommitmentsPage from './pages/app/CommitmentsPage';
import LearningLabPage from './pages/app/LearningLabPage';
import LessonViewPage from './pages/app/LessonViewPage';
import QuizPage from './pages/app/QuizPage';
import AiCoachPage from './pages/app/AiCoachPage';
import SafetyLabPage from './pages/app/SafetyLabPage';
import LoanGuidePage from './pages/app/LoanGuidePage';
import InvestmentGuidePage from './pages/app/InvestmentGuidePage';
import InsightsPage from './pages/app/InsightsPage';
import NotificationsPage from './pages/app/NotificationsPage';
import SettingsPage from './pages/app/SettingsPage';

// Admin Portal Page
import AdminPortalPage from './pages/admin/AdminPortalPage';

export function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />

      {/* Authenticated User Workspace Shell */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Core User Dashboard */}
        <Route path="/app" element={<DashboardPage />} />
        
        {/* Money Modules */}
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/budgets" element={<BudgetsPage />} />
        <Route path="/commitments" element={<CommitmentsPage />} />
        
        {/* Education & Assessments */}
        <Route path="/learning" element={<LearningLabPage />} />
        <Route path="/lesson" element={<LessonViewPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        
        {/* Safety, Guidance & AI */}
        <Route path="/ai-coach" element={<AiCoachPage />} />
        <Route path="/safety" element={<SafetyLabPage />} />
        <Route path="/loans" element={<LoanGuidePage />} />
        <Route path="/investments" element={<InvestmentGuidePage />} />
        
        {/* Reporting, Alerts & Settings */}
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        
        {/* Admin Governance (Protected by AdminRoute guard) */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPortalPage />
            </AdminRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
