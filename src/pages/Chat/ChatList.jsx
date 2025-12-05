// src/pages/Chat/ChatList.jsx
import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase/firebase";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";

export default function ChatList({ setSelectedChat }) {
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const convos = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();

          const otherUserId = data.participants.find((uid) => uid !== auth.currentUser.uid);

          const userDoc = await getDoc(doc(db, "users", otherUserId));
          const userData = userDoc.exists()
            ? userDoc.data()
            : { displayName: "Unknown", profilePic: null };

          // Count unread messages for current user
          const unreadCount = data.messages?.filter(
            (msg) => msg.senderId === otherUserId && !msg.readBy?.includes(auth.currentUser.uid)
          ).length || 0;

          return {
            id: docSnap.id,
            otherUserId,
            otherUserName: userData.displayName || "Unknown",
            otherUserPic: userData.profilePic || null,
            lastMessage: data.messages?.[data.messages.length - 1]?.text || "No messages yet",
            lastMessageTimestamp: data.messages?.[data.messages.length - 1]?.timestamp || 0,
            unreadCount,
          };
        })
      );

      // Sort by last message timestamp
      convos.sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);

      setConversations(convos);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="chat-list" style={{ overflowY: "auto", height: "100%" }}>
      {conversations.length === 0 && (
        <p style={{ textAlign: "center", color: "#aaa", marginTop: "20px" }}>
          No conversations yet.
        </p>
      )}
      {conversations.map((c) => (
        <div
          key={c.id}
          className="chat-user-card"
          onClick={() => setSelectedChat(c.id)}
          style={{
            cursor: "pointer",
            padding: "10px",
            display: "flex",
            alignItems: "center",
            borderBottom: "1px solid #333",
            backgroundColor: c.unreadCount > 0 ? "#1a1a1a" : "transparent",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2a2a2a")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = c.unreadCount > 0 ? "#1a1a1a" : "transparent")
          }
        >
          <img
            src={c.otherUserPic || "/default-profile.png"}
            alt={c.otherUserName}
            style={{ width: "40px", height: "40px", borderRadius: "50%", marginRight: "10px" }}
          />
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: "1rem", display: "flex", justifyContent: "space-between" }}>
              {c.otherUserName}
              {c.unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: "#0aa83f",
                    color: "#fff",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: "0.8rem",
                  }}
                >
                  {c.unreadCount}
                </span>
              )}
            </h4>
            <p style={{ margin: 0, color: "#888", fontSize: "0.9rem" }}>{c.lastMessage}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
