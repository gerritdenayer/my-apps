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

  // Goal of a campaign / event. Each goal fills the matching A&P category (matched by name in the
  // setup's A&P list, so it keeps working when ids differ between computers).
  const GOALS = [
    { key: "lead", label: "Lead Generation", ap: "lead generation" },
    { key: "awareness", label: "Awareness", ap: "awareness" },
    { key: "intimacy", label: "Customer Intimacy", ap: "customer intimacy" },
  ];
  function goalLabel(key) { const g = GOALS.find((x) => x.key === key); return g ? g.label : ""; }
  function apCategoryForGoal(key) {
    const g = GOALS.find((x) => x.key === key);
    if (!g) return "";
    const c = (state.data.settings.apCategories || []).find((x) => (x.name || "").toLowerCase().includes(g.ap));
    return c ? c.id : "";
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
    el.textContent = "Your data: " + date + " " + time;
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
  // Period check where quarters is an array of quarter numbers (empty = any quarter).
  function inPeriodQ(dateStr, year, quarters, month) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d)) return false;
    if (year !== "" && year !== undefined && year !== null && year !== "all" && d.getFullYear() !== +year) return false;
    if (month !== "" && month !== undefined && month !== null && d.getMonth() !== +month) return false;
    if (quarters && quarters.length) { const q = Math.floor(d.getMonth() / 3) + 1; if (!quarters.map(Number).includes(q)) return false; }
    return true;
  }
  // HTML for a row of Q1-Q4 checkboxes. Elements get class "<prefix>-q" and value 1..4.
  function quarterChecks(prefix, selected) {
    const sel = new Set((selected || []).map(String));
    return `<div class="qsel" style="display:flex; gap:10px; align-items:center; padding-top:6px;">${[1, 2, 3, 4].map((q) => `<label style="display:inline-flex; align-items:center; gap:3px; font-weight:400; cursor:pointer; margin:0;"><input type="checkbox" class="${prefix}-q" value="${q}" ${sel.has(String(q)) ? "checked" : ""}/> Q${q}</label>`).join("")}</div>`;
  }
  function monthOptions(sel) { return '<option value="">All</option>' + MONTHS_OPT.map(([v, l]) => `<option ${String(sel) === v ? "selected" : ""} value="${v}">${l}</option>`).join(""); }
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // Lookups
  function entityById(id) { return (state.data.settings.entities || []).find((x) => x.id === id); }
  // SVP / vertical list. "N.A." (not applicable) replaced the old "All" and "None" values: their
  // ids live on in settings.svpAliases, so old budget lines and events show N.A. without rewriting.
  function canonicalSvpId(id) { const al = (state.data.settings.svpAliases || {})[id]; return al || id || ""; }
  function svpById(id) { const c = canonicalSvpId(id); return (state.data.settings.svps || []).find((x) => x.id === c); }
  // Make sure the list has exactly one "N.A.": rename "All" (or "None") to it and alias the others.
  // Touches only the setup, never the rows. Returns true when something changed.
  function normalizeSvps(settings) {
    const s = settings || state.data.settings;
    s.svps = s.svps || [];
    const by = (n) => s.svps.find((x) => (x.name || "").trim().toLowerCase() === n);
    const na = by("n.a."), all = by("all"), none = by("none");
    const target = na || all || none;
    if (!target) { s.svps.push({ id: window.MB_API.uid(), name: "N.A." }); return true; }
    let changed = false;
    if (target.name !== "N.A.") { target.name = "N.A."; changed = true; }
    [all, none].forEach((x) => {
      if (x && x !== target) {
        s.svpAliases = s.svpAliases || {};
        s.svpAliases[x.id] = target.id;
        s.svps = s.svps.filter((y) => y !== x);
        changed = true;
      }
    });
    return changed;
  }
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
  // Budget code for a line: the code assigned to its entity for the line's year (managed in Budget Structure).
  function budgetCodeForActivity(a) {
    if (!a) return "";
    const yr = a.date ? new Date(a.date).getFullYear() : new Date().getFullYear();
    const bc = ((state.data.settings.budgetCodes || {})[yr]) || {};
    return bc[a.entityId] || bc[canonicalEntityId(a.entityId)] || "";
  }
  // Rule: a line with any actual value cannot stay "Planned" (or blank). Bump it to "Committed".
  // Returns the status id to use. Other statuses (Committed, Paid, Invoiced, ...) are left untouched.
  function autoCommitStatus(statusId, actualGross, actualPartner) {
    const hasActual = (Number(actualGross) || 0) > 0 || (Number(actualPartner) || 0) > 0;
    if (!hasActual) return statusId;
    const cur = statusById(statusId);
    const curName = cur ? String(cur.name).toLowerCase() : "";
    if (curName && curName !== "planned") return statusId; // keep committed/paid/etc. as-is
    const list = state.data.settings.statuses || [];
    const committed = list.find((s) => String(s.name).toLowerCase() === "committed");
    return committed ? committed.id : statusId;
  }
  function eventById(id) { return (state.data.events || []).find((x) => x.id === id); }
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
  // Clusters that have at least one entity (in the zone, and in use in the year when one is given).
  function clusterList(m1, year) {
    let ents = uniqueEntities();
    if (m1) ents = ents.filter((e) => (e.m1 || "") === m1);
    if (year) ents = ents.filter((e) => entityActiveInYear(e, year));
    return Array.from(new Set(ents.map((e) => (e.group || "").trim()).filter(Boolean))).sort();
  }
  // Is an entity in use for a given year? startYear/endYear are optional bounds (inclusive).
  // Empty year (or no bounds) means always active, so nothing is hidden unless the user sets it.
  function entityActiveInYear(e, year) {
    if (!e) return false;
    if (!year) return true;
    const s = e.startYear ? +e.startYear : null;
    const u = e.endYear ? +e.endYear : null;
    if (s && year < s) return false;
    if (u && year > u) return false;
    return true;
  }
  function entityListFor(m1, cluster, year) {
    let ents = uniqueEntities();
    if (m1) ents = ents.filter((e) => (e.m1 || "") === m1);
    if (cluster) ents = ents.filter((e) => (e.group || "").trim() === cluster);
    if (year) ents = ents.filter((e) => entityActiveInYear(e, year));
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
  // ---- Toolbar helpers (used by Budget and Campaigns & events) ----
  // Show a year <select> as a row of buttons. The select stays (hidden) and keeps driving the
  // tab's existing change handler, so nothing else needs to know.
  function yearButtons(select) {
    if (!select) return;
    const wrap = document.createElement("div");
    wrap.className = "seg"; wrap.setAttribute("role", "group"); wrap.setAttribute("aria-label", "Year");
    [...select.options].forEach((o) => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = o.textContent; b.className = "seg-btn" + (o.selected ? " on" : "");
      b.setAttribute("aria-pressed", o.selected ? "true" : "false");
      b.onclick = () => { if (select.value === o.value) return; select.value = o.value; select.dispatchEvent(new Event("change")); };
      wrap.appendChild(b);
    });
    select.style.display = "none";
    select.insertAdjacentElement("afterend", wrap);
  }
  // Fold less-used filters into a "More filters" button with a drop-down panel. The badge counts
  // the filters in it that are set. The panel stays open across re-renders of the same tab.
  const moreOpen = {}, moreClose = {};
  let moreListening = false;
  function moreFilters(id, anchor, nodes) {
    nodes = (nodes || []).filter(Boolean);
    if (!anchor || !nodes.length) return;
    const box = document.createElement("div");
    box.className = "more-wrap";
    box.innerHTML = `<label>&nbsp;</label><button type="button" class="secondary more-btn" aria-expanded="false">More filters <span class="more-count"></span></button><div class="more-panel hidden"></div>`;
    const btn = box.querySelector(".more-btn"), panel = box.querySelector(".more-panel");
    nodes.forEach((n) => panel.appendChild(n));
    const count = () => {
      let n = 0;
      panel.querySelectorAll("select").forEach((s) => { if (s.value !== "" && s.value !== "all") n++; });
      if (panel.querySelector("input[type=checkbox]:checked")) n++;
      const c = box.querySelector(".more-count");
      c.textContent = n ? String(n) : ""; c.style.display = n ? "" : "none";
    };
    const setOpen = (on) => { moreOpen[id] = on; panel.classList.toggle("hidden", !on); btn.setAttribute("aria-expanded", on ? "true" : "false"); };
    btn.onclick = (e) => { e.stopPropagation(); setOpen(panel.classList.contains("hidden")); };
    panel.addEventListener("click", (e) => e.stopPropagation());
    panel.addEventListener("change", count);
    moreClose[id] = () => setOpen(false);
    if (!moreListening) { moreListening = true; document.addEventListener("click", () => Object.values(moreClose).forEach((f) => f())); }
    anchor.insertAdjacentElement("afterend", box);
    count(); setOpen(!!moreOpen[id]);
  }
  // Keep the current choice in a list even when it does not apply to the year (no silent reset).
  function withSel(list, sel) { return sel && !list.includes(sel) ? list.concat([sel]).sort() : list; }
  function scopeFilterHtml(prefix, scope, labelFn, year) {
    scope = scope || {};
    const lf = labelFn || ((e) => e.name);
    const m1s = (state.data.settings.m1Levels || []);
    const m1Opts = '<option value="">All zones</option>' + m1s.map((m) => `<option ${scope.m1 === m ? "selected" : ""} value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join("");
    const clOpts = '<option value="">All clusters</option>' + withSel(clusterList(scope.m1, year), scope.cluster).map((c) => `<option ${scope.cluster === c ? "selected" : ""} value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
    const enOpts = '<option value="">All entities</option>' + entityListFor(scope.m1, scope.cluster, year).map((e) => `<option ${scope.entityId === e.id ? "selected" : ""} value="${e.id}">${escapeHtml(lf(e))}</option>`).join("");
    return `
      <div><label>M1 zone</label><select id="${prefix}-m1">${m1Opts}</select></div>
      <div><label>Cluster</label><select id="${prefix}-cluster">${clOpts}</select></div>
      <div><label>Entity</label><select id="${prefix}-entity">${enOpts}</select></div>
    `;
  }
  // Wire the cascade. `scope` is mutated in place; `onChange` is called after each change.
  function wireScopeFilter(root, prefix, scope, onChange, labelFn, year) {
    const lf = labelFn || ((e) => e.name);
    const m1Sel = root.querySelector(`#${prefix}-m1`);
    const clSel = root.querySelector(`#${prefix}-cluster`);
    const enSel = root.querySelector(`#${prefix}-entity`);
    if (!m1Sel || !clSel || !enSel) return;
    const rebuildCluster = () => {
      clSel.innerHTML = '<option value="">All clusters</option>' + withSel(clusterList(scope.m1, year), scope.cluster).map((c) => `<option ${scope.cluster === c ? "selected" : ""} value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
    };
    const rebuildEntity = () => {
      enSel.innerHTML = '<option value="">All entities</option>' + entityListFor(scope.m1, scope.cluster, year).map((e) => `<option ${scope.entityId === e.id ? "selected" : ""} value="${e.id}">${escapeHtml(lf(e))}</option>`).join("");
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
    const cls = (opts && opts.cls) ? " " + opts.cls : "";
    root.innerHTML = `<div class="modal-backdrop"><div class="modal${cls}">${html}</div></div>`;
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

  // ---- Deleted items (bin) ----
  // Budget lines and events are never really deleted: they move to data.bin with who deleted them
  // and when. Views only use data.activities / data.events, so binned rows never show or count.
  // Admins can restore or permanently delete them in Settings > Deleted items.
  function ensureBin(d) {
    d = d || state.data;
    d.bin = d.bin || { activities: [], events: [] };
    d.bin.activities = d.bin.activities || [];
    d.bin.events = d.bin.events || [];
    d.purgedIds = d.purgedIds || [];
    return d.bin;
  }
  function moveToBin(kind, row, extra) {
    const bin = ensureBin();
    const r = { ...row, ...(extra || {}), deletedAt: new Date().toISOString(), deletedBy: state.currentUserId || "" };
    bin[kind] = bin[kind].filter((x) => x.id !== row.id);
    bin[kind].push(r);
  }
  function softDelete(kind, id, extra) {
    const list = state.data[kind] || [];
    const row = list.find((x) => x.id === id);
    if (!row) return null;
    state.data[kind] = list.filter((x) => x.id !== id);
    moveToBin(kind, row, extra);
    return row;
  }

  window.MB_STATE = {
    ensureBin, moveToBin, softDelete,
    state, subscribe, notify, scheduleSave, setSyncStatus, setLastUpdated, toast,
    fmtMoney, fmtMoneyShort, fmtNum, fmtDate, monthOf, yearOf, escapeHtml,
    inPeriod, inPeriodQ, quarterOptions, quarterChecks, monthOptions,
    yearButtons, moreFilters, GOALS, goalLabel, apCategoryForGoal,
    entityById, svpById, canonicalSvpId, normalizeSvps, countryById, countryNamesOf, actTypeById, userById, statusById, activeOwnerOptions,
    budgetCodeForActivity, autoCommitStatus,
    eventById, apCategoryById, apCategoryForActivity,
    eventEntityName, eventOwnerName,
    uniqueEntities, canonicalEntityId,
    clusterList, entityListFor, entityActiveInYear, entityMatchesScope, scopeFilterHtml, wireScopeFilter,
    openModal, closeModal, confirmDialog,
    OUTCOME_METRICS,
  };
})();
