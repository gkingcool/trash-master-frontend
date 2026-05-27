import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";
import * as sensorApi from "../services/sensorApi.js";

/* ─────────────────────────────────────────────
   STATUS HELPERS & UI COMPONENTS
───────────────────────────────────────────── */
const STATUS_CONFIG = {
  ACTIVE: { color: "#16a34a", bg: "#dcfce7", label: "Active" },
  INACTIVE: { color: "#6b7280", bg: "#f3f4f6", label: "Inactive" },
  LOW_BATTERY: { color: "#d97706", bg: "#fef3c7", label: "Low Battery" },
  MALFUNCTION: { color: "#dc2626", bg: "#fee2e2", label: "Malfunction" },
  OFFLINE: { color: "#7c3aed", bg: "#ede9fe", label: "Offline" },
};

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.INACTIVE;
  return (
    <span
      style={{
        padding: "4px 12px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: "600",
        backgroundColor: config.bg,
        color: config.color,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}
    >
      {config.label}
    </span>
  );
};

const Btn = ({
  children,
  onClick,
  variant = "primary",
  style = {},
  ...props
}) => {
  const base = {
    padding: "10px 20px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.2s",
    ...style,
  };
  const variants = {
    primary: { backgroundColor: "#4aaa72", color: "white" },
    secondary: { backgroundColor: "#f1f5f9", color: "#475569" },
    danger: { backgroundColor: "#fee2e2", color: "#ef4444" },
    blue: { backgroundColor: "#eff6ff", color: "#2563eb" },
    amber: { backgroundColor: "#fffbeb", color: "#d97706" },
  };
  return (
    <button
      onClick={onClick}
      style={{ ...base, ...variants[variant] }}
      {...props}
    >
      {children}
    </button>
  );
};

const Modal = ({ title, children, onClose }) => (
  <div style={styles.modalOverlay} onClick={onClose}>
    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
      <div style={styles.modalHeader}>
        <h3
          style={{
            margin: 0,
            fontSize: "18px",
            fontWeight: "600",
            color: "#1e293b",
          }}
        >
          {title}
        </h3>
        <button onClick={onClose} style={styles.closeBtn}>
          ×
        </button>
      </div>
      <div style={{ marginTop: "20px" }}>{children}</div>
    </div>
  </div>
);

