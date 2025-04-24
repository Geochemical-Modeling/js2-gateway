import { useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function OnboardingRequired() {
  const { isAuthenticated, needsOnboarding, authChecked } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only proceed if auth check is complete
    if (authChecked && isAuthenticated && needsOnboarding) {
      // Don't redirect if already on the onboarding page to avoid loops
      if (location.pathname !== '/onboarding') {
        navigate('/onboarding', { replace: true });
      }
    }
  }, [isAuthenticated, needsOnboarding, authChecked, navigate, location]);

  // If auth is still being checked, don't render anything yet
  if (!authChecked) {
    return null;
  }

  // If user is authenticated and has completed onboarding, render the child routes
  if (isAuthenticated && !needsOnboarding) {
    return <Outlet />;
  }

  // Don't render anything while redirecting to onboarding
  return null;
}

export default OnboardingRequired;
