// src/components/RouteStatusPage.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const RouteStatusPage = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState({
    routeDate: "",
    driverId: "",
    truckId: "",
    status: "",
  });

  // Fetch all routes on mount
  useEffect(() => {
    fetchRoutes();
    const interval = setInterval(fetchRoutes, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      // Use the existing /api/routes/all endpoint
      const response = await axios.get("http://localhost:8080/api/routes/all");
      // Sort by date (newest first) then by status
      const sortedRoutes = response.data.sort((a, b) => {
        // Normalize nulls to empty strings so localeCompare works safely
  const dateA = a.routeDate || "";
  const dateB = b.routeDate || "";
        if (dateA !== dateB)
          return dateB.localeCompare(dateA);
        return a.status.localeCompare(b.status);
      });
      setRoutes(sortedRoutes);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching routes:", err);
      setError("Failed to load route status.");
      setLoading(false);
    }
  };

  // Add delete handler
  const handleDeleteRoute = async (routeId, routeDate) => {
    if (
      window.confirm(
        `Are you sure you want to delete the route for ${routeDate}?`,
      )
    ) {
      try {
        await axios.delete(`http://localhost:8080/api/routes/${routeId}`);
        // Refresh the routes list
        fetchRoutes();
        alert("Route deleted successfully");
      } catch (err) {
        console.error("Error deleting route:", err);
        alert("Failed to delete route");
      }
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      // Remove empty fields so backend doesn't filter by them
      const payload = Object.fromEntries(
        Object.entries(searchParams).filter(([_, v]) => v !== ""),
      );
      const response = await axios.post(
        "http://localhost:8080/api/routes/search",
        payload,
      );
      setRoutes(response.data);
      setLoading(false);
    } catch (err) {
      alert("Search failed");
    }
  };

  const handleStatusOverride = async (routeId, newStatus) => {
    if (!window.confirm(`Force route status to ${newStatus}?`)) return;
    try {
      // PATCH /api/routes/{id}/status
      await axios.patch(
        `http://localhost:8080/api/routes/${routeId}/status?status=${newStatus}`,
      );
      fetchRoutes();
      alert("Status overridden successfully");
    } catch (err) {
      alert("Failed to override status");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "CREATED":
        return "#3182ce"; // Blue
      case "IN_PROGRESS":
        return "#dd6b20"; // Orange
      case "COMPLETED":
        return "#38a169"; // Green
      default:
        return "#718096"; // Gray
    }
  };

  if (loading)
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        Loading routes...
      </div>
    );
  if (error)
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#e53e3e" }}>
        {error}
      </div>
    );

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#f5f7fa",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1 style={{ fontSize: "24px", fontWeight: "600", color: "#2d3748" }}>
          Route Status
        </h1>
        <button
          onClick={fetchRoutes}
          style={{
            background: "#edf2f7",
            border: "none",
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {routes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#718096" }}>
          No routes found. Generate routes in the Route Planner.
        </div>
      ) : (
        <div
          style={{
            background: "white",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            <input
              type="date"
              onChange={(e) =>
                setSearchParams((p) => ({ ...p, routeDate: e.target.value }))
              }
              style={{
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #cbd5e0",
              }}
            />
            <input
              placeholder="Driver ID"
              onChange={(e) =>
                setSearchParams((p) => ({ ...p, driverId: e.target.value }))
              }
              style={{
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #cbd5e0",
              }}
            />
            <input
              placeholder="Truck ID"
              onChange={(e) =>
                setSearchParams((p) => ({ ...p, truckId: e.target.value }))
              }
              style={{
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #cbd5e0",
              }}
            />
            <select
              onChange={(e) =>
                setSearchParams((p) => ({ ...p, status: e.target.value }))
              }
              style={{
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #cbd5e0",
              }}
            >
              <option value="">All Statuses</option>
              <option value="CREATED">CREATED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
            <button
              onClick={handleSearch}
              style={{
                padding: "8px 16px",
                background: "#3182ce",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              🔍 Search
            </button>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid #edf2f7",
                  background: "#f8fafc",
                }}
              >
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    color: "#4a5568",
                  }}
                >
                  Date
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    color: "#4a5568",
                  }}
                >
                  Truck
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    color: "#4a5568",
                  }}
                >
                  Driver
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    color: "#4a5568",
                  }}
                >
                  Stops
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    color: "#4a5568",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    color: "#4a5568",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => (
                <tr
                  key={route.id}
                  style={{ borderBottom: "1px solid #edf2f7" }}
                >
                  <td style={{ padding: "12px", color: "#2d3748" }}>
                    {route.routeDate}
                  </td>
                  <td style={{ padding: "12px", color: "#2d3748" }}>
                    {route.truckId}
                  </td>
                  <td style={{ padding: "12px", color: "#2d3748" }}>
                    {route.driverId || "Unassigned"}
                  </td>
                  {/* <td style={{ padding: "12px", color: "#2d3748" }}>
                    {route.totalStops}
                  </td> */}
                  <td style={{ padding: "12px", color: "#2d3748" }}>
                    {(route.steps || []).filter(
                      (s) => s.type === "BIN" && s.binFillLevel > 0,
                    ).length || route.totalStops}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span
                      style={{
                        background: getStatusColor(route.status),
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      {route.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <button
                      onClick={() =>
                        navigate(`/driver-tracking/${route.driverId}`)
                      }
                      style={{
                        background: "#ebf8ff",
                        color: "#3182ce",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      View Map
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteRoute(route.id, route.routeDate)
                      }
                      style={{
                        background: "#fed7d7",
                        color: "#e53e3e",
                        border: "none",
                        padding: "6px 12px",
                        marginLeft: "8px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      🗑️ Delete
                    </button>
                    <select
                      onChange={(e) =>
                        handleStatusOverride(route.id, e.target.value)
                      }
                      style={{
                        padding: "6px 8px",
                        borderRadius: "4px",
                        border: "1px solid #cbd5e0",
                        fontSize: "11px",
                        cursor: "pointer",
                        background: "white",
                        marginLeft: "8px",
                      }}
                    >
                      <option value="">Override Status</option>
                      <option value="CREATED">Force CREATED</option>
                      <option value="IN_PROGRESS">Force IN_PROGRESS</option>
                      <option value="COMPLETED">Force COMPLETED</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RouteStatusPage;
