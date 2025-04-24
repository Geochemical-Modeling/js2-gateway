import React from 'react';
import { Link } from 'react-router-dom';
import { route_map } from '../../constants';

export default function RateCalculator() {
  return (
    <main
      id="main-content"
      className="rvt-layout__wrapper rvt-layout__wrapper--single rvt-container-sm"
    >
      <div className="rvt-layout__content">
        <header>
          <h2 className="rvt-ts-lg rvt-text-medium">
            Geochemical Reaction Rate Calculator
          </h2>
          <Link to={route_map.RATE_CALCULATOR_ONLINE}>
            <h4>Use Online Rate Calculator</h4>
          </Link>
        </header>
        <br />
        <p>
          This Rate Calculator allows you to calculate far-from-equilibrium
          dissolution rates at a temperature and pH of your interest. Please
          refer to this article for details and cite in your publications:
        </p>

        <div className="rvt-card rvt-card--raised">
          <div className="rvt-card__body">
            <p>
              Zhang YL, Hu B, Teng YG, Zhu C (2019) A library of BASIC scripts
              of rate equations for geochemical modeling using ᴘʜʀᴇᴇǫᴄ.
              Computers & Geosciences, v133,{' '}
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

        <p className="rvt-m-top-md">
          Please send comments or corrections to Professor Chen Zhu{' '}
          <a href="mailto:supcrt@indiana.edu" className="rvt-color-crimson-700">
            supcrt@indiana.edu
          </a>
          .
        </p>

        <h3 className="rvt-ts-md rvt-text-medium rvt-m-top-lg">
          Acknowledgment
        </h3>
        <p>
          This material was partly supported by NSF grant EAR-1926734, the
          endowment for the Haydn Murray Chair, and the Office of the Vice
          Provost for Research of Indiana University.
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
