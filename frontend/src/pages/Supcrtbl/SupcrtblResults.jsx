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
   * - status: The status of the request, and after it will represent the status of the experiment that's being queried.
   * - message: Represents the corresponding status message associated with the request.
   * - data: Data obtained from supcrtbl. It should be just an array "objects" that represent output files that should be able to be rendered.
   * - results: An array that contains the file data that's given from the resulting experiment.
   * - error: Error message string
   * - copied: A short lasting staet to indicate whether the user has copied something or not. So we display the contents of the files in pre tags, and commonly in
   *          pre tags, you have a copy to clipboard button on the top right. So when this state is set to true, it indicates that hte user has successfully copied the
   *          file contents within a given pre tag. Of course since there's the potential to have multiple buttons, we have to do some differentiation.
   * - copiedIndex: The index of the element in data.results array being copied. without this when you click copy, all the buttons
   *                are going to show "copied", instead of just the one that you clicked.
   * - isCompletedRef: A reference to a boolean. So the idea is that we want to keep polling the backend for the status of the experiment, until we get confirmation
   *                   that the simulation is confirmed to not be running anymore, meaning it has finished somehow. Once we know this, we can set this boolean to true
   *                  in order to stop polling as we don't want to bother the server anymore. You could achieve this in other ways, but using a reference makes things very clear and readable.
   * - timerRef: Polling requires the client to make requests frequently. To achieve this, the component has a reference to a setTimeout, so basically after an x amount of seconds, we'll
   *            call a fetch function fetchResults() to get our data.
   */
  const { experimentId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [data, setData] = useState([]);
  const [copied, setCopied] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(-1);
  const isCompletedRef = useRef(false);
  const timerRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    /**
     * Here we define and memoize a function, so that it's not reconstructed on every re-render. fetchStatus()
     * will query the backend for the status on the simulation, updating state and references whilst doing so.
     *
     * Essentially if the simulation is in a "finished" state, e.g. completed, error, or timeout, then we'll
     * fetch the data from that simulation and also make sure that we stop polling by setting the isCompletedRef to true.
     *
     * The reason that we memoize the creation of the function itself is because this allows us to
     * call the function within useState, infinitely triggering the effect.
     *
     */
    if (isCompletedRef.current) {
      return;
    }
    try {
      const response = await fetch(`/api/supcrtbl/status/${experimentId}`);
      const json = await response.json();

      setStatus(json.data.status);
      setMessage(json.data.message);

      // If the simulation is still running, early return
      if (json.data.status === 'running') {
        return;
      }

      // At this point, the status could be completed, error, or timeout. Regardless it's in
      // a finished state, so we want to set the ref to stop polling and clean up our timer reference.
      // Only if the simulation completed successfully, we'll fetch the simulation data!
      isCompletedRef.current = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (json.data.status === 'completed') {
        fetchResults();
      }
    } catch (error) {
      console.error('Error fetching status:', error);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [experimentId]);

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/supcrtbl/result/${experimentId}`);
      const JSON = await response.json();
      setData(JSON.data);
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  /**
   * This effect clears the previous setTimeout reference, if it even exists, and then sets a new timeout, allowing the fetch to be called after a few seconds.
   * The effect also resets isCompleteRef.current to false, to indicate that this is a blank slate and new request, allowing our client to actually make a request, and
   * not make it think that the simulation has already been complete. So it's the first render that matters and actually does the work.
   *
   * Then after, every 3 seconds, pollStatus calls itself, to fetch data, fetch data may modify some refs and states. If isCompleted is still false, then
   * we create a setTimeout on pollStatus again, akin to a recursive function.
   */
  useEffect(() => {
    isCompletedRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const pollStatus = () => {
      fetchStatus().then(() => {
        if (!isCompletedRef.current) {
          timerRef.current = setTimeout(pollStatus, 3000);
        }
      });
    };
    pollStatus();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [experimentId, fetchStatus]);

  const handleDownload = () => {
    // Downloads the file
    window.open(`/api/supcrtbl/download/${experimentId}`, '_blank');
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
                {data &&
                  data.map((file_obj, index) => (
                    <div>
                      <h3 className="rvt-weight-md">{file_obj.filename}</h3>
                      <pre className="tsv-container">
                        <button
                          className="copy-button"
                          onClick={() =>
                            handleClipBoardCopy(index, file_obj.content)
                          }
                        >
                          {/* If the user copied something, and this is the index of the element they copied */}
                          {copied && index == copiedIndex ? 'Copied!' : 'Copy'}
                        </button>
                        {file_obj.content}
                      </pre>
                    </div>
                  ))}
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
