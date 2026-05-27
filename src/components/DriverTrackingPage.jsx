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

const dumpMarkerIcon = L.divIcon({
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

const DriverTrackingPage = () => {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const [route, setRoute] = useState(null);
  const [bins, setBins] = useState([]);
  const [allOtherBins, setAllOtherBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State to store dynamic depot coordinates
  // Default to Bellevue, but will be overwritten by route data
  const [depotCoordinates, setDepotCoordinates] = useState([
    47.6101, -122.2015,
  ]);
  const [depotName, setDepotName] = useState("Bellevue Facility");

  // State to store the road-based route coordinates
  const [roadPath, setRoadPath] = useState(null);

  useEffect(() => {
    fetchRouteData();

    // Poll every 5s to reflect driver pickups in near real-time
    const interval = setInterval(fetchRouteData, 5000);

    return () => clearInterval(interval);
  }, [driverId]);

  const fetchRoadPath = async (activeRoute, startCoords) => {
    try {
      // Only include BIN stops — dump trips distort the visual route
      const routeSteps = (activeRoute.steps || []).filter(
        (s) => (s.type === "BIN" && s.binFillLevel > 0) || s.type === "DUMP",
      );
      if (routeSteps.length === 0) return;

      const coords = [
        `${startCoords[1]},${startCoords[0]}`, // depot start
        ...routeSteps.map((s) => `${s.lon},${s.lat}`),
        `${startCoords[1]},${startCoords[0]}`, // return to depot
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

  // const fetchRouteData = async () => {
  //   try {
  //     // 1. Fetch current route for this driver
  //     const response = await axios.get(
  //       `http://localhost:8080/api/routes/driver/${driverId}`,
  //     );
  //     const routes = response.data;
  //     // const activeRoute = routes.find(
  //     //   (r) => r.status === "CREATED" || r.status === "IN_PROGRESS",
  //     // );
  //     const today = new Date().toISOString().split("T")[0];
  //     const activeRoute =
  //       routes.find(
  //         (r) => r.status === "CREATED" || r.status === "IN_PROGRESS",
  //       ) ||
  //       routes.find((r) => r.status === "COMPLETED" && r.routeDate === today);

  //     if (!activeRoute) {
  //       setError("No active route found for this driver.");
  //       setLoading(false);
  //       return;
  //     }

  //     setRoute(activeRoute);

  //     console.log(
  //       "Route steps:",
  //       activeRoute.steps?.map((s) => ({
  //         type: s.type,
  //         action: s.action,
  //         binFillLevel: s.binFillLevel,
  //       })),
  //     );

  //     // ✅ Find the START station step to get the REAL depot location
  //     let currentStationStep = null;
  //     if (activeRoute.steps && activeRoute.steps.length > 0) {
  //       currentStationStep = activeRoute.steps.find(
  //         (step) => step.type === "STATION" && step.action === "START",
  //       );

  //       if (currentStationStep) {
  //         const depotCoords = [currentStationStep.lat, currentStationStep.lon];

  //         // Update state (this will move the marker)
  //         setDepotCoordinates(depotCoords);

  //         // Determine facility name
  //         const facilityName = getFacilityName(
  //           currentStationStep.lat,
  //           currentStationStep.lon,
  //         );
  //         setDepotName(facilityName);
  //       }
  //     }

  //     // 2. Fetch all bins, split into route bins and context bins
  //     if (activeRoute.binIds && activeRoute.binIds.length > 0) {
  //       const binPromises = activeRoute.binIds.map((binId) =>
  //         axios.get(`http://localhost:8080/api/bins/${binId}`),
  //       );
  //       const binResponses = await Promise.all(binPromises);
  //       const fetchedBins = binResponses.map((res) => res.data);
  //       setBins(fetchedBins);

  //       // Also fetch all bins to show non-route ones on the map
  //       const allBinsRes = await axios.get("http://localhost:8080/api/bins");
  //       setAllOtherBins(
  //         allBinsRes.data.filter((b) => !activeRoute.binIds.includes(b.binId)),
  //       );

  //       // // 3. Fetch road path once bins are loaded
  //       // // ✅ FIX: Pass the coordinates we just found, NOT the state variable (which hasn't updated yet)
  //       // const startCoords = currentStationStep
  //       //   ? [currentStationStep.lat, currentStationStep.lon]
  //       //   : [47.6101, -122.2015];

  //       fetchRoadPath(activeRoute, startCoords);
  //     }
  //   } catch (err) {
  //     console.error("Error fetching route data:", err);
  //     setError(
  //       "Failed to load route data. Driver may not have an active route.",
  //     );
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const fetchRouteData = async () => {
    try {
      // Use search endpoint to find BOTH "CREATED" and "IN_PROGRESS" routes
      const response = await axios.post(
        "http://localhost:8080/api/routes/search",
        {
          driverId: driverId,
        },
      );

      const routes = response.data;
      const today = new Date().toISOString().split("T")[0];

      const activeRoute =
        routes.find(
          (r) =>
            (r.status === "CREATED" || r.status === "IN_PROGRESS") &&
            r.routeDate === today,
        ) ||
        routes.find(
          (r) => r.status === "CREATED" || r.status === "IN_PROGRESS",
        );

      if (!activeRoute) {
        setError("No active route found for this driver.");
        setLoading(false);
        return;
      }

      setRoute(activeRoute);

      let currentStationStep = null;
      if (activeRoute.steps && activeRoute.steps.length > 0) {
        currentStationStep = activeRoute.steps.find(
          (step) => step.type === "STATION" && step.action === "START",
        );

        if (currentStationStep) {
          const depotCoords = [currentStationStep.lat, currentStationStep.lon];
          setDepotCoordinates(depotCoords);
          const facilityName = getFacilityName(
            currentStationStep.lat,
            currentStationStep.lon,
          );
          setDepotName(facilityName);
        }
      }

      const allBinsRes = await axios.get("http://localhost:8080/api/bins");

      if (activeRoute.binIds && activeRoute.binIds.length > 0) {
        const binPromises = activeRoute.binIds.map((binId) =>
          axios.get(`http://localhost:8080/api/bins/${binId}`),
        );
        const binResponses = await Promise.all(binPromises);
        const fetchedBins = binResponses.map((res) => res.data);
        setBins(fetchedBins);

        const allBinsRes = await axios.get("http://localhost:8080/api/bins");
        setAllOtherBins(
          allBinsRes.data.filter((b) => !activeRoute.binIds.includes(b.binId)),
        );

        const startCoords = currentStationStep
          ? [currentStationStep.lat, currentStationStep.lon]
          : [47.6101, -122.2015];

        fetchRoadPath(activeRoute, startCoords);
      } else {
        setAllOtherBins(allBinsRes.data);
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

  const handleAdminForcePickup = async (binId) => {
    if (!window.confirm(`Force confirm pickup for ${binId}?`)) return;
    try {
      // POST /api/routes/{routeId}/pickup/{binId}
      await axios.post(
        `http://localhost:8080/api/routes/${route.id}/pickup/${binId}`,
      );
      alert(`Admin Override: Bin ${binId} marked as picked up.`);
      fetchRouteData(); // Refresh map
    } catch (err) {
      alert("Failed to force pickup");
    }
  };

  const handleAdminForceSkip = async (binId) => {
    if (!window.confirm(`Force skip ${binId}? Penalty will be applied.`))
      return;
    try {
      // POST /api/routes/skip/{binId}
      await axios.post(`http://localhost:8080/api/routes/skip/${binId}`);
      alert(`Admin Override: Bin ${binId} skipped.`);
      fetchRouteData();
    } catch (err) {
      alert("Failed to force skip");
    }
  };

  const getFacilityName = () => "🏢 Starting Depot (Bellevue Facility)";

  // Helper to determine bin color
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

  // Bins confirmed picked up = fill level is now 0 (updated by confirmBinPickup endpoint)
  const totalRouteBins = bins.length;
  const completedStops = bins.filter((b) => (b.fillLevel ?? 0) === 0).length;
  const remainingStops = totalRouteBins - completedStops;

  const midRouteDumps =
    route.steps?.filter((s) => s.type === "DUMP" && s.action === "EMPTY_TRUCK")
      .length || 0;

  const totalStops = totalRouteBins + midRouteDumps;
  const progressPercent =
    totalRouteBins > 0 ? (completedStops / totalRouteBins) * 100 : 0;

  const straightLinePath = [
    depotCoordinates,
    ...(route.steps || [])
      .filter((s) => s.type === "BIN" || s.type === "DUMP")
      .map((s) => [s.lat, s.lon]),
    depotCoordinates, // return to depot
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

              {/* Non-route bins — context only */}
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

              {/* Bin Markers */}
              {bins.map((bin) => {
                const coords = getBinCoords(bin);
                if (!coords) return null;

                const isCompleted = (bin.fillLevel ?? 0) === 0;
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
                      <strong>{bin.binId} </strong>
                      <br />
                      {bin.locationName}
                      <br />
                      Fill: {bin.fillLevel}%
                      <br />
                      Status: {shouldBeGrey ? "✅ Completed " : "⏳ Pending "}
                      {/* ADMIN OVERRIDE BUTTONS */}
                      {!shouldBeGrey && (
                        <div
                          style={{
                            marginTop: "8px",
                            display: "flex",
                            gap: "4px",
                          }}
                        >
                          <button
                            onClick={() => handleAdminForcePickup(bin.binId)}
                            style={{
                              padding: "2px 6px",
                              background: "#c6f6d5",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "11px",
                            }}
                          >
                            ✅ Force Pickup
                          </button>
                          <button
                            onClick={() => handleAdminForceSkip(bin.binId)}
                            style={{
                              padding: "2px 6px",
                              background: "#fed7d7",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "11px",
                            }}
                          >
                            ❌ Force Skip
                          </button>
                        </div>
                      )}
                    </Popup>
                  </CircleMarker>
                );
              })}

              {/* Route Path: Use OSRM road path if loaded, otherwise fallback */}
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

              {/* Green markers for transfer/dump stations */}
              {(route.steps || [])
                .filter((s) => s.type === "DUMP")
                .map((step, i) => (
                  <Marker
                    key={`dump-${i}`}
                    position={[step.lat, step.lon]}
                    icon={dumpMarkerIcon}
                  >
                    <Popup>
                      <strong>
                        🏭 {step.stationName || "Transfer Station"}
                      </strong>
                      <br />
                      Truck load before dump:{" "}
                      {step.currentTruckLoadYards?.toFixed(1)} yds³
                      <br />
                      {step.action === "EMPTY_TRUCK"
                        ? "Mid-route dump"
                        : "End of route"}
                    </Popup>
                  </Marker>
                ))}
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
                      {totalRouteBins} stops
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
                    <div style={styles.summaryValue}>{remainingStops}</div>
                    <div style={styles.summaryLabel}>Remaining</div>
                  </div>
                </div>

                {midRouteDumps > 0 && (
                  <div style={styles.summaryItem}>
                    <div
                      style={{
                        ...styles.summaryIcon,
                        backgroundColor: "#c6f6d5",
                      }}
                    >
                      <span style={{ color: "#38a169", fontSize: "20px" }}>
                        🏭
                      </span>
                    </div>
                    <div>
                      <div style={styles.summaryValue}>{midRouteDumps}</div>
                      <div style={styles.summaryLabel}>
                        Dump Trip{midRouteDumps !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                )}
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
