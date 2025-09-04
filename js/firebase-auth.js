// Firebase Authentication for Gen AI Atlas
// Using Firebase Compat SDK for CDN compatibility

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

// Initialize Firebase using compat SDK
firebase.initializeApp(firebaseConfig);
const analytics = firebase.analytics();
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Configure Google provider with your Web Client ID
googleProvider.setCustomParameters({
  prompt: 'select_account',
  client_id: '216207834235-oh38lplbpbf6eut7dqea73vf1sfsqbkq.apps.googleusercontent.com'
});

// Add OAuth scopes if needed
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Admin user email
const ADMIN_EMAIL = 'baskarmanickam@gmail.com';

// DOM elements
let userProfileArea;
let adminTab;

// State flags
let isAuthenticating = false;
let isAuthenticated = false;

// Initialize authentication when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Firebase Auth] Initializing authentication system');
  
  // Check if Firebase is loaded
  if (typeof firebase === 'undefined') {
    console.error('[Firebase Auth] Firebase SDK not loaded!');
    alert('Firebase SDK failed to load. Please check your internet connection and try refreshing.');
    return;
  }
  
  // Check if Firebase Auth is available
  if (!firebase.auth) {
    console.error('[Firebase Auth] Firebase Auth not available!');
    alert('Firebase Authentication not available. Please check the Firebase configuration.');
    return;
  }
  
  console.log('[Firebase Auth] Firebase SDK loaded successfully');
  console.log('[Firebase Auth] Firebase config:', firebaseConfig);
  
  // Get DOM elements
  userProfileArea = document.getElementById('user-profile-area');
  adminTab = document.querySelector('.admin-tab');
  
  // Initialize admin management data
  initializeAdminData();
  
  // Set up authentication state listener (this handles everything)
  setupAuthStateListener();
});

// Setup authentication state listener
function setupAuthStateListener() {
  auth.onAuthStateChanged((user) => {
    console.log('[Firebase Auth] Auth state changed:', user ? 'signed in' : 'signed out');
    
    if (user) {
      // User is signed in
      isAuthenticated = true;
      isAuthenticating = false;
      handleSignedInUser(user);
    } else {
      // User is signed out
      isAuthenticated = false;
      handleSignedOutUser();
      
      // Only show modal if not currently authenticating and no modal exists
      if (!isAuthenticating) {
        setTimeout(() => {
          if (!auth.currentUser && !document.getElementById('auth-modal') && !isAuthenticating) {
            showLoginModal();
          }
        }, 1000);
      }
    }
  });
}


