import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

function AdminPage() {
  const { userAuth, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    showPending: true,
    showApproved: false,
    showArchived: true,
  });
  const [actionResult, setActionResult] = useState({ type: null, message: '' });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [displayedUsers, setDisplayedUsers] = useState([]);

  // Redirect non-admin users
  useEffect(() => {
    if (isAuthenticated && userAuth && userAuth.admin_rights !== 1) {
      navigate('/');
    }
  }, [isAuthenticated, userAuth, navigate]);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/users', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setUsers(data);
      applyFilters(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial data loading
  useEffect(() => {
    if (isAuthenticated && userAuth?.admin_rights === 1) {
      fetchUsers();
    }
  }, [isAuthenticated, userAuth]);

  // Apply filters and search to the user list
  const applyFilters = (userList = users) => {
    let filtered = [...userList];

    // Apply show/hide filters
    filtered = filtered.filter((user) => {
      if (!filters.showPending && user.approved_user === 0) return false;
      if (!filters.showApproved && user.approved_user === 1) return false;
      if (!filters.showArchived && user.archived === 1) return false;
      return true;
    });

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          (user.name && user.name.toLowerCase().includes(term)) ||
          (user.email && user.email.toLowerCase().includes(term)) ||
          (user.institution && user.institution.toLowerCase().includes(term)),
      );
    }

    setFilteredUsers(filtered);

    // Reset to first page when filters change
    setCurrentPage(1);

    // Calculate total pages
    setTotalPages(Math.max(1, Math.ceil(filtered.length / itemsPerPage)));
  };

  // Update displayed users when page or filtered users change
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedUsers(filteredUsers.slice(startIndex, endIndex));
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Update filters when search term changes
  useEffect(() => {
    applyFilters();
  }, [searchTerm, filters]);

  // Handle filter changes
  const handleFilterChange = (filterName) => {
    setFilters({
      ...filters,
      [filterName]: !filters[filterName],
    });
  };

  // Pagination handlers
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = parseInt(e.target.value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
    setTotalPages(
      Math.max(1, Math.ceil(filteredUsers.length / newItemsPerPage)),
    );
  };

  // Handle user status updates
  const updateUserStatus = async (userId, updates) => {
    try {
      setActionResult({ type: null, message: '' });

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error ${response.status}`);
      }

      const updatedUser = await response.json();

      // Update local state with the updated user
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user.id === userId ? updatedUser : user)),
      );

      // Re-apply filters
      applyFilters(
        users.map((user) => (user.id === userId ? updatedUser : user)),
      );

      // Show success message
      setActionResult({
        type: 'success',
        message: `User status updated successfully!`,
      });

      // Clear success message after 3 seconds
      setTimeout(() => setActionResult({ type: null, message: '' }), 3000);
    } catch (err) {
      console.error('Error updating user:', err);
      setActionResult({
        type: 'error',
        message: `Failed to update user: ${err.message}`,
      });
    }
  };

  // User card component
  const UserCard = ({ user }) => {
    return (
      <div className="rvt-card rvt-m-bottom-md" key={user.id}>
        <div className="rvt-card__body">
          <div className="rvt-row">
            <div className="rvt-cols-8">
              <h2 className="rvt-card__title">{user.name || 'Unnamed User'}</h2>
              <div>
                <strong>Email:</strong> {user.email}
              </div>
              <div>
                <strong>Institution:</strong>{' '}
                {user.institution || 'Not specified'}
              </div>
              <div className="rvt-m-top-xs">
                <span
                  className={`rvt-badge ${
                    user.approved_user
                      ? 'rvt-badge--success'
                      : 'rvt-badge--warning'
                  }`}
                >
                  {user.approved_user ? 'Approved' : 'Pending'}
                </span>
                {user.admin_rights === 1 && (
                  <span className="rvt-badge rvt-badge--info rvt-m-left-xs">
                    Admin
                  </span>
                )}
                {user.archived === 1 && (
                  <span className="rvt-badge rvt-badge--danger rvt-m-left-xs">
                    Archived
                  </span>
                )}
                <span className="rvt-badge rvt-badge--secondary rvt-m-left-xs">
                  {user.onboarded ? 'Onboarded' : 'Not Onboarded'}
                </span>
              </div>
            </div>
            <div className="rvt-cols-4 rvt-text-right">
              <div className="rvt-button-group">
                {user.approved_user === 0 && (
                  <button
                    className="rvt-button rvt-button--success rvt-m-bottom-xs"
                    onClick={() =>
                      updateUserStatus(user.id, { approved_user: 1 })
                    }
                  >
                    Approve
                  </button>
                )}
                {user.approved_user === 1 && (
                  <button
                    className="rvt-button rvt-button--warning rvt-m-bottom-xs"
                    onClick={() =>
                      updateUserStatus(user.id, { approved_user: 0 })
                    }
                  >
                    Unapprove
                  </button>
                )}
                {user.admin_rights === 0 && (
                  <button
                    className="rvt-button rvt-button--secondary rvt-m-bottom-xs"
                    onClick={() =>
                      updateUserStatus(user.id, { admin_rights: 1 })
                    }
                  >
                    Make Admin
                  </button>
                )}
                {user.admin_rights === 1 && (
                  <button
                    className="rvt-button rvt-button--secondary rvt-m-bottom-xs"
                    onClick={() =>
                      updateUserStatus(user.id, { admin_rights: 0 })
                    }
                  >
                    Remove Admin
                  </button>
                )}
                {user.archived === 0 ? (
                  <button
                    className="rvt-button rvt-button--danger"
                    onClick={() => updateUserStatus(user.id, { archived: 1 })}
                  >
                    Archive
                  </button>
                ) : (
                  <button
                    className="rvt-button"
                    onClick={() => updateUserStatus(user.id, { archived: 0 })}
                  >
                    Unarchive
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Pagination controls component
  const PaginationControls = () => (
    <div className="rvt-pagination rvt-pagination--right rvt-m-top-md">
      <div className="rvt-pagination__controls">
        <button
          className="rvt-pagination__control"
          aria-label="First page"
          onClick={() => goToPage(1)}
          disabled={currentPage === 1}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M11 3.75L6.25 8.5L11 13.25V3.75Z" fill="currentColor" />
            <path d="M5 3.75V13.25" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
        <button
          className="rvt-pagination__control rvt-m-left-xs"
          aria-label="Previous page"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 3.75L5.25 8.5L10 13.25"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </button>
        <span className="rvt-pagination__label rvt-m-left-sm rvt-m-right-sm">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="rvt-pagination__control"
          aria-label="Next page"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 3.75L10.75 8.5L6 13.25"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </button>
        <button
          className="rvt-pagination__control rvt-m-left-xs"
          aria-label="Last page"
          onClick={() => goToPage(totalPages)}
          disabled={currentPage === totalPages}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M5 3.75L9.75 8.5L5 13.25V3.75Z" fill="currentColor" />
            <path d="M11 3.75V13.25" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      </div>
    </div>
  );

  if (!isAuthenticated || userAuth?.admin_rights !== 1) {
    return (
      <main
        id="main-content"
        className="rvt-layout__wrapper rvt-layout__wrapper--single rvt-container-sm"
      >
        <div className="rvt-layout__content">
          <div className="rvt-empty-state">
            <div className="rvt-empty-state__content">
              <p>You must be an administrator to access this page.</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      id="main-content"
      className="rvt-layout__wrapper rvt-layout__wrapper--single rvt-container-sm"
    >
      <div className="rvt-layout__content rvt-p-tb-lg">
        <h1 className="rvt-ts-36 rvt-m-bottom-md">User Management</h1>

        {actionResult.type && (
          <div
            className={`rvt-alert ${
              actionResult.type === 'success'
                ? 'rvt-alert--success'
                : 'rvt-alert--danger'
            } rvt-m-bottom-md`}
            role="alert"
            aria-labelledby="alert-title"
          >
            <div className="rvt-alert__title" id="alert-title">
              {actionResult.type === 'success' ? 'Success!' : 'Error'}
            </div>
            <p className="rvt-alert__message">{actionResult.message}</p>
          </div>
        )}

        <div className="rvt-box rvt-m-bottom-lg">
          <div className="rvt-box__body">
            <div className="rvt-row">
              <div className="rvt-cols-6-md">
                <label htmlFor="search" className="rvt-label rvt-sr-only">
                  Search Users
                </label>
                <div className="rvt-input-group">
                  <input
                    type="text"
                    id="search"
                    className="rvt-input"
                    placeholder="Search by name, email, or institution"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="rvt-input-group__append">
                    <button className="rvt-button">
                      <span className="rvt-sr-only">Search</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        className="bi bi-search"
                        viewBox="0 0 16 16"
                      >
                        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div className="rvt-cols-6-md rvt-display-flex rvt-justify-content-end">
                <div className="rvt-checkbox-wrapper rvt-m-right-sm">
                  <input
                    type="checkbox"
                    name="showPending"
                    id="showPending"
                    className="rvt-checkbox"
                    checked={filters.showPending}
                    onChange={() => handleFilterChange('showPending')}
                  />
                  <label htmlFor="showPending" className="rvt-checkbox-label">
                    Pending
                  </label>
                </div>
                <div className="rvt-checkbox-wrapper rvt-m-right-sm">
                  <input
                    type="checkbox"
                    name="showApproved"
                    id="showApproved"
                    className="rvt-checkbox"
                    checked={filters.showApproved}
                    onChange={() => handleFilterChange('showApproved')}
                  />
                  <label htmlFor="showApproved" className="rvt-checkbox-label">
                    Approved
                  </label>
                </div>
                <div className="rvt-checkbox-wrapper">
                  <input
                    type="checkbox"
                    name="showArchived"
                    id="showArchived"
                    className="rvt-checkbox"
                    checked={filters.showArchived}
                    onChange={() => handleFilterChange('showArchived')}
                  />
                  <label htmlFor="showArchived" className="rvt-checkbox-label">
                    Archived
                  </label>
                </div>
              </div>
            </div>

            {/* Items per page selector */}
            <div className="rvt-row rvt-m-top-md">
              <div className="rvt-cols-auto">
                <label
                  htmlFor="itemsPerPage"
                  className="rvt-label rvt-m-right-xs"
                >
                  Items per page:
                </label>
                <select
                  id="itemsPerPage"
                  className="rvt-select"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="rvt-flex rvt-justify-content-center rvt-p-tb-xl">
            <div
              className="rvt-loader rvt-loader--md"
              aria-label="Loading users..."
            ></div>
          </div>
        )}

        {error && (
          <div className="rvt-alert rvt-alert--danger" role="alert">
            <div className="rvt-alert__title">Error loading users</div>
            <p className="rvt-alert__message">{error}</p>
          </div>
        )}

        {!loading && !error && filteredUsers.length === 0 && (
          <div className="rvt-empty-state">
            <div className="rvt-empty-state__content">
              <p>No users found matching your criteria.</p>
            </div>
          </div>
        )}

        {!loading && !error && filteredUsers.length > 0 && (
          <div>
            <h2 className="rvt-ts-20 rvt-m-bottom-md">
              {filteredUsers.length} Users
              {searchTerm && ` matching "${searchTerm}"`}
              {filteredUsers.length > itemsPerPage &&
                ` (Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, filteredUsers.length)} of ${filteredUsers.length})`}
            </h2>

            {/* Pending Users Section */}
            {filters.showPending &&
              displayedUsers.some((user) => user.approved_user === 0) && (
                <div className="rvt-m-bottom-lg">
                  <h3 className="rvt-ts-18">Pending Users</h3>
                  {displayedUsers
                    .filter((user) => user.approved_user === 0)
                    .map((user) => (
                      <UserCard key={user.id} user={user} />
                    ))}
                </div>
              )}

            {/* Approved Users Section */}
            {filters.showApproved &&
              displayedUsers.some((user) => user.approved_user === 1) && (
                <div className="rvt-m-bottom-lg">
                  <h3 className="rvt-ts-18">Approved Users</h3>
                  {displayedUsers
                    .filter((user) => user.approved_user === 1)
                    .map((user) => (
                      <UserCard key={user.id} user={user} />
                    ))}
                </div>
              )}

            {/* Pagination controls */}
            {filteredUsers.length > itemsPerPage && <PaginationControls />}
          </div>
        )}
      </div>
    </main>
  );
}

export default AdminPage;
