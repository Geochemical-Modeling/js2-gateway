import React, { createContext, useState, useEffect, useContext } from 'react';

// Create the Auth Context
const AuthContext = createContext();

// Custom hook to use the Auth Context
export const useAuth = () => useContext(AuthContext);

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/auth/me', { credentials: 'include' });
        const data = await res.json();

        if (data.status === 'success') {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error checking auth:', err);
        setUser(null);
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, authChecked }}
    >
      {authChecked ? children : null}
    </AuthContext.Provider>
  );
};
