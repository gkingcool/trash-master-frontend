// src/App.jsx
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { checkAuth, getUserRole } from "./utils/auth";
import Login from "./components/auth/Login";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./components/Dashboard";
import AdminRoutePlanner from "./components/AdminRoutePlanner";
import TeamsPage from "./components/TeamsPage";
import DriverPage from "./components/DriverPage";
import AdminDriverPage from "./components/AdminDriverPage";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authStatus = checkAuth();
    setIsAuthenticated(authStatus);

    if (authStatus) {
      setUserRole(getUserRole());
    }

    setLoading(false);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          fontSize: "18px",
          color: "#4a5568",
        }}
      >
        <div
          className="spinner"
          style={{
            border: "4px solid #f0f0f0",
            borderTop: "4px solid #38a169",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            animation: "spin 1s linear infinite",
          }}
        ></div>
      </div>
    );
  }

  // Not authenticated - show login
  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => window.location.reload()} />;
  }

  // Driver sees only DriverPage (full-screen)
  if (userRole === "Driver") {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<DriverPage />} />
          {/* Redirect any other path to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    );
  }

  // Admin/Dispatcher sees full dashboard
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="drivers" element={<AdminDriverPage />} />
          <Route path="route-planner" element={<AdminRoutePlanner />} />
          <Route path="teams" element={<TeamsPage />} />
          {/* Add more admin routes here */}
        </Route>
        {/* Catch all for invalid routes */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
