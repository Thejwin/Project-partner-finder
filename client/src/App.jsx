import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './config/queryClient';

// Contexts
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';

// Layout
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { ToastContainer } from './components/ui/Toast';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import {
  DashboardPage,
  ProjectsPage,
  ProjectWorkspacePage,
  TaskBoardPage,
  ChatPage,
  NotificationsPage,
  ProfilePage,
  UserProfilePage,
  FriendsPage,
} from './pages';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <QueryClientProvider client={queryClient}>
            <NotificationProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected routes wrapped in AppShell layout */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppShell />}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/projects" element={<ProjectsPage />} />
                    <Route path="/projects/:projectId" element={<ProjectWorkspacePage />} />
                    <Route path="/projects/:projectId/tasks" element={<TaskBoardPage />} />
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="/chat/:friendshipId" element={<ChatPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/users/:userId" element={<UserProfilePage />} />
                    <Route path="/friends" element={<FriendsPage />} />
                  </Route>
                </Route>
              </Routes>
              <ToastContainer />
            </NotificationProvider>
          </QueryClientProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
