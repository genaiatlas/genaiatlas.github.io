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

//* global supabase */
(function () {
    const ADMIN_EMAIL = "baskarmanickam@gmail.com";
  
    // -------------- helpers -----------------
    function setAdmin(isAdmin) {
      const html = document.documentElement;
      if (isAdmin) html.classList.add("is-admin");
      else html.classList.remove("is-admin");
    }
  
    function isAdminEmail(email) {
      return (email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase();
    }
  
    function guardAdminClicks() {
      document.addEventListener(
        "click",
        (e) => {
          const a = e.target.closest("a[href]");
          if (!a) return;
  
          const href = a.getAttribute("href") || "";
          const pointsToAdmin = /(^|\/)admin(\/|$)/i.test(href);
  
          if (
            pointsToAdmin &&
            !document.documentElement.classList.contains("is-admin")
          ) {
            e.preventDefault();
            // redirect home (or show a toast)
            window.location.assign("/");
          }
        },
        true
      );
    }
  
    // Try to pick up an existing Supabase client or create one.
    function getSupabaseClient() {
      // 1) Existing client created elsewhere?
      if (window.__sb && window.__sb.auth) return window.__sb;
      if (window.supabaseClient && window.supabaseClient.auth)
        return window.supabaseClient;
  
      // 2) Try to initialize from meta tags or globals
      const metaUrl =
        document.querySelector('meta[name="supabase-url"]')?.content || null;
      const metaKey =
        document.querySelector('meta[name="supabase-key"]')?.content || null;
  
      const globalUrl = window.__SUPABASE_URL || window.SUPABASE_URL || null;
      const globalKey =
        window.__SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY || null;
  
      const lsUrl = localStorage.getItem("SUPABASE_URL");
      const lsKey = localStorage.getItem("SUPABASE_ANON_KEY");
  
      const url = metaUrl || globalUrl || lsUrl;
      const key = metaKey || globalKey || lsKey;
  
      if (window.supabase && typeof window.supabase.createClient === "function") {
        if (url && key) {
          try {
            const client = window.supabase.createClient(url, key);
            window.__sb = client; // cache for reuse
            return client;
          } catch (e) {
            console.warn("auth: createClient failed", e);
          }
        } else {
          console.warn(
            "auth: Supabase URL/KEY not found. Provide meta tags or globals."
          );
        }
      } else {
        console.warn(
          "auth: supabase library not loaded. Ensure CDN script is before js/auth.js"
        );
      }
      return null;
    }
  
    async function refreshUserState(client) {
      try {
        const { data, error } = await client.auth.getUser();
        if (error) throw error;
        const email = data?.user?.email || null;
        setAdmin(isAdminEmail(email));
      } catch (err) {
        console.warn("auth: getUser failed", err);
        setAdmin(false);
      }
    }
  
    // -------------- main -----------------
    document.addEventListener("DOMContentLoaded", async () => {
      // Hide Admin by default until we confirm user
      setAdmin(false);
  
      const client = getSupabaseClient();
      if (!client) {
        // Without a client, we cannot ever show Admin
        guardAdminClicks();
        return;
      }
  
      // Initial evaluation
      await refreshUserState(client);
  
      // React to sign-in/out
      client.auth.onAuthStateChange((_event, session) => {
        const email = session?.user?.email || null;
        setAdmin(isAdminEmail(email));
      });
  
      guardAdminClicks();
    });
  })();