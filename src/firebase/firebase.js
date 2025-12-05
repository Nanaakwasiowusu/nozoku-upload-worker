// src/firebase/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDO7Xxore9Qc08i17NH4FrkR6JwT-JGaq4",
  authDomain: "nozoku-cb054.firebaseapp.com",
  projectId: "nozoku-cb054",
  storageBucket: "nozoku-cb054.appspot.com",
  messagingSenderId: "527170965821",
  appId: "1:527170965821:web:6c2eef31284b16546f7554",
  measurementId: "G-2EP3GK49NG",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // Firebase Storage for media uploads
