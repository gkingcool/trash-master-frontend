// src/components/BinsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/bins";
const SENSOR_API_URL = "http://localhost:8080/api/sensors/getAll";

const BinsPage = () => {
  const [bins, setBins] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [selectedBin, setSelectedBin] = useState(null);
  const [showSensorQueryModal, setShowSensorQueryModal] = useState(false);
  const [sensorQueryBin, setSensorQueryBin] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [sensorQueryLoading, setSensorQueryLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [formData, setFormData] = useState({
    binId: "",
    locationName: "",
    latitude: "47.6101",
    longitude: "-122.2015",
    depthCm: "100",
    fillLevel: "0",
    sensorId: "",
    capacityYards: "6",
  });

  const getBinCoordinates = (bin) => {
    if (bin.latitude != null && bin.longitude != null)
      return [bin.latitude, bin.longitude];
    if (bin.location && bin.location.lat != null && bin.location.lon != null)
      return [bin.location.lat, bin.location.lon];
    return null;
  };

  const fetchBins = useCallback(async () => {
    try {
      let url = API_BASE_URL;
      if (activeFilter === "flagged") url = `${API_BASE_URL}/flagged`;
      else if (activeFilter === "critical")
        url = `${API_BASE_URL}/full?threshold=90`;
      else if (activeFilter === "full")
        url = `${API_BASE_URL}/full?threshold=70`;
      else if (activeFilter === "overdue") url = `${API_BASE_URL}/overdue`;
      else if (activeFilter === "commercial")
        url = `${API_BASE_URL}/zone/COMMERCIAL`;
      else if (activeFilter === "public") url = `${API_BASE_URL}/zone/PUBLIC`;

      const response = await axios.get(url);
      setBins(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching bins:", err);
      setError(
        "Failed to load bins. Make sure backend is running on port 8080.",
      );
      setLoading(false);
    }
  }, [activeFilter]);

  const fetchSensors = useCallback(async () => {
    try {
      const res = await axios.get(SENSOR_API_URL);
      setSensors(res.data);
    } catch (err) {
      console.warn("Failed to fetch sensors for battery sync:", err);
    }
  }, []);

  useEffect(() => {
    fetchBins();
    fetchSensors();
    const interval = setInterval(fetchBins, 15000);
    const handleSensorAssigned = () => {
      fetchBins();
      fetchSensors();
    };
    window.addEventListener("sensorAssigned", handleSensorAssigned);
    return () => {
      clearInterval(interval);
      window.removeEventListener("sensorAssigned", handleSensorAssigned);
    };
  }, [fetchBins, fetchSensors]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const searchAddressSuggestions = async (query) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    try {
      const response = await axios.get(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`,
      );
      const suggestions = response.data.features.map((feature) => ({
        displayName: feature.properties.name,
        lat: feature.geometry.coordinates[1],
        lon: feature.geometry.coordinates[0],
        fullAddress: feature.properties.label || feature.properties.name,
      }));
      setAddressSuggestions(suggestions);
    } catch (err) {
      console.error("Search error:", err);
      setAddressSuggestions([]);
    }
  };

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setAddressInput(value);
    setFormData((prev) => ({ ...prev, locationName: value }));
    if (value.length >= 3) {
      searchAddressSuggestions(value);
      setShowSuggestions(true);
    } else {
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleAddressSelect = (suggestion) => {
    setFormData({
      ...formData,
      locationName: suggestion.displayName,
      latitude: suggestion.lat.toString(),
      longitude: suggestion.lon.toString(),
    });
    setAddressInput(suggestion.fullAddress);
    setAddressSuggestions([]);
    setShowSuggestions(false);
  };

  const handleAddBin = async (e) => {
    e.preventDefault();
    if (!formData.latitude || !formData.longitude) {
      alert("Please select a valid address from the suggestions");
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/createBin`, {
        binId: formData.binId,
        locationName: formData.locationName,
        location: {
          lat: parseFloat(formData.latitude),
          lon: parseFloat(formData.longitude),
        },
        depthCm: parseInt(formData.depthCm),
        fillLevel: parseFloat(formData.fillLevel) || 0,
        sensorId: formData.sensorId || null,
        capacityYards: formData.capacityYards
          ? parseInt(formData.capacityYards)
          : 6,
      });
      setShowAddModal(false);
      setFormData({
        binId: "",
        locationName: "",
        latitude: "47.6101",
        longitude: "-122.2015",
        depthCm: "100",
        fillLevel: "0",
        sensorId: "",
        capacityYards: "6",
      });
      setAddressInput("");
      setAddressSuggestions([]);
      fetchBins();
      alert("Bin added successfully!");
    } catch (err) {
      alert(
        "Failed to add bin: " + (err.response?.data?.message || err.message),
      );
    }
  };

  const handleUpdateBin = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE_URL}/${selectedBin.binId}`, {
        binId: formData.binId,
        locationName: formData.locationName,
        location: {
          lat: parseFloat(formData.latitude),
          lon: parseFloat(formData.longitude),
        },
        depthCm: parseInt(formData.depthCm),
        fillLevel: parseFloat(formData.fillLevel) || 0,
        sensorId: formData.sensorId || null,
        capacityYards: formData.capacityYards
          ? parseInt(formData.capacityYards)
          : 6,
        daysOverdue: 0,
      });
      setShowEditModal(false);
      setSelectedBin(null);
      fetchBins();
      alert("Bin updated successfully!");
    } catch (err) {
      alert(
        "Failed to update bin: " + (err.response?.data?.message || err.message),
      );
    }
  };

  const handleDeleteBin = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/${showDeleteConfirm.binId}`);
      setShowDeleteConfirm(null);
      fetchBins();
      alert("Bin deleted successfully!");
    } catch (err) {
      alert("Failed to delete bin: " + err.message);
    }
  };

  const handleFlagBin = async (binId, issue) => {
    try {
      await axios.put(`${API_BASE_URL}/${binId}/flag`, {
        flagged: true,
        issue: issue || "Manual flag by admin",
      });
      try {
        await axios.post("http://localhost:8080/api/notifications", {
          title: "Bin Flagged Alert",
          message: `${binId} gets flagged. The bin has issues.`,
          type: "ALERT",
          driverId: "DRIVER_ALERT",
          isRead: false,
        });
      } catch (notifErr) {
        console.warn(
          "Bin flagged, but failed to send notification: ",
          notifErr,
        );
      }
      fetchBins();
    } catch (err) {
      alert("Failed to flag bin: " + err.message);
    }
  };

  const handleUnflagBin = async (binId) => {
    try {
      await axios.put(`${API_BASE_URL}/${binId}/flag`, {
        flagged: false,
        issue: null,
      });
      try {
        await axios.post("http://localhost:8080/api/notifications", {
          title: "Bin Unflagged",
          message: `${binId} gets unflagged. The bin issue has been resolved.`,
          type: "SUCCESS",
          driverId: "DRIVER_ALERT",
          isRead: false,
        });
      } catch (notifErr) {
        console.warn(
          "Bin unflagged, but failed to send notification: ",
          notifErr,
        );
      }
      fetchBins();
    } catch (err) {
      alert("Failed to unflag bin: " + err.message);
    }
  };

  const handleEditBin = (bin) => {
    setSelectedBin(bin);
    const coords = getBinCoordinates(bin);
    setFormData({
      binId: bin.binId,
      locationName: bin.locationName,
      latitude: coords ? coords[0].toString() : "47.6101",
      longitude: coords ? coords[1].toString() : "-122.2015",
      depthCm: bin.depthCm?.toString() || "100",
      fillLevel: bin.fillLevel?.toString() || "0",
      sensorId: bin.sensorId || "",
      capacityYards: bin.capacityYards?.toString() || "6",
    });
    setAddressInput(bin.locationName);
    setShowEditModal(true);
  };

  // ─── REAL SENSOR QUERY LOGIC ───────────────────────────────────────
  const openSensorQueryModal = (bin) => {
    setSensorQueryBin(bin);
    const sensor = sensors.find((s) => s.sensorId === bin.sensorId);
    const fill = bin.fillLevel || 0;
    const depth = bin.depthCm || 100;
    // Derive real distance from backend fill calculation: fill = ((depth - dist) / depth) * 100
    const realDistance = Math.max(0, depth * (1 - fill / 100));

    setSensorData({
      battery: sensor?.batteryLevel ?? null,
      status: sensor?.status ?? "UNKNOWN",
      lastUpdated: sensor?.lastUpdated ?? null,
      distance: realDistance.toFixed(1),
      fillLevel: fill.toFixed(1),
      isOnline: sensor?.status === "ACTIVE" || sensor?.status === "LOW_BATTERY",
    });
    setShowSensorQueryModal(true);
  };

  const handleRefreshSensorData = async () => {
    setSensorQueryLoading(true);
    try {
      await Promise.all([fetchBins(), fetchSensors()]);
      // Re-evaluate with fresh data
      const updatedBin =
        bins.find((b) => b.binId === sensorQueryBin.binId) || sensorQueryBin;
      const updatedSensor = sensors.find(
        (s) => s.sensorId === updatedBin.sensorId,
      );
      const fill = updatedBin.fillLevel || 0;
      const depth = updatedBin.depthCm || 100;
      const realDistance = Math.max(0, depth * (1 - fill / 100));

      setSensorQueryBin(updatedBin);
      setSensorData({
        battery: updatedSensor?.batteryLevel ?? null,
        status: updatedSensor?.status ?? "UNKNOWN",
        lastUpdated: updatedSensor?.lastUpdated ?? null,
        distance: realDistance.toFixed(1),
        fillLevel: fill.toFixed(1),
        isOnline:
          updatedSensor?.status === "ACTIVE" ||
          updatedSensor?.status === "LOW_BATTERY",
      });
    } catch (err) {
      console.error("Refresh failed:", err);
    }
    setSensorQueryLoading(false);
  };

  const getStatusColor = (fillLevel, flagged) => {
    if (flagged) return "#e53e3e";
    if (fillLevel >= 90) return "#e53e3e";
    if (fillLevel >= 70) return "#dd6b20";
    if (fillLevel >= 1) return "#38a169";
    return "#718096";
  };

  const filteredBins = bins.filter((bin) => {
    const matchesSearch =
      bin.binId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bin.locationName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading)
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div style={{ fontSize: "24px", marginBottom: "16px" }}>⏳</div>
        <p style={{ color: "#4a5568" }}>Loading bins...</p>
      </div>
    );
  if (error)
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#e53e3e" }}>
        <div style={{ fontSize: "24px", marginBottom: "16px" }}>⚠️</div>
        {error}
      </div>
    );

  return (
    <div className="bins-page">
      <style>{`.bins-page { font-family: 'Segoe UI', sans-serif; padding: 20px; background: #f8fafc; min-height: 100vh; } .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; } .page-header h1 { font-size: 24px; color: #1a202c; font-weight: 700; margin: 0; } .btn-primary { background: #38a169; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-weight: 600; cursor: pointer; } .btn-primary:hover { background: #2f855a; } .filters { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; } .search-input { padding: 8px 12px; border: 1px solid #cbd5e0; border-radius: 4px; width: 240px; } .filter-btn { padding: 6px 12px; border: 1px solid #cbd5e0; background: white; border-radius: 4px; cursor: pointer; } .filter-btn.active { background: #38a169; color: white; border-color: #38a169; } .bins-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; } .bin-card { background: white; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #38a169; } .bin-card.flagged { border-left-color: #e53e3e; } .bin-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px; } .bin-id { font-weight: 600; color: #1a202c; } .bin-location { color: #4a5568; font-size: 14px; margin-bottom: 8px; } .fill-bar { height: 8px; background: #edf2f7; border-radius: 4px; overflow: hidden; margin: 8px 0; } .fill-level { height: 100%; border-radius: 4px; transition: width 0.3s; } .bin-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0; font-size: 13px; } .bin-actions { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; } .btn-small { padding: 4px 12px; font-size: 12px; border-radius: 4px; border: none; cursor: pointer; } .btn-flag { background: #fed7d7; color: #e53e3e; } .btn-unflag { background: #c6f6d5; color: #38a169; } .btn-details { background: #bee3f8; color: #3182ce; } .btn-delete { background: #fed7d7; color: #e53e3e; } .modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; } .modal-content { background: white; padding: 24px; border-radius: 8px; width: 400px; max-width: 90vw; } .form-group { margin-bottom: 16px; } .form-group label { display: block; margin-bottom: 6px; font-weight: 500; color: #4a5568; } .form-group input { width: 100%; padding: 8px 12px; border: 1px solid #cbd5e0; border-radius: 4px; } .form-group input:focus { outline: none; border-color: #38a169; box-shadow: 0 0 0 2px rgba(56, 161, 105, 0.2); } .modal-buttons { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; } .btn-secondary { background: #e2e8f0; color: #4a5568; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; } .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; } .status-flagged { background: #fed7d7; color: #e53e3e; } .status-critical { background: #fed7d7; color: #e53e3e; } .status-full { background: #feebc8; color: #dd6b20; } .status-normal { background: #c6f6d5; color: #38a169; } .status-overdue { background: #fed7d7; color: #c53030; border: 1px solid #fc8181; } .delete-modal-icon { width: 64px; height: 64px; background: #fed7d7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; } .delete-modal-title { text-align: center; color: #1a202c; font-size: 20px; font-weight: 600; margin-bottom: 8px; } .delete-modal-message { text-align: center; color: #4a5568; font-size: 14px; line-height: 1.6; margin-bottom: 24px; } .delete-modal-buttons { display: flex; gap: 12px; justify-content: center; } .btn-delete-confirm { background: #e53e3e; color: white; border: none; padding: 10px 24px; border-radius: 6px; cursor: pointer; font-weight: 600; } .btn-cancel { background: #edf2f7; color: #4a5568; border: none; padding: 10px 24px; border-radius: 6px; cursor: pointer; font-weight: 600; } .no-bins { grid-column: 1 / -1; text-align: center; color: #718096; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; width: 100%; padding: 40px 20px; } .no-bins-icon { font-size: 80px; margin-bottom: 24px; opacity: 0.5; } .address-search-container { position: relative; } .address-suggestions { position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #cbd5e0; border-radius: 4px; max-height: 200px; overflow-y: auto; z-index: 1000; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-top: 4px; } .suggestion-item { padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #edf2f7; font-size: 14px; } .suggestion-item:hover { background: #f8fafc; } .suggestion-item:last-child { border-bottom: none; } .geocoding-indicator { display: inline-block; width: 12px; height: 12px; border: 2px solid #cbd5e0; border-top-color: #38a169; border-radius: 50%; animation: spin 1s linear infinite; margin-left: 8px; vertical-align: middle; } @keyframes spin { to { transform: rotate(360deg); } } .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; } .helper-text { font-size: 12px; color: #718096; margin-top: 4px; }`}</style>

      <div className="page-header">
        <h1>Bin Management</h1>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          + Add Bin
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          className="search-input"
          placeholder="Search by bin ID or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          className={`filter-btn ${activeFilter === "all" ? "active" : ""}`}
          onClick={() => setActiveFilter("all")}
        >
          All
        </button>
        <button
          className={`filter-btn ${activeFilter === "flagged" ? "active" : ""}`}
          onClick={() => setActiveFilter("flagged")}
        >
          Flagged
        </button>
        <button
          className={`filter-btn ${activeFilter === "critical" ? "active" : ""}`}
          onClick={() => setActiveFilter("critical")}
        >
          Critical (90%+)
        </button>
        <button
          className={`filter-btn ${activeFilter === "full" ? "active" : ""}`}
          onClick={() => setActiveFilter("full")}
        >
          Full (70%+)
        </button>
        <button
          className={`filter-btn ${activeFilter === "overdue" ? "active" : ""}`}
          onClick={() => setActiveFilter("overdue")}
        >
          Overdue
        </button>
        <button
          className={`filter-btn ${activeFilter === "commercial" ? "active" : ""}`}
          onClick={() => setActiveFilter("commercial")}
        >
          Commercial
        </button>
        <button
          className={`filter-btn ${activeFilter === "public" ? "active" : ""}`}
          onClick={() => setActiveFilter("public")}
        >
          Public
        </button>
      </div>

      <div className="bins-grid">
        {filteredBins.length === 0 ? (
          <div className="no-bins">
            <div className="no-bins-icon">🗑️</div>
            <h3
              style={{
                fontSize: "20px",
                marginBottom: "8px",
                color: "#2d3748",
                fontWeight: "600",
              }}
            >
              No Bins Found
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#718096",
                marginBottom: "24px",
              }}
            >
              {searchTerm || activeFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first bin"}
            </p>
            {!searchTerm && activeFilter === "all" && (
              <button
                className="btn-primary"
                onClick={() => setShowAddModal(true)}
                style={{ padding: "12px 24px" }}
              >
                + Add Your First Bin
              </button>
            )}
          </div>
        ) : (
          filteredBins.map((bin) => (
            <div
              key={bin.id || bin.binId}
              className={`bin-card ${bin.flagged ? "flagged" : ""}`}
            >
              <div className="bin-header">
                <div>
                  <div className="bin-id">{bin.binId}</div>
                  <div className="bin-location">📍 {bin.locationName}</div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    alignItems: "flex-end",
                  }}
                >
                  {bin.flagged && (
                    <span className="status-badge status-flagged">
                      ⚠ Flagged
                    </span>
                  )}
                  {!bin.flagged && bin.fillLevel >= 90 && (
                    <span className="status-badge status-critical">
                      🔴 Critical
                    </span>
                  )}
                  {!bin.flagged &&
                    bin.fillLevel >= 70 &&
                    bin.fillLevel < 90 && (
                      <span className="status-badge status-full">🟡 Full</span>
                    )}
                  {bin.daysOverdue != null &&
                    parseInt(bin.daysOverdue) > 0 &&
                    bin.fillLevel > 0 && (
                      <span className="status-badge status-overdue">
                        ⏳ Overdue: {parseInt(bin.daysOverdue)} day
                        {parseInt(bin.daysOverdue) !== 1 ? "s" : ""}
                      </span>
                    )}
                </div>
              </div>
              <div className="fill-bar">
                <div
                  className="fill-level"
                  style={{
                    width: `${bin.fillLevel || 0}%`,
                    backgroundColor: getStatusColor(bin.fillLevel, bin.flagged),
                  }}
                ></div>
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#718096",
                  textAlign: "right",
                }}
              >
                {bin.fillLevel || 0}% full
              </div>
              <div className="bin-stats">
                <div>📏 Depth: {bin.depthCm}cm</div>
                <div>🔋 Sensor: {bin.sensorId || "N/A"}</div>
                <div>
                  🕐 Last:{" "}
                  {bin.lastUpdated
                    ? new Date(bin.lastUpdated).toLocaleTimeString()
                    : "N/A"}
                </div>
                <div>
                  📍{" "}
                  {(() => {
                    const coords = getBinCoordinates(bin);
                    return coords
                      ? `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`
                      : "N/A";
                  })()}
                </div>
                <div>📦 Cap: {bin.capacityYards || "N/A"} yds</div>
              </div>
              <div className="bin-actions">
                <button
                  className="btn-small btn-details"
                  onClick={() => handleEditBin(bin)}
                >
                  ✏️ Edit
                </button>
                {!bin.flagged ? (
                  <button
                    className="btn-small btn-flag"
                    onClick={() => handleFlagBin(bin.binId)}
                  >
                    Flag Issue
                  </button>
                ) : (
                  <button
                    className="btn-small btn-unflag"
                    onClick={() => handleUnflagBin(bin.binId)}
                  >
                    Unflag
                  </button>
                )}
                <button
                  className="btn-small"
                  onClick={() => openSensorQueryModal(bin)}
                  style={{
                    background: "#ebf8ff",
                    color: "#2b6cb0",
                    border: "1px solid #bee3f8",
                  }}
                >
                  📡 Query Sensor
                </button>
                <button
                  className="btn-small btn-delete"
                  onClick={() => setShowDeleteConfirm(bin)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Add/Edit/Delete Modals (Unchanged) ── */}
      {showAddModal && (
        <div className="modal" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Bin</h2>
            <form onSubmit={handleAddBin}>
              <div className="form-group">
                <label>Bin ID *</label>
                <input
                  name="binId"
                  value={formData.binId}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., BEL-BIN-023"
                />
              </div>
              <div className="form-group">
                <label>
                  Address / Location *
                  {isGeocoding && <span className="geocoding-indicator"></span>}
                </label>
                <div className="address-search-container">
                  <input
                    type="text"
                    value={addressInput}
                    onChange={handleAddressChange}
                    required
                    placeholder="Type an address (e.g., 123 Main St, Bellevue, WA)"
                  />
                  {showSuggestions && addressSuggestions.length > 0 && (
                    <div className="address-suggestions">
                      {addressSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="suggestion-item"
                          onClick={() => handleAddressSelect(suggestion)}
                        >
                          {suggestion.fullAddress}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="helper-text">
                  Start typing an address and select from suggestions
                </p>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Latitude</label>
                  <input
                    name="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    placeholder="47.6101"
                  />
                </div>
                <div className="form-group">
                  <label>Longitude</label>
                  <input
                    name="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    placeholder="-122.2015"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Depth (cm)</label>
                  <input
                    name="depthCm"
                    type="number"
                    value={formData.depthCm}
                    onChange={handleInputChange}
                    placeholder="100"
                  />
                </div>
                <div className="form-group">
                  <label>Current Fill (%)</label>
                  <input
                    name="fillLevel"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.fillLevel}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Capacity (Yards) *</label>
                <input
                  name="capacityYards"
                  type="number"
                  min="2"
                  max="8"
                  value={formData.capacityYards}
                  onChange={handleInputChange}
                  placeholder="6"
                  required
                />
                <p className="helper-text">Must be between 2 and 8 yards.</p>
              </div>
              <div className="form-group">
                <label>Sensor ID</label>
                <input
                  name="sensorId"
                  value={formData.sensorId}
                  onChange={handleInputChange}
                  placeholder="e.g., SENSOR-X99"
                />
              </div>
              <div className="modal-buttons">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Bin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Bin: {selectedBin?.binId}</h2>
            <form onSubmit={handleUpdateBin}>
              <div className="form-group">
                <label>Bin ID *</label>
                <input
                  name="binId"
                  value={formData.binId}
                  onChange={handleInputChange}
                  required
                  disabled
                />
              </div>
              <div className="form-group">
                <label>Address / Location *</label>
                <div className="address-search-container">
                  <input
                    type="text"
                    value={addressInput}
                    onChange={handleAddressChange}
                    required
                    placeholder="Type an address"
                  />
                  {showSuggestions && addressSuggestions.length > 0 && (
                    <div className="address-suggestions">
                      {addressSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="suggestion-item"
                          onClick={() => handleAddressSelect(suggestion)}
                        >
                          {suggestion.fullAddress}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Latitude</label>
                  <input
                    name="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Longitude</label>
                  <input
                    name="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Depth (cm)</label>
                  <input
                    name="depthCm"
                    type="number"
                    value={formData.depthCm}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Current Fill (%)</label>
                  <input
                    name="fillLevel"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.fillLevel}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Capacity (Yards) *</label>
                <input
                  name="capacityYards"
                  type="number"
                  min="2"
                  max="8"
                  value={formData.capacityYards}
                  onChange={handleInputChange}
                  required
                />
                <p className="helper-text">Must be between 2 and 8 yards.</p>
              </div>
              <div className="form-group">
                <label>Sensor ID</label>
                <input
                  name="sensorId"
                  value={formData.sensorId}
                  onChange={handleInputChange}
                />
              </div>
              <div className="modal-buttons">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Bin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon">❗</div>
            <h3 className="delete-modal-title">Delete Bin?</h3>
            <p className="delete-modal-message">
              Are you sure you want to delete bin{" "}
              <strong>{showDeleteConfirm.binId}</strong>? <br />
              This action cannot be undone.
            </p>
            <div className="delete-modal-buttons">
              <button
                className="btn-cancel"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button className="btn-delete-confirm" onClick={handleDeleteBin}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REAL SENSOR TELEMETRY MODAL ── */}
      {showSensorQueryModal && sensorQueryBin && (
        <div className="modal" onClick={() => setShowSensorQueryModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "460px" }}
          >
            <div style={{ marginBottom: "20px" }}>
              <h2 style={{ margin: "0 0 4px" }}>📡 Live Sensor Telemetry</h2>
              <p style={{ margin: 0, fontSize: "13px", color: "#718096" }}>
                {sensorQueryBin.binId} — {sensorQueryBin.locationName}
              </p>
            </div>

            {/* Telemetry Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  background: "#f7fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "14px",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    color: "#718096",
                    fontWeight: "600",
                    textTransform: "uppercase",
                  }}
                >
                  Battery Level
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: sensorData?.battery < 20 ? "#e53e3e" : "#38a169",
                    marginTop: "4px",
                  }}
                >
                  {sensorData?.battery != null ? `${sensorData.battery}%` : "—"}
                </div>
                <div
                  style={{
                    height: "6px",
                    background: "#e2e8f0",
                    borderRadius: "3px",
                    marginTop: "8px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${sensorData?.battery || 0}%`,
                      background:
                        sensorData?.battery < 20 ? "#e53e3e" : "#38a169",
                      transition: "width 0.3s",
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  background: "#f7fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "14px",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    color: "#718096",
                    fontWeight: "600",
                    textTransform: "uppercase",
                  }}
                >
                  Status
                </div>
                <div style={{ marginTop: "6px" }}>
                  <span
                    style={{
                      background: sensorData?.isOnline ? "#c6f6d5" : "#fed7d7",
                      color: sensorData?.isOnline ? "#276749" : "#c53030",
                      padding: "4px 10px",
                      borderRadius: "99px",
                      fontSize: "12px",
                      fontWeight: "700",
                    }}
                  >
                    {sensorData?.status || "UNKNOWN"}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#718096",
                    marginTop: "8px",
                  }}
                >
                  Last Sync:{" "}
                  {sensorData?.lastUpdated
                    ? new Date(sensorData.lastUpdated).toLocaleTimeString()
                    : "—"}
                </div>
              </div>
            </div>

            {/* Distance & Fill */}
            <div
              style={{
                background: "#f7fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "#718096",
                    fontWeight: "600",
                  }}
                >
                  CURRENT DISTANCE
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#2d3748",
                  }}
                >
                  {sensorData?.distance} cm
                </div>
              </div>
              <div
                style={{
                  height: "10px",
                  background: "#e2e8f0",
                  borderRadius: "5px",
                  overflow: "hidden",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    width: `${sensorData?.fillLevel || 0}%`,
                    height: "100%",
                    background:
                      (sensorData?.fillLevel || 0) >= 90
                        ? "#e53e3e"
                        : (sensorData?.fillLevel || 0) >= 70
                          ? "#dd6b20"
                          : "#38a169",
                    borderRadius: "5px",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#718096",
                  textAlign: "right",
                }}
              >
                {sensorData?.fillLevel}% full
              </div>
            </div>

            {/* No Sensor Warning */}
            {(!sensorQueryBin.sensorId ||
              sensorQueryBin.sensorId === "N/A") && (
              <div
                style={{
                  background: "#fffbeb",
                  border: "1px solid #fbd38d",
                  borderRadius: "6px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  color: "#b7791f",
                  marginBottom: "16px",
                }}
              >
                ⚠ This bin has no sensor assigned. Assign one in the Sensors
                page first.
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="btn-secondary"
                onClick={() => setShowSensorQueryModal(false)}
                style={{ flex: 1, padding: "10px" }}
              >
                Close
              </button>
              <button
                className="btn-primary"
                onClick={handleRefreshSensorData}
                disabled={sensorQueryLoading}
                style={{
                  flex: 2,
                  padding: "10px",
                  opacity: sensorQueryLoading ? 0.7 : 1,
                }}
              >
                {sensorQueryLoading ? "Syncing..." : "🔄 Refresh Live Data"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BinsPage;
