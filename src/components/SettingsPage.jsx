// src/components/SettingsPage.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { getSystemSettings, setSystemSettings } from "../utils/settingsStore";

import settingsIcon from "../assets/icons/settings.png";
import alertIcon from "../assets/icons/alert-icon.png";
import routeIcon from "../assets/icons/routes-icon.png";
import deploymentsIcon from "../assets/icons/deployments.png";

const API = "http://localhost:8080";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [saved, setSaved] = useState(false);
  const [systemSettings, setSystemSettingsState] =
    useState(getSystemSettings());

  // Alert thresholds
  const [alertSettings, setAlertSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("alertSettings")) || {};
    } catch {
      return {};
    }
  });
  const alertState = {
    binFullThreshold: 80,
    urgentThreshold: 95,
    temperatureAlert: true,
    sensorOfflineAlert: true,
    routeDelayAlert: true,
    ...alertSettings,
  };

  // Route settings
  const [routeSettings, setRouteSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("routeSettings")) || {};
    } catch {
      return {};
    }
  });
  const routeState = {
    autoGenerateRoutes: true,
    optimizationStrategy: "predictive",
    ...routeSettings,
  };

  // System health (System tab)
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // Dev tools
  const [devLoading, setDevLoading] = useState({});
  const [devResult, setDevResult] = useState(null);

  useEffect(() => {
    if (activeTab === "system") fetchHealth();
  }, [activeTab]);

  const fetchHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await axios.get(`${API}/api/system/health`);
      setHealth(res.data);
    } catch {
      setHealth(null);
    }
    setHealthLoading(false);
  };

  const runDevTool = async (key, endpoint, label) => {
    if (!window.confirm(`Run "${label}"? This will modify the database.`))
      return;
    setDevLoading((prev) => ({ ...prev, [key]: true }));
    setDevResult(null);
    try {
      const res = await axios.post(`${API}${endpoint}`);
      setDevResult({ success: true, message: res.data });
    } catch (err) {
      setDevResult({
        success: false,
        message: err.response?.data || "Request failed.",
      });
    }
    setDevLoading((prev) => ({ ...prev, [key]: false }));
  };

  const handleSave = () => {
    setSystemSettings(systemSettings);
    localStorage.setItem("alertSettings", JSON.stringify(alertState));
    localStorage.setItem("routeSettings", JSON.stringify(routeState));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { id: "general", label: "General", icon: settingsIcon },
    { id: "alerts", label: "Alerts", icon: alertIcon },
    { id: "routes", label: "Routes", icon: routeIcon },
    { id: "system", label: "System Health", icon: deploymentsIcon },
    { id: "systemAdmin", label: "System Admin", icon: settingsIcon },
  ];

  const operationalTools = [
    {
      key: "predictions",
      label: "🤖 Refresh AI Predictions",
      endpoint: "/api/admin/predictions/force-update",
      desc: "Re-runs SageMaker predictions for all bins (4h, 8h, 12h). Run before generating routes.",
      color: "#3182ce",
    },
    {
      key: "boost",
      label: "📈 Boost Bin Fill Levels",
      endpoint: "/api/dev/boost-fill-levels",
      desc: "Sets ~90% of bins to 75%+ full. 20% critical, 70% high, 10% normal. Good for demos.",
      color: "#dd6b20",
    },
    {
      key: "resetTrucks",
      label: "🚛 Reset Truck Loads",
      endpoint: "/api/dev/reset-truck-loads",
      desc: "Resets all truck compacted yards to 0. Use at start of day if end-of-day wasn't called.",
      color: "#718096",
    },
  ];

  const dataTools = [
    {
      key: "fixLoc",
      label: "📍 Fix Bin Locations & Sensors",
      endpoint: "/api/dev/fix-locations-and-sensors",
      desc: "One-time migration: reassigns bin coordinates to Bellevue clusters and creates IOT sensors.",
      color: "#805ad5",
    },
    {
      key: "coords",
      label: "🗺️ Update Bin Coordinates",
      endpoint: "/api/dev/update-bin-coordinates",
      desc: "Applies precise lat/lon to BEL-BIN-001 through BEL-BIN-070.",
      color: "#2f855a",
    },
    {
      key: "seed",
      label: "🌱 Seed Database",
      endpoint: "/api/dev/seed",
      desc: "Populates MongoDB with sample bins, trucks, employees and 90 days of sensor history. Only runs on empty DB.",
      color: "#e53e3e",
    },
  ];

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', sans-serif",
        padding: "20px",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {saved && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            background: "#38a169",
            color: "white",
            padding: "14px 24px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 1000,
            fontWeight: "600",
          }}
        >
          ✓ Settings saved!
        </div>
      )}

      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", color: "#2d3748", margin: "0 0 4px" }}>
          Settings
        </h1>
        <p style={{ color: "#718096", margin: 0 }}>
          Configure system parameters and preferences
        </p>
      </div>

      <div style={{ display: "flex", gap: "24px" }}>
        {/* Sidebar */}
        <div
          style={{
            width: "200px",
            background: "white",
            borderRadius: "8px",
            padding: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            height: "fit-content",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "11px 14px",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                textAlign: "left",
                marginBottom: "3px",
                background: activeTab === tab.id ? "#38a169" : "transparent",
                color: activeTab === tab.id ? "white" : "#4a5568",
                transition: "all 0.15s",
              }}
            >
              <img
                src={tab.icon}
                alt={tab.label}
                style={{ width: "18px", height: "18px", objectFit: "contain" }}
              />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            background: "white",
            borderRadius: "8px",
            padding: "32px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          {/* ── General ── */}
          {activeTab === "general" && (
            <>
              <h2 style={sTitle}>General Configuration</h2>
              <div style={formRow}>
                <div style={formGroup}>
                  <label style={label}>Company Name</label>
                  <input
                    style={input}
                    value={systemSettings.companyName || ""}
                    onChange={(e) =>
                      setSystemSettingsState({
                        ...systemSettings,
                        companyName: e.target.value,
                      })
                    }
                  />
                </div>
                <div style={formGroup}>
                  <label style={label}>Contact Email</label>
                  <input
                    style={input}
                    type="email"
                    value={systemSettings.contactEmail || ""}
                    onChange={(e) =>
                      setSystemSettingsState({
                        ...systemSettings,
                        contactEmail: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div style={formRow}>
                <div style={formGroup}>
                  <label style={label}>Phone Number</label>
                  <input
                    style={input}
                    type="tel"
                    value={systemSettings.phone || ""}
                    onChange={(e) =>
                      setSystemSettingsState({
                        ...systemSettings,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>
                <div style={formGroup}>
                  <label style={label}>Timezone</label>
                  <select
                    style={input}
                    value={systemSettings.timezone || "America/Los_Angeles"}
                    onChange={(e) =>
                      setSystemSettingsState({
                        ...systemSettings,
                        timezone: e.target.value,
                      })
                    }
                  >
                    <option value="America/Los_Angeles">
                      Pacific Time (PT)
                    </option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                  </select>
                </div>
              </div>
              <div style={formGroup}>
                <label style={label}>Starting Depot Address</label>
                <textarea
                  style={{ ...input, resize: "vertical", minHeight: "70px" }}
                  value={systemSettings.address || ""}
                  onChange={(e) =>
                    setSystemSettingsState({
                      ...systemSettings,
                      address: e.target.value,
                    })
                  }
                />
              </div>
              <button style={saveBtn} onClick={handleSave}>
                Save Settings
              </button>
            </>
          )}

          {/* ── Alerts ── */}
          {activeTab === "alerts" && (
            <>
              <h2 style={sTitle}>Alert Configuration</h2>
              <div
                style={{
                  background: "#ebf8ff",
                  borderLeft: "4px solid #3182ce",
                  padding: "12px 16px",
                  borderRadius: "4px",
                  marginBottom: "24px",
                }}
              >
                <p style={{ margin: 0, fontSize: "14px", color: "#2c5282" }}>
                  Thresholds set here are saved and read by the Dashboard and
                  BinsPage filter buttons.
                </p>
              </div>
              {[
                {
                  key: "binFullThreshold",
                  label: "Bin Full Alert Threshold (%)",
                  min: 50,
                  max: 100,
                },
                {
                  key: "urgentThreshold",
                  label: "Urgent Priority Threshold (%)",
                  min: 80,
                  max: 100,
                },
              ].map((s) => (
                <div key={s.key} style={{ marginBottom: "24px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#4a5568",
                      }}
                    >
                      {s.label}
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "700",
                        color: "#38a169",
                      }}
                    >
                      {alertState[s.key]}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    value={alertState[s.key]}
                    onChange={(e) =>
                      setAlertSettings({
                        ...alertState,
                        [s.key]: parseInt(e.target.value),
                      })
                    }
                    style={{ width: "100%", accentColor: "#38a169" }}
                  />
                </div>
              ))}
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#2d3748",
                  margin: "24px 0 16px",
                }}
              >
                Notification Types
              </h3>
              {[
                { id: "temperatureAlert", label: "Temperature Anomaly Alerts" },
                { id: "sensorOfflineAlert", label: "Sensor Offline Alerts" },
                { id: "routeDelayAlert", label: "Route Delay Notifications" },
              ].map((n) => (
                <div
                  key={n.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "12px",
                  }}
                >
                  <input
                    type="checkbox"
                    id={n.id}
                    checked={alertState[n.id]}
                    style={{
                      width: "18px",
                      height: "18px",
                      accentColor: "#38a169",
                    }}
                    onChange={(e) =>
                      setAlertSettings({
                        ...alertState,
                        [n.id]: e.target.checked,
                      })
                    }
                  />
                  <label
                    htmlFor={n.id}
                    style={{
                      fontSize: "14px",
                      color: "#4a5568",
                      cursor: "pointer",
                    }}
                  >
                    {n.label}
                  </label>
                </div>
              ))}
              <button style={saveBtn} onClick={handleSave}>
                Save Settings
              </button>
            </>
          )}

          {/* ── Routes ── */}
          {activeTab === "routes" && (
            <>
              <h2 style={sTitle}>Route Optimization</h2>
              <div
                style={{
                  background: "#ebf8ff",
                  borderLeft: "4px solid #3182ce",
                  padding: "12px 16px",
                  borderRadius: "4px",
                  marginBottom: "24px",
                }}
              >
                <p style={{ margin: 0, fontSize: "14px", color: "#2c5282" }}>
                  The strategy selected here is saved and pre-selected when you
                  open the Route Planner.
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "20px",
                }}
              >
                <input
                  type="checkbox"
                  id="autoGen"
                  checked={routeState.autoGenerateRoutes}
                  style={{
                    width: "18px",
                    height: "18px",
                    accentColor: "#38a169",
                  }}
                  onChange={(e) =>
                    setRouteSettings({
                      ...routeState,
                      autoGenerateRoutes: e.target.checked,
                    })
                  }
                />
                <label
                  htmlFor="autoGen"
                  style={{
                    fontSize: "14px",
                    color: "#4a5568",
                    cursor: "pointer",
                  }}
                >
                  Enable Auto-Generation (Daily at 6 AM)
                </label>
              </div>
              <div style={formGroup}>
                <label style={label}>Default Optimization Strategy</label>
                <select
                  style={input}
                  value={routeState.optimizationStrategy}
                  onChange={(e) =>
                    setRouteSettings({
                      ...routeState,
                      optimizationStrategy: e.target.value,
                    })
                  }
                >
                  <option value="predictive">
                    Smart Route (AI-Predictive)
                  </option>
                  <option value="tsp">Smart Route (TSP Optimization)</option>
                </select>
              </div>
              <button style={saveBtn} onClick={handleSave}>
                Save Settings
              </button>
            </>
          )}

          {/* ── Dev Tools ──
          {activeTab === "devtools" && (
            <>
              <h2 style={sTitle}>🛠️ Developer Tools</h2>
              <div
                style={{
                  background: "#fffbeb",
                  borderLeft: "4px solid #d69e2e",
                  padding: "12px 16px",
                  borderRadius: "4px",
                  marginBottom: "24px",
                }}
              >
                <p style={{ margin: 0, fontSize: "14px", color: "#744210" }}>
                  These tools directly call backend endpoints and modify the
                  database.
                </p>
              </div>
              {devResult && (
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "6px",
                    marginBottom: "16px",
                    fontSize: "13px",
                    background: devResult.success ? "#f0fff4" : "#fff5f5",
                    border: `1px solid ${devResult.success ? "#9ae6b4" : "#feb2b2"}`,
                    color: devResult.success ? "#276749" : "#c53030",
                  }}
                >
                  {devResult.success ? "✓ " : "✕ "}
                  {devResult.message}
                </div>
              )}
              {devTools.map((tool) => (
                <div
                  key={tool.key}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "16px 20px",
                    marginBottom: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                  }}
                >
                  <div>
                    <h4
                      style={{
                        margin: "0 0 4px",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#2d3748",
                      }}
                    >
                      {tool.label}
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "12px",
                        color: "#718096",
                        lineHeight: "1.5",
                      }}
                    >
                      {tool.desc}
                    </p>
                  </div>
                  <button
                    disabled={devLoading[tool.key]}
                    onClick={() =>
                      runDevTool(tool.key, tool.endpoint, tool.label)
                    }
                    style={{
                      padding: "8px 18px",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: "600",
                      fontSize: "13px",
                      cursor: devLoading[tool.key] ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap",
                      color: "white",
                      background: devLoading[tool.key] ? "#a0aec0" : tool.color,
                    }}
                  >
                    {devLoading[tool.key] ? "Running..." : "Run"}
                  </button>
                </div>
              ))}
            </>
          )} */}

          {/* ── System Admin ── */}
          {activeTab === "systemAdmin" && (
            <>
              <h2 style={sTitle}>System Administration</h2>
              <div
                style={{
                  background: "#ebf8ff",
                  borderLeft: "4px solid #3182ce",
                  padding: "12px 16px",
                  borderRadius: "4px",
                  marginBottom: "24px",
                }}
              >
                <p style={{ margin: 0, fontSize: "14px", color: "#2c5282" }}>
                  <strong>Super Admin Only:</strong> These tools execute direct
                  database operations and AI model triggers. Use with caution.
                </p>
              </div>

              {devResult && (
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "6px",
                    marginBottom: "24px",
                    fontSize: "13px",
                    background: devResult.success ? "#f0fff4" : "#fff5f5",
                    border: `1px solid ${devResult.success ? "#9ae6b4" : "#feb2b2"}`,
                    color: devResult.success ? "#276749" : "#c53030",
                  }}
                >
                  {devResult.success ? "✓ " : "✕ "}
                  {devResult.message}
                </div>
              )}

              {/* Group 1: Operational Actions */}
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#4a5568",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Operational Actions
              </h3>
              {operationalTools.map((tool) => (
                <div
                  key={tool.key}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "16px 20px",
                    marginBottom: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    background: "white",
                  }}
                >
                  <div>
                    <h4
                      style={{
                        margin: "0 0 4px",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#2d3748",
                      }}
                    >
                      {tool.label}
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "12px",
                        color: "#718096",
                        lineHeight: "1.5",
                      }}
                    >
                      {tool.desc}
                    </p>
                  </div>
                  <button
                    disabled={devLoading[tool.key]}
                    onClick={() =>
                      runDevTool(tool.key, tool.endpoint, tool.label)
                    }
                    style={{
                      padding: "8px 18px",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: "600",
                      fontSize: "13px",
                      cursor: devLoading[tool.key] ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap",
                      color: "white",
                      background: devLoading[tool.key] ? "#a0aec0" : tool.color,
                    }}
                  >
                    {devLoading[tool.key] ? "Running..." : "Execute"}
                  </button>
                </div>
              ))}

              {/* Group 2: Data Management */}
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#4a5568",
                  margin: "24px 0 12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Data Management & Setup
              </h3>
              {dataTools.map((tool) => (
                <div
                  key={tool.key}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "16px 20px",
                    marginBottom: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    background: "#f8fafc",
                  }}
                >
                  <div>
                    <h4
                      style={{
                        margin: "0 0 4px",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#2d3748",
                      }}
                    >
                      {tool.label}
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "12px",
                        color: "#718096",
                        lineHeight: "1.5",
                      }}
                    >
                      {tool.desc}
                    </p>
                  </div>
                  <button
                    disabled={devLoading[tool.key]}
                    onClick={() =>
                      runDevTool(tool.key, tool.endpoint, tool.label)
                    }
                    style={{
                      padding: "8px 18px",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: "600",
                      fontSize: "13px",
                      cursor: devLoading[tool.key] ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap",
                      color: "white",
                      background: devLoading[tool.key] ? "#a0aec0" : tool.color,
                    }}
                  >
                    {devLoading[tool.key] ? "Running..." : "Execute"}
                  </button>
                </div>
              ))}
            </>
          )}

          {/* ── System Health ── */}
          {activeTab === "system" && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "24px",
                }}
              >
                <h2
                  style={{
                    ...sTitle,
                    margin: 0,
                    borderBottom: "none",
                    paddingBottom: 0,
                  }}
                >
                  System Health & Monitoring
                </h2>
                <button
                  onClick={fetchHealth}
                  style={{
                    background: "white",
                    border: "1px solid #e2e8f0",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600",
                    color: "#4a5568",
                    fontSize: "13px",
                  }}
                >
                  {healthLoading ? "Loading..." : "🔄 Refresh"}
                </button>
              </div>

              {healthLoading && !health && (
                <div
                  style={{
                    textAlign: "center",
                    color: "#718096",
                    padding: "40px",
                  }}
                >
                  Loading system health...
                </div>
              )}
              {!healthLoading && !health && (
                <div
                  style={{
                    textAlign: "center",
                    color: "#e53e3e",
                    background: "#fff5f5",
                    padding: "20px",
                    borderRadius: "8px",
                  }}
                >
                  ⚠️ Could not connect to backend. Is Spring Boot running on
                  port 8080?
                </div>
              )}
              {health && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "20px",
                  }}
                >
                  {/* DB Stats */}
                  <div style={card}>
                    <div style={cardHeader}>
                      <div style={{ ...cardIcon, background: "#ebf8ff" }}>
                        📊
                      </div>
                      <div>
                        <h3 style={cardTitle}>Database Statistics</h3>
                        <p style={cardSub}>MongoDB Collection Counts</p>
                      </div>
                    </div>
                    {[
                      {
                        label: "Total Bins",
                        value: health.totalBins,
                        icon: "🗑️",
                      },
                      {
                        label: "Total Trucks",
                        value: health.totalTrucks,
                        icon: "🚛",
                      },
                      {
                        label: "Total Routes",
                        value: health.totalRoutes,
                        icon: "🗺️",
                        highlight: true,
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 12px",
                          background: s.highlight ? "#ebf8ff" : "#f8fafc",
                          borderRadius: "6px",
                          marginBottom: "8px",
                          border: s.highlight ? "1px solid #bee3f8" : "none",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            color: s.highlight ? "#2b6cb0" : "#4a5568",
                          }}
                        >
                          {s.icon} {s.label}
                        </span>
                        <span
                          style={{
                            fontWeight: "700",
                            fontSize: "18px",
                            fontFamily: "monospace",
                            color: s.highlight ? "#2b6cb0" : "#2d3748",
                          }}
                        >
                          {s.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Last Route */}
                  <div style={card}>
                    <div style={cardHeader}>
                      <div style={{ ...cardIcon, background: "#faf5ff" }}>
                        🗺️
                      </div>
                      <div>
                        <h3 style={cardTitle}>Last Route Generation</h3>
                        <p style={cardSub}>Most Recent Successful Run</p>
                      </div>
                    </div>
                    <div
                      style={{
                        textAlign: "center",
                        padding: "20px",
                        background: "#f8fafc",
                        borderRadius: "8px",
                        border: "1px dashed #cbd5e0",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#718096",
                          marginBottom: "8px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          fontWeight: "600",
                        }}
                      >
                        Timestamp
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: "700",
                          color:
                            health.lastRouteGenerated === "Never"
                              ? "#e53e3e"
                              : "#2d3748",
                        }}
                      >
                        {health.lastRouteGenerated === "Never"
                          ? "No routes generated yet"
                          : new Date(
                              health.lastRouteGenerated,
                            ).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Service Status */}
                  <div style={card}>
                    <div style={cardHeader}>
                      <div style={{ ...cardIcon, background: "#f0fff4" }}>
                        🔌
                      </div>
                      <div>
                        <h3 style={cardTitle}>Service Connectivity</h3>
                        <p style={cardSub}>External API & AI Status</p>
                      </div>
                    </div>
                    {[
                      { label: "MongoDB Database", key: "mongoDbStatus" },
                      { label: "Mapbox Routing API", key: "mapboxApiStatus" },
                      { label: "SageMaker AI Model", key: "sageMakerStatus" },
                    ].map((s) => (
                      <div
                        key={s.key}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 0",
                          borderBottom: "1px solid #f7fafc",
                        }}
                      >
                        <span style={{ fontSize: "14px", color: "#4a5568" }}>
                          {s.label}
                        </span>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "600",
                            background:
                              health[s.key] === "Connected"
                                ? "#c6f6d5"
                                : "#fed7d7",
                            color:
                              health[s.key] === "Connected"
                                ? "#2f855a"
                                : "#c53030",
                          }}
                        >
                          <span
                            style={{
                              width: "7px",
                              height: "7px",
                              borderRadius: "50%",
                              background:
                                health[s.key] === "Connected"
                                  ? "#38a169"
                                  : "#e53e3e",
                            }}
                          />
                          {health[s.key]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Shared micro-styles
const sTitle = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#2d3748",
  margin: "0 0 24px",
  paddingBottom: "12px",
  borderBottom: "2px solid #e2e8f0",
};
const formRow = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
};
const formGroup = { marginBottom: "16px" };
const label = {
  display: "block",
  fontSize: "13px",
  fontWeight: "600",
  color: "#374151",
  marginBottom: "5px",
};
const input = {
  width: "100%",
  padding: "9px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "14px",
  boxSizing: "border-box",
  fontFamily: "inherit",
  background: "white",
};
const saveBtn = {
  background: "#38a169",
  color: "white",
  border: "none",
  padding: "11px 28px",
  borderRadius: "6px",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
  marginTop: "24px",
};
const card = {
  background: "white",
  border: "1px solid #edf2f7",
  borderRadius: "10px",
  padding: "20px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
};
const cardHeader = {
  display: "flex",
  alignItems: "center",
  marginBottom: "16px",
  paddingBottom: "12px",
  borderBottom: "1px solid #f7fafc",
};
const cardIcon = {
  width: "44px",
  height: "44px",
  borderRadius: "10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginRight: "14px",
  fontSize: "22px",
};
const cardTitle = {
  margin: 0,
  fontSize: "16px",
  fontWeight: "700",
  color: "#2d3748",
};
const cardSub = { margin: "3px 0 0", fontSize: "12px", color: "#718096" };

export default SettingsPage;
