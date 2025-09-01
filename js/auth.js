/* docs/js/auth.js
   Gen AI Atlas – Supabase auth + UI + Admin visibility + analytics
   - Preserves header user block (avatar, name, email, Sign Out)
   - Shows Admin tab ONLY for baskarmanickam@gmail.com
   - SPA-safe, idempotent, no duplicate variable errors
*/

(function () {
    // Prevent double-loading (fixes “Identifier has already been declared”)
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
    }
    function protectAdminRoutes(isAdmin) {
      const path = (window.location.pathname || "").toLowerCase();
      if (!isAdmin && path.includes("/admin/")) {
        console.warn("[auth] Non-admin on /admin/* — redirecting to /");
        window.location.replace("/");
      }
    }
  
    // Optimistic class to avoid flicker if user was admin in last session
    if (localStorage.getItem("ga_is_admin") === "1") {
      document.documentElement.classList.add("is-admin");
    } else {
      document.documentElement.classList.remove("is-admin");
    }
  
    // Guarantee we have a header slot to render into
    function ensureAuthSlot() {
      let slot = document.getElementById("auth-button");
      if (slot) return slot;
  
      // Try common Material header container
      const container =
        document.querySelector(".md-header__options") ||
        document.querySelector(".md-header__inner") ||
        document.querySelector("header") ||
        document.body;
  
      slot = document.createElement("div");
      slot.id = "auth-button";
      slot.className = "md-header__option";
      slot.style.marginLeft = "auto";
      container.appendChild(slot);
      return slot;
    }
  
    // Overlay helpers (your modal is in head.html)
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
      } else {
        slot.innerHTML = `
          <button class="sign-in-btn" id="ga-signin-btn" type="button">Sign in with Google</button>
        `;
        const btn = document.getElementById("ga-signin-btn");
        if (btn) btn.addEventListener("click", signIn);
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
    }
  
    // ----------------- Auth Actions -----------------------
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
        alert("Sign in failed. Check console for details.");
      }
    }
  
    async function signOut() {
      try {
        await sb.auth.signOut();
        applyState(null);
        window.location.reload(); // ensure CSS/nav fully refresh
      } catch (e) {
        console.error("[auth] signOut failed:", e);
      }
    }
  
    // ----------------- Bootstrap Flow ---------------------
    async function bootstrap() {
      // Initial session
      const { data: { session } } = await sb.auth.getSession();
      applyState(session);
  
      // Listen for login/logout and apply
      sb.auth.onAuthStateChange((_event, newSession) => {
        applyState(newSession);
      });
  
      // Re-apply after MkDocs Material SPA navigations
      document.addEventListener("navigation", () => {
        applyState(currentSession);
      });
  
      // If DOM swaps header/nav, reassert admin class & re-render quickly
      const mo = new MutationObserver(() => {
        if (currentSession?.user) {
          setAdminClass(isAdminEmail(currentSession.user.email));
        }
        updateHeaderUI(currentSession);
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }
  
    // Expose small API if you want to use elsewhere
    window.gaAuth = {
      signIn,
      signOut,
      getSession: () => currentSession
    };
  
    // Go!
    bootstrap();
  })();