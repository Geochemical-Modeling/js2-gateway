import React from 'react';
import { Link } from 'react-router-dom';
import { route_map } from '../constants';

export default function RateScripts() {
  return (
    <main
      id="main-content"
      className="rvt-layout__wrapper rvt-layout__wrapper--single rvt-container-sm"
    >
      <div className="rvt-layout__content">
        <header>
          <h2 className="rvt-ts-lg rvt-text-medium">
            Library of BASIC Scripts of Rate Equations for Geochemical Modeling
            Using PHREEQC
          </h2>
        </header>
        <p>
          This is a library of RATES blocks in BASIC language for the USGS
          geochemical modeling program ᴘʜʀᴇᴇǫᴄ. About 100 minerals and phases
          are included in this library. For documentation and citation, users
          should consult and refer to the article:
        </p>

        <div className="rvt-card rvt-card--raised">
          <div className="rvt-card__body">
            <p>
              Zhang YL, Hu B, Teng YG, Zhu C. (2019) A library of BASIC scripts
              of rate equations for geochemical modeling using ᴘʜʀᴇᴇǫᴄ.
              Computers & Geosciences, v133,{' '}
              <a
                href="https://www.sciencedirect.com/science/article/pii/S0098300418311853?via%3Dihub"
                className="rvt-color-crimson-700"
              >
                DOI
              </a>
            </p>
          </div>
        </div>

        <p>
          A companion PHASES block library that is needed to use the RATES
          scripts is also provided. Both RATES and PHASES blocks are included in
          datasets, phreeqc-kinetics.dat, diagenesis.dat, and geothermal.dat
          options for online ᴘʜʀᴇᴇǫᴄ. If you just need to know the value of
          reaction rates at a temperature and pH of your interest, you can use
          the rate calculator. All phases in the library are included in the
          calculator.
        </p>

        <p>
          Kindly report errors to Professor Chen Zhu{' '}
          <a href="mailto:suprcrt@iu.edu" className="rvt-color-crimson-700">
            supcrt@iu.edu
          </a>
          . Tutorials, corrections, and updates may be found at Professor Zhu's
          research web site{' '}
          <a
            href="https://hydrogeochem.earth.indiana.edu"
            className="rvt-color-crimson-700"
          >
            https://hydrogeochem.earth.indiana.edu
          </a>
          .
        </p>

        <h3 className="rvt-ts-md rvt-text-medium">Download</h3>
        <ul>
          <li>
            {' '}
            <a
              href="http://149.165.154.118/basic_scripts/download_files/README.txt"
              className="rvt-color-crimson-700"
            >
              Download README
            </a>{' '}
          </li>
          <li>
            <a
              href="https://github.com/HydrogeoIU/PHREEQC-Kinetic-Library"
              className="rvt-color-crimson-700"
              target="_blank"
              rel="noopener noreferrer"
            >
              Link to GitHub
            </a>
          </li>
        </ul>
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
