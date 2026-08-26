import { db } from "./config.js";
import { doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function createUserProfiles(userId, { email, displayName }) {
  // 1. Private User Document
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, {
    uid: userId,
    email: email,
    createdAt: serverTimestamp()
  });

  // 2. Public Player Profile
  const playerRef = doc(db, "players", userId);
  await setDoc(playerRef, {
    uid: userId,
    displayName: displayName,
    level: 1,
    xp: 0,
    rank: "Novice",
    streak: 0,
    updatedAt: serverTimestamp()
  });
}

export async function getPlayerProfile(userId) {
  const playerRef = doc(db, "players", userId);
  const snapshot = await getDoc(playerRef);
  return snapshot.exists() ? snapshot.data() : null;
}
