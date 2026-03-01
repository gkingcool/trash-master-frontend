// // src/App.jsx
// import React, { useState, useEffect } from "react";
// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   Navigate,
// } from "react-router-dom";
// import { checkAuth, getUserRole } from "./utils/auth";
// import Login from "./components/auth/Login";
// import ForgotPassword from "./components/auth/ForgotPassword";
// import ResetPassword from "./components/auth/ResetPassword";
// import DashboardLayout from "./components/DashboardLayout";
// import Dashboard from "./components/Dashboard";
// import AdminRoutePlanner from "./components/AdminRoutePlanner";
// import TeamsPage from "./components/TeamsPage";
// import DriverPage from "./components/DriverPage";
// import AdminDriverPage from "./components/AdminDriverPage";

// export default function App() {
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [userRole, setUserRole] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const authStatus = checkAuth();
//     setIsAuthenticated(authStatus);

//     if (authStatus) {
//       setUserRole(getUserRole());
//     }

//     setLoading(false);
//   }, []);

//   // Loading state
//   if (loading) {
//     return (
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "center",
//           alignItems: "center",
//           minHeight: "100vh",
//           fontSize: "18px",
//           color: "#4a5568",
//         }}
//       >
//         <div
//           className="spinner"
//           style={{
//             border: "4px solid #f0f0f0",
//             borderTop: "4px solid #38a169",
//             borderRadius: "50%",
//             width: "40px",
//             height: "40px",
//             animation: "spin 1s linear infinite",
//           }}
//         ></div>
//       </div>
//     );
//   }

//   // Not authenticated - show login
//   if (!isAuthenticated) {
//     return <Login onLoginSuccess={() => window.location.reload()} />;
//   }

//   // Driver sees only DriverPage (full-screen)
//   if (userRole === "Driver") {
//     return (
//       <Router>
//         <Routes>
//           <Route path="/" element={<DriverPage />} />
//           {/* Redirect any other path to home */}
//           <Route path="*" element={<Navigate to="/" replace />} />
//         </Routes>
//       </Router>
//     );
//   }

//   // Admin/driver sees full dashboard
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<DashboardLayout />}>
//           <Route index element={<Navigate to="/dashboard" replace />} />
//           <Route path="dashboard" element={<Dashboard />} />
//           <Route path="drivers" element={<AdminDriverPage />} />
//           <Route path="route-planner" element={<AdminRoutePlanner />} />
//           <Route path="teams" element={<TeamsPage />} />
//           {/* Add more admin routes here */}
//         </Route>
//         {/* Catch all for invalid routes */}
//         <Route path="*" element={<Navigate to="/dashboard" replace />} />
//       </Routes>
//     </Router>
//   );
// }

// ---------------------------

// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { checkAuth, getUserRole } from "./utils/auth";

// Page imports
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./components/Dashboard";
import AdminRoutePlanner from "./components/AdminRoutePlanner";
import TeamsPage from "./components/TeamsPage";
import DriverPage from "./components/DriverPage";
import AdminDriverPage from "./components/AdminDriverPage";

// Protected Route wrapper - checks auth on every render
const ProtectedRoute = ({ children, allowedRoles }) => {
  const isAuthenticated = checkAuth();
  const userRole = getUserRole();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default function App() {
  return (
    <Router>
      <Routes>
        {/* 🔓 Public auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* 🔐 Driver-only route */}
        <Route
          path="/driver"
          element={
            <ProtectedRoute allowedRoles={["Driver"]}>
              <DriverPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={["Driver"]}>
              <Navigate to="/driver" replace />
            </ProtectedRoute>
          }
        />

        {/* 🔐 Admin routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="drivers" element={<AdminDriverPage />} />
          <Route path="route-planner" element={<AdminRoutePlanner />} />
          <Route path="teams" element={<TeamsPage />} />
        </Route>

        {/* Catch all */}
        <Route
          path="*"
          element={
            checkAuth() ? (
              getUserRole() === "Driver" ? (
                <Navigate to="/driver" replace />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}
