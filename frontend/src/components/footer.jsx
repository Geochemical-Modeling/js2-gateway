function Footer() {
  return (
    <footer className="rvt-footer-base">
      <div className="rvt-container-lg">
        <div className="rvt-footer-base__inner">
          <div className="rvt-footer-base__logo">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <title>SVG</title>
              <polygon
                fill="currentColor"
                points="15.3 3.19 15.3 5 16.55 5 16.55 15.07 13.9 15.07 13.9 1.81 15.31 1.81 15.31 0 8.72 0 8.72 1.81 10.12 1.81 10.12 15.07 7.45 15.07 7.45 5 8.7 5 8.7 3.19 2.5 3.19 2.5 5 3.9 5 3.9 16.66 6.18 18.98 10.12 18.98 10.12 21.67 8.72 21.67 8.72 24 15.3 24 15.3 21.67 13.9 21.67 13.9 18.98 17.82 18.98 20.09 16.66 20.09 5 21.5 5 21.5 3.19 15.3 3.19"
              />
            </svg>
          </div>
          <ul className="rvt-footer-base__list">
            <li className="rvt-footer-base__item">
              <a
                className="rvt-footer-base__link"
                href="https://accessibility.iu.edu/assistance/"
              >
                Accessibility
              </a>
            </li>
            <li className="rvt-footer-base__item">
              <a
                className="rvt-footer-base__link"
                href="https://www.iu.edu/privacy/index.html"
              >
                Privacy Notice
              </a>
            </li>
            <li className="rvt-footer-base__item">
              <a
                className="rvt-footer-base__link"
                href="https://www.iu.edu/copyright/index.html"
              >
                Copyright
              </a>{' '}
              © 2025 The Trustees of{' '}
              <a className="rvt-footer-base__link" href="https://www.iu.edu">
                Indiana University
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
export default Footer;
