// src/services/sensorApi.js
import axios from "axios";

const SENSOR_BASE = "http://localhost:8080/api/sensors";
const BINS_BASE = "http://localhost:8080/api/bins";

const api = axios.create({
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// ─── READ ───────────────────────────────────────────────
export const getAllSensors = () =>
  api.get(`${SENSOR_BASE}/getAll`).then((r) => r.data);
export const getAllBins = () => api.get(BINS_BASE).then((r) => r.data);
export const getWasteByHour = () =>
  api.get(`${SENSOR_BASE}/history/waste-by-hour`).then((r) => r.data);
export const getRevenueByMonth = () =>
  api.get(`${SENSOR_BASE}/history/revenue-by-month`).then((r) => r.data);

// ─── WRITE / MUTATE ─────────────────────────────────────
// Matches SensorRegistrationRequest.java
export const registerSensor = (payload) =>
  api
    .post(`${SENSOR_BASE}/registerSensor`, {
      sensorId: payload.sensorId,
      binId: payload.binId || null,
      batteryLevel: Number(payload.batteryLevel) || 100,
      status: payload.status || "INACTIVE",
    })
    .then((r) => r.data);

// Matches SensorDataRequest.java
export const sendSensorReading = (payload) =>
  api
    .post(`${SENSOR_BASE}/data`, {
      sensorId: payload.sensorId,
      distanceCm: Number(payload.distanceCm),
      battery: Number(payload.battery) ?? 100,
    })
    .then((r) => r.data);

// Matches SensorFlagRequest.java
export const flagSensor = (sensorId, payload) =>
  api
    .put(`${SENSOR_BASE}/${sensorId}/flag`, {
      flagged: Boolean(payload.flagged),
      reason: payload.flagged ? payload.reason : null,
    })
    .then((r) => r.data);

export const assignSensorToBin = (sensorId, binId) =>
  api
    .put(`${SENSOR_BASE}/${sensorId}/assign/${encodeURIComponent(binId)}`)
    .then((r) => r.data);

export const updateBattery = (sensorId, level) =>
  api
    .put(`${SENSOR_BASE}/${sensorId}/battery/${Number(level)}`)
    .then((r) => r.data);

export const updateStatus = (sensorId, status) =>
  api
    .put(`${SENSOR_BASE}/${sensorId}/status/${status.toUpperCase()}`)
    .then((r) => r.data);

export const deleteSensor = (sensorId) =>
  api.delete(`${SENSOR_BASE}/${sensorId}/remove`).then((r) => r.data);
