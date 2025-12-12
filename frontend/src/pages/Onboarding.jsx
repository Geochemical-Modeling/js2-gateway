import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import Alert from '../components/Alert';

function Onboarding() {
  const { user, userAuth, completeOnboarding } = useAuth();
  const navigate = useNavigate();

  // Initialize form state with data from CILogon and user database if available
  const [formData, setFormData] = useState({
    name:
      userAuth?.name ||
      user?.name ||
      `${user?.given_name || ''} ${user?.family_name || ''}`.trim(),
    email: userAuth?.email || user?.email || '',
    institution: userAuth?.institution || user?.idp_name || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await completeOnboarding({
        name: formData.name,
        email: formData.email,
        institution: formData.institution,
      });

      if (result.success) {
        setSuccess(true);
        // Redirect to home page after short delay
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setError(result.error || 'Failed to complete onboarding');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main id="main-content" className="rvt-layout__wrapper rvt-container-sm">
      <div className="rvt-layout__content rvt-p-tb-lg">
        <h1 className="rvt-ts-36 rvt-text-center rvt-m-bottom-lg">
          Complete Your Profile
        </h1>
        {success ? (
          <div className="rvt-alert rvt-alert--success rvt-m-bottom-md">
            <div className="rvt-alert__title">Success!</div>
            <p className="rvt-alert__message">
              Your profile has been updated successfully. Redirecting you to the
              dashboard...
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="rvt-alert rvt-alert--danger rvt-m-bottom-md">
                <div className="rvt-alert__title">Error</div>
                <p className="rvt-alert__message">{error}</p>
i              </div>
            )}

            <div className="rvt-box">
              <div className="rvt-box__header">
                <h2 className="rvt-box__title">
                  Welcome to Geochemical Modeling Gateway
                </h2>
              </div>
              <div className="rvt-box__body">
                <p>
                  Please verify or update your information below to complete the
                  registration process.
                </p>

                {/* Render warning message over ehre or something */}
                <Alert
                  className="rvt-m-top-sm rvt-m-bottom-sm"
                  title="Attention: Before you register, please read message below!"
                  subtitle={
                    <ul>
                      <li>
                        If you registered using an identity provider                        (such as Google, GitHub, Microsoft, or a similar service), instead of your institution email, then please note that these accounts are{' '}
                        <strong>unlikely to be approved</strong> unless special
                        circumstances apply.
                      </li>
                      <li>
                        Orchid users (and potentially others) must ensure their
                        email address is set to <strong>public</strong> so that
                        OIDC authentication functions correctly.
                      </li>
                      <li>
                        If you were required to register due to external
                        circumstances or believe your situation warrants an
                        exception, please contact our support team at{' '}
                        <a href="mailto:supcrt@iu.edu">supcrt@iu.edu</a>.
                      </li>
                    </ul>
                  }
                  type="info"
                />

                <form onSubmit={handleSubmit}>
                  <div className="rvt-m-bottom-md">
                    <label className="rvt-label" htmlFor="name">
                      Full Name
                    </label>
                    <input
                      className="rvt-input"
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="rvt-m-bottom-md">
                    <label className="rvt-label" htmlFor="email">
                      Institution Email Address
                    </label>
                    <input
                      className="rvt-input"
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      readOnly
                      disabled
                      required
                    />
                    <small className="rvt-color-neutral-500">
                      This email is provided by your organization and cannot be
                      changed.
                    </small>
                  </div>

                  <div className="rvt-m-bottom-lg">
                    <label className="rvt-label" htmlFor="institution">
                      Institution
                    </label>
                    <input
                      className="rvt-input"
                      type="text"
                      id="institution"
                      name="institution"
                      value={formData.institution}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="rvt-button-group">
                    <button
                      type="submit"
                      className="rvt-button"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Processing...' : 'Complete Profile'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default Onboarding;
