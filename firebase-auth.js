// 🔥 Firebase SDK - Modular CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAnGfiZ5uTaXEPBMfjqvMY87L_T_0YJp64",
  authDomain: "gen-ai-atlas.firebaseapp.com",
  projectId: "gen-ai-atlas",
  storageBucket: "gen-ai-atlas.appspot.com",
  messagingSenderId: "75647218274",
  appId: "1:75647218274:web:efb2981e702a5faf76d73b",
  measurementId: "G-ZW5X7WHHQM"
};

// ✅ Initialize Firebase App & Auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ✅ Exported Auth Functions
export async function loginUser() {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    alert("✅ Logged in!");
    window.location.href = "/"; // Redirect to root
  } catch (error) {
    alert("❌ Login failed: " + error.message);
  }
}

export async function registerUser() {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  try {
    await createUserWithEmailAndPassword(auth, email, pass);
    alert("✅ Registered!");
    window.location.href = "/";
  } catch (error) {
    alert("❌ Registration failed: " + error.message);
  }
}

export async function logoutUser() {
  await signOut(auth);
  alert("🚪 Logged out!");
  window.location.reload();
}

// 👁️ Auth Status UI
onAuthStateChanged(auth, (user) => {
  const statusEl = document.getElementById("user-status");
  if (statusEl) {
    statusEl.innerText = user ? `👤 Logged in as ${user.email}` : "🔒 Not logged in";
  }

  const signInBtn = document.getElementById("signin-btn");
  const signOutBtn = document.getElementById("signout-btn");
  if (signInBtn && signOutBtn) {
    if (user) {
      signInBtn.style.display = "none";
      signOutBtn.style.display = "block";
      signOutBtn.onclick = () => logoutUser();
    } else {
      signInBtn.style.display = "block";
      signOutBtn.style.display = "none";
    }
  }

  // 🔐 Page Access Control (GitHub Pages structure)
  const allowedPublicPaths = [
    "/",
    "/index.html",
    "/auth/",
    "/auth/index.html",  // Supports MkDocs converted HTML
  ];

  const currentPath = window.location.pathname;
  const isPublic = allowedPublicPaths.some(path => currentPath === path || currentPath.startsWith(path));

  if (!user && !isPublic) {
    window.location.href = "/auth/";
  }

  if (user && currentPath.startsWith("/auth")) {
    window.location.href = "/";
  }
});