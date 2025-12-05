// src/pages/Chat/ChatWindow.jsx
import React, { useEffect, useState, useRef } from "react";
import { db, auth } from "../../firebase/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import ChatInput from "./ChatInput";

export default function ChatWindow({ conversationId }) {
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef();

  useEffect(() => {
    if (!conversationId) return;

    const messagesRef = collection(db, "conversations", conversationId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-window" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="messages" style={{ flex: 1, overflowY: "auto", padding: "10px", display: "flex", flexDirection: "column" }}>
        {messages.map((m) => {
          const isMe = m.senderId === auth.currentUser?.uid;
          return (
            <div
              key={m.id}
              className={`message ${isMe ? "me" : "them"}`}
              style={{
                alignSelf: isMe ? "flex-end" : "flex-start",
                backgroundColor: isMe ? "#0aa83f" : "#333",
                color: "#fff",
                padding: "10px 15px",
                borderRadius: "20px",
                maxWidth: "70%",
                marginBottom: "8px",
                wordBreak: "break-word",
                boxShadow: isMe
                  ? "0 2px 5px rgba(0,0,0,0.2)"
                  : "0 2px 5px rgba(0,0,0,0.1)",
              }}
            >
              {m.text}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Chat Input */}
      <ChatInput conversationId={conversationId} />
    </div>
  );
}
