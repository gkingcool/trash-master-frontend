// src/components/DriverTrackingPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Polyline,
  Marker,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Create proper icon instance
const depotMarkerIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DriverTrackingPage = () => {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const [route, setRoute] = useState(null);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ State to store dynamic depot coordinates
  // Default to Bellevue, but will be overwritten by route data
  const [depotCoordinates, setDepotCoordinates] = useState([
    47.6101, -122.2015,
  ]);
  const [depotName, setDepotName] = useState("Bellevue Facility");

  // ✅ State to store the road-based route coordinates
  const [roadPath, setRoadPath] = useState(null);

  useEffect(() => {
    fetchRouteData();

    // ✅ Add polling to refresh data every 15 seconds
    const interval = setInterval(fetchRouteData, 15000);

    return () => clearInterval(interval); // Cleanup on unmount
  }, [driverId]);

  // ✅ Function to fetch road-based route from OSRM
  // ✅ FIX: Now accepts startCoords as an argument to avoid using stale state
  const fetchRoadPath = async (routeBins, startCoords) => {
    try {
      // Create a sequence of coordinates: Depot -> Bins
      const coords = [
        `${startCoords[1]},${startCoords[0]}`, // Start at the passed Depot coordinates
        ...routeBins.map((b) => {
          // Handle both flat and nested location structures
          const lat = b.latitude || b.location?.lat;
          const lon = b.longitude || b.location?.lon;
          return `${lon},${lat}`;
        }),
      ];

      const coordsString = coords.join(";");

      // Fetch from OSRM
      const response = await axios.get(
        `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`,
      );

      if (response.data.routes && response.data.routes.length > 0) {
        // OSRM returns [lon, lat], Leaflet needs [lat, lon]
        const geometry = response.data.routes[0].geometry.coordinates.map(
          (coord) => [coord[1], coord[0]],
        );
        setRoadPath(geometry);
      }
    } catch (err) {
      console.error("Error fetching road path:", err);
    }
  };

  const fetchRouteData = async () => {
    try {
      // 1. Fetch current route for this driver
      const response = await axios.get(
        `http://localhost:8080/api/routes/driver/${driverId}`,
      );
      const routes = response.data;
      const activeRoute = routes.find(
        (r) => r.status === "CREATED" || r.status === "IN_PROGRESS",
      );

      if (!activeRoute) {
        setError("No active route found for this driver.");
        setLoading(false);
        return;
      }

      setRoute(activeRoute);

      // ✅ Find the START station step to get the REAL depot location
      let currentStationStep = null;
      if (activeRoute.steps && activeRoute.steps.length > 0) {
        currentStationStep = activeRoute.steps.find(
          (step) => step.type === "STATION" && step.action === "START",
        );

        if (currentStationStep) {
          const depotCoords = [currentStationStep.lat, currentStationStep.lon];

          // Update state (this will move the marker)
          setDepotCoordinates(depotCoords);

          // Determine facility name
          const facilityName = getFacilityName(
            currentStationStep.lat,
            currentStationStep.lon,
          );
          setDepotName(facilityName);
        }
      }

      // 2. Fetch all bins in the route
      if (activeRoute.binIds && activeRoute.binIds.length > 0) {
        const binPromises = activeRoute.binIds.map((binId) =>
          axios.get(`http://localhost:8080/api/bins/${binId}`),
        );
        const binResponses = await Promise.all(binPromises);
        const fetchedBins = binResponses.map((res) => res.data);
        setBins(fetchedBins);

        // 3. Fetch road path once bins are loaded
        // ✅ FIX: Pass the coordinates we just found, NOT the state variable (which hasn't updated yet)
        const startCoords = currentStationStep
          ? [currentStationStep.lat, currentStationStep.lon]
          : [47.6101, -122.2015];

        fetchRoadPath(fetchedBins, startCoords);
      }
    } catch (err) {
      console.error("Error fetching route data:", err);
      setError(
        "Failed to load route data. Driver may not have an active route.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Helper to determine facility name from coordinates
  const getFacilityName = (lat, lon) => {
    const facilities = {
      "central-maintenance": [47.6101, -122.2015],
      "south-renton": [47.4829, -122.2171],
      "north-kirkland": [47.6815, -122.2087],
      "east-issaquah": [47.5301, -122.0326],
      "west-seattle": [47.5707, -122.3862],
    };
    let closestFacility = "Central Maintenance Facility - Bellevue";
    let minDistance = Infinity;

    for (const [name, coords] of Object.entries(facilities)) {
      const distance = Math.sqrt(
        Math.pow(coords[0] - lat, 2) + Math.pow(coords[1] - lon, 2),
      );
      if (distance < minDistance) {
        minDistance = distance;
        switch (name) {
          case "central-maintenance":
            closestFacility = "Central Maintenance Facility - Bellevue";
            break;
          case "south-renton":
            closestFacility = "South Depot - Renton";
            break;
          case "north-kirkland":
            closestFacility = "North Depot - Kirkland";
            break;
          case "east-issaquah":
            closestFacility = "East Depot - Issaquah";
            break;
          case "west-seattle":
            closestFacility = "West Depot - Seattle";
            break;
          default:
            closestFacility = "Central Maintenance Facility - Bellevue";
        }
      }
    }
    return closestFacility;
  };

  // ✅ Helper to determine bin color
  const getBinColor = (fillLevel) => {
    if (fillLevel === 0) return "#718096"; // Grey (Empty)
    if (fillLevel >= 90) return "#e53e3e"; // Red (Critical)
    if (fillLevel >= 70) return "#dd6b20"; // Orange (Full)
    return "#38a169"; // Green (1-69%)
  };

  // Helper to safely extract lat/lon from either structure
  const getBinCoords = (bin) => {
    if (bin.latitude != null && bin.longitude != null) {
      return [bin.latitude, bin.longitude];
    }
    if (bin.location && bin.location.lat != null && bin.location.lon != null) {
      return [bin.location.lat, bin.location.lon];
    }
    return null;
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading tracking data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>⚠️</div>
        <p style={styles.errorText}>{error}</p>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          ← Back to Drivers
        </button>
      </div>
    );
  }

  if (!route || bins.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <div style={styles.emptyIcon}>🗺️</div>
        <p style={styles.emptyText}>No active route found for this driver.</p>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          ← Back to Drivers
        </button>
      </div>
    );
  }

  const completedIds = route?.completedBinIds || [];
  const completedStops = completedIds.length;

  // Calculate total stops from steps (bins only) or bin list
  const totalStops =
    route.steps?.filter((step) => step.type === "BIN").length || bins.length;

  const progressPercent =
    totalStops > 0 ? (completedStops / totalStops) * 100 : 0;

  // Coordinates for straight-line fallback (uses state, which will be updated)
  const straightLinePath = [
    depotCoordinates,
    ...bins.map((b) => getBinCoords(b)).filter(Boolean),
  ];

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          ← Back to Drivers
        </button>
        <div style={styles.headerContent}>
          <h1 style={styles.pageTitle}>Live Route Tracking</h1>
          <div style={styles.routeInfo}>
            <span style={styles.routeItem}>
              🚛 {route.truckId || "No Truck"}
            </span>
            <span style={styles.divider}>|</span>
            <span style={styles.routeItem}>
              👤 {route.driverId || "Driver"}
            </span>
          </div>
        </div>
      </div>

      <div style={styles.contentWrapper}>
        <div style={styles.mainGrid}>
          {/* Map Section */}
          <div style={styles.mapContainer}>
            <MapContainer
              center={depotCoordinates}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
              zoomControl={true}
              minZoom={10}
              maxZoom={19}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              {/* Bin Markers */}
              {bins.map((bin) => {
                const coords = getBinCoords(bin);
                if (!coords) return null;

                const isCompleted = completedIds.includes(bin.binId);
                const shouldBeGrey = isCompleted || bin.fillLevel === 0;

                return (
                  <CircleMarker
                    key={bin.binId || bin.id}
                    center={coords}
                    radius={10}
                    fillColor={
                      shouldBeGrey ? "#a0aec0" : getBinColor(bin.fillLevel)
                    }
                    color="#fff"
                    weight={2}
                    fillOpacity={isCompleted ? 0.8 : 0.9}
                  >
                    <Popup>
                      <strong>{bin.binId}</strong>
                      <br />
                      {bin.locationName}
                      <br />
                      Fill: {bin.fillLevel}%
                      <br />
                      Status: {shouldBeGrey ? "✅ Completed" : "⏳ Pending"}
                    </Popup>
                  </CircleMarker>
                );
              })}

              {/* ✅ Route Path: Use OSRM road path if loaded, otherwise fallback */}
              <Polyline
                positions={roadPath || straightLinePath}
                color="#3182ce"
                weight={5}
                opacity={0.8}
              />

              {/* ✅ Depot Marker */}
              <Marker position={depotCoordinates} icon={depotMarkerIcon}>
                <Popup>
                  <strong>🏢 Starting Depot</strong>
                  <br />
                  {depotName}
                </Popup>
              </Marker>
            </MapContainer>
          </div>

          {/* Stats Sidebar */}
          <div style={styles.statsSidebar}>
            <div style={styles.statCard}>
              <div style={styles.cardHeader}>
                <span style={styles.cardIcon}>📊</span>
                <h3 style={styles.cardTitle}>Route Progress</h3>
              </div>
              <div style={styles.progressContainer}>
                <div style={styles.progressStats}>
                  <span style={styles.progressText}>
                    <strong style={{ fontSize: "28px", color: "#2d3748" }}>
                      {completedStops}
                    </strong>
                    <span style={{ color: "#718096", margin: "0 8px" }}>/</span>
                    <span style={{ fontSize: "18px", color: "#718096" }}>
                      {totalStops} stops
                    </span>
                  </span>
                  <span style={styles.progressPercent}>
                    {Math.round(progressPercent)}%
                  </span>
                </div>
                <div style={styles.progressBar}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${progressPercent}%`,
                      backgroundColor:
                        progressPercent === 100 ? "#38a169" : "#3182ce",
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.cardHeader}>
                <span style={styles.cardIcon}>📍</span>
                <h3 style={styles.cardTitle}>Route Details</h3>
              </div>
              <div style={styles.detailGrid}>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Duration</span>
                  <span style={styles.detailValue}>
                    {route.totalTimeMinutes
                      ? `${Math.floor(route.totalTimeMinutes / 60)}h ${
                          route.totalTimeMinutes % 60
                        }m`
                      : "N/A"}
                  </span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Start Time</span>
                  <span style={styles.detailValue}>
                    {route.createdAt
                      ? new Date(route.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.cardHeader}>
                <span style={styles.cardIcon}>🎯</span>
                <h3 style={styles.cardTitle}>Stops Summary</h3>
              </div>
              <div style={styles.summaryGrid}>
                <div style={styles.summaryItem}>
                  <div
                    style={{
                      ...styles.summaryIcon,
                      backgroundColor: "#c6f6d5",
                    }}
                  >
                    <span style={{ color: "#38a169", fontSize: "20px" }}>
                      ✅
                    </span>
                  </div>
                  <div>
                    <div style={styles.summaryValue}>{completedStops}</div>
                    <div style={styles.summaryLabel}>Completed</div>
                  </div>
                </div>
                <div style={styles.summaryItem}>
                  <div
                    style={{
                      ...styles.summaryIcon,
                      backgroundColor: "#feebc8",
                    }}
                  >
                    <span style={{ color: "#dd6b20", fontSize: "20px" }}>
                      ⏳
                    </span>
                  </div>
                  <div>
                    <div style={styles.summaryValue}>
                      {totalStops - completedStops}
                    </div>
                    <div style={styles.summaryLabel}>Remaining</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    backgroundColor: "#f7fafc",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    backgroundColor: "white",
    borderBottom: "1px solid #e2e8f0",
    padding: "16px 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    position: "relative",
  },
  headerContent: {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    textAlign: "center",
  },
  pageTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#2d3748",
    margin: "0 0 6px 0",
  },
  routeInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "14px",
    color: "#718096",
    justifyContent: "center",
  },
  routeItem: {
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  divider: { color: "#cbd5e0", fontWeight: "300" },
  backButton: {
    padding: "8px 16px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    color: "#3182ce",
    fontSize: "14px",
    zIndex: 10,
    position: "relative",
  },
  contentWrapper: {
    flex: 1,
    padding: "24px",
    overflow: "hidden",
    maxWidth: "1600px",
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 400px",
    gap: "24px",
    height: "calc(100vh - 120px)",
  },
  mapContainer: {
    height: "100%",
    width: "100%",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    border: "1px solid #e2e8f0",
  },
  statsSidebar: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    overflowY: "auto",
    paddingRight: "4px",
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    border: "1px solid #edf2f7",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "16px",
  },
  cardIcon: { fontSize: "20px" },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#2d3748",
    margin: 0,
  },
  progressContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  progressStats: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressText: { display: "flex", alignItems: "center", gap: "8px" },
  progressPercent: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#3182ce",
  },
  progressBar: {
    height: "10px",
    backgroundColor: "#edf2f7",
    borderRadius: "5px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    transition: "width 0.3s ease",
    borderRadius: "5px",
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  detailItem: { display: "flex", flexDirection: "column", gap: "4px" },
  detailLabel: { fontSize: "12px", color: "#718096", fontWeight: "500" },
  detailValue: { fontSize: "16px", fontWeight: "600", color: "#2d3748" },
  summaryGrid: { display: "flex", flexDirection: "column", gap: "12px" },
  summaryItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #edf2f7",
  },
  summaryIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryValue: { fontSize: "20px", fontWeight: "700", color: "#2d3748" },
  summaryLabel: { fontSize: "12px", color: "#718096" },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#f7fafc",
  },
  spinner: {
    border: "4px solid #e2e8f0",
    borderTop: "4px solid #3182ce",
    borderRadius: "50%",
    width: "50px",
    height: "50px",
    animation: "spin 1s linear infinite",
  },
  loadingText: { marginTop: "16px", color: "#718096", fontSize: "16px" },
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#f7fafc",
    padding: "40px",
  },
  errorIcon: { fontSize: "48px", marginBottom: "16px" },
  errorText: {
    color: "#e53e3e",
    fontSize: "16px",
    marginBottom: "24px",
    textAlign: "center",
  },
  emptyContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#f7fafc",
    padding: "40px",
  },
  emptyIcon: { fontSize: "64px", marginBottom: "16px", opacity: 0.5 },
  emptyText: { color: "#718096", fontSize: "18px", marginBottom: "24px" },
};

export default DriverTrackingPage;
