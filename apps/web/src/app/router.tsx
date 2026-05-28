import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './Layout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '@/features/auth/components/LoginPage';
import { RegisterPage } from '@/features/auth/components/RegisterPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ExpensesPage } from '@/features/expenses/components/ExpensesPage';
import { GroupsPage } from '@/features/groups/components/GroupsPage';
import { GroupDetailPage } from '@/features/groups/components/GroupDetailPage';
import { SettlementsPage } from '@/features/settlements/components/SettlementsPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { Navigate } from 'react-router-dom';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/expenses', element: <ExpensesPage /> },
          { path: '/groups', element: <GroupsPage /> },
          { path: '/groups/:id', element: <GroupDetailPage /> },
          { path: '/settlements', element: <SettlementsPage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/', element: <Navigate to="/dashboard" replace /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
