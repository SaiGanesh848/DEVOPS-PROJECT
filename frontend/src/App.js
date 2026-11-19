import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout & Common
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import AllFilesPage from './pages/admin/AllFilesPage';

// Sender Pages
import SenderDashboard from './pages/sender/SenderDashboard';
import FileUploadPage from './pages/sender/FileUploadPage';
import MyFilesPage from './pages/sender/MyFilesPage';
import FileSharePage from './pages/sender/FileSharePage';

// Recipient Pages
import RecipientDashboard from './pages/recipient/RecipientDashboard';
import SharedWithMePage from './pages/recipient/SharedWithMePage';
import DownloadSharePage from './pages/recipient/DownloadSharePage';

// Auditor Pages
import AuditorDashboard from './pages/auditor/AuditorDashboard';
import AuditLogsPage from './pages/auditor/AuditLogsPage';

// Reports Page
import ReportsPage from './pages/reports/ReportsPage';

// Home Redirect Component
const HomeRedirect = () => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingSpinner text="Checking authentication session..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'sender':
      return <Navigate to="/sender/dashboard" replace />;
    case 'recipient':
      return <Navigate to="/recipient/dashboard" replace />;
    case 'auditor':
      return <Navigate to="/auditor/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

// 404 Not Found Component
const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div className="text-center max-w-md">
      <h1 className="text-7xl font-extrabold text-indigo-600">404</h1>
      <h2 className="text-2xl font-bold text-gray-800 mt-2">Page Not Found</h2>
      <p className="text-gray-500 mt-2 text-sm">
        The link you followed may be broken, or the page may have been removed.
      </p>
      <div className="mt-6">
        <a
          href="/"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow"
        >
          Return Home
        </a>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/share/:token" element={<DownloadSharePage />} />

      {/* Default Root Redirect */}
      <Route path="/" element={<HomeRedirect />} />

      {/* Protected Routes inside App Layout */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/files"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AllFilesPage />
            </ProtectedRoute>
          }
        />

        {/* Sender Routes */}
        <Route
          path="/sender/dashboard"
          element={
            <ProtectedRoute allowedRoles={['sender', 'admin']}>
              <SenderDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sender/upload"
          element={
            <ProtectedRoute allowedRoles={['sender', 'admin']}>
              <FileUploadPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sender/files"
          element={
            <ProtectedRoute allowedRoles={['sender', 'admin']}>
              <MyFilesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sender/share"
          element={
            <ProtectedRoute allowedRoles={['sender', 'admin']}>
              <FileSharePage />
            </ProtectedRoute>
          }
        />

        {/* Recipient Routes */}
        <Route
          path="/recipient/dashboard"
          element={
            <ProtectedRoute allowedRoles={['recipient', 'admin']}>
              <RecipientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recipient/shared"
          element={
            <ProtectedRoute allowedRoles={['recipient', 'admin']}>
              <SharedWithMePage />
            </ProtectedRoute>
          }
        />

        {/* Auditor Routes */}
        <Route
          path="/auditor/dashboard"
          element={
            <ProtectedRoute allowedRoles={['auditor', 'admin']}>
              <AuditorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/auditor/logs"
          element={
            <ProtectedRoute allowedRoles={['auditor', 'admin']}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />

        {/* Reports Route (Admin, Auditor) */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['admin', 'auditor']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
