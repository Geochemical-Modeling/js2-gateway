import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Alert from '../../components/Alert';
import './PhreeqcOnline.css';
import { route_map } from '../../constants';

function PhreeqcResults() {
  const { experimentId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [results, setResults] = useState('');
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Use refs to track completion state and avoid stale closures in effects
  const isCompletedRef = useRef(false);
  const timerRef = useRef(null);

  // Memoized fetchStatus function to prevent recreation on each render
  const fetchStatus = useCallback(async () => {
    // Don't fetch if already completed
    if (isCompletedRef.current) {
      return;
    }

    try {
      const response = await fetch(`/api/phreeqc/status/${experimentId}`);
      const data = await response.json();

      setStatus(data.data.status);
      setMessage(data.data.message);

      // If completed, get results once and set completion flag
      if (data.data.status === 'completed') {
        isCompletedRef.current = true;

        // Stop polling by clearing the timer
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }

        // Fetch results once
        fetchResults();
      } else if (
        data.data.status === 'error' ||
        data.data.status === 'timeout'
      ) {
        // Also stop polling on error or timeout
        isCompletedRef.current = true;
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }
    } catch (error) {
      console.error('Error fetching status:', error);
      setError('Failed to fetch job status. Please try again later.');

      // Stop polling on error
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [experimentId]);

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/phreeqc/result/${experimentId}`);
      const data = await response.json();

      if (data.data.results) {
        setResults(data.data.results);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      setError('Failed to fetch results. Please try again later.');
    }
  };

  // Effect for initial fetch and polling setup
  useEffect(() => {
    // Reset completion state when experimentId changes
    isCompletedRef.current = false;

    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Define polling function
    const pollStatus = () => {
      fetchStatus().then(() => {
        // Only set up next poll if not completed
        if (!isCompletedRef.current) {
          timerRef.current = setTimeout(pollStatus, 3000);
        }
      });
    };

    // Start polling
    pollStatus();

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [experimentId, fetchStatus]);

  const handleDownload = () => {
    window.open(`/api/phreeqc/download/${experimentId}`, '_blank');
  };

  const handleClipBoardCopy = () => {
    navigator.clipboard
      .writeText(results)
      .then(() => {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      })
      .catch((err) => {
        console.error('Failed to copy: ' + err);
      });
  };

  const renderStatusInfo = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="rvt-m-top-lg">
            <h2 className="rvt-ts-md">Checking job status...</h2>
            <div className="rvt-loader rvt-loader--md" aria-label="Loading">
              <div className="rvt-loader__segment"></div>
              <div className="rvt-loader__segment"></div>
              <div className="rvt-loader__segment"></div>
              <div className="rvt-loader__segment"></div>
              <div className="rvt-loader__segment"></div>
              <div className="rvt-loader__segment"></div>
              <div className="rvt-loader__segment"></div>
              <div className="rvt-loader__segment"></div>
            </div>
          </div>
        );

      case 'starting':
      case 'running':
        return (
          <div className="rvt-m-top-lg">
            <h2 className="rvt-ts-md">Running PhreeQC calculation...</h2>
            <p>{message}</p>
            <div className="rvt-loader rvt-loader--md" aria-label="Loading">
              <div className="rvt-loader__segment"></div>
              <div className="rvt-loader__segment"></div>
              <div className="rvt-loader__segment"></div>
              <div className="rvt-loader__segment"></div>
              <div className="rvt-loader__segment"></div>
              <div className="rvt-loader__segment"></div>
              <div className="rvt-loader__segment"></div>
              <div className="rvt-loader__segment"></div>
            </div>
            <p className="rvt-m-top-md rvt-ts-xs rvt-color-black-500">
              This may take several minutes depending on the complexity of your
              input file. You can leave this page and come back later using the
              same URL.
            </p>
          </div>
        );

      case 'completed':
        return (
          <div className="rvt-m-top-lg">
            <Alert
              type="success"
              title="Success"
              subtitle="Calculation completed successfully!"
            />

            <div className="rvt-m-top-md">
              <button className="rvt-button" onClick={handleDownload}>
                Download Results
              </button>
            </div>

            {results && (
              <div className="rvt-m-top-lg">
                <h2 className="rvt-ts-md">Phreeqc Results: </h2>
                <pre className="tsv-container">
                  <button className="copy-button" onClick={handleClipBoardCopy}>
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  {results}
                </pre>
              </div>
            )}
          </div>
        );

      case 'error':
      case 'timeout':
        return (
          <div className="rvt-m-top-lg">
            <Alert
              type="error"
              title={
                status === 'timeout'
                  ? 'Calculation timed out (20 minute limit)'
                  : 'Calculation failed'
              }
              subtitle={message}
            />

            <div className="rvt-m-top-md">
              <button
                className="rvt-button"
                onClick={() => navigate(route_map.PHREEQC_ONLINE)}
              >
                Try Again
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="rvt-m-top-lg">
            <Alert
              type="warning"
              title={`Unknown job status: ${status}`}
              subtitle={message}
            />
          </div>
        );
    }
  };

  return (
    <main
      id="main-content"
      className="rvt-layout__wrapper rvt-layout__wrapper--single rvt-container-sm"
    >
      <div className="rvt-layout__content">
        <header>
          <h2 className="rvt-ts-md">PhreeQC Calculation Results</h2>
          <hr />
        </header>

        <p className="rvt-text-bold">Experiment ID: {experimentId}</p>

        {error && <Alert title="Error" subtitle={error} type="error" />}

        {renderStatusInfo()}

        <div className="rvt-m-top-lg">
          <button
            className="rvt-button rvt-button--secondary"
            onClick={() => navigate(route_map.PHREEQC_ONLINE)}
          >
            Back to PhreeQC Online
          </button>
        </div>
      </div>
    </main>
  );
}

export default PhreeqcResults;
