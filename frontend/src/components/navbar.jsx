import { Link } from 'react-router-dom';
import UserButton from './user_button';

function Navbar() {
  return (
    <header className="rvt-header-wrapper">
      <Link className="rvt-header-wrapper__skip-link" to="#main-content">
        Skip to main content
      </Link>
      <div className="rvt-header-global">
        <div className="rvt-container-xl">
          <div className="rvt-header-global__inner">
            <div className="rvt-header-global__logo-slot">
              <Link className="rvt-lockup" to="/">
                {/* Trident logo */}
                <div className="rvt-lockup__tab">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="rvt-lockup__trident"
                    viewBox="0 0 28 34"
                  >
                    <title>SVG</title>
                    <path
                      d="M-3.34344e-05 4.70897H8.83308V7.174H7.1897V21.1426H10.6134V2.72321H8.83308V0.121224H18.214V2.65476H16.2283V21.1426H19.7889V7.174H18.214V4.64047H27.0471V7.174H25.0614V23.6761L21.7746 26.8944H16.2967V30.455H18.214V33.8787H8.76463V30.592H10.6819V26.8259H5.20403L1.91726 23.6077V7.174H-3.34344e-05V4.70897Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                {/* Website or application title */}
                <div className="rvt-lockup__body">
                  <span className="rvt-lockup__title">
                    Indiana University Bloomington
                  </span>
                  <span className="rvt-lockup__subtitle">
                    Geochemical Modeling
                  </span>
                </div>
              </Link>
            </div>
            {/* Header controls */}
            <div className="rvt-header-global__controls">
              {/* Navigation */}
              <div data-rvt-disclosure="menu" data-rvt-close-click-outside>
                {/* Menu button that shows/hides navigation on smaller screens */}
                <button
                  aria-expanded="false"
                  className="rvt-global-toggle rvt-global-toggle--menu rvt-hide-lg-up"
                  data-rvt-disclosure-toggle="menu"
                  type="button"
                >
                  <span className="rvt-sr-only">Menu</span>
                  <svg
                    className="rvt-global-toggle__open"
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                    alt="button to open the menu"
                  >
                    {' '}
                    <title>SVG</title>
                    <path d="M15 4H1V2h14v2Zm0 5H1V7h14v2ZM1 14h14v-2H1v2Z" />
                  </svg>
                  <svg
                    className="rvt-global-toggle__close"
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <title>SVG</title>
                    <path d="m3.5 2.086 4.5 4.5 4.5-4.5L13.914 3.5 9.414 8l4.5 4.5-1.414 1.414-4.5-4.5-4.5 4.5L2.086 12.5l4.5-4.5-4.5-4.5L3.5 2.086Z" />
                  </svg>
                </button>
                {/* Navigation links */}
                <nav
                  aria-label="Main"
                  className="rvt-header-menu"
                  data-rvt-disclosure-target="menu"
                  hidden
                >
                  <ul className="rvt-header-menu__list">
                    {/* Navigation link without dropdown */}
                    <li className="rvt-header-menu__item">
                      <Link className="rvt-header-menu__link" to="/">
                        Modeling Home
                      </Link>
                    </li>
                    <li className="rvt-header-menu__item">
                      <Link
                        className="rvt-header-menu__link"
                        to="https://hydrogeochem.earth.indiana.edu"
                      >
                        Zhu Labratory
                      </Link>
                    </li>
                    <li className="rvt-header-menu__item">
                      <Link
                        className="rvt-header-menu__link"
                        to="https://hydrogeochem.earth.indiana.edu/publications"
                      >
                        Publications
                      </Link>
                    </li>
                    <li className="rvt-header-menu__item">
                      <Link
                        className="rvt-header-menu__link"
                        to="https://hydrogeochem.earth.indiana.edu/service"
                      >
                        Services
                      </Link>
                    </li>
                    <li className="rvt-header-menu__item">
                      <Link
                        className="rvt-header-menu__link"
                        to="https://hydrogeochem.earth.indiana.edu/teaching-resources"
                      >
                        Teaching Resources
                      </Link>
                    </li>
                    <li className="rvt-header-menu__item">
                      <UserButton />
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
