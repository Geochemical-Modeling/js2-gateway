import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { IS_AUTH_DISABLED } from '../config';

/**
 * Component that checks if a user needs onboarding and forces redirect
 * This is placed at the top level to run on every route
 */
function OnboardingCheck() {
  const { isAuthenticated, needsOnboarding, authChecked } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Skip checks if auth is disabled via build configuration
    if (IS_AUTH_DISABLED) return;

    // Only check once auth status is verified
    if (!authChecked) return;

    // If user is authenticated but not onboarded, redirect to onboarding
    // unless they're already on the onboarding page
    if (
      isAuthenticated &&
      needsOnboarding &&
      location.pathname !== '/onboarding'
    ) {
      navigate('/onboarding', { replace: true });
    }
  }, [
    isAuthenticated,
    needsOnboarding,
    authChecked,
    location.pathname,
    navigate,
  ]);

  // This is just a utility component that handles redirects
  // It doesn't render anything visible
  return null;
}

export default OnboardingCheck;
