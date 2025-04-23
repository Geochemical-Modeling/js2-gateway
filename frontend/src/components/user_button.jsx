import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function UserButton() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="rvt-header-menu__dropdown rvt-dropdown">
        <div className="rvt-header-menu__group rvt-flex rvt-items-center rvt-m-top-md rvt-m-top-none-lg-up">
          <a className="rvt-button" href="/auth">
            <div className="rvt-ts-14">Sign In / Join</div>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rvt-header-menu__dropdown rvt-dropdown"
      data-rvt-dropdown="primary-nav-1"
    >
      <div className="rvt-header-menu__group rvt-flex rvt-items-center rvt-m-top-md rvt-m-top-none-lg-up">
        <button
          className="rvt-button"
          type="button"
          href="#"
          data-rvt-dropdown-toggle="primary-nav-1"
        >
          <div className="rvt-ts-14">
            {user.given_name || user.email || 'User'}
          </div>
          {/* <div className="rvt-avatar rvt-avatar--xs">
            <span className="rvt-avatar__text">UN</span>
          </div> */}
          <span className="rvt-sr-only">More sub-navigation links</span>
        </button>
      </div>
      <div
        className="rvt-header-menu__submenu rvt-dropdown__menu rvt-dropdown__menu--right"
        data-rvt-dropdown-menu="primary-nav-1"
        hidden
      >
        <ul className="rvt-header-menu__submenu-list">
          <li className="rvt-header-menu__submenu-item">
            <a className="rvt-header-menu__submenu-link" href="/auth/logout">
              Logout
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default UserButton;
