// src/pages/SettingsPages/Notifications.jsx
import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";

function Notifications() {
  const [notifSettings, setNotifSettings] = useState({
    followers: true,
    purchases: true,
    messages: true,
    updates: true,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const loadNotifications = async () => {
      const user = auth.currentUser;
      if (!user) return navigate("/login");

      try {
        const snap = await getDoc(doc(db, "users", user.uid));

        if (snap.exists()) {
          setNotifSettings(
            snap.data().notifications || {
              followers: true,
              purchases: true,
              messages: true,
              updates: true,
            }
          );
        }
      } catch (err) {
        console.error("Error loading notifications:", err);
        alert("Failed to load notification settings.");
      }
    };

    loadNotifications();
  }, [navigate]);

  const saveNotifs = async () => {
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        notifications: notifSettings,
      });
      alert("Notification settings updated!");
      navigate("/settings");
    } catch (err) {
      console.error("Error saving notifications:", err);
      alert("Failed to save notification settings.");
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "20px auto", color: "#fff" }}>
      <h2>Notification Settings</h2>

      {Object.keys(notifSettings).map((key) => (
        <label
          key={key}
          style={{ display: "flex", gap: "10px", marginTop: "15px", alignItems: "center" }}
        >
          <input
            type="checkbox"
            checked={notifSettings[key]}
            onChange={(e) =>
              setNotifSettings((prev) => ({
                ...prev,
                [key]: e.target.checked,
              }))
            }
          />
          {key.charAt(0).toUpperCase() + key.slice(1)}
        </label>
      ))}

      <button
        onClick={saveNotifs}
        style={{
          marginTop: "30px",
          padding: "10px",
          width: "100%",
          backgroundColor: "#0aa83f",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Save
      </button>
    </div>
  );
}

export default Notifications;
