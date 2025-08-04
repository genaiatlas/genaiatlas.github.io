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
  const emailEl = document.getElementById("email");
  const passEl = document.getElementById("password");

  if (!emailEl || !passEl) {
    alert("⚠️ Email or password input not found on the page.");
    return;
  }

  const email = emailEl.value;
  const pass = passEl.value;

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    alert("✅ Logged in!");
    window.location.href = "/genaiatlas/"; // redirect to GitHub Pages root
  } catch (error) {
    alert("❌ Login failed: " + error.message);
  }
}

export async function registerUser() {
  const emailEl = document.getElementById("email");
  const passEl = document.getElementById("password");

  if (!emailEl || !passEl) {
    alert("⚠️ Email or password input not found on the page.");
    return;
  }

  const email = emailEl.value;
  const pass = passEl.value;

  try {
    await createUserWithEmailAndPassword(auth, email, pass);
    alert("✅ Registered!");
    window.location.href = "/genaiatlas/";
  } catch (error) {
    alert("❌ Registration failed: " + error.message);
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
    alert("🚪 Logged out!");
    window.location.reload();
  } catch (error) {
    alert("❌ Logout failed: " + error.message);
  }
}

// 👁️ Auth Status UI + Route Protection
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

  // 🔐 Route whitelist for public access (GitHub Pages base path)
  const allowedPublicPaths = [
    "/genaiatlas/",
    "/genaiatlas/auth/"
  ];

  const currentPath = window.location.pathname;
  const isPublic = allowedPublicPaths.some(path =>
    currentPath === path || currentPath.startsWith(path)
  );

  // 🔁 Redirect if unauthorized access
  if (!user && !isPublic) {
    window.location.href = "/genaiatlas/auth/";
  }

  if (user && currentPath.startsWith("/genaiatlas/auth")) {
    window.location.href = "/genaiatlas/";
  }
});