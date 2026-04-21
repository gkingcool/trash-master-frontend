// src/components/DriverTrackingPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Polyline,
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

// ✅ Define the Starting Depot (Bellevue Facility)
const DEPOT_COORDINATES = [47.6101, -122.2015];

const DriverTrackingPage = () => {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const [route, setRoute] = useState(null);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRouteData();
  }, [driverId]);

  const fetchRouteData = async () => {
    try {
      // 1. Fetch current route for this driver
      const routeRes = await axios.get(
        `http://localhost:8080/api/routes/by-driver/${driverId}/current`,
      );
      setRoute(routeRes.data);

      // 2. Fetch all bins in the route
      if (routeRes.data.binIds && routeRes.data.binIds.length > 0) {
        const binPromises = routeRes.data.binIds.map((binId) =>
          axios.get(`http://localhost:8080/api/bins/${binId}`),
        );
        const binResponses = await Promise.all(binPromises);
        setBins(binResponses.map((res) => res.data));
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
        <p style={{ marginTop: "16px", color: "#4a5568" }}>
          Loading tracking data...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p style={{ color: "#e53e3e", marginBottom: "16px" }}>{error}</p>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: "8px 16px",
            background: "#edf2f7",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          ← Back to Drivers
        </button>
      </div>
    );
  }

  if (!route || bins.length === 0) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p style={{ color: "#718096", marginBottom: "16px" }}>
          No active route found for this driver.
        </p>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: "8px 16px",
            background: "#edf2f7",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          ← Back to Drivers
        </button>
      </div>
    );
  }

  // UPDATED: Route path now starts at the Depot (Bellevue) and goes to bins
  const routePath = [
    DEPOT_COORDINATES,
    ...bins.map((bin) => [bin.latitude, bin.longitude]),
  ];

  const completedIds = route.completedBinIds || [];

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#f5f7fa",
        minHeight: "100vh",
      }}
    >
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: "16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "16px",
          color: "#3182ce",
          fontWeight: "600",
        }}
      >
        ← Back to Drivers
      </button>

      <h2 style={{ marginBottom: "20px", color: "#1a202c" }}>
        Live Route: {route.routeNumber}
      </h2>

      {/* Map */}
      <div
        style={{
          height: "500px",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          marginBottom: "20px",
        }}
      >
        <MapContainer
          center={DEPOT_COORDINATES}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* Polyline now includes the Depot at the start */}
          <Polyline
            positions={routePath}
            color="#3182ce"
            weight={5}
            opacity={0.7}
          />

          {/* Depot Marker (Bellevue Facility) */}
          <CircleMarker
            center={DEPOT_COORDINATES}
            radius={10}
            fillColor="#1a202c"
            color="#fff"
            weight={3}
            opacity={1}
            fillOpacity={0.9}
          >
            <Popup>
              <strong>🏢 Starting Depot</strong>
              <br />
              Bellevue Facility
            </Popup>
          </CircleMarker>

          {/* Bin Markers */}
          {bins.map((bin) => {
            const isCompleted = completedIds.includes(bin.id);
            return (
              <CircleMarker
                key={bin.id}
                center={[bin.latitude, bin.longitude]}
                radius={isCompleted ? 8 : 12}
                fillColor={
                  isCompleted
                    ? "#a0aec0"
                    : bin.fillLevel >= 70
                      ? "#e53e3e"
                      : "#38a169"
                }
                color="#fff"
                weight={2}
                fillOpacity={isCompleted ? 0.5 : 0.9}
              >
                <Popup>
                  <strong>{bin.binId}</strong>
                  <br />
                  {bin.locationName}
                  <br />
                  Fill: {bin.fillLevel}%
                  <br />
                  Status: {isCompleted ? "✅ Completed" : "⏳ Pending"}
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "16px",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ fontSize: "14px", color: "#718096" }}>Route Status</div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: route.status === "COMPLETED" ? "#38a169" : "#3182ce",
            }}
          >
            {route.status || "IN_PROGRESS"}
          </div>
        </div>
        <div
          style={{
            background: "white",
            padding: "16px",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ fontSize: "14px", color: "#718096" }}>Progress</div>
          <div style={{ fontSize: "20px", fontWeight: "700" }}>
            {completedIds.length} / {route.totalStops} stops
          </div>
        </div>
        <div
          style={{
            background: "white",
            padding: "16px",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ fontSize: "14px", color: "#718096" }}>Distance</div>
          <div style={{ fontSize: "20px", fontWeight: "700" }}>
            {route.totalDistance?.toFixed(1) || 0} mi
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverTrackingPage;
