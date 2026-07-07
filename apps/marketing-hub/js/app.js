// Main entry point: bootstraps app, handles login, tab switching.
// Data lives in localStorage. No remote connection.
(function () {
  const S = window.MB_STATE;
  const API = window.MB_API;
  const LS_USER = "mb_current_user_id";

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    // Single source of truth for the version: js/config.js
    const ver = "v" + ((window.MB_CONFIG && window.MB_CONFIG.appVersion) || "");
    const verEl = document.getElementById("app-version");
    if (verEl) verEl.textContent = ver;
    const loginVerEl = document.getElementById("login-version");
    if (loginVerEl) loginVerEl.textContent = ver;

    document.getElementById("login-btn").onclick = onLogin;
    const loginPass = document.getElementById("login-pass");
    if (loginPass) loginPass.onkeydown = (e) => { if (e.key === "Enter") onLogin(); };
    document.getElementById("logout-btn").onclick = onLogout;

    // Recovery: load a data file straight from the login screen (no login needed).
    const importLink = document.getElementById("login-import");
    const importFile = document.getElementById("login-file");
    if (importLink && importFile) {
      importLink.onclick = (e) => { e.preventDefault(); importFile.value = ""; importFile.click(); };
      importFile.onchange = async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        try {
          const incoming = await API.readJsonFile(file);
          if (!confirm(`Replace ALL data in this browser with "${file.name}"? This cannot be undone. Export a backup first if unsure.`)) return;
          await API.save(incoming);
          await loadAndShowLogin();
          S.toast("Data loaded. Pick your user and log in.", "success");
        } catch (err) {
          showLoginError("Could not load that file: " + err.message);
        }
      };
    }

    document.querySelectorAll(".tab").forEach((btn) => {
      btn.onclick = () => switchTab(btn.dataset.tab);
    });

    const lockBtn = document.getElementById("lock-btn");
    if (lockBtn) lockBtn.onclick = () => {
      window.MB_AUTH.promptPin(() => { window.MB_AUTH.applyTabVisibility(); switchTab("settings"); });
    };

    S.subscribe(() => {
      const active = document.querySelector(".tab.active");
      if (!active) return;
      renderActiveTab(active.dataset.tab);
    });

    await loadAndShowLogin();
  }

  function showLoginError(msg) {
    const el = document.getElementById("login-error");
    el.textContent = msg;
    el.classList.remove("hidden");
  }
  function clearLoginError() {
    document.getElementById("login-error").classList.add("hidden");
  }

  async function loadAndShowLogin() {
    clearLoginError();
    try {
      S.setSyncStatus("saving", "Loading...");
      const data = await API.load();
      S.state.data = data;

      // Back-fill missing fields for older local data
      if (!data.activities) data.activities = [];
      if (!data.events) data.events = [];
      if (!data.settings.partners) data.settings.partners = [];
      if (!data.meta) data.meta = {};
      // Migration: any existing user without a role becomes Admin so nobody is locked out.
      (data.settings.users || []).forEach((u) => { if (!u.role) u.role = "admin"; });
      migrateV12(data);
      migrateV20(data);
      migrateDropDeadFields(data);

      // One-time cluster cleanup: merge the imported cluster names into the real clusters.
      migrateClusterRemap(data);
      // One-time: move events owned by Christina into the Cloud cluster.
      migrateChristinaCloud(data);
      // One-time: align each event's stored cluster to its organising entity's cluster.
      migrateClusterFromEntity(data);
      // One-time: clear the "updated by/on" stamps left over from the June data cleanup, so the
      // audit trail starts clean and only real edits from now on show an updated stamp.
      migrateResetUpdatedStamps(data);
      // One-time: seed a starter list of countries and a few groups so tagging works out of the box.
      migrateSeedCountries(data);
      normalizeSortLists(data);

      if (!data.settings.yearlyBudgets) data.settings.yearlyBudgets = {};
      if (!data.settings.budgetCodes) data.settings.budgetCodes = {};
      if (!data.settings.statuses) {
        data.settings.statuses = [
          { id: API.uid(), name: "Committed" },
          { id: API.uid(), name: "Planned" },
        ];
        S.scheduleSave();
      }

      // Give every user a login password (default 1234) the first time, and require a change.
      if (data.settings.users && data.settings.users.length &&
          await window.MB_AUTH.ensurePasswords(data.settings.users)) {
        S.scheduleSave();
      }

      S.setSyncStatus("saved", "Loaded");
      S.setLastUpdated(data.meta && data.meta.lastUpdated);
      setTimeout(() => S.setSyncStatus("", "Saved locally"), 1000);

      const userSel = document.getElementById("login-user");
      const users = (data.settings.users || []).filter((u) => u.active !== false);
      const remembered = localStorage.getItem(LS_USER);
      if (users.length === 0) {
        userSel.innerHTML = `<option value="__new__">+ Add new user...</option>`;
      } else {
        userSel.innerHTML = users.map((u) =>
          `<option value="${u.id}" ${u.id===remembered?"selected":""}>${escapeHtml(u.name)}</option>`
        ).join("") + `<option value="__new__">+ Add new user...</option>`;
      }
    } catch (e) {
      console.error(e);
      showLoginError("Could not load local data. Details: " + e.message);
      S.setSyncStatus("error", "Load failed");
    }
  }

  async function onLogin() {
    clearLoginError();
    const sel = document.getElementById("login-user");
    const passEl = document.getElementById("login-pass");
    const userId = sel.value;

    // New user self-signup: create the account, then let them set their own password.
    if (!userId || userId === "__new__") {
      const name = prompt("Enter your name:");
      if (!name || !name.trim()) return;
      // First user becomes Admin (bootstrap); later self-added users are Campaigns viewers.
      const isFirst = (S.state.data.settings.users || []).length === 0;
      const newUser = { id: API.uid(), name: name.trim(), role: isFirst ? "admin" : "viewer" };
      S.state.data.settings.users.push(newUser);
      S.scheduleSave();
      promptSetPassword(newUser, true, () => finishLogin(newUser));
      return;
    }

    const user = (S.state.data.settings.users || []).find((u) => u.id === userId);
    if (!user) return showLoginError("User not found.");
    if (user.active === false) return showLoginError("This account is inactive. Ask an admin to reactivate it.");

    const ok = await window.MB_AUTH.verifyUserPassword(user, passEl ? passEl.value : "");
    if (!ok) {
      showLoginError("Wrong password. A new account's default is 1234.");
      if (passEl) { passEl.value = ""; passEl.focus(); }
      return;
    }
    if (window.MB_AUTH.needsPasswordChange(user)) {
      promptSetPassword(user, false, () => finishLogin(user));
      return;
    }
    finishLogin(user);
  }

  function finishLogin(user) {
    S.state.currentUserId = user.id;
    localStorage.setItem(LS_USER, user.id);
    document.getElementById("current-user").textContent = user.name || "Unknown";
    const passEl = document.getElementById("login-pass");
    if (passEl) passEl.value = "";
    showApp();
  }

  // Ask the user to set a new password. isNew tags a brand-new account vs a forced change.
  // The modal cannot be dismissed without setting one.
  function promptSetPassword(user, isNew, onDone) {
    const modal = S.openModal(`
      <h2>${isNew ? "Set your password" : "Update your password"}</h2>
      <p class="muted small">${isNew ? "Choose a password for your account." : "Your account still uses the default password. Please set a new one to continue."}</p>
      <label>New password</label>
      <input id="np1" type="password" autocomplete="new-password" />
      <label>Confirm password</label>
      <input id="np2" type="password" autocomplete="new-password" />
      <div id="np-err" class="error hidden" style="margin-top:8px"></div>
      <div class="actions">
        <button class="primary" id="np-ok">Save password</button>
      </div>
    `, { closeOnBackdrop: false });
    const showErr = (m) => { const e = modal.querySelector("#np-err"); e.textContent = m; e.classList.remove("hidden"); };
    modal.querySelector("#np1").focus();
    modal.querySelector("#np-ok").onclick = async () => {
      const p1 = modal.querySelector("#np1").value;
      const p2 = modal.querySelector("#np2").value;
      if (!p1 || p1.length < 4) return showErr("Use at least 4 characters.");
      if (p1 === window.MB_AUTH.DEFAULT_PASSWORD) return showErr("Pick something other than the default 1234.");
      if (p1 !== p2) return showErr("The two passwords do not match.");
      await window.MB_AUTH.setUserPassword(user, p1);
      S.closeModal();
      onDone && onDone();
    };
  }

  function onLogout() {
    localStorage.removeItem(LS_USER);
    S.state.currentUserId = null;
    window.MB_AUTH.resetSession();
    document.getElementById("login-overlay").classList.remove("hidden");
    document.getElementById("app-header").classList.add("hidden");
    document.getElementById("app-main").classList.add("hidden");
    // Re-populate user picker after logout
    loadAndShowLogin();
  }

  function showApp() {
    document.getElementById("login-overlay").classList.add("hidden");
    document.getElementById("app-header").classList.remove("hidden");
    document.getElementById("app-main").classList.remove("hidden");
    window.MB_AUTH.applyTabVisibility();
    switchTab(window.MB_AUTH.firstAllowedTab());
    if (window.MB_DATA && window.MB_DATA.initSharedRefresh) window.MB_DATA.initSharedRefresh();
  }

  function switchTab(name) {
    const AUTH = window.MB_AUTH;
    // Settings and Users are protected by the pin (or god code), once per session.
    const pinGated = (name === "settings" || name === "users");
    if (pinGated && !AUTH.isUnlocked()) {
      AUTH.promptPin(() => { AUTH.applyTabVisibility(); doSwitch(name); });
      return;
    }
    // Block tabs the current role cannot see.
    let allowed;
    if (name === "settings") allowed = AUTH.canSeeSettings();
    else if (name === "users") allowed = AUTH.canSeeUsers();
    else allowed = AUTH.can({ budget: "viewBudget", timeline: "viewTimeline", reporting: "viewReporting", outcomes: "viewOutcomes", "budget-structure": "viewStructure", data: "importExport" }[name]);
    if (!allowed) { doSwitch(AUTH.firstAllowedTab()); return; }
    doSwitch(name);
  }

  function doSwitch(name) {
    document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.toggle("active", p.id === "tab-" + name));
    renderActiveTab(name);
  }

  function renderActiveTab(name) {
    if (name === "budget") window.MB_BUDGET.render();
    if (name === "timeline") window.MB_TIMELINE.render();
    if (name === "reporting") window.MB_REPORTING.render();
    if (name === "outcomes") window.MB_OUTCOMES.render();
    if (name === "budget-structure") window.MB_STRUCTURE.render();
    if (name === "data") window.MB_DATA.render();
    if (name === "users") window.MB_USERS.render();
    if (name === "settings") window.MB_SETTINGS.render();
  }

  function escapeHtml(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // v1.2 migration: M1 levels, A&P categories, type->category mapping, SVP/Global split,
  // campaign Type as activity type, and budget lines moving to many-to-many (eventIds).
  function migrateV12(data) {
    const s = data.settings;
    const AP_SEED = [
      "Enhance market awareness and perception", "Develop influencers", "Account Based Marketing",
      "Lead generation campaigns", "Marketing tools", "Content and Sales enablement",
      "Customer intimacy", "Partner marketing", "Market research and studies",
    ];
    const M1_SEED = ["International Zone", "Zone France", "Business Line", "SCM", "Comms"];
    const TYPE_AP = {
      "event": "Enhance market awareness and perception",
      "digital campaign": "Lead generation campaigns",
      "sponsorship": "Develop influencers",
      "content": "Content and Sales enablement",
    };

    if (!Array.isArray(s.m1Levels) || s.m1Levels.length === 0) s.m1Levels = M1_SEED.slice();
    if (!Array.isArray(s.apCategories) || s.apCategories.length === 0) {
      s.apCategories = AP_SEED.map((name) => ({ id: API.uid(), name }));
    }
    const catId = (name) => (s.apCategories.find((c) => (c.name || "").toLowerCase() === name.toLowerCase()) || {}).id || "";

    // Ensure None + All exist in both SVP and Global campaign lists
    s.svps = s.svps || [];
    s.globalCampaigns = s.globalCampaigns || [];
    ["None", "All"].forEach((nm) => {
      if (!s.svps.some((x) => (x.name || "").toLowerCase() === nm.toLowerCase())) s.svps.push({ id: API.uid(), name: nm });
      if (!s.globalCampaigns.some((x) => (x.name || "").toLowerCase() === nm.toLowerCase())) s.globalCampaigns.push({ id: API.uid(), name: nm });
    });

    // Activity types -> A&P category (seed mapping where empty)
    (s.activityTypes || []).forEach((t) => {
      if (!t.apCategoryId) {
        const want = TYPE_AP[(t.name || "").toLowerCase()];
        if (want) t.apCategoryId = catId(want);
      }
    });

    // Entities get an M1 field
    (s.entities || []).forEach((e) => { if (e.m1 === undefined) e.m1 = ""; });

    // Events: activityTypeId from free-text type by name; globalCampaignId; outcomes
    const typeByName = (nm) => (s.activityTypes || []).find((t) => (t.name || "").trim().toLowerCase() === (nm || "").trim().toLowerCase());
    (data.events || []).forEach((ev) => {
      if (!ev.activityTypeId && ev.type) { const m = typeByName(ev.type); if (m) ev.activityTypeId = m.id; }
      if (ev.globalCampaignId === undefined) ev.globalCampaignId = "";
      if (!ev.outcomes) ev.outcomes = {};
      // Fold the old standalone website link into Content & assets (links live in one place).
      if (ev.weblink) {
        ev.content = ev.content || [];
        if (!ev.content.some((c) => (c.url || "") === ev.weblink)) {
          ev.content.push({ label: "Website", url: ev.weblink });
        }
        ev.weblink = "";
      }
    });

    // Budget lines: eventId -> eventIds[]; apCategoryId default; globalCampaignId default
    (data.activities || []).forEach((a) => {
      if (!Array.isArray(a.eventIds)) a.eventIds = a.eventId ? [a.eventId] : [];
      if (a.apCategoryId === undefined) a.apCategoryId = "";
      if (a.globalCampaignId === undefined) a.globalCampaignId = "";
    });
  }

  // One-time: events whose owner is Christina move into the "Cloud" cluster. Guarded so
  // it runs once and does not keep reassigning future events.
  function migrateChristinaCloud(data) {
    const s = data.settings || {};
    if (s._christinaCloudV25) return;
    const userName = (uid) => ((s.users || []).find((u) => u.id === uid) || {}).name || "";
    (data.events || []).forEach((ev) => {
      const owner = (ev.ownerId ? userName(ev.ownerId) : ev.owner) || "";
      if (owner.trim().toLowerCase().includes("christina")) ev.cluster = "Cloud";
    });
    s._christinaCloudV25 = true;
    S.scheduleSave();
  }

  // One-time: set each event's stored cluster to its organising entity's cluster, so the stored
  // data matches what the app shows. Skips events deliberately placed in "Cloud", and events
  // without an entity or whose entity has no cluster. Guarded so it runs once.
  // Keep the reference lists alphabetical so every dropdown shows them A to Z. Runs each load.
  function normalizeSortLists(data) {
    const s = data.settings || {};
    const byName = (a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
    ["svps", "activityTypes", "statuses", "globalCampaigns", "apCategories", "users", "partners", "entities"].forEach((k) => {
      if (Array.isArray(s[k])) s[k].sort(byName);
    });
    if (Array.isArray(s.m1Levels)) s.m1Levels.sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" }));
    S.scheduleSave();
  }

  function migrateClusterFromEntity(data) {
    const s = data.settings || {};
    if (s._clusterFromEntityV32) return;
    (data.events || []).forEach((ev) => {
      if ((ev.cluster || "").trim().toLowerCase() === "cloud") return; // keep the deliberate exception
      const ent = ev.entityId ? (s.entities || []).find((e) => e.id === ev.entityId) : null;
      const g = ent ? (ent.group || "").trim() : "";
      if (g) ev.cluster = g;
    });
    s._clusterFromEntityV32 = true;
    S.scheduleSave();
  }

  // One-time: drop dead/legacy fields now that the data is normalized. Any real campaignLink is
  // moved into Content and assets first so no link is lost. Runs once, guarded by a flag.
  // One-time reset of the "updated by/on" audit stamps. The June cleanup rewrote most rows and
  // left them all stamped, which made the Updated column look universal. Clearing lets the trail
  // rebuild honestly from real edits. "Created by/on" and all budget content are untouched.
  function migrateResetUpdatedStamps(data) {
    const s = data.settings || {};
    if (s._resetUpdatedV318) return;
    (data.activities || []).forEach((a) => { delete a.updatedBy; delete a.updatedAt; });
    (data.events || []).forEach((ev) => { delete ev.updatedBy; delete ev.updatedAt; });
    s._resetUpdatedV318 = true;
    S.scheduleSave();
  }

  // One-time seed of the Countries list and a few handy groups. Only runs when there is no
  // countries list yet, so it never overwrites what an admin has set up. Admins can edit freely.
  function migrateSeedCountries(data) {
    const s = data.settings || (data.settings = {});
    if (Array.isArray(s.countries) && s.countries.length) { s.countryGroups = s.countryGroups || []; return; }
    const uid = window.MB_API.uid;
    const seed = [
      ["be", "Belgium"], ["nl", "Netherlands"], ["lu", "Luxembourg"],
      ["fr", "France"], ["de", "Germany"], ["ch", "Switzerland"],
      ["es", "Spain"], ["it", "Italy"], ["uk", "United Kingdom"],
      ["no", "Norway"], ["se", "Sweden"], ["dk", "Denmark"],
    ];
    const idOf = {};
    s.countries = seed.map(([k, name]) => { const id = uid(); idOf[k] = id; return { id, name }; });
    s.countries.push({ id: uid(), name: "Pan-European", global: true });
    s.countryGroups = [
      { id: uid(), name: "BeNeLux", countryIds: [idOf.be, idOf.nl, idOf.lu] },
      { id: uid(), name: "DACH", countryIds: [idOf.de, idOf.ch] },
      { id: uid(), name: "Nordics", countryIds: [idOf.no, idOf.se, idOf.dk] },
    ];
    S.scheduleSave();
  }

  function migrateDropDeadFields(data) {
    const s = data.settings || {};
    if (s._deadFieldsV38) return;
    (data.events || []).forEach((ev) => {
      const link = (ev.campaignLink || "").trim();
      if (link) {
        ev.content = ev.content || [];
        if (!ev.content.some((c) => (c.url || "").trim() === link)) ev.content.push({ label: "Link", url: link });
      }
      delete ev.campaignLink;
      delete ev.weblink;
      delete ev.scope;
      delete ev.entity;   // legacy text; entityId is the source of truth now
      delete ev.owner;    // legacy text; ownerId is the source of truth now
      delete ev.type;     // legacy text; activityTypeId is the source of truth now
    });
    (data.activities || []).forEach((a) => { delete a.eventId; }); // legacy single link; eventIds is used now
    s._deadFieldsV38 = true;
    S.scheduleSave();
  }

  // One-time remap of the imported cluster names onto the real clusters. Guarded by a flag
  // so it runs once and never clobbers a cluster you later name "Europe" yourself.
  function migrateClusterRemap(data) {
    const s = data.settings || {};
    if (s._clusterRemapV23) return;
    const map = { "benelux": "Digital & Data", "europe": "OB Europe", "nwe": "OB Europe", "ssee": "OB Europe" };
    const remap = (v) => map[(v || "").trim().toLowerCase()] || v;
    (data.events || []).forEach((ev) => { if (ev.cluster) ev.cluster = remap(ev.cluster); });
    (s.entities || []).forEach((e) => { if (e.group) e.group = remap(e.group); });
    s._clusterRemapV23 = true;
    S.scheduleSave();
  }

  // v2.0 normalization: campaigns reference entity and owner by ID (not name), and stop
  // storing a legacy free-text "type". Names that cannot be matched are kept as fallback.
  function migrateV20(data) {
    const s = data.settings;
    const entByName = {}; (s.entities || []).forEach((e) => { if (e.name) entByName[e.name.trim().toLowerCase()] = e; });
    const userByName = {}; (s.users || []).forEach((u) => { if (u.name) userByName[u.name.trim().toLowerCase()] = u.id; });
    const typeByName = {}; (s.activityTypes || []).forEach((t) => { if (t.name) typeByName[t.name.trim().toLowerCase()] = t.id; });
    (data.events || []).forEach((ev) => {
      if (ev.entityId === undefined) {
        const ent = ev.entity ? entByName[ev.entity.trim().toLowerCase()] : null;
        if (ent) { ev.entityId = ent.id; delete ev.entity; if (!ev.cluster) ev.cluster = ent.group || ""; }
        else { ev.entityId = ""; } // keep ev.entity text as fallback when unmatched
      }
      if (ev.ownerId === undefined) {
        const uid = ev.owner ? userByName[ev.owner.trim().toLowerCase()] : null;
        if (uid) { ev.ownerId = uid; delete ev.owner; }
        else { ev.ownerId = ""; } // keep ev.owner text as fallback when unmatched
      }
      // activityTypeId from any legacy free-text type, then drop the legacy field
      if (!ev.activityTypeId && ev.type) { const tid = typeByName[ev.type.trim().toLowerCase()]; if (tid) ev.activityTypeId = tid; }
      if (ev.type !== undefined) delete ev.type;
    });
  }

  window.MB_APP = { switchTab };
})();
