// src/components/auth/ResetPassword.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import "./login.css";
import logo from "../../assets/icons/recycling-icon.png";
import truck from "../../assets/icons/truck.png";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setError(
        "Reset token is missing. Please request a new password reset link.",
      );
      setTokenValid(false);
      return;
    }

    const validateToken = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8080/api/auth/validate-token?token=${token}`,
        );
        setTokenValid(response.data.valid);
        if (!response.data.valid) {
          setError(
            "This reset link has expired or is invalid. Please request a new one.",
          );
        }
      } catch (err) {
        setTokenValid(false);
        setError("Failed to validate reset link. Please request a new one.");
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Password strength check
    const hasUpperCase = /[A-Z]/.test(formData.password);
    const hasLowerCase = /[a-z]/.test(formData.password);
    const hasNumbers = /\d/.test(formData.password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      setError("Password must contain uppercase, lowercase, and numbers");
      return;
    }

    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }

    setLoading(true);

    try {
      await axios.post("http://localhost:8080/api/auth/reset-password", {
        token: token,
        newPassword: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to reset password. Token may be expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Invalid token state
  if (tokenValid === false) {
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
            <div className="login-form" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "64px", marginBottom: "24px" }}>⚠️</div>
              <h2>Invalid Reset Link</h2>
              <p style={{ color: "#666", marginBottom: "24px" }}>{error}</p>
              <button
                className="login-button"
                onClick={() => navigate("/forgot-password")}
              >
                Request New Reset Link
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
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
            <div className="login-form" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "64px", marginBottom: "16px" }}>✅</div>
              <h2>Password Reset Successful!</h2>
              <p style={{ color: "#666", marginBottom: "24px" }}>
                Your password has been updated successfully. Redirecting to
                login...
              </p>
              <div
                style={{
                  display: "inline-block",
                  width: "20px",
                  height: "20px",
                  border: "3px solid #e2e8f0",
                  borderRadius: "50%",
                  borderTopColor: "#38a169",
                  animation: "spin 1s linear infinite",
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal reset form
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
            <h2>Reset Password</h2>
            <p style={{ color: "#666", marginBottom: "24px" }}>
              Create a new strong password for your account
            </p>

            {error && (
              <p
                style={{ color: "red", marginBottom: "15px", fontSize: "14px" }}
              >
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="password">New Password</label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Enter new password"
                    required
                    disabled={loading || tokenValid === false}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="password-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Confirm new password"
                    required
                    disabled={loading || tokenValid === false}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "16px",
                  fontSize: "13px",
                  color: "#4a5568",
                  marginBottom: "20px",
                }}
              >
                <strong>Password Requirements:</strong>
                <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
                  <li>At least 8 characters long</li>
                  <li>Contains uppercase letter (A-Z)</li>
                  <li>Contains lowercase letter (a-z)</li>
                  <li>Contains number (0-9)</li>
                </ul>
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={loading || tokenValid === false}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>

            <button className="link-button" onClick={() => navigate("/login")}>
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
