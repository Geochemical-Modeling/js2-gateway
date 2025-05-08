import React, { useState, useEffect } from 'react';
import { IFormData, IResultData } from './IRateCalculator';

// Define form inputs for the calculator
const calculatorInputs = [
  {
    label: 'Please choose the mineral species for calculation:',
    name: 'species',
    type: 'select',
    required: true,
  },
  {
    label: 'Please enter a temperature (°C):',
    name: 'temp',
    type: 'number',
    required: true,
  },
  {
    label: 'Please enter the pH:',
    name: 'pH',
    type: 'number',
    required: true,
  },
  {
    label: 'Please enter the activity of pFe3+ (optional for some minerals):',
    name: 'feINPUT',
    type: 'number',
    required: false,
  },
  {
    label: 'Please enter the activity of pO2 (optional for some minerals):',
    name: 'oINPUT',
    type: 'number',
    required: false,
  },
  {
    label:
      'Please enter the activity of pCO2/pHCO3- (optional for carbonate minerals):',
    name: 'co2INPUT',
    type: 'number',
    required: false,
  },
];

export default function RateCalculatorOnline() {
  // State for form data and API response
  const [formData, setFormData] = useState({
    species: '',
    temp: '',
    pH: '',
    feINPUT: '',
    oINPUT: '',
    co2INPUT: '',
  });

  // State for available mineral species (will be fetched from API)
  const [speciesArray, setSpeciesArray] = useState([]);

  // State for error handling and results
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle form input changes
  const handleChange = (name, value) => {
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Fetch available mineral species on component mount
  useEffect(() => {
    const fetchSpecies = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/species?query=Species');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const species = (await response.json()).data.species;
        setSpeciesArray(species || []);
      } catch (err) {
        console.error('Error fetching mineral species:', err);
        setError('Failed to load mineral species. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpecies();
  }, []);

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Convert form values to numbers
    const temp = parseFloat(formData.temp);
    const pH = parseFloat(formData.pH);

    // Form validation
    if (isNaN(temp) || isNaN(pH)) {
      setError('Please enter valid numbers for temperature and pH.');
      setIsLoading(false);
      return;
    }

    // Build query parameters
    const params = new URLSearchParams();
    params.append('species', formData.species);
    params.append('temp', formData.temp);
    params.append('pH', formData.pH);

    // Only include optional parameters if they have values
    if (formData.feINPUT) params.append('feINPUT', formData.feINPUT);
    if (formData.oINPUT) params.append('oINPUT', formData.oINPUT);
    if (formData.co2INPUT) params.append('co2INPUT', formData.co2INPUT);

    try {
      const response = await fetch(`/api/rate/calculate?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to calculate rate.');
      }

      const resultData = await response.json();
      setData(resultData);
    } catch (err) {
      console.error('Error calculating rate:', err);
      setError(
        err.message || 'Failed to calculate rate. Please try again later.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      id="main-content"
      className="rvt-layout__wrapper rvt-layout__wrapper--single rvt-container-sm"
    >
      <div className="rvt-layout__content">
        <header>
          <h2 className="rvt-ts-md">GEOCHEMICAL REACTION RATE CALCULATOR</h2>
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
                <p>
                  Zhang YL, Hu B, Teng YG, Zhu C (2019) A library of BASIC
                  scripts of rate equations for geochemical modeling using
                  ᴘʜʀᴇᴇǫᴄ. Computers & Geosciences, v133,{' '}
                  <a
                    href="https://www.sciencedirect.com/science/article/pii/S0098300418311853?via%3Dihub"
                    className="rvt-color-crimson-700"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    DOI
                  </a>
                </p>
              </div>
            </div>
          </div>
        </header>

        <br />

        {/* Display results when available */}
        {data && (
          <div className="rvt-card rvt-card--raised">
            <div className="rvt-card__body">
              <h2 className="rvt-card__title rvt-text-medium">
                Rate Calculator Results
              </h2>
              <div className="rvt-card__content [ rvt-flow ]">
                <div className="rate-result">
                  <h2>Far-from-equilibrium Dissolution Rate</h2>
                  <p>
                    <strong>Reference:</strong> {data.reference}
                  </p>
                  <p>
                    <strong>Species:</strong> {data.species}
                  </p>
                  <p>
                    <strong>Temperature:</strong> {data.temp} °C
                  </p>
                  <p>
                    <strong>pH:</strong> {data.pH}
                  </p>
                  <hr />
                  <p>
                    <strong>AMech:</strong> {data.AMech}
                  </p>
                  <p>
                    <strong>BMech:</strong> {data.BMech}
                  </p>
                  <p>
                    <strong>NMech:</strong> {data.NMech}
                  </p>
                  <p>
                    <strong>OMech:</strong> {data.OMech}
                  </p>
                  <hr />
                  <p>
                    <strong>Far-from-equilibrium dissolution rate:</strong>{' '}
                    {data.total} (<sup>mol</sup>/
                    <sub>
                      s*m<sup>2</sup>
                    </sub>
                    )
                  </p>
                  <p>
                    <strong>
                      Far-from-equilibrium dissolution rate (log):
                    </strong>{' '}
                    {data.logTotal} (<sup>mol</sup>/
                    <sub>
                      s*m<sup>2</sup>
                    </sub>
                    )
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit}>
          {error && (
            <div
              className="rvt-alert rvt-alert--danger [ rvt-m-top-md ]"
              role="alert"
              aria-labelledby="error-alert-title"
              data-rvt-alert="error"
            >
              <div className="rvt-alert__title" id="error-alert-title">
                Error when working with Rate Calculator
              </div>
              <p className="rvt-alert__message">{error}</p>
              <button className="rvt-alert__dismiss" data-rvt-alert-close>
                <span className="rvt-sr-only">Dismiss this alert</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="m3.5 2.086 4.5 4.5 4.5-4.5L13.914 3.5 9.414 8l4.5 4.5-1.414 1.414-4.5-4.5-4.5 4.5L2.086 12.5l4.5-4.5-4.5-4.5L3.5 2.086Z" />
                </svg>
              </button>
            </div>
          )}

          {isLoading && (
            <div className="rvt-flex rvt-justify-content-center rvt-p-tb-xl">
              <div
                className="rvt-loader rvt-loader--md"
                aria-label="Loading..."
              ></div>
            </div>
          )}

          {calculatorInputs.map((input, index) => (
            <div key={index}>
              <label className="rvt-label [ rvt-m-top-md ]">
                {input.label}
                {input.required && <span className="rvt-text-danger">*</span>}
              </label>
              {input.name === 'species' ? (
                <select
                  className="rvt-select"
                  name="species"
                  value={formData.species}
                  onChange={(e) => handleChange('species', e.target.value)}
                  required={input.required}
                  disabled={isLoading || speciesArray.length === 0}
                >
                  <option value="">Select a mineral species</option>
                  {speciesArray.map((species) => (
                    <option key={species} value={species}>
                      {species}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  required={input.required}
                  type={input.type}
                  className="rvt-text-input rvt-validation-info"
                  name={input.name}
                  value={formData[input.name]}
                  onChange={(e) => handleChange(input.name, e.target.value)}
                  disabled={isLoading}
                />
              )}
            </div>
          ))}

          <button
            className="rvt-button rvt-m-top-sm"
            type="submit"
            disabled={
              isLoading || !formData.species || !formData.temp || !formData.pH
            }
          >
            {isLoading ? 'Calculating...' : 'Calculate Rate'}
          </button>
        </form>
      </div>
    </main>
  );
}
