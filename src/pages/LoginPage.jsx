import React from "react";
import Login from "../components/auth/Login";

export default function LoginPage() {
  const handleLoginSuccess = () => {
    // Instead of reload, update parent via context or just let App re-check on next render
    // Since we use useState initializer, we need to force re-render → easiest: reload
    window.location.reload();
  };

  return <Login onLoginSuccess={handleLoginSuccess} />;
}
