// src/pages/SettingsPages/Privacy.jsx
import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function Privacy() {
  const [hideWallet, setHideWallet] = useState(false);
  const [messagePrivacy, setMessagePrivacy] = useState("everyone");
  const navigate = useNavigate();

  useEffect(() => {
    const loadPrivacySettings = async () => {
      const user = auth.currentUser;
      if (!user) return navigate("/login");

      try {
        const snap = await getDoc(doc(db, "users", user.uid));

        if (snap.exists()) {
          const data = snap.data();
          setHideWallet(data.hideWallet || false);
          setMessagePrivacy(data.messagePrivacy || "everyone");
        }
      } catch (err) {
        console.error("Error loading privacy settings:", err);
        alert("Failed to load privacy settings.");
      }
    };

    loadPrivacySettings();
  }, [navigate]);

  const savePrivacy = async () => {
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        hideWallet,
        messagePrivacy,
      });
      alert("Privacy settings saved!");
      navigate("/settings");
    } catch (err) {
      console.error("Error saving privacy settings:", err);
      alert("Failed to save privacy settings.");
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "20px auto", color: "#fff" }}>
      <h2>Privacy Settings</h2>

      <label style={{ display: "flex", gap: "10px", marginTop: "20px", alignItems: "center" }}>
        <input
          type="checkbox"
          checked={hideWallet}
          onChange={(e) => setHideWallet(e.target.checked)}
        />
        Hide Wallet Balance
      </label>

      <div style={{ marginTop: "20px" }}>
        <p>Who can message you?</p>
        <select
          value={messagePrivacy}
          onChange={(e) => setMessagePrivacy(e.target.value)}
          style={{
            padding: "8px",
            width: "100%",
            borderRadius: "6px",
            backgroundColor: "#333",
            color: "#fff",
          }}
        >
          <option value="everyone">Everyone</option>
          <option value="followers">Followers Only</option>
          <option value="noone">No One</option>
        </select>
      </div>

      <button
        onClick={savePrivacy}
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

export default Privacy;
