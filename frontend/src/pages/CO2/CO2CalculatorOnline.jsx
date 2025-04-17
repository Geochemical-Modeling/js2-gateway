import React, { useState } from "react"
import CO2Citation from "./CO2Citation";

const calculatorInputs = [
  {
    label: "Please enter a temperature (K) between 273-533:",
    name: "temp",
  },
  {
    label: "Please enter a pressure (bar) between 0-2000:",
    name: "bar",
  },
  {
    label: "Please enter NaCl (mol/kgH20) between 0-4.5:",
    name: "mNaCl",
  },
];

export default function CO2CalculatorOnline() {
  const [formData, setFormData] = useState({
    temp: "",
    bar: "",
    mNaCl: "",
  });
  const [error, setError] = useState(null)
  
  // Data from the CO2 Calculator 
  // NOTE: The temp, var, and mNaCl should match their counterparts in formData 
  // relative to the time we actually submitted the form.
  const [data, setData] = useState(null)

  const handleCleanData = (data) => {
    // Clean the data by trimming whitespace and splitting by spaces
    // NOTE: The binary from CO2 Calculator likely returns a string like this:
    // T(K)        P(bar)      mNaCl(m)  mCO2(m)   
    // 300.000    1586.0000    4.1000    1.7442
    
    const cleanedData = data.trim().replace(/\s+/g, ' ').split(' ');
    if (cleanedData.length !== 8) {
      throw new Error("Unexpected data format");
    }
    return cleanedData;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = `/api/co2?temp=${formData.temp}&bar=${formData.bar}&mNaCl=${formData.mNaCl}`
      const response = await fetch(url)
      const JSON = await response.json()
      if (response.ok) {
        // Data should be in here.
        setData(JSON.data)
        setError(null)
      }
    } catch (err) {
      console.error(err.message)
      setError(err.message)
    }
  }

  /**
   * Function that handles updating the state when the input fields change.
   *
   * @param name Name of the input field
   * @param value Value of the associated input field
   */
  const handleChange = (name: string, value: string) => {
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  return (
    <main id="main-content" className="rvt-layout__wrapper rvt-layout__wrapper--single rvt-container-sm">
      <div className="rvt-layout__content">
        
        {/* Header with meta info and citation*/}
        <header>
          <h2 className="rvt-ts-md">CO2 SOLUBILITY CALCULATOR</h2>
          <hr />
          <CO2Citation />
        </header>

        <br />

        {/* Results/Output section. We'll use a raised card to handle showing any results or output */}
        <div className="rvt-card rvt-card--raised">
          <div className="rvt-card__body">
            <h2 className="rvt-card__title">
              CO2 Calculator Results
            </h2>
            <div className="rvt-card__content [ rvt-flow ]">
              <pre className="mt-3">
                CO <sub>2</sub> solubility in aqueous NaCl solution--------- <br />
                Duan Z, Sun R, Zhu C, Chou I (Marine Chemistry, 2006, v98, 131-139)
                <br />
                T-P-X range of this model: 273-533 K, 0-2000 bar, 0-4.5 mNaCl <br />
                Unit---T: K, P(total): bar, mNaCl and mCO2: mol/kgH2O <br />
              </pre>  
              {/* Handle showing errors here */}
              {
                error && (
                  <div class="rvt-alert rvt-alert--danger [ rvt-m-top-md ]" role="alert" aria-labelledby="error-alert-title" data-rvt-alert="error">
                    <div class="rvt-alert__title" id="error-alert-title">Error when working with CO2 Calculator</div>
                    <p class="rvt-alert__message">{error}</p>
                    <button class="rvt-alert__dismiss" data-rvt-alert-close>
                      <span class="rvt-sr-only">Dismiss this alert</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">  <path d="m3.5 2.086 4.5 4.5 4.5-4.5L13.914 3.5 9.414 8l4.5 4.5-1.414 1.414-4.5-4.5-4.5 4.5L2.086 12.5l4.5-4.5-4.5-4.5L3.5 2.086Z"/></svg>
                    </button>
                  </div>
                )
              }
              
              {
                data && (
                  {data}
                )
              }
              {/* Render calculator results when ready */}
              {/* {
                data.temp && (
                  <ul className="rvt-list">
                    <li>temp: {data.temp}</li>
                    <li>bar: {data.bar}</li>
                    <li>mNaCl: {data.mNaCl}</li>
                    <li>mCO2: {data.mCO2}</li>
                  </ul>
                )
              }   */}
            </div> 
          </div>
        </div>

        
        {/* Input Form  */}
        <form
          onSubmit={handleSubmit}
          // TODO: Change this to point at python backend 
          // action={`https://js2test.ear180013.projects.jetstream-cloud.org/co2/co2calc3.php?temp=${formData.temp}&bar=${formData.bar}&mNaCl=${formData.mNaCl}`}
          // method="get"
        >
          {
            calculatorInputs.map((input) => (
              <div>
                <label className="rvt-label [ rvt-m-top-md ]">{input.label}</label>
                <input type="text" id="text-input-info" className="rvt-text-input rvt-validation-info" name={input.name} value={formData[input.name]} onChange={(e) => handleChange(input.name, e.target.value)}/>
              </div>
            ))
          }
          <button className="rvt-button rvt-m-top-sm" type="submit">
            Submit
          </button>
        </form>
      </div>
    </main>
  );
}