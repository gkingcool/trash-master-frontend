// src/components/TruckManagement.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/trucks";

const TruckManagement = () => {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [newTruckId, setNewTruckId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Trucks on Load
  useEffect(() => {
    fetchTrucks();
  }, []);

  const fetchTrucks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_BASE_URL);
      setTrucks(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching trucks:", err);
      setError("Failed to load trucks. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTruck = async (e) => {
    e.preventDefault();
    if (!newTruckId.trim()) {
      alert("Please enter a Truck ID");
      return;
    }

    setIsSubmitting(true);
    try {
      // We just create the asset with 0 load.
      await axios.post(API_BASE_URL, {
        truckId: newTruckId,
        assignedDriverId: null, // Or empty string depending on your DB schema preference
        currentCompactedYards: 0.0,
      });

      // Reset form and refresh list
      setNewTruckId("");
      fetchTrucks();
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
      fetchTrucks();
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
        <button onClick={fetchTrucks} style={styles.refreshBtn}>
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
            {isSubmitting ? "Adding..." : "➕ Add Truck"}
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
                {trucks.map((truck) => (
                  <tr key={truck.id} style={styles.tr}>
                    <td style={styles.td}>
                      <strong>{truck.truckId}</strong>
                    </td>
                    <td style={styles.td}>
                      {truck.assignedDriverId ? (
                        <span style={{ color: "#38a169", fontWeight: "bold" }}>
                          {truck.assignedDriverId}
                        </span>
                      ) : (
                        <span style={{ color: "#718096" }}>Unassigned</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      {truck.currentCompactedYards} / {truck.maxCapacityYards}
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
                ))}
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
    maxWidth: "900px",
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
  td: { padding: "12px", color: "#2d3748" },
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
};

export default TruckManagement;
