// src/pages/SettingsPages/Settings.jsx
import React, { useEffect, useState } from "react";
import { auth, db, storage } from "../../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import CreatorDashboard from "./CreatorDashboard";

function Settings() {
  const [userData, setUserData] = useState(null);
  const [verificationFiles, setVerificationFiles] = useState({ id: null, selfie: null });
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [verified, setVerified] = useState(false);
  const [monetizationEnabled, setMonetizationEnabled] = useState(false);

  // NEW SETTINGS STATES
  const [hideWallet, setHideWallet] = useState(false);
  const [messagePrivacy, setMessagePrivacy] = useState("everyone");
  const [notifSettings, setNotifSettings] = useState({
    followers: true,
    purchases: true,
    messages: true,
    updates: true,
  });

  // MODAL STATES
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1); // 1 = ID, 2 = Selfie
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const loadUserData = async () => {
      const user = auth.currentUser;
      if (!user) return navigate("/login");

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        setVerified(data.verified || false);
        setAwaitingVerification(!data.verified && !!data.verification);
        setMonetizationEnabled(data.isCreator || false);

        setHideWallet(data.hideWallet || false);
        setMessagePrivacy(data.messagePrivacy || "everyone");
        setNotifSettings(
          data.notifications || {
            followers: true,
            purchases: true,
            messages: true,
            updates: true,
          }
        );
      }
    };
    loadUserData();
  }, [navigate]);

  // Upload both ID & Selfie
  const handleVerificationUpload = async () => {
    if (!verificationFiles.id || !verificationFiles.selfie)
      return alert("Upload both ID & selfie");

    try {
      const idRef = ref(storage, `verification/${userData.uid}/id`);
      const selfieRef = ref(storage, `verification/${userData.uid}/selfie`);

      await uploadBytes(idRef, verificationFiles.id);
      await uploadBytes(selfieRef, verificationFiles.selfie);

      const idURL = await getDownloadURL(idRef);
      const selfieURL = await getDownloadURL(selfieRef);

      await updateDoc(doc(db, "users", userData.uid), {
        verification: { idURL, selfieURL },
        verified: false,
      });

      setVerificationFiles({ id: null, selfie: null });
      setAwaitingVerification(true);
      setShowModal(false);
      setAcceptedTerms(false);
      alert("Verification uploaded. Wait for admin approval.");
    } catch (err) {
      console.error(err);
      alert("Upload failed. Try again.");
    }
  };

  const handleEnableMonetization = async () => {
    if (!verified) return alert("You must be verified before enabling monetization.");
    try {
      await updateDoc(doc(db, "users", userData.uid), { isCreator: true });
      setMonetizationEnabled(true);
      alert("Monetization enabled!");
    } catch (err) {
      console.error(err);
      alert("Failed to enable monetization. Try again.");
    }
  };

  const saveNewSettings = async () => {
    try {
      await updateDoc(doc(db, "users", userData.uid), {
        hideWallet,
        messagePrivacy,
        notifications: notifSettings,
      });
      alert("Settings saved!");
    } catch (err) {
      console.error(err);
      alert("Failed to save settings.");
    }
  };

  if (!userData) return <p>Loading...</p>;

  return (
    <div style={{ maxWidth: "700px", margin: "30px auto", color: "#eee", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "20px", borderBottom: "1px solid #444", paddingBottom: "10px" }}>
        Settings
      </h1>

      {/* MONETIZATION SECTION */}
      <div
        style={{
          backgroundColor: "#1f1f1f",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
          marginBottom: "30px",
        }}
      >
        <h2 style={{ fontSize: "1.4rem", marginBottom: "10px" }}>Monetization</h2>

        {/* Enable/Disable Button */}
        <button
          onClick={() => {
            if (monetizationEnabled) {
              updateDoc(doc(db, "users", userData.uid), { isCreator: false });
              setMonetizationEnabled(false);
              alert("Monetization disabled.");
            } else {
              if (verified) {
                handleEnableMonetization();
              } else {
                setModalStep(1); // start ID step
                setShowModal(true);
              }
            }
          }}
          style={{
            marginTop: "10px",
            padding: "8px 16px",
            backgroundColor: monetizationEnabled ? "#555" : "#ff69b4",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          {monetizationEnabled ? "Disable Monetization" : "Enable Monetization"}
        </button>

        {/* Already verified creators */}
        {verified && monetizationEnabled && <p style={{ marginTop: "15px" }}>You are a verified creator! 🎉</p>}
        {awaitingVerification && <p style={{ marginTop: "15px" }}>Verification submitted. Wait for admin approval.</p>}
      </div>

      {/* CREATOR DASHBOARD */}
      {monetizationEnabled && <CreatorDashboard />}

    {/* MODAL FLOW */}
{showModal && (
  <div style={styles.modalOverlay}>
    <div style={styles.modal}>
      {/* Step Indicator */}
      <p style={{ marginBottom: "10px", color: "#ccc", fontWeight: "bold" }}>
        Step {modalStep} of 2
      </p>

      {/* Progress Bar */}
      <div style={{ backgroundColor: "#333", borderRadius: "5px", height: "8px", marginBottom: "20px" }}>
        <div
          style={{
            width: modalStep === 1 ? "50%" : "100%",
            height: "100%",
            backgroundColor: "#ff69b4",
            borderRadius: "5px",
            transition: "width 0.3s ease",
          }}
        />
      </div>

      {modalStep === 1 && (
        <>
          <h3>Upload Your ID</h3>
          <p>Upload a government-issued ID (passport, driver’s license, or national ID).</p>

          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) =>
              setVerificationFiles((prev) => ({ ...prev, id: e.target.files[0] }))
            }
            style={{ display: "block", marginBottom: "12px" }}
          />

          {/* ✅ Improved Terms & Rules Acceptance */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "#2b2b2b",
              padding: "10px",
              borderRadius: "8px",
              border: acceptedTerms ? "1px solid #0aa83f" : "1px solid #444",
              marginBottom: "15px",
            }}
          >
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              style={{ transform: "scale(1.2)", cursor: "pointer" }}
            />

            <span style={{ fontSize: "0.9rem", color: "#ccc" }}>
              I agree to the{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#0aa83f",
                  textDecoration: "none",
                  fontWeight: "bold",
                }}
              >
                Terms & Rules
              </a>
            </span>
          </div>

          <div style={styles.modalButtons}>
            <button style={styles.modalCancel} onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button
              style={styles.modalConfirm}
              onClick={() => {
                if (!verificationFiles.id) return alert("Upload your ID first.");
                if (!acceptedTerms) return alert("You must accept the Terms & Rules before proceeding.");
                setModalStep(2);
              }}
            >
              Next
            </button>
          </div>
        </>
      )}

      {modalStep === 2 && (
        <>
          <h3>Take a Selfie</h3>
          <p>Take a selfie holding your ID next to your face. Make sure it's clear.</p>

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setVerificationFiles((prev) => ({ ...prev, selfie: e.target.files[0] }))
            }
            style={{ display: "block", marginBottom: "10px" }}
          />

          <div style={styles.modalButtons}>
            <button style={styles.modalCancel} onClick={() => setModalStep(1)}>
              Back
            </button>
            <button style={styles.modalConfirm} onClick={handleVerificationUpload}>
              Submit
            </button>
          </div>
        </>
      )}
    </div>
  </div>
)}


      {/* ACCOUNT SETTINGS */}
      <div style={styles.card}>
        <h2>Account Settings</h2>
        <button onClick={() => navigate("/settings/edit-profile")} style={styles.fullWidthButton}>Edit Profile</button>
        <button onClick={() => navigate("/settings/change-password")} style={styles.fullWidthButton}>Change Password</button>
      </div>

      {/* PRIVACY SETTINGS */}
      <div style={styles.card}>
        <h2>Privacy</h2>
        <label style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
          <input type="checkbox" checked={hideWallet} onChange={(e) => setHideWallet(e.target.checked)} />
          Hide Wallet Balance
        </label>
        <div style={{ marginTop: "15px" }}>
          <p>Who can message you?</p>
          <select value={messagePrivacy} onChange={(e) => setMessagePrivacy(e.target.value)} style={styles.select}>
            <option value="everyone">Everyone</option>
            <option value="followers">Followers only</option>
            <option value="noone">No one</option>
          </select>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      <div style={styles.card}>
        <h2>Notifications</h2>
        {Object.keys(notifSettings).map((key) => (
          <label key={key} style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
            <input
              type="checkbox"
              checked={notifSettings[key]}
              onChange={(e) => setNotifSettings((prev) => ({ ...prev, [key]: e.target.checked }))}
            />
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </label>
        ))}
      </div>

      <button onClick={saveNewSettings} style={styles.saveButton}>Save Settings</button>
    </div>
  );
}

// Styles
const styles = {
  card: { backgroundColor: "#1f1f1f", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 8px rgba(0,0,0,0.3)", marginBottom: "30px", color: "#fff" },
  fullWidthButton: { padding: "8px 16px", marginTop: "10px", backgroundColor: "#444", border: "none", borderRadius: "6px", cursor: "pointer", width: "100%" },
  select: { padding: "8px", borderRadius: "6px", width: "100%", backgroundColor: "#333", color: "#fff" },
  saveButton: { marginTop: "30px", padding: "12px 16px", backgroundColor: "#0aa83f", border: "none", borderRadius: "6px", cursor: "pointer", width: "100%", fontWeight: "bold" },

  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 },
  modal: { backgroundColor: "#222", padding: "20px", borderRadius: "10px", textAlign: "center", maxWidth: "400px" },
  modalButtons: { display: "flex", justifyContent: "space-between", marginTop: "15px" },
  modalCancel: { backgroundColor: "#555", color: "#fff", border: "none", borderRadius: "5px", padding: "6px 12px", cursor: "pointer" },
  modalConfirm: { backgroundColor: "#0aa83f", color: "#fff", border: "none", borderRadius: "5px", padding: "6px 12px", cursor: "pointer" },
};

export default Settings;
