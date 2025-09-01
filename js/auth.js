// Supabase Authentication for Gen AI Atlas
// Replace YOUR_SUPABASE_URL and YOUR_SUPABASE_ANON_KEY with your actual values

const SUPABASE_URL = 'https://jlntlqbzegkypadjoshn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsbnRscWJ6ZWdreXBhZGpvc2huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDAzODAsImV4cCI6MjA3MjI3NjM4MH0.AZ6F3CRvA965GKLvYdOxfkeZ1VQchO2fpguiV9c34Mk';

// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class AuthManager {
    constructor() {
        this.user = null;
        this.initialized = false;
        this.init();
    }

    async init() {
        // Check for existing session
        const { data: { session } } = await supabaseClient.auth.getSession();
        this.user = session?.user || null;
        this.initialized = true;
        
        // Listen for auth changes
        supabaseClient.auth.onAuthStateChange((event, session) => {
            this.user = session?.user || null;
            this.updateUI();
            
            if (event === 'SIGNED_IN') {
                this.trackUserVisit();
                this.hideLoginOverlay();
            } else if (event === 'SIGNED_OUT') {
                this.showLoginOverlay();
            }
        });

        // Initial UI update
        this.updateUI();
        
        // Show login overlay if not authenticated
        if (!this.user) {
            this.showLoginOverlay();
        } else {
            this.trackUserVisit();
        }
    }

    async signInWithGoogle() {
        try {
            console.log('Starting Google OAuth...');
            console.log('Current URL:', window.location.href);
            
            const { error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + window.location.pathname
                }
            });
            
            if (error) {
                console.error('Authentication error:', error);
                alert(`Authentication failed: ${error.message}`);
            }
        } catch (error) {
            console.error('Sign in error:', error);
            alert(`Sign in failed: ${error.message}`);
        }
    }

    async signOut() {
        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) {
                console.error('Sign out error:', error);
            }
        } catch (error) {
            console.error('Sign out error:', error);
        }
    }

    async trackUserVisit() {
        if (!this.user) return;
        
        try {
            const { error } = await supabaseClient
                .from('user_visits')
                .insert({
                    user_id: this.user.id,
                    email: this.user.email,
                    page_url: window.location.href,
                    page_title: document.title,
                    visited_at: new Date().toISOString(),
                    user_agent: navigator.userAgent
                });
                
            if (error) {
                console.error('Error tracking visit:', error);
            }
        } catch (error) {
            console.error('Visit tracking error:', error);
        }
    }

    updateUI() {
        const authButton = document.getElementById('auth-button');
        console.log('UpdateUI called, user:', this.user);
        console.log('AuthButton element:', authButton);
        
        if (this.user) {
            if (authButton) {
                const userName = this.user.user_metadata?.full_name || this.user.user_metadata?.name || this.user.email.split('@')[0];
                const userEmail = this.user.email;
                const avatarUrl = this.user.user_metadata?.avatar_url || this.user.user_metadata?.picture || '';
                
                authButton.innerHTML = `
                    <div class="user-profile">
                        <img src="${avatarUrl}" alt="Profile" class="user-avatar" onerror="this.style.display='none'">
                        <div class="user-info">
                            <div class="user-name">${userName}</div>
                            <div class="user-email">${userEmail}</div>
                        </div>
                        <button onclick="auth.signOut()" class="sign-out-btn">Sign Out</button>
                    </div>
                `;
                console.log('Updated UI with user profile:', { userName, userEmail, avatarUrl });
            }
        } else {
            if (authButton) {
                authButton.innerHTML = `
                    <button onclick="auth.signInWithGoogle()" class="sign-in-btn">
                        Sign in with Google
                    </button>
                `;
            }
        }
    }

    showLoginOverlay() {
        if (document.getElementById('login-overlay')) return;
        
        const overlay = document.createElement('div');
        overlay.id = 'login-overlay';
        overlay.innerHTML = `
            <div class="login-modal">
                <div class="login-content">
                    <h2>Welcome to Gen AI Atlas</h2>
                    <p>Please sign in with your Google account to access the content.</p>
                    <button onclick="auth.signInWithGoogle()" class="google-signin-btn">
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
        `;
        
        document.body.appendChild(overlay);
    }

    hideLoginOverlay() {
        const overlay = document.getElementById('login-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
}

// Initialize authentication when DOM is loaded
let auth;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        auth = new AuthManager();
    });
} else {
    auth = new AuthManager();
}

// docs/js/auth.js
(function () {
    const ADMIN_EMAIL = "baskarmanickam@gmail.com";
  
    // --- Helpers ---------------------------------------------------------------
    function getMeta(name) {
      const el = document.querySelector(`meta[name="${name}"]`);
      return el ? el.getAttribute("content") : "";
    }
  
    function setAdminClass(isAdmin) {
      const root = document.documentElement;
      if (isAdmin) {
        root.classList.add("is-admin");
        localStorage.setItem("ga_is_admin", "1");
      } else {
        root.classList.remove("is-admin");
        localStorage.removeItem("ga_is_admin");
      }
    }
  
    function protectAdminRoutes(isAdmin) {
      const path = window.location.pathname || "";
      if (!isAdmin && /\/admin\//.test(path)) {
        // Send non-admins to a safe page
        window.location.replace("/");
      }
    }
  
    async function initAuth() {
      try {
        const SUPABASE_URL = getMeta("supabase-url");
        const SUPABASE_ANON_KEY = getMeta("supabase-key");
  
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
          console.warn("[auth] Missing Supabase meta tags; admin will never be shown.");
          setAdminClass(false);
          protectAdminRoutes(false);
          return;
        }
  
        // Supabase client (global from CDN)
        const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
        // Always re-check on load
        const { data: { session } } = await sb.auth.getSession();
        const email = session?.user?.email || "";
  
        const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        setAdminClass(isAdmin);
        protectAdminRoutes(isAdmin);
  
        // Keep header user block updated (optional – only if you render one)
        window.__gaSession = session;
  
        // React to login/logout events
        sb.auth.onAuthStateChange(async (_event, newSession) => {
          const newEmail = newSession?.user?.email || "";
          const nowAdmin = newEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();
          setAdminClass(nowAdmin);
          protectAdminRoutes(nowAdmin);
          window.__gaSession = newSession;
        });
  
        // Re-apply after MkDocs Material SPA navigations
        document.addEventListener("DOMContentLoaded", () => {
          if (window && window.location) {
            protectAdminRoutes(document.documentElement.classList.contains("is-admin"));
          }
        });
        // MkDocs Material emits a `DOMContentLoaded`-like event on every internal navigation
        document.addEventListener("navigation", () => {
          protectAdminRoutes(document.documentElement.classList.contains("is-admin"));
        });
  
      } catch (err) {
        console.error("[auth] Initialization error:", err);
        setAdminClass(false);
        protectAdminRoutes(false);
      }
    }
  
    // Run once at boot
    initAuth();
  
    // Small utility for your header button (optional)
    window.gaSignOut = async function () {
      try {
        const SUPABASE_URL = getMeta("supabase-url");
        const SUPABASE_ANON_KEY = getMeta("supabase-key");
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  
        const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        await sb.auth.signOut();
        setAdminClass(false);
        window.location.reload();
      } catch (e) {
        console.error("Sign-out failed:", e);
      }
    };
  })();