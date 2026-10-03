import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence } from 'framer-motion'
import SplashScreen from './components/ui/SplashScreen'

import RoleRouter from './components/layouts/RoleRouter'
import ProtectedRoute from './components/layouts/ProtectedRoute'
import StudentLayout from './components/layouts/StudentLayout'
import SupervisorLayout from './components/layouts/SupervisorLayout'
import AdminLayout from './components/layouts/AdminLayout'

import LoginPage from './features/auth/LoginPage'
import RegisterPage from './features/auth/RegisterPage'
import SetupPage from './features/admin/SetupPage'

import StudentDashboardPage from './features/student/DashboardPage'
import StudentProfileSetupPage from './features/student/ProfileSetupPage'
import StudentBrowsePage from './features/student/BrowsePage'
import StudentProjectDetailPage from './features/student/ProjectDetailPage'
import StudentGroupPage from './features/student/GroupPage'
import StudentRecommendationsPage from './features/ai/RecommendationsPage'
import StudentMilestonePage from './features/student/MilestonePage'
import StudentNotificationsPage from './features/shared/NotificationsPage'

import SupervisorDashboardPage from './features/supervisor/DashboardPage'
import SupervisorUploadPage from './features/supervisor/UploadPage'
import SupervisorRequestsPage from './features/supervisor/RequestsPage'
import SupervisorMonitorPage from './features/supervisor/MonitorPage'

import AdminDashboardPage from './features/admin/DashboardPage'
import AdminUserManagementPage from './features/admin/UserManagementPage'
import AdminConfigPage from './features/admin/ConfigPage'

export default function App() {
  const [showSplash, setShowSplash] = useState(true)

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && <SplashScreen key="splash" onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>

      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<RoleRouter />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/setup" element={<SetupPage />} />

        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentLayout>
                <StudentDashboardPage />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/profile-setup"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentLayout>
                <StudentProfileSetupPage />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/browse"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentLayout>
                <StudentBrowsePage />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/project/:id"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentLayout>
                <StudentProjectDetailPage />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/group"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentLayout>
                <StudentGroupPage />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/ai"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentLayout>
                <StudentRecommendationsPage />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/milestones"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentLayout>
                <StudentMilestonePage />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/notifications"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentLayout>
                <StudentNotificationsPage />
              </StudentLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/supervisor/dashboard"
          element={
            <ProtectedRoute allowedRoles={['supervisor']}>
              <SupervisorLayout>
                <SupervisorDashboardPage />
              </SupervisorLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor/upload"
          element={
            <ProtectedRoute allowedRoles={['supervisor']}>
              <SupervisorLayout>
                <SupervisorUploadPage />
              </SupervisorLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor/requests"
          element={
            <ProtectedRoute allowedRoles={['supervisor']}>
              <SupervisorLayout>
                <SupervisorRequestsPage />
              </SupervisorLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor/monitor"
          element={
            <ProtectedRoute allowedRoles={['supervisor']}>
              <SupervisorLayout>
                <SupervisorMonitorPage />
              </SupervisorLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <AdminDashboardPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <AdminUserManagementPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/config"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <AdminConfigPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}
