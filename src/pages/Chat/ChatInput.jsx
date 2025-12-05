// src/pages/Chat/ChatInput.jsx
import React, { useState } from "react";
import { db, auth } from "../../firebase/firebase";
import { collection, addDoc, doc, updateDoc, serverTimestamp, getDoc, arrayUnion, arrayRemove } from "firebase/firestore";

export default function ChatInput({ conversationId }) {
  const [text, setText] = useState("");

  const sendMessage = async () => {
    if (!text.trim() || !conversationId || !auth.currentUser) return;

    const currentUser = auth.currentUser;
    const convoRef = doc(db, "conversations", conversationId);

    try {
      // Add message to messages subcollection
      const messageData = {
        senderId: currentUser.uid,
        text: text.trim(),
        timestamp: Date.now(),
      };
      await addDoc(collection(db, "conversations", conversationId, "messages"), messageData);

      // Update parent conversation with lastMessage and unreadBy
      const convoSnap = await getDoc(convoRef);
      const participants = convoSnap.exists() ? convoSnap.data().participants || [] : [];

      await updateDoc(convoRef, {
        lastMessage: {
          ...messageData,
          unreadBy: participants.filter((uid) => uid !== currentUser.uid),
        },
      });

      setText("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div
      className="chat-input"
      style={{
        display: "flex",
        gap: "8px",
        padding: "10px",
        borderTop: "1px solid #444",
        backgroundColor: "#1f1f1f",
      }}
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Message..."
        style={{
          flex: 1,
          padding: "8px 12px",
          borderRadius: "12px",
          border: "1px solid #555",
          backgroundColor: "#222",
          color: "#fff",
        }}
      />
      <button
        onClick={sendMessage}
        style={{
          padding: "8px 16px",
          borderRadius: "12px",
          border: "none",
          backgroundColor: "#0aa83f",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        Send
      </button>
    </div>
  );
}
