import React, { createContext, useState, useEffect, useContext } from 'react';
import { IS_AUTH_DISABLED, DEV_USER, DEV_USER_AUTH } from './config';

// Create the Auth Context
const AuthContext = createContext();

// Custom hook to use the Auth Context
export const useAuth = () => useContext(AuthContext);

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userAuth, setUserAuth] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

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
        setAuthChecked(true);
        return;
      }

      try {
        const res = await fetch('/auth/me', { credentials: 'include' });
        const data = await res.json();

        if (data.status === 'success') {
          setUser(data.user_info);
          setUserAuth(data.user_auth);
          setIsNewUser(data.is_new_user || false);
          // Set needs onboarding flag if user has not completed onboarding
          setNeedsOnboarding(data.user_auth?.onboarded === 0);
        } else {
          setUser(null);
          setUserAuth(null);
          setIsNewUser(false);
          setNeedsOnboarding(false);
        }
      } catch (err) {
        console.error('Error checking auth:', err);
        setUser(null);
        setUserAuth(null);
        setIsNewUser(false);
        setNeedsOnboarding(false);
      } finally {
        setAuthChecked(true);
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
        isNewUser,
        needsOnboarding,
        completeOnboarding,
        isAuthDisabled: IS_AUTH_DISABLED,
      }}
    >
      {authChecked ? children : null}
    </AuthContext.Provider>
  );
};
