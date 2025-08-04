// Import Firebase SDK modules (CDN version used for static sites)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAnGfiZ5uTaXEPBMfjqvMY87L_T_0YJp64",
  authDomain: "gen-ai-atlas.firebaseapp.com",
  projectId: "gen-ai-atlas",
  storageBucket: "gen-ai-atlas.appspot.com",
  messagingSenderId: "75647218274",
  appId: "1:75647218274:web:efb2981e702a5faf76d73b",
  measurementId: "G-ZW5X7WHHQM"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Login
window.loginUser = async () => {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    alert("✅ Logged in!");
  } catch (error) {
    alert("❌ Login failed: " + error.message);
  }
};

// Register
window.registerUser = async () => {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  try {
    await createUserWithEmailAndPassword(auth, email, pass);
    alert("✅ Registered!");
  } catch (error) {
    alert("❌ Registration failed: " + error.message);
  }
};

// Logout
window.logoutUser = async () => {
  await signOut(auth);
  alert("🚪 Logged out!");
};

// Show auth state
onAuthStateChanged(auth, (user) => {
  document.getElementById("user-status").innerText = user ? `👤 Logged in as ${user.email}` : "🔒 Not logged in";
});

auth.onAuthStateChanged((user) => {
    if (user && window.location.pathname === "/genaiatlas/auth/") {
      window.location.href = "/genaiatlas/";
    }
  });

  auth.onAuthStateChanged((user) => {
    const signInBtn = document.getElementById("signin-btn");
    const signOutBtn = document.getElementById("signout-btn");
  
    if (user) {
      signInBtn.style.display = "none";
      signOutBtn.style.display = "block";
      signOutBtn.onclick = () => {
        auth.signOut().then(() => {
          window.location.reload();
        });
      };
    } else {
      signInBtn.style.display = "block";
      signOutBtn.style.display = "none";
    }
  });