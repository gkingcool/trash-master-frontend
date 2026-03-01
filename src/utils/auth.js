// src/utils/auth.js

export const checkAuth = () => {
  try {
    const stored = localStorage.getItem("auth");
    if (!stored) return false;
    const data = JSON.parse(stored);
    return data.isAuthenticated === true;
  } catch (e) {
    return false;
  }
};

export const getUserRole = () => {
  try {
    const stored = localStorage.getItem("auth");
    if (!stored) return null;
    const data = JSON.parse(stored);
    // Return exactly "Admin" or "Driver" (case-sensitive)
    return data.role === "Admin"
      ? "Admin"
      : data.role === "Driver"
        ? "Driver"
        : null;
  } catch (e) {
    return null;
  }
};
