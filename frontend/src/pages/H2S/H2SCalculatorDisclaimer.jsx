import React from "react";

import Disclaimer from "../../components/Disclaimer";
import { route_map } from "../../constants";

export default function H2SCalculatorDisclaimer() {
  return (
    <main id="main-content" className="rvt-layout__wrapper rvt-layout__wrapper--single rvt-container-sm">
      <div className="rvt-layout__content">
        <header>
          <h2 className="rvt-ts-lg rvt-text-medium">H₂S SOLUBILITY CALCULATOR</h2>
          <a className="App-links__item" href={route_map.H2S_CALCULATOR_ONLINE}>
            <h4>Online H₂S Solubility Calculator</h4>
          </a>
        </header>
        
        <p>An online program to calculate H2S solubility. A model for the calculation of H2S solubility in aqueous solutions. Please refer the following article when you use this tool:</p>

        <p className="references">
          i X, Zhu C (2013) Predicting possible effects of H2S impurity on CO2
          transportation and geological storage. Environmental Science &
          Technology 47: 55-62, doi: 10.1021/es301292n{" "}
          <a
            className="App-links__item"
            href="https://pubs.acs.org/doi/10.1021/es301292n"
          >
            DOI
          </a>
        </p>

        <p className="references">
          Ji X, Zhu C (2012) A SAFT Equation of State for the Quaternary
          H2S-CO2-H2O-NaCl system. Geochimica et Cosmochimica Acta 91: 40–59, doi:
          10.1016/j.gca.2012.05.023P{" "}
          <a
            className="App-links__item"
            href="https://www.sciencedirect.com/science/article/pii/S0016703712003109?via%3Dihub"
          >
            DOI
          </a>
        </p>

        <p>
          Please send comments or corrections to <a href="https://www.ltu.se/staff/x/xiajix-1.33890?l=en" target="_blank" rel="noreferrer">Professor Xiaoyan Ji</a>.
        </p>

        <br />

        <Disclaimer />
      </div>

    </main>
    
      
    
  )
}