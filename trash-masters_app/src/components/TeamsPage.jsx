// src/components/TeamsPage.jsx
import React, { useState, useEffect } from "react";

// Mock API service
const api = {
  fetchUsers: () =>
    Promise.resolve([
      {
        id: 1,
        firstName: "Jin Phu",
        lastName: "jin.admin",
        role: "Admin",
        email: "jin@trashmasters.com",
        active: true,
      },
      {
        id: 2,
        firstName: "Maria Garcia",
        lastName: "maria.driver",
        role: "Driver",
        email: "maria@trashmasters.com",
        active: true,
      },
      {
        id: 3,
        firstName: "Tom Chen",
        lastName: "tom.dispatcher",
        role: "Dispatcher",
        email: "tom@trashmasters.com",
        active: false,
      },
    ]),
  // createUser: (data) => Promise.resolve({ success: true }),
  createUser: async (data) => {
    try {
        const response = await fetch('http://localhost:8080/api/drivers/createDriver', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json', // * inform the server we are sending JSON
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (error) {
        console.error(error);
    }
},
//   createUser: async (data) => {
//     try {
//         const response = await fetch('https://0xew3yax3j.execute-api.us-east-1.amazonaws.com/test/addUser', {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json', // * inform the server we are sending JSON
//             },
//             body: JSON.stringify(data)
//         });
//         return await response.json();
//     } catch (error) {
//         console.error(error);
//     }
// },
  

  // createUser: (data) = async => { 
  //     const response = await fetch('https://0xew3yax3j.execute-api.us-east-1.amazonaws.com/test/addUser', {
  //       method: 'POST', // * set the method to POST
  //       headers: {
  //         'Content-Type': 'application/json', // * inform the server we are sending JSON
  //       },
  //       body: JSON.stringify(data), // * convert the JavaScript object to a JSON string
  //     })
  //     .then(response => {
  //       if (!response.ok) {
  //         // Check if the response status is okay (e.g., 200-299)
  //         throw new Error('Network response was not ok: ' + response.statusText);
  //       }
  //     return response.json(); // * parse the JSON response from the server
  //     })
  //     // .then(data => {
  //     //   console.log('Success:', data); // * handle the successful response data
  //     // })
  //     // .catch((error) => {
  //     //   console.error('Error:', error); // * handle any errors during the fetch operation
  //     // });
  // },
  
  updateUser: (id, data) => Promise.resolve({ success: true }),
  deleteUser: (id) => Promise.resolve({ success: true }),
  resetPassword: (id) => Promise.resolve({ success: true }),
};

const ROLES = ["Admin", "Dispatcher", "Driver"];

const TeamsPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
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
        setUsers(data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load team members");
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
    if (!formData.firstName.trim()) return "First name is required";
    if (!formData.lastName.trim()) return "Last name is required";
    if (!formData.email.trim()) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(formData.email)) return "Email is invalid";
    if (formData.lastName.length < 3)
      return "Last name must be at least 3 characters";
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
        await api.updateUser(editingUser.id, formData);
        setUsers(
          users.map((u) =>
            u.id === editingUser.id ? { ...u, ...formData } : u,
          ),
        );
      } else {
        await api.createUser(formData);
        
        const newUser = { id: Date.now(), ...formData };
        setUsers([...users, newUser]);
      }

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        role: "Driver",
        active: true,
      });
      setFormError("");
      setShowAddModal(false);
      setEditingUser(null);
    } catch (err) {
      setFormError("Failed to save user. Please try again.");
    }
  };

  const handleDeleteUser = async () => {
    try {
      await api.deleteUser(confirmDelete.id);
      setUsers(users.filter((u) => u.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  const handleResetPassword = async (user) => {
    if (!window.confirm(`Send a temporary password to ${user.email}?`)) return;
    try {
      await api.resetPassword(user.id);
      alert(`Temporary password sent to ${user.email}`);
    } catch (err) {
      alert("Failed to reset password");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "All" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading)
    return (
      <div
        className="teams-page"
        style={{ padding: "40px", textAlign: "center" }}
      >
        Loading team...
      </div>
    );

  if (error)
    return (
      <div
        className="teams-page"
        style={{ padding: "40px", textAlign: "center", color: "#e53e3e" }}
      >
        {error}
      </div>
    );

  return (
    <div className="teams-page">
      <style>{`
        .teams-page {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 20px;
          background: #f8fafc;
          min-height: 100%;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .page-header h1 {
          font-size: 24px;
          color: #1a202c;
          font-weight: 700;
        }
        .btn-primary {
          background: #38A169; /* GREEN */
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-primary:hover {
          background: #2f855a;
        }
        .filters {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .search-input {
          padding: 8px 12px;
          border: 1px solid #cbd5e0;
          border-radius: 4px;
          width: 240px;
        }
        .search-input:focus {
          outline: none;
          border-color: #38A169;
          box-shadow: 0 0 0 2px rgba(56, 161, 105, 0.2);
        }
        .filter-btn {
          padding: 6px 12px;
          border: 1px solid #cbd5e0;
          background: white;
          border-radius: 4px;
          cursor: pointer;
        }
        .filter-btn.active {
          background: #38A169;
          color: white;
        }
        .users-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .users-table th {
          text-align: left;
          padding: 12px 16px;
          background: #edf2f7;
          font-weight: 600;
          color: #4a5568;
        }
        .users-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #edf2f7;
        }
        .role-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .role-badge.admin { background: #fed7d7; color: #e53e3e; }
        .role-badge.dispatcher { background: #c6f6d5; color: #38a169; }
        .role-badge.driver { background: #bee3f8; color: #3182ce; }
        .status-active { color: #38a169; font-weight: 600; }
        .status-inactive { color: #e53e3e; }
        .actions button {
          margin-right: 8px;
          padding: 4px 8px;
          border: 1px solid #cbd5e0;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
        }
        .actions button.edit { color: #3182ce; }
        .actions button.delete { color: #e53e3e; }
        .actions button.reset { color: #dd6b20; }
        .modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          padding: 24px;
          border-radius: 8px;
          width: 400px;
          max-width: 90vw;
        }
        .modal h2 {
          margin-top: 0;
          color: #1a202c;
        }
        .form-group {
          margin-bottom: 16px;
        }
        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #4a5568;
        }
        .form-group input, .form-group select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #cbd5e0;
          border-radius: 4px;
        }
        .form-group input:focus, .form-group select:focus {
          outline: none;
          border-color: #38A169;
          box-shadow: 0 0 0 2px rgba(56, 161, 105, 0.2);
        }
        .form-error {
          color: #e53e3e;
          margin-top: 8px;
          font-size: 14px;
        }
        .modal-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 20px;
        }
        .btn-secondary {
          background: #e2e8f0;
          color: #4a5568;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }
        .btn-delete {
          background: #e53e3e;
          color: white;
        }
        .btn-delete:hover {
          background: #c53030;
        }
      `}</style>

      <div className="page-header">
        <h1>Team Management</h1>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          + Add User
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          className="search-input"
          placeholder="Search by firstname, lastname, or email..."
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
            <th>FirstName</th>
            <th>LastName</th>
            <th>Role</th>
            <th>Status</th>
            <th>Contact</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: "center", color: "#718096" }}>
                No team members found
              </td>
            </tr>
          ) : (
            filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.firstName}</td>
                <td>{user.lastName}</td>
                <td>
                  <span className={`role-badge ${user.role.toLowerCase()}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span
                    className={
                      user.active ? "status-active" : "status-inactive"
                    }
                  >
                    {user.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>{user.email}</td>
                <td className="actions">
                  <button
                    className="edit"
                    onClick={() => {
                      setEditingUser(user);
                      setFormData({
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        role: user.role,
                        active: user.active,
                      });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="reset"
                    onClick={() => handleResetPassword(user)}
                  >
                    Reset Pwd
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
            <h2>{editingUser ? "Edit User" : "Add New User"}</h2>

            <div className="form-group">
              <label>FirstName</label>
              <input
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>LastName</label>
              <input
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
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
                {editingUser ? "Update" : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="modal" onClick={() => setConfirmDelete(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Delete User</h2>
            <p>
              Are you sure you want to delete{" "}
              <strong>{confirmDelete.name}</strong>? This action cannot be
              undone.
            </p>
            <div className="modal-buttons">
              <button
                className="btn-secondary"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button className="btn-delete" onClick={handleDeleteUser}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsPage;
