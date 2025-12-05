import React, { useState } from "react";
import { db, auth } from "../firebase/firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

function UploadMedia() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setMessage("");
    console.log("Selected file:", selectedFile);
  };

  const handleUpload = async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setMessage("❌ You must be logged in to upload.");
      return;
    }

    if (!file) {
      setMessage("❌ Please select a file first.");
      return;
    }

    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `users/${currentUser.uid}/${fileName}`;

    try {
      setUploading(true);
      setMessage("Uploading...");

      // Send file to Firebase Cloud Function → Cloudflare R2
      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", filePath);

      const response = await fetch(
        "https://YOUR_CLOUD_FUNCTION_URL/uploadToR2",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Upload failed");
      }

      const publicUrl = result.url;
      console.log("Cloudflare R2 file URL:", publicUrl);

      // Save URL to Firestore
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { media: arrayUnion(publicUrl) });

      setMessage("✅ Upload successful!");
      setFile(null);
    } catch (err) {
      console.error("Upload error:", err);
      setMessage(`❌ Upload failed: ${err.message || err}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "20px auto", textAlign: "center" }}>
      <h3>Upload Media</h3>

      <input type="file" accept="image/*" onChange={handleFileChange} />

      <button
        onClick={handleUpload}
        disabled={uploading}
        style={{
          marginLeft: "10px",
          backgroundColor: "#ff69b4",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          padding: "5px 10px",
          cursor: uploading ? "not-allowed" : "pointer",
        }}
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {message && (
        <p
          style={{
            marginTop: "10px",
            color: message.startsWith("✅") ? "green" : "red",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}

export default UploadMedia;
