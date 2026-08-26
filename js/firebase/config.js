// Replace with your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAvXcIPyzcuDdZSNqbNy8UEtLisDyEPzbk",
  authDomain: "life-rpg-e03b6.firebaseapp.com",
  projectId: "life-rpg-e03b6",
  storageBucket: "life-rpg-e03b6.firebasestorage.app",
  messagingSenderId: "271513010758",
  appId: "1:271513010758:web:1cd8ad1236ce8bd1508047"
};

// Initialize Firebase SDKs via CDN or modular imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
