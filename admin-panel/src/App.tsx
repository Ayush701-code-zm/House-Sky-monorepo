import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/layout/Layout';

import { LoginPage } from './pages/LoginPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { MLMTreePage } from './pages/MLMTreePage';
import { ProjectsPage } from './pages/ProjectsPage';
import { PlotManagementPage } from './pages/PlotManagementPage';
import { CommissionsPage } from './pages/CommissionsPage';
import { PayoutsPage } from './pages/PayoutsPage';
import { OCRAnalyzerPage } from './pages/OCRAnalyzerPage';
import { ReportsPage } from './pages/ReportsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AIKnowledgePage } from './pages/AIKnowledgePage';
import { LeadsInquiriesPage } from './pages/LeadsInquiriesPage';
import { PropertiesPage } from './pages/PropertiesPage';
import { JoinAgentPage } from './pages/JoinAgentPage';
import { InviteAgentsPage } from './pages/InviteAgentsPage';
import { AgentKycPage } from './pages/AgentKycPage';
import { KycReviewPage } from './pages/KycReviewPage';
import { GalleryPage } from './pages/GalleryPage';
import { CitiesPage } from './pages/CitiesPage';
import { BulkDealsPage } from './pages/BulkDealsPage';
import { BulkDealRequestsPage } from './pages/BulkDealRequestsPage';
import { BookingsPage } from './pages/BookingsPage';
import { AgentHomePage } from './pages/agent/AgentHomePage';
import { PlotAvailabilityPage } from './pages/agent/PlotAvailabilityPage';
import { BookingFormPage } from './pages/agent/BookingFormPage';
import {
  TeamSalesPage, CollectionPage, YearlyPlanPage, MyCommissionPage, MembersPage,
  EstimatePage, ReceiptPage, CancelPlotPage, CustomerDocsPage, SearchExecutivePage,
  ProfilePage, BankPage, IdCardPage, PasswordPage
} from './pages/agent/AgentToolsPages';

const ADMIN_ROLES = ['ADMIN', 'DIRECTOR'];
const STAFF_ROLES = ['ADMIN', 'DIRECTOR', 'MANAGER'];

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean; roles?: string[] }> = ({
  children,
  adminOnly,
  roles
}) => {
  const { token, user } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  const isAdmin = !!user && ADMIN_ROLES.includes(user.role);
  const fallback = isAdmin ? '/dashboard' : '/agent';
  if (adminOnly && !isAdmin) {
    return <Navigate to={fallback} replace />;
  }
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to={fallback} replace />;
  }
  return <Layout>{children}</Layout>;
};

const HomeRedirect: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = !!user && ADMIN_ROLES.includes(user.role);
  return <Navigate to={isAdmin ? '/dashboard' : '/agent'} replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/join/:code" element={<JoinAgentPage />} />
            <Route path="/dashboard" element={<ProtectedRoute adminOnly><DashboardPage /></ProtectedRoute>} />
            <Route path="/inquiries" element={<ProtectedRoute><LeadsInquiriesPage /></ProtectedRoute>} />
            <Route path="/employees" element={<ProtectedRoute><EmployeesPage /></ProtectedRoute>} />
            <Route path="/invite" element={<ProtectedRoute><InviteAgentsPage /></ProtectedRoute>} />
            <Route path="/kyc" element={<ProtectedRoute><AgentKycPage /></ProtectedRoute>} />
            <Route path="/kyc-review" element={<ProtectedRoute roles={STAFF_ROLES}><KycReviewPage /></ProtectedRoute>} />
            <Route path="/mlm-tree" element={<ProtectedRoute><MLMTreePage /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute adminOnly><ProjectsPage /></ProtectedRoute>} />
            <Route path="/properties" element={<ProtectedRoute adminOnly><PropertiesPage /></ProtectedRoute>} />
            <Route path="/bulk-deals-management" element={<ProtectedRoute roles={STAFF_ROLES}><BulkDealsPage /></ProtectedRoute>} />
            <Route path="/bulk-deal-requests" element={<ProtectedRoute roles={STAFF_ROLES}><BulkDealRequestsPage /></ProtectedRoute>} />
            <Route path="/gallery-management" element={<ProtectedRoute roles={STAFF_ROLES}><GalleryPage /></ProtectedRoute>} />
            <Route path="/cities" element={<ProtectedRoute roles={STAFF_ROLES}><CitiesPage /></ProtectedRoute>} />
            <Route path="/plots" element={<ProtectedRoute><PlotManagementPage /></ProtectedRoute>} />
            <Route path="/bookings" element={<ProtectedRoute adminOnly><BookingsPage /></ProtectedRoute>} />
            <Route path="/agent" element={<ProtectedRoute><AgentHomePage /></ProtectedRoute>} />
            <Route path="/agent/plots" element={<ProtectedRoute><PlotAvailabilityPage /></ProtectedRoute>} />
            <Route path="/agent/team-sales" element={<ProtectedRoute><TeamSalesPage /></ProtectedRoute>} />
            <Route path="/agent/collection" element={<ProtectedRoute><CollectionPage /></ProtectedRoute>} />
            <Route path="/agent/yearly-plan" element={<ProtectedRoute><YearlyPlanPage /></ProtectedRoute>} />
            <Route path="/agent/commission" element={<ProtectedRoute><MyCommissionPage /></ProtectedRoute>} />
            <Route path="/agent/members" element={<ProtectedRoute><MembersPage /></ProtectedRoute>} />
            <Route path="/agent/estimate" element={<ProtectedRoute><EstimatePage /></ProtectedRoute>} />
            <Route path="/agent/booking" element={<ProtectedRoute><BookingFormPage /></ProtectedRoute>} />
            <Route path="/agent/receipt" element={<ProtectedRoute><ReceiptPage /></ProtectedRoute>} />
            <Route path="/agent/cancel" element={<ProtectedRoute><CancelPlotPage /></ProtectedRoute>} />
            <Route path="/agent/customer-docs" element={<ProtectedRoute><CustomerDocsPage /></ProtectedRoute>} />
            <Route path="/agent/search" element={<ProtectedRoute><SearchExecutivePage /></ProtectedRoute>} />
            <Route path="/agent/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/agent/bank" element={<ProtectedRoute><BankPage /></ProtectedRoute>} />
            <Route path="/agent/id-card" element={<ProtectedRoute><IdCardPage /></ProtectedRoute>} />
            <Route path="/agent/password" element={<ProtectedRoute><PasswordPage /></ProtectedRoute>} />

            <Route path="/plot-maps" element={<Navigate to="/plots" replace />} />
            <Route path="/commissions" element={<ProtectedRoute roles={STAFF_ROLES}><CommissionsPage /></ProtectedRoute>} />
            <Route path="/payouts" element={<ProtectedRoute><PayoutsPage /></ProtectedRoute>} />
            <Route path="/ocr-analyzer" element={<ProtectedRoute adminOnly><OCRAnalyzerPage /></ProtectedRoute>} />
            <Route path="/ai-knowledge" element={<ProtectedRoute adminOnly><AIKnowledgePage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute adminOnly><ReportsPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute adminOnly><SettingsPage /></ProtectedRoute>} />

            <Route path="*" element={<HomeRedirect />} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
