// src/components/DashboardLayout.jsx
import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";

// Icons
import dashboardIcon from "../assets/icons/dashboard.png";
import routePlannerIcon from "../assets/icons/route-planner.png";
import driversIcon from "../assets/icons/drivers.png";
import routeStatusIcon from "../assets/icons/route-status.png";
import teamsIcon from "../assets/icons/teams.png";
import deploymentsIcon from "../assets/icons/deployments.png";
import settingsIcon from "../assets/icons/settings.png";
import logoIcon from "../assets/icons/recycling-icon.png";
import bellIcon from "../assets/icons/bell-icon.png";

export default function DashboardLayout() {
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("auth");
    window.location.reload();
  };

  const isActive = (path) => location.pathname === path;

  const getPageTitle = () => {
    const titles = {
      "/route-planner": "Admin Route Planner",
      "/teams": "Team Management",
    };
    return titles[location.pathname] || "Dashboard";
  };

  return (
    <div className="dashboard-layout">
      <style>{`
        .dashboard-layout {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          display: flex;
          height: 100vh;
          background-color: #f5f7fa;
        }
        
        .sidebar {
          width: 240px;
          background: white;
          border-right: 1px solid #e0e6ed;
          padding: 20px 0;
          display: flex;
          flex-direction: column;
        }
        
        .sidebar-header {
          padding: 0 20px 20px;
          font-weight: 600;
          font-size: 16px;
          color: #4a5568;
          border-bottom: 1px solid #edf2f7;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
        }
        
        .sidebar-header img {
          width: 24px;
          height: 24px;
          margin-right: 10px;
          object-fit: contain;
        }
        
        .sidebar-nav ul {
          list-style: none;
          padding: 0 10px;
          margin: 0;
        }
        
        .nav-link {
          display: flex;
          align-items: center;
          padding: 12px 20px;
          margin: 5px 0;
          text-decoration: none;
          color: #4a5568;
          border-left: 4px solid transparent;
        }
        
        .nav-link:hover {
          background-color: #f8fafc;
        }
        
        .nav-link.active {
          background-color: #edf2f7;
          border-left: 4px solid #38A169; /* GREEN ACCENT */
          font-weight: 600;
          color: #2d3748;
        }
        
        .nav-link img {
          width: 20px;
          height: 20px;
          margin-right: 12px;
          object-fit: contain;
        }
        
        .main-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .top-bar {
          padding: 15px 25px;
          background: white;
          border-bottom: 1px solid #edf2f7;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .top-bar h1 {
          font-size: 20px;
          font-weight: 600;
          color: #2d3748;
        }
        
        .header-actions {
          display: flex;
          gap: 16px;
          align-items: center;
        }
        
        .btn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-icon img {
          width: 16px;    /* Reduced from 18px */
          height: 16px;   /* Reduced from 18px */
          object-fit: contain;
        }
        
        .user-avatar-container {
          position: relative;
          display: inline-block;
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: #38A169; /* GREEN */
          color: white;
          font-weight: 600;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: none;
        }

        // .logout-tooltip {
        //   position: absolute;
        //   bottom: -32px;
        //   left: 50%;
        //   transform: translateX(-50%);
        //   background: #88f09dff;
        //   color: white;
        //   padding: 4px 8px;
        //   border-radius: 4px;
        //   font-size: 12px;
        //   opacity: 0;
        //   visibility: hidden;
        //   transition: opacity 0.2s;
        // }
        .logout-tooltip {
          position: absolute;
          bottom: -32px;
          left: 50%;
          transform: translateX(-50%);
          background: #1a202c;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s, visibility 0.2s;
          pointer-events: none;
          z-index: 10;
        }

        .user-avatar-container:hover .logout-tooltip {
          opacity: 1;
          visibility: visible;
        }
        
        .content-wrapper {
          flex: 1;
          overflow-y: auto;
          padding: 0; /* AdminRoutePlanner handles its own padding */
        }
      `}</style>

      <aside className="sidebar">
        <div className="sidebar-header">
          <img src={logoIcon} alt="Company Logo" />
          Trash Masters Co.
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <Link
                to="/dashboard"
                className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}
              >
                <img src={dashboardIcon} alt="Dashboard" />
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link
                to="/drivers"
                className={`nav-link ${isActive("/drivers") ? "active" : ""}`}
              >
                <img src={driversIcon} alt="Drivers" />
                <span>Drivers</span>
              </Link>
            </li>
            <li>
              <Link
                to="/route-planner"
                className={`nav-link ${isActive("/route-planner") ? "active" : ""}`}
              >
                <img src={routePlannerIcon} alt="Route Planner" />
                <span>Route Planner</span>
              </Link>
            </li>
            <li>
              <Link
                to="/route-status"
                className={`nav-link ${isActive("/route-status") ? "active" : ""}`}
              >
                <img src={routeStatusIcon} alt="Route Status" />
                <span>Route Status</span>
              </Link>
            </li>
            <li>
              <Link
                to="/teams"
                className={`nav-link ${isActive("/teams") ? "active" : ""}`}
              >
                <img src={teamsIcon} alt="Teams" />
                <span>Teams</span>
              </Link>
            </li>
            <li>
              <Link
                to="/deployments"
                className={`nav-link ${isActive("/deployments") ? "active" : ""}`}
              >
                <img src={deploymentsIcon} alt="Deployments" />
                <span>Deployments</span>
              </Link>
            </li>
            <li>
              <Link
                to="/settings"
                className={`nav-link ${isActive("/settings") ? "active" : ""}`}
              >
                <img src={settingsIcon} alt="Settings" />
                <span>Settings</span>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      <div className="main-area">
        <header className="top-bar">
          <h1>{getPageTitle()}</h1>
          <div className="header-actions">
            <button className="btn-icon" aria-label="Notifications">
              <img src={bellIcon} alt="Notifications" />
            </button>
            <div className="user-avatar-container">
              <button
                className="user-avatar"
                onClick={handleLogout}
                aria-label="Log out"
              >
                JP
              </button>
              <div className="logout-tooltip">Log out</div>
            </div>
          </div>
        </header>
        <main className="content-wrapper">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
