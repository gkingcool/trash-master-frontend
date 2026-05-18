import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/sensors";

const SensorPage = () => {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState(null);

  // Form States
  const [formData, setFormData] = useState({
    sensorId: "",
    batteryLevel: 100,
    binId: "",
    status: "ACTIVE",
  });
  const [assignBinId, setAssignBinId] = useState("");
  const [flagReason, setFlagReason] = useState("");

  useEffect(() => {
    fetchSensors();
    const interval = setInterval(fetchSensors, 10000); // Poll for updates
    return () => clearInterval(interval);
  }, []);

  const fetchSensors = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/getAll`);
      setSensors(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching sensors:", err);
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/registerSensor`, formData);
      setShowRegisterModal(false);
      setFormData({
        sensorId: "",
        batteryLevel: 100,
        binId: "",
        status: "ACTIVE",
      });
      fetchSensors();
      alert("Sensor registered successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to register sensor");
    }
  };

  const handleAssign = async () => {
    if (!selectedSensor || !assignBinId) return;
    try {
      await axios.put(
        `${API_BASE_URL}/${selectedSensor.sensorId}/assign/${assignBinId}`,
      );
      setShowAssignModal(false);
      fetchSensors();
      alert("Sensor assigned to bin successfully!");
      window.dispatchEvent(new CustomEvent("sensorAssigned"));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign sensor");
    }
  };

  const handleFlag = async () => {
    if (!selectedSensor) return;
    try {
      const isFlagged = !selectedSensor.isFlagged;
      await axios.put(`${API_BASE_URL}/${selectedSensor.sensorId}/flag`, {
        flagged: isFlagged,
        reason: isFlagged ? flagReason : null,
      });
      setShowFlagModal(false);
      fetchSensors();
      alert(isFlagged ? "Sensor flagged!" : "Sensor unflagged!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to flag sensor");
    }
  };

  const openAssignModal = (sensor) => {
    setSelectedSensor(sensor);
    setAssignBinId(sensor.binId || "");
    setShowAssignModal(true);
  };

  const openFlagModal = (sensor) => {
    setSelectedSensor(sensor);
    setFlagReason(sensor.flagReason || "");
    setShowFlagModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ACTIVE":
        return "#38a169";
      case "LOW_BATTERY":
        return "#dd6b20";
      case "MALFUNCTION":
        return "#e53e3e";
      default:
        return "#718096";
    }
  };

  if (loading)
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        Loading Sensors...
      </div>
    );

  return (
    <div
      style={{
        padding: "20px",
        background: "#f8fafc",
        minHeight: "100vh",
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h1 style={{ color: "#1a202c", fontSize: "24px", fontWeight: "700" }}>
          IoT Sensor Management
        </h1>
        <button
          onClick={() => setShowRegisterModal(true)}
          style={{
            background: "#38a169",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "6px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          + Register Sensor
        </button>
      </div>

      <div
        style={{
          background: "white",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#edf2f7", textAlign: "left" }}>
              <th style={{ padding: "12px 16px" }}>Sensor ID</th>
              <th style={{ padding: "12px 16px" }}>Assigned Bin</th>
              <th style={{ padding: "12px 16px" }}>Battery</th>
              <th style={{ padding: "12px 16px" }}>Status</th>
              <th style={{ padding: "12px 16px" }}>Flagged</th>
              <th style={{ padding: "12px 16px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sensors.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  style={{
                    padding: "24px",
                    textAlign: "center",
                    color: "#718096",
                  }}
                >
                  No sensors found. Register one to get started.
                </td>
              </tr>
            ) : (
              sensors.map((s) => (
                <tr key={s.id} style={{ borderTop: "1px solid #edf2f7" }}>
                  <td style={{ padding: "12px 16px", fontWeight: "600" }}>
                    {s.sensorId}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {s.binId || "—"}{" "}
                    <button
                      onClick={() => openAssignModal(s)}
                      style={{
                        fontSize: "12px",
                        background: "none",
                        border: "none",
                        color: "#3182ce",
                        cursor: "pointer",
                      }}
                    >
                      (Edit)
                    </button>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div
                      style={{
                        background: "#edf2f7",
                        borderRadius: "4px",
                        height: "6px",
                        width: "60px",
                        display: "inline-block",
                        marginRight: "8px",
                      }}
                    >
                      <div
                        style={{
                          background:
                            s.batteryLevel < 20 ? "#e53e3e" : "#38a169",
                          width: `${s.batteryLevel}%`,
                          height: "100%",
                          borderRadius: "4px",
                        }}
                      ></div>
                    </div>
                    {s.batteryLevel}%
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        color: getStatusColor(s.status),
                        fontWeight: "600",
                        textTransform: "capitalize",
                      }}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {s.isFlagged ? "⚠️ " + s.flagReason : "✅ No"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      onClick={() => openFlagModal(s)}
                      style={{
                        fontSize: "12px",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        border: "none",
                        background: s.isFlagged ? "#fed7d7" : "#fee2e2",
                        color: s.isFlagged ? "#c53030" : "#e53e3e",
                        cursor: "pointer",
                      }}
                    >
                      {s.isFlagged ? "Unflag" : "Flag"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Register Modal */}
      {showRegisterModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "8px",
              width: "400px",
            }}
          >
            <h3>Register New Sensor</h3>
            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: "12px" }}>
                <label>Sensor ID *</label>
                <input
                  required
                  value={formData.sensorId}
                  onChange={(e) =>
                    setFormData({ ...formData, sensorId: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #cbd5e0",
                    borderRadius: "4px",
                  }}
                />
              </div>
              <div style={{ marginBottom: "12px" }}>
                <label>Initial Battery (%)</label>
                <input
                  type="number"
                  value={formData.batteryLevel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      batteryLevel: parseInt(e.target.value),
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #cbd5e0",
                    borderRadius: "4px",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  style={{
                    flex: 1,
                    padding: "8px",
                    border: "1px solid #cbd5e0",
                    borderRadius: "4px",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "8px",
                    background: "#38a169",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                  }}
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "8px",
              width: "400px",
            }}
          >
            <h3>Assign to Bin</h3>
            <p style={{ marginBottom: "12px", color: "#718096" }}>
              Assigning {selectedSensor?.sensorId} to Bin ID:
            </p>
            <input
              value={assignBinId}
              onChange={(e) => setAssignBinId(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #cbd5e0",
                borderRadius: "4px",
                marginBottom: "16px",
              }}
              placeholder="e.g., BEL-BIN-023"
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setShowAssignModal(false)}
                style={{
                  flex: 1,
                  padding: "8px",
                  border: "1px solid #cbd5e0",
                  borderRadius: "4px",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                style={{
                  flex: 1,
                  padding: "8px",
                  background: "#3182ce",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                }}
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flag Modal */}
      {showFlagModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "8px",
              width: "400px",
            }}
          >
            <h3>{selectedSensor?.isFlagged ? "Unflag" : "Flag"} Sensor</h3>
            {!selectedSensor?.isFlagged && (
              <div style={{ marginBottom: "12px" }}>
                <label>Reason for Flagging</label>
                <textarea
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #cbd5e0",
                    borderRadius: "4px",
                    marginTop: "4px",
                  }}
                  placeholder="e.g., Sensor offline..."
                />
              </div>
            )}
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button
                onClick={() => setShowFlagModal(false)}
                style={{
                  flex: 1,
                  padding: "8px",
                  border: "1px solid #cbd5e0",
                  borderRadius: "4px",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleFlag}
                style={{
                  flex: 1,
                  padding: "8px",
                  background: "#e53e3e",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                }}
              >
                {selectedSensor?.isFlagged ? "Unflag" : "Flag"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SensorPage;
