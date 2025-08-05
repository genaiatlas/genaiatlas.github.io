// firebase-auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAnGfiZ5uIaXEPBMfjqvMY87I_T_0YJp64",
  authDomain: "gen-ai-atlas.firebaseapp.com",
  projectId: "gen-ai-atlas",
  storageBucket: "gen-ai-atlas.appspot.com",
  messagingSenderId: "75647218274",
  appId: "1:75647218274:web:efb2981e702a5faf76d73b"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ✅ Sign in with Google
export function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
    .then(result => {
      console.log("✅ Signed in:", result.user.displayName);
      location.reload();
    })
    .catch(err => console.error("❌ Sign-in failed:", err));
}

// ✅ Sign out
export function logoutUser() {
  sessionStorage.setItem("justLoggedOut", "true");

  signOut(auth)
    .then(() => {
      console.log("👋 Logged out");

      // ✅ Determine if running on localhost
      const isLocalhost = location.hostname === "127.0.0.1" || location.hostname === "localhost";

      // ✅ Redirect path
      const homePath = isLocalhost ? "/" : "/genaiatlas/index.html";

      window.location.replace(homePath);  // ✅ Redirect safely
    })
    .catch(err => console.error("❌ Logout failed:", err));
}

 
export function enforceAuth(user) {
  const PUBLIC_PATHS = ["/", "/index.html"];
  const path = window.location.pathname;
  const normalizedPath = path.replace(/\/$/, "") || "/";
  const isPublic = PUBLIC_PATHS.some(p => normalizedPath === p.replace(/\/$/, ""));
  const justLoggedOut = sessionStorage.getItem("justLoggedOut") === "true";

  if (!user && !isPublic && !justLoggedOut) {
    console.warn("🚫 Not signed in and this page is restricted:", normalizedPath);

    // 🚫 Immediately block visible content
    const main = document.querySelector("main.md-main__inner");
    if (main) {
      main.innerHTML = `
        <div style="text-align: center; padding: 4rem;">
          <h2 style="color: #c00;">🔒 You must sign in with Google to access this content.</h2>
          <button onclick="signInWithGoogle()" style="margin-top: 2rem; padding: 0.5rem 1rem; font-size: 1rem;">
            Sign in with Google
          </button>
        </div>`;
    }

    // 🚫 Block all SPA navigation
    const interceptLinks = () => {
      document.querySelectorAll("a.md-nav__link, a.md-nav__link--active, a.md-search-result__link").forEach(link => {
        link.addEventListener("click", (e) => {
          if (!auth.currentUser) {
            e.preventDefault();
            alert("⚠️ Please sign in to view this section.");
          }
        });
      });
    };

    interceptLinks();            // Initial
    setTimeout(interceptLinks, 1000); // Delay fallback for dynamic SPA sidebar

    // 🏠 Replace URL with homepage root (no subfolder!)
    history.replaceState({}, "", "/");
  }

  if (justLoggedOut) {
    sessionStorage.removeItem("justLoggedOut");
  }
}
// ✅ Export auth for other modules
export { auth };