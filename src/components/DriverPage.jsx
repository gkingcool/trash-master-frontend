import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Polyline,
  Marker,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import alertIcon from "../assets/icons/alert-icon.png";

// Fix Leaflet default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const depotIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const dumpIcon = L.divIcon({
  className: "",
  html: `<div style="position: relative; width: 25px; height: 41px;">
    <img 
      src="${markerIcon}" 
      style="
        width: 25px; 
        height: 41px; 
        filter: invert(0) sepia(100%) saturate(300%) hue-rotate(90deg) brightness(0.8);
      "
    />
  </div>`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function MapController({ currentStop, bins, depotCoordinates }) {
  const map = useMap();
  useEffect(() => {
    if (bins.length > 0 && depotCoordinates) {
      const allCoords = [
        depotCoordinates,
        ...bins.map((b) => [b.latitude, b.longitude]),
      ];
      map.fitBounds(allCoords, { padding: [50, 50] });
    }
  }, [map, bins, depotCoordinates]);

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
  const [allOtherBins, setAllOtherBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const notificationRef = useRef(null);
  const [driverInitials, setDriverInitials] = useState("DR");
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [issueText, setIssueText] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [routeCompleted, setRouteCompleted] = useState(false);
  const [hoveredNotifId, setHoveredNotifId] = useState(null);
  const [depotCoordinates, setDepotCoordinates] = useState([
    47.6101, -122.2015,
  ]);
  const [depotName, setDepotName] = useState("Bellevue Facility");
  const [roadPath, setRoadPath] = useState(null);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipReason, setSkipReason] = useState("");

  // Truck Constants
  const MAX_TRUCK_CAPACITY = 30; // yards
  const DUMP_THRESHOLD = 25.5; // 85% of 30

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchCurrentRoute();
    fetchNotifications();
    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}");
      let name = auth.name;
      if (!name && auth.firstName && auth.lastName)
        name = `${auth.firstName} ${auth.lastName}`;
      if (name) {
        const names = name.trim().split(" ");
        if (names.length >= 2)
          setDriverInitials((names[0][0] + names[1][0]).toUpperCase());
        else if (names.length === 1)
          setDriverInitials(names[0].substring(0, 2).toUpperCase());
      }
    } catch (e) {
      console.error("Error parsing auth data:", e);
    }
    const notifInterval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(notifInterval);
  }, []);

  const calculateDistance = (path) => {
    if (!path || path.length < 2) return 0;
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const [lat1, lon1] = path[i];
      const [lat2, lon2] = path[i + 1];
      const R = 3959;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    return total;
  };

  const fetchNotifications = async () => {
    try {
      const auth = JSON.parse(localStorage.getItem("auth"));
      const driverId = auth?.employeeId;
      if (!driverId) return;
      const response = await axios.get(
        "http://localhost:8080/api/notifications",
      );
      const driverNotifs = response.data.filter(
        (n) => n.driverId === driverId || n.driverId === "DRIVER_ALERT",
      );
      setNotifications(driverNotifs);
      const unread = driverNotifs.filter((n) => !n.read && !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const deleteNotification = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      await axios.delete(`http://localhost:8080/api/notifications/${notifId}`);
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const markAsRead = async (notifId) => {
    try {
      await axios.put(
        `http://localhost:8080/api/notifications/${notifId}/read`,
      );
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notifId ? { ...n, read: true, isRead: true } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.read && !n.isRead);
      if (unread.length === 0) return;
      await Promise.all(
        unread.map((n) =>
          axios.put(`http://localhost:8080/api/notifications/${n.id}/read`),
        ),
      );
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, isRead: true })),
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const getFacilityName = () => "🏢 Starting Depot (Bellevue Facility)";
  const getBinColor = (fillLevel) => {
    if (fillLevel === 0) return "#a0aec0";
    if (fillLevel >= 90) return "#e53e3e";
    if (fillLevel >= 70) return "#dd6b20";
    return "#38a169";
  };

  const fetchRoadPath = async (routeBins, startCoords, routeSteps) => {
    try {
      const binCoords = routeBins
        .map((b) => {
          const lat = b.location?.lat ?? b.latitude;
          const lon = b.location?.lon ?? b.longitude;
          return lat && lon ? `${lon},${lat}` : null;
        })
        .filter(Boolean);

      const dumpCoords = (routeSteps || [])
        .filter((s) => s.type === "DUMP")
        .map((s) => `${s.lon},${s.lat}`);

      if (binCoords.length === 0 && dumpCoords.length === 0) return;

      const coords = [
        `${startCoords[1]},${startCoords[0]}`,
        ...binCoords,
        ...dumpCoords,
        `${startCoords[1]},${startCoords[0]}`,
      ];
      const response = await axios.get(
        `https://router.project-osrm.org/route/v1/driving/${coords.join(";")}?overview=full&geometries=geojson`,
      );
      if (response.data.routes?.length > 0) {
        setRoadPath(
          response.data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]),
        );
      }
    } catch (err) {
      console.error("Error fetching road path:", err);
    }
  };

  const fetchCurrentRoute = async () => {
    try {
      const auth = JSON.parse(localStorage.getItem("auth"));
      const driverId = auth?.employeeId;
      if (!driverId) {
        setError("Driver ID not found. Please login again.");
        setLoading(false);
        return;
      }

      // Use search endpoint to find BOTH "CREATED" and "IN_PROGRESS" routes
      const routeRes = await axios.post(
        "http://localhost:8080/api/routes/search",
        {
          driverId: driverId,
        },
      );

      const routesList = routeRes.data;
      if (!routesList?.length) {
        setError("No active route assigned. Contact administrator.");
        setLoading(false);
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      const routeData =
        routesList.find(
          (r) =>
            (r.status === "CREATED" || r.status === "IN_PROGRESS") &&
            r.routeDate === today,
        ) ||
        routesList.find(
          (r) => r.status === "CREATED" || r.status === "IN_PROGRESS",
        );

      if (!routeData) {
        setError("No active route assigned. Contact administrator.");
        setLoading(false);
        return;
      }
      setRoute(routeData);

      const completedCount = routeData.completedBinIds?.length || 0;
      setCurrentStopIndex(completedCount);

      let stationStep = routeData.steps?.find(
        (s) => s.type === "STATION" && s.action === "START",
      );
      if (stationStep) {
        setDepotCoordinates([stationStep.lat, stationStep.lon]);
        setDepotName(getFacilityName());
      }

      const binsRes = await axios.get("http://localhost:8080/api/bins");
      const allBins = binsRes.data;
      const routeBins = routeData.binIds
        .map((id) => allBins.find((b) => b.binId === id || b.id === id))
        .filter(Boolean);
      setBins(routeBins);
      setAllOtherBins(
        allBins.filter(
          (b) =>
            !routeData.binIds.includes(b.binId) &&
            !routeData.binIds.includes(b.id),
        ),
      );

      const startCoords = stationStep
        ? [stationStep.lat, stationStep.lon]
        : [47.6101, -122.2015];
      fetchRoadPath(routeBins, startCoords, routeData.steps);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching route:", err);
      if (err.response?.status === 404)
        setError(
          "No route assigned. Contact administrator to generate a route.",
        );
      else if (err.response?.status === 401) {
        setError("Unauthorized. Please login again.");
        localStorage.removeItem("auth");
        window.location.href = "/login";
      } else setError("Failed to load route. Please try again.");
      setLoading(false);
    }
  };

  // Calculate Cumulative Truck Load
  const calculateTruckLoad = () => {
    if (!route || !bins.length) return 0;
    let currentLoad = route.startingTruckLoadYards || 0;

    // Get bin steps from route plan
    const binSteps = route.steps?.filter((s) => s.type === "BIN") || [];

    // Sum up load for all collected bins (indices 0 to currentStopIndex - 1)
    for (let i = 0; i < currentStopIndex; i++) {
      if (i < binSteps.length) {
        const step = binSteps[i];
        const bin = bins[i]; // bins array is ordered by routeData.binIds
        if (bin && bin.capacityYards && step.binFillLevel !== undefined) {
          // Compaction ratio 4:1
          const looseYards = bin.capacityYards * (step.binFillLevel / 100);
          currentLoad += looseYards / 4.0;
        }
      }
    }
    return currentLoad;
  };

  const currentTruckLoad = calculateTruckLoad();
  const truckLoadPercent = (currentTruckLoad / MAX_TRUCK_CAPACITY) * 100;
  const isNearDumpThreshold = currentTruckLoad >= DUMP_THRESHOLD;

  const confirmPickup = async () => {
    try {
      const currentBin = bins[currentStopIndex];
      const binId = currentBin.binId || currentBin.id;
      if (!binId || !route?.id)
        return alert("Error: Missing Bin ID or Route ID!");

      if (currentStopIndex === 0) {
        // Mark route as IN_PROGRESS when driver confirms first bin
        await axios.patch(
          `http://localhost:8080/api/routes/${route.id}/status?status=IN_PROGRESS`,
        );
      }

      // Updated endpoint to match RouteController.java
      await axios.post(
        `http://localhost:8080/api/routes/${route.id}/pickup/${binId}`,
      );

      const updated = [...bins];
      updated[currentStopIndex] = { ...currentBin, fillLevel: 0 };
      setBins(updated);

      //   if (currentStopIndex < bins.length - 1)
      //     setCurrentStopIndex(currentStopIndex + 1);
      //   else handleEndOfDay();
      // } catch (err) {
      //   console.error("Error confirming pickup:", err);
      //   alert("Failed to confirm pickup");
      // } finally {
      //   setShowConfirmModal(false);
      // }
      let nextIndex = currentStopIndex + 1;
      while (
        nextIndex < bins.length &&
        (updated[nextIndex]?.fillLevel ?? 0) === 0
      ) {
        nextIndex++;
      }

      if (nextIndex < bins.length) {
        // There are still bins with trash — move to next non-empty one
        setCurrentStopIndex(nextIndex);
      } else {
        // No more non-empty bins — all done, call end of day
        handleEndOfDay();
      }
    } catch (err) {
      console.error("Error confirming pickup:", err);
      alert("Failed to confirm pickup");
    } finally {
      setShowConfirmModal(false);
    }
  };

  const handleUnableToAccess = () => {
    setSkipReason("");
    setShowSkipModal(true);
  };

  const confirmSkip = async () => {
    try {
      const currentBin = bins[currentStopIndex];
      const binId = currentBin.binId || currentBin.id;
      if (!binId) return alert("Missing bin data.");

      await axios.post(`http://localhost:8080/api/routes/skip/${binId}`);

      if (skipReason) {
        await axios.post("http://localhost:8080/api/notifications", {
          title: `Bin ${binId} Skipped`,
          message: `Reason: ${skipReason}`,
          driverId: "ADMIN",
          type: "ALERT",
          isRead: false,
        });
      }

      if (currentStopIndex < bins.length - 1)
        setCurrentStopIndex(currentStopIndex + 1);
      else handleEndOfDay();

      setShowSkipModal(false);
      setSkipReason("");
      alert("Stop skipped. Penalty applied for tomorrow.");
    } catch (err) {
      console.error("Error skipping bin:", err);
      alert("Failed to skip stop.");
    }
  };

  const handleEndOfDay = async () => {
    try {
      const auth = JSON.parse(localStorage.getItem("auth"));
      const pickedUpBins = bins.filter((b) => b.fillLevel === 0);
      const skippedBins = bins.filter((b) => b.fillLevel > 0);
      const payload = {
        completedRoutes: [
          {
            truckId: route.truckId,
            driverId: auth?.employeeId,
            endingTruckVolumeYards: 0.0,
          },
        ],
        skippedBinIds: skippedBins.map((b) => b.binId || b.id),
      };
      await axios.post("http://localhost:8080/api/routes/end-of-day", payload);

      await axios.patch(
        `http://localhost:8080/api/routes/${route.id}/status?status=COMPLETED`,
      );

      setRouteCompleted(true);
    } catch (err) {
      console.error("End of day failed:", err);
      alert("Failed to close shift. Please contact admin.");
    }
  };

  const submitReport = async () => {
    if (!issueText.trim()) return;
    try {
      const auth = JSON.parse(localStorage.getItem("auth"));
      const driverName = auth?.name || auth?.firstName || "Driver";
      await axios.post("http://localhost:8080/api/notifications", {
        title: `Issue Report from ${driverName}`,
        message: issueText,
        driverId: "ADMIN",
        type: "ALERT",
        isRead: false,
        timestamp: new Date().toISOString(),
      });
      alert("Issue reported successfully!");
      setShowReportModal(false);
      setIssueText("");
    } catch (err) {
      console.error("Error reporting issue:", err);
      alert("Failed to report issue.");
    }
  };

  const handleBack = () => {
    if (currentStopIndex > 0) setCurrentStopIndex(currentStopIndex - 1);
  };

  const handleNext = () => {
    if (currentStopIndex < bins.length - 1)
      setCurrentStopIndex(currentStopIndex + 1);
  };

  const getBinCoords = (bin) =>
    bin.latitude && bin.longitude
      ? [bin.latitude, bin.longitude]
      : bin.location?.lat && bin.location?.lon
        ? [bin.location.lat, bin.location.lon]
        : null;

  if (loading)
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
        ></div>
        <p style={{ marginTop: "16px", color: "#4a5568" }}>Loading route...</p>
      </div>
    );
  if (error)
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🗺️</div>
        <h2 style={{ color: "#1a202c", marginBottom: "8px" }}>
          No Route Assigned
        </h2>
        <p style={{ color: "#718096", marginBottom: "24px" }}>{error}</p>
      </div>
    );
  if (routeCompleted)
    return (
      <div
        style={{
          backgroundColor: "white",
          minHeight: "100vh",
          fontFamily: "Segoe UI, sans-serif",
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
                boxShadow: "0 4px 6px rgba(56,161,105,0.3)",
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
  if (!route || bins.length === 0)
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p style={{ color: "#718096" }}>No Stops to Pick Up</p>
        <p style={{ color: "#718096" }}>Contact administrator.</p>
      </div>
    );

  const currentBin = bins[currentStopIndex];
  const straightLinePath = [
    depotCoordinates,
    ...bins.map(getBinCoords).filter(Boolean),
    depotCoordinates,
  ];

  return (
    <div
      style={{
        backgroundColor: "white",
        minHeight: "100vh",
        fontFamily: "Segoe UI, sans-serif",
        padding: "0 12px",
      }}
    >
      {/* Header */}
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
        <div style={{ textAlign: "center", flex: 1 }}>
          <div
            style={{ fontSize: "20px", fontWeight: "600", color: "#1a202c" }}
          >
            {route.routeNumber
              ? `Route #${route.routeNumber}`
              : "Today's Collection"}
          </div>
          <div style={{ fontSize: "12px", color: "#718096", marginTop: "2px" }}>
            {bins.length} stops • {depotName}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
                      onClick={handleMarkAllAsRead}
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
                        {notif.message ||
                          notif.content ||
                          notif.description ||
                          "System update"}
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

      {/* Map */}
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
          center={depotCoordinates}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <MapController
            currentStop={currentBin}
            bins={bins}
            depotCoordinates={depotCoordinates}
          />
          {/* Non-route bins — context only, not part of today's stops */}
          {allOtherBins.map((bin) => {
            const lat = bin.location?.lat ?? bin.latitude;
            const lon = bin.location?.lon ?? bin.longitude;
            if (!lat || !lon) return null;
            return (
              <CircleMarker
                key={`other-${bin.binId}`}
                center={[lat, lon]}
                radius={8}
                pathOptions={{
                  fillColor: "#718096",
                  color: "#fff",
                  weight: 2,
                  opacity: 1,
                  fillOpacity: 0.85,
                }}
              >
                <Popup>
                  <strong>{bin.binId}</strong>
                  <br />
                  {bin.locationName}
                  <br />
                  Fill: {bin.fillLevel ?? 0}%<br />
                  <span style={{ color: "#718096", fontSize: "11px" }}>
                    ⚪ Not on today's route
                  </span>
                </Popup>
              </CircleMarker>
            );
          })}
          {bins.map((bin, i) => {
            const lat = bin.location?.lat ?? bin.latitude;
            const lon = bin.location?.lon ?? bin.longitude;
            if (!lat || !lon) return null;
            return (
              <CircleMarker
                key={`${bin.id || bin.binId}-${bin.fillLevel}`}
                center={[lat, lon]}
                radius={i === currentStopIndex ? 10 : 8}
                fillColor={getBinColor(bin.fillLevel)}
                color="#fff"
                weight={2}
                opacity={1}
                fillOpacity={0.85}
              >
                <Popup>
                  <strong>{bin.binId}</strong>
                  <br />
                  {bin.locationName}
                  <br />
                  Fill: {bin.fillLevel}%
                  {(bin.daysOverdue ?? 0) > 0 && (
                    <>
                      <br />
                      <span style={{ color: "#c53030" }}>
                        ⏳ Overdue: {bin.daysOverdue} day(s) — included in route
                      </span>
                    </>
                  )}
                </Popup>
              </CircleMarker>
            );
          })}
          {/* Dump station markers from route steps */}
          {(route?.steps || [])
            .filter((s) => s.type === "DUMP")
            .map((step, i) => (
              <Marker
                key={`dump-${i}`}
                position={[step.lat, step.lon]}
                icon={dumpIcon}
              >
                <Popup>
                  <strong>🏭 {step.stationName || "Transfer Station"}</strong>
                  <br />
                  Truck load before dump:{" "}
                  {step.currentTruckLoadYards?.toFixed(1)} yds³
                </Popup>
              </Marker>
            ))}
          <Polyline
            positions={roadPath || straightLinePath}
            color="#3182ce"
            weight={6}
            opacity={0.9}
            lineCap="round"
            lineJoin="round"
          />
          <Marker position={depotCoordinates} icon={depotIcon}>
            <Popup>
              <strong>🏢 Starting Depot</strong>
              <br />
              {depotName}
            </Popup>
          </Marker>
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
            {/* Show Days Overdue if applicable */}
            {currentBin.daysOverdue > 0 && (
              <div
                style={{
                  fontSize: "14px",
                  color: "#c53030",
                  marginTop: "4px",
                  fontWeight: "600",
                }}
              >
                ⚠️ Overdue: {currentBin.daysOverdue} day
                {currentBin.daysOverdue !== 1 ? "s" : ""} (Skipped previously)
              </div>
            )}
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

        {/* Truck Load Indicator */}
        <div
          style={{
            background: "#f8fafc",
            padding: "16px",
            borderRadius: "8px",
            marginBottom: "20px",
            border: `1px solid ${isNearDumpThreshold ? "#fc8181" : "#e2e8f0"}`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span
              style={{ fontSize: "14px", fontWeight: "600", color: "#2d3748" }}
            >
              🚛 Truck Load (Cumulative)
            </span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: "700",
                color: isNearDumpThreshold ? "#c53030" : "#2d3748",
              }}
            >
              {currentTruckLoad.toFixed(1)} / {MAX_TRUCK_CAPACITY} yds
            </span>
          </div>
          <div
            style={{
              height: "10px",
              background: "#edf2f7",
              borderRadius: "5px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min(truckLoadPercent, 100)}%`,
                background: isNearDumpThreshold
                  ? "#e53e3e"
                  : truckLoadPercent > 70
                    ? "#dd6b20"
                    : "#38a169",
                transition: "width 0.3s",
              }}
            ></div>
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#718096",
              marginTop: "6px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Max Capacity: 30 yds</span>
            {isNearDumpThreshold ? (
              <span style={{ color: "#c53030", fontWeight: "600" }}>
                ⚠️ Near Dump Threshold (85%)
              </span>
            ) : (
              <span>Next Dump at 25.5 yds (85%)</span>
            )}
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
              {(
                route.totalDistance ||
                calculateDistance(roadPath || straightLinePath)
              ).toFixed(1)}{" "}
              mi total
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

      {/* Action Buttons */}
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
          onClick={() => {
            setIssueText("");
            setShowReportModal(true);
          }}
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

      {/* Modals */}
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

      {showSkipModal && (
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
          onClick={() => setShowSkipModal(false)}
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
              Unable to Access Bin
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#4a5568",
                marginBottom: "12px",
              }}
            >
              Please provide a reason for skipping{" "}
              <strong>{bins[currentStopIndex]?.binId}</strong>:
            </p>
            <textarea
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e0",
                fontSize: "14px",
                minHeight: "80px",
                boxSizing: "border-box",
                marginBottom: "16px",
                fontFamily: "inherit",
                resize: "vertical",
              }}
              placeholder="e.g., Blocked by vehicle, locked gate, construction..."
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
            ></textarea>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowSkipModal(false)}
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
                onClick={confirmSkip}
                style={{
                  padding: "10px 20px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#dd6b20",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Skip Stop
              </button>
            </div>
          </div>
        </div>
      )}

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
              maxWidth: "500px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{ marginTop: 0, marginBottom: "16px", color: "#2d3748" }}
            >
              ⚠️ Report an Issue
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#4a5568",
                marginBottom: "16px",
              }}
            >
              Describe any issue you're experiencing (vehicle, route, equipment,
              etc.):
            </p>
            <textarea
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e0",
                fontSize: "14px",
                minHeight: "120px",
                boxSizing: "border-box",
                marginBottom: "16px",
                fontFamily: "inherit",
                resize: "vertical",
              }}
              placeholder="Please describe the issue in detail..."
              value={issueText}
              onChange={(e) => setIssueText(e.target.value)}
            ></textarea>
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
