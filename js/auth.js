/* docs/js/auth.js
   Gen AI Atlas – Supabase auth + Admin tab visibility controller
   - Shows Admin tab ONLY for baskarmanickam@gmail.com
   - Hides for all others
   - Safe against double-load and SPA navigations (MkDocs Material)
*/

(function () {
    // Prevent double-loading errors such as “Identifier has already been declared”
    if (window.__gaAuthLoaded) {
      console.warn("[auth] auth.js already loaded — skipping second init.");
      return;
    }
    window.__gaAuthLoaded = true;
  
    // ---------- Config ----------
    const ADMIN_EMAIL = "baskarmanickam@gmail.com";
  
    // ---------- Helpers ----------
    function getMeta(name) {
      const el = document.querySelector(`meta[name="${name}"]`);
      return el ? el.getAttribute("content") : "";
    }
  
    function isAdminEmail(email) {
      return (email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase();
    }
  
    function setAdminClass(isAdmin) {
      const root = document.documentElement;
      console.log("[auth] setAdminClass:", isAdmin);
      if (isAdmin) {
        root.classList.add("is-admin");
        localStorage.setItem("ga_is_admin", "1");
      } else {
        root.classList.remove("is-admin");
        localStorage.removeItem("ga_is_admin");
      }
    }
  
    function protectAdminRoutes(isAdmin) {
      const path = (window.location.pathname || "").toLowerCase();
      // If a non-admin tries to hit /admin/* directly, send them home
      if (!isAdmin && path.includes("/admin/")) {
        console.warn("[auth] Non-admin on /admin/* — redirecting.");
        window.location.replace("/");
      }
    }
  
    function updateHeaderUI(session) {
      const authButton = document.getElementById("auth-button");
      if (!authButton) return;
  
      if (session?.user) {
        const meta = session.user.user_metadata || {};
        const name =
          meta.full_name || meta.name || (session.user.email || "").split("@")[0];
        const email = session.user.email || "";
        const avatar = meta.avatar_url || meta.picture || "";
  
        authButton.innerHTML = `
          <div class="user-profile">
            ${avatar ? `<img src="${avatar}" class="user-avatar" alt="Profile" onerror="this.style.display='none'">` : ""}
            <div class="user-info">
              <div class="user-name">${name}</div>
              <div class="user-email">${email}</div>
            </div>
            <button class="sign-out-btn" type="button">Sign Out</button>
          </div>
        `;
        const btn = authButton.querySelector(".sign-out-btn");
        if (btn) btn.addEventListener("click", signOut);
      } else {
        authButton.innerHTML = `
          <button class="sign-in-btn" id="ga-signin-btn" type="button">Sign in with Google</button>
        `;
        const btn = document.getElementById("ga-signin-btn");
        if (btn) btn.addEventListener("click", signIn);
      }
    }
  
    // ---------- Supabase bootstrap ----------
    const SUPABASE_URL = getMeta("supabase-url");
    const SUPABASE_KEY = getMeta("supabase-key");
  
    if (!window.supabase || !SUPABASE_URL || !SUPABASE_KEY) {
      console.warn(
        "[auth] Missing Supabase setup (CDN or meta tags). Admin tab will not appear."
      );
      setAdminClass(false);
      protectAdminRoutes(false);
      return;
    }
  
    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    let currentSession = null;
  
    function applyState(session) {
      currentSession = session || null;
  
      const email = session?.user?.email || "";
      const admin = isAdminEmail(email);
  
      console.log("[auth] session email:", email, "isAdmin:", admin);
  
      setAdminClass(admin);
      protectAdminRoutes(admin);
      updateHeaderUI(session);
    }
  
    async function bootstrap() {
      try {
        // 1) Initial session
        const { data: { session } } = await sb.auth.getSession();
        applyState(session);
  
        // 2) Listen for login/logout
        sb.auth.onAuthStateChange((_event, newSession) => {
          applyState(newSession);
        });
  
        // 3) Re-apply after SPA navigations in MkDocs Material
        document.addEventListener("navigation", () => {
          // Do not change session here; just re-assert classes/UI based on currentSession
          applyState(currentSession);
        });
  
        // 4) Defensive: if DOM replaces header/nav, re-assert is-admin quickly
        const mo = new MutationObserver(() => {
          if (currentSession?.user) {
            setAdminClass(isAdminEmail(currentSession.user.email));
          }
        });
        mo.observe(document.body, { childList: true, subtree: true });
      } catch (err) {
        console.error("[auth] bootstrap error:", err);
        setAdminClass(false);
        protectAdminRoutes(false);
      }
    }
  
    // ---------- Public actions ----------
    async function signIn() {
      try {
        await sb.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: window.location.origin + window.location.pathname
          }
        });
      } catch (e) {
        console.error("[auth] signIn failed:", e);
        alert("Sign in failed. See console for details.");
      }
    }
  
    async function signOut() {
      try {
        await sb.auth.signOut();
        applyState(null);
        // Force a reload to pick up CSS state & clear any cached nav
        window.location.reload();
      } catch (e) {
        console.error("[auth] signOut failed:", e);
      }
    }
  
    // Expose small API if needed elsewhere
    window.gaAuth = {
      signIn,
      signOut,
      getSession: () => currentSession,
    };
  
    // Go!
    bootstrap();
  })();