// src/pages/Chat/Messenger.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";

export default function Messenger() {
  const { conversationId } = useParams(); // get conversationId from URL
  const [selectedConversation, setSelectedConversation] = useState(conversationId || null);

  // If URL changes (clicking message button from another profile), update selected conversation
  useEffect(() => {
    if (conversationId) setSelectedConversation(conversationId);
  }, [conversationId]);

  return (
    <div className="messenger-page" style={{ display: "flex", height: "100vh" }}>
      {/* Conversation list */}
      <div style={{ width: "300px", borderRight: "1px solid #333", overflowY: "auto" }}>
        <ChatList setSelectedChat={setSelectedConversation} />
      </div>

      {/* Chat window */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {selectedConversation ? (
          <ChatWindow conversationId={selectedConversation} />
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "#888",
            }}
          >
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
