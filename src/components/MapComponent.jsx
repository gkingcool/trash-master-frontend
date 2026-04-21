// src/components/MapComponent.jsx
import React from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const MapComponent = ({ 
  bins = [], 
  center = [47.6101, -122.2015], // Bellevue, WA
  zoom = 13,
  height = "350px",
  showLegend = true 
}) => {
  const getMarkerColor = (fillLevel, flagged) => {
    if (flagged) return "#e53e3e";
    if (fillLevel >= 90) return "#e53e3e";
    if (fillLevel >= 70) return "#dd6b20";
    if (fillLevel >= 40) return "#38a169";
    return "#718096";
  };

  return (
    <div style={{ position: "relative", height: height, borderRadius: "8px", overflow: "hidden" }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        
        {bins.map((bin) => (
          <CircleMarker
            key={bin.id || bin.binId}
            center={[bin.latitude, bin.longitude]}
            radius={bin.fillLevel >= 90 ? 12 : bin.fillLevel >= 70 ? 10 : 8}
            fillColor={getMarkerColor(bin.fillLevel, bin.flagged)}
            color="#fff"
            weight={2}
            opacity={1}
            fillOpacity={0.8}
          >
            <Popup>
              <strong>{bin.binId}</strong><br />
              Location: {bin.locationName}<br />
              Fill Level: {bin.fillLevel}%<br />
              Status: {bin.flagged ? "🚩 Flagged" : bin.fillLevel >= 90 ? "🔴 Critical" : bin.fillLevel >= 70 ? "🟡 Full" : "🟢 Normal"}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {showLegend && (
        <div style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          background: "rgba(255,255,255,0.9)",
          borderRadius: "4px",
          padding: "8px",
          zIndex: 1000,
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#38a169" }}></div>
            <span style={{ fontSize: "12px", color: "#4a5568" }}>Normal (&lt;70%)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#dd6b20" }}></div>
            <span style={{ fontSize: "12px", color: "#4a5568" }}>Full (70-89%)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#e53e3e" }}></div>
            <span style={{ fontSize: "12px", color: "#4a5568" }}>Critical (90%+)</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;