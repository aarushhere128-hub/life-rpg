import { auth } from "./config.js";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { createUserProfiles } from "./database.js";

export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function registerUser(email, password, displayName) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Initialize separated private user data and public player profile securely
    await createUserProfiles(user.uid, {
      email: user.email,
      displayName: displayName || "Adventurer"
    });

    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
    window.location.href = "index.html";
  } catch (error) {
    console.error("Sign out error:", error);
  }
}

export function initAuthGuard(onAuthenticated) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      onAuthenticated(user);
    } else {
      if (window.location.pathname.includes("dashboard.html")) {
        window.location.href = "index.html";
      }
    }
  });
}
