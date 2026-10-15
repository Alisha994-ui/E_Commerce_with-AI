"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../components/apiFetch";
import "./User.css";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // ==========================================
  // PAGINATION STATES
  // ==========================================

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    is_staff: false,
    is_active: true,
  });

  // ==========================================
  // FETCH USERS
  // ==========================================

  const fetchUsers = async (page = currentPage) => {
    try {
      setLoading(true);

      const response = await apiFetch(
        `/admin-users/?page=${page}`
      );

      if (!response.ok) {
        console.error("Failed to fetch users");
        return;
      }

      const data = await response.json();

      // ==========================================
      // NORMAL ARRAY RESPONSE
      // ==========================================

      if (Array.isArray(data)) {
        setUsers(data);

        setTotalUsers(data.length);

        setTotalPages(1);
      }

      // ==========================================
      // PAGINATED RESPONSE
      // ==========================================

      else {
        setUsers(data.results || []);

        setTotalUsers(data.count || 0);

        setTotalPages(
          Math.ceil(
            (data.count || 0) / 10
          )
        );
      }

    } catch (error) {
      console.error(
        "Error fetching users:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // INITIAL LOAD + PAGE CHANGE
  // ==========================================

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredUsers = users.filter(
    (user) => {
      const username =
        user.username
          ?.toLowerCase() || "";

      const email =
        user.email
          ?.toLowerCase() || "";

      const searchText =
        search.toLowerCase();

      return (
        username.includes(
          searchText
        ) ||
        email.includes(
          searchText
        )
      );
    }
  );

  // ==========================================
  // OPEN EDIT MODAL
  // ==========================================

  const handleEdit = (user) => {
    setEditingUser(user);

    setFormData({
      username:
        user.username || "",

      email:
        user.email || "",

      is_staff:
        user.is_staff || false,

      is_active:
        user.is_active !== undefined
          ? user.is_active
          : true,
    });

    setShowModal(true);
  };

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setFormData((prev) => ({
      ...prev,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  // ==========================================
  // UPDATE USER
  // ==========================================

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!editingUser) {
      return;
    }

    try {
      const response =
        await apiFetch(
          `/admin-users/${editingUser.id}/`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              formData
            ),
          }
        );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Update user error:",
          errorText
        );

        alert(
          "Failed to update user."
        );

        return;
      }

      const updatedUser =
        await response.json();

      setUsers(
        (prevUsers) =>
          prevUsers.map(
            (user) =>
              user.id ===
              editingUser.id
                ? updatedUser
                : user
          )
      );

      setShowModal(false);

      setEditingUser(null);

      alert(
        "User updated successfully."
      );

    } catch (error) {
      console.error(
        "Error updating user:",
        error
      );

      alert(
        "Something went wrong."
      );
    }
  };

  // ==========================================
  // DELETE USER
  // ==========================================

  const handleDelete = async (
    userId
  ) => {
    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this user?"
      );

    if (!confirmDelete) {
      return;
    }

    try {
      const response =
        await apiFetch(
          `/admin-users/${userId}/`,
          {
            method: "DELETE",
          }
        );

      if (!response.ok) {
        console.error(
          "Failed to delete user"
        );

        alert(
          "Failed to delete user."
        );

        return;
      }

      // Remove user from current page
      setUsers(
        (prevUsers) =>
          prevUsers.filter(
            (user) =>
              user.id !== userId
          )
      );

      // Update total users
      setTotalUsers(
        (previous) =>
          Math.max(
            previous - 1,
            0
          )
      );

      // ==========================================
      // IF CURRENT PAGE BECOMES EMPTY
      // MOVE TO PREVIOUS PAGE
      // ==========================================

      if (
        users.length === 1 &&
        currentPage > 1
      ) {
        setCurrentPage(
          (previous) =>
            previous - 1
        );
      } else {
        // Refresh current page
        await fetchUsers(
          currentPage
        );
      }

      alert(
        "User deleted successfully."
      );

    } catch (error) {
      console.error(
        "Error deleting user:",
        error
      );

      alert(
        "Something went wrong."
      );
    }
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (
    date
  ) => {
    if (!date) {
      return "-";
    }

    return new Date(
      date
    ).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  // ==========================================
  // PAGINATION HANDLERS
  // ==========================================

  const handleNextPage = () => {
    if (
      currentPage <
      totalPages
    ) {
      setCurrentPage(
        (previous) =>
          previous + 1
      );
    }
  };

  const handlePreviousPage = () => {
    if (
      currentPage > 1
    ) {
      setCurrentPage(
        (previous) =>
          previous - 1
      );
    }
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="user-management">

      {/* ================= HEADER ================= */}

      <div className="user-header">

        <div>

          <h2>
            Users
          </h2>

          <p>
            Manage registered users and administrators
          </p>

        </div>

        <div className="user-count">

          <span>
            {totalUsers}
          </span>{" "}
          Users

        </div>

      </div>


      {/* ================= TOOLBAR ================= */}

      <div className="user-toolbar">

        <div className="user-search">

          <span>
            🔎
          </span>

          <input
            type="text"
            placeholder="Search by username or email..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>

      </div>


      {/* ================= TABLE ================= */}

      <div className="user-table-container">

        {loading ? (

          <div className="user-loading">

            Loading users...

          </div>

        ) : filteredUsers.length === 0 ? (

          <div className="user-empty">

            <div className="empty-icon">
              👤
            </div>

            <h3>
              No users found
            </h3>

            <p>

              {search
                ? "Try a different search."
                : "There are no users available."}

            </p>

          </div>

        ) : (

          <table className="user-table">

            <thead>

              <tr>

                <th>
                  User
                </th>

                <th>
                  Email
                </th>

                <th>
                  Role
                </th>

                <th>
                  Joined
                </th>

                <th>
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {filteredUsers.map(
                (user) => (

                  <tr
                    key={user.id}
                  >

                    {/* USER */}

                    <td>

                      <div className="user-info">

                        <div className="user-avatar">

                          {user.username
                            ?.charAt(0)
                            .toUpperCase()}

                        </div>


                        <div>

                          <strong>
                            {user.username}
                          </strong>

                          <small>
                            ID #{user.id}
                          </small>

                        </div>

                      </div>

                    </td>


                    {/* EMAIL */}

                    <td>

                      <span className="user-email">

                        {user.email ||
                          "-"}

                      </span>

                    </td>


                    {/* ROLE */}

                    <td>

                      {user.is_staff ? (

                        <span className="role-badge admin">
                          Admin
                        </span>

                      ) : (

                        <span className="role-badge customer">
                          Customer
                        </span>

                      )}

                    </td>


                    {/* JOINED */}

                    <td>

                      <span className="joined-date">

                        {formatDate(
                          user.date_joined
                        )}

                      </span>

                    </td>


                    {/* ACTIONS */}

                    <td>

                      <div className="user-actions">

                        <button
                          className="edit-user-btn"
                          onClick={() =>
                            handleEdit(
                              user
                            )
                          }
                        >
                          Edit
                        </button>


                        <button
                          className="delete-user-btn"
                          onClick={() =>
                            handleDelete(
                              user.id
                            )
                          }
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        )}

      </div>


      {/* ================= PAGINATION ================= */}

      {!loading && (

        <div className="pagination">

          <button
            disabled={
              currentPage === 1
            }
            onClick={
              handlePreviousPage
            }
          >
            Previous
          </button>


          <span>

            Page{" "}
            {currentPage}{" "}
            of{" "}
            {totalPages}

          </span>


          <button
            disabled={
              currentPage ===
              totalPages
            }
            onClick={
              handleNextPage
            }
          >
            Next
          </button>

        </div>

      )}


      {/* ================= EDIT MODAL ================= */}

      {showModal && (

        <div
          className="user-modal-overlay"
          onClick={() =>
            setShowModal(false)
          }
        >

          <div
            className="user-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="user-modal-header">

              <div>

                <h3>
                  Edit User
                </h3>

                <p>
                  Update user account information
                </p>

              </div>


              <button
                className="user-modal-close"
                onClick={() =>
                  setShowModal(false)
                }
              >
                ×
              </button>

            </div>


            <form
              onSubmit={
                handleUpdate
              }
            >

              {/* USERNAME */}

              <div className="user-form-group">

                <label>
                  Username
                </label>

                <input
                  type="text"
                  name="username"
                  value={
                    formData.username
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

              </div>


              {/* EMAIL */}

              <div className="user-form-group">

                <label>
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={
                    formData.email
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>


              {/* ROLE */}

              <div className="user-form-checkbox">

                <label>

                  <input
                    type="checkbox"
                    name="is_staff"
                    checked={
                      formData.is_staff
                    }
                    onChange={
                      handleChange
                    }
                  />

                  <span>
                    Make this user an Admin
                  </span>

                </label>

              </div>


              {/* STATUS */}

              <div className="user-form-checkbox">

                <label>

                  <input
                    type="checkbox"
                    name="is_active"
                    checked={
                      formData.is_active
                    }
                    onChange={
                      handleChange
                    }
                  />

                  <span>
                    Account is Active
                  </span>

                </label>

              </div>


              {/* ACTIONS */}

              <div className="user-modal-actions">

                <button
                  type="button"
                  className="cancel-user-btn"
                  onClick={() =>
                    setShowModal(
                      false
                    )
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="save-user-btn"
                >
                  Save Changes
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}