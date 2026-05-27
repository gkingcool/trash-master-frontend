// src/components/TruckManagement.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/trucks";
const ROUTES_API_URL = "http://localhost:8080/api/routes/all";
const BINS_API_URL = "http://localhost:8080/api/bins";

const TruckManagement = () => {
  const [trucks, setTrucks] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [newTruckId, setNewTruckId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Fetch Trucks, Routes, and Bins on Load & Poll every 15 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch all 3 resources in parallel
      const [trucksRes, routesRes, binsRes] = await Promise.all([
        axios.get(API_BASE_URL),
        axios.get(ROUTES_API_URL),
        axios.get(BINS_API_URL),
      ]);

      setTrucks(trucksRes.data);
      setRoutes(routesRes.data);
      setBins(binsRes.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load fleet data. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Calculate Real-Time Truck Load
  const calculateCurrentLoad = (truck) => {
    // 1. Base load is what's currently in the truck DB (starting load for today)
    let currentLoad = truck.currentCompactedYards || 0;

    // 2. Find the active route for this truck (IN_PROGRESS or CREATED)
    const activeRoute = routes.find(
      (r) =>
        r.truckId === truck.truckId &&
        (r.status === "IN_PROGRESS" || r.status === "CREATED"),
    );

    // 3. If on a route, add the weight of bins that have been picked up (fillLevel === 0)
    if (activeRoute && activeRoute.steps) {
      const binSteps = activeRoute.steps.filter((s) => s.type === "BIN");

      for (const step of binSteps) {
        const bin = bins.find((b) => b.binId === step.binId);
        // If the bin exists and its fill level is 0, the driver has picked it up
        if (bin && bin.fillLevel === 0 && step.binFillLevel) {
          const looseYards =
            (bin.capacityYards || 0) * (step.binFillLevel / 100);
          currentLoad += looseYards / 4.0; // Apply 4:1 compaction ratio
        }
      }
    }

    return currentLoad;
  };

  const handleAddTruck = async (e) => {
    e.preventDefault();
    if (!newTruckId.trim()) {
      alert("Please enter a Truck ID");
      return;
    }
    setIsSubmitting(true);
    try {
      await axios.post(API_BASE_URL, {
        truckId: newTruckId,
        assignedDriverId: null,
        currentCompactedYards: 0.0,
      });
      setNewTruckId("");
      fetchData();
      alert(`✅ Truck ${newTruckId} added successfully!`);
    } catch (err) {
      console.error("Error adding truck:", err);
      alert(
        err.response?.data || "Failed to add truck. It might already exist.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTruck = async (truckId) => {
    if (!window.confirm(`Are you sure you want to delete truck ${truckId}?`))
      return;
    try {
      await axios.delete(`${API_BASE_URL}/${truckId}`);
      fetchData();
      alert(`🗑️ Truck ${truckId} deleted.`);
    } catch (err) {
      console.error("Error deleting truck:", err);
      alert("Failed to delete truck.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🚛 Fleet Management</h2>
        <button onClick={fetchData} style={styles.refreshBtn}>
          🔄 Refresh
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Add Truck Form */}
      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Add New Truck</h3>
        <form onSubmit={handleAddTruck} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Truck ID (e.g., TRK-001)</label>
            <input
              type="text"
              value={newTruckId}
              onChange={(e) => setNewTruckId(e.target.value.toUpperCase())}
              placeholder="TRK-XXX"
              style={styles.input}
              required
            />
          </div>
          <button type="submit" disabled={isSubmitting} style={styles.addBtn}>
            {isSubmitting ? "Adding..." : "+ Add Truck"}
          </button>
        </form>
        <p style={styles.helperText}>
          💡 Tip: After adding a truck, go to <strong>Driver Management</strong>{" "}
          to assign it to a driver.
        </p>
      </div>

      {/* Truck List */}
      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Current Fleet ({trucks.length})</h3>

        {loading ? (
          <p style={styles.loading}>Loading fleet...</p>
        ) : trucks.length === 0 ? (
          <p style={styles.empty}>No trucks found. Add one above!</p>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Truck ID</th>
                  <th style={styles.th}>Assigned Driver</th>
                  <th style={styles.th}>Current Load (yds³)</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trucks.map((truck) => {
                  // Calculate live load for this truck
                  const currentLoad = calculateCurrentLoad(truck);
                  const isActiveRoute = routes.some(
                    (r) =>
                      r.truckId === truck.truckId && r.status === "IN_PROGRESS",
                  );

                  return (
                    <tr key={truck.id} style={styles.tr}>
                      <td style={styles.td}>
                        <strong>{truck.truckId}</strong>
                      </td>
                      <td style={styles.td}>
                        {truck.assignedDriverId ? (
                          <span
                            style={{ color: "#38a169", fontWeight: "bold" }}
                          >
                            {truck.assignedDriverId}
                          </span>
                        ) : (
                          <span style={{ color: "#718096" }}>Unassigned</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: isActiveRoute ? "700" : "400",
                              color: isActiveRoute ? "#dd6b20" : "#2d3748",
                            }}
                          >
                            {currentLoad.toFixed(1)}
                          </span>
                          <span style={{ color: "#a0aec0" }}>
                            / {truck.maxCapacityYards}
                          </span>
                          {isActiveRoute && (
                            <span
                              style={{
                                fontSize: "10px",
                                background: "#feebc8",
                                color: "#c05621",
                                padding: "2px 6px",
                                borderRadius: "4px",
                              }}
                            >
                              On Route
                            </span>
                          )}
                        </div>
                        {/* Visual Load Bar */}
                        <div style={styles.loadBarBg}>
                          <div
                            style={{
                              ...styles.loadBarFill,
                              width: `${Math.min((currentLoad / truck.maxCapacityYards) * 100, 100)}%`,
                              backgroundColor:
                                currentLoad >= 25.5 ? "#e53e3e" : "#38a169", // Red if near 85% capacity (25.5/30)
                            }}
                          />
                        </div>
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() => handleDeleteTruck(truck.truckId)}
                          style={styles.deleteBtn}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Simple Inline Styles
const styles = {
  container: {
    padding: "20px",
    maxWidth: "1000px",
    margin: "0 auto",
    fontFamily: "sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  title: { margin: 0, color: "#2d3748" },
  refreshBtn: {
    background: "#edf2f7",
    border: "none",
    padding: "8px 16px",
    borderRadius: "4px",
    cursor: "pointer",
  },
  card: {
    background: "white",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    marginBottom: "20px",
  },
  sectionTitle: {
    marginTop: 0,
    borderBottom: "1px solid #edf2f7",
    paddingBottom: "10px",
    marginBottom: "15px",
  },
  form: {
    display: "flex",
    gap: "15px",
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minWidth: "200px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "5px",
    color: "#4a5568",
  },
  input: { padding: "10px", border: "1px solid #cbd5e0", borderRadius: "4px" },
  addBtn: {
    background: "#38a169",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  helperText: {
    fontSize: "12px",
    color: "#718096",
    marginTop: "10px",
    fontStyle: "italic",
  },
  tableContainer: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "12px",
    borderBottom: "2px solid #edf2f7",
    color: "#4a5568",
  },
  tr: { borderBottom: "1px solid #edf2f7" },
  td: { padding: "16px 12px", color: "#2d3748", verticalAlign: "middle" },
  deleteBtn: {
    background: "#fed7d7",
    color: "#c53030",
    border: "none",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
  },
  error: {
    background: "#fed7d7",
    color: "#c53030",
    padding: "10px",
    borderRadius: "4px",
    marginBottom: "20px",
  },
  loading: { textAlign: "center", color: "#718096" },
  empty: { textAlign: "center", color: "#718096", fontStyle: "italic" },
  // New styles for load bar
  loadBarBg: {
    height: "6px",
    background: "#edf2f7",
    borderRadius: "3px",
    marginTop: "6px",
    width: "100px",
    overflow: "hidden",
  },
  loadBarFill: {
    height: "100%",
    transition: "width 0.3s ease",
    borderRadius: "3px",
  },
};

export default TruckManagement;
