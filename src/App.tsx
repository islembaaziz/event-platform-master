import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AuthGuard from './components/auth/AuthGuard';
import PageLoader from './components/common/PageLoader';

// Lazy-loaded components
const LandingPage = lazy(() => import('./pages/public/LandingPage'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const EventEditor = lazy(() => import('./pages/editor/EventEditor'));
const MediaManager = lazy(() => import('./pages/media/MediaManager'));
const PublicationsManager = lazy(() => import('./pages/publications/PublicationsManager'));
const PublicationEditor = lazy(() => import('./pages/publications/PublicationEditor'));
const Statistics = lazy(() => import('./pages/statistics/Statistics'));
const Settings = lazy(() => import('./pages/settings/Settings'));
const EventPreview = lazy(() => import('./pages/public/EventPreview'));
const EventsList = lazy(() => import('./pages/events/EventsList'));
const UserManagement = lazy(() => import('./pages/users/UserManagement'));

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#2a2a2a',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/events/:eventId" element={<EventPreview />} />
          
          {/* Protected routes - require authentication */}
          <Route element={<AuthGuard />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/events" element={<EventsList />} />
            <Route path="/editor/:eventId" element={<EventEditor />} />
            <Route path="/media" element={<MediaManager />} />
            <Route path="/publications" element={<PublicationsManager />} />
            <Route path="/publications/new" element={<PublicationEditor />} />
            <Route path="/publications/edit/:id" element={<PublicationEditor />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

export default App