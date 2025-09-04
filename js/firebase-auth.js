// Firebase Authentication for Gen AI Atlas
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAw1iYTwCUbF8OA8ydHlbIHrsWr-xmdkIE",
  authDomain: "genaiatlas-new.firebaseapp.com",
  projectId: "genaiatlas-new",
  storageBucket: "genaiatlas-new.firebasestorage.app",
  messagingSenderId: "216207834235",
  appId: "1:216207834235:web:3cf3c3df3ecab2020e76de",
  measurementId: "G-BWC8EL2SWD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google provider for account selection
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Admin user email
const ADMIN_EMAIL = 'baskarmanickam@gmail.com';

// DOM elements
let userProfileArea;
let adminTab;

// Initialize authentication when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Firebase Auth] Initializing authentication system');
  
  // Get DOM elements
  userProfileArea = document.getElementById('user-profile-area');
  adminTab = document.querySelector('.admin-tab');
  
  // Set up authentication state listener
  setupAuthStateListener();
  
  // Check if user is already signed in or show login modal
  checkAuthState();
});

// Setup authentication state listener
function setupAuthStateListener() {
  onAuthStateChanged(auth, (user) => {
    console.log('[Firebase Auth] Auth state changed:', user ? 'signed in' : 'signed out');
    
    if (user) {
      handleSignedInUser(user);
    } else {
      handleSignedOutUser();
    }
  });
}

// Check initial authentication state
function checkAuthState() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    // No user signed in, show login modal automatically
    setTimeout(() => {
      showLoginModal();
    }, 1000); // Small delay to ensure DOM is fully loaded
  }
}

// Handle signed in user
function handleSignedInUser(user) {
  console.log('[Firebase Auth] User signed in:', user.email);
  
  // Hide login modal if visible
  hideLoginModal();
  
  // Show user profile in header
  showUserProfile(user);
  
  // Show admin tab if user is admin
  if (user.email === ADMIN_EMAIL) {
    showAdminTab();
  } else {
    hideAdminTab();
  }
  
  // Store user info for potential analytics
  window.genaiUser = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    isAdmin: user.email === ADMIN_EMAIL
  };
}

// Handle signed out user  
function handleSignedOutUser() {
  console.log('[Firebase Auth] User signed out');
  
  // Clear user profile
  hideUserProfile();
  
  // Hide admin tab
  hideAdminTab();
  
  // Clear user info
  window.genaiUser = null;
  
  // Show login modal
  showLoginModal();
}

// Show login modal
function showLoginModal() {
  // Remove any existing modals first
  const existingModal = document.getElementById('auth-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  const modal = document.createElement('div');
  modal.id = 'auth-modal';
  modal.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Welcome to Gen AI Atlas</h2>
          <p>Please sign in with your Google account to access the content</p>
        </div>
        <div class="modal-body">
          <button id="google-sign-in-btn" class="google-sign-in-button">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Add modal styles
  modal.innerHTML += `
    <style>
      #auth-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: 'Inter', sans-serif;
      }
      
      .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
      }
      
      .modal-content {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        text-align: center;
      }
      
      .modal-header h2 {
        margin: 0 0 0.5rem 0;
        color: #333;
        font-size: 1.5rem;
        font-weight: 600;
      }
      
      .modal-header p {
        margin: 0 0 1.5rem 0;
        color: #666;
        font-size: 0.95rem;
        line-height: 1.4;
      }
      
      .google-sign-in-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        background: white;
        border: 2px solid #dadce0;
        border-radius: 8px;
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
        font-weight: 500;
        color: #3c4043;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 100%;
      }
      
      .google-sign-in-button:hover {
        background: #f8f9fa;
        border-color: #c8cbcf;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      
      .google-sign-in-button:active {
        background: #f1f3f4;
      }
    </style>
  `;
  
  document.body.appendChild(modal);
  
  // Add click handler for sign-in button
  const signInBtn = document.getElementById('google-sign-in-btn');
  signInBtn.addEventListener('click', handleGoogleSignIn);
  
  console.log('[Firebase Auth] Login modal displayed');
}

// Hide login modal
function hideLoginModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.remove();
    console.log('[Firebase Auth] Login modal hidden');
  }
}

