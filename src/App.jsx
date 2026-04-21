// // src/App.jsx
// import React, { useState, useEffect } from "react";
// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   Navigate,
//   Outlet,
// } from "react-router-dom";
// import { checkAuth, getUserRole } from "./utils/auth";

// // Auth components
// import Login from "./components/auth/Login";
// import ForgotPassword from "./components/auth/ForgotPassword";
// import ResetPassword from "./components/auth/ResetPassword";

// // Dashboard Layout
// import DashboardLayout from "./components/DashboardLayout";

// // Admin Pages
// import Dashboard from "./components/Dashboard";
// import AdminDriverPage from "./components/AdminDriverPage";
// import AdminRoutePlanner from "./components/AdminRoutePlanner";
// import TeamsPage from "./components/TeamsPage";
// import BinsPage from "./components/BinsPage";
// import SettingsPage from "./components/SettingsPage";

// // Driver Page
// import DriverPage from "./components/DriverPage";

// // Protected Route wrapper
// const ProtectedRoute = ({ children, allowedRoles }) => {
//   const isAuthenticated = checkAuth();
//   const userRole = getUserRole();

//   if (!isAuthenticated) {
//     return <Navigate to="/login" replace />;
//   }

//   if (allowedRoles && !allowedRoles.includes(userRole)) {
//     return <Navigate to="/login" replace />;
//   }

//   return children;
// };

// // Admin Layout Wrapper
// const AdminLayout = () => {
//   const handleLogout = () => {
//     localStorage.removeItem("auth");
//     window.location.href = "/login";
//   };

//   return (
//     <DashboardLayout onLogout={handleLogout}>
//       <Outlet />
//     </DashboardLayout>
//   );
// };

// export default function App() {
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     checkAuth();
//     setLoading(false);
//   }, []);

//   if (loading) {
//     return (
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "center",
//           alignItems: "center",
//           minHeight: "100vh",
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

//   return (
//     <Router>
//       <Routes>
//         {/* 🔓 Public Auth Routes */}
//         <Route path="/login" element={<Login />} />
//         <Route path="/forgot-password" element={<ForgotPassword />} />
//         <Route path="/reset-password" element={<ResetPassword />} />

//         {/* 🔐 Driver Routes */}
//         <Route
//           path="/driver/*"
//           element={
//             <ProtectedRoute allowedRoles={["Driver", "DRIVER"]}>
//               <DriverPage />
//             </ProtectedRoute>
//           }
//         />

//         {/* 🔐 Admin Routes */}
//         <Route
//           path="/*"
//           element={
//             <ProtectedRoute allowedRoles={["Admin", "ADMIN"]}>
//               <AdminLayout />
//             </ProtectedRoute>
//           }
//         >
//           <Route index element={<Navigate to="/dashboard" replace />} />
//           <Route path="dashboard" element={<Dashboard />} />
//           <Route path="drivers" element={<AdminDriverPage />} />
//           <Route path="route-planner" element={<AdminRoutePlanner />} />
//           <Route path="route-status" element={<Dashboard />} />
//           <Route path="teams" element={<TeamsPage />} />
//           <Route path="bins" element={<BinsPage />} />
//           <Route path="deployments" element={<Dashboard />} />
//           <Route path="settings" element={<SettingsPage />} />
//         </Route>

//         {/* Catch all */}
//         <Route path="*" element={<Navigate to="/login" replace />} />
//       </Routes>
//     </Router>
//   );
// }
// src/App.jsx
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { checkAuth, getUserRole } from "./utils/auth";

// Auth components
import Login from "./components/auth/Login";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";

// Dashboard Layout
import DashboardLayout from "./components/DashboardLayout";

// Admin Pages
import Dashboard from "./components/Dashboard";
import AdminDriverPage from "./components/AdminDriverPage";
import AdminRoutePlanner from "./components/AdminRoutePlanner";
import TeamsPage from "./components/TeamsPage";
import BinsPage from "./components/BinsPage";
import SettingsPage from "./components/SettingsPage";
import DriverTrackingPage from "./components/DriverTrackingPage";

// Driver Page
import DriverPage from "./components/DriverPage";

// Protected Route wrapper with redirect
const ProtectedRoute = ({ children, allowedRoles }) => {
  const isAuthenticated = checkAuth();
  const userRole = getUserRole();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />; // Redirect to login
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/login" replace />; // Redirect to login
  }

  return children;
};

// Admin Layout Wrapper
const AdminLayout = () => {
  const handleLogout = () => {
    localStorage.removeItem("auth");
    window.location.href = "/login";
  };
  return (
    <DashboardLayout onLogout={handleLogout}>
      <Outlet />
    </DashboardLayout>
  );
};

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
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
        />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* 🔓 Public Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* 🔐 Driver Routes */}
        <Route
          path="/driver/*"
          element={
            <ProtectedRoute allowedRoles={["Driver"]}>
              <DriverPage />
            </ProtectedRoute>
          }
        />

        {/* 🔐 Admin Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="drivers" element={<AdminDriverPage />} />
          <Route path="route-planner" element={<AdminRoutePlanner />} />
          <Route path="route-status" element={<Dashboard />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="bins" element={<BinsPage />} />
          <Route path="deployments" element={<Dashboard />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route
            path="driver-tracking/:driverId"
            element={<DriverTrackingPage />}
          />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
