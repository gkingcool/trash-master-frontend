// src/utils/settingsStore.js
const STORAGE_KEY = "trashmasters_settings";

const defaultSettings = {
  companyName: "Trash Masters Co.",
  contactEmail: "admin@trashmasters.com",
  phone: "+1 (555) 123-4567",
  address: "123 Green Ave, Bellevue, WA",
  timezone: "America/Los_Angeles",
  dateFormat: "MM/DD/YYYY",
};

// Get settings from LocalStorage or use defaults
export const getSystemSettings = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultSettings;
  } catch {
    return defaultSettings;
  }
};

// Save settings and broadcast update to all pages
export const setSystemSettings = (settings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  // This event triggers the update in DriverPage and AdminRoutePlanner instantly
  window.dispatchEvent(new Event("settings:updated"));
};
