// src/components/BinsPage.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/bins";

const BinsPage = () => {
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [selectedBin, setSelectedBin] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Address autocomplete states
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
  });

  // Fetch bins from backend
  useEffect(() => {
    fetchBins();
    const interval = setInterval(fetchBins, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchBins = async () => {
    try {
      const response = await axios.get(API_BASE_URL);
      setBins(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching bins:", err);
      setError(
        "Failed to load bins. Make sure backend is running on port 8080.",
      );
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Search for address suggestions using Photon API (CORS-friendly)
  const searchAddressSuggestions = async (query) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    try {
      // Photon API - CORS enabled, free, no API key required
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

  // ✅ Handle address input change
  const handleAddressChange = (e) => {
    const value = e.target.value;
    setAddressInput(value);

    // Update locationName as user types
    setFormData((prev) => ({ ...prev, locationName: value }));

    // Search for suggestions
    if (value.length >= 3) {
      searchAddressSuggestions(value);
      setShowSuggestions(true);
    } else {
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // ✅ Handle address suggestion click
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

  // ✅ CREATE BIN
  const handleAddBin = async (e) => {
    e.preventDefault();

    // Validate that we have coordinates
    if (!formData.latitude || !formData.longitude) {
      alert("Please select a valid address from the suggestions");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/createBin`, {
        binId: formData.binId,
        locationName: formData.locationName,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        depthCm: parseInt(formData.depthCm),
        fillLevel: parseFloat(formData.fillLevel) || 0,
        sensorId: formData.sensorId || null,
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

  // ✅ UPDATE BIN
  const handleUpdateBin = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE_URL}/${selectedBin.binId}`, {
        binId: formData.binId,
        locationName: formData.locationName,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        depthCm: parseInt(formData.depthCm),
        fillLevel: parseFloat(formData.fillLevel) || 0,
        sensorId: formData.sensorId || null,
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

  // ✅ DELETE BIN
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

  // ✅ FLAG BIN
  const handleFlagBin = async (binId, issue) => {
    try {
      await axios.put(`${API_BASE_URL}/${binId}/flag`, {
        flagged: true,
        issue: issue || "Manual flag by admin",
      });
      fetchBins();
    } catch (err) {
      alert("Failed to flag bin: " + err.message);
    }
  };

  // ✅ UNFLAG BIN
  const handleUnflagBin = async (binId) => {
    try {
      await axios.put(`${API_BASE_URL}/${binId}/flag`, {
        flagged: false,
        issue: null,
      });
      fetchBins();
    } catch (err) {
      alert("Failed to unflag bin: " + err.message);
    }
  };

  // ✅ OPEN EDIT MODAL
  const handleEditBin = (bin) => {
    setSelectedBin(bin);
    setFormData({
      binId: bin.binId,
      locationName: bin.locationName,
      latitude: bin.latitude?.toString() || "47.6101",
      longitude: bin.longitude?.toString() || "-122.2015",
      depthCm: bin.depthCm?.toString() || "100",
      fillLevel: bin.fillLevel?.toString() || "0",
      sensorId: bin.sensorId || "",
    });
    setAddressInput(bin.locationName);
    setShowEditModal(true);
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

    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "flagged") return matchesSearch && bin.flagged;
    if (filterStatus === "critical")
      return matchesSearch && bin.fillLevel >= 90;
    if (filterStatus === "full")
      return matchesSearch && bin.fillLevel >= 70 && bin.fillLevel < 90;
    return matchesSearch;
  });

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        Loading bins...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#e53e3e" }}>
        {error}
      </div>
    );
  }

  return (
    <div className="bins-page">
      <style>{`
        .bins-page { font-family: 'Segoe UI', sans-serif; padding: 20px; background: #f8fafc; min-height: 100vh; }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .page-header h1 { font-size: 24px; color: #1a202c; font-weight: 700; margin: 0; }
        .btn-primary { background: #38a169; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-weight: 600; cursor: pointer; }
        .btn-primary:hover { background: #2f855a; }
        .filters { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; }
        .search-input { padding: 8px 12px; border: 1px solid #cbd5e0; border-radius: 4px; width: 240px; }
        .filter-btn { padding: 6px 12px; border: 1px solid #cbd5e0; background: white; border-radius: 4px; cursor: pointer; }
        .filter-btn.active { background: #38a169; color: white; }
        .bins-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
        .bin-card { background: white; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #38a169; }
        .bin-card.flagged { border-left-color: #e53e3e; }
        .bin-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px; }
        .bin-id { font-weight: 600; color: #1a202c; }
        .bin-location { color: #4a5568; font-size: 14px; margin-bottom: 8px; }
        .fill-bar { height: 8px; background: #edf2f7; border-radius: 4px; overflow: hidden; margin: 8px 0; }
        .fill-level { height: 100%; border-radius: 4px; transition: width 0.3s; }
        .bin-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0; font-size: 13px; }
        .bin-actions { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
        .btn-small { padding: 4px 12px; font-size: 12px; border-radius: 4px; border: none; cursor: pointer; }
        .btn-flag { background: #fed7d7; color: #e53e3e; }
        .btn-unflag { background: #c6f6d5; color: #38a169; }
        .btn-details { background: #bee3f8; color: #3182ce; }
        .btn-delete { background: #fed7d7; color: #e53e3e; }
        .modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; padding: 24px; border-radius: 8px; width: 400px; max-width: 90vw; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; margin-bottom: 6px; font-weight: 500; color: #4a5568; }
        .form-group input { width: 100%; padding: 8px 12px; border: 1px solid #cbd5e0; border-radius: 4px; }
        .form-group input:focus { outline: none; border-color: #38a169; box-shadow: 0 0 0 2px rgba(56, 161, 105, 0.2); }
        .modal-buttons { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
        .btn-secondary { background: #e2e8f0; color: #4a5568; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
        .status-flagged { background: #fed7d7; color: #e53e3e; }
        .status-critical { background: #fed7d7; color: #e53e3e; }
        .status-full { background: #feebc8; color: #dd6b20; }
        .status-normal { background: #c6f6d5; color: #38a169; }
        .delete-modal-icon { width: 64px; height: 64px; background: #fed7d7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; }
        .delete-modal-title { text-align: center; color: #1a202c; font-size: 20px; font-weight: 600; margin-bottom: 8px; }
        .delete-modal-message { text-align: center; color: #4a5568; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
        .delete-modal-buttons { display: flex; gap: 12px; justify-content: center; }
        .btn-delete-confirm { background: #e53e3e; color: white; border: none; padding: 10px 24px; border-radius: 6px; cursor: pointer; font-weight: 600; }
        .btn-cancel { background: #edf2f7; color: #4a5568; border: none; padding: 10px 24px; border-radius: 6px; cursor: pointer; font-weight: 600; }
        
        .no-bins {
          grid-column: 1 / -1;
          text-align: center;
          color: #718096;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;  /* Centers vertically */
          width: 100%;
          padding: 40px 20px;
        }
        
        .no-bins-icon {
          font-size: 80px;
          margin-bottom: 24px;
          opacity: 0.5;
        }

        /* ✅ Address Autocomplete Styles */
        .address-search-container { position: relative; }
        .address-suggestions { 
          position: absolute; 
          top: 100%; 
          left: 0; 
          right: 0; 
          background: white; 
          border: 1px solid #cbd5e0; 
          border-radius: 4px; 
          max-height: 200px; 
          overflow-y: auto; 
          z-index: 1000; 
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          margin-top: 4px;
        }
        .suggestion-item { 
          padding: 8px 12px; 
          cursor: pointer; 
          border-bottom: 1px solid #edf2f7;
          font-size: 14px;
        }
        .suggestion-item:hover { background: #f8fafc; }
        .suggestion-item:last-child { border-bottom: none; }
        .geocoding-indicator { 
          display: inline-block; 
          width: 12px; 
          height: 12px; 
          border: 2px solid #cbd5e0; 
          border-top-color: #38a169; 
          border-radius: 50%; 
          animation: spin 1s linear infinite; 
          margin-left: 8px;
          vertical-align: middle;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .helper-text { font-size: 12px; color: #718096; margin-top: 4px; }
      `}</style>

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
          className={`filter-btn ${filterStatus === "all" ? "active" : ""}`}
          onClick={() => setFilterStatus("all")}
        >
          All
        </button>
        <button
          className={`filter-btn ${filterStatus === "flagged" ? "active" : ""}`}
          onClick={() => setFilterStatus("flagged")}
        >
          Flagged
        </button>
        <button
          className={`filter-btn ${filterStatus === "critical" ? "active" : ""}`}
          onClick={() => setFilterStatus("critical")}
        >
          Critical (90%+)
        </button>
        <button
          className={`filter-btn ${filterStatus === "full" ? "active" : ""}`}
          onClick={() => setFilterStatus("full")}
        >
          Full (70%+)
        </button>
      </div>

      <div className="bins-grid">
        {/* {filteredBins.length === 0 ? (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "40px",
              color: "#718096",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🗑️</div>
            <h3
              style={{
                fontSize: "18px",
                marginBottom: "8px",
                color: "#2d3748",
              }}
            >
              No Bins Found
            </h3>
            <p style={{ fontSize: "14px", marginBottom: "16px" }}>
              {searchTerm || filterStatus !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first bin"}
            </p>
            {!searchTerm && filterStatus === "all" && (
              <button
                className="btn-primary" */}
        {/* onClick={() => setShowAddModal(true)}
              >
                + Add Your First Bin
              </button>
            )}
          </div> */}
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
              {searchTerm || filterStatus !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first bin"}
            </p>
            {!searchTerm && filterStatus === "all" && (
              <button
                className="btn-primary"
                onClick={() => setShowAddModal(true)}
                style={{
                  padding: "12px 24px",
                }}
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
                {bin.flagged && (
                  <span className="status-badge status-flagged">⚠ Flagged</span>
                )}
                {!bin.flagged && bin.fillLevel >= 90 && (
                  <span className="status-badge status-critical">
                    🔴 Critical
                  </span>
                )}
                {!bin.flagged && bin.fillLevel >= 70 && bin.fillLevel < 90 && (
                  <span className="status-badge status-full">🟡 Full</span>
                )}
              </div>

              <div className="fill-bar">
                <div
                  className="fill-level"
                  style={{
                    width: `${bin.fillLevel || 0}%`,
                    backgroundColor: getStatusColor(bin.fillLevel, bin.flagged),
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
                  📍 {bin.latitude?.toFixed(4)}, {bin.longitude?.toFixed(4)}
                </div>
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

      {/* Add Bin Modal */}
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
                  placeholder="e.g., BIN-001"
                />
              </div>

              {/* Address Search Field with Autocomplete */}
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

              <div
                className="form-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
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

              <div
                className="form-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
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
                <label>Sensor ID</label>
                <input
                  name="sensorId"
                  value={formData.sensorId}
                  onChange={handleInputChange}
                  placeholder="e.g., SNS-789"
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

      {/* Edit Bin Modal */}
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

              {/* Address Search Field for Edit */}
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

              <div
                className="form-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
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

              <div
                className="form-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon">❗</div>
            <h3 className="delete-modal-title">Delete Bin?</h3>
            <p className="delete-modal-message">
              Are you sure you want to delete bin{" "}
              <strong>{showDeleteConfirm.binId}</strong>?<br />
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
    </div>
  );
};

export default BinsPage;
