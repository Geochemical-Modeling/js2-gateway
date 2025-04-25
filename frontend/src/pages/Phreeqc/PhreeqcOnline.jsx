import { useState } from 'react';
import './PhreeqcOnline.css';
import Alert from '../../components/Alert';
import FileInput from '../../components/FileInput';

const databaseOptionList = [
  'geothermal.dat',
  'geothermal-ree.dat',
  'diagenesis.dat',
  'bl-0.5kb.dat',
  'bl-1kb.dat',
  'bl-2kb.dat',
  'bl-2kb-ree.dat',
  'bl-5kb.dat',
  'llnl-kinetics.dat',
];

const phreeqc_url = '/api/phreeqc';

export default function PhreeqcOnline() {
  const [formData, setFormData] = useState({
    inputFile: '',
    outputFileName: '',
    selectedDataOption: 'custom', // default radio
    customDataFile: null,
    dataFileChoice: databaseOptionList[0],
  });

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    results: null,
    experiment_id: null,
  });

  let experimentDownloadUrl = null;
  if (data.experiment_id) {
    experimentDownloadUrl = `${phreeqc_url}/download/${data.experiment_id}`;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitData = new FormData();
    submitData.append('inputFile', formData.inputFile);
    submitData.append('outputFileName', formData.outputFileName);

    // If the user picked to upload a custom data file, then create a field for it.
    if (formData.customDataFile) {
      submitData.append('customDataFile', formData.customDataFile);
    } else {
      // Else the user picked to select the name of some data file
      submitData.append('dataFileChoice', formData.dataFileChoice);
    }

    try {
      const response = await fetch(phreeqc_url, {
        method: 'POST',
        body: submitData,
      });
      const JSON = await response.json();
      if (!response.ok) {
        // Render the server side error
        setError(JSON.message);
        return;
      }
      let data = JSON.data;
      data.results = data.results
        .replace(/\\t/g, '\t')
        .replace('/\\n/g', '\n')
        .trim();

      setData(data);
    } catch (err) {
      // Set the error state here for that network error or something else
      setError(err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const name = e.target.name;
    setFormData((prev) => ({ ...prev, [name]: e.target.files[0] }));
  };

  const handleClipBoardCopy = () => {
    navigator.clipboard
      .writeText(data.results)
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

  return (
    <main
      id="main-content"
      className="rvt-layout__wrapper rvt-layout__wrapper--single rvt-container-sm"
    >
      <div className="rvt-layout__content">
        {/* Header and Citation */}
        <header>
          <h2 className="rvt-ts-md">PHREEQC High Temperature Pressure.</h2>
          <hr />
          <div className="rvt-card rvt-card--raised">
            <div className="rvt-card__body">
              <h2
                className="rvt-card__title"
                style={{ fontWeight: 'bold', color: '#343a40' }}
              >
                Acknowledgment and Citation
              </h2>
              <h3 style={{ fontStyle: 'italic', color: '#6c757d' }}>
                Users please cite this
              </h3>
              <div className="rvt-card__content [ rvt-flow ]">
                Zhang G.R., Lu P., Zhang Y.L., Tu K., Zhu C. (2020) SupPHREEQC:
                A program to generate customized PHREEQC thermodynamic database
                based on Supcrtbl. <i>Computer and Geosciences</i>
                v143.{' '}
                <a
                  href="https://www.sciencedirect.com/science/article/abs/pii/S0098300420305501?via%3Dihub"
                  className="rvt-color-crimson-700"
                >
                  <b>DOI</b>
                </a>
                <br />
                <br />
                Lu P, Zhang GR, Apps J, *Zhu C. (2022) Comparison of
                thermodynamic data files for PHREEQC. Earth-Science Reviews,
                <a
                  href="https://doi.org/10.1016/j.earscirev.2021.103888"
                  className="rvt-color-crimson-700"
                >
                  <b>DOI</b>
                </a>
                .
              </div>
            </div>
          </div>
        </header>

        {/* Small disclaimer */}
        <p className="text-bold">
          {'('}Please note: User-generated files with names containing spaces or
          special characters will not be accepted{')'}
        </p>

        {/* Results section */}
        {data.results && (
          <div>
            <h2 className="rvt-ts-md">Phreeqc Results: </h2>
            <a href={experimentDownloadUrl}>Download Experiment Files</a>
            <pre className="tsv-container">
              <button className="copy-button" onClick={handleClipBoardCopy}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
              {data.results}
            </pre>
          </div>
        )}

        {/* Error section */}
        {error && (
          <Alert
            title="Error working with Phreeqc"
            subtitle={error}
            type="error"
          />
        )}

        <br />

        {/* Input form */}
        <form
          onSubmit={handleSubmit}
          className="rvt-flex rvt-flex-column rvt-gap-md rvt-items-start"
        >
          <FileInput
            accept=".pqi"
            legend="Input file"
            label="Upload file"
            id="input-file"
            onChange={handleFileChange}
            name="inputFile"
          />

          {/* Input for the name of the output file */}
          <div>
            <label htmlFor="text-input-default" className="rvt-label">
              Name of the output file{' '}
              <span className="rvt-color-orange-500 rvt-text-bold">*</span>
            </label>
            <input
              type="text"
              id="text-input-default"
              className="rvt-text-input"
              name="outputFileName"
              minLength={3}
              maxLength={16}
              required
              value={formData.outputFileName}
              onChange={handleInputChange}
            />
          </div>

          {/* Database file choice input */}
          <fieldset className="rvt-fieldset">
            {/* You need to make this required */}
            <legend className="rvt-text-bold">Database File</legend>
            <ul className="rvt-list-plain">
              <li>
                <div className="rvt-radio">
                  <input
                    type="radio"
                    name="selectedDataOption"
                    id="datFile-1"
                    value="custom"
                    checked={formData.selectedDataOption == 'custom'}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="datFile-1">Upload custom database file</label>
                </div>
              </li>
              <li>
                <div className="rvt-radio">
                  <input
                    type="radio"
                    name="selectedDataOption"
                    id="datFile-2"
                    value="existing"
                    checked={formData.selectedDataOption == 'existing'}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="datFile-2">Use existing database file</label>
                </div>
              </li>
            </ul>
          </fieldset>

          {/* 
          - If user wants to upload a custom database file, render the file input
          - If user wants to select a given database file, render the list of choices
          */}
          {formData.selectedDataOption === 'custom' ? (
            <FileInput
              legend="Custom data file"
              label="Upload file"
              required
              id="custom-data-file"
              onChange={handleFileChange}
              name="customDataFile"
              accept=".dat"
            />
          ) : formData.selectedDataOption === 'existing' ? (
            <div>
              <label htmlFor="select-input-default" className="rvt-label">
                Select a database:
              </label>
              <select
                id="select-input-default"
                className="rvt-select"
                name="dataFileChoice"
                defaultValue={formData.dataFileChoice}
                onChange={handleInputChange}
              >
                {databaseOptionList.map((el, index) => (
                  <option key={index} value={el}>
                    {el}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <></>
          )}
          <button className="rvt-button" type="submit">
            SUBMIT
          </button>
        </form>
      </div>
    </main>
  );
}
