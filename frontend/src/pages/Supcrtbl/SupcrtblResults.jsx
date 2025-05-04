import { useEffect, useState, useRef, useCallback } from 'react';
import Alert from '../../components/Alert';
import { useParams, useNavigate } from 'react-router-dom';
import { route_map } from '../../constants';

/**
 * SupcrtblResults:
 *
 * The page for showing the results of the supcrtbl simulation. It'll
 * show the contents of various output files, and it'll also render
 * a link that'll allow the user to download the full zip file containing all
 * the results of their simulation. Since simulations can take a long time, this page
 * uses short polling to achieve near-real time results. Meaning we're making a request every
 * few seconds to see if the simulation has finished and if we have results yet.
 */
export default function SupcrtblResults() {
  /**
   * - experimentId: A string representing the ID of the supcrtbl experiment/simulation that has been run.
   * - status: The status of the request, and after it will represent the status of the experiment that's being queried. This will also act as an error message
   * - message: Represents the corresponding status message associated with the request.
   * - data: Data obtained from supcrtbl. It should be just an array "objects" that represent output files that should be able to be rendered.
   * - results: An array that contains the file data that's given from the resulting experiment.
   * - copied: A short lasting staet to indicate whether the user has copied something or not. So we display the contents of the files in pre tags, and commonly in
   *          pre tags, you have a copy to clipboard button on the top right. So when this state is set to true, it indicates that hte user has successfully copied the
   *          file contents within a given pre tag. Of course since there's the potential to have multiple buttons, we have to do some differentiation.
   * - copiedIndex: The index of the element in data.results array being copied. without this when you click copy, all the buttons
   *                are going to show "copied", instead of just the one that you clicked.
   * - isCompletedRef: This ref is for tracking whether the job is completed. This helps prevent us from setting up the next timeout.
   * - timerRef: Reference to the timer that polls status after each delay. This process is actually recursive.
  */
  const { experimentId } = useParams();
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [data, setData] = useState([]);
  const [copied, setCopied] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(-1);

  // Use refs to track completion state and avoid stale closures in effects
  const isCompletedRef = useRef(false);
  const timerRef = useRef(null);
  const POLLING_INTERVAL = 3000;

  /**
   * Fetches the status of the experiment. Use this when doing frequent polling.
   */
  const fetchStatus = useCallback(async () => {
    // Don't fetch if already completed
    if (isCompletedRef.current) {
      return;
    }

    try {
      const response = await fetch(`/api/supcrtbl/status/${experimentId}`);
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

  /**
   * Fetches the reuslts of the experiment. Call this when the experimnet completed successfully,
   * so when status === 'completed'
   */
  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/supcrtbl/result/${experimentId}`);
      const JSON = await response.json();
      setData(JSON.data);
    } catch (error) {
      console.error('Error fetching results:', error);
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
          timerRef.current = setTimeout(pollStatus, POLLING_INTERVAL);
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

  /**
   * Handles hitting the download endpoint to download the zip file.
   *
   * NOTE: We use an invisible iframe over window.open(uri) because using window
   * will cause the screen to flicker due to the browser opening a new tab or window. As a result
   * it'll briefly reload the page. we can use the hidden iframe to download the files without window
   * flickering.
   */
  const handleDownload = () => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = `/api/supcrtbl/download/${experimentId}`;
    document.body.appendChild(iframe);
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  };

  /**
   * Handles copying content to the clipboard and correctly tracking which element was copied.
   * @param {*} index Index of the file data object being copied into the clipboard.
   * @param {*} content Content of the file being copied into the clipboard.
   */
  const handleClipBoardCopy = (index, content) => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        setCopied(true);
        setCopiedIndex(index);
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
            <h2 className="rvt-ts-md">Running Supcrtbl calculation...</h2>
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
              This may take up to 2 minutes depending on the complexity of your
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
              <button
                className="rvt-button rvt-m-bottom-md"
                onClick={handleDownload}
              >
                Download Results
              </button>
              <div>
                {data && data.length > 0 ? (
                  data.map((file_obj, index) => (
                    <div key={index}>
                      <h3 className="rvt-weight-md">{file_obj.filename}</h3>
                      <pre className="tsv-container">
                        <button
                          className="copy-button"
                          onClick={() => handleClipBoardCopy(index, file_obj.content)}
                        >
                          {/* If the user copied something, and this is the index of the element they copied */}
                          {copied && index === copiedIndex ? 'Copied!' : 'Copy'}
                        </button>
                        {file_obj.content}
                      </pre>
                    </div>
                  ))
                ) : (
                  <p>No output files</p>
                )}
              </div>
            </div>
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
                  ? 'Calculation timed out (2 minute limit)'
                  : 'Calculation failed'
              }
              subtitle={message}
            />

            <div className="rvt-m-top-md">
              <button
                className="rvt-button"
                onClick={() => navigate(route_map.SUPCRTBL_ONLINE)}
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
          <h2 className="rvt-ts-md">Supcrtbl Calculation Results</h2>
          <hr />
        </header>
        <p className="rvt-text-bold">Experiment ID: {experimentId}</p>

        {error && <Alert title="Error" subtitle={error} type="error" />}

        {renderStatusInfo()}

        {/* For each file/object, render the filename and its contents */}
        <div className="rvt-m-top-lg">
          <button
            className="rvt-button rvt-button--secondary"
            onClick={() => navigate(route_map.SUPCRTBL_ONLINE)}
          >
            Back to Supcrtbl Online
          </button>
        </div>
      </div>
    </main>
  );
}
