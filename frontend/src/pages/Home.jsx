import React from 'react';
import worldmap from '../../assets/worldmap.jpg';
import { route_map } from '../constants';
import { Link } from 'react-router-dom';
const Home = () => {
  let alert = null;
  // Get the alert from the query params, it can be one of the following:
  // - login_sucessful
  // - missing_email
  // - invalid_userinfo_response
  // - invalid_token_response
  // - logout
  const alertMessage = new URLSearchParams(window.location.search).get('alert');
  let messageTemplate = function (type, message) {
    return (
      <div
        class={`rvt-inline-alert rvt-inline-alert--standalone rvt-inline-alert--${type}`}
      >
        <span class="rvt-inline-alert__icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            {' '}
            <path d="M9 7v5H7V7h2ZM8 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />{' '}
            <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6a6 6 0 1 0 0 12A6 6 0 0 0 8 2Z" />
          </svg>
        </span>
        <span class="rvt-inline-alert__message" id="example-message-1">
          <strong>{message}</strong>
        </span>
      </div>
    );
  };
  if (alertMessage) {
    switch (alertMessage) {
      case 'login_successful':
        alert = messageTemplate(
          'success',
          'You have successfully logged in. Welcome to the Geochemical Modeling Gateway!',
        );
        break;
      case 'missing_email':
        alert = messageTemplate(
          'warning',
          'No email associated with the login method you chose, please use a different method.',
        );
        break;
      case 'invalid_userinfo_response':
        alert = messageTemplate(
          'danger',
          'Invalid user information response. Please try again or use a different method.',
        );
        break;
      case 'invalid_token_response':
        alert = messageTemplate(
          'danger',
          'Invalid token response. Please try again or use a different method.',
        );
        break;
      case 'logout':
        alert = messageTemplate('info', 'You have successfully logged out.');
        break;
      default:
        alert = null;
    }
  }

  return (
    <>
      <main
        id="main-content"
        className="rvt-layout__wrapper rvt-layout__wrapper--single rvt-container-sm"
      >
        <div className="rvt-layout__content">
          <div className="rvt-flow rvt-prose">
            <h1>Geochemical Modeling Gateway</h1>
          </div>
          {alert}
          {/* Don't let these classes be purged in the build stage */}
          <div class={`rvt-inline-alert--info hidden`}></div>
          <div class={`rvt-inline-alert--danger hidden`}></div>
          <div class={`rvt-inline-alert--success hidden`}></div>
          <div class={`rvt-inline-alert--warning hidden`}></div>
          {/* End of the CSS that may get purged */}
          <div className="rvt-prose rvt-flow rvt-border-top rvt-p-top-lg rvt-m-top-md">
            <div className="rvt-layout__feature-slot">
              <div className="rvt-card rvt-card--raised">
                <div className="rvt-card__body">
                  <span className="rvt-ts-18 rvt-text-bold">
                    Online Applications
                  </span>
                  <p>
                    Google Analytics recorded more than ~7000 visitors with
                    unique IP addresses from 89 countries using our tools in the
                    past two years. This material is partially based upon work
                    supported by the National Science Foundation under Grant
                    EAR-1225733, 1926734, 2242907; part of broader impact
                    activities.
                  </p>
                </div>
              </div>
            </div>

            <figure className="rvt-width-xl-xl-up">
              <img
                src={worldmap}
                alt="Map of users who have used geochemical modeling tools from this gateway"
              />
            </figure>
            <p>
              Users of this portal may find some cool functions on our
              colleagues{' '}
              <strong>
                <a
                  target="_blank"
                  href="https://worm-portal.asu.edu/"
                  rel="noreferrer"
                >
                  WORM portal
                </a>
              </strong>
            </p>

            <h2>SUPCRTBL</h2>
            <p>
              A software package used to calculate thermodynamic properties for
              minerals, gases, aqueous species, and reactions at high
              temperatures and pressures. For this version of sᴜᴘᴄʀᴛ (sᴜᴘᴄʀᴛʙʟ),
              we used the mineral database of Holland and Powell (2011) and
              modified the computer code to accommodate the different heat
              capacity function, volume as a function of temperature and
              pressure, and mineral phase transition using the Landau model
              (Holland and Powell, 1998). We also added more species to the
              database. For example, we included rare earth element solids from
              Pan, Zhu, and others (2024), arsenic minerals and aqueous species,
              aluminum species from Tagirov and Schott (2001), aqueous silica
              from Rimstidt (1997), and dawsonite from Benezeth et al. (2007).
              Please cite Zimmer et al. (2016) in your publications if you have
              used sᴜᴘᴄʀᴛʙʟ in your research. The stated temperature and
              pressure ranges for aqueous species are from 1 to 5000 bars and 0°
              to 1000°C, but the ranges exceed the original limits stated for
              minerals in Johnson et al. (1992) and vary for individual species.
            </p>
            <Link to={route_map.SUPCRTBL} className="rvt-cta" rel="noreferrer">
              Use SUPCRTBL
            </Link>
            <hr />
            <h2>PHREEQC High P-T</h2>
            <p>
              ᴘʜʀᴇᴇǫᴄ is a geochemical modeling software distributed by the U.S.
              Geological Survey and developed by David Parkhurst and Tony
              Appelo. It is designed to perform a wide variety of aqueous
              geochemical modeling calculations.{' '}
            </p>
            <p>
              Here, the online version frees users from downloading and
              installing on different computing platforms. Additionally, the
              code has been modified by David Parkhurst to be able to calculate
              at elevated temperatures and pressures. New thermodynamic and
              kinetics datasets have thermodynamic properties that are
              consistent with those in{' '}
              <a
                target="_blank"
                href="https://dx.doi.org/10.1016/j.cageo.2016.02.013"
                rel="noreferrer"
              >
                Zimmer et al. (2016)
              </a>{' '}
              and a library of BASIC language RATES blocks for about 100
              minerals in{' '}
              <a
                target="_blank"
                href="https://doi.org/10.1016/j.cageo.2019.104316"
                rel="noreferrer"
              >
                Zhang et al. (2019)
              </a>
              . Furthermore, databases for high temperature and pressure are
              available for calculations up to 1000oC and 5000 bars (
              <a
                target="_blank"
                href="https://www.sciencedirect.com/science/article/abs/pii/S0098300420305501?via%3Dihub"
                rel="noreferrer"
              >
                Zhang et al., 2020
              </a>{' '}
              SupPhreeqc: A program to generate customized Phreeqc thermodynamic
              database based on Supcrtbl. Computers & Geosciences. v143. ).
            </p>
            <Link to="#0" className="rvt-cta" rel="noreferrer">
              Use PHREEQC High P-T
            </Link>
            <hr />
            <h2>
              CO<sub>2</sub> Calculator
            </h2>
            <p>
              An online program to facilitate the calculation of CO₂ solubility
              in pure water and aqueous 0-4.5 mNaCl solutions from 273 to 533K
              and from 0 to 2000 bar using the model by Duan, Sun, Zhu, Chou
              (2006).
            </p>
            <Link
              to={route_map.COTWO_CALCULATOR}
              className="rvt-cta"
              rel="noreferrer"
            >
              Use CO<sub>2</sub> Calculator
            </Link>
            <hr />
            <h2>Rates Calculator</h2>
            <p>
              Calculates far-from-equilibrium dissolution rates at a temperature
              and pH of your interest.
            </p>
            <Link
              to={route_map.RATE_CALCULATOR}
              className="rvt-cta"
              rel="noreferrer"
            >
              Use Rates Calculator
            </Link>
            <hr />
            <h2>PHREEQC BASIC Rate Scripts</h2>
            <p>
              A library of RATES blocks for about 100 minerals in BASIC scripts.
              The scripts can also be used as templates for writing other rate
              equations users might wish to use.
            </p>
            <p>
              Both RATES and PHASES blocks are included in data file
              phreeqc-kinetics.dat, llnl-kinetics.dat, diagenesis.dat, and
              geothermal.dat options for online ᴘʜʀᴇᴇǫᴄ. If you just need to
              know the value of reaction rates at a temperature and pH of
              interest, you can use the rate calculator below. All phases in the
              library are included in the calculator.
            </p>
            <Link
              to={route_map.RATE_SCRIPTS}
              className="rvt-cta"
              rel="noreferrer"
            >
              Go to Rate Scripts
            </Link>
            <hr />
            <h2>
              H<sub>2</sub>S Calculator
            </h2>
            <p>An online program to calculate H2S solubility.</p>
            <Link
              to={route_map.H2S_CALCULATOR}
              className="rvt-cta"
              rel="noreferrer"
            >
              Use H<sub>2</sub>S Calculator
            </Link>
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;
