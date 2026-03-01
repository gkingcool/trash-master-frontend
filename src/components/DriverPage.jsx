// src/components/DriverPage.jsx
import React, { useState, useEffect } from "react";

const DriverPage = () => {
  // Get driver initials from localStorage
  const getDriverInitials = () => {
    try {
      const auth = JSON.parse(localStorage.getItem("auth"));
      if (auth && auth.username) {
        const parts = auth.username.split(".");
        if (parts.length >= 2) {
          return `${parts[0].charAt(0).toUpperCase()}${parts[1].charAt(0).toUpperCase()}`;
        }
        return auth.username.substring(0, 2).toUpperCase();
      }
    } catch (e) {
      console.warn("Failed to parse auth data");
    }
    return "DR";
  };

  const handleLogout = () => {
    localStorage.removeItem("auth");
    window.location.href = "/login";
  };

  // Full route data
  const routeStops = [
    {
      id: 1,
      binId: "Bin #07",
      location: "Oakwood Plaza",
      address: "456 Oak St, Bellevue, WA",
      notes: "Near main entrance, behind planter",
      binType: "Recycling (Blue)",
      lastCollected: "Oct 23, 2026 • 8:30 AM",
      eta: "5 min",
      distance: "0.8 mi",
    },
    {
      id: 2,
      binId: "Bin #97",
      location: "Riverside Apartments",
      address: "789 River Rd, Bellevue, WA",
      notes: "In parking garage, level B1",
      binType: "Recycling (Blue)",
      lastCollected: "Oct 23, 2026 • 9:15 AM",
      eta: "3 min",
      distance: "0.5 mi",
    },
    {
      id: 3,
      binId: "Bin #04",
      location: "Westside Mall",
      address: "101 Mall Blvd, Bellevue, WA",
      notes: "Near food court entrance",
      binType: "General Waste (Black)",
      lastCollected: "Oct 23, 2026 • 9:45 AM",
      eta: "4 min",
      distance: "0.6 mi",
    },
    {
      id: 4,
      binId: "Bin #06",
      location: "Bellevue Library",
      address: "111 Library Way, Bellevue, WA",
      notes: "Behind building, near loading dock",
      binType: "Recycling (Blue)",
      lastCollected: "Oct 23, 2026 • 10:00 AM",
      eta: "2 min",
      distance: "0.4 mi",
    },
    {
      id: 5,
      binId: "Bin #102",
      location: "Central Park",
      address: "123 Green Ave, Bellevue, WA",
      notes: "Behind main entrance, near recycling kiosk",
      binType: "Recycling (Blue)",
      lastCollected: "Oct 23, 2026 • 10:15 AM",
      eta: "2 min",
      distance: "0.3 mi",
    },
    {
      id: 6,
      binId: "Bin #08",
      location: "Eastside Community Center",
      address: "222 Community Dr, Bellevue, WA",
      notes: "In rear parking lot",
      binType: "Organic (Green)",
      lastCollected: "Oct 23, 2026 • 10:30 AM",
      eta: "3 min",
      distance: "0.5 mi",
    },
    {
      id: 7,
      binId: "Bin #05",
      location: "Northridge Estates",
      address: "333 Northridge Ln, Bellevue, WA",
      notes: "Near clubhouse entrance",
      binType: "Recycling (Blue)",
      lastCollected: "Oct 23, 2026 • 10:45 AM",
      eta: "4 min",
      distance: "0.7 mi",
    },
  ];

  const [currentStopIndex, setCurrentStopIndex] = useState(4);
  const currentStop = routeStops[currentStopIndex];

  const handleBack = () => {
    if (currentStopIndex > 0) {
      setCurrentStopIndex(currentStopIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentStopIndex < routeStops.length - 1) {
      setCurrentStopIndex(currentStopIndex + 1);
    }
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "ArrowLeft") handleBack();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentStopIndex]);

  return (
    <div
      className="driver-page"
      style={{
        backgroundColor: "white",
        minHeight: "100vh",
        fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
        padding: "0 12px",
      }}
    >
      <style>{`
        .driver-page { }

        /* Title Bar */
        .title-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 5px;
          border-bottom: 1px solid #edf2f7;
          margin-bottom: 20px;
          height: 52px;
        }

        /* Navigation buttons container */
        .nav-buttons {
          display: flex;
          gap: 8px; /* Space between back and forward buttons */
        }

        .nav-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }

        .nav-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .back-icon, .next-icon {
          fill: #4a5568;
        }

        .avatar-initials {
          font-size: 14px;
          font-weight: 600;
          color: #38a169;
        }

        .title {
          font-size: 20px;
          font-weight: 600;
          color: #1a202c;
          flex: 1;
          text-align: center;
          margin: 0;
        }

        /* Logout Tooltip */
        .logout-btn {
          position: relative;
        }

        .logout-btn:hover::after {
          content: "Logout";
          position: absolute;
          bottom: -24px;
          left: 50%;
          transform: translateX(-50%);
          background: #1a202c;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          opacity: 0.9;
          z-index: 10;
        }

        /* Map Placeholder */
        .map-placeholder {
          height: 280px;
          background: #edf2f7;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #64748b;
          font-size: 16px;
          text-align: center;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .map-placeholder h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1a202c;
          margin-bottom: 8px;
        }

        /* Stop Info Card */
        .stop-info {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .stop-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .stop-title {
          font-size: 20px;
          font-weight: 600;
          color: #1a202c;
        }

        .stop-subtitle {
          font-size: 14px;
          color: #4a5568;
          margin-top: 4px;
        }

        .stop-details {
          margin: 20px 0;
          color: #2d3748;
          font-size: 14px;
          line-height: 1.5;
          text-align: center;
        }

        .detail-row {
          display: flex;
          justify-content: center;
          margin-bottom: 10px;
          gap: 16px;
        }

        .detail-label {
          font-weight: 500;
          color: #4a5568;
          white-space: nowrap;
        }

        .detail-value {
          flex: 1;
          text-align: left;
        }

        /* Stats at bottom of card */
        .stop-stats {
          display: flex;
          justify-content: space-between;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #edf2f7;
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          font-weight: 600;
          font-size: 18px;
          color: #1a202c;
        }

        .stat-label {
          font-size: 12px;
          color: #718096;
        }

        /* Action Buttons */
        .action-buttons {
          display: flex;
          gap: 12px;
          margin: 0 auto;
          max-width: 100%;
        }

        .btn {
          flex: 1;
          padding: 12px 8px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 0;
        }

        .btn-primary { background: #38a169; color: white; }
        .btn-primary:hover { background: #2f855a; }
        .btn-warning { background: #dd6b20; color: white; }
        .btn-warning:hover { background: #c05621; }
        .btn-danger { background: #e53e3e; color: white; }
        .btn-danger:hover { background: #c53030; }

        /* Navigation hint */
        .nav-hint {
          text-align: center;
          color: #718096;
          font-size: 12px;
          margin-top: 8px;
        }
      `}</style>

      {/* Title Bar with Navigation Buttons */}
      <div className="title-bar">
        <div className="nav-buttons">
          <div
            className="nav-btn"
            onClick={handleBack}
            disabled={currentStopIndex === 0}
            aria-label="Previous stop"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              className="back-icon"
            >
              <path d="M20 11H7.414l4.293-4.293L10 5l-7 7 7 7 1.707-1.707L7.414 13H20v-2z" />
            </svg>
          </div>
          <div
            className="nav-btn"
            onClick={handleNext}
            disabled={currentStopIndex === routeStops.length - 1}
            aria-label="Next stop"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              className="next-icon"
            >
              <path d="M4 11h12.586l-4.293-4.293L14 5l7 7-7 7-1.707-1.707L16.586 13H4v-2z" />
            </svg>
          </div>
        </div>
        <div className="title">Route #R-2026-10-24</div>
        <div
          className="nav-btn logout-btn"
          onClick={handleLogout}
          aria-label="Logout"
        >
          <span className="avatar-initials">{getDriverInitials()}</span>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="map-placeholder">
        <h3>Route View</h3>
        <p>Current route: {currentStop.location} → Next Stop</p>
      </div>

      {/* Stop Info */}
      <div className="stop-info">
        <div className="stop-header">
          <div>
            <div className="stop-title">
              Stop #{currentStop.id}: {currentStop.binId}
            </div>
            <div className="stop-subtitle">{currentStop.location}</div>
          </div>
          <div style={{ fontSize: "14px", color: "#4a5568" }}>
            {currentStop.eta} • {currentStop.distance}
          </div>
        </div>

        <div className="stop-details">
          <div className="detail-row">
            <span className="detail-label">Address:</span>
            <span className="detail-value">{currentStop.address}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Notes:</span>
            <span className="detail-value">{currentStop.notes}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Bin Type:</span>
            <span className="detail-value">{currentStop.binType}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Last Collected:</span>
            <span className="detail-value">{currentStop.lastCollected}</span>
          </div>
        </div>

        <div className="stop-stats">
          <div className="stat-item">
            <div className="stat-value">{routeStops.length}</div>
            <div className="stat-label">Total Stops</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">12.4 mi</div>
            <div className="stat-label">Distance</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="btn btn-primary">Confirm Pickup</button>
        <button className="btn btn-warning">Unable to Access</button>
        <button className="btn btn-danger">
          <span>⚠️</span> Report Issue
        </button>
      </div>

      {/* Navigation hint */}
      <div className="nav-hint">
        Use ← → arrow keys or tap buttons to navigate stops
      </div>
    </div>
  );
};

export default DriverPage;
