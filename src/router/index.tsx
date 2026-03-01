import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout, TeacherLayout, AdminLayout, PageLoading } from '@/components';
import { useUserStore } from '@/store';

const LoginPage = lazy(() => import('@/pages/Login'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPassword'));
const ProfilePage = lazy(() => import('@/pages/Profile'));
const SettingsPage = lazy(() => import('@/pages/Settings'));
const NotificationsPage = lazy(() => import('@/pages/Notifications'));

const CourseSelectionPage = lazy(() => import('@/pages/student/Courses'));
const MySchedulePage = lazy(() => import('@/pages/student/Schedule'));
const MySelectionsPage = lazy(() => import('@/pages/student/Selections'));

const TeacherCoursesPage = lazy(() => import('@/pages/teacher/Courses'));
const TeacherStudentsPage = lazy(() => import('@/pages/teacher/Students'));
const TeacherSchedulePage = lazy(() => import('@/pages/teacher/Schedule'));
const TeacherReviewsPage = lazy(() => import('@/pages/teacher/Reviews'));

const AdminDashboardPage = lazy(() => import('@/pages/admin/Dashboard'));
const AdminStudentsPage = lazy(() => import('@/pages/admin/Students'));
const AdminTeachersPage = lazy(() => import('@/pages/admin/Teachers'));
const AdminCoursesPage = lazy(() => import('@/pages/admin/Courses'));
const AdminAuditsPage = lazy(() => import('@/pages/admin/Audits'));
const AdminLogsPage = lazy(() => import('@/pages/admin/Logs'));
const AdminSelectionRulesPage = lazy(() => import('@/pages/admin/SelectionRules'));
const AdminReportsPage = lazy(() => import('@/pages/admin/Reports'));
const AdminReviewsPage = lazy(() => import('@/pages/admin/Reviews'));

const AuthGuard = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { isAuthenticated, user } = useUserStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  console.log('AuthGuard - User:', user);
  console.log('AuthGuard - Allowed roles:', allowedRoles);

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const defaultPath = user.role === 'student' ? '/student/courses' 
      : user.role === 'teacher' ? '/teacher/courses' 
      : '/admin/dashboard';
    console.log('AuthGuard - Redirecting to:', defaultPath);
    return <Navigate to={defaultPath} replace />;
  }

  return <>{children}</>;
};

const LoginGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, logout } = useUserStore();

  // 如果访问登录页面，清除之前的登录状态
  React.useEffect(() => {
    if (isAuthenticated && user) {
      console.log('LoginGuard: Clearing previous login state');
      logout();
    }
  }, []);

  if (isAuthenticated && user) {
    const defaultPath = user.role === 'student' ? '/student/courses' 
      : user.role === 'teacher' ? '/teacher/courses' 
      : '/admin/dashboard';
    return <Navigate to={defaultPath} replace />;
  }

  return <>{children}</>;
};

const LoadingFallback = () => <PageLoading />;

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <LoginGuard>
        <Suspense fallback={<LoadingFallback />}>
          <LoginPage />
        </Suspense>
      </LoginGuard>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <ForgotPasswordPage />
      </Suspense>
    ),
  },
  {
    path: '/student',
    element: (
      <AuthGuard allowedRoles={['student']}>
        <MainLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/student/courses" replace /> },
      {
        path: 'courses',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <CourseSelectionPage />
          </Suspense>
        ),
      },
      {
        path: 'schedule',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <MySchedulePage />
          </Suspense>
        ),
      },
      {
        path: 'selections',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <MySelectionsPage />
          </Suspense>
        ),
      },
      {
        path: 'profile',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ProfilePage />
          </Suspense>
        ),
      },
      {
        path: 'notifications',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <NotificationsPage />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <SettingsPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '/teacher',
    element: (
      <AuthGuard allowedRoles={['teacher']}>
        <TeacherLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/teacher/courses" replace /> },
      {
        path: 'courses',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <TeacherCoursesPage />
          </Suspense>
        ),
      },
      {
        path: 'students',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <TeacherStudentsPage />
          </Suspense>
        ),
      },
      {
        path: 'schedule',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <TeacherSchedulePage />
          </Suspense>
        ),
      },
      {
        path: 'reviews',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <TeacherReviewsPage />
          </Suspense>
        ),
      },
      {
        path: 'profile',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ProfilePage />
          </Suspense>
        ),
      },
      {
        path: 'notifications',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <NotificationsPage />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <SettingsPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '/admin',
    element: (
      <AuthGuard allowedRoles={['admin', 'superAdmin']}>
        <AdminLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <AdminDashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'students',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <AdminStudentsPage />
          </Suspense>
        ),
      },
      {
        path: 'teachers',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <AdminTeachersPage />
          </Suspense>
        ),
      },
      {
        path: 'courses',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <AdminCoursesPage />
          </Suspense>
        ),
      },
      {
        path: 'audits',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <AdminAuditsPage />
          </Suspense>
        ),
      },
      {
        path: 'logs',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <AdminLogsPage />
          </Suspense>
        ),
      },
      {
        path: 'selection-rules',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <AdminSelectionRulesPage />
          </Suspense>
        ),
      },
      {
        path: 'reports',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <AdminReportsPage />
          </Suspense>
        ),
      },
      {
        path: 'reviews',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <AdminReviewsPage />
          </Suspense>
        ),
      },
      {
        path: 'profile',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ProfilePage />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <SettingsPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);

export default router;
