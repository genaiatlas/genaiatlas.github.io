// 🚀 Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/genaiatlas/service-worker.js') // ✅ GitHub Pages-safe path
        .then(function (registration) {
          console.log('✅ Service Worker registered with scope:', registration.scope);
        })
        .catch(function (error) {
          console.log('❌ Service Worker registration failed:', error);
        });
    });
  }
  
  // 🔐 Firebase Auth Init (ES Module style)
  import {
    loginUser,
    registerUser,
    logoutUser
  } from '/genaiatlas/firebase-auth.js'; // ✅ GitHub Pages-safe path
  
  // 🔗 Attach functions to global `window` for form/button access
  window.loginUser = loginUser;
  window.registerUser = registerUser;
  window.logoutUser = logoutUser;