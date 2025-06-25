import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageLoader from '../common/PageLoader';

const AuthGuard = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  console.log('AuthGuard check:', { isAuthenticated, loading, user: user?.email, role: user?.role });

  if (loading) {
    console.log('AuthGuard: Still loading...');
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    console.log('AuthGuard: Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('AuthGuard: Authenticated, allowing access');
  return <Outlet />;
};

export default AuthGuard;