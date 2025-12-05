// src/pages/Homepage.jsx
import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, query, orderBy, limit, getDocs, startAfter } from "firebase/firestore";

const Homepage = () => {
  const [posts, setPosts] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 10; // Load 10 posts like Instagram

  // Fetch first 10 posts
  const fetchInitialPosts = async () => {
    try {
      const q = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );

      const snapshot = await getDocs(q);

      const postsArray = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPosts(postsArray);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch next 10 posts
  const fetchMorePosts = async () => {
    if (!lastDoc) return;

    setLoadingMore(true);

    try {
      const q = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );

      const snapshot = await getDocs(q);

      const newPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPosts((prev) => [...prev, ...newPosts]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);

      if (snapshot.empty) {
        setLastDoc(null); // No more posts
      }
    } catch (error) {
      console.error("Error loading more posts:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchInitialPosts();
  }, []);

  if (loading) return <p style={{ textAlign: "center" }}>Loading posts...</p>;

  return (
    <div style={{ maxWidth: "600px", margin: "20px auto" }}>
      {posts.length === 0 && <p>No posts yet.</p>}

      {posts.map((post) => (
        <div
          key={post.id}
          style={{
            marginBottom: "25px",
            background: "#111",
            padding: "10px",
            borderRadius: "10px",
          }}
        >
          <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
            {post.username ? post.username : "Unknown User"}
          </p>

          {post.mediaURL && post.mediaURL.includes("mp4") ? (
            <video src={post.mediaURL} controls style={{ width: "100%", borderRadius: "8px" }} />
          ) : (
            <img src={post.mediaURL} alt="" style={{ width: "100%", borderRadius: "8px" }} />
          )}
        </div>
      ))}

      {/* Load More Button */}
      {lastDoc && (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            onClick={fetchMorePosts}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              background: "#333",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              cursor: "pointer",
            }}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}

      {!lastDoc && posts.length > 0 && (
        <p style={{ textAlign: "center", marginTop: "20px", opacity: 0.7 }}>
          No more posts.
        </p>
      )}
    </div>
  );
};

export default Homepage;
