import React, { createContext, useState, useEffect, useContext } from 'react';
import { IS_AUTH_DISABLED, DEV_USER, DEV_USER_AUTH } from './config';

// Create the Auth Context
const AuthContext = createContext();

// Custom hook to use the Auth Context
export const useAuth = () => useContext(AuthContext);

// Simple loading spinner component
const LoadingSpinner = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100%',
    }}
  >
    <div
      style={{
        border: '4px solid rgba(0, 0, 0, 0.1)',
        borderLeft: '4px solid #3498db',
        borderRadius: '50%',
        width: '30px',
        height: '30px',
        animation: 'spin 1s linear infinite',
      }}
    />
    <style jsx>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userAuth, setUserAuth] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // If authentication is disabled in development mode, use mock data
      if (IS_AUTH_DISABLED) {
        console.log('Authentication disabled via build configuration');
        // Set mock authenticated state for development
        setUser(DEV_USER);
        setUserAuth(DEV_USER_AUTH);
        setIsNewUser(false);
        setNeedsOnboarding(false);
        setIsApproved(true);
        setIsPending(false);
        setAuthChecked(true);
        setIsAuthLoading(false);
        return;
      }

      try {
        const res = await fetch('/auth/me', { credentials: 'include' });
        const data = await res.json();

        if (data.status === 'success') {
          setUser(data.user_info);
          setUserAuth(data.user_auth);
          setIsNewUser(data.is_new_user || false);

          // Set user status flags
          setNeedsOnboarding(data.user_auth?.onboarded === 0);
          setIsApproved(data.user_auth?.approved_user === 1);
          setIsPending(
            data.user_auth?.onboarded === 1 &&
              data.user_auth?.approved_user === 0,
          );
        } else {
          setUser(null);
          setUserAuth(null);
          setIsNewUser(false);
          setNeedsOnboarding(false);
          setIsApproved(false);
          setIsPending(false);
        }
      } catch (err) {
        console.error('Error checking auth:', err);
        setUser(null);
        setUserAuth(null);
        setIsNewUser(false);
        setNeedsOnboarding(false);
        setIsApproved(false);
        setIsPending(false);
      } finally {
        setAuthChecked(true);
        setIsAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Function to update user onboarding status
  const completeOnboarding = async (userData) => {
    // If auth is disabled in development, just simulate success
    if (IS_AUTH_DISABLED) {
      console.log('Simulating onboarding completion (auth disabled)');
      setUserAuth({
        ...userAuth,
        ...userData,
        onboarded: 1,
      });
      setNeedsOnboarding(false);
      setIsPending(true);
      return { success: true };
    }

    try {
      const response = await fetch('/api/user/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include',
      });

      const data = await response.json();

      if (data.status === 'success') {
        // Update local state with the newly updated user data
        setUserAuth({
          ...userAuth,
          ...userData,
          onboarded: 1,
        });
        setNeedsOnboarding(false);
        setIsPending(data.user.approved_user === 0);
        setIsApproved(data.user.approved_user === 1);
        return { success: true };
      }
      return { success: false, error: data.message };
    } catch (error) {
      console.error('Error completing onboarding:', error);
      return { success: false, error: 'Failed to complete onboarding process' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userAuth,
        isAuthenticated: IS_AUTH_DISABLED ? true : !!user,
        authChecked,
        isAuthLoading,
        isNewUser,
        needsOnboarding,
        isApproved,
        isPending,
        isAdmin: userAuth?.admin_rights === 1,
        completeOnboarding,
        isAuthDisabled: IS_AUTH_DISABLED,
      }}
    >
      {isAuthLoading ? <LoadingSpinner /> : children}
    </AuthContext.Provider>
  );
};
