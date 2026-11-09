import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requireOnboarding = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading">Loading AutoReel…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireOnboarding && !user.preferences?.onboardingComplete)
    return <Navigate to="/onboarding" replace />;
  return children;
}