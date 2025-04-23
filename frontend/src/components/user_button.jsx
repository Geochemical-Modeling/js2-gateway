import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { route_map } from '../constants';

function UserButton() {
  const { user, userAuth, isAuthenticated, isAdmin, isPending } = useAuth();

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

  // Determine user's name to display
  const displayName =
    user.given_name ||
    userAuth?.name?.split(' ')[0] ||
    user.email?.split('@')[0] ||
    'User';

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
            {displayName}
            {isPending && (
              <span className="rvt-badge rvt-badge--warning rvt-m-left-xs">
                Pending
              </span>
            )}
            {isAdmin && (
              <span className="rvt-badge rvt-badge--info rvt-m-left-xs">
                Admin
              </span>
            )}
          </div>
          <span className="rvt-sr-only">More sub-navigation links</span>
        </button>
      </div>
      <div
        className="rvt-header-menu__submenu rvt-dropdown__menu rvt-dropdown__menu--right"
        data-rvt-dropdown-menu="primary-nav-1"
        hidden
      >
        <ul className="rvt-header-menu__submenu-list">
          {isAdmin && (
            <li className="rvt-header-menu__submenu-item">
              <Link
                className="rvt-header-menu__submenu-link"
                to={route_map.ADMIN_PAGE}
              >
                Admin Panel
              </Link>
            </li>
          )}
          {isPending && (
            <li className="rvt-header-menu__submenu-item">
              <span className="rvt-header-menu__submenu-link rvt-color-warning">
                Account Pending Approval
              </span>
            </li>
          )}
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
