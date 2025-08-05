// init-auth.js
import { signInWithGoogle, logoutUser, enforceAuth, auth } from './firebase-auth.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

// ✅ Attach to window so buttons in HTML can call them
window.signInWithGoogle = signInWithGoogle;
window.logoutUser = logoutUser;

// ✅ Auth button toggle logic
function toggleAuthButtons(user) {
  const signInBtn = document.getElementById('google-signin-btn');
  const signOutBtn = document.getElementById('signout-btn');

  if (user) {
    console.log("🔓 User is signed in:", user.email);
    if (signInBtn) signInBtn.style.display = "none";
    if (signOutBtn) signOutBtn.style.display = "flex";
  } else {
    console.log("🔒 No user signed in");
    if (signInBtn) signInBtn.style.display = "flex";
    if (signOutBtn) signOutBtn.style.display = "none";
  }
}

// ✅ On first load
document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, (user) => {
    toggleAuthButtons(user);
    enforceAuth(user);  // Pass user explicitly
  });

  // ✅ Patch navigation events (SPA behavior)
  if (!window.mutationObserver) {
    const observer = new MutationObserver(() => {
      onAuthStateChanged(auth, (user) => {
        toggleAuthButtons(user);
        enforceAuth(user);  // Recheck on navigation
      });
    });
    observer.observe(document.querySelector("main"), { childList: true, subtree: true });
    window.mutationObserver = observer;
  }
});