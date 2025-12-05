// src/pages/transactions.jsx
import React, { useEffect, useState } from "react";
import { auth, db, storage } from "../firebase/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FaWallet, FaArrowUp, FaCoins, FaUpload } from "react-icons/fa";

function Transactions() {
  const [currentUser, setCurrentUser] = useState(null);
  const [wallet, setWallet] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [monetizationEnabled, setMonetizationEnabled] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verificationFiles, setVerificationFiles] = useState({ id: null, selfie: null });
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);

  // Load current user & wallet
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) return;
      setCurrentUser(user);
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        setWallet(data.wallet || 0);
        setMonetizationEnabled(data.isCreator || false);
        setVerified(data.verified || false);
        if (!data.verified && data.verification) setAwaitingVerification(true);
      }
    });
    return unsubscribe;
  }, []);

  // Load transactions
  useEffect(() => {
    if (!currentUser) return;
    const fetchTransactions = async () => {
      const q = query(
        collection(db, "transactions"),
        where("userIds", "array-contains", currentUser.uid),
        orderBy("date", "desc")
      );
      const snap = await getDocs(q);
      const txs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTransactions(txs);
    };
    fetchTransactions();
  }, [currentUser]);

  // Top-up function
  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) return alert("Enter a valid amount.");
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { wallet: wallet + amount });
      await addDoc(collection(db, "transactions"), {
        userIds: [currentUser.uid],
        fromUser: currentUser.uid,
        toUser: currentUser.uid,
        amount,
        type: "top-up",
        date: serverTimestamp(),
      });
      setWallet(wallet + amount);
      setTopUpAmount("");
      alert(`Wallet topped up with $${amount.toFixed(2)}!`);
    } catch (err) {
      console.error(err);
      alert("Failed to top up wallet.");
    }
  };

  // Upload verification documents
  const handleVerificationUpload = async () => {
    if (!verificationFiles.id || !verificationFiles.selfie)
      return alert("Please upload both your ID and selfie.");

    try {
      const idRef = ref(storage, `verification/${currentUser.uid}/id`);
      const selfieRef = ref(storage, `verification/${currentUser.uid}/selfie`);

      await uploadBytes(idRef, verificationFiles.id);
      await uploadBytes(selfieRef, verificationFiles.selfie);

      const idURL = await getDownloadURL(idRef);
      const selfieURL = await getDownloadURL(selfieRef);

      await updateDoc(doc(db, "users", currentUser.uid), {
        verification: { idURL, selfieURL },
        verified: false, // Admin verifies manually
      });

      setVerificationFiles({ id: null, selfie: null });
      setAwaitingVerification(true);
      alert("Verification uploaded. Wait for admin approval.");
    } catch (err) {
      console.error(err);
      alert("Upload failed. Try again.");
    }
  };

  // Enable monetization after verification
  const enableMonetization = async () => {
    if (!verified) return alert("You must be verified before enabling monetization.");
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { isCreator: true });
      setMonetizationEnabled(true);
      setConfirmationOpen(false);
      alert("Monetization enabled! You can now earn from tips and subscriptions.");
    } catch (err) {
      console.error(err);
      alert("Failed to enable monetization.");
    }
  };

return (
  <div style={styles.container}>
    <h2 style={styles.title}>Wallet & Transactions</h2>

    {/* Wallet / Top-up / Withdraw Section */}
    <div style={styles.card}>
      <div style={styles.walletHeader}>
        <FaWallet size={28} /> <h3>Balance</h3>
      </div>
      <p style={styles.balance}>${wallet.toFixed(2)}</p>

      {/* Top-up */}
      <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
        <input
          type="number"
          placeholder="Top-up amount"
          value={topUpAmount}
          onChange={(e) => setTopUpAmount(e.target.value)}
          style={styles.input}
        />
        <button style={styles.button} onClick={handleTopUp}>
          Top Up <FaCoins />
        </button>
      </div>

      {/* Withdraw (only if monetization enabled & verified) */}
      {monetizationEnabled && verified && (
        <form
          onSubmit={handleWithdraw}
          style={{ marginTop: 15, display: "flex", gap: 10 }}
        >
          <input
            type="number"
            step="0.01"
            placeholder="Withdraw amount"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            style={styles.input}
          />
          <button type="submit" style={styles.button}>
            Withdraw <FaArrowUp />
          </button>
        </form>
      )}
    </div>

    {/* Transactions History */}
    <div style={styles.card}>
      <h3>Transactions</h3>
      {transactions.length === 0 && <p>No transactions yet.</p>}
      {transactions.map((tx) => (
        <div key={tx.id} style={styles.txRow}>
          <span>
            {tx.type === "tip"
              ? `Tip ${tx.toUser === currentUser.uid ? "received" : "sent"}`
              : tx.type === "top-up"
              ? "Top-up"
              : "Withdrawal"}
          </span>
          <span>${tx.amount.toFixed(2)}</span>
        </div>
      ))}
    </div>
  </div>
);


}

const styles = {
  container: { maxWidth: "900px", margin: "20px auto", padding: "0 10px" },
  title: { color: "#fff", textAlign: "center", marginBottom: "20px" },
  card: {
    backgroundColor: "#1e1e2f",
    padding: "15px",
    borderRadius: "10px",
    marginBottom: "20px",
    color: "#fff",
    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
  },
  walletHeader: { display: "flex", alignItems: "center", gap: "10px" },
  balance: { fontSize: "2rem", margin: "10px 0" },
  input: { padding: "6px 10px", borderRadius: "5px", border: "none", flex: "1" },
  button: {
    backgroundColor: "#0aa83f",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    padding: "6px 12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  enableButton: {
    backgroundColor: "#ff69b4",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    padding: "10px 15px",
    cursor: "pointer",
    marginTop: "10px",
  },
  txRow: { display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #555" },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  modal: { backgroundColor: "#222", padding: "20px", borderRadius: "10px", textAlign: "center", maxWidth: "400px" },
  modalButtons: { display: "flex", justifyContent: "space-around", marginTop: "15px" },
  modalCancel: { backgroundColor: "#555", color: "#fff", border: "none", borderRadius: "5px", padding: "6px 12px", cursor: "pointer" },
  modalConfirm: { backgroundColor: "#0aa83f", color: "#fff", border: "none", borderRadius: "5px", padding: "6px 12px", cursor: "pointer" },
};

export default Transactions;
