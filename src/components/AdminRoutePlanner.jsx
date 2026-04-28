// src/components/AdminRoutePlanner.jsx
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
// Fix Leaflet marker icons
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
// Depot coordinates for each starting location
const DEPOT_COORDINATES = {
  "central-maintenance": [47.6101, -122.2015],
  "south-renton": [47.4829, -122.2171],
  "north-kirkland": [47.6815, -122.2087],
  "east-issaquah": [47.5301, -122.0326],
  "west-seattle": [47.5707, -122.3862],
};
// Map Controller Component
function MapController({ bins }) {
  const map = useMap();
  const previousBinCount = useRef(0);

  useEffect(() => {
    if (bins.length > 0) {
      const binCoordinates = bins
        .filter((bin) => bin.location && bin.location.lat && bin.location.lon)
        .map((bin) => [bin.location.lat, bin.location.lon]);
      if (binCoordinates.length > 0) {
        const bounds = L.latLngBounds(binCoordinates);
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 15,
        });
      }
    }
    previousBinCount.current = bins.length;
  }, [bins, map]);

  useEffect(() => {
    const handleDoubleClick = () => {
      const mapContainer = document.querySelector(".leaflet-container");
      if (mapContainer) {
        mapContainer.style.transition = "opacity 0.5s ease";
        mapContainer.style.opacity = "0.3";

        if (bins.length === 0) {
          map.setView([47.6101, -122.2015], 13);
        } else {
          const binCoordinates = bins
            .filter(
              (bin) => bin.location && bin.location.lat && bin.location.lon,
            )
            .map((bin) => [bin.location.lat, bin.location.lon]);

          if (binCoordinates.length > 0) {
            const bounds = L.latLngBounds(binCoordinates);
            map.fitBounds(bounds, {
              padding: [50, 50],
              maxZoom: 15,
            });
          }
        }

        setTimeout(() => {
          mapContainer.style.opacity = "1";
        }, 100);
      }
    };

    map.on("dblclick", handleDoubleClick);
    return () => {
      map.off("dblclick", handleDoubleClick);
    };
  }, [bins, map]);

  return null;
}

