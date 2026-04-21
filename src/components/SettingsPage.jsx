// src/components/SettingsPage.jsx
import React, { useState } from "react";
// Import the store we just created
import { getSystemSettings, setSystemSettings } from "../utils/settingsStore";

// Import custom icons
import settingsIcon from "../assets/icons/settings.png";
import alertIcon from "../assets/icons/alert-icon.png";
import routeIcon from "../assets/icons/routes-icon.png";
import recyclingBinIcon from "../assets/icons/recycling-bin-icon.png";
import accountIcon from "../assets/icons/account-icon.png";

// Helper to safely read admin/user data from localStorage
const getCurrentUser = () => {
  try {
    const auth = JSON.parse(localStorage.getItem("auth"));
    if (auth?.firstName && auth?.lastName) {
      return {
        name: `${auth.firstName} ${auth.lastName}`,
        initials: `${auth.firstName[0]}${auth.lastName[0]}`.toUpperCase(),
        email: auth.email || "N/A",
        role:
          auth.role?.toString().charAt(0).toUpperCase() +
            auth.role?.toString().slice(1).toLowerCase() || "Admin",
      };
    }
  } catch (e) {
    console.warn("Auth data not found or invalid");
  }
  // Fallback if not logged in or missing fields
  return {
    name: "Admin User",
    initials: "AU",
    email: "admin@trashmasters.com",
    role: "Admin",
  };
};

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [saved, setSaved] = useState(false);

  // ✅ Initialize state from the shared store (instead of hardcoded values)
  const [systemSettings, setSystemSettingsState] =
    useState(getSystemSettings());

  // Alert Thresholds
  const [alertSettings, setAlertSettings] = useState({
    binFullThreshold: 80,
    urgentThreshold: 95,
    temperatureAlert: true,
    sensorOfflineAlert: true,
    routeDelayAlert: true,
    emailNotifications: true,
    smsNotifications: false,
  });

  // Route Configuration
  const [routeSettings, setRouteSettings] = useState({
    autoGenerateRoutes: true,
    optimizationStrategy: "smart",
    maxStopsPerRoute: 20,
    maxRouteDuration: 8,
    considerTraffic: true,
    prioritizeUrgentBins: true,
  });

  // Bin Management
  const [binSettings, setBinSettings] = useState({
    binTypes: [
      "Recycling (Blue)",
      "General Waste (Green)",
      "Organic (Brown)",
      "Hazardous (Red)",
    ],
    defaultCapacity: 100,
    sensorUpdateInterval: 15,
    maintenanceInterval: 90,
  });

  // ✅ Save to the shared store
  const handleSave = () => {
    setSystemSettings(systemSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { id: "general", label: "General", icon: settingsIcon },
    { id: "alerts", label: "Alerts", icon: alertIcon },
    { id: "routes", label: "Routes", icon: routeIcon },
    { id: "bins", label: "Bins", icon: recyclingBinIcon },
    { id: "account", label: "Account", icon: accountIcon },
  ];

  return (
    <div className="settings-page">
      <style>{`
        .settings-page { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; background: #f8fafc; min-height: 100vh; }
        .settings-header { margin-bottom: 24px; }
        .settings-header h1 { font-size: 24px; color: #2d3748; margin: 0 0 8px 0; }
        .settings-header p { color: #718096; margin: 0; }
        .settings-container { display: flex; gap: 24px; }
        .settings-tabs { width: 240px; background: white; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); height: fit-content; }
        .tab-button { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 16px; border: none; background: transparent; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; color: #4a5568; transition: all 0.2s; text-align: left; }
        .tab-button:hover { background: #f8fafc; }
        .tab-button.active { background: #38a169; color: white; }
        .tab-icon { width: 20px; height: 20px; object-fit: contain; }
        .settings-content { flex: 1; background: white; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .section-title { font-size: 18px; font-weight: 600; color: #2d3748; margin: 0 0 24px 0; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; font-size: 14px; font-weight: 500; color: #4a5568; margin-bottom: 6px; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px 12px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 14px; transition: all 0.2s; }
        .form-group input:focus, .form-group select:focus { outline: none; border-color: #38a169; box-shadow: 0 0 0 3px rgba(56, 161, 105, 0.1); }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .checkbox-group { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .checkbox-group input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; accent-color: #38a169; }
        .checkbox-group label { margin: 0; cursor: pointer; font-size: 14px; color: #4a5568; }
        .checkbox-description { font-size: 12px; color: #718096; margin-left: 28px; margin-top: -8px; margin-bottom: 12px; }
        .slider-group { margin-bottom: 24px; }
        .slider-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .slider-label { font-size: 14px; font-weight: 500; color: #4a5568; }
        .slider-value { font-size: 14px; font-weight: 600; color: #38a169; }
        .slider { width: 100%; height: 6px; border-radius: 3px; background: #e2e8f0; outline: none; -webkit-appearance: none; }
        .slider::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #38a169; cursor: pointer; }
        .tag-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
        .tag { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: #edf2f7; border-radius: 20px; font-size: 13px; color: #4a5568; }
        .tag-remove { cursor: pointer; color: #e53e3e; font-weight: bold; }
        .save-button { background: #38a169; color: white; border: none; padding: 12px 32px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; margin-top: 24px; }
        .save-button:hover { background: #2f855a; transform: translateY(-1px); box-shadow: 0 4px 6px rgba(56, 161, 105, 0.3); }
        .save-message { position: fixed; top: 20px; right: 20px; background: #38a169; color: white; padding: 16px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: slideIn 0.3s ease; z-index: 1000; }
        @keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .info-box { background: #ebf8ff; border-left: 4px solid #3182ce; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px; }
        .info-box p { margin: 0; font-size: 14px; color: #2c5282; }
        .password-section { margin-top: 32px; padding-top: 24px; border-top: 2px solid #e2e8f0; }
        .password-section h3 { font-size: 16px; color: #2d3748; margin-bottom: 16px; }
      `}</style>

      {saved && (
        <div className="save-message">✓ Settings saved successfully!</div>
      )}

      <div className="settings-header">
        <h1>Settings</h1>
        <p>Configure system parameters and preferences</p>
      </div>

      <div className="settings-container">
        <div className="settings-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <img src={tab.icon} alt={tab.label} className="tab-icon" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="settings-content">
          {/* General Settings */}
          {activeTab === "general" && (
            <div>
              <h2 className="section-title">General Configuration</h2>

              <div className="form-group">
                <label>Company Name</label>
                <input
                  type="text"
                  value={systemSettings.companyName}
                  onChange={(e) =>
                    setSystemSettingsState({
                      ...systemSettings,
                      companyName: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Contact Email</label>
                  <input
                    type="email"
                    value={systemSettings.contactEmail}
                    onChange={(e) =>
                      setSystemSettingsState({
                        ...systemSettings,
                        contactEmail: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={systemSettings.phone}
                    onChange={(e) =>
                      setSystemSettingsState({
                        ...systemSettings,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Starting Depot Address</label>
                <textarea
                  rows="2"
                  value={systemSettings.address}
                  onChange={(e) =>
                    setSystemSettingsState({
                      ...systemSettings,
                      address: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Timezone</label>
                  <select
                    value={systemSettings.timezone}
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
                <div className="form-group">
                  <label>Date Format</label>
                  <select
                    value={systemSettings.dateFormat}
                    onChange={(e) =>
                      setSystemSettingsState({
                        ...systemSettings,
                        dateFormat: e.target.value,
                      })
                    }
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Alert Settings */}
          {activeTab === "alerts" && (
            <div>
              <h2 className="section-title">Alert Configuration</h2>
              <div className="info-box">
                <p>
                  Set thresholds for automated alerts. These complement the KPIs
                  shown on the dashboard.
                </p>
              </div>

              <div className="slider-group">
                <div className="slider-header">
                  <span className="slider-label">
                    Bin Full Alert Threshold (%)
                  </span>
                  <span className="slider-value">
                    {alertSettings.binFullThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={alertSettings.binFullThreshold}
                  onChange={(e) =>
                    setAlertSettings({
                      ...alertSettings,
                      binFullThreshold: parseInt(e.target.value),
                    })
                  }
                  className="slider"
                />
              </div>

              <div className="slider-group">
                <div className="slider-header">
                  <span className="slider-label">
                    Urgent Priority Threshold (%)
                  </span>
                  <span className="slider-value">
                    {alertSettings.urgentThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="100"
                  value={alertSettings.urgentThreshold}
                  onChange={(e) =>
                    setAlertSettings({
                      ...alertSettings,
                      urgentThreshold: parseInt(e.target.value),
                    })
                  }
                  className="slider"
                />
              </div>

              <h3
                style={{
                  fontSize: "16px",
                  margin: "24px 0 16px",
                  color: "#2d3748",
                }}
              >
                Notification Types
              </h3>
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="temperatureAlert"
                  checked={alertSettings.temperatureAlert}
                  onChange={(e) =>
                    setAlertSettings({
                      ...alertSettings,
                      temperatureAlert: e.target.checked,
                    })
                  }
                />
                <label htmlFor="temperatureAlert">
                  Temperature Anomaly Alerts
                </label>
              </div>
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="sensorOfflineAlert"
                  checked={alertSettings.sensorOfflineAlert}
                  onChange={(e) =>
                    setAlertSettings({
                      ...alertSettings,
                      sensorOfflineAlert: e.target.checked,
                    })
                  }
                />
                <label htmlFor="sensorOfflineAlert">
                  Sensor Offline Alerts
                </label>
              </div>
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="routeDelayAlert"
                  checked={alertSettings.routeDelayAlert}
                  onChange={(e) =>
                    setAlertSettings({
                      ...alertSettings,
                      routeDelayAlert: e.target.checked,
                    })
                  }
                />
                <label htmlFor="routeDelayAlert">
                  Route Delay Notifications
                </label>
              </div>
            </div>
          )}

          {/* Route Settings */}
          {activeTab === "routes" && (
            <div>
              <h2 className="section-title">Route Optimization</h2>
              <div className="info-box">
                <p>
                  These settings define <strong>default behavior</strong> for
                  route generation.
                </p>
              </div>

              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="autoGenerateRoutes"
                  checked={routeSettings.autoGenerateRoutes}
                  onChange={(e) =>
                    setRouteSettings({
                      ...routeSettings,
                      autoGenerateRoutes: e.target.checked,
                    })
                  }
                />
                <label htmlFor="autoGenerateRoutes">
                  Enable Auto-Generation (Daily at 6 AM)
                </label>
              </div>

              <div className="form-group" style={{ marginTop: "20px" }}>
                <label>Default Optimization Strategy</label>
                <select
                  value={routeSettings.optimizationStrategy}
                  onChange={(e) =>
                    setRouteSettings({
                      ...routeSettings,
                      optimizationStrategy: e.target.value,
                    })
                  }
                >
                  <option value="smart">Smart Route (AI-Predictive)</option>
                  <option value="distance">Shortest Distance</option>
                  <option value="time">Fastest Time</option>
                </select>
              </div>
            </div>
          )}

          {/* Bin Settings */}
          {activeTab === "bins" && (
            <div>
              <h2 className="section-title">Bin Configuration</h2>
              <div className="form-group">
                <label>Bin Types</label>
                <div className="tag-list">
                  {binSettings.binTypes.map((type, index) => (
                    <span key={index} className="tag">
                      {type}
                      <span
                        className="tag-remove"
                        onClick={() => {
                          const newTypes = binSettings.binTypes.filter(
                            (_, i) => i !== index,
                          );
                          setBinSettings({
                            ...binSettings,
                            binTypes: newTypes,
                          });
                        }}
                      >
                        ×
                      </span>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add new bin type..."
                  style={{ marginTop: "12px" }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && e.target.value.trim()) {
                      setBinSettings({
                        ...binSettings,
                        binTypes: [
                          ...binSettings.binTypes,
                          e.target.value.trim(),
                        ],
                      });
                      e.target.value = "";
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Account Settings */}
          {/* Account Settings */}
          {activeTab === "account" && (
            <div>
              <h2 className="section-title">Account Settings</h2>
              {(() => {
                const user = getCurrentUser();
                return (
                  <>
                    <div className="form-group">
                      <label>Current User</label>
                      <input
                        type="text"
                        value={user.name}
                        disabled
                        style={{ background: "#f8fafc" }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        value={user.email}
                        disabled
                        style={{ background: "#f8fafc" }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Role</label>
                      <input
                        type="text"
                        value={user.role}
                        disabled
                        style={{ background: "#f8fafc" }}
                      />
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          <button className="save-button" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
