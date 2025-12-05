// src/pages/SettingsPages/EditProfile.jsx
import React, { useEffect, useState } from "react";
import { auth, db, storage } from "../../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function EditProfile() {
  const [userdata, setUserdata] = useState(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      const user = auth.currentUser;
      if (!user) return navigate("/login");

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setUserdata(data);
          setUsername(data.username || "");
          setBio(data.bio || "");
        }
      } catch (err) {
        console.error("Failed to load user data:", err);
        alert("Failed to load profile.");
      }
    };

    loadUser();
  }, [navigate]);

  const saveProfile = async () => {
    const user = auth.currentUser;
    if (!user) return navigate("/login");

    try {
      const userRef = doc(db, "users", user.uid);
      let avatarURL = userdata?.avatar || null;

      if (avatar) {
        const avatarRef = ref(storage, `avatars/${user.uid}`);
        await uploadBytes(avatarRef, avatar);
        avatarURL = await getDownloadURL(avatarRef);
      }

      await updateDoc(userRef, {
        username,
        bio,
        avatar: avatarURL,
      });

      alert("Profile updated!");
      navigate("/settings");
    } catch (err) {
      console.error("Failed to save profile:", err);
      alert("Failed to save profile.");
    }
  };

  if (!userdata) return <p>Loading...</p>;

  return (
    <div style={{ maxWidth: "600px", margin: "20px auto", color: "#fff" }}>
      <h2>Edit Profile</h2>

      <label>Username</label>
      <input
        style={{
          width: "100%",
          marginTop: "6px",
          padding: "8px",
          backgroundColor: "#333",
          color: "#fff",
        }}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <label style={{ marginTop: "20px", display: "block" }}>Bio</label>
      <textarea
        style={{ width: "100%", padding: "8px", backgroundColor: "#333", color: "#fff" }}
        value={bio}
        onChange={(e) => setBio(e.target.value)}
      />

      <label style={{ marginTop: "20px", display: "block" }}>Profile Picture</label>
      <input type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files[0])} />

      <button
        onClick={saveProfile}
        style={{
          marginTop: "20px",
          width: "100%",
          padding: "10px",
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

export default EditProfile;
