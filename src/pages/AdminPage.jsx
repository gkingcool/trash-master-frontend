// src/pages/AdminPage.jsx
import React from "react";
import DashboardLayout from "../components/DashboardLayout";
// ✅ Fix: Import actual admin components from correct location
import AdminRoutePlanner from "../components/AdminRoutePlanner";
import TeamsPage from "../components/TeamsPage";
import AdminDriverPage from "../components/AdminDriverPage";
import Dashboard from "../components/Dashboard";

const AdminPage = () => {
  const handleLogout = () => {
    localStorage.removeItem("auth");
    window.location.reload();
  };

  // AdminPage is just a wrapper - actual content is rendered via routes in App.jsx
  return (
    <DashboardLayout onLogout={handleLogout}>
      {/* Content is handled by React Router in App.jsx */}
      <div style={{ padding: "20px" }}>
        <h2>Admin Dashboard</h2>
        <p>Select an option from the sidebar to get started.</p>
      </div>
    </DashboardLayout>
  );
};

export default AdminPage;
