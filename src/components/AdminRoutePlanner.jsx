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

// Fix Leaflet default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_DEPOT_COORDS = [47.6101, -122.2015];
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

function MapController({ bins }) {
  const map = useMap();
  const prevCount = useRef(0);
  useEffect(() => {
    if (bins.length > 0) {
      const coords = bins
        .filter((b) => b.location?.lat && b.location?.lon)
        .map((b) => [b.location.lat, b.location.lon]);
      if (coords.length > 0) {
        map.fitBounds(L.latLngBounds(coords), {
          padding: [50, 50],
          maxZoom: 15,
        });
      }
    }
    prevCount.current = bins.length;
  }, [bins, map]);
  return null;
}

const AdminRoutePlanner = () => {
  const [routeDateTime, setRouteDateTime] = useState("");
  const [driversAvailable, setDriversAvailable] = useState(3);
  const [strategy, setStrategy] = useState("predictive");
  const [loading, setLoading] = useState(false);
  const [generatedRoutes, setGeneratedRoutes] = useState([]);
  const [unassignedBins, setUnassignedBins] = useState([]);
  const [bins, setBins] = useState([]);
  const [error, setError] = useState(null);
  const [maxDrivers, setMaxDrivers] = useState(9);
  const [roadRoutes, setRoadRoutes] = useState({});
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [driversList, setDriversList] = useState([]);

  // State for Trucks to map drivers to their actual vehicles
  const [trucks, setTrucks] = useState([]);

  useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setRouteDateTime(now.toISOString().slice(0, 16));
    fetchBins();
    fetchDrivers();
    fetchTrucks(); // Fetch trucks on load
    fetchRoutesByDate(now.toISOString().split("T")[0]);
  }, []);

  const fetchBins = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/bins");
      setBins(res.data || []);
    } catch (err) {
      console.error("Error fetching bins:", err);
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/employees");
      const drivers = res.data.filter(
        (e) => e.role?.toUpperCase() === "DRIVER",
      );
      setDriversList(drivers);
      setMaxDrivers(drivers.length || 9);
      if (drivers.length > 0 && driversAvailable > drivers.length) {
        setDriversAvailable(drivers.length);
      }
    } catch (err) {
      console.error("Error fetching drivers:", err);
    }
  };

  // Fetch all trucks to build a Driver -> Truck mapping
  const fetchTrucks = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/trucks");
      setTrucks(res.data || []);
    } catch (err) {
      console.error("Error fetching trucks:", err);
    }
  };

  // HELPER: Get the actual truck assigned to a specific driver
  const getDriverTruck = (driverId) => {
    if (!driverId) return null;
    const truck = trucks.find((t) => t.assignedDriverId === driverId);
    return truck ? truck.truckId : null;
  };

  const fetchRoutesByDate = async (date) => {
    try {
      const res = await axios.get(
        `http://localhost:8080/api/routes/by-date/${date}`,
      );
      const routes = res.data || [];
      setGeneratedRoutes(routes);
      if (routes.length > 0) {
        let depotCoords = DEFAULT_DEPOT_COORDS;
        const firstStep = routes[0]?.steps?.[0];
        if (firstStep?.lat != null && firstStep?.lon != null) {
          depotCoords = [firstStep.lat, firstStep.lon];
        }
        // Show straight lines immediately so map is never blank
        const straightLines = {};
        routes.forEach((route) => {
          const coords = getRouteCoordinates(route, depotCoords);
          if (coords.length >= 2) {
            straightLines[route.id || route.truckId] = coords;
          }
        });
        setRoadRoutes(straightLines);
        // Then upgrade to real road paths in the background
        fetchAllRoadRoutes(routes, depotCoords);
      }
    } catch (err) {
      console.error("Error fetching routes:", err);
    }
  };

  const fetchRoadRoute = async (coordinates, retries = 2) => {
    if (coordinates.length < 2) return null;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const coordsString = coordinates
          .map((c) => `${c[1]},${c[0]}`)
          .join(";");
        const res = await axios.get(
          `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`,
          { timeout: 6000 },
        );
        if (res.data.routes?.length > 0) {
          return res.data.routes[0].geometry.coordinates.map((c) => [
            c[1],
            c[0],
          ]);
        }
      } catch {
        if (attempt < retries)
          await new Promise((r) => setTimeout(r, attempt * 1500));
      }
    }
    return null; // Return null — straight lines already showing, no need to overwrite with same
  };

  const fetchAllRoadRoutes = async (routes, depotCoordsOverride) => {
    // Straight lines are already set — try to upgrade each to real road path quietly
    for (const route of routes) {
      const coords = getRouteCoordinates(route, depotCoordsOverride);
      const roadPath = await fetchRoadRoute(coords);
      if (roadPath) {
        // Only update this one route's path, keep others as-is
        setRoadRoutes((prev) => ({
          ...prev,
          [route.id || route.truckId]: roadPath,
        }));
      }
    }
  };

  const getRouteCoordinates = (routeDto, depotCoordsOverride) => {
    if (!routeDto?.steps) return [];
    const depot = depotCoordsOverride || DEFAULT_DEPOT_COORDS;
    // Only include BIN stops — dump trips are logistical but distort the visual route
    const binSteps = routeDto.steps.filter(
      (s) => (s.type === "BIN" && s.binFillLevel > 0) || s.type === "DUMP",
    );
    if (binSteps.length === 0) return [];

    return [depot, ...binSteps.map((s) => [s.lat, s.lon]), depot];
  };

  const handleDeleteRoute = async (routeId) => {
    if (!window.confirm("Delete this route?")) return;
    try {
      await axios.delete(`http://localhost:8080/api/routes/${routeId}`);
      setGeneratedRoutes((prev) => prev.filter((r) => r.id !== routeId));
      if (selectedRouteId === routeId) setSelectedRouteId(null);
      alert("Route deleted");
    } catch (err) {
      alert("Failed to delete route");
    }
  };

  const handleAssignDriver = async (routeId, newDriverId) => {
    // Check if this driver have a truck assigned?
    const driverTruck = getDriverTruck(newDriverId);

    if (!driverTruck) {
      const proceed = window.confirm(
        `⚠️ WARNING: This driver does not have a truck assigned!\n\n` +
          `Please go to the Drivers/Fleet page to assign a truck before they start their shift.\n\n` +
          `Do you still want to assign this route to them?`,
      );
      if (!proceed) return;
    }

    try {
      await axios.patch(
        `http://localhost:8080/api/routes/${routeId}/assign-driver?driverId=${newDriverId}`,
      );

      // Update local state immediately so the card reflects the new driver & their truck
      setGeneratedRoutes((prev) =>
        prev.map((r) =>
          r.id === routeId ? { ...r, driverId: newDriverId } : r,
        ),
      );

      alert(`Driver assigned successfully!`);
      if (selectedRouteId === routeId) setSelectedRouteId(null);
    } catch (err) {
      alert("Failed to assign driver");
    }
  };

  const handleGenerateRoutes = async () => {
    // Warn if no bins need pickup
    if (binsNeedingPickup.length === 0) {
      const proceed = window.confirm(
        "⚠️ All bins are currently below 70% fill — no bins need pickup today.\n\n" +
          "The route will still include any overdue bins (skipped from previous days).\n\n" +
          "Generate anyway?",
      );
      if (!proceed) return;
    }

    setLoading(true);
    setError(null);
    setUnassignedBins([]);
    setRoadRoutes({});
    setSelectedRouteId(null);

    try {
      if (driversAvailable < 1 || driversAvailable > maxDrivers) {
        setError(`Number of drivers must be between 1 and ${maxDrivers}`);
        setLoading(false);
        return;
      }

      const [date, time] = routeDateTime.split("T");
      const res = await axios.post(
        `http://localhost:8080/api/routes/generate`,
        null,
        {
          params: {
            trucks: driversAvailable,
            date,
            time: time || "07:00",
            strategy,
          },
        },
      );

      const routesList = res.data.routes || [];
      const urgentBins = res.data.urgentUnassignedBins || [];

      setGeneratedRoutes(routesList);
      setUnassignedBins(urgentBins);
      await fetchRoutesByDate(date);

      // Refresh trucks and drivers just in case
      fetchTrucks();
      fetchDrivers();

      if (routesList.length > 0) {
        alert(
          `✅ Successfully generated ${routesList.length} optimized routes!`,
        );
      } else {
        setError("No routes generated. Check if bins meet pickup thresholds.");
      }
    } catch (err) {
      console.error("Route generation failed:", err);
      setError(
        err.response?.data || "Failed to generate routes. Check backend logs.",
      );
    } finally {
      setLoading(false);
    }
  };

  const getBinFillColor = (fillLevel, isFlagged) => {
    if (isFlagged || fillLevel >= 90) return "#e53e3e";
    if (fillLevel >= 70) return "#dd6b20";
    if (fillLevel >= 40) return "#38a169";
    return "#718096";
  };

  const getRouteColor = (i) =>
    [
      "#3182ce",
      "#e53e3e",
      "#38a169",
      "#dd6b20",
      "#805ad5",
      "#d53f8c",
      "#319795",
      "#d69e2e",
      "#9f7aea",
    ][i % 9];

  const binsNeedingPickup = bins.filter((b) => b.fillLevel >= 70);

  return (
    <div style={styles.container}>
      <div style={styles.formSection}>
        <h2 style={styles.formTitle}>Generate Daily Routes</h2>
        {error && <div style={styles.errorMessage}>{error}</div>}

        <div style={styles.formGroup}>
          <label style={styles.label}>Date & Time</label>
          <input
            type="datetime-local"
            value={routeDateTime}
            onChange={(e) => setRouteDateTime(e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Number of Drivers (1-{maxDrivers})</label>
          <input
            type="number"
            min="1"
            max={maxDrivers}
            value={driversAvailable}
            onChange={(e) =>
              setDriversAvailable(
                Math.max(
                  1,
                  Math.min(maxDrivers, parseInt(e.target.value) || 1),
                ),
              )
            }
            style={styles.input}
          />
          <p style={styles.helperText}>
            {maxDrivers} driver{maxDrivers !== 1 ? "s" : ""} available
          </p>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Optimization Strategy</label>
          <div style={styles.radioGroup}>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="strategy"
                value="predictive"
                checked={strategy === "predictive"}
                onChange={(e) => setStrategy(e.target.value)}
                style={{ marginRight: 8 }}
              />
              Smart Route (Predictive AI)
            </label>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="strategy"
                value="simple"
                checked={strategy === "simple"}
                onChange={(e) => setStrategy(e.target.value)}
                style={{ marginRight: 8 }}
              />
              Smart Route (TSP Optimization)
            </label>
          </div>
        </div>

        <button
          onClick={handleGenerateRoutes}
          disabled={loading}
          style={styles.generateBtn}
        >
          {loading ? "Generating Routes..." : "Generate Optimized Routes"}
        </button>

        {unassignedBins.length > 0 && (
          <div style={styles.urgentAlert}>
            <h4 style={{ color: "#c53030", margin: "0 0 8px" }}>
              ⚠️ {unassignedBins.length} Urgent Bins Unassigned
            </h4>
            <ul style={{ paddingLeft: 20, fontSize: 12, color: "#742a2a" }}>
              {unassignedBins.map((b) => (
                <li key={b.binId}>
                  {b.binId}: {b.reason} ({b.fillLevel}% full)
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div style={styles.mapSection}>
        <div style={styles.mapContainer}>
          <MapContainer
            center={DEFAULT_DEPOT_COORDS}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap"
            />
            <Marker position={DEFAULT_DEPOT_COORDS} icon={depotIcon}>
              <Popup>
                <strong>🏢 Starting Depot (Bellevue Facility)</strong>
              </Popup>
            </Marker>
            <MapController bins={bins} />

            {bins.map((bin) => {
              if (!bin.location?.lat || !bin.location?.lon) return null;
              return (
                <CircleMarker
                  key={bin.id || bin.binId}
                  center={[bin.location.lat, bin.location.lon]}
                  radius={
                    bin.fillLevel >= 90 ? 12 : bin.fillLevel >= 70 ? 10 : 8
                  }
                  fillColor={getBinFillColor(bin.fillLevel, bin.isFlagged)}
                  color="#fff"
                  weight={2}
                  fillOpacity={0.8}
                >
                  <Popup>
                    <strong>{bin.binId}</strong>
                    <br />
                    {bin.locationName}
                    <br />
                    Fill: {bin.fillLevel}%<br />
                    Status:{" "}
                    {bin.isFlagged
                      ? "🚩 Flagged"
                      : bin.fillLevel >= 90
                        ? "🔴 Critical"
                        : bin.fillLevel >= 70
                          ? "🟡 Full"
                          : "🟢 Normal"}
                  </Popup>
                </CircleMarker>
              );
            })}

            {generatedRoutes.flatMap((route, routeIndex) =>
              (route.steps || [])
                .filter((s) => s.type === "DUMP")
                .map((step, stepIndex) => (
                  <Marker
                    key={`dump-${routeIndex}-${stepIndex}`}
                    position={[step.lat, step.lon]}
                    icon={dumpIcon}
                  >
                    <Popup>
                      <strong>
                        🏭 {step.stationName || "Transfer Station"}
                      </strong>
                      <br />
                      Route {routeIndex + 1}
                      <br />
                      Truck load before dump:{" "}
                      {step.currentTruckLoadYards?.toFixed(1)} yds³
                    </Popup>
                  </Marker>
                )),
            )}

            {generatedRoutes.map((route, i) => {
              if (route.status === "COMPLETED") return null;

              const coords =
                roadRoutes[route.id || route.truckId] ||
                getRouteCoordinates(route);

              if (!coords || coords.length < 2) return null;

              return (
                <Polyline
                  key={route.id || i}
                  positions={coords}
                  color={getRouteColor(i)}
                  weight={5}
                  opacity={0.8}
                >
                  <Popup>
                    <strong>Route {i + 1}</strong>
                    <br />
                    Driver: {route.driverId || `Driver ${i + 1}`}
                    <br />
                    Truck: {getDriverTruck(route.driverId) || route.truckId}
                    <br />
                    Stops:{" "}
                    {route.steps?.filter(
                      (s) => s.type === "BIN" && s.binFillLevel > 0,
                    ).length || 0}
                  </Popup>
                </Polyline>
              );
            })}
          </MapContainer>
        </div>

        <div style={styles.binsStats}>
          <h3 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 600 }}>
            📊 Bin Status
          </h3>
          <p style={{ margin: "2px 0", fontSize: 13 }}>
            <strong>Total: </strong> {bins.length}
          </p>
          <p style={{ margin: "2px 0", fontSize: 13 }}>
            <strong>Needing Pickup (≥70%): </strong>{" "}
            <span style={{ color: "#e53e3e", fontWeight: "bold" }}>
              {binsNeedingPickup.length}
            </span>
          </p>
          <p style={{ margin: "2px 0", fontSize: 13 }}>
            <strong>Empty (0%): </strong>{" "}
            <span style={{ color: "#718096", fontWeight: "bold" }}>
              {bins.filter((b) => b.fillLevel === 0).length}
            </span>
          </p>
        </div>

        <div style={styles.driverCards}>
          {generatedRoutes.length === 0 ? (
            <div
              style={{
                gridColumn: "1/-1",
                textAlign: "center",
                padding: 40,
                color: "#718096",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
              <h3 style={{ fontSize: 18, marginBottom: 8, color: "#2d3748" }}>
                No Routes Generated Yet
              </h3>
              <p style={{ fontSize: 14 }}>
                Click "Generate Optimized Routes" to create AI-optimized routes
              </p>
            </div>
          ) : (
            generatedRoutes.map((route, i) => {
              const isCompleted = route.status === "COMPLETED";

              // ✅ FIX: Removed the top-level hrs and mins calculation

              const binStops = isCompleted
                ? 0
                : route.steps?.filter(
                    (s) => s.type === "BIN" && s.binFillLevel > 0,
                  ).length || 0;

              const dumpStops = isCompleted
                ? 0
                : route.steps?.filter(
                    (s) => s.type === "DUMP" && s.action === "EMPTY_TRUCK",
                  ).length || 0;

              let timeDisplay;
              if (isCompleted) {
                timeDisplay = "N/A";
              } else {
                const hrs = Math.floor(route.totalTimeMinutes / 60);
                const mins = route.totalTimeMinutes % 60;
                timeDisplay = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
              }

              const isSelected = selectedRouteId === route.id;

              const displayDriverId = route.driverId;
              const displayTruckId =
                getDriverTruck(displayDriverId) || route.truckId;
              const hasTruck = !!getDriverTruck(displayDriverId);

              return (
                <div
                  key={route.id || i}
                  onClick={() => setSelectedRouteId(route.id)}
                  style={{
                    ...styles.driverCard,
                    borderBottomColor: getRouteColor(i),
                    border: isSelected
                      ? "2px solid #3182ce"
                      : "1px solid #edf2f7",
                    boxShadow: isSelected
                      ? "0 4px 12px rgba(49, 130, 206, 0.2)"
                      : "0 1px 3px rgba(0,0,0,0.05)",
                    cursor: "pointer",
                    transform: isSelected ? "translateY(-2px)" : "none",
                    // Optional: Make the card look slightly faded if completed
                    opacity: isCompleted ? 0.6 : 1,
                  }}
                >
                  <h3 style={styles.driverCardTitle}>
                    Driver {i + 1}
                    {/* ✅ ADD: Show a completed badge */}
                    {isCompleted && (
                      <span
                        style={{
                          color: "#38a169",
                          fontSize: "14px",
                          marginLeft: "8px",
                        }}
                      >
                        ✅ Completed
                      </span>
                    )}
                  </h3>

                  <p style={styles.driverCardText}>
                    📌 {binStops} Bin Stop{binStops !== 1 ? "s" : ""}
                  </p>
                  {dumpStops > 0 && (
                    <p style={styles.driverCardText}>
                      🏭 {dumpStops} Dump Trip{dumpStops !== 1 ? "s" : ""}
                    </p>
                  )}

                  {/* ✅ Use timeDisplay here instead of hrs and mins */}
                  <p style={styles.driverCardText}>⏱️ {timeDisplay}</p>

                  <div style={styles.routeInfo}>
                    <strong>Truck: </strong>
                    <span
                      style={{
                        color: hasTruck ? "#2d3748" : "#e53e3e",
                        fontWeight: hasTruck ? "normal" : "bold",
                      }}
                    >
                      {displayTruckId || "N/A"}
                    </span>
                    {!hasTruck && displayDriverId && (
                      <div
                        style={{
                          color: "#e53e3e",
                          fontSize: "11px",
                          marginTop: "4px",
                          fontWeight: "bold",
                        }}
                      >
                        ⚠️ No truck assigned!
                      </div>
                    )}
                    <br />
                    <strong>Driver: </strong>{" "}
                    {displayDriverId || "Not assigned"}
                  </div>

                  {isSelected && (
                    <div
                      style={{
                        marginTop: "10px",
                        fontSize: "12px",
                        color: "#3182ce",
                        fontWeight: "bold",
                      }}
                    >
                      ✓ Selected (See Controls Below)
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Route Management Controls */}
        {selectedRouteId && (
          <div style={styles.actionPanel}>
            <h4 style={styles.actionTitle}>Route Management</h4>
            <p style={styles.actionHint}>
              Click a route card above to select it.
            </p>

            <div style={styles.selectedBox}>
              <p style={styles.selectedText}>
                Managing:{" "}
                <strong>
                  {(() => {
                    const selectedRoute = generatedRoutes.find(
                      (r) => r.id === selectedRouteId,
                    );
                    if (!selectedRoute) return "Unknown";
                    // Show the dynamic truck in the sidebar too
                    return (
                      getDriverTruck(selectedRoute.driverId) ||
                      selectedRoute.truckId
                    );
                  })()}
                </strong>
              </p>

              <button
                onClick={() => handleDeleteRoute(selectedRouteId)}
                style={styles.deleteBtnSidebar}
              >
                🗑️ Delete This Route
              </button>

              <div style={{ marginTop: "12px" }}>
                <label style={{ ...styles.label, fontSize: "12px" }}>
                  Reassign Driver:
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value)
                      handleAssignDriver(selectedRouteId, e.target.value);
                  }}
                  style={styles.input}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select a driver...
                  </option>
                  {driversList.map((driver) => {
                    const truck = getDriverTruck(driver.employeeId);
                    return (
                      <option key={driver.employeeId} value={driver.employeeId}>
                        {driver.firstName} {driver.lastName} (
                        {driver.employeeId}){" "}
                        {truck ? `- ${truck}` : "⚠️ No Truck"}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { display: "flex", height: "100vh", backgroundColor: "#f5f7fa" },
  formSection: {
    width: "380px",
    padding: "25px",
    backgroundColor: "white",
    borderRight: "1px solid #edf2f7",
    overflowY: "auto",
  },
  formTitle: {
    fontSize: "18px",
    fontWeight: "600",
    marginBottom: "20px",
    textAlign: "center",
    color: "#2d3748",
  },
  formGroup: { marginBottom: "20px" },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    color: "#4a5568",
    fontWeight: "500",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #cbd5e0",
    borderRadius: "4px",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  radioGroup: { display: "flex", flexDirection: "column", gap: "10px" },
  radioLabel: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    fontSize: "14px",
  },
  helperText: { fontSize: "12px", color: "#718096", marginTop: "4px" },
  generateBtn: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#1a202c",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "10px",
  },
  mapSection: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: "25px",
    overflow: "hidden",
  },
  mapContainer: {
    flex: 1,
    backgroundColor: "#edf2f7",
    borderRadius: "8px",
    marginBottom: "20px",
    overflow: "hidden",
    minHeight: "400px",
  },
  binsStats: {
    backgroundColor: "white",
    padding: "10px 15px",
    borderRadius: "8px",
    marginBottom: "16px",
    textAlign: "center",
  },
  driverCards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    maxHeight: "300px",
    overflowY: "auto",
  },
  driverCard: {
    padding: "15px",
    borderRadius: "8px",
    backgroundColor: "white",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    textAlign: "center",
    position: "relative",
    borderBottom: "4px solid",
    transition: "all 0.2s ease",
  },
  driverCardTitle: {
    margin: "0 0 12px",
    fontSize: "16px",
    fontWeight: "600",
    paddingBottom: "8px",
    borderBottom: "2px solid #cbd5e0",
  },
  driverCardText: {
    margin: "6px 0",
    fontSize: "14px",
    color: "#4a5568",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  },
  routeInfo: {
    marginTop: "10px",
    paddingTop: "10px",
    borderTop: "1px solid #e2e8f0",
    fontSize: "12px",
    color: "#718096",
    textAlign: "center", // ✅ Added to center the Truck/Driver text
  },
  errorMessage: {
    backgroundColor: "#fed7d7",
    color: "#e53e3e",
    padding: "12px",
    borderRadius: "4px",
    marginBottom: "16px",
    fontSize: "14px",
  },
  urgentAlert: {
    marginTop: "20px",
    padding: "10px",
    background: "#fff5f5",
    border: "1px solid #fed7d7",
    borderRadius: "4px",
  },
  actionPanel: {
    marginTop: "24px",
    padding: "16px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  actionTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#2d3748",
    margin: "0 0 8px 0",
  },
  actionHint: { fontSize: "12px", color: "#718096", margin: "0 0 12px 0" },
  selectedBox: {
    backgroundColor: "white",
    padding: "12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e0",
  },
  selectedText: { fontSize: "13px", color: "#4a5568", margin: "0 0 12px 0" },
  deleteBtnSidebar: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#fed7d7",
    color: "#e53e3e",
    border: "1px solid #feb2b2",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default AdminRoutePlanner;
