// src/components/auth/ForgotPassword.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";
import logo from "../../assets/icons/recycling-icon.png";
import truck from "../../assets/icons/truck.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // TODO: Call backend API when ready
      // await axios.post("http://localhost:8080/api/auth/forgot-password", { email });

      // For demo - simulate success
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to send reset email. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

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
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
              <h2>Check Your Email</h2>
              <p style={{ color: "#666", marginBottom: "24px" }}>
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <button
                className="login-button"
                onClick={() => navigate("/login")}
                style={{ marginBottom: "16px" }}
              >
                Back to Login
              </button>
              <p style={{ fontSize: "13px", color: "#999" }}>
                Didn't receive the email?{" "}
                <button
                  className="link-button"
                  onClick={() => setSuccess(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#38a169",
                    cursor: "pointer",
                  }}
                >
                  Try again
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <h2>Forgot Password?</h2>
            <p style={{ color: "#666", marginBottom: "24px" }}>
              Enter your email address and we'll send you a link to reset your
              password.
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
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <button
              className="link-button"
              onClick={() => navigate("/login")}
              style={{
                background: "none",
                border: "none",
                color: "#38a169",
                cursor: "pointer",
                marginTop: "16px",
                fontSize: "14px",
              }}
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
