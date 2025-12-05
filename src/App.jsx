// src/App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import "./App.css";

// Pages & Components
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Navbar from "./pages/Navbar";
import Creator from "./pages/Creator";
import Transactions from "./pages/Transactions";
import UploadMedia from "./pages/UploadMedia";
import Homepage from "./pages/Homepage"; // ✅ FIXED

// Settings Pages
import Settings from "./pages/SettingsPages/Settings";
import ChangePassword from "./pages/SettingsPages/ChangePassword";
import EditProfile from "./pages/SettingsPages/EditProfile";
import Notifications from "./pages/SettingsPages/Notifications";
import Privacy from "./pages/SettingsPages/Privacy";

// Chat Page
import Messenger from "./pages/Chat/Messenger";

// Firebase
import { auth } from "./firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";

function App() {
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  // Watermark for creator content pages
  useEffect(() => {
    const isCreatorPage = location.pathname.startsWith("/creator/");
    const existingWM = document.getElementById("nozoku-watermark");

    if (!isCreatorPage || !user) {
      if (existingWM) existingWM.remove();
      return;
    }

    const wm = document.createElement("div");
    wm.id = "nozoku-watermark";
    wm.textContent = user.email || user.uid;
    wm.style.position = "fixed";
    wm.style.top = "50%";
    wm.style.left = "50%";
    wm.style.transform = "translate(-50%, -50%) rotate(-30deg)";
    wm.style.color = "rgba(255,255,255,0.08)";
    wm.style.fontSize = "4rem";
    wm.style.whiteSpace = "nowrap";
    wm.style.pointerEvents = "none";
    wm.style.userSelect = "none";
    wm.style.zIndex = "9999";

    document.body.appendChild(wm);

    const moveWatermark = () => {
      wm.style.top = `${Math.random() * 80 + 10}%`;
      wm.style.left = `${Math.random() * 80 + 10}%`;
    };
    const interval = setInterval(moveWatermark, 5000);

    return () => {
      clearInterval(interval);
      wm.remove();
    };
  }, [user, location]);

  return (
    <div className="app">
      {/* Navbar hidden on login & register */}
      {!["/login", "/register"].includes(location.pathname) && (
        <Navbar user={user} navigate={navigate} />
      )}

      <main>
        <Routes>

          {/* HomePage route (fixed) */}
          <Route path="/" element={<Homepage />} />

          {/* Auth Pages */}
          {!user && <Route path="/login" element={<Login />} />}
          {!user && <Route path="/register" element={<Register />} />}

          {/* Protected Pages */}
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/creator/:creatorId" element={user ? <Creator /> : <Navigate to="/login" />} />
          <Route path="/transactions" element={user ? <Transactions /> : <Navigate to="/login" />} />
          <Route path="/upload" element={user ? <UploadMedia /> : <Navigate to="/login" />} />

          {/* Settings Routes */}
          <Route path="/settings" element={user ? <Settings /> : <Navigate to="/login" />} />
          <Route path="/settings/change-password" element={user ? <ChangePassword /> : <Navigate to="/login" />} />
          <Route path="/settings/edit-profile" element={user ? <EditProfile /> : <Navigate to="/login" />} />
          <Route path="/settings/notifications" element={user ? <Notifications /> : <Navigate to="/login" />} />
          <Route path="/settings/privacy" element={user ? <Privacy /> : <Navigate to="/login" />} />

          {/* Chat Routes */}
          <Route path="/messages" element={user ? <Messenger /> : <Navigate to="/login" />} />
          <Route path="/messages/:conversationId" element={user ? <Messenger /> : <Navigate to="/login" />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />

        </Routes>
      </main>

      <footer>
        <p>&copy; 2025 Nozoku. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
