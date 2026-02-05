// src/utils/auth.js
export const login = (username, password) => {
  if (username === 'admin' && password === 'password') {
    localStorage.setItem('auth', JSON.stringify({ isAuthenticated: true }));
    return true;
  }
  return false;
};

export const logout = () => {
  localStorage.removeItem('auth');
};

export const checkAuth = () => {
  const stored = localStorage.getItem('auth');
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