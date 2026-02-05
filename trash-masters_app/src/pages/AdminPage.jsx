// In src/pages/AdminPage.jsx
import React from "react";
import AdminLayout from "../components/admin/AdminLayout";
import AdminRoutePlannerView from "../components/admin/AdminRoutePlannerView";

const AdminPage = () => {
  const handleLogout = () => {
    localStorage.removeItem("auth");
    window.location.reload();
  };

  return (
    <AdminLayout onLogout={handleLogout}>
      <AdminRoutePlannerView />
    </AdminLayout>
  );
};

export default AdminPage;
