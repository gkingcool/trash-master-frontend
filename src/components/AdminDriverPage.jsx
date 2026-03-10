// src/components/AdminDriverPage.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/employees";

const AdminDriverPage = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  // Fetch drivers from backend
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await axios.get(API_BASE_URL);
        const employees = response.data;

        // Filter only drivers and map to driver format
        const driverData = employees
          .filter((emp) => emp.role?.toUpperCase() === "DRIVER")
          .map((emp) => ({
            id: emp.employeeId,
            name: `${emp.firstName} ${emp.lastName}`,
            status:
              emp.status === "ACTIVE" || emp.active ? "active" : "offline",
            currentRoute: null,
            // vehicle: `Truck #${Math.floor(Math.random() * 20) + 1}`,
            // Deterministic vehicle assignment based on employeeId
            vehicle: `Truck #${(parseInt(emp.employeeId?.replace(/\D/g, "") || "0") % 20) + 1}`,
            completedStops: Math.floor(Math.random() * 15),
            totalStops: Math.floor(Math.random() * 20) + 10,
            progress: 0,
            location: emp.status === "ACTIVE" ? "On Route" : "Depot",
            phone: emp.phone || "N/A",
            email: emp.email,
            avatar: `${emp.firstName?.[0] || ""}${emp.lastName?.[0] || ""}`,
            todayCollection: `${(Math.random() * 50).toFixed(1)} tons`,
            efficiency: `${Math.floor(Math.random() * 15) + 85}%`,
            lastUpdate: "Just now",
            employeeId: emp.employeeId,
            firstName: emp.firstName,
            lastName: emp.lastName,
          }));

        setDrivers(driverData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching drivers:", err);
        setError("Failed to load drivers. Make sure backend is running.");
        setLoading(false);
      }
    };

    fetchDrivers();

    // Refresh every 30 seconds
    const interval = setInterval(fetchDrivers, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate stats
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

  // Filter drivers
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

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .page-title {
          font-size: 24px;
          font-weight: 600;
          color: #2d3748;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .btn-primary {
          background: #38a169;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          background: #2f855a;
        }

        .btn-secondary {
          background: white;
          color: #4a5568;
          border: 1px solid #e2e8f0;
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: #f8fafc;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .stat-label {
          font-size: 14px;
          color: #4a5568;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #1a202c;
        }

        .stat-subtitle {
          font-size: 12px;
          color: #718096;
          margin-top: 4px;
        }

        .filter-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          align-items: center;
        }

        .filter-label {
          font-size: 14px;
          color: #4a5568;
          font-weight: 500;
        }

        .filter-buttons {
          display: flex;
          gap: 8px;
        }

        .filter-btn {
          padding: 8px 16px;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .filter-btn.active {
          background: #38a169;
          color: white;
          border-color: #38a169;
        }

        .filter-btn:hover:not(.active) {
          background: #f8fafc;
        }

        .drivers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 20px;
        }

        .driver-card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid transparent;
        }

        .driver-card:hover {
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .driver-card.selected {
          border-color: #38a169;
        }

        .driver-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .driver-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .driver-avatar {
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

        .driver-details h3 {
          margin: 0;
          font-size: 16px;
          color: #2d3748;
          font-weight: 600;
        }

        .driver-id {
          font-size: 13px;
          color: #718096;
          margin-top: 2px;
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .status-active {
          background: #c6f6d5;
          color: #38a169;
        }

        .status-idle {
          background: #e2e8f0;
          color: #4a5568;
        }

        .status-offline {
          background: #fed7d7;
          color: #e53e3e;
        }

        .driver-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .driver-stat {
          padding: 12px;
          background: #f8fafc;
          border-radius: 6px;
        }

        .driver-stat-label {
          font-size: 12px;
          color: #718096;
          margin-bottom: 4px;
        }

        .driver-stat-value {
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;
        }

        .progress-section {
          margin-bottom: 16px;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 13px;
        }

        .progress-label {
          color: #4a5568;
        }

        .progress-value {
          color: #2d3748;
          font-weight: 600;
        }

        .progress-bar {
          height: 8px;
          background: #edf2f7;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #38a169;
          border-radius: 4px;
          transition: width 0.3s;
        }

        .driver-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid #edf2f7;
          font-size: 13px;
        }

        .driver-location {
          color: #4a5568;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .driver-time {
          color: #718096;
        }

        .driver-detail-modal {
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

        .driver-detail-modal.open {
          transform: translateX(0);
        }

        .modal-header {
          padding: 24px;
          border-bottom: 1px solid #edf2f7;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 600;
          color: #2d3748;
          margin: 0;
        }

        .close-btn {
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

        .close-btn:hover {
          background: #f8fafc;
          color: #2d3748;
        }

        .modal-body {
          padding: 24px;
        }

        .detail-section {
          margin-bottom: 28px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f8fafc;
        }

        .detail-label {
          color: #718096;
          font-size: 14px;
        }

        .detail-value {
          color: #2d3748;
          font-weight: 500;
          font-size: 14px;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .action-btn {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-view-route {
          background: #38a169;
          color: white;
        }

        .btn-view-route:hover {
          background: #2f855a;
        }

        .btn-contact {
          background: #3182ce;
          color: white;
        }

        .btn-contact:hover {
          background: #2c5282;
        }

        .overlay {
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

        .overlay.show {
          opacity: 1;
          visibility: visible;
        }

        .no-drivers {
          grid-column: 1 / -1; /* Span all columns */
          text-align: center;
          padding: 120px 20px;
          color: #718096;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 500px;
          width: 100%
        }

        .no-drivers-icon {
          font-size: 80px;
          margin-bottom: 24px;
          opacity: 0.5;
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
                    <span className="progress-value">{driver.progress}%</span>
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

      {/* Driver Detail Modal */}
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
                <button className="action-btn btn-view-route">
                  View Live Route
                </button>
                <button className="action-btn btn-contact">
                  Contact Driver
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDriverPage;
