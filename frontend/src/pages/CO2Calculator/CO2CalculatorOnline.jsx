import React, { useState } from 'react';
import CO2Citation from './CO2Citation';
import CO2Results from './CO2Results';

const calculatorInputs = [
  {
    label: 'Please enter a temperature (K) between 273-533:',
    name: 'temp',
  },
  {
    label: 'Please enter a pressure (bar) between 0-2000:',
    name: 'bar',
  },
  {
    label: 'Please enter NaCl (mol/kgH20) between 0-4.5:',
    name: 'mNaCl',
  },
];

export default function CO2CalculatorOnline() {
  const [formData, setFormData] = useState({
    temp: '',
    bar: '',
    mNaCl: '',
  });
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Convert string data to floats to make the client side validation work
    const temp = parseFloat(formData.temp);
    const bar = parseFloat(formData.bar);
    const mNaCl = parseFloat(formData.mNaCl);

    if (temp < 273 || temp > 533) {
      setError(
        'Temperature is out of bounds: T-P-X range of this model: 273-533 K, 0-2000 bar, 0-4.5 mNaCl!',
      );
      return;
    }
    if (bar < 0 || bar > 2000) {
      setError(
        'Pressure is out of bounds: T-P-X range of this model: 273-533 K, 0-2000 bar, 0-4.5 mNaCl!',
      );
      return;
    }
    if (mNaCl < 0 || mNaCl > 4.5) {
      setError(
        'mNaCl is out of bounds: T-P-X range of this model: 273-533 K, 0-2000 bar, 0-4.5 mNaCl!',
      );
      return;
    }

    try {
      const url = `/api/co2?temp=${temp}&bar=${bar}&mNaCl=${mNaCl}`;
      const response = await fetch(url);
      const JSON = await response.json();
      if (response.ok) {
        // Assuming the data we get is a string that we need to clean
        setData(JSON.data);
        setError(null);
      } else {
        // Handle server-side errors
        setError(JSON.message);
      }
    } catch (err) {
      // Handle network errors
      setError(err.message);
    }
  };

  /**
   * Function that handles updating the state when the input fields change.
   *
   * @param name Name of the input field
   * @param value Value of the associated input field
   */
  const handleChange = (name, value) => {
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  return (
    <main
      id="main-content"
      className="rvt-layout__wrapper rvt-layout__wrapper--single rvt-container-sm"
    >
      <div className="rvt-layout__content">
        {/* Header with meta info and citation*/}
        <header>
          <h2 className="rvt-ts-md">CO2 SOLUBILITY CALCULATOR</h2>
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
                  Duan Z.H., Sun R., Zhu Chen, Chou I-M (2006) An improved model
                  for the calculation of CO2 solubility in aqueous solutions
                  containing Na<sup>+</sup>, K<sup>+</sup>, Ca<sup>2+</sup>, Mg
                  <sup>2+</sup>, Cl<sup>-</sup>, and SO<sub>4</sub>
                  <sup>2-</sup>–<i>Marine Chemistry</i>, Volume 98, Issues 2–4,
                  Pages 131-139.
                  <a
                    href="https://www.sciencedirect.com/science/article/pii/S0304420305001118?via%3Dihub"
                    className="rvt-color-crimson-700"
                  >
                    DOI
                  </a>
                </p>
              </div>
            </div>
          </div>
        </header>

        <br />

        {data && (
          <div className="rvt-card rvt-card--raised">
            <div className="rvt-card__body">
              <h2 className="rvt-card__title rvt-text-medium">
                CO2 Calculator Results
              </h2>
              <div className="rvt-card__content [ rvt-flow ]">
                {/* Show the results here */}
                <div className="co2-result">
                  <h2>CO2 Solubility in Aqueous NaCl Solution</h2>
                  <p>
                    <strong>Reference:</strong> Duan Z, Sun R, Zhu C, Chou I
                    (Marine Chemistry, 2006, v98, 131-139)
                  </p>
                  <p>
                    <strong>T-P-X range of this model:</strong> 273-533 K,
                    0-2000 bar, 0-4.5 mNaCl
                  </p>
                  <p>
                    <strong>Units:</strong> T: K, P(total): bar, mNaCl and mCO2:
                    mol/kgH2O
                  </p>
                  <hr />
                  <table>
                    <thead>
                      <tr>
                        <th>T(K)</th>
                        <th>P(bar)</th>
                        <th>mNaCl(m)</th>
                        <th>mCO2(m)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{data.temp}</td>
                        <td>{data.bar}</td>
                        <td>{data.mNaCl}</td>
                        <td>{data.mCO2}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Input Form  */}
        <form onSubmit={handleSubmit}>
          {error && (
            <div
              class="rvt-alert rvt-alert--danger [ rvt-m-top-md ]"
              role="alert"
              aria-labelledby="error-alert-title"
              data-rvt-alert="error"
            >
              <div class="rvt-alert__title" id="error-alert-title">
                Error when working with CO2 Calculator
              </div>
              <p class="rvt-alert__message">{error}</p>
              <button class="rvt-alert__dismiss" data-rvt-alert-close>
                <span class="rvt-sr-only">Dismiss this alert</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  {' '}
                  <path d="m3.5 2.086 4.5 4.5 4.5-4.5L13.914 3.5 9.414 8l4.5 4.5-1.414 1.414-4.5-4.5-4.5 4.5L2.086 12.5l4.5-4.5-4.5-4.5L3.5 2.086Z" />
                </svg>
              </button>
            </div>
          )}
          {calculatorInputs.map((input) => (
            <div>
              <label className="rvt-label [ rvt-m-top-md ]">
                {input.label}
              </label>
              <input
                required
                type="text"
                id="text-input-info"
                className="rvt-text-input rvt-validation-info"
                name={input.name}
                value={formData[input.name]}
                onChange={(e) => handleChange(input.name, e.target.value)}
              />
            </div>
          ))}
          <button className="rvt-button rvt-m-top-sm" type="submit">
            Submit
          </button>
        </form>
      </div>
    </main>
  );
}
