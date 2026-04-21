import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";
import logo from "../../assets/icons/recycling-icon.png";
import truck from "../../assets/icons/truck.png";
import axios from "axios";

const Login = () => {
  const navigate = useNavigate();
  // ✅ Renamed username to email
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:8080/api/employees/login",
        {
          email: email.trim(),
          password: password.trim(),
        },
      );

      // ✅ Save auth info to localStorage
      localStorage.setItem(
        "auth",
        JSON.stringify({
          isAuthenticated: true,
          employeeId: response.data.employeeId,
          name: response.data.name,
          role: response.data.role,
          email: response.data.email,
          status: response.data.status,
        }),
      );

      // ✅ Redirect based on role
      if (response.data.role?.toUpperCase() === "DRIVER") {
        window.location.href = "/driver";
      } else if (response.data.role?.toUpperCase() === "ADMIN") {
        window.location.href = "/dashboard";
      } else {
        setError("Unknown role. Contact administrator.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message || "Invalid credentials. Please try again.",
      );
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="left-panel">
        <img src={truck} alt="truck" className="truck-image" />
      </div>

      <div className="right-panel">
        <div className="header">
          <img src={logo} alt="Logo" className="logo-icon" />
          <h1>Trash Master Co.</h1>
        </div>

        <div className="form-container">
          <div className="login-form">
            <h2>Welcome To Trashmaster</h2>
            <p>Please enter your login</p>

            {error && (
              <p
                style={{
                  color: "#e53e3e",
                  marginBottom: "15px",
                  background: "#fed7d7",
                  padding: "10px",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              >
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit}>
              {/* ✅ CHANGED: Updated label and input for Email */}
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g., admin@trashmasters.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>

                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="password-input"
                    required
                    disabled={loading}
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>

                <div className="forgot-password-link">
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="link-button"
                    style={{ marginTop: "8px" }}
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
