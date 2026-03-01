// src/components/TeamsPage.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

// Backend API endpoint
const API_BASE_URL = "http://localhost:8080/api/employees";

const api = {
  fetchUsers: async () => {
    const response = await axios.get(API_BASE_URL);
    return response.data;
  },
  createUser: async (data) => {
    const response = await axios.post(`${API_BASE_URL}/createEmployee`, {
      employeeId: data.employeeId || `EMP-${Date.now()}`,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      role: data.role?.toUpperCase() || "DRIVER",
    });
    return response.data;
  },
  // KEY FIX: Use employeeId (custom field) for update, not MongoDB _id
  updateUser: async (employeeId, data) => {
    const response = await axios.put(`${API_BASE_URL}/${employeeId}`, {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: data.role?.toUpperCase(),
    });
    return response.data;
  },
  // KEY FIX: Use employeeId (custom field) for delete, not MongoDB _id
  deleteUser: async (employeeId) => {
    await axios.delete(`${API_BASE_URL}/${employeeId}`);
    return { success: true };
  },
};

// Only Admin and Driver roles (no Dispatcher)
const ROLES = ["Admin", "Driver"];

const TeamsPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formData, setFormData] = useState({
    employeeId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "Driver",
    active: true,
  });
  const [formError, setFormError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("All");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await api.fetchUsers();
        const mappedUsers = data.map((user) => ({
          ...user,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role
            ? user.role.toString().charAt(0).toUpperCase() +
              user.role.toString().slice(1).toLowerCase()
            : "Driver",
          active: user.status === "ACTIVE" || user.active === true,
        }));
        setUsers(mappedUsers);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching employees:", err);
        setError(
          "Failed to load team members. Make sure backend is running on http://localhost:8080",
        );
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) return "First Name is required";
    if (!formData.lastName.trim()) return "Last Name is required";
    if (!formData.email.trim()) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(formData.email)) return "Email is invalid";
    if (
      formData.phone &&
      !/^\d{10,}$/.test(formData.phone.replace(/\D/g, ""))
    ) {
      return "Phone must be at least 10 digits";
    }
    return "";
  };

  const handleSaveUser = async () => {
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }
    try {
      if (editingUser) {
        // KEY FIX: Pass employeeId for update, not MongoDB _id
        await api.updateUser(editingUser.employeeId, formData);
        setUsers(
          users.map((u) =>
            u.employeeId === editingUser.employeeId ? { ...u, ...formData } : u,
          ),
        );
      } else {
        const newUser = await api.createUser(formData);
        const mappedUser = {
          ...newUser,
          name: `${newUser.firstName} ${newUser.lastName}`,
          role: newUser.role
            ? newUser.role.toString().charAt(0).toUpperCase() +
              newUser.role.toString().slice(1).toLowerCase()
            : "Driver",
          active: newUser.status === "ACTIVE" || newUser.active === true,
        };
        setUsers([...users, mappedUser]);
      }
      setFormData({
        employeeId: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: "Driver",
        active: true,
      });
      setFormError("");
      setShowAddModal(false);
      setEditingUser(null);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        "Failed to save employee. Please try again.";
      setFormError(errorMsg);
      console.error("Error saving employee:", err);
    }
  };

  const handleDeleteUser = async () => {
    try {
      // KEY FIX: Pass employeeId for delete, not MongoDB _id
      await api.deleteUser(confirmDelete.employeeId);
      setUsers(users.filter((u) => u.employeeId !== confirmDelete.employeeId));
      setConfirmDelete(null);
    } catch (err) {
      alert("Failed to delete employee: " + err.message);
      console.error("Error deleting employee:", err);
    }
  };

  const filteredUsers = users.filter((user) => {
    const fullName =
      `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone || "").includes(searchTerm);
    const matchesRole = filterRole === "All" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        Loading team...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#e53e3e" }}>
        {error}
      </div>
    );
  }

  return (
    <div className="teams-page">
      <style>{`
        .teams-page { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; background: #f8fafc; min-height: 100vh; }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .page-header h1 { font-size: 24px; color: #1a202c; font-weight: 700; margin: 0; }
        .btn-primary { background: #38A169; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-weight: 600; cursor: pointer; }
        .btn-primary:hover { background: #2f855a; }
        .filters { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
        .search-input { padding: 8px 12px; border: 1px solid #cbd5e0; border-radius: 4px; width: 240px; }
        .search-input:focus { outline: none; border-color: #38A169; box-shadow: 0 0 0 2px rgba(56, 161, 105, 0.2); }
        .filter-btn { padding: 6px 12px; border: 1px solid #cbd5e0; background: white; border-radius: 4px; cursor: pointer; }
        .filter-btn.active { background: #38A169; color: white; }
        .users-table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .users-table th { text-align: left; padding: 12px 16px; background: #edf2f7; font-weight: 600; color: #4a5568; }
        .users-table td { padding: 12px 16px; border-bottom: 1px solid #edf2f7; }
        .role-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
        .role-badge.admin { background: #fed7d7; color: #e53e3e; }
        .role-badge.driver { background: #bee3f8; color: #3182ce; }
        .status-active { color: #38a169; font-weight: 600; }
        .status-inactive { color: #e53e3e; }
        .actions button { margin-right: 8px; padding: 4px 8px; border: 1px solid #cbd5e0; background: white; border-radius: 4px; cursor: pointer; font-size: 13px; }
        .actions button.edit { color: #3182ce; }
        .actions button.edit:hover { background: #ebf8ff; }
        .actions button.delete { color: #e53e3e; }
        .actions button.delete:hover { background: #fff5f5; }
        .modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; padding: 24px; border-radius: 12px; width: 400px; max-width: 90vw; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
        .modal h2 { margin-top: 0; color: #1a202c; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; margin-bottom: 6px; font-weight: 500; color: #4a5568; }
        .form-group input, .form-group select { width: 100%; padding: 8px 12px; border: 1px solid #cbd5e0; border-radius: 4px; }
        .form-group input:focus, .form-group select:focus { outline: none; border-color: #38A169; box-shadow: 0 0 0 2px rgba(56, 161, 105, 0.2); }
        .form-error { color: #e53e3e; margin-top: 8px; font-size: 14px; }
        .modal-buttons { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
        .btn-secondary { background: #e2e8f0; color: #4a5568; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 500; }
        .btn-secondary:hover { background: #cbd5e0; }
        .btn-delete { background: #e53e3e; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 500; }
        .btn-delete:hover { background: #c53030; }
        .delete-modal-icon { width: 64px; height: 64px; background: #fed7d7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; }
        .delete-modal-icon svg { width: 32px; height: 32px; fill: #e53e3e; }
        .delete-modal-title { text-align: center; color: #1a202c; font-size: 20px; font-weight: 600; margin-bottom: 8px; }
        .delete-modal-message { text-align: center; color: #4a5568; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
        .delete-modal-user-name { color: #e53e3e; font-weight: 600; }
        .delete-modal-buttons { display: flex; gap: 12px; justify-content: center; }
        .btn-delete-confirm { background: #e53e3e; color: white; border: none; padding: 10px 24px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
        .btn-delete-confirm:hover { background: #c53030; transform: translateY(-1px); box-shadow: 0 4px 6px rgba(229, 62, 62, 0.3); }
        .btn-cancel { background: #edf2f7; color: #4a5568; border: none; padding: 10px 24px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.2s; }
        .btn-cancel:hover { background: #e2e8f0; transform: translateY(-1px); }
      `}</style>

      <div className="page-header">
        <h1>Employee Management</h1>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          + Add Employee
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          className="search-input"
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          className={`filter-btn ${filterRole === "All" ? "active" : ""}`}
          onClick={() => setFilterRole("All")}
        >
          All Roles
        </button>
        {ROLES.map((role) => (
          <button
            key={role}
            className={`filter-btn ${filterRole === role ? "active" : ""}`}
            onClick={() => setFilterRole(role)}
          >
            {role}s
          </button>
        ))}
      </div>

      <table className="users-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: "center", color: "#718096" }}>
                No employees found
              </td>
            </tr>
          ) : (
            filteredUsers.map((user) => (
              <tr key={user.employeeId}>
                <td>
                  {user.firstName} {user.lastName}
                </td>
                <td>{user.email}</td>
                <td>{user.phone || "N/A"}</td>
                <td>
                  <span
                    className={`role-badge ${user.role?.toLowerCase() || "driver"}`}
                  >
                    {user.role || "Driver"}
                  </span>
                </td>
                <td>
                  <span
                    className={
                      user.status === "ACTIVE" || user.active === true
                        ? "status-active"
                        : "status-inactive"
                    }
                  >
                    {user.status === "ACTIVE" || user.active === true
                      ? "Active"
                      : "Inactive"}
                  </span>
                </td>
                <td className="actions">
                  <button
                    className="edit"
                    onClick={() => {
                      setEditingUser(user);
                      setFormData({
                        employeeId: user.employeeId || "",
                        firstName: user.firstName || "",
                        lastName: user.lastName || "",
                        email: user.email || "",
                        phone: user.phone || "",
                        role: user.role || "Driver",
                        active:
                          user.status === "ACTIVE" || user.active === true,
                      });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="delete"
                    onClick={() => setConfirmDelete(user)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Add/Edit Modal */}
      {(showAddModal || editingUser) && (
        <div
          className="modal"
          onClick={() => {
            setShowAddModal(false);
            setEditingUser(null);
            setFormError("");
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>
              {editingUser
                ? `Edit ${editingUser.role}`
                : `Add New ${formData.role}`}
            </h2>

            <div className="form-group">
              <label>First Name</label>
              <input
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="e.g., John"
              />
            </div>

            <div className="form-group">
              <label>Last Name</label>
              <input
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="e.g., Doe"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="e.g., john@trashmasters.com"
                disabled={!!editingUser}
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="e.g., 5551234567"
              />
            </div>

            <div className="form-group">
              <label>Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleInputChange}
                />
                Active Account
              </label>
            </div>

            {formError && <div className="form-error">{formError}</div>}

            <div className="modal-buttons">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingUser(null);
                  setFormError("");
                }}
              >
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSaveUser}>
                {editingUser
                  ? `Update ${editingUser.role}`
                  : `Add ${formData.role}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="modal" onClick={() => setConfirmDelete(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon">
              <svg viewBox="0 0 24 24">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
              </svg>
            </div>
            <h3 className="delete-modal-title">Delete {confirmDelete.role}?</h3>
            <p className="delete-modal-message">
              Are you sure you want to delete{" "}
              <span className="delete-modal-user-name">
                {confirmDelete.firstName} {confirmDelete.lastName}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="delete-modal-buttons">
              <button
                className="btn-cancel"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button className="btn-delete-confirm" onClick={handleDeleteUser}>
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="currentColor"
                >
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsPage;
