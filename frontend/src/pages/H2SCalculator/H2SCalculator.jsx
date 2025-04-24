import React from 'react';
import { Link } from 'react-router-dom';
import { route_map } from '../../constants';

export default function H2SCalculator() {
  return (
    <main
      id="main-content"
      className="rvt-layout__wrapper rvt-layout__wrapper--single rvt-container-sm"
    >
      <div className="rvt-layout__content">
        <header>
          <h2 className="rvt-ts-lg rvt-text-medium">
            H<sub>2</sub>S Solubility Calculator
          </h2>
          <Link
            className="App-links__item"
            to={route_map.H2S_CALCULATOR_ONLINE}
          >
            <h4>
              H<sub>2</sub>S Solubility Calculator
            </h4>
          </Link>
        </header>
        <p>
          An online program to calculate H2S solubility, specifically a model
          for the calculation of H2S solubility in aqueous solutions. Please
          refer to the following articles when you use this tool:
        </p>

        <div className="rvt-card rvt-card--raised">
          <div className="rvt-card__body">
            <p>
              i X, Zhu C (2013) Predicting possible effects of H2S impurity on
              CO2 transportation and geological storage. Environmental Science &
              Technology 47: 55-62, doi: 10.1021/es301292n{' '}
              <a
                href="https://pubs.acs.org/doi/10.1021/es301292n"
                className="rvt-color-crimson-700"
              >
                DOI
              </a>
            </p>
            <p>
              Ji X, Zhu C (2012) A SAFT Equation of State for the Quaternary
              H2S-CO2-H2O-NaCl system. Geochimica et Cosmochimica Acta 91:
              40–59, doi: 10.1016/j.gca.2012.05.023P{' '}
              <a
                href="https://www.sciencedirect.com/science/article/pii/S0016703712003109?via%3Dihub"
                className="rvt-color-crimson-700"
              >
                DOI
              </a>
            </p>
          </div>
        </div>

        <p>
          Please send comments or corrections to Professor Xiaoyan Ji (
          <a
            target="_blank"
            href="https://www.ltu.se/staff/x/xiajix-1.33890?l=en"
          >
            https://www.ltu.se/staff/x/xiajix-1.33890?l=en
          </a>
          ).
        </p>

        <h3 className="rvt-ts-md rvt-text-medium">Disclaimer</h3>
        <p>
          This material was prepared, in part, sponsored by an agency of the
          United States Government or Indiana University. Neither the United
          States Government, nor Indiana University, makes any warranty, express
          or implied, or assumes any legal liability or responsibility for the
          accuracy, completeness, or usefulness of any information, apparatus,
          product, or process disclosed, or represents that its use would not
          infringe privately owned rights.
        </p>
      </div>
    </main>
  );
}
