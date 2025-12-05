// src/pages/SettingsPages/ChangePassword.jsx
import React, { useState } from "react";
import { auth } from "../../firebase/firebase"; 
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";

function ChangePassword() {
  const navigate = useNavigate();

  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [loading, setLoading] = useState(false);

  const changePassword = async () => {
    if (!currentPass.trim() || !newPass.trim()) {
      alert("Please fill in both fields.");
      return;
    }

    if (newPass.length < 6) {
      alert("New password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in.");
        setLoading(false);
        return;
      }

      const credential = EmailAuthProvider.credential(user.email, currentPass);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPass);

      alert("Password updated successfully!");
      navigate("/settings");
    } catch (error) {
      console.error(error);
      let message = "Something went wrong.";

      if (error.code === "auth/wrong-password") {
        message = "Your current password is incorrect.";
      } else if (error.code === "auth/weak-password") {
        message = "New password is too weak.";
      } else if (error.code === "auth/requires-recent-login") {
        message = "Please log in again to change your password.";
      }

      alert("Failed: " + message);
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "600px", margin: "20px auto", color: "#fff" }}>
      <h2 style={{ marginBottom: "20px" }}>Change Password</h2>

      <label>Current Password</label>
      <input
        type="password"
        value={currentPass}
        onChange={(e) => setCurrentPass(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          marginTop: "6px",
          backgroundColor: "#222",
          color: "#fff",
          border: "1px solid #444",
          borderRadius: "6px",
        }}
      />

      <label style={{ marginTop: "20px", display: "block" }}>New Password</label>
      <input
        type="password"
        value={newPass}
        onChange={(e) => setNewPass(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          marginTop: "6px",
          backgroundColor: "#222",
          color: "#fff",
          border: "1px solid #444",
          borderRadius: "6px",
        }}
      />

      <button
        onClick={changePassword}
        disabled={loading}
        style={{
          marginTop: "30px",
          padding: "12px",
          width: "100%",
          backgroundColor: loading ? "#0a8c33" : "#0aa83f",
          border: "none",
          borderRadius: "6px",
          fontSize: "16px",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

export default ChangePassword;
