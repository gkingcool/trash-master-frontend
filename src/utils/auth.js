// src/utils/auth.js
// Mock user database (replace with real API later)
const USERS = [
  { username: "admin", password: "password", role: "Admin" },
  { username: "driver", password: "driverpass", role: "Driver" },
  // Add more users as needed
];

export const login = (username, password) => {
  const user = USERS.find(
    (u) => u.username === username && u.password === password,
  );
  if (user) {
    localStorage.setItem(
      "auth",
      JSON.stringify({
        isAuthenticated: true,
        username: user.username,
        role: user.role,
        timestamp: Date.now(),
      }),
    );
    return true;
  }
  return false;
};

export const logout = () => {
  localStorage.removeItem("auth");
};

export const checkAuth = () => {
  const stored = localStorage.getItem("auth");
  if (stored) {
    try {
      const data = JSON.parse(stored);
      return data.isAuthenticated === true;
    } catch (e) {
      return false;
    }
  }
  return false;
};

export const getUserRole = () => {
  const stored = localStorage.getItem("auth");
  if (stored) {
    try {
      const data = JSON.parse(stored);
      return data.role || "Admin"; // default to Admin if missing
    } catch (e) {
      return "Admin";
    }
  }
  return null;
};
