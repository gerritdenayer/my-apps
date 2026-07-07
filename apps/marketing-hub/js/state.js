// App-wide state and helpers
(function () {
  const state = {
    data: null,
    currentUserId: null,
    saving: false,
    saveTimer: null,
    dirty: false,
    listeners: [],
  };

  // Subscribe to data changes
  function subscribe(fn) {
    state.listeners.push(fn);
    return () => {
      state.listeners = state.listeners.filter((f) => f !== fn);
    };
  }
  function notify() {
    state.listeners.forEach((fn) => {
      try { fn(); } catch (e) { console.error(e); }
    });
  }

  // Outcome metrics shared by the campaign editor and the Outcomes report.
  // kind "ta" = target/actual pair; kind "pa" = potential/actual pair (revenue).
  const OUTCOME_METRICS = [
    { key: "engagement",    label: "Engagement",    kind: "ta", money: false },
    { key: "attendees",     label: "Attendees",     kind: "ta", money: false },
    { key: "registrations", label: "Registrations", kind: "ta", money: false },
    { key: "mql",           label: "MQL",           kind: "ta", money: false },
    { key: "sql",           label: "SQL",           kind: "ta", money: false },
    { key: "revenue",       label: "Revenue",       kind: "pa", money: true  },
  ];

  // Schedule a save (debounced)
  function scheduleSave() {
    state.dirty = true;
    setSyncStatus("saving", "Saving...");
    // Stamp the dataset's last-updated time at the moment of change.
    if (state.data) {
      state.data.meta = state.data.meta || {};
      state.data.meta.lastUpdated = new Date().toISOString();
    }
    if (state.saveTimer) clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(async () => {
      try {
        state.saving = true;
        await window.MB_API.save(state.data);
        state.dirty = false;
        setSyncStatus("saved", "Saved");
        setLastUpdated(state.data && state.data.meta && state.data.meta.lastUpdated);
        setTimeout(() => setSyncStatus("", "Saved locally"), 1500);
      } catch (e) {
        console.error(e);
        setSyncStatus("error", "Save failed");
        toast("Save failed: " + e.message, "error");
      } finally {
        state.saving = false;
      }
    }, 600);
  }

  function setSyncStatus(cls, label) {
    const el = document.getElementById("sync-status");
    if (!el) return;
    el.className = "sync " + (cls || "");
    el.textContent = label;
  }

  function setLastUpdated(iso) {
    const el = document.getElementById("last-updated");
    if (!el) return;
    if (!iso) { el.textContent = ""; return; }
    const d = new Date(iso);
    const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    el.textContent = "Data updated: " + date + " " + time;
  }

  function toast(msg, kind) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.className = "toast " + (kind || "");
    setTimeout(() => t.classList.add("hidden"), 2400);
  }

  // Formatting helpers
  function fmtMoney(n) {
    if (n === null || n === undefined || isNaN(n)) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency: "EUR", maximumFractionDigits: 0,
    }).format(n);
  }
  function fmtMoneyShort(n) {
    if (n === null || n === undefined || isNaN(n)) return "-";
    return "EUR " + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
  }
  function fmtNum(n) {
    if (n === null || n === undefined || isNaN(n)) return "-";
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
  }
  function fmtDate(s) {
    if (!s) return "";
    const d = new Date(s);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }
  function monthOf(s) {
    if (!s) return null;
    return new Date(s).getMonth();
  }
  function yearOf(s) {
    if (!s) return null;
    return new Date(s).getFullYear();
  }
  // Shared date-period filter. year: number/""/"all"; quarter: ""/1-4; month: ""/0-11.
  function inPeriod(dateStr, year, quarter, month) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d)) return false;
    if (year !== "" && year !== undefined && year !== null && year !== "all" && d.getFullYear() !== +year) return false;
    if (month !== "" && month !== undefined && month !== null && d.getMonth() !== +month) return false;
    if (quarter !== "" && quarter !== undefined && quarter !== null && (Math.floor(d.getMonth() / 3) + 1) !== +quarter) return false;
    return true;
  }
  const QUARTERS = [["1", "Q1"], ["2", "Q2"], ["3", "Q3"], ["4", "Q4"]];
  const MONTHS_OPT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => [String(i), m]);
  function quarterOptions(sel) { return '<option value="">All</option>' + QUARTERS.map(([v, l]) => `<option ${String(sel) === v ? "selected" : ""} value="${v}">${l}</option>`).join(""); }
  function monthOptions(sel) { return '<option value="">All</option>' + MONTHS_OPT.map(([v, l]) => `<option ${String(sel) === v ? "selected" : ""} value="${v}">${l}</option>`).join(""); }
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // Lookups
  function entityById(id) { return (state.data.settings.entities || []).find((x) => x.id === id); }
  function svpById(id) { return (state.data.settings.svps || []).find((x) => x.id === id); }
  function countryById(id) { return (state.data.settings.countries || []).find((x) => x.id === id); }
  // Sorted country names for a list of ids (used to show an event's countries).
  function countryNamesOf(ids) {
    return (ids || []).map((id) => (countryById(id) || {}).name).filter(Boolean)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }
  function actTypeById(id) { return (state.data.settings.activityTypes || []).find((x) => x.id === id); }
  function userById(id) { return (state.data.settings.users || []).find((x) => x.id === id); }
  // Options for an "owner" dropdown: active users only, plus the current owner even if now
  // inactive (so editing an old record does not silently drop its owner). Alphabetical.
  function activeOwnerOptions(selectedId) {
    const users = state.data.settings.users || [];
    const list = users.filter((u) => u.active !== false);
    if (selectedId && !list.some((u) => u.id === selectedId)) {
      const cur = users.find((u) => u.id === selectedId);
      if (cur) list.push(cur);
    }
    list.sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }));
    return list.map((u) => `<option ${selectedId === u.id ? "selected" : ""} value="${u.id}">${escapeHtml(u.name)}${u.active === false ? " (inactive)" : ""}</option>`).join("");
  }
  function statusById(id) { return (state.data.settings.statuses || []).find((x) => x.id === id); }
  function globalCampaignById(id) { return (state.data.settings.globalCampaigns || []).find((x) => x.id === id); }
  function apCategoryById(id) { return (state.data.settings.apCategories || []).find((x) => x.id === id); }
  // Campaign reference resolvers (events store entityId/ownerId; fall back to legacy text).
  function eventEntityName(ev) {
    if (ev && ev.entityId) { const e = entityById(ev.entityId); return e ? e.name : ""; }
    return (ev && ev.entity) || "";
  }
  function eventOwnerName(ev) {
    if (ev && ev.ownerId) { const u = userById(ev.ownerId); return u ? u.name : ""; }
    return (ev && ev.owner) || "";
  }
  // The A&P category for a budget line: explicit override, else inherited from its activity type.
  function apCategoryForActivity(a) {
    if (a && a.apCategoryId) return apCategoryById(a.apCategoryId);
    const t = a && a.activityTypeId ? actTypeById(a.activityTypeId) : null;
    return t && t.apCategoryId ? apCategoryById(t.apCategoryId) : null;
  }

  // De-duplicate entities by trimmed/lowercased name. Keep first occurrence (canonical).
  function uniqueEntities() {
    const seen = new Map();
    (state.data.settings.entities || []).forEach((e) => {
      const key = (e.name || "").trim().toLowerCase();
      if (!key) return;
      if (!seen.has(key)) seen.set(key, e);
    });
    return Array.from(seen.values());
  }

  // ---- Shared location scope filter (M1 > Cluster > Entity) ----
  // Used identically by Budget, Campaigns and events, Reporting and Outcomes so the
  // three levels always mean the same thing and drill down the same way.
  function clusterList(m1) {
    let ents = uniqueEntities();
    if (m1) ents = ents.filter((e) => (e.m1 || "") === m1);
    return Array.from(new Set(ents.map((e) => (e.group || "").trim()).filter(Boolean))).sort();
  }
  function entityListFor(m1, cluster) {
    let ents = uniqueEntities();
    if (m1) ents = ents.filter((e) => (e.m1 || "") === m1);
    if (cluster) ents = ents.filter((e) => (e.group || "").trim() === cluster);
    return ents.slice().sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }
  // Does an entity (by id) fall within the chosen scope? Empty scope = everything.
  function entityMatchesScope(entityId, scope) {
    if (!scope || (!scope.m1 && !scope.cluster && !scope.entityId)) return true;
    const cid = canonicalEntityId(entityId);
    const e = entityById(cid) || entityById(entityId);
    if (!e) return false;
    if (scope.entityId && canonicalEntityId(scope.entityId) !== cid) return false;
    if (scope.cluster && (e.group || "").trim() !== scope.cluster) return false;
    if (scope.m1 && (e.m1 || "") !== scope.m1) return false;
    return true;
  }
  // HTML for the three cascading selects. Ids are `${prefix}-m1/-cluster/-entity`.
  function scopeFilterHtml(prefix, scope, labelFn) {
    scope = scope || {};
    const lf = labelFn || ((e) => e.name);
    const m1s = (state.data.settings.m1Levels || []);
    const m1Opts = '<option value="">All zones</option>' + m1s.map((m) => `<option ${scope.m1 === m ? "selected" : ""} value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join("");
    const clOpts = '<option value="">All clusters</option>' + clusterList(scope.m1).map((c) => `<option ${scope.cluster === c ? "selected" : ""} value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
    const enOpts = '<option value="">All entities</option>' + entityListFor(scope.m1, scope.cluster).map((e) => `<option ${scope.entityId === e.id ? "selected" : ""} value="${e.id}">${escapeHtml(lf(e))}</option>`).join("");
    return `
      <div><label>M1 zone</label><select id="${prefix}-m1">${m1Opts}</select></div>
      <div><label>Cluster</label><select id="${prefix}-cluster">${clOpts}</select></div>
      <div><label>Entity</label><select id="${prefix}-entity">${enOpts}</select></div>
    `;
  }
  // Wire the cascade. `scope` is mutated in place; `onChange` is called after each change.
  function wireScopeFilter(root, prefix, scope, onChange, labelFn) {
    const lf = labelFn || ((e) => e.name);
    const m1Sel = root.querySelector(`#${prefix}-m1`);
    const clSel = root.querySelector(`#${prefix}-cluster`);
    const enSel = root.querySelector(`#${prefix}-entity`);
    if (!m1Sel || !clSel || !enSel) return;
    const rebuildCluster = () => {
      clSel.innerHTML = '<option value="">All clusters</option>' + clusterList(scope.m1).map((c) => `<option ${scope.cluster === c ? "selected" : ""} value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
    };
    const rebuildEntity = () => {
      enSel.innerHTML = '<option value="">All entities</option>' + entityListFor(scope.m1, scope.cluster).map((e) => `<option ${scope.entityId === e.id ? "selected" : ""} value="${e.id}">${escapeHtml(lf(e))}</option>`).join("");
    };
    m1Sel.onchange = () => { scope.m1 = m1Sel.value; scope.cluster = ""; scope.entityId = ""; rebuildCluster(); rebuildEntity(); onChange(); };
    clSel.onchange = () => { scope.cluster = clSel.value; scope.entityId = ""; rebuildEntity(); onChange(); };
    enSel.onchange = () => {
      scope.entityId = enSel.value;
      if (enSel.value) { // drill up: reflect the entity's cluster and zone in the other selects
        const e = entityById(enSel.value);
        if (e) { scope.m1 = e.m1 || ""; scope.cluster = (e.group || "").trim(); m1Sel.value = scope.m1; rebuildCluster(); clSel.value = scope.cluster; rebuildEntity(); }
      }
      onChange();
    };
  }

  // Map any entity ID to the canonical entity ID with the same name.
  function canonicalEntityId(id) {
    if (!id) return "";
    const ent = entityById(id);
    if (!ent) return id;
    const key = (ent.name || "").trim().toLowerCase();
    const canonical = (state.data.settings.entities || []).find((e) =>
      (e.name || "").trim().toLowerCase() === key
    );
    return canonical ? canonical.id : id;
  }

  // Modal
  function openModal(html, opts) {
    const root = document.getElementById("modal-root");
    root.innerHTML = `<div class="modal-backdrop"><div class="modal">${html}</div></div>`;
    const backdrop = root.querySelector(".modal-backdrop");
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop && (!opts || opts.closeOnBackdrop !== false)) closeModal();
    });
    return root.querySelector(".modal");
  }
  function closeModal() {
    document.getElementById("modal-root").innerHTML = "";
  }

  // Confirm helper
  function confirmDialog(msg) {
    return new Promise((resolve) => {
      const modal = openModal(`
        <h2>Confirm</h2>
        <p>${escapeHtml(msg)}</p>
        <div class="actions">
          <button class="secondary" id="cf-no">Cancel</button>
          <button class="primary" id="cf-yes">Confirm</button>
        </div>
      `);
      modal.querySelector("#cf-no").onclick = () => { closeModal(); resolve(false); };
      modal.querySelector("#cf-yes").onclick = () => { closeModal(); resolve(true); };
    });
  }

  window.MB_STATE = {
    state, subscribe, notify, scheduleSave, setSyncStatus, setLastUpdated, toast,
    fmtMoney, fmtMoneyShort, fmtNum, fmtDate, monthOf, yearOf, escapeHtml,
    inPeriod, quarterOptions, monthOptions,
    entityById, svpById, countryById, countryNamesOf, actTypeById, userById, statusById, activeOwnerOptions,
    globalCampaignById, apCategoryById, apCategoryForActivity,
    eventEntityName, eventOwnerName,
    uniqueEntities, canonicalEntityId,
    clusterList, entityListFor, entityMatchesScope, scopeFilterHtml, wireScopeFilter,
    openModal, closeModal, confirmDialog,
    OUTCOME_METRICS,
  };
})();
