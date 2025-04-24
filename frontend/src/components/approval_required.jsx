import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import LoginRequired from './login_required';

/**
 * Higher-order component that ensures users are both authenticated and approved
 * before they can access protected routes. Redirects unapproved users to a
 * pending approval page.
 */
function ApprovalRequired() {
  const { isAuthenticated, isApproved, isPending, authChecked } = useAuth();

  // Show nothing while authentication is being checked
  if (!authChecked) {
    return null;
  }

  // If the user is not authenticated, redirect to home page
  if (!isAuthenticated) {
    return (
      <main
        id="main-content"
        className="rvt-layout__wrapper rvt-layout__wrapper--single rvt-container-sm"
      >
        <div className="rvt-layout__content">
          <div className="rvt-box rvt-box--card">
            <div className="rvt-box__header">
              <h2 className="rvt-box__title">Please Sign In</h2>
            </div>
            <div className="rvt-box__body">
              <div
                className="rvt-alert rvt-alert--warning rvt-m-bottom-md"
                role="alert"
              >
                <div className="rvt-alert__title">
                  You must be signed in to access this page
                </div>
                <p className="rvt-alert__message">
                  Thank you for your interest in our tools. Please sign in to
                  your account to access the application tools. You may need to
                  wait for administrator approval before you can use the tools.
                </p>
              </div>
              <p>
                In the meantime, you won't be able to access the application
                tools. If you believe this is an error, please contact our
                support team.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // If the user is authenticated but not approved, show the pending page
  if (isPending) {
    return (
      <main
        id="main-content"
        className="rvt-layout__wrapper rvt-layout__wrapper--single rvt-container-sm"
      >
        <div className="rvt-layout__content">
          <div className="rvt-box rvt-box--card">
            <div className="rvt-box__header">
              <h2 className="rvt-box__title">Account Pending Approval</h2>
            </div>
            <div className="rvt-box__body">
              <div
                className="rvt-alert rvt-alert--warning rvt-m-bottom-md"
                role="alert"
              >
                <div className="rvt-alert__title">
                  Your account is awaiting approval
                </div>
                <p className="rvt-alert__message">
                  Thank you for registering. Your account is currently pending
                  administrator approval. You will receive an email notification
                  when your account is approved.
                </p>
              </div>
              <p>
                In the meantime, you won't be able to access the application
                tools. If you believe this is an error or if it's been a while
                since you registered, please contact our support team.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // If the user is approved, render the protected content
  return <Outlet />;
}

export default ApprovalRequired;