// Handle Google sign in
async function handleGoogleSignIn() {
  console.log('[Firebase Auth] Starting Google sign-in process');
  
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    console.log('[Firebase Auth] Sign-in successful:', user.email);
    
    // User will be handled by onAuthStateChanged listener
    
  } catch (error) {
    console.error('[Firebase Auth] Sign-in error:', error);
    
    // Handle specific error cases
    if (error.code === 'auth/popup-closed-by-user') {
      console.log('[Firebase Auth] User closed the popup');
    } else if (error.code === 'auth/popup-blocked') {
      console.error('[Firebase Auth] Popup blocked by browser');
      alert('Please allow popups for this site and try again');
    } else {
      alert('Sign-in failed. Please try again.');
    }
  }
}

// Show user profile in header
function showUserProfile(user) {
  if (!userProfileArea) {
    // Create user profile area if it doesn't exist
    const header = document.querySelector('.md-header__inner');
    if (header) {
      userProfileArea = document.createElement('div');
      userProfileArea.id = 'user-profile-area';
      userProfileArea.style.marginLeft = '1rem';
      header.appendChild(userProfileArea);
    }
  }
  
  if (userProfileArea) {
    userProfileArea.innerHTML = `
      <div class="user-profile">
        <img src="${user.photoURL || '/images/default-avatar.png'}" 
             alt="Profile" 
             class="user-avatar">
        <span class="user-name">${user.displayName || user.email}</span>
        <button id="sign-out-btn" class="sign-out-btn">Sign Out</button>
      </div>
      <style>
        .user-profile {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }
        
        .user-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.2);
        }
        
        .user-name {
          color: var(--md-primary-bg-color);
          font-weight: 500;
        }
        
        .sign-out-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: var(--md-primary-bg-color);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        
        .sign-out-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      </style>
    `;
    
    // Add sign out handler
    const signOutBtn = document.getElementById('sign-out-btn');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', handleSignOut);
    }
    
    console.log('[Firebase Auth] User profile displayed');
  }
}

// Hide user profile
function hideUserProfile() {
  if (userProfileArea) {
    userProfileArea.innerHTML = '';
    console.log('[Firebase Auth] User profile hidden');
  }
}

// Handle sign out
async function handleSignOut() {
  try {
    await signOut(auth);
    console.log('[Firebase Auth] User signed out successfully');
  } catch (error) {
    console.error('[Firebase Auth] Sign out error:', error);
  }
}

// Show admin tab
function showAdminTab() {
  if (!adminTab) {
    // Add admin tab to navigation
    const nav = document.querySelector('nav[aria-label="Header"]');
    if (nav) {
      const adminTabElement = document.createElement('div');
      adminTabElement.className = 'admin-tab';
      adminTabElement.innerHTML = `
        <a href="/admin/" class="md-nav__link">
          <span class="admin-indicator">👑</span> Admin
        </a>
        <style>
          .admin-tab {
            margin-left: 1rem;
          }
          .admin-tab a {
            color: #ff6b35 !important;
            font-weight: 600;
            text-decoration: none;
            padding: 0.5rem;
            border-radius: 4px;
            transition: background 0.2s ease;
          }
          .admin-tab a:hover {
            background: rgba(255, 107, 53, 0.1);
          }
          .admin-indicator {
            margin-right: 0.25rem;
          }
        </style>
      `;
      nav.appendChild(adminTabElement);
      adminTab = adminTabElement;
    }
  } else {
    adminTab.style.display = 'block';
  }
  console.log('[Firebase Auth] Admin tab shown');
}

// Hide admin tab
function hideAdminTab() {
  if (adminTab) {
    adminTab.style.display = 'none';
    console.log('[Firebase Auth] Admin tab hidden');
  }
}

// Global functions for external access
window.genaiAuth = {
  signOut: handleSignOut,
  getCurrentUser: () => auth.currentUser,
  isAdmin: () => auth.currentUser?.email === ADMIN_EMAIL
};

console.log('[Firebase Auth] Authentication system loaded');