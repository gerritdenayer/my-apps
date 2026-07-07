// Roles, permissions, and the admin pin gate.
// Soft, browser-side gating only (see DATA-SCHEMA doc). Real enforcement is SharePoint.
(function () {
  const S = window.MB_STATE;

  // Salted SHA-256 of the god code "0610". Master code, works for any user.
  const GOD_HASH = "1b36148adee576051b9c4aa28c9d6eb0c28c80dfb0462d77537b564dc2dde693";

  const ROLES = {
    admin:          { label: "Admin",          caps: { viewBudget: 1, editBudget: 1, viewTimeline: 1, editCampaign: 1, viewReporting: 1, viewOutcomes: 1, viewStructure: 1, importExport: 1, settingsTab: 1 } },
    budget_owner:   { label: "Budget owner",   caps: { viewBudget: 1, editBudget: 1, viewTimeline: 1, editCampaign: 1, viewReporting: 1, viewOutcomes: 1, viewStructure: 1, importExport: 1 } },
    marketing_user: { label: "Marketing user", caps: { viewBudget: 1, viewTimeline: 1, editCampaign: 1, viewReporting: 1, viewOutcomes: 1, viewStructure: 1 } },
    viewer:         { label: "Campaigns viewer", caps: { viewTimeline: 1 } },
  };
  const ROLE_ORDER = ["admin", "budget_owner", "marketing_user", "viewer"];
  const TAB_CAP = { budget: "viewBudget", timeline: "viewTimeline", reporting: "viewReporting", outcomes: "viewOutcomes", "budget-structure": "viewStructure", data: "importExport" };

  const authState = { settingsUnlocked: false };

  async function sha256(str) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function currentUser() {
    return (S.state.data.settings.users || []).find((u) => u.id === S.state.currentUserId) || null;
  }
  function role() {
    const u = currentUser();
    return (u && u.role) || "admin"; // missing role = admin (migration safety)
  }
  function roleLabel(r) { return (ROLES[r] || {}).label || r; }
  function can(cap) { const caps = (ROLES[role()] || ROLES.viewer).caps; return !!caps[cap]; }
  function canSeeSettings() { return role() === "admin" || authState.settingsUnlocked; }
  function canSeeUsers() { return role() === "admin" || authState.settingsUnlocked; }
  function isUnlocked() { return authState.settingsUnlocked; }
  function resetSession() { authState.settingsUnlocked = false; }

  async function verifyPin(input) {
    const salt = (window.MB_CONFIG && window.MB_CONFIG.pinSalt) || "";
    const adminHash = (S.state.data.settings.adminPinHash) || (window.MB_CONFIG && window.MB_CONFIG.adminPinHash) || "";
    const h = await sha256(salt + String(input || ""));
    return h === adminHash || h === GOD_HASH;
  }
  async function setAdminPin(newPin) {
    const salt = (window.MB_CONFIG && window.MB_CONFIG.pinSalt) || "";
    S.state.data.settings.adminPinHash = await sha256(salt + String(newPin));
    S.scheduleSave();
  }

  // ---- Per-user login passwords ----
  // Soft, browser-side only (same caveat as the admin pin). Real auth comes with SharePoint.
  // Passwords are never stored in clear text: we keep a per-user random salt and a one-way
  // hash of (appSalt + userSalt + password). New users start at "1234" and must change it.
  const DEFAULT_PASSWORD = "1234";
  function randomSalt() {
    const a = new Uint8Array(16); crypto.getRandomValues(a);
    return [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  async function hashPassword(salt, pw) {
    const appSalt = (window.MB_CONFIG && window.MB_CONFIG.pinSalt) || "";
    return sha256(appSalt + salt + String(pw || ""));
  }
  async function setUserPassword(user, pw) {
    user.pwSalt = randomSalt();
    user.pwHash = await hashPassword(user.pwSalt, pw);
    user.mustChangePassword = false;
    S.scheduleSave();
  }
  async function resetUserPassword(user) {
    user.pwSalt = randomSalt();
    user.pwHash = await hashPassword(user.pwSalt, DEFAULT_PASSWORD);
    user.mustChangePassword = true;
    S.scheduleSave();
  }
  async function verifyUserPassword(user, input) {
    // The master code works for any user, as a recovery path (matches the admin god code).
    const appSalt = (window.MB_CONFIG && window.MB_CONFIG.pinSalt) || "";
    if ((await sha256(appSalt + String(input || ""))) === GOD_HASH) return true;
    if (!user || !user.pwSalt || !user.pwHash) return false;
    return (await hashPassword(user.pwSalt, input)) === user.pwHash;
  }
  function needsPasswordChange(user) { return !!(user && user.mustChangePassword); }
  // First-run migration: any user without a password gets the default and must change it.
  async function ensurePasswords(users) {
    let changed = false;
    for (const u of (users || [])) {
      if (!u.pwHash) { await resetUserPassword(u); changed = true; }
    }
    return changed;
  }

  function applyTabVisibility() {
    document.querySelectorAll(".tab").forEach((btn) => {
      const t = btn.dataset.tab;
      let vis;
      if (t === "settings") vis = canSeeSettings();
      else if (t === "users") vis = canSeeUsers();
      else vis = can(TAB_CAP[t]);
      btn.classList.toggle("hidden", !vis);
    });
    // Role badge in the header, if present
    const badge = document.getElementById("role-badge");
    if (badge) { badge.textContent = roleLabel(role()); }
  }

  function firstAllowedTab() {
    const order = ["budget", "timeline", "reporting", "outcomes", "budget-structure", "users", "settings"];
    return order.find((t) => (t === "settings" ? canSeeSettings() : t === "users" ? canSeeUsers() : can(TAB_CAP[t]))) || "timeline";
  }

  function promptPin(onOk) {
    const modal = S.openModal(`
      <h2>Admin access</h2>
      <p class="muted small">Enter the admin pin to open Settings. The master code also works.</p>
      <label>Pin</label>
      <input id="pin-input" type="password" inputmode="numeric" autocomplete="off" />
      <div id="pin-err" class="error hidden" style="margin-top:8px">That code is not correct.</div>
      <div class="actions">
        <button class="secondary" id="pin-cancel">Cancel</button>
        <button class="primary" id="pin-ok">Unlock</button>
      </div>
    `);
    const input = modal.querySelector("#pin-input");
    input.focus();
    const submit = async () => {
      const ok = await verifyPin(input.value);
      if (ok) { authState.settingsUnlocked = true; S.closeModal(); onOk && onOk(); }
      else { modal.querySelector("#pin-err").classList.remove("hidden"); input.select(); }
    };
    modal.querySelector("#pin-ok").onclick = submit;
    input.onkeydown = (e) => { if (e.key === "Enter") submit(); };
    modal.querySelector("#pin-cancel").onclick = S.closeModal;
  }

  window.MB_AUTH = {
    ROLES, ROLE_ORDER, role, roleLabel, can, canSeeSettings, isUnlocked,
    applyTabVisibility, firstAllowedTab, promptPin, verifyPin, setAdminPin,
    resetSession, currentUser, canSeeUsers,
    DEFAULT_PASSWORD, setUserPassword, resetUserPassword, verifyUserPassword,
    needsPasswordChange, ensurePasswords,
  };
})();
