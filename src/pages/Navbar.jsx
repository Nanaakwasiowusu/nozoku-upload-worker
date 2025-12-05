// src/pages/Navbar.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  arrayUnion,
  query,
  orderBy,
  onSnapshot,
  where,
  Timestamp,
} from "firebase/firestore";
import { FaBell, FaBars, FaTimes, FaCommentDots } from "react-icons/fa";
import { supabase } from "../SupabaseClient";

function Navbar() {
  const navigate = useNavigate();
  const [queryText, setQueryText] = useState("");
  const [creators, setCreators] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [latestConversation, setLatestConversation] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMessengerTip, setShowMessengerTip] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // -------------------------------
  // Upload handler with progress & postId
  // -------------------------------
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const currentUser = auth.currentUser;
    if (!currentUser) return alert("You must be logged in to upload.");

    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `users/${currentUser.uid}/${fileName}`;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress increment
      const simulateProgress = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(simulateProgress);
            return prev;
          }
          return prev + Math.floor(Math.random() * 10) + 5;
        });
      }, 300);

      // Upload to Supabase
      const { error: uploadError } = await supabase.storage
        .from("Uploads")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      clearInterval(simulateProgress);
      setUploadProgress(100);

      // Get public URL
      const { data: urlData, error: urlError } = await supabase.storage
        .from("Uploads")
        .getPublicUrl(filePath);
      if (urlError) throw urlError;

      const publicUrl = urlData.publicUrl;

      // 1️⃣ Add to posts collection (homepage feed)
      const postId = Date.now().toString();
      const postRef = doc(db, "posts", postId);
      await setDoc(postRef, {
        userId: currentUser.uid,
        username: currentUser.displayName || currentUser.email || "Unknown User",
        mediaURL: publicUrl,
        createdAt: Timestamp.now(),
      });

      // 2️⃣ Add to user's media array with postId (for profile)
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        media: arrayUnion({ url: publicUrl, postId }),
      });

      alert("Upload successful!");
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed. Check console.");
    } finally {
      setUploadProgress(0);
      setUploading(false);
    }
  };

  // -------------------------------
  // Fetch creators for search
  // -------------------------------
  useEffect(() => {
    const fetchCreators = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        setCreators(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchCreators();
  }, []);

  // -------------------------------
  // Notifications listener
  // -------------------------------
  useEffect(() => {
    if (!auth.currentUser) return;
    const notificationsRef = collection(db, "users", auth.currentUser.uid, "notifications");
    const q = query(notificationsRef, orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setNotifications(notes);
      setUnreadNotifications(notes.filter((n) => !n.read).length);
    });
    return () => unsubscribe();
  }, [auth.currentUser?.uid]);

  // -------------------------------
  // Unread messages listener
  // -------------------------------
  useEffect(() => {
    if (!auth.currentUser) return;
    const conversationsRef = collection(db, "conversations");
    const q = query(conversationsRef, where("participants", "array-contains", auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let unreadCount = 0;
      let latestConvoId = null;
      let latestTimestamp = 0;
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.lastMessage?.unreadBy?.includes(auth.currentUser.uid)) unreadCount++;
        const convoTime = data.lastMessage?.timestamp || data.createdAt?.toMillis?.() || 0;
        if (convoTime > latestTimestamp) {
          latestTimestamp = convoTime;
          latestConvoId = doc.id;
        }
      });
      setUnreadMessages(unreadCount);
      setLatestConversation(latestConvoId);
    });
    return () => unsubscribe();
  }, [auth.currentUser?.uid]);

  // -------------------------------
  // Handle messenger click
  // -------------------------------
  const handleMessengerClick = () => {
    if (latestConversation) navigate(`/messages/${latestConversation}`);
    else navigate("/messages");
  };

  // -------------------------------
  // Mark notifications read
  // -------------------------------
  const markNotificationsRead = async () => {
    const unreadNotes = notifications.filter((n) => !n.read);
    if (unreadNotes.length === 0) return;
    try {
      for (const note of unreadNotes) {
        const noteRef = doc(db, "users", auth.currentUser.uid, "notifications", note.id);
        await updateDoc(noteRef, { read: true });
      }
      setUnreadNotifications(0);
    } catch (err) {
      console.error("Error marking notifications read:", err);
    }
  };

  // -------------------------------
  // Logout
  // -------------------------------
  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login");
    } catch (err) {
      console.error("Failed to log out:", err);
    }
  };

  // -------------------------------
  // Search handlers
  // -------------------------------
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setQueryText(value);
    if (!value.trim()) return setSuggestions([]);
    const lowerQuery = value.toLowerCase().trim();
    const filtered = creators
      .filter((c) => c.id !== auth.currentUser?.uid)
      .filter((c) => {
        const name = (c.displayName || "").toLowerCase().trim();
        const email = (c.email || "").toLowerCase().trim();
        const uid = (c.uid || "").toLowerCase().trim();
        return name.includes(lowerQuery) || email.includes(lowerQuery) || uid.includes(lowerQuery);
      });
    setSuggestions(filtered.slice(0, 6));
  };

  const handleSelectSuggestion = (creatorId) => {
    setQueryText("");
    setSuggestions([]);
    navigate(`/creator/${creatorId}`);
  };

  return (
    <nav className="navbar-container">
      {/* Logo */}
      <div className="navbar-logo">
        <Link to="/" className="navbar-link">Nozoku</Link>
      </div>

      {/* Mobile Toggle */}
      <div className="navbar-mobile-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
      </div>

      {/* Menu */}
      <div className={`navbar-menu ${menuOpen ? "open" : ""}`}>
        {/* Search */}
        <div className="navbar-search-container">
          <input
            type="text"
            placeholder="Search..."
            value={queryText}
            onChange={handleSearchChange}
            className="navbar-search"
          />
          {queryText.trim() !== "" && (
            <ul className="navbar-suggestions">
              {suggestions.length > 0 ? (
                suggestions.map((creator) => (
                  <li
                    key={creator.id}
                    onClick={() => handleSelectSuggestion(creator.id)}
                    className="navbar-suggestion-item"
                  >
                    <strong>{creator.displayName || "Unnamed User"}</strong>
                    <br />
                    <small>{creator.email || "No Email"}</small>
                  </li>
                ))
              ) : (
                <li className="navbar-suggestion-item no-result">User not found</li>
              )}
            </ul>
          )}
        </div>

        {/* Links */}
        <Link to="/" className="navbar-link">Home</Link>
        <Link to="/profile" className="navbar-link">Profile</Link>

        {/* Messenger */}
        <div
          className="navbar-icon-wrapper"
          onClick={handleMessengerClick}
          onMouseEnter={() => setShowMessengerTip(true)}
          onMouseLeave={() => setShowMessengerTip(false)}
        >
          <FaCommentDots className="navbar-icon" />
          {unreadMessages > 0 && <span className="navbar-badge">{unreadMessages}</span>}
          {showMessengerTip && <span className="navbar-tooltip">Messenger</span>}
        </div>

        {/* Upload */}
        <div>
          <input
            type="file"
            accept="image/*,video/*"
            id="navbar-upload-input"
            style={{ display: "none" }}
            onChange={handleUpload}
          />
          <label htmlFor="navbar-upload-input" className="navbar-upload-button">Upload</label>

          {uploading && (
            <div style={{ marginTop: "5px", width: "100%" }}>
              <div
                style={{
                  height: "6px",
                  width: `${uploadProgress}%`,
                  backgroundColor: "#4ade80",
                  borderRadius: "3px",
                  transition: "width 0.2s ease",
                }}
              ></div>
              <small>{uploadProgress}%</small>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="navbar-icon-wrapper" onClick={markNotificationsRead}>
          <FaBell className="navbar-icon" />
          {unreadNotifications > 0 && <span className="navbar-badge">{unreadNotifications}</span>}
        </div>

        {/* Logout */}
        <button onClick={handleLogout} className="navbar-logout-button">Logout</button>
      </div>
    </nav>
  );
}

export default Navbar;
