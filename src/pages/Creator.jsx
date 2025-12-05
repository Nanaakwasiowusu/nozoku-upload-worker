import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import { PaystackButton } from "react-paystack";

function Creator() {
  const { creatorId } = useParams();
  const navigate = useNavigate();

  const [creatorData, setCreatorData] = useState(null);
  const [subscribed, setSubscribed] = useState(false);
  const [subMessage, setSubMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [reactions, setReactions] = useState({});
  const [comments, setComments] = useState({});
  const [usersMap, setUsersMap] = useState({});
  const [user, setUser] = useState(null);

  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

  // Auth state listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return unsubscribe;
  }, []);

  // Fetch creator data
  useEffect(() => {
    if (!creatorId) return;

    const fetchCreator = async () => {
      try {
        const docRef = doc(db, "users", creatorId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setCreatorData(null);
          return;
        }

        const data = docSnap.data();
        setCreatorData(data);
        setReactions(data.reactions || {});
        setComments(data.comments || {});
        if (user) setSubscribed(data.subscribers?.includes(user.uid) || false);
        setUsersMap({ [creatorId]: data.displayName || "Creator" });
      } catch (err) {
        console.error("Failed to fetch creator:", err);
      }
    };

    fetchCreator();
  }, [creatorId, user]);

  const getDisplayName = (uid) => (uid === user?.uid ? "You" : usersMap[uid] || uid.slice(0, 6));

  // Subscribe / Unsubscribe
  const handleSubscribe = async () => {
    if (!user) return setSubMessage("Login to subscribe.");
    if (subscribed) return setSubMessage("You're already subscribed.");
    setLoading(true);
    try {
      const docRef = doc(db, "users", creatorId);
      await updateDoc(docRef, {
        subscribers: [...(creatorData.subscribers || []), user.uid],
      });
      setSubscribed(true);
      setSubMessage("🎉 Subscribed successfully!");
    } catch (err) {
      console.error(err);
      setSubMessage("Failed to subscribe.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const docRef = doc(db, "users", creatorId);
      const newSubscribers = (creatorData.subscribers || []).filter((uid) => uid !== user.uid);
      await updateDoc(docRef, { subscribers: newSubscribers });
      setSubscribed(false);
      setSubMessage("Unsubscribed successfully.");
    } catch (err) {
      console.error(err);
      setSubMessage("Failed to unsubscribe.");
    } finally {
      setLoading(false);
    }
  };

  // Messaging logic
  const handleMessage = async () => {
    if (!user) return alert("Login to message.");

    const currentUserId = user.uid;
    const conversationId =
      currentUserId < creatorId ? `${currentUserId}_${creatorId}` : `${creatorId}_${currentUserId}`;

    const convoRef = doc(db, "conversations", conversationId);
    const convoSnap = await getDoc(convoRef);

    if (!convoSnap.exists()) {
      await setDoc(convoRef, {
        participants: [currentUserId, creatorId],
        unreadBy: [],
        messages: [],
        createdAt: new Date(),
      });
    }

    navigate(`/messages/${conversationId}`);
  };

  if (!creatorData) return <p style={{ textAlign: "center" }}>Loading creator...</p>;

  const isFree = creatorData.subscriptionMode === "free";
  const canPay = creatorData.subscriptionMode === "paid" || creatorData.subscriptionMode === "both";

  const subscribeButtonProps = {
    reference: new Date().getTime().toString(),
    email: user?.email || "noemail@nozoku.com",
    amount: (creatorData?.subscriptionPrice || 10) * 100,
    publicKey,
    currency: "GHS",
    text: loading ? "Processing..." : subscribed ? "Subscribed" : "Subscribe",
    onSuccess: handleSubscribe,
    onClose: () => setSubMessage("Payment cancelled."),
    disabled: loading,
  };

  const showMessageButton = user && user.uid !== creatorId;

  return (
    <div className="profile-page">
      <div className="profile-card card">
        {/* Header */}
        <div className="profile-header">
          <FaUserCircle size={80} className="profile-pic" />
          <div className="profile-info">
            <h2>{creatorData.displayName || "Creator"}</h2>
            <p className="bio">{creatorData.bio || "No bio yet."}</p>

            {/* Message Button */}
            {showMessageButton && (
              <button
                onClick={handleMessage}
                className="creator-message-button"
                style={{ marginTop: "0.5rem" }}
              >
                Message
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="profile-stats">
          <div className="stat">
            <span className="stat-number">{creatorData.media?.length || 0}</span>
            <span className="stat-label">Posts</span>
          </div>
          <div className="stat">
            <span className="stat-number">{creatorData.subscribers?.length || 0}</span>
            <span className="stat-label">Subscribers</span>
          </div>
          <div className="stat">
            <span className="stat-number">{creatorData.following || 0}</span>
            <span className="stat-label">Following</span>
          </div>
        </div>

        {/* Subscribe / Unsubscribe */}
        <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
          {subscribed ? (
            <button onClick={handleUnsubscribe} disabled={loading} className="paystack-button">
              {loading ? "Processing..." : "Unsubscribe"}
            </button>
          ) : isFree ? (
            <button onClick={handleSubscribe} disabled={loading} className="paystack-button">
              {loading ? "Processing..." : "Subscribe for Free"}
            </button>
          ) : canPay ? (
            <PaystackButton {...subscribeButtonProps} className="paystack-button" />
          ) : null}

          {subMessage && <p style={{ marginTop: "0.5rem", color: "lightgreen" }}>{subMessage}</p>}
        </div>
      </div>
    </div>
  );
}

export default Creator;
