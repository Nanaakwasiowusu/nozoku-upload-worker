// src/pages/Profile.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, arrayRemove, deleteDoc } from "firebase/firestore";
import { FaUserCircle, FaEllipsisV } from "react-icons/fa";
import { supabase } from "../SupabaseClient";

function Profile() {
  const [userData, setUserData] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [media, setMedia] = useState([]);
  const menuRef = useRef();
  const navigate = useNavigate();

  // Close menu if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load ONLY the current logged-in user's data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      setCurrentUserId(user.uid);

      const userRef = doc(db, "users", user.uid);

      try {
        const userSnap = await getDoc(userRef);

        // First-time profile creation
        if (!userSnap.exists()) {
          const newUser = {
            uid: user.uid,
            displayName: user.displayName || "No name set",
            email: user.email,
            posts: 0,
            subscribers: [],
            following: 0,
            bio: "Welcome to Nozoku!",
            isCreator: false,
            media: [],
            subscriptionMode: "free",
          };

          await setDoc(userRef, newUser);

          setUserData(newUser);
          setMedia([]);
        } else {
          const data = userSnap.data();
          setUserData(data);
          setMedia(data.media || []); // media is now an array of objects { url, postId }
        }
      } catch (err) {
        console.error("Failed to load Firestore user data:", err);
      }
    });

    return unsubscribe;
  }, [navigate]);

  if (!userData) return <p style={{ textAlign: "center" }}>Loading profile...</p>;

  // Menu actions
  const handleMenuAction = (action) => {
    setMenuOpen(false);
    if (action === "logout") {
      signOut(auth).then(() => navigate("/login"));
    } else if (action === "edit") {
      navigate(`/settings/edit-profile`);
    } else if (action === "settings") {
      navigate("/settings");
    } else if (action === "transactions") {
      navigate("/transactions");
    }
  };

  // Delete post (updated)
  const handleDeletePost = async (item) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const userRef = doc(db, "users", userData.uid);

      // 1️⃣ Remove from user's media array
      await updateDoc(userRef, { media: arrayRemove(item) });
      setMedia((prev) => prev.filter((m) => m.postId !== item.postId));

      // 2️⃣ Delete from homepage posts collection
      if (item.postId) {
        const postRef = doc(db, "posts", item.postId);
        await deleteDoc(postRef);
      }

      // 3️⃣ Optional: delete file from Supabase storage
      const path = item.url.split("/storage/v1/object/public/Uploads/")[1];
      if (path) {
        await supabase.storage.from("Uploads").remove([path]);
      }

      alert("Post deleted successfully!");
    } catch (err) {
      console.error("Failed to delete post:", err);
      alert("Could not delete post. Try again.");
    }
  };

  return (
    <div className="profile-page" style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div className="profile-card card">
        {/* Top Section */}
        <div className="profile-header" style={{ position: "relative" }}>
          <FaUserCircle size={80} className="profile-pic" />

          <div className="profile-info">
            <h2>{userData.displayName}</h2>
            <p className="bio">{userData.bio}</p>

            {userData.isCreator && (
              <span
                style={{
                  backgroundColor: "#0aa83f",
                  color: "#fff",
                  padding: "3px 8px",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                }}
              >
                Creator
              </span>
            )}
          </div>

          {/* Three-dot menu */}
          <div ref={menuRef} style={{ position: "absolute", top: "10px", right: "10px" }}>
            <FaEllipsisV
              size={20}
              color="#fff"
              style={{ cursor: "pointer" }}
              onClick={() => setMenuOpen((prev) => !prev)}
            />
            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "25px",
                  right: "0",
                  backgroundColor: "#111",
                  border: "1px solid #ff69b4",
                  borderRadius: "8px",
                  minWidth: "160px",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
                  zIndex: 10,
                }}
              >
                <div onClick={() => handleMenuAction("edit")} className="menu-item">
                  Edit Profile
                </div>
                <div onClick={() => handleMenuAction("settings")} className="menu-item">
                  Settings
                </div>
                {userData.isCreator && (
                  <div onClick={() => handleMenuAction("transactions")} className="menu-item">
                    Transactions
                  </div>
                )}
                <div onClick={() => handleMenuAction("logout")} className="menu-item">
                  Logout
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="profile-stats">
          <div className="stat">
            <span className="stat-number">{media.length || 0}</span>
            <span className="stat-label">Posts</span>
          </div>
          <div className="stat">
            <span className="stat-number">{userData.subscribers?.length || 0}</span>
            <span className="stat-label">Subscribers</span>
          </div>
          <div className="stat">
            <span className="stat-number">{userData.following}</span>
            <span className="stat-label">Following</span>
          </div>
        </div>

        {/* Transactions Box */}
        <div
          className="transactions-box"
          style={{
            backgroundColor: "#222",
            padding: "20px",
            borderRadius: "10px",
            marginTop: "20px",
            textAlign: "center",
          }}
        >
          <h3>Transactions</h3>
          <p>Top up your wallet to tip creators and support content you love.</p>

          <button
            onClick={() => navigate("/transactions")}
            style={{
              backgroundColor: "#0aa83f",
              border: "none",
              color: "#fff",
              borderRadius: "8px",
              padding: "8px 16px",
              cursor: "pointer",
              marginTop: "10px",
            }}
          >
            Go to Transactions
          </button>
        </div>

        {/* Posts Grid */}
        <div
          className="posts-grid mt-3"
          style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}
        >
          {media.length > 0 ? (
            media.map((item, idx) => (
              <div
                key={idx}
                className="post-item"
                style={{
                  width: "150px",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
              >
                <img
                  src={item.url}
                  alt={`post-${idx}`}
                  style={{
                    width: "100%",
                    height: "150px",
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                />

                {/* Delete button */}
                <button
                  onClick={() => handleDeletePost(item)}
                  style={{
                    position: "absolute",
                    top: "5px",
                    right: "5px",
                    backgroundColor: "rgba(0,0,0,0.6)",
                    border: "none",
                    color: "#ff4444",
                    fontWeight: "bold",
                    fontSize: "16px",
                    borderRadius: "50%",
                    width: "30px",
                    height: "30px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
            ))
          ) : (
            <p style={{ color: "#888", width: "100%", textAlign: "center" }}>
              No posts yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
