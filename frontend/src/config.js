/**
 * Application configuration that's determined at build time or runtime
 */

// Check if running in development mode based on URL or localStorage
// This can be toggled without rebuilding the application
const isDevelopmentHost =
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === 'localhost';

// Check for a localStorage flag that can be toggled in the browser console
const devModeManuallyEnabled = localStorage.getItem('devMode') === 'true';

// Whether authentication should be bypassed for development
// Can be enabled by:
// 1. Running on localhost
// 2. Setting localStorage.devMode = 'true' in the browser console
export const IS_AUTH_DISABLED = isDevelopmentHost || devModeManuallyEnabled;

// To enable dev mode in browser console: localStorage.setItem('devMode', 'true')
// To disable dev mode in browser console: localStorage.setItem('devMode', 'false')
if (IS_AUTH_DISABLED) {
  console.log(`Auth bypass 'ENABLED'`);
}

// Mock user data for development when auth is disabled
export const DEV_USER = {
  email: 'dev@example.com',
  name: 'Development User',
  given_name: 'Development',
  family_name: 'User',
};

export const DEV_USER_AUTH = {
  id: 999,
  email: 'dev@example.com',
  name: 'Development User',
  institution: 'Development Institution',
  approved_user: 1,
  admin_rights: 1,
  onboarded: 1,
};
