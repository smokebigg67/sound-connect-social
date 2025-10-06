import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import Layout from '@/components/layout/Layout';
import HomePage from '@/pages/HomePage';
import ExplorePage from '@/pages/ExplorePage';
import ProfilePage from '@/pages/ProfilePage';
import ConnectionsPage from '@/pages/ConnectionsPage';
import NotificationsPage from '@/pages/NotificationsPage';
import SettingsPage from '@/pages/SettingsPage';
import AuthPage from '@/pages/AuthPage';
import NotFoundPage from '@/pages/NotFoundPage';
import InstallPrompt from '@/components/pwa/InstallPrompt';

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const { showInstallPrompt, handleInstall, handleDismiss } = useInstallPrompt();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/auth" element={
          isAuthenticated ? <Navigate to="/" replace /> : <AuthPage />
        } />
        
        <Route element={
          isAuthenticated ? <Layout /> : <Navigate to="/auth" replace />
        }>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/connections" element={<ConnectionsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile/:userId?" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {showInstallPrompt && (
        <InstallPrompt onInstall={handleInstall} onDismiss={handleDismiss} />
      )}
    </>
  );
}

export default App;
