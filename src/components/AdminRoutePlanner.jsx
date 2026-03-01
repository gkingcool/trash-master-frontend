// src/components/AdminRoutePlanner.jsx
import React, { useState } from "react";
import stopIcon from "../assets/icons/stop-icon.png";
import timeIcon from "../assets/icons/time-icon.png";

const AdminRoutePlanner = () => {
  const [routeDateTime, setRouteDateTime] = useState("2026-10-24T08:00");
  const [driversAvailable, setDriversAvailable] = useState("3");
  const [shiftDuration, setShiftDuration] = useState("4");
  const [startingDepot, setStartingDepot] = useState("central-hq");
  const [strategy, setStrategy] = useState("predictive");

  return (
    <div className="admin-route-planner-content">
      <style>{`
        .admin-route-planner-content {
          display: flex;
          height: 100%;
          background: #f5f7fa;
        }
        
        .form-section {
          width: 380px;
          padding: 25px;
          background: white;
          border-right: 1px solid #edf2f7;
          overflow-y: auto;
        }
        
        .form-section h2 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 20px;
          text-align: center;
          color: #2d3748;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          color: #4a5568;
          font-weight: 500;
        }
        
        .form-group input,
        .form-group select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #cbd5e0;
          border-radius: 4px;
          font-size: 14px;
          background: white;
        }
        
        .radio-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .radio-group label {
          display: flex;
          align-items: center;
          cursor: pointer;
          font-size: 14px;
        }
        
        .radio-group input {
          margin-right: 8px;
          width: 16px;
          height: 16px;
        }
        
        /* Green accent for selection bar */
        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #38A169; /* GREEN */
          box-shadow: 0 0 0 2px rgba(56, 161, 105, 0.2);
        }
        
        .generate-btn {
          width: 100%;
          padding: 12px;
          background: #1a202c; /* BLACK */
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 10px;
        }
        
        .generate-btn:hover {
          background: #2d3748;
        }
        
        .map-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 25px;
          overflow: hidden;
        }
        
        .map-placeholder {
          flex: 1;
          background: #edf2f7;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: #718096;
          margin-bottom: 20px;
        }
        
        .driver-cards {
          display: flex;
          gap: 20px;
          justify-content: space-between;
        }
        
        .driver-card {
          flex: 1;
          padding: 15px;
          border-radius: 8px 8px 8px 8px;
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          text-align: center;
          position: relative;
        }
        
        /* Colored bottom border */
        .driver-card::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          border-radius: 0 0 8px 8px;
        }

        .driver-card.blue::after { background: #3182ce; }
        .driver-card.red::after { background: #e53e3e; }
        .driver-card.green::after { background: #38a169; }
        
        .driver-card h3 {
          margin: 0 0 12px;
          font-size: 16px;
          font-weight: 600;
          padding-bottom: 8px;
          border-bottom: 2px solid #cbd5e0; /* gray underline */
        }
        
        .driver-card p {
          margin: 6px 0;
          font-size: 14px;
          color: #4a5568;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        
        .driver-card img {
          width: 16px;
          height: 16px;
          opacity: 0.8;
        }
      `}</style>

      <section className="form-section">
        <h2>Generate Daily Routes</h2>

        <div className="form-group">
          <label>Date & Time</label>
          <input
            type="datetime-local"
            value={routeDateTime}
            onChange={(e) => setRouteDateTime(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Drivers Available</label>
          <select
            value={driversAvailable}
            onChange={(e) => setDriversAvailable(e.target.value)}
          >
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </div>

        <div className="form-group">
          <label>Shift Duration</label>
          <select
            value={shiftDuration}
            onChange={(e) => setShiftDuration(e.target.value)}
          >
            <option value="4">4 hours</option>
            <option value="6">6 hours</option>
            <option value="8">8 hours</option>
          </select>
        </div>

        <div className="form-group">
          <label>Starting Depot</label>
          <select
            value={startingDepot}
            onChange={(e) => setStartingDepot(e.target.value)}
          >
            <option value="central-hq">Central HQ - Bellevue</option>
            <option value="east-depot">East Depot</option>
            <option value="west-depot">West Depot</option>
          </select>
        </div>

        <div className="form-group">
          <label>Strategy</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="strategy"
                value="predictive"
                checked={strategy === "predictive"}
                onChange={(e) => setStrategy(e.target.value)}
              />
              Smart Route (Predictive)
            </label>
            <label>
              <input
                type="radio"
                name="strategy"
                value="simple"
                checked={strategy === "simple"}
                onChange={(e) => setStrategy(e.target.value)}
              />
              Smart Route
            </label>
          </div>
        </div>

        <button className="generate-btn">Generate Routes</button>
      </section>

      <section className="map-section">
        <div className="map-placeholder">Map Placeholder</div>

        <div className="driver-cards">
          <div className="driver-card blue">
            <h3>Driver 1 (Blue)</h3>
            <p>
              <img src={stopIcon} alt="Stops" /> 14 Stops
            </p>
            <p>
              <img src={timeIcon} alt="Time" /> 3h 45m
            </p>
          </div>
          <div className="driver-card red">
            <h3>Driver 2 (Red)</h3>
            <p>
              <img src={stopIcon} alt="Stops" /> 16 Stops
            </p>
            <p>
              <img src={timeIcon} alt="Time" /> 3h 55m
            </p>
          </div>
          <div className="driver-card green">
            <h3>Driver 3 (Green)</h3>
            <p>
              <img src={stopIcon} alt="Stops" /> 15 Stops
            </p>
            <p>
              <img src={timeIcon} alt="Time" /> 3h 50m
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminRoutePlanner;
