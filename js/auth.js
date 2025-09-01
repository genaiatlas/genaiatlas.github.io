/* docs/js/auth.js
   Gen AI Atlas – Supabase auth + UI + Admin visibility + analytics
   - Header user block (avatar, name, email, Sign Out)
   - Admin tab ONLY for baskarmanickam@gmail.com
   - SPA-safe, idempotent, resilient to header/nav rewrites
*/

(function () {
    // Prevent double-loading
    if (window.__gaAuthLoaded) {
      console.warn("[auth] auth.js already loaded — skipping second init.");
      return;
    }
    window.__gaAuthLoaded = true;
  
    // ---------------------- Config ----------------------
    const ADMIN_EMAIL = "baskarmanickam@gmail.com";
  
    // ---------------------- Utilities -------------------
    function getMeta(name) {
      const el = document.querySelector(`meta[name="${name}"]`);
      return el ? el.getAttribute("content") : "";
    }
    function isAdminEmail(email) {
      return (email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase();
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
      console.log("[auth] setAdminClass:", isAdmin);
    }
    function protectAdminRoutes(isAdmin) {
      const path = (window.location.pathname || "").toLowerCase();
      if (!isAdmin && path.includes("/admin/")) {
        console.warn("[auth] Non-admin on /admin/* — redirecting to /");
        window.location.replace("/");
      }
    }
  
    // Create/locate the header slot for the auth UI
    function ensureAuthSlot() {
      let slot = document.getElementById("auth-button");
      if (slot) return slot;
  
      const headerOptions =
        document.querySelector(".md-header__options") ||
        document.querySelector(".md-header__inner") ||
        document.querySelector("header");
  
      slot = document.createElement("div");
      slot.id = "auth-button";
      // This class gives proper spacing in Material header
      slot.className = "md-header__option";
      // Fallback to body if header not yet in DOM
      (headerOptions || document.body).appendChild(slot);
  
      console.log("[auth] ensureAuthSlot: created", slot);
      return slot;
    }
  
    // Overlay helpers (your modal markup/styles are in head.html)
    function showLoginOverlay() {
      const overlay = document.getElementById("login-modal");
      if (overlay) overlay.style.display = "flex";
    }
    function hideLoginOverlay() {
      const overlay = document.getElementById("login-modal");
      if (overlay) overlay.style.display = "none";
    }
  
    // ----------------- Supabase Bootstrap ----------------
    const SUPABASE_URL = getMeta("supabase-url");
    const SUPABASE_KEY = getMeta("supabase-key");
  
    if (!window.supabase || !SUPABASE_URL || !SUPABASE_KEY) {
      console.warn("[auth] Missing Supabase CDN or meta tags. Admin will never be shown.");
      setAdminClass(false);
      protectAdminRoutes(false);
      ensureAuthSlot().innerHTML = `
        <button class="sign-in-btn" id="ga-signin-btn" type="button">Sign in with Google</button>
      `;
      const btn = document.getElementById("ga-signin-btn");
      if (btn) btn.addEventListener("click", () => alert("Auth not available – missing configuration."));
      showLoginOverlay();
      return;
    }
  
    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    let currentSession = null;
    let visitLogged = false;
  
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
            <button class="sign-out-btn" type="button">Sign Out</button>
          </div>
        `;
        const btn = slot.querySelector(".sign-out-btn");
        if (btn) btn.addEventListener("click", signOut);
  
        console.log("[auth] Header UI rendered (signed-in):", { name, email });
      } else {
        slot.innerHTML = `
          <button class="sign-in-btn" id="ga-signin-btn" type="button">Sign in with Google</button>
        `;
        const btn = document.getElementById("ga-signin-btn");
        if (btn) btn.addEventListener("click", signIn);
        console.log("[auth] Header UI rendered (signed-out)");
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
  
      setAdminClass(admin);
      protectAdminRoutes(admin);
      updateHeaderUI(session);
  
      if (session?.user) {
        hideLoginOverlay();
        trackUserVisit(session);
      } else {
        showLoginOverlay();
      }
  
      console.log("[auth] applyState:", { email, admin, hasUser: !!session?.user });
    }
  
    // ----------------- Auth Actions -----------------------
    async function signIn() {
      try {
        console.log("[auth] signIn start");
        await sb.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: window.location.origin + window.location.pathname
          }
        });
      } catch (e) {
        console.error("[auth] signIn failed:", e);
        alert("Sign in failed. Check console for details.");
      }
    }
  
    async function signOut() {
      try {
        console.log("[auth] signOut start");
        await sb.auth.signOut();
        applyState(null);
        window.location.reload(); // ensure nav/CSS refresh cleanly
      } catch (e) {
        console.error("[auth] signOut failed:", e);
      }
    }
  
    // ----------------- Bootstrap Flow ---------------------
    async function bootstrap() {
      // Initial session from Supabase
      const { data: { session } } = await sb.auth.getSession();
      console.log("[auth] bootstrap(getSession):", session ? "has session" : "no session");
      applyState(session);
  
      // React to login/logout
      sb.auth.onAuthStateChange((_event, newSession) => {
        console.log("[auth] onAuthStateChange:", _event, !!newSession?.user);
        applyState(newSession);
      });
  
      // Re-apply after MkDocs Material SPA navigations
      document.addEventListener("navigation", () => {
        console.log("[auth] navigation event — reapplying UI/state");
        applyState(currentSession);
      });
  
      // Header DOM can be re-created by Material; re-render on mutations
      const mo = new MutationObserver(() => {
        if (currentSession?.user) {
          setAdminClass(isAdminEmail(currentSession.user.email));
        }
        updateHeaderUI(currentSession);
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }
  
    // Expose small API if you need it elsewhere
    window.gaAuth = {
      signIn,
      signOut,
      getSession: () => currentSession
    };
  
    // Go!
    bootstrap();
  })();