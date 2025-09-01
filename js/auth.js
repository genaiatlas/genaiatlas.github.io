/* docs/js/auth.js
   Gen AI Atlas – Supabase auth + UI + Admin visibility + analytics
   - Restores login modal + header profile block
   - Shows Admin tab ONLY for baskarmanickam@gmail.com
   - SPA-safe, idempotent, exposes global signIn/signOut
*/

(function () {
    // Prevent double-loading (fixes “Identifier has already been declared”)
    if (window.__gaAuthLoaded) {
      console.warn("[auth] auth.js already loaded — skipping second init.");
      return;
    }
    window.__gaAuthLoaded = true;
  
    // ---------------------- Config ----------------------
    const ADMIN_EMAIL = "baskarmanickam@gmail.com".toLowerCase();
  
    // ---------------------- Utilities -------------------
    function getMeta(name) {
      const el = document.querySelector(`meta[name="${name}"]`);
      return el ? (el.getAttribute("content") || "").trim() : "";
    }
    function isAdminEmail(email) {
      return (email || "").toLowerCase() === ADMIN_EMAIL;
    }
    function setAdminClass(isAdmin) {
      const root = document.documentElement;
      console.log("[auth] Setting admin class:", isAdmin);
      if (isAdmin) {
        root.classList.add("is-admin");
        localStorage.setItem("ga_is_admin", "1");
        console.log("[auth] Added is-admin class to HTML root");
      } else {
        root.classList.remove("is-admin");
        localStorage.removeItem("ga_is_admin");
        console.log("[auth] Removed is-admin class from HTML root");
      }
    }
    function protectAdminRoutes(isAdmin) {
      const path = (window.location.pathname || "").toLowerCase();
      if (!isAdmin && path.includes("/admin/")) {
        console.warn("[auth] Non-admin on /admin/* — redirecting to /");
        window.location.replace("/");
      }
    }
  
    // Ensure we have a header slot for auth UI
    function ensureAuthSlot() {
      let slot = document.getElementById("auth-button");
      if (slot) return slot;
  
      const container =
        document.querySelector(".md-header__options") ||
        document.querySelector(".md-header__inner .md-header__topic + .md-flex--nogrow") ||
        document.querySelector(".md-header__inner") ||
        document.querySelector("header") ||
        document.body;
  
      slot = document.createElement("div");
      slot.id = "auth-button";
      slot.style.cssText = "margin-left: auto; display: flex; align-items: center;";
      container.appendChild(slot);
      return slot;
    }
  
    // Modal helpers — uses existing #login-modal if present, else creates fallback
    function showLoginOverlay() {
      const builtIn = document.getElementById("login-modal");
      if (builtIn) {
        builtIn.style.display = "flex";
        return;
      }
      // Fallback (matches your original overlay)
      if (document.getElementById("login-overlay")) return;
      const overlay = document.createElement("div");
      overlay.id = "login-overlay";
      overlay.innerHTML = `
        <div class="login-modal">
          <div class="login-content">
            <h2>Welcome to Gen AI Atlas</h2>
            <p>Please sign in with your Google account to access the content.</p>
            <button onclick="signIn()" class="google-signin-btn">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
    }
    function hideLoginOverlay() {
      const builtIn = document.getElementById("login-modal");
      if (builtIn) builtIn.style.display = "none";
      const overlay = document.getElementById("login-overlay");
      if (overlay) overlay.remove();
    }
  
    // ----------------- Supabase Bootstrap ----------------
    const SUPABASE_URL = getMeta("supabase-url");
    const SUPABASE_KEY = getMeta("supabase-key");
  
    // IMPORTANT: sb & currentSession must be in outer scope for global functions
    let sb = null;
    let currentSession = null;
    let visitLogged = false;
  
    if (!window.supabase || !SUPABASE_URL || !SUPABASE_KEY) {
      console.warn("[auth] Missing Supabase CDN or meta tags:");
      console.warn("  - window.supabase:", !!window.supabase);
      console.warn("  - SUPABASE_URL:", !!SUPABASE_URL);
      console.warn("  - SUPABASE_KEY:", !!SUPABASE_KEY);
      console.warn("Admin will never be shown.");
      
      setAdminClass(false);
      protectAdminRoutes(false);
      // Render a simple Sign in button that warns about missing config
      const slot = ensureAuthSlot();
      slot.innerHTML = `<button class="sign-in-btn" type="button">Sign in with Google</button>`;
      slot.firstElementChild?.addEventListener("click", () =>
        alert("Auth is not available (Supabase config missing).")
      );
      showLoginOverlay();
      return;
    }
  
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  
    // ----------------- UI Rendering ----------------------
    function updateHeaderUI(session) {
      const slot = ensureAuthSlot();
  
      if (session?.user) {
        const meta = session.user.user_metadata || {};
        const name = meta.full_name || meta.name || (session.user.email || "").split("@")[0];
        const email = session.user.email || "";
        const avatar = meta.avatar_url || meta.picture || "";
  
        slot.innerHTML = `
          <div class="user-profile">
            ${avatar ? `<img src="${avatar}" class="user-avatar" alt="Profile" onerror="this.style.display='none'">` : ""}
            <div class="user-info">
              <div class="user-name">${name}</div>
              <div class="user-email">${email}</div>
            </div>
            <button class="sign-out-btn" type="button" onclick="signOut()">Sign Out</button>
          </div>
        `;
      } else {
        slot.innerHTML = `
          <button class="sign-in-btn" type="button" onclick="signIn()">Sign in with Google</button>
        `;
      }
    }
  
    // --------------- Analytics (best-effort) --------------
    async function trackUserVisit(session) {
      if (!session?.user || visitLogged) return;
      visitLogged = true;
      try {
        const { error } = await sb
          .from("user_visits")
          .insert({
            user_id: session.user.id,
            email: session.user.email,
            page_url: window.location.href,
            page_title: document.title,
            visited_at: new Date().toISOString(),
            user_agent: navigator.userAgent
          });
        if (error) console.warn("[auth] visit logging error:", error.message);
      } catch (e) {
        console.warn("[auth] visit logging failed:", e);
      }
    }
  
    // ----------------- Apply State ------------------------
    function applyState(session) {
      currentSession = session || null;
  
      const email = session?.user?.email || "";
      const admin = isAdminEmail(email);
      
      console.log("[auth] Applying state:");
      console.log("  - User:", session?.user ? "authenticated" : "not authenticated");
      console.log("  - Email:", email);
      console.log("  - Is Admin:", admin);
  
      setAdminClass(admin);
      protectAdminRoutes(admin);
      updateHeaderUI(session);
  
      if (session?.user) {
        console.log("[auth] Hiding login overlay, showing user profile");
        hideLoginOverlay();
        trackUserVisit(session);
      } else {
        console.log("[auth] Showing login overlay");
        showLoginOverlay();
      }
    }
  
    // ----------------- Auth Actions -----------------------
    // Expose as globals because buttons call them directly
    window.signIn = async function () {
      try {
        console.log("[auth] Starting Google OAuth sign-in...");
        const redirectTo = window.location.origin + window.location.pathname;
        console.log("[auth] Redirect URL:", redirectTo);
        
        await sb.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: redirectTo }
        });
      } catch (e) {
        console.error("[auth] signIn failed:", e);
        alert("Sign in failed. Check console for details.");
      }
    };
  
    window.signOut = async function () {
      try {
        await sb.auth.signOut();
        applyState(null);
        window.location.reload(); // ensure CSS/nav fully refresh
      } catch (e) {
        console.error("[auth] signOut failed:", e);
      }
    };
  
    // ----------------- Bootstrap Flow ---------------------
    async function bootstrap() {
      console.log("[auth] Starting bootstrap...");
      
      // Optimistic restore to avoid flicker on first paint
      if (localStorage.getItem("ga_is_admin") === "1") {
        document.documentElement.classList.add("is-admin");
      }

      try {
        // Initial session
        const { data: { session }, error } = await sb.auth.getSession();
        if (error) {
          console.warn("[auth] Error getting session:", error);
        }
        console.log("[auth] Initial session:", session ? "authenticated" : "not authenticated");
        applyState(session);

        // Listen for login/logout and apply
        sb.auth.onAuthStateChange((_event, newSession) => {
          console.log("[auth] Auth state changed:", _event, newSession ? "authenticated" : "not authenticated");
          applyState(newSession);
        });

        // Re-apply after MkDocs Material SPA navigations
        document.addEventListener("navigation", () => {
          console.log("[auth] Navigation event, re-applying state");
          applyState(currentSession);
        });

        // Force re-application every few seconds to ensure admin visibility
        setInterval(() => {
          if (currentSession?.user) {
            const isAdmin = isAdminEmail(currentSession.user.email);
            const hasAdminClass = document.documentElement.classList.contains("is-admin");
            if (isAdmin && !hasAdminClass) {
              console.log("[auth] Admin class missing, re-applying");
              setAdminClass(true);
            }
          }
        }, 3000);

        // If DOM swaps header/nav, reassert admin class & re-render quickly
        const mo = new MutationObserver(() => {
          if (currentSession?.user) {
            setAdminClass(isAdminEmail(currentSession.user.email));
          }
          updateHeaderUI(currentSession);
        });
        mo.observe(document.body, { childList: true, subtree: true });
      } catch (error) {
        console.error("[auth] Bootstrap error:", error);
        applyState(null);
      }
    }
  
    // Public API (if you want to call from elsewhere)
    window.gaAuth = {
      getSession: () => currentSession
    };
  
    // Go!
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", bootstrap);
    } else {
      bootstrap();
    }
  })();