const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: "16px" }}>
    {label && <label style={styles.label}>{label}</label>}
    <input style={styles.input} {...props} />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div style={{ marginBottom: "16px" }}>
    {label && <label style={styles.label}>{label}</label>}
    <select style={styles.input} {...props}>
      {children}
    </select>
  </div>
);

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
const SensorPage = () => {
  const [sensors, setSensors] = useState([]);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wasteByHour, setWasteByHour] = useState([]);
  const [revenueByMonth, setRevenueByMonth] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);

  const [registerForm, setRegisterForm] = useState({
    sensorId: "",
    batteryLevel: 100,
    binId: "",
    status: "INACTIVE",
  });
  const [assignBinId, setAssignBinId] = useState("");
  const [flagReason, setFlagReason] = useState("");
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [newStatus, setNewStatus] = useState("ACTIVE");
  const [simForm, setSimForm] = useState({ distanceCm: "", battery: 100 });

  // ─── DATA FETCHING ────────────────────────────────────
  const fetchSensors = useCallback(async () => {
    try {
      const data = await sensorApi.getAllSensors();
      setSensors(data);
    } catch (err) {
      console.error("Failed to fetch sensors:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBins = useCallback(async () => {
    try {
      const data = await sensorApi.getAllBins();
      setBins(data);
    } catch (err) {
      console.error("Failed to fetch bins:", err);
    }
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const [wasteRes, revRes] = await Promise.all([
        sensorApi.getWasteByHour(),
        sensorApi.getRevenueByMonth(),
      ]);
      const hours = [
        "9AM",
        "10AM",
        "11AM",
        "12PM",
        "1PM",
        "2PM",
        "3PM",
        "4PM",
        "5PM",
      ];
      setWasteByHour(
        wasteRes.map((v, i) => ({
          hour: hours[i] || `H${i}`,
          waste: parseFloat(v.toFixed(1)),
        })),
      );

      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      setRevenueByMonth(
        revRes.map((v, i) => ({
          month: months[i],
          revenue: parseFloat(v.toFixed(2)),
        })),
      );
    } catch (err) {
      console.error("History fetch failed:", err);
    }
    setHistoryLoading(false);
  };

  useEffect(() => {
    fetchSensors();
    fetchBins();
    const iv = setInterval(fetchSensors, 10000);
    return () => clearInterval(iv);
  }, [fetchSensors, fetchBins]);

  // ─── HELPERS ──────────────────────────────────────────
  const notify = (type, text) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 3500);
  };

  const openModal = (name, sensor = null) => {
    setSelected(sensor);
    setModal(name);
    if (name === "assign") setAssignBinId(sensor?.binId || "");
    if (name === "flag") setFlagReason(sensor?.flagReason || "");
    if (name === "battery") setBatteryLevel(sensor?.batteryLevel ?? 100);
    if (name === "status") setNewStatus(sensor?.status || "ACTIVE");
    if (name === "simulate") setSimForm({ distanceCm: "", battery: 100 });
  };

  const closeModal = () => {
    setModal(null);
    setSelected(null);
  };

  // ─── API ACTIONS ──────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await sensorApi.registerSensor(registerForm);
      notify("success", `Sensor ${registerForm.sensorId} registered.`);
      setRegisterForm({
        sensorId: "",
        batteryLevel: 100,
        binId: "",
        status: "INACTIVE",
      });
      closeModal();
      await fetchSensors();
      window.dispatchEvent(new CustomEvent("sensorAssigned"));
    } catch (err) {
      notify("error", err.response?.data?.message || "Registration failed.");
    }
  };

  const handleAssign = async () => {
    if (!selected || !assignBinId.trim()) return;
    try {
      await sensorApi.assignSensorToBin(selected.sensorId, assignBinId.trim());
      notify(
        "success",
        `${selected.sensorId} assigned to ${assignBinId.trim()}.`,
      );
      closeModal();
      await Promise.all([fetchSensors(), fetchBins()]);
      window.dispatchEvent(new CustomEvent("sensorAssigned"));
    } catch (err) {
      notify("error", err.response?.data?.message || "Assignment failed.");
    }
  };

  // const handleFlag = async () => {
  //   if (!selected) return;
  //   const nowFlagged = !selected.isFlagged;
  //   try {
  //     await sensorApi.flagSensor(selected.sensorId, {
  //       flagged: nowFlagged,
  //       reason: nowFlagged ? flagReason : null,
  //     });
  //     notify(
  //       "success",
  //       nowFlagged
  //         ? `${selected.sensorId} flagged.`
  //         : `${selected.sensorId} unflagged.`,
  //     );
  //     closeModal();
  //     await fetchSensors();
  //   } catch (err) {
  //     notify("error", err.response?.data?.message || "Flag update failed.");
  //   }
  // };
  const handleFlag = async () => {
    if (!selected?.sensorId) {
      notify("error", "Missing sensor ID.");
      return;
    }

    const isCurrentlyFlagged = selected.isFlagged === true;
    const shouldFlag = !isCurrentlyFlagged;

    const payload = {
      flagged: Boolean(shouldFlag),
      reason: shouldFlag ? flagReason?.trim() || "Manual flag by admin" : null,
    };

    console.log("📤 Sending Flag Payload:", payload);

    try {
      // ✅ FIX: Use the centralized sensorApi instead of the undefined `API` variable
      await sensorApi.flagSensor(selected.sensorId, payload);

      // 🔔 Trigger notification (matches BinsPage pattern)
      try {
        await axios.post("http://localhost:8080/api/notifications", {
          title: shouldFlag ? "⚠️ Sensor Flagged" : "✅ Sensor Unflagged",
          message: shouldFlag
            ? `Sensor ${selected.sensorId} flagged. Reason: ${payload.reason}`
            : `Sensor ${selected.sensorId} unflagged. Issue resolved.`,
          type: shouldFlag ? "ALERT" : "SUCCESS",
          driverId: "DRIVER_ALERT",
          isRead: false,
        });
      } catch (notifErr) {
        console.warn("Notification POST failed:", notifErr);
      }

      notify(
        "success",
        shouldFlag
          ? `${selected.sensorId} flagged.`
          : `${selected.sensorId} unflagged.`,
      );
      closeModal();
      fetchSensors();
      window.dispatchEvent(new CustomEvent("notificationRefresh"));
    } catch (err) {
      console.error(
        "🔴 Flag/Unflag API Error:",
        err.response?.data || err.message,
      );
      notify(
        "error",
        err.response?.data?.message ||
          `Failed to ${shouldFlag ? "flag" : "unflag"} sensor.`,
      );
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await sensorApi.deleteSensor(selected.sensorId);
      notify("success", `Sensor ${selected.sensorId} deleted.`);
      closeModal();
      await fetchSensors();
    } catch (err) {
      notify("error", err.response?.data?.message || "Delete failed.");
    }
  };

  const handleSimulate = async (e) => {
    e.preventDefault();
    if (!selected) return;
    try {
      await sensorApi.sendSensorReading({
        sensorId: selected.sensorId,
        distanceCm: simForm.distanceCm,
        battery: simForm.battery,
      });
      notify(
        "success",
        `Reading sent for ${selected.sensorId} — bin fill updated.`,
      );
      closeModal();
      await fetchSensors();
    } catch (err) {
      notify("error", err.response?.data?.message || "Simulation failed.");
    }
  };

  const handleBatteryUpdate = async () => {
    if (!selected) return;
    try {
      await sensorApi.updateBattery(selected.sensorId, batteryLevel);
      notify("success", `Battery updated to ${batteryLevel}%.`);
      closeModal();
      await fetchSensors();
    } catch (err) {
      notify("error", "Battery update failed.");
    }
  };

  const handleStatusUpdate = async () => {
    if (!selected) return;
    try {
      await sensorApi.updateStatus(selected.sensorId, newStatus);
      notify("success", `Status set to ${newStatus}.`);
      closeModal();
      await fetchSensors();
    } catch (err) {
      notify("error", "Status update failed.");
    }
  };

  // ─── STATS ────────────────────────────────────────────
  const total = sensors.length;
  const active = sensors.filter((s) => s.status === "ACTIVE").length;
  const inactive = sensors.filter((s) => s.status === "INACTIVE").length;
  const lowBat = sensors.filter((s) => s.batteryLevel < 20).length;
  const flagged = sensors.filter((s) => s.isFlagged).length;

  return (
    <div style={styles.pageContainer}>
      {actionMsg && (
        <div
          style={{
            ...styles.toast,
            backgroundColor: actionMsg.type === "error" ? "#fee2e2" : "#dcfce7",
            color: actionMsg.type === "error" ? "#991b1b" : "#166534",
            border: `1px solid ${actionMsg.type === "error" ? "#fecaca" : "#bbf7d0"}`,
          }}
        >
          {actionMsg.text}
        </div>
      )}

      <div style={styles.header}>
        <h1 style={styles.title}>IoT Sensor Management</h1>
        <Btn onClick={() => openModal("register")}>+ Register Sensor</Btn>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        {[
          {
            label: "Total",
            value: total,
            color: "#2563eb",
            bg: "#eff6ff",
            border: "#bfdbfe",
          },
          {
            label: "Active",
            value: active,
            color: "#4aaa72",
            bg: "#f0fdf4",
            border: "#bbf7d0",
          },
          {
            label: "Inactive",
            value: inactive,
            color: "#64748b",
            bg: "#f8fafc",
            border: "#e2e8f0",
          },
          {
            label: "Low Battery",
            value: lowBat,
            color: "#d97706",
            bg: "#fffbeb",
            border: "#fde68a",
          },
          {
            label: "Flagged",
            value: flagged,
            color: "#ef4444",
            bg: "#fef2f2",
            border: "#fecaca",
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: s.bg,
              borderRadius: "8px",
              padding: "16px",
              textAlign: "center",
              border: `1px solid ${s.border}`,
              boxShadow: "0 1px 3px 0 rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{ fontSize: "28px", fontWeight: "700", color: s.color }}
            >
              {s.value}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#64748b",
                fontWeight: "600",
                marginTop: "2px",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>Sensor ID</th>
              <th style={styles.th}>Assigned Bin</th>
              <th style={styles.th}>Battery</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Flagged</th>
              <th style={styles.th}>Last Updated</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={styles.loadingCell}>
                  Loading sensors...
                </td>
              </tr>
            ) : sensors.length === 0 ? (
              <tr>
                <td colSpan="7" style={styles.emptyCell}>
                  <div
                    style={{
                      fontSize: "32px",
                      marginBottom: "8px",
                      opacity: 0.5,
                    }}
                  >
                    📡
                  </div>
                  No sensors registered yet.
                </td>
              </tr>
            ) : (
              sensors.map((s) => (
                <tr key={s.id} style={styles.tableRow}>
                  <td style={styles.tdBold}>{s.sensorId}</td>
                  <td style={styles.td}>
                    {s.binId ? (
                      <span>
                        {s.binId}{" "}
                        <span
                          style={styles.editLink}
                          onClick={() => openModal("assign", s)}
                        >
                          (Edit)
                        </span>
                      </span>
                    ) : (
                      <span>
                        <span style={styles.unassignedText}>Unassigned</span>{" "}
                        <span
                          style={styles.editLink}
                          onClick={() => openModal("assign", s)}
                        >
                          (Assign)
                        </span>
                      </span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div style={styles.batteryContainer}>
                        <div
                          style={{
                            ...styles.batteryBar,
                            width: `${s.batteryLevel}%`,
                            backgroundColor:
                              s.batteryLevel < 20 ? "#ef4444" : "#4aaa72",
                          }}
                        />
                      </div>
                      <span
                        style={{
                          marginLeft: "8px",
                          fontSize: "14px",
                          color: "#334155",
                        }}
                      >
                        {s.batteryLevel}%
                      </span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <StatusBadge status={s.status} />
                  </td>
                  <td style={styles.td}>
                    {s.isFlagged ? (
                      <span
                        style={{
                          color: "#ef4444",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "14px",
                        }}
                      >
                        ⚠️ Yes
                      </span>
                    ) : (
                      <span
                        style={{
                          color: "#334155",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "14px",
                        }}
                      >
                        <span
                          style={{
                            backgroundColor: "#4aaa72",
                            color: "white",
                            borderRadius: "3px",
                            padding: "1px 4px",
                            fontSize: "10px",
                            fontWeight: "bold",
                          }}
                        >
                          ✓
                        </span>{" "}
                        No
                      </span>
                    )}
                  </td>
                  <td
                    style={{ ...styles.td, fontSize: "12px", color: "#94a3b8" }}
                  >
                    {s.lastUpdated
                      ? new Date(s.lastUpdated).toLocaleString()
                      : "—"}
                  </td>
                  <td style={styles.td}>
                    <div
                      style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                    >
                      <button
                        style={
                          s.isFlagged
                            ? styles.actionBtnUnflag
                            : styles.actionBtnFlag
                        }
                        onClick={() => openModal("flag", s)}
                      >
                        {s.isFlagged ? "Unflag" : "Flag"}
                      </button>
                      <button
                        style={styles.iconBtn}
                        onClick={() => openModal("simulate", s)}
                        title="Simulate Reading"
                      >
                        📡
                      </button>
                      <button
                        style={styles.iconBtn}
                        onClick={() => openModal("battery", s)}
                        title="Update Battery"
                      >
                        🔋
                      </button>
                      <button
                        style={styles.iconBtn}
                        onClick={() => openModal("status", s)}
                        title="Override Status"
                      >
                        ⚙️
                      </button>
                      <button
                        style={styles.iconBtnDelete}
                        onClick={() => openModal("delete", s)}
                        title="Delete Sensor"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* HISTORY SECTION */}
      <div style={{ ...styles.card, marginTop: "24px" }}>
        <div
          onClick={() => {
            setShowHistory((h) => !h);
            if (!showHistory) fetchHistory();
          }}
          style={styles.historyHeader}
        >
          <div>
            <span
              style={{ fontWeight: "700", fontSize: "16px", color: "#1e293b" }}
            >
              📊 Sensor History
            </span>
            <span
              style={{ marginLeft: "12px", fontSize: "13px", color: "#64748b" }}
            >
              Aggregated reading history for charts and analytics
            </span>
          </div>
          <span
            style={{
              fontSize: "20px",
              color: "#94a3b8",
              transform: showHistory ? "rotate(180deg)" : "none",
              transition: "transform 0.2s",
            }}
          >
            ▾
          </span>
        </div>
        {showHistory && (
          <div style={{ padding: "24px" }}>
            {historyLoading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "#64748b",
                }}
              >
                Loading history...
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "24px",
                }}
              >
                <div
                  style={{
                    background: "#f8fafc",
                    padding: "16px",
                    borderRadius: "8px",
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 16px 0",
                      fontSize: "14px",
                      color: "#475569",
                    }}
                  >
                    Waste by Hour
                  </h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={wasteByHour}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="hour" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} interval={0} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Bar
                        dataKey="waste"
                        fill="#4aaa72"
                        radius={[4, 4, 0, 0]}
                        name="Waste (kg)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div
                  style={{
                    background: "#f8fafc",
                    padding: "16px",
                    borderRadius: "8px",
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 16px 0",
                      fontSize: "14px",
                      color: "#475569",
                    }}
                  >
                    Revenue by Month
                  </h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={revenueByMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={{ r: 4, fill: "#2563eb" }}
                        name="Revenue ($)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── MODALS ─── */}
      {modal === "register" && (
        <Modal title="Register New Sensor" onClose={closeModal}>
          <form onSubmit={handleRegister}>
            <Input
              label="Sensor ID *"
              required
              placeholder="e.g. SENSOR-X99"
              value={registerForm.sensorId}
              onChange={(e) =>
                setRegisterForm({ ...registerForm, sensorId: e.target.value })
              }
            />
            <Input
              label="Battery Level (%)"
              type="number"
              min="0"
              max="100"
              value={registerForm.batteryLevel}
              onChange={(e) =>
                setRegisterForm({
                  ...registerForm,
                  batteryLevel: e.target.value,
                })
              }
            />
            <Select
              label="Assign to Bin (Optional)"
              value={registerForm.binId}
              onChange={(e) =>
                setRegisterForm({ ...registerForm, binId: e.target.value })
              }
            >
              <option value="">— Select a bin —</option>
              {bins.map((b) => (
                <option key={b.binId} value={b.binId}>
                  {b.binId} — {b.locationName}
                  {b.sensorId ? ` (has ${b.sensorId})` : ""}
                </option>
              ))}
            </Select>
            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <Btn
                variant="secondary"
                type="button"
                onClick={closeModal}
                style={{ flex: 1 }}
              >
                Cancel
              </Btn>
              <Btn type="submit" style={{ flex: 1 }}>
                Register
              </Btn>
            </div>
          </form>
        </Modal>
      )}

      {modal === "assign" && (
        <Modal title={`Assign ${selected?.sensorId}`} onClose={closeModal}>
          <p style={{ fontSize: "13px", color: "#64748b", marginTop: 0 }}>
            Select a bin to assign this sensor to.
          </p>
          <Select
            label="Select Bin"
            value={assignBinId}
            onChange={(e) => setAssignBinId(e.target.value)}
          >
            <option value="">— Select a bin —</option>
            {bins.map((b) => (
              <option key={b.binId} value={b.binId}>
                {b.binId} — {b.locationName}{" "}
                {b.sensorId && b.sensorId !== selected?.sensorId
                  ? `(has ${b.sensorId})`
                  : ""}
              </option>
            ))}
          </Select>
          <div style={{ display: "flex", gap: "10px" }}>
            <Btn variant="secondary" onClick={closeModal} style={{ flex: 1 }}>
              Cancel
            </Btn>
            <Btn variant="blue" onClick={handleAssign} style={{ flex: 1 }}>
              Assign
            </Btn>
          </div>
        </Modal>
      )}

      {modal === "flag" && (
        <Modal
          title={
            selected?.isFlagged
              ? `Unflag ${selected?.sensorId}`
              : `Flag ${selected?.sensorId}`
          }
          onClose={closeModal}
        >
          {!selected?.isFlagged ? (
            <>
              <p
                style={{
                  fontSize: "13px",
                  color: "#64748b",
                  marginTop: 0,
                  marginBottom: "12px",
                }}
              >
                Provide a reason for flagging this sensor (e.g., malfunction,
                offline).
              </p>
              <textarea
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="e.g. No readings for 2 days, sensor offline..."
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  resize: "vertical",
                  minHeight: "80px",
                  fontFamily: "inherit",
                  marginBottom: "20px",
                }}
              />
            </>
          ) : (
            <div style={{ marginBottom: "12px" }}>
              <p style={{ fontSize: "13px", color: "#64748b", marginTop: 0 }}>
                This will clear the flag reason and restore the sensor status to{" "}
                <strong>ACTIVE</strong>.
              </p>
            </div>
          )}
          <div style={{ display: "flex", gap: "10px" }}>
            <Btn variant="secondary" onClick={closeModal} style={{ flex: 1 }}>
              Cancel
            </Btn>
            <Btn variant="danger" onClick={handleFlag} style={{ flex: 1 }}>
              {selected?.isFlagged ? "Unflag" : "Flag Sensor"}
            </Btn>
          </div>
        </Modal>
      )}

      {modal === "delete" && (
        <Modal title="Delete Sensor" onClose={closeModal}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🗑️</div>
            <p style={{ color: "#475569", fontSize: "14px" }}>
              Are you sure you want to delete{" "}
              <strong>{selected?.sensorId}</strong>?<br />
              This cannot be undone.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Btn variant="secondary" onClick={closeModal} style={{ flex: 1 }}>
              Cancel
            </Btn>
            <Btn variant="danger" onClick={handleDelete} style={{ flex: 1 }}>
              Yes, Delete
            </Btn>
          </div>
        </Modal>
      )}

      {modal === "simulate" && (
        <Modal
          title={`Simulate Reading — ${selected?.sensorId}`}
          onClose={closeModal}
        >
          <p style={{ fontSize: "13px", color: "#64748b", marginTop: 0 }}>
            Send a test reading. This will update the bin's fill level in real
            time.
          </p>
          <form onSubmit={handleSimulate}>
            <Input
              label="Distance (cm) *"
              type="number"
              step="0.1"
              min="0"
              required
              placeholder="e.g. 45.5"
              value={simForm.distanceCm}
              onChange={(e) =>
                setSimForm({ ...simForm, distanceCm: e.target.value })
              }
            />
            <Input
              label="Battery Level (%)"
              type="number"
              min="0"
              max="100"
              value={simForm.battery}
              onChange={(e) =>
                setSimForm({ ...simForm, battery: e.target.value })
              }
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <Btn
                variant="secondary"
                type="button"
                onClick={closeModal}
                style={{ flex: 1 }}
              >
                Cancel
              </Btn>
              <Btn variant="blue" type="submit" style={{ flex: 1 }}>
                📡 Send Reading
              </Btn>
            </div>
          </form>
        </Modal>
      )}

      {modal === "battery" && (
        <Modal
          title={`Update Battery — ${selected?.sensorId}`}
          onClose={closeModal}
        >
          <p
            style={{
              fontSize: "13px",
              color: "#64748b",
              marginTop: 0,
              marginBottom: "16px",
            }}
          >
            Manually update the battery level (e.g. after replacement).
          </p>
          <Input
            label="Battery Level (%)"
            type="number"
            min="0"
            max="100"
            value={batteryLevel}
            onChange={(e) => setBatteryLevel(e.target.value)}
          />
          <div style={{ display: "flex", gap: "10px" }}>
            <Btn variant="secondary" onClick={closeModal} style={{ flex: 1 }}>
              Cancel
            </Btn>
            <Btn
              variant="amber"
              onClick={handleBatteryUpdate}
              style={{ flex: 1 }}
            >
              Update Battery
            </Btn>
          </div>
        </Modal>
      )}

      {modal === "status" && (
        <Modal
          title={`Override Status — ${selected?.sensorId}`}
          onClose={closeModal}
        >
          <p
            style={{
              fontSize: "13px",
              color: "#64748b",
              marginTop: 0,
              marginBottom: "16px",
            }}
          >
            Manually override the sensor status.
          </p>
          <Select
            label="New Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
          >
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </Select>
          <div style={{ display: "flex", gap: "10px" }}>
            <Btn variant="secondary" onClick={closeModal} style={{ flex: 1 }}>
              Cancel
            </Btn>
            <Btn onClick={handleStatusUpdate} style={{ flex: 1 }}>
              Set Status
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

const styles = {
  pageContainer: {
    padding: "32px 48px",
    background: "#f8fafc",
    minHeight: "100vh",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: "#334155",
  },
  toast: {
    position: "fixed",
    top: "24px",
    right: "24px",
    padding: "12px 24px",
    borderRadius: "8px",
    fontWeight: "500",
    zIndex: 9999,
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
    animation: "slideIn 0.3s ease-out",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  title: { margin: 0, fontSize: "24px", fontWeight: "700", color: "#0f172a" },
  card: {
    background: "white",
    borderRadius: "8px",
    boxShadow: "0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06)",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
  },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  tableHeader: {
    backgroundColor: "#f1f5f9",
    borderBottom: "1px solid #e2e8f0",
  },
  th: {
    padding: "16px 24px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  tableRow: { borderBottom: "1px solid #f1f5f9" },
  td: {
    padding: "20px 24px",
    fontSize: "14px",
    color: "#334155",
    verticalAlign: "middle",
  },
  tdBold: {
    padding: "20px 24px",
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a",
  },
  loadingCell: { padding: "48px", textAlign: "center", color: "#64748b" },
  emptyCell: { padding: "64px", textAlign: "center", color: "#94a3b8" },
  editLink: {
    color: "#3b82f6",
    cursor: "pointer",
    fontSize: "12px",
    marginLeft: "4px",
    fontWeight: "500",
  },
  unassignedText: { color: "#94a3b8", fontStyle: "italic", fontSize: "13px" },
  batteryContainer: {
    width: "60px",
    height: "6px",
    background: "#e2e8f0",
    borderRadius: "3px",
    overflow: "hidden",
    display: "inline-block",
    verticalAlign: "middle",
  },
  batteryBar: {
    height: "100%",
    borderRadius: "3px",
    transition: "width 0.3s ease",
  },
  actionBtnFlag: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    background: "#fee2e2",
    color: "#ef4444",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
  },
  actionBtnUnflag: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    background: "#dcfce7",
    color: "#16a34a",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
  },
  iconBtn: {
    padding: "6px",
    borderRadius: "6px",
    border: "none",
    background: "#f1f5f9",
    cursor: "pointer",
    fontSize: "14px",
  },
  iconBtnDelete: {
    padding: "6px",
    borderRadius: "6px",
    border: "none",
    background: "#fee2e2",
    cursor: "pointer",
    fontSize: "14px",
  },
  historyHeader: {
    padding: "20px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    borderBottom: "1px solid #f1f5f9",
    background: "#fafafa",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(15, 23, 42, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backdropFilter: "blur(2px)",
  },
  modalContent: {
    background: "white",
    padding: "24px",
    borderRadius: "12px",
    width: "450px",
    maxWidth: "90vw",
    boxShadow:
      "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "16px",
    marginBottom: "0",
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#94a3b8",
    lineHeight: 1,
  },
  label: {
    display: "block",
    marginBottom: "6px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#475569",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    fontSize: "14px",
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.2s",
  },
};

export default SensorPage;
