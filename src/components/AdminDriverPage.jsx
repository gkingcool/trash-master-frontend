// src/components/AdminDriverPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/employees";
const ROUTES_API_URL = "http://localhost:8080/api/routes";
const NOTIFICATIONS_API_URL = "http://localhost:8080/api/notifications";

const AdminDriverPage = () => {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState("");

  // Fetch drivers and calculate real-time stats
  useEffect(() => {
    const fetchDriversData = async () => {
      try {
        setLoading(true);
        const employeesResponse = await axios.get(API_BASE_URL);
        const allEmployees = employeesResponse.data;
        const routesResponse = await axios.get(ROUTES_API_URL);
        const allRoutes = routesResponse.data;

        const driverEmployees = allEmployees.filter(
          (emp) => emp.role?.toUpperCase() === "DRIVER",
        );

        const driverData = driverEmployees.map((emp) => {
          const activeRoute = allRoutes.find(
            (route) =>
              route.driverId === emp.employeeId &&
              (route.status === "CREATED" || route.status === "IN_PROGRESS"),
          );

          const completedStops = activeRoute?.completedBinIds?.length || 0;
          const totalStops = activeRoute?.totalStops || 0;
          const efficiency =
            totalStops > 0
              ? Math.round((completedStops / totalStops) * 100)
              : 0;
          const collectionAmount = (completedStops * 0.5).toFixed(1);

          return {
            id: emp.employeeId,
            name: `${emp.firstName} ${emp.lastName}`,
            status:
              emp.status === "ACTIVE" || emp.active ? "active" : "offline",
            currentRoute: activeRoute?.routeNumber || null,
            vehicle: `Truck #${(parseInt(emp.employeeId?.replace(/\D/g, "") || "0") % 20) + 1}`,
            completedStops,
            totalStops,
            progress: totalStops > 0 ? (completedStops / totalStops) * 100 : 0,
            location:
              (emp.status === "ACTIVE" || emp.active) && activeRoute
                ? "On Route"
                : "Depot",
            phone: emp.phone || "N/A",
            email: emp.email,
            avatar: `${emp.firstName?.[0] || ""}${emp.lastName?.[0] || ""}`,
            todayCollection: `${collectionAmount} tons`,
            efficiency: `${efficiency}%`,
            lastUpdate: activeRoute?.updatedAt
              ? new Date(activeRoute.updatedAt).toLocaleTimeString()
              : "Just now",
            employeeId: emp.employeeId,
            firstName: emp.firstName,
            lastName: emp.lastName,
            routeData: activeRoute,
          };
        });

        setDrivers(driverData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching drivers data:", err);
        setError("Failed to load drivers. Make sure backend is running.");
        setLoading(false);
      }
    };

    fetchDriversData();
    const interval = setInterval(fetchDriversData, 30000);
    return () => clearInterval(interval);
  }, []);

  const activeDrivers = drivers.filter((d) => d.status === "active").length;
  const totalCollection = drivers.reduce(
    (acc, d) => acc + parseFloat(d.todayCollection) || 0,
    0,
  );
  const avgEfficiency =
    drivers.length > 0
      ? Math.round(
          drivers.reduce((acc, d) => acc + (parseInt(d.efficiency) || 0), 0) /
            drivers.length,
        )
      : 0;

  const filteredDrivers =
    filterStatus === "all"
      ? drivers
      : drivers.filter((d) => d.status === filterStatus);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "active":
        return "status-active";
      case "idle":
        return "status-idle";
      case "offline":
        return "status-offline";
      default:
        return "";
    }
  };

  const handleViewRoute = (driverId) => {
    navigate(`/driver-tracking/${driverId}`);
  };

  const handleContactDriver = () => {
    if (!selectedDriver) return;
    setMessageText("");
    setShowMessageModal(true);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedDriver) return;

    try {
      await axios.post(NOTIFICATIONS_API_URL, {
        title: "Message from Admin",
        message: messageText,
        driverId: selectedDriver.employeeId,
        type: "INFO",
        isRead: false,
      });

      alert("Message sent successfully!");
      setShowMessageModal(false);
      setMessageText("");
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message. Ensure backend is running.");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div
          className="spinner"
          style={{
            border: "4px solid #f0f0f0",
            borderTop: "4px solid #38a169",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            animation: "spin 1s linear infinite",
            margin: "0 auto",
          }}
        />
        <p style={{ marginTop: "16px", color: "#4a5568" }}>
          Loading drivers...
        </p>
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
    <div className="admin-driver-page">
      <style>{`
        .admin-driver-page {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 20px;
          background-color: #f5f7fa;
          min-height: 100vh;
        }
        .admin-driver-page .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .admin-driver-page .page-title {
          font-size: 24px;
          font-weight: 600;
          color: #2d3748;
          margin: 0;
        }
        .admin-driver-page .header-actions {
          display: flex;
          gap: 12px;
        }
        .admin-driver-page .btn-primary {
          background: #38a169;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .admin-driver-page .btn-primary:hover {  
          background: #2f855a;
        }
        .admin-driver-page .btn-secondary {
          background: white;
          color: #4a5568;
          border: 1px solid #e2e8f0;
          padding: 10px 20px; 
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .admin-driver-page .btn-secondary:hover {
          background: #f8fafc;
        }
        .admin-driver-page .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .admin-driver-page .stat-card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .admin-driver-page .stat-label { 
          font-size: 14px;
          color: #4a5568;
          margin-bottom: 8px;
        }
        .admin-driver-page .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #1a202c;
        }
        .admin-driver-page .stat-subtitle {
          font-size: 12px;
          color: #718096;
          margin-top: 4px;
        }
        .admin-driver-page .filter-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          align-items: center;
        }
        .admin-driver-page .filter-label {
          font-size: 14px;
          color: #4a5568;
          font-weight: 500;
        }
        .admin-driver-page .filter-buttons {
          display: flex;
          gap: 8px;
        }
        .admin-driver-page .filter-btn {
          padding: 8px 16px;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }
        .admin-driver-page .filter-btn.active {
          background: #38a169;
          color: white;
          border-color: #38a169;
        }
        .admin-driver-page .filter-btn:hover:not(.active) {
          background: #f8fafc;
        }
        .admin-driver-page .drivers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 20px;
        }
        .admin-driver-page .driver-card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid transparent;
        }
        .admin-driver-page .driver-card:hover {
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }
        .admin-driver-page .driver-card.selected {
          border-color: #38a169;
        }
        .admin-driver-page .driver-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        .admin-driver-page .driver-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .admin-driver-page .driver-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #38a169;
          color: white;
          font-weight: 600;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .admin-driver-page .driver-details h3 {
          margin: 0;
          font-size: 16px;
          color: #2d3748;
          font-weight: 600;
        }
        .admin-driver-page .driver-id {
          font-size: 13px;
          color: #718096;
          margin-top: 2px;
        }
        .admin-driver-page .status-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }
        .admin-driver-page .status-active {
          background: #c6f6d5;
          color: #38a169;
        }
        .admin-driver-page .status-idle {
          background: #e2e8f0;
          color: #4a5568;
        }
        .admin-driver-page .status-offline {
          background: #fed7d7;
          color: #e53e3e;
        }
        .admin-driver-page .driver-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        .admin-driver-page .driver-stat {
          padding: 12px;
          background: #f8fafc;
          border-radius: 6px;
        }
        .admin-driver-page .driver-stat-label {
          font-size: 12px;
          color: #718096;
          margin-bottom: 4px;
        }
        .admin-driver-page .driver-stat-value { 
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;
        }
        .admin-driver-page .progress-section {
          margin-bottom: 16px;
        }
        .admin-driver-page .progress-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 13px;
        }
        .admin-driver-page .progress-label {
          color: #4a5568;
        }
        .admin-driver-page .progress-value {
          color: #2d3748;
          font-weight: 600;
        }
        .admin-driver-page .progress-bar {
          height: 8px;
          background: #edf2f7;
          border-radius: 4px;
          overflow: hidden;
        }
        .admin-driver-page .progress-fill {
          height: 100%;
          background: #38a169;
          border-radius: 4px;
          transition: width 0.3s;
        }
        .admin-driver-page .driver-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid #edf2f7;
          font-size: 13px;
        }
        .admin-driver-page .driver-location {
          color: #4a5568;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .admin-driver-page .driver-time {
          color: #718096;
        }
        .admin-driver-page .driver-detail-modal {
          position: fixed;
          top: 0;
          right: 0;
          width: 450px;
          height: 100vh;
          background: white;
          box-shadow: -4px 0 12px rgba(0,0,0,0.1);
          z-index: 1000;
          overflow-y: auto; 
          transform: translateX(100%);
          transition: transform 0.3s;
        }
        .admin-driver-page .driver-detail-modal.open {
          transform: translateX(0);
        }
        .admin-driver-page .modal-header {
          padding: 24px;
          border-bottom: 1px solid #edf2f7;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .admin-driver-page .modal-title {
          font-size: 20px;
          font-weight: 600;
          color: #2d3748;
          margin: 0;
        }
        .admin-driver-page .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #718096;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .admin-driver-page .close-btn:hover {
          background: #f8fafc;
          color: #2d3748;
        }
        .admin-driver-page .modal-body {
          padding: 24px;
        }
        .admin-driver-page .detail-section {
          margin-bottom: 28px;
        }
        .admin-driver-page .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .admin-driver-page .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f8fafc;
        }
        .admin-driver-page .detail-label {
          color: #718096;
          font-size: 14px;
        }
        .admin-driver-page .detail-value {
          color: #2d3748;
          font-weight: 500;
          font-size: 14px;
        }
        .admin-driver-page .action-buttons {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }
        .admin-driver-page .action-btn {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .admin-driver-page .btn-view-route {
          background: #38a169;
          color: white;
        }
        .admin-driver-page .btn-view-route:hover {
          background: #2f855a;
        }
        .admin-driver-page .btn-contact {
          background: #3182ce;
          color: white;
        }
        .admin-driver-page .btn-contact:hover {
          background: #2c5282;
        }
        .admin-driver-page .overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          z-index: 999;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s;
        }
        .admin-driver-page .overlay.show {
          opacity: 1;
          visibility: visible;
        }
        .admin-driver-page .no-drivers {
          grid-column: 1 / -1;
          text-align: center;
          padding: 120px 20px;
          color: #718096;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 500px;
          width: 100%;
        }
        .admin-driver-page .no-drivers-icon {
          font-size: 80px;
          margin-bottom: 24px;
          opacity: 0.5;
        }
        /* ✅ New Styles for Centered Message Modal */
        .admin-driver-page .message-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          z-index: 2000; /* Higher than side modal */
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .admin-driver-page .message-modal-content {
          background: white;
          padding: 24px;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        .admin-driver-page .message-textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #cbd5e0;
          border-radius: 6px;
          font-size: 14px;
          minHeight: 120px;
          box-sizing: border-box;
          margin-bottom: 16px;
          font-family: inherit;
          resize: vertical;
        }
        .admin-driver-page .message-textarea:focus {
          outline: none;
          border-color: #38a169;
          box-shadow: 0 0 0 2px rgba(56, 161, 105, 0.1);
        }
      `}</style>

      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Driver Management</h1>
        <div className="header-actions">
          <button className="btn-secondary">Export Report</button>
          <button
            className="btn-primary"
            onClick={() => window.location.reload()}
            title="Refresh driver data"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Drivers</div>
          <div className="stat-value">{drivers.length}</div>
          <div className="stat-subtitle">All registered drivers</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Now</div>
          <div className="stat-value" style={{ color: "#38a169" }}>
            {activeDrivers}
          </div>
          <div className="stat-subtitle">Currently on route</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Today's Collection</div>
          <div className="stat-value">{totalCollection.toFixed(1)} tons</div>
          <div className="stat-subtitle">Total collected today</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg. Efficiency</div>
          <div className="stat-value" style={{ color: "#38a169" }}>
            {avgEfficiency}%
          </div>
          <div className="stat-subtitle">Performance metric</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <span className="filter-label">Filter by status:</span>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterStatus === "all" ? "active" : ""}`}
            onClick={() => setFilterStatus("all")}
          >
            All Drivers
          </button>
          <button
            className={`filter-btn ${filterStatus === "active" ? "active" : ""}`}
            onClick={() => setFilterStatus("active")}
          >
            Active
          </button>
          <button
            className={`filter-btn ${filterStatus === "offline" ? "active" : ""}`}
            onClick={() => setFilterStatus("offline")}
          >
            Offline
          </button>
        </div>
      </div>

      {/* Drivers Grid */}
      <div className="drivers-grid">
        {filteredDrivers.length === 0 ? (
          <div className="no-drivers">
            <div className="no-drivers-icon">🚚</div>
            <h3
              style={{
                fontSize: "20px",
                color: "#2d3748",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              No drivers found
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#718096",
                margin: 0,
              }}
            >
              {filterStatus === "all"
                ? "Add drivers from the Teams page"
                : "Try adjusting your filter criteria"}
            </p>
          </div>
        ) : (
          filteredDrivers.map((driver) => (
            <div
              key={driver.id}
              className={`driver-card ${
                selectedDriver?.id === driver.id ? "selected" : ""
              }`}
              onClick={() => setSelectedDriver(driver)}
            >
              <div className="driver-header">
                <div className="driver-info">
                  <div className="driver-avatar">{driver.avatar}</div>
                  <div className="driver-details">
                    <h3>{driver.name}</h3>
                    <div className="driver-id">{driver.id}</div>
                  </div>
                </div>
                <span
                  className={`status-badge ${getStatusBadgeClass(driver.status)}`}
                >
                  {driver.status}
                </span>
              </div>

              <div className="driver-stats">
                <div className="driver-stat">
                  <div className="driver-stat-label">Vehicle</div>
                  <div className="driver-stat-value">{driver.vehicle}</div>
                </div>
                <div className="driver-stat">
                  <div className="driver-stat-label">Collection Today</div>
                  <div className="driver-stat-value">
                    {driver.todayCollection}
                  </div>
                </div>
                <div className="driver-stat">
                  <div className="driver-stat-label">Stops Completed</div>
                  <div className="driver-stat-value">
                    {driver.completedStops}/{driver.totalStops}
                  </div>
                </div>
                <div className="driver-stat">
                  <div className="driver-stat-label">Efficiency</div>
                  <div className="driver-stat-value">{driver.efficiency}</div>
                </div>
              </div>

              {driver.currentRoute && (
                <div className="progress-section">
                  <div className="progress-header">
                    <span className="progress-label">Route Progress</span>
                    <span className="progress-value">
                      {Math.round(driver.progress)}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${driver.progress}%` }}
                    ></div>
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#718096",
                      marginTop: "6px",
                    }}
                  >
                    Route: {driver.currentRoute}
                  </div>
                </div>
              )}

              <div className="driver-footer">
                <div className="driver-location">📍 {driver.location}</div>
                <div className="driver-time">{driver.lastUpdate}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Driver Detail Modal (Side Panel) */}
      <div
        className={`overlay ${selectedDriver ? "show" : ""}`}
        onClick={() => setSelectedDriver(null)}
      ></div>

      <div className={`driver-detail-modal ${selectedDriver ? "open" : ""}`}>
        {selectedDriver && (
          <>
            <div className="modal-header">
              <h2 className="modal-title">Driver Details</h2>
              <button
                className="close-btn"
                onClick={() => setSelectedDriver(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {/* Driver Info */}
              <div className="detail-section">
                <div className="section-title">Personal Information</div>
                <div className="detail-row">
                  <span className="detail-label">Full Name</span>
                  <span className="detail-value">{selectedDriver.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Driver ID</span>
                  <span className="detail-value">{selectedDriver.id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Phone</span>
                  <span className="detail-value">{selectedDriver.phone}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{selectedDriver.email}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status</span>
                  <span
                    className={`status-badge ${getStatusBadgeClass(
                      selectedDriver.status,
                    )}`}
                  >
                    {selectedDriver.status}
                  </span>
                </div>
              </div>

              {/* Route Information */}
              <div className="detail-section">
                <div className="section-title">Current Assignment</div>
                <div className="detail-row">
                  <span className="detail-label">Vehicle</span>
                  <span className="detail-value">{selectedDriver.vehicle}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Route</span>
                  <span className="detail-value">
                    {selectedDriver.currentRoute || "Not assigned"}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Current Location</span>
                  <span className="detail-value">
                    {selectedDriver.location}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Stops Progress</span>
                  <span className="detail-value">
                    {selectedDriver.completedStops} of{" "}
                    {selectedDriver.totalStops} stops
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Collection Today</span>
                  <span className="detail-value">
                    {selectedDriver.todayCollection}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Efficiency Rate</span>
                  <span className="detail-value">
                    {selectedDriver.efficiency}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <button
                  className="action-btn btn-view-route"
                  onClick={() => handleViewRoute(selectedDriver.id)}
                >
                  View Live Route
                </button>
                {/* ✅ Updated to open centered modal */}
                <button
                  className="action-btn btn-contact"
                  onClick={handleContactDriver}
                >
                  Contact Driver
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ✅ New Centered Message Modal */}
      {showMessageModal && (
        <div className="message-modal-overlay">
          <div
            className="message-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{ marginTop: 0, marginBottom: "16px", color: "#2d3748" }}
            >
              Message to {selectedDriver?.name}
            </h3>
            <textarea
              className="message-textarea"
              placeholder="Type your message here (e.g., 'Return to depot', 'Check bin #12')..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                className="btn-secondary"
                onClick={() => setShowMessageModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
                style={{ opacity: !messageText.trim() ? 0.6 : 1 }}
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDriverPage;
