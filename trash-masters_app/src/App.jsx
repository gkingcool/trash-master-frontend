// // src/App.jsx
// import React, { useState } from "react";
// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   Navigate,
// } from "react-router-dom";
// import DashboardLayout from "./components/DashboardLayout";
// import AdminRoutePlanner from "./components/AdminRoutePlanner";
// import TeamsPage from "./components/TeamsPage";
// import Login from "./components/auth/Login";

// export default function App() {
//   const [isAuthenticated] = useState(() => {
//     try {
//       const stored = localStorage.getItem("auth");
//       return stored ? JSON.parse(stored).isAuthenticated === true : false;
//     } catch (e) {
//       console.warn("Auth parse error:", e);
//       return false;
//     }
//   });

//   if (!isAuthenticated) {
//     return <Login onLoginSuccess={() => window.location.reload()} />;
//   }

//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<Navigate to="/route-planner" replace />} />
//         <Route path="/" element={<DashboardLayout />}>
//           <Route path="route-planner" element={<AdminRoutePlanner />} />
//           <Route path="teams" element={<TeamsPage />} />
//         </Route>
//       </Routes>
//     </Router>
//   );
// }

// src/App.jsx
import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./components/Dashboard"; // ← ADD THIS IMPORT
import AdminRoutePlanner from "./components/AdminRoutePlanner";
import TeamsPage from "./components/TeamsPage";
import Login from "./components/auth/Login";

export default function App() {
  const [isAuthenticated] = useState(() => {
    try {
      const stored = localStorage.getItem("auth");
      return stored ? JSON.parse(stored).isAuthenticated === true : false;
    } catch (e) {
      console.warn("Auth parse error:", e);
      return false;
    }
  });

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => window.location.reload()} />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/" element={<DashboardLayout />}>
          <Route path="dashboard" element={<Dashboard />} /> {/* ← ADDED */}
          <Route path="route-planner" element={<AdminRoutePlanner />} />
          <Route path="teams" element={<TeamsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
