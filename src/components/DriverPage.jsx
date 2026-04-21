// src/components/DriverPage.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import alertIcon from "../assets/icons/alert-icon.png";

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// ✅ Map Controller: Uses panTo to AVOID zooming in/out
function MapController({ currentStop, bins, depotCoordinates }) {
  const map = useMap();

  // ✅ 1. Initial Load: Fit map to show ALL stops and the depot
  useEffect(() => {
    if (bins.length > 0 && depotCoordinates) {
      const allCoords = [
        depotCoordinates,
        ...bins.map((b) => [b.latitude, b.longitude]),
      ];
      map.fitBounds(allCoords, { padding: [50, 50] });
    }
  }, [map, bins, depotCoordinates]);

  // ✅ 2. Navigation: Smoothly move map WITHOUT changing zoom level
  useEffect(() => {
    if (currentStop && currentStop.latitude && currentStop.longitude) {
      map.panTo([currentStop.latitude, currentStop.longitude], {
        animate: true,
        duration: 0.5,
      });
    }
  }, [currentStop, map]);

  return null;
}

const DriverPage = () => {
  const [route, setRoute] = useState(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const notificationRef = useRef(null);

  // ✅ Driver info state for initials
  const [driverInitials, setDriverInitials] = useState("DR");

  // ✅ Notification States (for bell icon)
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Modal States
  const [showReportModal, setShowReportModal] = useState(false);
  const [issueText, setIssueText] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Completion State
  const [routeCompleted, setRouteCompleted] = useState(false);

  const [hoveredNotifId, setHoveredNotifId] = useState(null);

  // Bellevue Facility Coordinates
  const depotCoordinates = [47.6101, -122.2015];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchCurrentRoute();
    fetchNotifications(); // ✅ Fetch notifications for bell

    // ✅ Extract Initials from Login Data
    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}");
      let name = auth.name;
      if (!name && auth.firstName && auth.lastName) {
        name = `${auth.firstName} ${auth.lastName}`;
      }
      if (name) {
        const names = name.trim().split(" ");
        if (names.length >= 2) {
          setDriverInitials((names[0][0] + names[1][0]).toUpperCase());
        } else if (names.length === 1) {
          setDriverInitials(names[0].substring(0, 2).toUpperCase());
        }
      }
    } catch (e) {
      console.error("Error parsing auth data:", e);
    }

    // Poll for new notifications every 15 seconds
    const notifInterval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(notifInterval);
  }, []);

  // ✅ Fetch Notifications for this Driver
  const fetchNotifications = async () => {
    try {
      const auth = JSON.parse(localStorage.getItem("auth"));
      const driverId = auth?.employeeId;
      if (!driverId) return;

      const response = await axios.get(
        "http://localhost:8080/api/notifications",
      );

      // Filter notifications specific to this driver
      const driverNotifs = response.data.filter((n) => n.driverId === driverId);
      setNotifications(driverNotifs);

      // Count unread
      const unread = driverNotifs.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const deleteNotification = async (notifId, e) => {
    if (e) e.stopPropagation(); // Prevent marking as read when deleting

    try {
      await axios.delete(`http://localhost:8080/api/notifications/${notifId}`);
      // Remove from local state
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error deleting notification:", err);
      alert("Failed to delete notification");
    }
  };

  // Update the useEffect to clean up intervals properly
  useEffect(() => {
    fetchCurrentRoute();
    fetchNotifications();

    // Clear any existing interval first
    const notifInterval = setInterval(fetchNotifications, 15000);

    return () => {
      clearInterval(notifInterval);
    };
  }, []);

  // ✅ Mark Notification as Read
  const markAsRead = async (notifId) => {
    try {
      await axios.put(
        `http://localhost:8080/api/notifications/${notifId}/read`,
      );
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  // ✅ Helper to determine color based on fill level
  const getBinColor = (fillLevel) => {
    if (fillLevel === 0) return "#a0aec0"; // Gray (Empty)
    if (fillLevel >= 90) return "#e53e3e"; // Red (Critical)
    if (fillLevel >= 70) return "#dd6b20"; // Orange (Full)
    return "#38a169"; // Green (Normal)
  };

  // ✅ Fetch Current Route
  const fetchCurrentRoute = async () => {
    try {
      const auth = JSON.parse(localStorage.getItem("auth"));
      const driverId = auth?.employeeId;

      if (!driverId) {
        setError("Driver ID not found. Please login again.");
        setLoading(false);
        return;
      }

      console.log("Fetching route for driver: ", driverId);

      const response = await axios.get(
        `http://localhost:8080/api/routes/by-driver/${driverId}/current`,
      );

      const routeData = response.data;
      setRoute(routeData);

      const binPromises = routeData.binIds.map((binId) =>
        axios.get(`http://localhost:8080/api/bins/${binId}`),
      );
      const binResponses = await Promise.all(binPromises);
      setBins(binResponses.map((res) => res.data));
      setLoading(false);
    } catch (err) {
      console.error("Error fetching route: ", err);
      if (err.response?.status === 404) {
        setError(
          "No route assigned. Contact administrator to generate a route.",
        );
      } else if (err.response?.status === 401) {
        setError("Unauthorized. Please login again.");
        localStorage.removeItem("auth");
        window.location.href = "/login";
      } else {
        setError("Failed to load route. Please try again.");
      }
      setLoading(false);
    }
  };

  // ✅ Actual pickup logic (called after confirmation)
  const confirmPickup = async () => {
    try {
      const currentBin = bins[currentStopIndex];
      await axios.put(
        `http://localhost:8080/api/routes/${route.id}/bins/${currentBin.id}/collect`,
      );

      // Reset fill level locally
      const updatedBins = [...bins];
      updatedBins[currentStopIndex] = { ...currentBin, fillLevel: 0 };
      setBins(updatedBins);

      // Move to next or finish
      if (currentStopIndex < bins.length - 1) {
        setCurrentStopIndex(currentStopIndex + 1);
      } else {
        setRouteCompleted(true);
      }
    } catch (err) {
      console.error("Error confirming pickup:", err);
      alert("Failed to confirm pickup");
    } finally {
      setShowConfirmModal(false);
    }
  };

  const handleUnableToAccess = async () => {
    try {
      const currentBin = bins[currentStopIndex];
      await axios.put(
        `http://localhost:8080/api/routes/${route.id}/bins/${currentBin.id}/skip`,
      );
      if (currentStopIndex < bins.length - 1) {
        setCurrentStopIndex(currentStopIndex + 1);
      }
    } catch (err) {
      console.error("Error skipping bin:", err);
    }
  };

  const openReportModal = () => {
    setIssueText("");
    setShowReportModal(true);
  };

  const submitReport = async () => {
    if (!issueText.trim()) return;
    try {
      const currentBin = bins[currentStopIndex];
      await axios.put(
        `http://localhost:8080/api/routes/${route.id}/bins/${currentBin.id}/report-issue`,
        { description: issueText },
      );
      alert("Issue reported successfully!");
      setShowReportModal(false);
    } catch (err) {
      console.error("Error reporting issue:", err);
      alert("Failed to report issue");
    }
  };

  const handleBack = () => {
    if (currentStopIndex > 0) setCurrentStopIndex(currentStopIndex - 1);
  };

  const handleNext = () => {
    if (currentStopIndex < bins.length - 1) {
      setCurrentStopIndex(currentStopIndex + 1);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div
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
        <p style={{ marginTop: "16px", color: "#4a5568" }}>Loading route...</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🗺️</div>
        <h2 style={{ color: "#1a202c", marginBottom: "8px" }}>
          No Route Assigned
        </h2>
        <p style={{ color: "#718096", marginBottom: "24px" }}>{error}</p>
      </div>
    );
  }

  // ✅ Route Completion Screen
  if (routeCompleted) {
    return (
      <div
        style={{
          backgroundColor: "white",
          minHeight: "100vh",
          fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "500px" }}>
          <div style={{ fontSize: "80px", marginBottom: "24px" }}>🎉</div>
          <h1
            style={{
              fontSize: "32px",
              color: "#1a202c",
              marginBottom: "16px",
              fontWeight: "700",
            }}
          >
            Route Completed!
          </h1>
          <p
            style={{
              fontSize: "18px",
              color: "#4a5568",
              marginBottom: "32px",
              lineHeight: "1.6",
            }}
          >
            Great job! You've successfully collected all {bins.length} stops.
            <br />
            <br />
            Total distance: {route?.totalDistance?.toFixed(1)} miles
          </p>
          <div
            style={{
              display: "flex",
              gap: "16px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => {
                localStorage.removeItem("auth");
                window.location.href = "/login";
              }}
              style={{
                padding: "14px 32px",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "16px",
                border: "none",
                cursor: "pointer",
                background: "#38a169",
                color: "white",
                boxShadow: "0 4px 6px rgba(56, 161, 105, 0.3)",
              }}
            >
              ✓ Logout
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "14px 32px",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "16px",
                border: "1px solid #e2e8f0",
                cursor: "pointer",
                background: "white",
                color: "#4a5568",
              }}
            >
              🔄 Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!route || bins.length === 0) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p style={{ color: "#718096" }}>No Stops to Pick Up</p>
        <p style={{ color: "#718096" }}>Contact administrator.</p>
      </div>
    );
  }

  const currentBin = bins[currentStopIndex];

  // ✅ Route Path: Starts at Depot, then visits each bin in order
  const routePath = [
    depotCoordinates,
    ...bins.map((bin) => [bin.latitude, bin.longitude]),
  ];

  return (
    <div
      style={{
        backgroundColor: "white",
        minHeight: "100vh",
        fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
        padding: "0 12px",
      }}
    >
      {/* Title Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 5px",
          borderBottom: "1px solid #edf2f7",
          marginBottom: "20px",
          height: "52px",
        }}
      >
        <div style={{ display: "flex", gap: "8px" }}>
          <div
            onClick={handleBack}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: currentStopIndex === 0 ? "not-allowed" : "pointer",
              opacity: currentStopIndex === 0 ? 0.5 : 1,
            }}
          >
            ←
          </div>
          <div
            onClick={handleNext}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor:
                currentStopIndex === bins.length - 1
                  ? "not-allowed"
                  : "pointer",
              opacity: currentStopIndex === bins.length - 1 ? 0.5 : 1,
            }}
          >
            →
          </div>
        </div>
        <div
          style={{
            fontSize: "20px",
            fontWeight: "600",
            color: "#1a202c",
            flex: 1,
            textAlign: "center",
          }}
        >
          Route #{route.routeNumber || "Today"}
        </div>

        {/* ✅ Header Actions - Notification Bell + Profile */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* 🔔 Notification Bell - Using custom alertIcon */}
          <div ref={notificationRef} style={{ position: "relative" }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "50%",
                width: "37px",
                height: "37px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
              // onMouseEnter={(e) =>
              //   (e.currentTarget.style.background = "#edf2f7")
              // }
              // onMouseLeave={(e) =>
              //   (e.currentTarget.style.background = "#f8fafc")
              // }
            >
              <img
                src={alertIcon}
                alt="Notifications"
                style={{ width: "16px", height: "16px", objectFit: "contain" }}
              />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "0",
                    right: "0",
                    background: "#e53e3e",
                    color: "white",
                    borderRadius: "50%",
                    minWidth: "18px",
                    height: "18px",
                    fontSize: "11px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid white",
                    padding: "0 4px",
                  }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {/* Notification Dropdown */}
            {showNotifications && (
              <div
                style={{
                  position: "absolute",
                  top: "44px",
                  right: "0",
                  width: "300px",
                  background: "white",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  borderRadius: "8px",
                  zIndex: 1000,
                  maxHeight: "400px",
                  overflowY: "auto",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    padding: "12px",
                    borderBottom: "1px solid #e2e8f0",
                    fontWeight: "600",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  Messages from Admin
                  {unreadCount > 0 && (
                    <span
                      style={{
                        color: "#38a169",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setNotifications((prev) =>
                          prev.map((n) => ({ ...n, isRead: true })),
                        );
                        setUnreadCount(0);
                      }}
                    >
                      Mark all read
                    </span>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      color: "#718096",
                    }}
                  >
                    No messages
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markAsRead(notif.id);
                        alert(`Message from Admin:\n\n${notif.message}`);
                        setShowNotifications(false);
                      }}
                      onMouseEnter={() => setHoveredNotifId(notif.id)}
                      onMouseLeave={() => setHoveredNotifId(null)}
                      style={{
                        padding: "12px",
                        borderBottom: "1px solid #f5f5f5",
                        cursor: "pointer",
                        background: notif.isRead ? "white" : "#f8fafc",
                        position: "relative",
                        transition: "background 0.2s",
                      }}
                    >
                      {/* DELETE BUTTON - Shows on hover */}
                      {hoveredNotifId === notif.id && (
                        <button
                          onClick={(e) => deleteNotification(notif.id, e)}
                          style={{
                            position: "absolute",
                            top: "8px",
                            right: "8px",
                            background: "#fed7d7",
                            border: "none",
                            color: "#e53e3e",
                            cursor: "pointer",
                            width: "24px",
                            height: "24px",
                            borderRadius: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "16px",
                            fontWeight: "600",
                            transition: "all 0.2s",
                            zIndex: 10,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#e53e3e";
                            e.currentTarget.style.color = "white";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#fed7d7";
                            e.currentTarget.style.color = "#e53e3e";
                          }}
                        >
                          ×
                        </button>
                      )}

                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: notif.isRead ? "400" : "600",
                          marginBottom: "4px",
                          paddingRight:
                            hoveredNotifId === notif.id ? "30px" : "0",
                        }}
                      >
                        {notif.title || "Admin Message"}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#4a5568",
                          marginBottom: "4px",
                        }}
                      >
                        {notif.message}
                      </div>
                      <div style={{ fontSize: "11px", color: "#a0aec0" }}>
                        {new Date(notif.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* ✅ Driver Profile Circle - Now shows real initials */}
          <div
            onClick={() => {
              localStorage.removeItem("auth");
              window.location.href = "/login";
            }}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "#38a169",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontWeight: "600",
            }}
            title="Logout"
          >
            {driverInitials}
          </div>
        </div>
      </div>

      {/* ✅ Map Section */}
      <div
        style={{
          height: "350px",
          borderRadius: "12px",
          marginBottom: "24px",
          overflow: "hidden",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          border: "2px solid #e2e8f0",
        }}
      >
        <MapContainer
          center={[47.6101, -122.2015]}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* ✅ Map Controller handles initial view and navigation (panTo) */}
          <MapController
            currentStop={currentBin}
            bins={bins}
            depotCoordinates={depotCoordinates}
          />

          {/* Solid Blue Route Path (Starts at Depot → Bin 1 → Bin 2...) */}
          {/* 1. Outer White Line (Road Background) */}
          <Polyline
            positions={routePath}
            color="#ffffff"
            weight={10}
            opacity={0.9}
            lineCap="round"
            lineJoin="round"
          />
          {/* 2. Inner Blue Line (The Route) */}
          <Polyline
            positions={routePath}
            color="#3182ce"
            weight={6}
            opacity={0.9}
            lineCap="round"
            lineJoin="round"
          />

          {/* Depot Marker (Where the driver starts) */}
          <CircleMarker
            center={depotCoordinates}
            radius={8}
            fillColor="#1a202c"
            color="#fff"
            weight={2}
            opacity={1}
            fillOpacity={0.9}
          >
            <Popup>
              <strong>🏢 Starting Depot</strong>
              <br />
              Trashmasters, Inc Facility
            </Popup>
          </CircleMarker>

          {/* ✅ Render Bin Markers - FIXED: Current bin same style as others */}
          {bins.map((bin, index) => {
            const isCurrent = index === currentStopIndex;

            // ✅ FIX: Same styling for ALL bins - just slightly bigger for current
            const radius = isCurrent ? 10 : 8; // Slightly bigger for visibility
            const color = getBinColor(bin.fillLevel); // ✅ Always use fill-level color
            const weight = 2; // ✅ Same thin border for all bins
            const fillOpacity = 0.85; // ✅ Same transparency for all bins

            return (
              <CircleMarker
                key={bin.id}
                center={[bin.latitude, bin.longitude]}
                radius={radius}
                fillColor={color}
                color="#fff" // White border
                weight={weight}
                opacity={1}
                fillOpacity={fillOpacity}
              >
                <Popup>
                  <strong>{bin.binId}</strong>
                  <br />
                  {bin.locationName}
                  <br />
                  Fill: {bin.fillLevel}%
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Stop Info Card */}
      <div
        style={{
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "20px",
          }}
        >
          <div>
            <div
              style={{ fontSize: "24px", fontWeight: "700", color: "#1a202c" }}
            >
              Stop #{currentStopIndex + 1}: {currentBin?.binId}
            </div>
            <div
              style={{ fontSize: "16px", color: "#4a5568", marginTop: "4px" }}
            >
              {currentBin?.locationName}
            </div>
          </div>
          <div
            style={{
              fontSize: "14px",
              color: "#718096",
              background: "#edf2f7",
              padding: "4px 8px",
              borderRadius: "4px",
            }}
          >
            {currentStopIndex + 1} of {bins.length}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              background: "#f7fafc",
              padding: "12px",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#718096",
                marginBottom: "4px",
              }}
            >
              Fill Level
            </div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: getBinColor(currentBin.fillLevel),
              }}
            >
              {currentBin?.fillLevel || 0}%
            </div>
          </div>
          <div
            style={{
              background: "#f7fafc",
              padding: "12px",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#718096",
                marginBottom: "4px",
              }}
            >
              Distance
            </div>
            <div
              style={{ fontSize: "18px", fontWeight: "600", color: "#1a202c" }}
            >
              {route.totalDistance?.toFixed(1) || "0"} mi total
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #edf2f7", paddingTop: "16px" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <div
              style={{ fontSize: "14px", color: "#4a5568", fontWeight: "500" }}
            >
              📍 Address:
            </div>
            {/* ✅ Display actual bin address or location name */}
            <div style={{ fontSize: "14px", color: "#1a202c" }}>
              {currentBin?.address || currentBin?.locationName || "N/A"}
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
            <div
              style={{ fontSize: "14px", color: "#4a5568", fontWeight: "500" }}
            >
              🕒 Last Collected:
            </div>
            <div style={{ fontSize: "14px", color: "#1a202c" }}>
              {currentBin?.lastCollected
                ? new Date(currentBin.lastCollected).toLocaleDateString()
                : "Never"}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Action Buttons - Side by Side */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        <button
          onClick={() => setShowConfirmModal(true)}
          style={{
            flex: 1,
            padding: "12px 8px",
            borderRadius: "6px",
            fontWeight: "600",
            fontSize: "14px",
            border: "none",
            cursor: "pointer",
            background: "#38a169",
            color: "white",
          }}
        >
          ✓ Confirm Pickup
        </button>
        <button
          onClick={handleUnableToAccess}
          style={{
            flex: 1,
            padding: "12px 8px",
            borderRadius: "6px",
            fontWeight: "600",
            fontSize: "14px",
            border: "none",
            cursor: "pointer",
            background: "#dd6b20",
            color: "white",
          }}
        >
          Unable to Access
        </button>
        <button
          onClick={openReportModal}
          style={{
            flex: 1,
            padding: "12px 8px",
            borderRadius: "6px",
            fontWeight: "600",
            fontSize: "14px",
            border: "none",
            cursor: "pointer",
            background: "#e53e3e",
            color: "white",
          }}
        >
          ⚠️ Report Issue
        </button>
      </div>

      <div
        style={{
          textAlign: "center",
          color: "#718096",
          fontSize: "12px",
          marginTop: "8px",
        }}
      >
        Use ← → arrow keys or tap buttons to navigate stops
      </div>

      {/* ✅ Confirm Pickup Modal */}
      {showConfirmModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "400px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{ marginTop: 0, color: "#1a202c", marginBottom: "16px" }}
            >
              Confirm Pickup
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#4a5568",
                marginBottom: "12px",
              }}
            >
              Are you sure you want to confirm pickup for{" "}
              <strong>{bins[currentStopIndex]?.binId}</strong>?
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  background: "white",
                  color: "#4a5568",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmPickup}
                style={{
                  padding: "10px 20px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#38a169",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Yes, Confirm Pickup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Report Issue Modal */}
      {showReportModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setShowReportModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "400px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{ marginTop: 0, color: "#1a202c", marginBottom: "16px" }}
            >
              Report Issue
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#4a5568",
                marginBottom: "12px",
              }}
            >
              Reporting issue for{" "}
              <strong>{bins[currentStopIndex]?.binId}</strong>:
            </p>

            <textarea
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e0",
                fontSize: "14px",
                minHeight: "100px",
                boxSizing: "border-box",
                marginBottom: "16px",
                fontFamily: "inherit",
              }}
              placeholder="Describe the issue (e.g., bin damaged, blocked, overflow)..."
              value={issueText}
              onChange={(e) => setIssueText(e.target.value)}
            />

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowReportModal(false)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  background: "white",
                  color: "#4a5568",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitReport}
                style={{
                  padding: "10px 20px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#e53e3e",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverPage;
