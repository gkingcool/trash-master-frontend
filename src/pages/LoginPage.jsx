// src/pages/LoginPage.jsx
import React from "react";
import Login from "../components/auth/Login";

export default function LoginPage() {
  const handleLoginSuccess = () => {
    // Redirect based on role stored in localStorage
    const auth = JSON.parse(localStorage.getItem("auth") || "{}");
    const role = auth.role;

    if (role === "Driver") {
      window.location.href = "/driver";
    } else {
      window.location.href = "/dashboard";
    }
  };

  return <Login onLoginSuccess={handleLoginSuccess} />;
}
