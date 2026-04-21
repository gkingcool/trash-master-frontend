// src/components/Notifications.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import alertIcon from "../assets/icons/alert-icon.png"; // ✅ Your custom icon

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hoveredId, setHoveredId] = useState(null);

  // Fetch real notifications from backend
  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      // Fetch from your Spring Boot backend
      const response = await axios.get(
        "http://localhost:8080/api/notifications",
      );
      const data = response.data;

      // Admin dashboard should only show general notifications (where driverId is null/empty)
      const adminNotifications = data.filter(
        (n) => !n.driverId || n.driverId.trim() === "",
      );

      setNotifications(adminNotifications);
      // Count unread items
      setUnreadCount(
        adminNotifications.filter((n) => !n.isRead && !n.read).length,
      );
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`http://localhost:8080/api/notifications/${id}/read`);
      setNotifications(
        notifications.map((n) =>
          n.id === id ? { ...n, isRead: true, read: true } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  // ✅ DELETE notification
  const deleteNotification = async (id) => {
    try {
      await axios.delete(`http://localhost:8080/api/notifications/${id}`);
      // Update local state
      setNotifications(notifications.filter((n) => n.id !== id));
      // Update unread count if deleted notification was unread
      const deletedNotif = notifications.find((n) => n.id === id);
      if (deletedNotif && !deletedNotif.isRead && !deletedNotif.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
      alert("Failed to delete notification");
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put("http://localhost:8080/api/notifications/read-all");
      setNotifications(
        notifications.map((n) => ({ ...n, isRead: true, read: true })),
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return "";
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getIconForType = (type) => {
    // Adjust based on your NotificationType enum (ALERT, WARNING, SUCCESS, INFO)
    switch (type) {
      case "ALERT":
        return "🔴";
      case "WARNING":
        return "⚠️";
      case "SUCCESS":
        return "✅";
      default:
        return "🔔";
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          position: "relative",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          cursor: "pointer",
          padding: "8px",
          borderRadius: "50%",
          width: "37px",
          height: "37px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#edf2f7")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#f8fafc")}
      >
        {/* ✅ Using custom alert icon */}
        <img
          src={alertIcon}
          alt="Notifications"
          style={{ width: "16px", height: "16px", objectFit: "contain" }}
        />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "0",
              right: "0",
              background: "#e53e3e",
              color: "white",
              borderRadius: "50%",
              minWidth: "18px",
              height: "18px",
              fontSize: "11px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid white",
              padding: "0 4px",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <>
          {/* Overlay to close when clicking outside */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1999,
            }}
            onClick={() => setShowDropdown(false)}
          />

          {/* Notification Dropdown */}
          <div
            style={{
              position: "absolute",
              top: "50px",
              right: "0",
              width: "380px",
              background: "white",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              zIndex: 2000,
              maxHeight: "450px",
              overflowY: "auto",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#2d3748",
                }}
              >
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#38a169",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "500",
                  }}
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notifications List */}
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  color: "#718096",
                }}
              >
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔔</div>
                <p style={{ margin: 0 }}>No new notifications</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  onMouseEnter={() => setHoveredId(notif.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    padding: "14px 16px",
                    borderBottom: "1px solid #f8fafc",
                    cursor: "pointer",
                    background:
                      notif.isRead || notif.read ? "white" : "#f8fafc",
                    transition: "background 0.2s",
                    position: "relative",
                  }}
                >
                  {/* ✅ DELETE BUTTON - Shows on hover */}
                  {hoveredId === notif.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent marking as read when clicking delete
                        deleteNotification(notif.id);
                      }}
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        background: "#fed7d7",
                        border: "none",
                        color: "#e53e3e",
                        cursor: "pointer",
                        width: "24px",
                        height: "24px",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px",
                        fontWeight: "600",
                        transition: "all 0.2s",
                        zIndex: 10,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#e53e3e";
                        e.currentTarget.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#fed7d7";
                        e.currentTarget.style.color = "#e53e3e";
                      }}
                    >
                      ×
                    </button>
                  )}

                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "flex-start",
                    }}
                  >
                    {/* Icon based on notification type */}
                    <span style={{ fontSize: "20px" }}>
                      {getIconForType(notif.type)}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight:
                            notif.isRead || notif.read ? "400" : "600",
                          fontSize: "14px",
                          color: "#2d3748",
                          marginBottom: "4px",
                        }}
                      >
                        {notif.title}
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#4a5568",
                          marginBottom: "4px",
                          lineHeight: "1.4",
                        }}
                      >
                        {notif.message}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#718096",
                        }}
                      >
                        {getTimeAgo(notif.timestamp)}
                      </div>
                    </div>
                    {/* Unread indicator dot */}
                    {!notif.isRead && !notif.read && (
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          background: "#38a169",
                          borderRadius: "50%",
                          flexShrink: 0,
                          marginTop: "4px",
                        }}
                      />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Notifications;