// Handle signed in user
function handleSignedInUser(user) {
  console.log('[Firebase Auth] User signed in:', user.email);
  
  // Immediately hide login modal if visible
  hideLoginModal();
  
  // Show user profile in header
  showUserProfile(user);
  
  // Check admin status from local admin management system
  const isAdmin = checkAdminStatus(user.email);
  
  // Show admin tab if user is admin
  if (isAdmin) {
    showAdminTab();
    console.log('[Firebase Auth] Admin user detected - showing admin features');
  } else {
    hideAdminTab();
  }
  
  // Store user info for potential analytics
  window.genaiUser = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    isAdmin: isAdmin,
    loginTime: new Date().toISOString()
  };
  
  // Update admin data if user is new admin
  updateAdminUserData(user);
  
  // Track login event with Firebase Analytics
  trackUserLogin(user);
  
  console.log('[Firebase Auth] User authentication complete');
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
          <div class="modal-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7L12 12L22 7L12 2Z"></path>
              <path d="M2 17L12 22L22 17"></path>
              <path d="M2 12L12 17L22 12"></path>
            </svg>
          </div>
          <h3>Welcome to<br><span class="brand-name">Gen AI Atlas</span></h3>
          <p>Sign in to access premium content and personalized features</p>
        </div>
        <div class="modal-body">
          <button id="google-sign-in-btn" class="google-sign-in-button">
            <svg class="google-icon" width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Google</span>
          </button>
          <div class="modal-footer">
            <p>Secure authentication powered by Google</p>
          </div>
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
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: modalFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      @keyframes modalFadeIn {
        from { 
          opacity: 0; 
          backdrop-filter: blur(0px);
        }
        to { 
          opacity: 1; 
          backdrop-filter: blur(4px);
        }
      }
      
      @keyframes modalSlideUp {
        from { 
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        to { 
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      
      .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      
      .modal-content {
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        border-radius: 16px;
        padding: 2rem;
        max-width: 380px;
        width: 90%;
        box-shadow: 
          0 20px 60px rgba(0, 0, 0, 0.1),
          0 8px 32px rgba(0, 0, 0, 0.08),
          0 1px 0px rgba(255, 255, 255, 0.05) inset;
        text-align: center;
        border: 1px solid rgba(255, 255, 255, 0.2);
        animation: modalSlideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
      }
      
      .modal-content::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
      }
      
      .modal-icon {
        width: 48px;
        height: 48px;
        margin: 0 auto 1.5rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }
      
      .modal-header h3 {
        margin: 0 0 0.75rem 0;
        color: #1a202c;
        font-size: 1.25rem;
        font-weight: 600;
        letter-spacing: -0.02em;
        line-height: 1.4;
      }
      
      .brand-name {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-weight: 700;
        display: inline-block;
      }
      
      .modal-header p {
        margin: 0 0 2rem 0;
        color: #64748b;
        font-size: 0.875rem;
        line-height: 1.5;
        font-weight: 400;
      }
      
      .google-sign-in-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        background: #ffffff;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        padding: 0.875rem 1.5rem;
        font-size: 0.9375rem;
        font-weight: 500;
        color: #374151;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        width: 100%;
        position: relative;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        font-family: inherit;
      }
      
      .google-sign-in-button::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: linear-gradient(135deg, #ffffff, #f8fafc);
        z-index: -1;
      }
      
      .google-sign-in-button:hover {
        border-color: #cbd5e1;
        transform: translateY(-1px);
        box-shadow: 
          0 4px 12px rgba(0, 0, 0, 0.08),
          0 2px 4px rgba(0, 0, 0, 0.05);
      }
      
      .google-sign-in-button:active {
        transform: translateY(0);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }
      
      .google-icon {
        flex-shrink: 0;
      }
      
      .modal-footer {
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid #e2e8f0;
      }
      
      .modal-footer p {
        margin: 0;
        color: #94a3b8;
        font-size: 0.8125rem;
        font-weight: 400;
      }
      
      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .modal-content {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          border-color: rgba(255, 255, 255, 0.1);
        }
        
        .modal-header h3 {
          color: #f1f5f9;
        }
        
        .brand-name {
          background: linear-gradient(135deg, #818cf8 0%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .modal-header p {
          color: #94a3b8;
        }
        
        .google-sign-in-button {
          background: #334155;
          border-color: #475569;
          color: #f1f5f9;
        }
        
        .google-sign-in-button::before {
          background: linear-gradient(135deg, #334155, #475569);
        }
        
        .google-sign-in-button:hover {
          border-color: #64748b;
        }
        
        .modal-footer {
          border-color: #475569;
        }
        
        .modal-footer p {
          color: #64748b;
        }
      }
      
      /* Mobile responsiveness */
      @media (max-width: 480px) {
        .modal-content {
          padding: 1.5rem;
          margin: 1rem;
          max-width: none;
        }
        
        .modal-header h3 {
          font-size: 1.125rem;
        }
        
        .google-sign-in-button {
          padding: 0.75rem 1.25rem;
          font-size: 0.875rem;
        }
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
  
  // Also remove any duplicate modals that might exist
  const allModals = document.querySelectorAll('#auth-modal, .modal-overlay');
  allModals.forEach(m => {
    if (m && m.parentNode) {
      m.remove();
    }
  });
}

// Handle Google sign in
async function handleGoogleSignIn() {
  if (isAuthenticating) {
    console.log('[Firebase Auth] Already authenticating, ignoring duplicate request');
    return;
  }
  
  console.log('[Firebase Auth] Starting Google sign-in process');
  isAuthenticating = true;
  
  try {
    const result = await auth.signInWithPopup(googleProvider);
    const user = result.user;
    console.log('[Firebase Auth] Sign-in successful:', user.email);
    
    // User will be handled by onAuthStateChanged listener
    
  } catch (error) {
    console.error('[Firebase Auth] Sign-in error:', error);
    console.error('[Firebase Auth] Error code:', error.code);
    console.error('[Firebase Auth] Error message:', error.message);
    
    // Handle specific error cases
    if (error.code === 'auth/popup-closed-by-user') {
      console.log('[Firebase Auth] User closed the popup');
    } else if (error.code === 'auth/popup-blocked') {
      console.error('[Firebase Auth] Popup blocked by browser');
      alert('Please allow popups for this site and try again');
    } else if (error.code === 'auth/unauthorized-domain') {
      console.error('[Firebase Auth] Unauthorized domain - need to add localhost:8002 to Firebase console');
      alert('Domain not authorized. Please add localhost:8002 to Firebase authorized domains.');
    } else if (error.code === 'auth/operation-not-allowed') {
      console.error('[Firebase Auth] Google sign-in not enabled in Firebase console');
      alert('Google sign-in not enabled. Please enable Google authentication in Firebase console.');
    } else {
      alert(`Sign-in failed: ${error.message}. Please try again.`);
    }
    
    // Reset authenticating flag on error
    isAuthenticating = false;
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
    // Create mobile-responsive name display
    const displayName = user.displayName || user.email;
    const isMobile = window.innerWidth <= 768;
    
    // Mobile: Show initials only (e.g., "BM")
    // Desktop: Show full name or shortened name
    const shortName = isMobile ? 
      displayName.split(' ').map(part => part.charAt(0)).join('').toUpperCase() :
      (displayName.length > 20 ? 
        displayName.split(' ').map(part => part.charAt(0)).join('').toUpperCase() + 
        (displayName.split(' ').length > 1 ? '' : displayName.substring(0, 8) + '...') :
        displayName);
    
    userProfileArea.innerHTML = `
      <div class="user-profile">
        <div class="user-info">
          <img src="${user.photoURL || '/images/default-avatar.png'}" 
               alt="Profile" 
               class="user-avatar">
          <div class="user-details">
            <span class="user-name" title="${displayName}">${shortName}</span>
            <span class="user-email">${user.email.split('@')[0]}</span>
          </div>
        </div>
        <button id="sign-out-btn" class="sign-out-btn">
          <svg class="sign-out-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16,17 21,12 16,7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>
      <style>
        .user-profile {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.5rem 0.75rem;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(8px);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          min-width: 200px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
          min-width: 0;
        }
        
        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          flex-shrink: 0;
        }
        
        .user-details {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }
        
        .user-name {
          color: var(--md-default-fg-color);
          font-weight: 600;
          font-size: 0.875rem;
          letter-spacing: -0.02em;
          line-height: 1.2;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .user-email {
          color: var(--md-default-fg-color--light);
          font-weight: 400;
          font-size: 0.75rem;
          letter-spacing: -0.01em;
          line-height: 1.1;
          opacity: 0.7;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .sign-out-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #ef4444;
          padding: 0.5rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
          flex-shrink: 0;
          width: 32px;
          height: 32px;
        }
        
        .sign-out-btn:hover {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.3);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
        }
        
        .sign-out-btn:active {
          transform: translateY(0);
          box-shadow: 0 2px 4px rgba(239, 68, 68, 0.1);
        }
        
        .sign-out-icon {
          width: 14px;
          height: 14px;
          stroke-width: 1.5;
        }
        
        /* Dark theme adjustments */
        [data-md-color-scheme="slate"] .user-profile {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
        
        [data-md-color-scheme="slate"] .user-name {
          color: var(--md-default-fg-color);
        }
        
        [data-md-color-scheme="slate"] .user-email {
          color: var(--md-default-fg-color--light);
        }
        
        [data-md-color-scheme="slate"] .sign-out-btn {
          background: rgba(248, 113, 113, 0.1);
          border-color: rgba(248, 113, 113, 0.2);
          color: #f87171;
        }
        
        [data-md-color-scheme="slate"] .sign-out-btn:hover {
          background: rgba(248, 113, 113, 0.15);
          border-color: rgba(248, 113, 113, 0.3);
          box-shadow: 0 4px 12px rgba(248, 113, 113, 0.15);
        }
        
        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .user-profile {
            min-width: 160px;
            padding: 0.375rem 0.5rem;
            gap: 0.5rem;
          }
          
          .user-avatar {
            width: 28px;
            height: 28px;
          }
          
          .user-name {
            font-size: 0.8125rem;
          }
          
          .user-email {
            font-size: 0.6875rem;
          }
          
          .sign-out-btn {
            width: 28px;
            height: 28px;
            padding: 0.375rem;
          }
          
          .sign-out-icon {
            width: 12px;
            height: 12px;
          }
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
    // Track logout before signing out
    if (auth.currentUser) {
      trackUserLogout(auth.currentUser);
    }
    
    await auth.signOut();
    console.log('[Firebase Auth] User signed out successfully');
  } catch (error) {
    console.error('[Firebase Auth] Sign out error:', error);
  }
}

// Show admin tab
function showAdminTab() {
  // Find admin tab in navigation - more comprehensive search
  const adminNavItems = document.querySelectorAll('a[href*="/admin/"], a[href*="admin/"]');
  adminNavItems.forEach(item => {
    const listItem = item.closest('li');
    if (listItem) {
      listItem.classList.add('admin-tab-parent', 'admin-visible');
      listItem.style.display = 'block';
      listItem.style.visibility = 'visible';
      listItem.style.opacity = '1';
      
      // Add admin styling
      item.classList.add('admin-visible');
      item.style.color = '#ff6b35';
      item.style.fontWeight = '600';
      item.style.display = 'block';
      item.style.visibility = 'visible';
      item.style.opacity = '1';
      
      // Add admin indicator
      const adminIndicator = document.createElement('span');
      adminIndicator.innerHTML = '👑 ';
      adminIndicator.className = 'admin-indicator';
      if (!item.querySelector('.admin-indicator')) {
        item.prepend(adminIndicator);
      }
    }
  });
  
  // Also handle MkDocs Material theme specific elements
  const tabsItems = document.querySelectorAll('.md-tabs__item a[href*="admin/"]');
  tabsItems.forEach(item => {
    const tabItem = item.closest('.md-tabs__item');
    if (tabItem) {
      tabItem.classList.add('admin-visible');
      tabItem.style.display = 'block';
      tabItem.style.visibility = 'visible';
      item.classList.add('admin-visible');
    }
  });
  
  console.log('[Firebase Auth] Admin tab shown');
}

// Hide admin tab
function hideAdminTab() {
  // Find and hide admin tab in navigation
  const adminNavItems = document.querySelectorAll('a[href*="/admin/"], a[href*="admin/"]');
  adminNavItems.forEach(item => {
    const listItem = item.closest('li');
    if (listItem) {
      listItem.classList.remove('admin-tab-parent', 'admin-visible');
      listItem.style.display = 'none';
      listItem.style.visibility = 'hidden';
      listItem.style.opacity = '0';
      
      item.classList.remove('admin-visible');
      item.style.display = 'none';
      item.style.visibility = 'hidden';
      item.style.opacity = '0';
      
      // Remove admin indicator
      const indicator = item.querySelector('.admin-indicator');
      if (indicator) {
        indicator.remove();
      }
    }
  });
  
  // Also handle MkDocs Material theme specific elements
  const tabsItems = document.querySelectorAll('.md-tabs__item a[href*="admin/"]');
  tabsItems.forEach(item => {
    const tabItem = item.closest('.md-tabs__item');
    if (tabItem) {
      tabItem.classList.remove('admin-visible');
      tabItem.style.display = 'none';
      tabItem.style.visibility = 'hidden';
      item.classList.remove('admin-visible');
    }
  });
  
  console.log('[Firebase Auth] Admin tab hidden');
}

// ============================================
// ANALYTICS TRACKING FUNCTIONS
// ============================================

// Track user login event
function trackUserLogin(user) {
  try {
    const loginData = {
      timestamp: new Date().toISOString(),
      user_id: user.uid,
      email: user.email,
      display_name: user.displayName,
      photo_url: user.photoURL,
      is_admin: user.email === ADMIN_EMAIL,
      login_method: 'google',
      user_agent: navigator.userAgent,
      referrer: document.referrer || 'direct'
    };
    
    // Log to Firebase Analytics
    analytics.logEvent('login', {
      method: 'google',
      user_type: user.email === ADMIN_EMAIL ? 'admin' : 'user'
    });
    
    // Store in localStorage for admin dashboard
    const analyticsData = getStoredAnalytics();
    analyticsData.logins.push(loginData);
    
    // Keep only last 100 logins to prevent localStorage overflow
    if (analyticsData.logins.length > 100) {
      analyticsData.logins = analyticsData.logins.slice(-100);
    }
    
    storeAnalytics(analyticsData);
    console.log('[Analytics] Login tracked:', loginData);
    
  } catch (error) {
    console.error('[Analytics] Error tracking login:', error);
  }
}

// Track user logout event
function trackUserLogout(user) {
  try {
    const logoutData = {
      timestamp: new Date().toISOString(),
      user_id: user.uid,
      email: user.email,
      session_duration: calculateSessionDuration(),
      is_admin: user.email === ADMIN_EMAIL
    };
    
    // Log to Firebase Analytics
    analytics.logEvent('logout', {
      user_type: user.email === ADMIN_EMAIL ? 'admin' : 'user'
    });
    
    // Store in localStorage for admin dashboard
    const analyticsData = getStoredAnalytics();
    analyticsData.logouts.push(logoutData);
    
    // Keep only last 100 logouts
    if (analyticsData.logouts.length > 100) {
      analyticsData.logouts = analyticsData.logouts.slice(-100);
    }
    
    storeAnalytics(analyticsData);
    console.log('[Analytics] Logout tracked:', logoutData);
    
  } catch (error) {
    console.error('[Analytics] Error tracking logout:', error);
  }
}

// Calculate session duration
function calculateSessionDuration() {
  if (window.genaiUser && window.genaiUser.loginTime) {
    const loginTime = new Date(window.genaiUser.loginTime);
    const currentTime = new Date();
    return Math.round((currentTime - loginTime) / 1000); // Duration in seconds
  }
  return 0;
}

// Get stored analytics data
function getStoredAnalytics() {
  try {
    const stored = localStorage.getItem('genai_analytics');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('[Analytics] Error reading stored analytics:', error);
  }
  
  // Default structure
  return {
    logins: [],
    logouts: [],
    pageViews: [],
    lastUpdated: new Date().toISOString()
  };
}

// Store analytics data
function storeAnalytics(data) {
  try {
    data.lastUpdated = new Date().toISOString();
    localStorage.setItem('genai_analytics', JSON.stringify(data));
  } catch (error) {
    console.error('[Analytics] Error storing analytics:', error);
  }
}

// Track page views
function trackPageView(pagePath) {
  try {
    if (!window.genaiUser) return;
    
    const pageViewData = {
      timestamp: new Date().toISOString(),
      user_id: window.genaiUser.uid,
      email: window.genaiUser.email,
      page_path: pagePath || window.location.pathname,
      page_title: document.title,
      is_admin: window.genaiUser.isAdmin,
      referrer: document.referrer
    };
    
    // Log to Firebase Analytics
    analytics.logEvent('page_view', {
      page_title: document.title,
      page_location: window.location.href
    });
    
    // Store in localStorage for admin dashboard
    const analyticsData = getStoredAnalytics();
    analyticsData.pageViews.push(pageViewData);
    
    // Keep only last 200 page views
    if (analyticsData.pageViews.length > 200) {
      analyticsData.pageViews = analyticsData.pageViews.slice(-200);
    }
    
    storeAnalytics(analyticsData);
    console.log('[Analytics] Page view tracked:', pageViewData);
    
  } catch (error) {
    console.error('[Analytics] Error tracking page view:', error);
  }
}

// Get analytics summary for admin dashboard
function getAnalyticsSummary() {
  const analyticsData = getStoredAnalytics();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Filter data by time periods
  const todayLogins = analyticsData.logins.filter(login => 
    new Date(login.timestamp) >= today
  );
  const weekLogins = analyticsData.logins.filter(login => 
    new Date(login.timestamp) >= lastWeek
  );
  
  const todayPageViews = analyticsData.pageViews.filter(view => 
    new Date(view.timestamp) >= today
  );
  const weekPageViews = analyticsData.pageViews.filter(view => 
    new Date(view.timestamp) >= lastWeek
  );
  
  // Get unique users
  const uniqueUsersToday = new Set(todayLogins.map(login => login.email)).size;
  const uniqueUsersWeek = new Set(weekLogins.map(login => login.email)).size;
  const totalUniqueUsers = new Set(analyticsData.logins.map(login => login.email)).size;
  
  // Get latest users (last 10)
  const latestLogins = analyticsData.logins
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);
  
  return {
    summary: {
      totalLogins: analyticsData.logins.length,
      totalPageViews: analyticsData.pageViews.length,
      totalUniqueUsers: totalUniqueUsers,
      todayLogins: todayLogins.length,
      todayPageViews: todayPageViews.length,
      todayUniqueUsers: uniqueUsersToday,
      weekLogins: weekLogins.length,
      weekPageViews: weekPageViews.length,
      weekUniqueUsers: uniqueUsersWeek
    },
    latestUsers: latestLogins,
    lastUpdated: analyticsData.lastUpdated
  };
}

// ============================================
// ADMIN MANAGEMENT INTEGRATION FUNCTIONS
// ============================================

// Check if user is admin from local admin management system
function checkAdminStatus(email) {
  try {
    // Always allow the original super admin
    if (email === ADMIN_EMAIL) {
      return true;
    }
    
    // Check local admin management system
    const adminData = JSON.parse(localStorage.getItem('genai_admins') || '{"admins": []}');
    return adminData.admins.some(admin => admin.email === email);
    
  } catch (error) {
    console.error('[Firebase Auth] Error checking admin status:', error);
    return email === ADMIN_EMAIL; // Fallback to original admin
  }
}

// Update admin user data when they log in
function updateAdminUserData(user) {
  try {
    const adminData = JSON.parse(localStorage.getItem('genai_admins') || '{"admins": []}');
    
    // Initialize admin data if it doesn't exist (for the super admin)
    if (adminData.admins.length === 0 && user.email === ADMIN_EMAIL) {
      adminData.admins.push({
        email: ADMIN_EMAIL,
        name: user.displayName || 'Baskar Manickam',
        role: 'Super Admin',
        permissions: ['analytics', 'user_management', 'content_management', 'admin_management'],
        added_date: new Date().toISOString().split('T')[0],
        added_by: 'System'
      });
      localStorage.setItem('genai_admins', JSON.stringify(adminData));
    }
    
    // Update existing admin data with latest user info
    const adminIndex = adminData.admins.findIndex(admin => admin.email === user.email);
    if (adminIndex !== -1) {
      adminData.admins[adminIndex].name = user.displayName || adminData.admins[adminIndex].name;
      adminData.admins[adminIndex].last_login = new Date().toISOString();
      localStorage.setItem('genai_admins', JSON.stringify(adminData));
    }
    
  } catch (error) {
    console.error('[Firebase Auth] Error updating admin data:', error);
  }
}

// Initialize admin data on first load
function initializeAdminData() {
  try {
    const adminData = JSON.parse(localStorage.getItem('genai_admins') || '{"admins": []}');
    
    // If no admin data exists, create initial structure
    if (adminData.admins.length === 0) {
      const initialAdminData = {
        admins: [],
        config: {
          max_admins: 10,
          require_approval: false,
          auto_expire_days: 365
        },
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('genai_admins', JSON.stringify(initialAdminData));
    }
    
  } catch (error) {
    console.error('[Firebase Auth] Error initializing admin data:', error);
  }
}

// Global functions for external access
window.genaiAuth = {
  signOut: handleSignOut,
  getCurrentUser: () => auth.currentUser,
  isAdmin: () => auth.currentUser ? checkAdminStatus(auth.currentUser.email) : false,
  getAnalyticsSummary: getAnalyticsSummary,
  trackPageView: trackPageView,
  checkAdminStatus: checkAdminStatus
};

// Handle MkDocs Material page navigation to maintain admin tab visibility
document$.subscribe(() => {
  console.log('[Firebase Auth] Page navigation detected');
  
  // Wait for DOM to be updated, then reapply admin tab visibility
  setTimeout(() => {
    if (window.genaiUser && window.genaiUser.isAdmin) {
      showAdminTab();
    } else {
      hideAdminTab();
    }
    
    // Track page view for authenticated users
    if (window.genaiUser) {
      trackPageView();
    }
  }, 100);
});

console.log('[Firebase Auth] Authentication system loaded');