const AdminRoutePlanner = () => {
  const [routeDateTime, setRouteDateTime] = useState("");
  const [driversAvailable, setDriversAvailable] = useState(6);
  const [shiftDuration, setShiftDuration] = useState("4");
  const [startingDepot, setStartingDepot] = useState("central-maintenance");
  const [strategy, setStrategy] = useState("predictive");
  const [loading, setLoading] = useState(false);
  const [generatedRoutes, setGeneratedRoutes] = useState([]);
  const [unassignedBins, setUnassignedBins] = useState([]);
  const [bins, setBins] = useState([]);
  const [error, setError] = useState(null);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [maxDrivers, setMaxDrivers] = useState(9);

  // Helper to get marker color
  const getBinFillColor = (fillLevel, isFlagged) => {
    if (isFlagged) return "#e53e3e";
    if (fillLevel >= 90) return "#e53e3e";
    if (fillLevel >= 70) return "#dd6b20";
    if (fillLevel >= 40) return "#38a169";
    if (fillLevel > 0) return "#38a169";
    return "#718096";
  };

  // // Auto-load bins, drivers, and latest routes on mount
  // useEffect(() => {
  //   const now = new Date();
  //   now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  //   setRouteDateTime(now.toISOString().slice(0, 16));
  //   fetchBins();
  //   fetchDrivers();
  //   fetchLatestRoutes();
  // }, []);
  useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const formattedDateTime = now.toISOString().slice(0, 16);
    const formattedDate = formattedDateTime.split("T")[0];

    setRouteDateTime(formattedDateTime);
    fetchBins();
    fetchDrivers();
    fetchRoutesByDate(formattedDate); // Fetch immediately with correct date
  }, []);

  const fetchRoutesByDate = async (date) => {
    try {
      console.log("📅 Fetching routes for date:", date);
      const response = await axios.get(
        `http://localhost:8080/api/routes/by-date/${date}`,
      );
      console.log("✅ Fetched routes:", response.data.length);
      setGeneratedRoutes(response.data || []);
    } catch (err) {
      console.error("Error fetching routes:", err);
      setGeneratedRoutes([]);
    }
  };

  const fetchBins = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/bins");
      setBins(response.data);
    } catch (err) {
      console.error("Error fetching bins:", err);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/employees");
      const drivers = response.data.filter(
        (emp) => emp.role?.toUpperCase() === "DRIVER",
      );
      setAvailableDrivers(drivers);
      setMaxDrivers(drivers.length);
      if (drivers.length > 0 && driversAvailable > drivers.length) {
        setDriversAvailable(drivers.length.toString());
      }
    } catch (err) {
      console.error("Error fetching drivers:", err);
      setMaxDrivers(9);
    }
  };

  const fetchLatestRoutes = async () => {
    try {
      const selectedDate = routeDateTime.split("T")[0];
      const response = await axios.get(
        `http://localhost:8080/api/routes/by-date/${selectedDate}`,
      );
      // Clear existing routes on load so we don't show stale data before generation
      setGeneratedRoutes([]);
    } catch (err) {
      console.error("Error fetching latest routes:", err);
      setGeneratedRoutes([]);
    }
  };

  const handleGenerateRoutes = async () => {
    setLoading(true);
    setError(null);
    setUnassignedBins([]);
    try {
      if (driversAvailable < 1 || driversAvailable > 9) {
        setError("Number of drivers must be between 1 and 9");
        setLoading(false);
        return;
      }

      if (availableDrivers.length === 0) {
        setError("No drivers available. Add drivers from Teams page first.");
        setLoading(false);
        return;
      }

      console.log("Requesting routes for ", driversAvailable, " drivers ");

      // ✅ Call the correct backend endpoint /api/routes/generate
      // The backend expects query params: trucks, date, time
      const response = await axios.post(
        `http://localhost:8080/api/routes/generate`,
        null, // No body needed for POST when using Query Params
        {
          params: {
            trucks: driversAvailable,
            date: routeDateTime.split("T")[0], // Extract YYYY-MM-DD
            time: routeDateTime.split("T")[1] || "07:00", // Extract HH:mm
            strategy: strategy,
          },
        },
      );

      console.log("📤 Sending strategy:", strategy);
      console.log("Backend response: ", response.data);

      // ✅ Parse the GenerateRoutesResponse object
      const generatedRoutesList = response.data.routes || [];
      const urgentBins = response.data.urgentUnassignedBins || [];

      setGeneratedRoutes(generatedRoutesList);
      setUnassignedBins(urgentBins);

      // ✅ After generating, fetch from DB to ensure persistence
      const selectedDate = routeDateTime.split("T")[0];
      await fetchRoutesByDate(selectedDate);

      if (generatedRoutesList.length > 0) {
        alert(
          `✅ Successfully generated ${generatedRoutesList.length} optimized routes!`,
        );
      } else {
        setError("No routes were generated. Check backend logs for details.");
      }
    } catch (err) {
      console.error("Error generating routes: ", err);
      setError(err.response?.data?.message || "Failed to generate routes");
    } finally {
      setLoading(false);
    }
  };

  const getRouteColor = (index) => {
    const colors = [
      "#3182ce",
      "#e53e3e",
      "#38a169",
      "#dd6b20",
      "#805ad5",
      "#d53f8c",
      "#319795",
      "#d69e2e",
      "#9f7aea",
    ];
    return colors[index % colors.length];
  };

  // ✅ UPDATED: Extract coordinates directly from RouteDTO steps provided by Backend
  const getRouteCoordinates = (routeDto) => {
    if (!routeDto || !routeDto.steps) {
      console.warn("⚠️ No steps found in route:", routeDto);
      return [];
    }

    const depotCoords =
      DEPOT_COORDINATES[startingDepot] ||
      DEPOT_COORDINATES["central-maintenance"];

    const binSteps = routeDto.steps.filter((step) => step.type === "BIN");
    const binCoordinates = binSteps.map((step) => [step.lat, step.lon]);

    console.log(`🗺️ Route coordinates for ${routeDto.truckId || "unknown"}:`, [
      depotCoords,
      ...binCoordinates,
    ]);

    return [depotCoords, ...binCoordinates];
  };

  const binsNeedingPickup = bins.filter((bin) => bin.fillLevel >= 70);

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
            onChange={(e) => {
              const value = parseInt(e.target.value) || 1;
              if (value <= maxDrivers) {
                setDriversAvailable(value);
              }
            }}
            disabled={maxDrivers === 0}
            style={styles.input}
          />
          <p style={styles.helperText}>
            {maxDrivers} driver{maxDrivers !== 1 ? "s" : ""} available
            {maxDrivers === 0 && " - Add drivers from Teams page"}
          </p>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Shift Duration</label>
          <select
            value={shiftDuration}
            onChange={(e) => setShiftDuration(e.target.value)}
            style={styles.input}
          >
            <option value="4">4 hours</option>
            <option value="6">6 hours</option>
            <option value="8">8 hours</option>
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Starting Depot</label>
          <select
            value={startingDepot}
            onChange={(e) => setStartingDepot(e.target.value)}
            style={styles.input}
          >
            <option value="central-maintenance">
              Central Maintenance Facility - Bellevue
            </option>
            <option value="south-renton">South Depot - Renton</option>
            <option value="north-kirkland">North Depot - Kirkland</option>
            <option value="east-issaquah">East Depot - Issaquah</option>
            <option value="west-seattle">West Depot - Seattle</option>
          </select>
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
                style={{ marginRight: "8px" }}
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
                style={{ marginRight: "8px" }}
              />
              Smart Route (TSP Optimization)
            </label>
          </div>
        </div>

        <button
          className="generate-btn"
          onClick={handleGenerateRoutes}
          disabled={loading}
          style={styles.generateBtn}
        >
          {loading ? "Generating Routes..." : "Generate Optimized Routes"}
        </button>

        {/* Display Unassigned Bins if any */}
        {unassignedBins.length > 0 && (
          <div
            style={{
              marginTop: "20px",
              padding: "10px",
              background: "#fff5f5",
              border: "1px solid #fed7d7",
              borderRadius: "4px",
            }}
          >
            <h4 style={{ color: "#c53030", margin: "0 0 10px 0" }}>
              ⚠️ {unassignedBins.length} Urgent Bins Could Not Be Assigned
            </h4>
            <ul
              style={{
                paddingLeft: "20px",
                fontSize: "12px",
                color: "#742a2a",
              }}
            >
              {unassignedBins.map((bin) => (
                <li key={bin.binId}>
                  {bin.binId}: {bin.reason} ({bin.fillLevel}% full)
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div style={styles.mapSection}>
        <div style={styles.mapContainer}>
          <MapContainer
            center={[47.6101, -122.2015]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            <CircleMarker
              center={
                DEPOT_COORDINATES[startingDepot] ||
                DEPOT_COORDINATES["central-maintenance"]
              }
              radius={12}
              fillColor="#718096"
              color="#fff"
              weight={3}
              opacity={1}
              fillOpacity={0.9}
            >
              <Popup>
                <strong>🏢 Starting Depot</strong>
                <br />
                {startingDepot === "central-maintenance" &&
                  "Central Maintenance Facility - Bellevue"}
                {startingDepot === "south-renton" && "South Depot - Renton"}
                {startingDepot === "north-kirkland" && "North Depot - Kirkland"}
                {startingDepot === "east-issaquah" && "East Depot - Issaquah"}
                {startingDepot === "west-seattle" && "West Depot - Seattle"}
              </Popup>
            </CircleMarker>

            <MapController bins={bins} />

            {bins.map((bin) => {
              if (!bin.location || !bin.location.lat || !bin.location.lon)
                return null;
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
                  opacity={1}
                  fillOpacity={0.8}
                >
                  <Popup>
                    <strong>{bin.binId}</strong>
                    <br />
                    {bin.locationName}
                    <br />
                    Fill: {bin.fillLevel}%
                    <br />
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

            {/* ✅ Render Routes using new coordinate extractor */}
            {generatedRoutes.map((route, index) => {
              const coordinates = getRouteCoordinates(route);

              return (
                <Polyline
                  key={index}
                  positions={coordinates}
                  color={getRouteColor(index)}
                  weight={4}
                  opacity={0.8}
                >
                  <Popup>
                    <strong>Route {index + 1}</strong>
                    <br />
                    Driver: {route.driverId || `Driver ${index + 1}`}
                    <br />
                    Truck: {route.truckId}
                    <br />
                    Stops: {route.steps.filter((s) => s.type === "BIN").length}
                  </Popup>
                </Polyline>
              );
            })}
          </MapContainer>
        </div>

        {/* ✅ FIXED BIN STATUS SECTION STYLES */}
        <div style={styles.binsStats}>
          <h3
            style={{
              margin: "0 0 6px 0",
              fontSize: "14px",
              fontWeight: "600",
              color: "#2d3748",
            }}
          >
            📊 Bin Status
          </h3>
          <p style={{ margin: "2px 0", fontSize: "13px", color: "#4a5568" }}>
            <strong style={{ color: "#2d3748" }}>Total Bins:</strong>
            {"   "}
            {bins.length}
          </p>
          <p style={{ margin: "2px 0", fontSize: "13px", color: "#4a5568" }}>
            <strong style={{ color: "#2d3748" }}>Needing Pickup (≥70%):</strong>
            {"   "}
            <span style={{ color: "#e53e3e", fontWeight: "bold" }}>
              {binsNeedingPickup.length}
            </span>
          </p>
          <p style={{ margin: "2px 0", fontSize: "13px", color: "#4a5568" }}>
            <strong style={{ color: "#2d3748" }}>Empty (0%):</strong>
            {"   "}
            <span style={{ color: "#718096", fontWeight: "bold" }}>
              {bins.filter((b) => b.fillLevel === 0).length}
            </span>
          </p>
          {binsNeedingPickup.length === 0 &&
            bins.filter((b) => b.fillLevel === 0).length === 0 && (
              <p
                style={{
                  color: "#e53e3e",
                  fontWeight: "bold",
                  fontSize: "12px",
                  marginTop: "6px",
                }}
              >
                ⚠️ No bins need pickup yet. Add bins with fill level ≥ 70%
              </p>
            )}
        </div>

        <div style={styles.driverCards}>
          {generatedRoutes.length === 0 ? (
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "40px",
                color: "#718096",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🗺️</div>
              <h3
                style={{
                  fontSize: "18px",
                  marginBottom: "8px",
                  color: "#2d3748",
                  fontWeight: "600",
                }}
              >
                No Routes Generated Yet
              </h3>
              <p style={{ fontSize: "14px" }}>
                Click "Generate Optimized Routes" to create AI-optimized routes
              </p>
            </div>
          ) : (
            generatedRoutes.map((route, index) => {
              const hours = Math.floor(route.totalTimeMinutes / 60);
              const minutes = route.totalTimeMinutes % 60;
              const binStops = route.steps.filter(
                (s) => s.type === "BIN",
              ).length;

              return (
                <div
                  key={index}
                  style={{
                    ...styles.driverCard,
                    borderBottomColor: getRouteColor(index),
                  }}
                >
                  <h3 style={styles.driverCardTitle}>Driver {index + 1}</h3>
                  <p style={styles.driverCardText}>{binStops} Stops</p>
                  <p style={styles.driverCardText}>
                    ⏱️ {hours > 0 ? `${hours}h` : "    "}
                    {minutes}m
                  </p>
                  <div style={styles.routeInfo}>
                    <strong>Truck:</strong>
                    {"    "}
                    {route.truckId || "N/A"}
                    <br />
                    <strong>Driver:</strong>
                    {"    "}
                    {route.driverId || "Not assigned"}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// Inline styles
const styles = {
  container: {
    display: "flex",
    height: "100%",
    backgroundColor: "#f5f7fa",
  },
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
  formGroup: {
    marginBottom: "20px",
  },
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
    backgroundColor: "white",
  },
  radioGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  radioLabel: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    fontSize: "14px",
  },
  helperText: {
    fontSize: "12px",
    color: "#718096",
    marginTop: "4px",
  },
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
    transition: "background 0.2s",
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
  },
  errorMessage: {
    backgroundColor: "#fed7d7",
    color: "#e53e3e",
    padding: "12px",
    borderRadius: "4px",
    marginBottom: "16px",
    fontSize: "14px",
  },
};

export default AdminRoutePlanner;
