// src/pages/SettingsPages/CreatorDashboard.jsx
import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

function CreatorDashboard() {
  const [creatorData, setCreatorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    const fetchCreatorData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          setCreatorData(snap.data());
        }
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch creator data:", err);
        setLoading(false);
      }
    };

    fetchCreatorData();
  }, []);

  if (loading) return <p>Loading Creator Dashboard...</p>;
  if (!creatorData) return <p>No creator data found.</p>;

  // Analytics data
  const earnings = {
    today: creatorData.earningsToday || 0,
    week: creatorData.earningsWeek || 0,
    month: creatorData.earningsMonth || 0,
    total: creatorData.earningsTotal || 0,
  };
  const subscribers = {
    total: creatorData.subscribers?.length || 0,
    today: creatorData.newSubscribersToday || 0,
    week: creatorData.newSubscribersWeek || 0,
  };
  const topContent = creatorData.topContent || [];

  return (
    <div style={{
      backgroundColor: "#1f1f1f",
      padding: "20px",
      borderRadius: "10px",
      marginBottom: "30px",
      boxShadow: "0 4px 8px rgba(0,0,0,0.3)"
    }}>
      <h2 style={{ fontSize: "1.4rem", marginBottom: "15px" }}>Creator Dashboard</h2>

      {/* Summary Cards */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
        <div style={{ flex: 1, minWidth: "120px", padding: "10px", backgroundColor: "#333", borderRadius: "6px" }}>
          <p>Total Earnings</p>
          <h3>${earnings.total.toFixed(2)}</h3>
        </div>
        <div style={{ flex: 1, minWidth: "120px", padding: "10px", backgroundColor: "#333", borderRadius: "6px" }}>
          <p>Subscribers</p>
          <h3>{subscribers.total}</h3>
        </div>
        <div style={{ flex: 1, minWidth: "120px", padding: "10px", backgroundColor: "#333", borderRadius: "6px" }}>
          <p>New This Week</p>
          <h3>{subscribers.week}</h3>
        </div>
      </div>

      {/* Earnings Details */}
      <div style={{ marginBottom: "20px" }}>
        <p>Earnings Overview:</p>
        <ul>
          <li>Today: ${earnings.today.toFixed(2)}</li>
          <li>This Week: ${earnings.week.toFixed(2)}</li>
          <li>This Month: ${earnings.month.toFixed(2)}</li>
        </ul>
      </div>

      {/* Top Content */}
      {topContent.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <p>Top Performing Content:</p>
          <ul>
            {topContent.map((item, index) => (
              <li key={index}>
                {item.title} - ${item.revenue.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* View Full Analytics Toggle */}
      <button
        onClick={() => setShowAnalytics(prev => !prev)}
        style={{
          padding: "8px 16px",
          backgroundColor: "#646cff",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        {showAnalytics ? "Hide Analytics" : "View Full Analytics"}
      </button>

      {/* Detailed Analytics Section */}
      {showAnalytics && (
        <div style={{ backgroundColor: "#2a2a2a", padding: "15px", borderRadius: "6px" }}>
          <h3 style={{ marginBottom: "10px" }}>Detailed Analytics</h3>
          <ul>
            <li>Earnings Today: ${earnings.today.toFixed(2)}</li>
            <li>Earnings This Week: ${earnings.week.toFixed(2)}</li>
            <li>Earnings This Month: ${earnings.month.toFixed(2)}</li>
            <li>Total Subscribers: {subscribers.total}</li>
            <li>New Subscribers Today: {subscribers.today}</li>
            <li>New Subscribers This Week: {subscribers.week}</li>
          </ul>
          {topContent.length > 0 && (
            <>
              <p>Top Content:</p>
              <ul>
                {topContent.map((item, index) => (
                  <li key={index}>
                    {item.title} - ${item.revenue.toFixed(2)}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default CreatorDashboard;
