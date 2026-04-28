// src/components/DeploymentsPage.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const StatusBadge = ({ status }) => {
  const isConnected = status === "Connected";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 12px",
        borderRadius: "20px",
        fontSize: "13px",
        fontWeight: "600",
        backgroundColor: isConnected ? "#c6f6d5" : "#fed7d7",
        color: isConnected ? "#2f855a" : "#c53030",
        boxShadow: isConnected
          ? "0 1px 2px rgba(47, 133, 90, 0.1)"
          : "0 1px 2px rgba(197, 48, 48, 0.1)",
      }}
    >
      <span
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: isConnected ? "#38a169" : "#e53e3e",
          marginRight: "8px",
        }}
      ></span>
      {status}
    </span>
  );
};

const StatRow = ({ label, value, icon, highlight }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 16px",
      backgroundColor: highlight ? "#ebf8ff" : "#f8fafc",
      borderRadius: "8px",
      border: highlight ? "1px solid #bee3f8" : "1px solid transparent",
      transition: "background 0.2s",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span style={{ fontSize: "16px" }}>{icon}</span>
      <span
        style={{
          color: highlight ? "#2b6cb0" : "#4a5568",
          fontSize: "14px",
          fontWeight: "500",
        }}
      >
        {label}
      </span>
    </div>
    <span
      style={{
        fontWeight: "700",
        color: highlight ? "#2b6cb0" : "#2d3748",
        fontSize: "18px",
        fontFamily: "monospace",
      }}
    >
      {value}
    </span>
  </div>
);

const ServiceRow = ({ name, status }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 0",
      borderBottom: "1px solid #f7fafc",
    }}
  >
    <span
      style={{
        color: "#4a5568",
        fontSize: "14px",
        fontWeight: "500",
      }}
    >
      {name}
    </span>
    <StatusBadge status={status} />
  </div>
);

const DeploymentsPage = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      // Call the endpoint we created in HealthController.java
      const res = await axios.get("http://localhost:8080/api/system/health");
      setHealth(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching health:", err);
      setError(
        "Could not connect to backend health service. Is the backend running on port 8080?",
      );
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#718096" }}>
        <div
          className="spinner"
          style={{
            border: "4px solid #f0f0f0",
            borderTop: "4px solid #38a169",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            animation: "spin 1s linear infinite",
            margin: "20px auto",
          }}
        ></div>
        Loading system health...
      </div>
    );

  if (error)
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: "#e53e3e",
          background: "#fff5f5",
          borderRadius: "8px",
          margin: "20px",
        }}
      >
        ⚠️ {error}
      </div>
    );

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f5f7fa",
        minHeight: "100vh",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      {/* Header Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#2d3748",
              margin: "0 0 8px 0",
            }}
          >
            System Health & Monitoring
          </h1>
          <p
            style={{
              color: "#718096",
              margin: 0,
              fontSize: "15px",
            }}
          >
            Real-time status of core services, database metrics, and AI
            components.
          </p>
        </div>
        <button
          onClick={fetchHealth}
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            color: "#4a5568",
            fontSize: "14px",
            transition: "all 0.2s",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#f8fafc";
            e.currentTarget.style.borderColor = "#cbd5e0";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "white";
            e.currentTarget.style.borderColor = "#e2e8f0";
          }}
        >
          🔄 Refresh Status
        </button>
      </div>

      {/* Grid Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px",
        }}
      >
        {/* Card 1: Database Statistics */}
        <div
          style={{
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            border: "1px solid #edf2f7",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "24px",
              paddingBottom: "16px",
              borderBottom: "1px solid #f7fafc",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                background: "#ebf8ff",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "16px",
                fontSize: "24px",
              }}
            >
              📊
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#2d3748",
                }}
              >
                Database Statistics
              </h3>
              <p
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "13px",
                  color: "#718096",
                }}
              >
                MongoDB Collection Counts
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <StatRow label="Total Bins" value={health.totalBins} icon="🗑️" />
            <StatRow
              label="Total Trucks"
              value={health.totalTrucks}
              icon="🚛"
            />
            <StatRow
              label="Total Routes Generated"
              value={health.totalRoutes}
              icon="🗺️"
              highlight
            />
          </div>
        </div>

        {/* Card 2: Last Route Generation */}
        <div
          style={{
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            border: "1px solid #edf2f7",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "24px",
              paddingBottom: "16px",
              borderBottom: "1px solid #f7fafc",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                background: "#faf5ff",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "16px",
                fontSize: "24px",
              }}
            >
              🗺️
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#2d3748",
                }}
              >
                Last Route Generation
              </h3>
              <p
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "13px",
                  color: "#718096",
                }}
              >
                Most Recent Successful Run
              </p>
            </div>
          </div>

          <div
            style={{
              textAlign: "center",
              padding: "20px 0",
              background: "#f8fafc",
              borderRadius: "8px",
              border: "1px dashed #cbd5e0",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                color: "#718096",
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                fontWeight: "600",
              }}
            >
              Timestamp
            </div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color:
                  health.lastRouteGenerated === "Never" ? "#e53e3e" : "#2d3748",
                wordBreak: "break-word",
                padding: "0 10px",
              }}
            >
              {health.lastRouteGenerated === "Never"
                ? "No routes generated yet"
                : new Date(health.lastRouteGenerated).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Card 3: Service Connectivity */}
        <div
          style={{
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            border: "1px solid #edf2f7",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "24px",
              paddingBottom: "16px",
              borderBottom: "1px solid #f7fafc",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                background: "#f0fff4",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "16px",
                fontSize: "24px",
              }}
            >
              🔌
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#2d3748",
                }}
              >
                Service Connectivity
              </h3>
              <p
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "13px",
                  color: "#718096",
                }}
              >
                External API & AI Status
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <ServiceRow name="MongoDB Database" status={health.mongoDbStatus} />
            <ServiceRow
              name="Mapbox Routing API"
              status={health.mapboxApiStatus}
            />
            <ServiceRow
              name="SageMaker AI Model"
              status={health.sageMakerStatus}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentsPage;
