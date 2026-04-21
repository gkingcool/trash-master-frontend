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
import stopIcon from "../assets/icons/stop-icon.png";
import timeIcon from "../assets/icons/time-icon.png";
// Fix Leaflet marker icons
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// ✅ Depot coordinates for each starting location
const DEPOT_COORDINATES = {
  "central-maintenance": [47.6101, -122.2015], // Bellevue
  "south-renton": [47.4829, -122.2171], // Renton
  "north-kirkland": [47.6815, -122.2087], // Kirkland
  "east-issaquah": [47.5301, -122.0326], // Issaquah
  "west-seattle": [47.5707, -122.3862], // Seattle
};

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// ✅ Map Controller - Auto-zoom to all bins + Double-click functionality
function MapController({ bins }) {
  const map = useMap();
  const previousBinCount = useRef(0);

  // ✅ Auto-zoom to show all bins on initial load
  useEffect(() => {
    if (bins.length > 0) {
      const binCoordinates = bins
        .filter((bin) => bin.latitude && bin.longitude)
        .map((bin) => [bin.latitude, bin.longitude]);

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

  // ✅ Double-click to zoom out and show all bins with fade animation
  useEffect(() => {
    const handleDoubleClick = () => {
      // Add fade effect to map container
      const mapContainer = document.querySelector(".leaflet-container");
      if (mapContainer) {
        mapContainer.style.transition = "opacity 0.5s ease";
        mapContainer.style.opacity = "0.3";

        // Zoom out to show all bins
        if (bins.length === 0) {
          map.setView([47.6101, -122.2015], 13);
        } else {
          const binCoordinates = bins
            .filter((bin) => bin.latitude && bin.longitude)
            .map((bin) => [bin.latitude, bin.longitude]);

          if (binCoordinates.length > 0) {
            const bounds = L.latLngBounds(binCoordinates);
            map.fitBounds(bounds, {
              padding: [50, 50],
              maxZoom: 15,
            });
          }
        }

        // Fade back in after zoom
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
  const [bins, setBins] = useState([]);
  const [error, setError] = useState(null);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [maxDrivers, setMaxDrivers] = useState(9);

  // ✅ Helper to determine bin color (SAME AS DASHBOARD)
  const getBinFillColor = (fillLevel, isFlagged) => {
    if (isFlagged) return "#e53e3e"; // Red for flagged
    if (fillLevel >= 90) return "#e53e3e"; // Red (Critical)
    if (fillLevel >= 70) return "#dd6b20"; // Orange (Full)
    if (fillLevel >= 40) return "#38a169"; // Green (Normal)
    if (fillLevel > 0) return "#38a169"; // Green (Low)
    return "#718096"; // Gray (Empty)
  };

  // ✅ Auto-load bins, drivers, and LATEST routes on mount
  useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setRouteDateTime(now.toISOString().slice(0, 16));
    fetchBins();
    fetchDrivers();
    fetchLatestRoutes();
  }, []);

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
      const response = await axios.get(
        "http://localhost:8080/api/routes/latest",
      );
      setGeneratedRoutes(response.data);
      console.log("Loaded latest routes:", response.data.length);
    } catch (err) {
      console.error("Error fetching latest routes:", err);
      setGeneratedRoutes([]);
    }
  };

  const handleGenerateRoutes = async () => {
    setLoading(true);
    setError(null);
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

      const response = await axios.post(
        `http://localhost:8080/api/routes/generate-all?numDrivers=${driversAvailable}`,
      );

      console.log("Backend response: ", response.data);
      console.log("Number of routes received: ", response.data?.length || 0);

      setGeneratedRoutes(response.data || []);

      if (response.data?.length > 0) {
        alert(
          `✅ Successfully generated ${response.data.length} optimized routes!`,
        );
      } else {
        setError("No routes were generated. Check backend logs for details.");
      }
    } catch (err) {
      console.error("Error generating routes:", err);
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

  const getRouteCoordinates = (route) => {
    if (!route.binIds || route.binIds.length === 0) return [];

    const depotCoords =
      DEPOT_COORDINATES[startingDepot] ||
      DEPOT_COORDINATES["central-maintenance"];

    const binCoordinates = route.binIds
      .map((binId) => {
        const bin = bins.find((b) => b.id === binId || b.binId === binId);
        if (bin) {
          return [bin.latitude, bin.longitude];
        }
        return null;
      })
      .filter((coord) => coord !== null);
    return [depotCoords, ...binCoordinates];
  };

  const binsNeedingPickup = bins.filter((bin) => bin.fillLevel >= 70);

  return (
    <div style={{ display: "flex", height: "100%", background: "#f5f7fa" }}>
      <style>{`
        .admin-route-planner-content {
          display: flex;
          height: 100%;
          background: #f5f7fa;
        }
        .form-section {
          width: 380px;
          padding: 25px;
          background: white;
          border-right: 1px solid #edf2f7;
          overflow-y: auto;
        }
        .form-section h2 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 20px;
          text-align: center;
          color: #2d3748;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          color: #4a5568;
          font-weight: 500;
        }
        .form-group input,
        .form-group select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #cbd5e0;
          border-radius: 4px;
          font-size: 14px;
          background: white;
        }
        .form-group input[type="number"] {
          -moz-appearance: textfield;
        }
        .form-group input[type="number"]::-webkit-outer-spin-button,
        .form-group input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .radio-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .radio-group label {
          display: flex;
          align-items: center;
          cursor: pointer;
          font-size: 14px;
        }
        .radio-group input {
          margin-right: 8px;
          width: 16px;
          height: 16px;
        }
        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #38A169;
          box-shadow: 0 0 0 2px rgba(56, 161, 105, 0.2);
        }
        .generate-btn {
          width: 100%;
          padding: 12px;
          background: #1a202c;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 10px;
          transition: background 0.2s;
        }
        .generate-btn:hover {
          background: #2d3748;
        }
        .generate-btn:disabled {
          background: #a0aec0;
          cursor: not-allowed;
        }
        .map-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 25px;
          overflow: hidden;
        }
        .map-container {
          flex: 1;
          background: #edf2f7;
          border-radius: 8px;
          margin-bottom: 20px;
          overflow: hidden;
        }
        .driver-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          max-height: 300px;
          overflow-y: auto;
        }
        .driver-card {
          padding: 15px;
          border-radius: 8px;
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          text-align: center;
          position: relative;
          border-bottom: 4px solid;
        }
        .driver-card h3 {
          margin: 0 0 12px;
          font-size: 16px;
          font-weight: 600;
          padding-bottom: 8px;
          border-bottom: 2px solid #cbd5e0;
        }
        .driver-card p {
          margin: 6px 0;
          font-size: 14px;
          color: #4a5568;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .driver-card img {
          width: 16px;
          height: 16px;
          opacity: 0.8;
        }
        .error-message {
          background: #fed7d7;
          color: #e53e3e;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
          font-size: 14px;
        }
        .route-info {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #e2e8f0;
          font-size: 12px;
          color: #718096;
        }
        .bins-stats {
          background: white;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          text-align: center;
        }
        .bins-stats h3 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #2d3748;
        }
        .bins-stats p {
          margin: 4px 0;
          font-size: 13px;
          color: #4a5568;
        }
      `}</style>

      <section className="form-section">
        <h2>Generate Daily Routes</h2>

        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label>Date & Time</label>
          <input
            type="datetime-local"
            value={routeDateTime}
            onChange={(e) => setRouteDateTime(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Number of Drivers (1-{maxDrivers})</label>
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
          />
          <p style={{ fontSize: "12px", color: "#718096", marginTop: "4px" }}>
            {maxDrivers} driver{maxDrivers !== 1 ? "s" : ""} available
            {maxDrivers === 0 && " - Add drivers from Teams page"}
          </p>
        </div>

        <div className="form-group">
          <label>Shift Duration</label>
          <select
            value={shiftDuration}
            onChange={(e) => setShiftDuration(e.target.value)}
          >
            <option value="4">4 hours</option>
            <option value="6">6 hours</option>
            <option value="8">8 hours</option>
          </select>
        </div>

        <div className="form-group">
          <label>Starting Depot</label>
          <select
            value={startingDepot}
            onChange={(e) => setStartingDepot(e.target.value)}
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

        <div className="form-group">
          <label>Optimization Strategy</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="strategy"
                value="predictive"
                checked={strategy === "predictive"}
                onChange={(e) => setStrategy(e.target.value)}
              />
              Smart Route (Predictive AI)
            </label>
            <label>
              <input
                type="radio"
                name="strategy"
                value="simple"
                checked={strategy === "simple"}
                onChange={(e) => setStrategy(e.target.value)}
              />
              Smart Route (TSP Optimization)
            </label>
          </div>
        </div>

        <button
          className="generate-btn"
          onClick={handleGenerateRoutes}
          disabled={loading}
        >
          {loading ? "Generating Routes..." : "Generate Optimized Routes"}
        </button>
      </section>

      <section className="map-section">
        <div className="map-container">
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
              fillColor="#1a202c"
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

            {/* ✅ Map Controller - Auto-zoom + Double-click */}
            <MapController bins={bins} />

            {bins.map((bin) => (
              <CircleMarker
                key={bin.id || bin.binId}
                center={[bin.latitude, bin.longitude]}
                radius={bin.fillLevel >= 90 ? 12 : bin.fillLevel >= 70 ? 10 : 8}
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
            ))}

            {generatedRoutes.map((route, index) => {
              const coordinates = getRouteCoordinates(route);
              return (
                <React.Fragment key={route.id}>
                  {coordinates.length > 1 && (
                    <Polyline
                      positions={coordinates}
                      color={getRouteColor(index)}
                      weight={4}
                      opacity={0.8}
                    >
                      <Popup>
                        <strong>Route {route.routeNumber}</strong>
                        <br />
                        Driver: {route.driverName || "Driver " + (index + 1)}
                        <br />
                        Stops: {route.totalStops}
                        <br />
                        Distance: {route.totalDistance?.toFixed(1)} mi
                        <br />
                        Est. Time: {Math.floor(route.estimatedTime / 60)}h{" "}
                        {route.estimatedTime % 60}m
                      </Popup>
                    </Polyline>
                  )}
                </React.Fragment>
              );
            })}
          </MapContainer>
        </div>

        <div className="bins-stats">
          <h3>📊 Bin Status</h3>
          <p>
            <strong>Total Bins:</strong> {bins.length}
          </p>
          <p>
            <strong>Needing Pickup (≥70%):</strong>{" "}
            <span style={{ color: "#e53e3e", fontWeight: "bold" }}>
              {binsNeedingPickup.length}
            </span>
          </p>
          <p>
            <strong>Empty (0%):</strong>{" "}
            <span style={{ color: "#718096", fontWeight: "bold" }}>
              {bins.filter((b) => b.fillLevel === 0).length}
            </span>
          </p>
          {binsNeedingPickup.length === 0 &&
            bins.filter((b) => b.fillLevel === 0).length === 0 && (
              <p style={{ color: "#e53e3e", fontWeight: "bold" }}>
                ⚠️ No bins need pickup yet. Add bins with fill level ≥ 70%
              </p>
            )}
        </div>

        <div className="driver-cards">
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
              const hours = Math.floor(route.estimatedTime / 60);
              const minutes = route.estimatedTime % 60;
              return (
                <div
                  key={route.id}
                  className="driver-card"
                  style={{ borderBottomColor: getRouteColor(index) }}
                >
                  <h3>Driver {index + 1}</h3>
                  <p>
                    <img src={stopIcon} alt="Stops" />
                    {route.totalStops} Stops
                  </p>
                  <p>
                    <img src={timeIcon} alt="Time" />
                    {hours > 0 ? `${hours}h ` : ""}
                    {minutes}m
                  </p>
                  <div className="route-info">
                    <strong>Distance:</strong>{" "}
                    {route.totalDistance?.toFixed(1) || 0} mi
                    <br />
                    <strong>Route:</strong> {route.routeNumber}
                    <br />
                    <strong>Driver:</strong>{" "}
                    {route.driverName || "Not assigned"}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminRoutePlanner;
