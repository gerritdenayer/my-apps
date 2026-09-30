// Data tab: export, import and merge of the JSON data. Available to Admin and Budget owner,
// so budget owners can exchange budget & events files and load a setup, without opening Settings.
(function () {
  const S = window.MB_STATE;
  const API = window.MB_API;

  function render() {
    const root = document.getElementById("tab-data");
    root.innerHTML = `
      <div class="card">
        <h2>Data management</h2>
        <p class="muted small">Data lives in this browser. The setup (entities, clusters, M1, types, SVPs, statuses, users, yearly budgets, codes) is best owned by the admin and shared as one file. Budget and events are exchanged and merged between people. Every export is stamped with who made it and when.</p>
        <h3 style="margin-bottom:6px">Export</h3>
        <div class="actions" style="justify-content:flex-start; flex-wrap: wrap; gap: 8px;">
          <button class="primary" id="dm-export-all">Export everything (backup)</button>
          <button class="secondary" id="dm-export-setup">Export setup only</button>
          <button class="secondary" id="dm-export-be">Export budget &amp; events</button>
        </div>
        <h3 style="margin:14px 0 6px">Import / merge</h3>
        <p class="muted small" style="margin-top:0">Load a file. The app detects whether it is a setup file, a budget &amp; events file, or a full backup, and offers the right action. A merge never deletes on its own: it shows you what is new, what changed, and what is missing, and lets you decide.</p>
        <div class="actions" style="justify-content:flex-start; flex-wrap: wrap; gap: 8px;">
          <button class="secondary" id="dm-load">Load a file...</button>
          <button class="danger" id="dm-clear">Clear all local data</button>
        </div>
        <input type="file" id="dm-file-input" accept=".json,application/json" style="display:none" />
      </div>
      ${xlsxExportHtml()}
      ${datasetGridHtml()}
      ${shareCardHtml()}
    `;

    const fileInput = root.querySelector("#dm-file-input");
    const exporterName = () => {
      const u = (S.state.data.settings.users || []).find((x) => x.id === S.state.currentUserId);
      return u ? u.name : "";
    };
    const today = () => new Date().toISOString().slice(0, 10);

    root.querySelector("#dm-export-all").onclick = () => {
      API.exportToFile(S.state.data, `marketing-budget-all-${today()}.json`, exporterName(), "full");
      S.toast("Full backup downloaded", "success");
    };
    root.querySelector("#dm-export-setup").onclick = () => {
      API.exportToFile(API.pickSetup(S.state.data), `marketing-setup-${today()}.json`, exporterName(), "setup");
      S.toast("Setup file downloaded", "success");
    };
    root.querySelector("#dm-export-be").onclick = () => {
      API.exportToFile(API.pickBudgetEvents(S.state.data), `marketing-budget-events-${today()}.json`, exporterName(), "budget-events");
      S.toast("Budget & events file downloaded", "success");
    };

    root.querySelector("#dm-load").onclick = () => { fileInput.value = ""; fileInput.click(); };
    fileInput.onchange = async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const incoming = await API.readJsonFile(file);
        const kind = API.detectKind(incoming);
        if (kind === "setup") return loadSetupFile(incoming, file.name);
        if (kind === "budget-events") return mergeBudgetEventsFile(incoming, file.name);
        const choice = await fullFileChoice(file.name);
        if (choice === "replace") {
          S.state.data = incoming; S.scheduleSave(); S.notify();
          S.toast("All data replaced", "success");
        } else if (choice === "setup") {
          S.state.data = API.replaceSetup(S.state.data, incoming); S.scheduleSave(); S.notify();
          S.toast("Setup replaced from file", "success");
        } else if (choice === "merge") {
          mergeBudgetEventsFile(incoming, file.name);
        }
      } catch (err) {
        console.error(err);
        S.toast("Could not read file: " + err.message, "error");
      }
    };

    root.querySelector("#dm-clear").onclick = async () => {
      const ok = await S.confirmDialog(
        "Clear ALL local data on this computer? This wipes budget lines, settings, users and budgets. Export first if you want a backup."
      );
      if (!ok) return;
      API.clearAll();
      location.reload();
    };

    wireShare(root);
    wireXlsxExport(root);
    renderDatasetGrid();
  }

  // ---- Excel export (budget lines and campaigns/events), filtered by year + quarters ----
  function xlsxExportHtml() {
    const yrs = new Set();
    (S.state.data.activities || []).forEach((a) => { if (a.date) { const y = new Date(a.date).getFullYear(); if (!isNaN(y)) yrs.add(y); } });
    (S.state.data.events || []).forEach((e) => { if (e.start) { const y = new Date(e.start).getFullYear(); if (!isNaN(y)) yrs.add(y); } });
    yrs.add(new Date().getFullYear());
    const years = [...yrs].sort();
    const cur = new Date().getFullYear();
    return `
      <div class="card">
        <h2>Export to Excel</h2>
        <p class="muted small">Export budget lines and campaigns / events as separate Excel files. Pick a year and tick the quarters to include. No quarter ticked means the whole year.</p>
        <div style="display:flex; gap:20px; align-items:flex-end; flex-wrap:wrap; margin-bottom:10px;">
          <div><label class="muted small">Year</label><br/><select id="xe-year"><option value="all">All years</option>${years.map((y) => `<option ${y === cur ? "selected" : ""} value="${y}">${y}</option>`).join("")}</select></div>
          <div><label class="muted small">Quarters</label>${S.quarterChecks("xe", [])}</div>
        </div>
        <div class="actions" style="justify-content:flex-start; flex-wrap:wrap; gap:8px;">
          <button class="primary" id="xe-budget">Export budget lines</button>
          <button class="primary" id="xe-events">Export campaigns &amp; events</button>
        </div>
      </div>`;
  }
  function wireXlsxExport(root) {
    const getSel = () => ({ year: root.querySelector("#xe-year").value, quarters: [...root.querySelectorAll(".xe-q:checked")].map((x) => x.value) });
    const b = root.querySelector("#xe-budget");
    if (b) b.onclick = () => { const s = getSel(); exportBudgetXlsx(s.year, s.quarters); };
    const ev = root.querySelector("#xe-events");
    if (ev) ev.onclick = () => { const s = getSel(); exportEventsXlsx(s.year, s.quarters); };
  }
  function writeSheet(kind, sheetName, header, rows) {
    if (!window.XLSX) return S.toast("Excel library not loaded.", "error");
    if (!rows.length) return S.toast("No rows match the selected period.", "error");
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `marketing-${kind}-${new Date().toISOString().slice(0, 10)}.xlsx`);
    S.toast(`Exported ${rows.length} row(s) to Excel.`, "success");
  }
  function exportBudgetXlsx(year, quarters) {
    const D = S.state.data;
    const ap = (id) => ((D.settings.apCategories || []).find((c) => c.id === id) || {}).name || "";
    const rows = (D.activities || []).filter((a) => S.inPeriodQ(a.date, year, quarters, "")).map((a) => {
      const e = S.entityById(a.entityId) || {};
      return [a.date || "", a.name || "", e.group || "", e.name || "",
        (S.actTypeById(a.activityTypeId) || {}).name || "", ap(a.apCategoryId),
        (S.statusById(a.statusId) || {}).name || "", (S.svpById(a.svpId) || {}).name || "",
        (S.userById(a.ownerId) || {}).name || "", a.vendor || "", a.poNumber || "",
        a.forecastGross || 0, a.forecastPartner || 0, (a.forecastGross || 0) - (a.forecastPartner || 0),
        a.actualGross || 0, a.actualPartner || 0, (a.actualGross || 0) - (a.actualPartner || 0), a.notes || ""];
    });
    writeSheet("budget-lines", "Budget lines",
      ["Date", "Expenditure or Activity", "Cluster", "Entity", "Activity type", "A&P category", "Status", "SVP", "Owner", "Vendor", "PO number", "Forecast gross", "Forecast partner", "Forecast net", "Actual gross", "Actual partner", "Actual net", "Notes"],
      rows);
  }
  function exportEventsXlsx(year, quarters) {
    const D = S.state.data;
    const campN = (e) => (e.kind === "Campaign") ? "" : (e.campaignId ? ((S.eventById(e.campaignId) || {}).name || "") : "");
    const rows = (D.events || []).filter((e) => S.inPeriodQ(e.start, year, quarters, "")).map((e) => {
      const en = S.entityById(e.entityId) || {};
      return [e.start || "", e.end || "", e.name || "", e.kind || "Event",
        (S.actTypeById(e.activityTypeId) || {}).name || "", en.group || "", en.name || "",
        (S.userById(e.ownerId) || {}).name || "", (S.svpById(e.svpId) || {}).name || "", campN(e),
        S.countryNamesOf(e.countryIds).join(", "), e.campaignCode || "", e.info || ""];
    });
    writeSheet("campaigns-events", "Events",
      ["Start", "End", "Name", "Kind", "Activity type", "Cluster", "Entity", "Owner", "SVP", "Campaign", "Countries", "Campaign code", "Notes"],
      rows);
  }

  // ---- Budget & events table with multi-row edit ----
  const gridState = { ds: "activities", sortBy: "", sortDir: "asc", sel: new Set() };

  function datasetGridHtml() {
    return `
      <div class="card">
        <h2>Budget &amp; events table</h2>
        <p class="muted small">A tabular view for quick edits across many rows. Tick the rows, pick a field and a value, and apply to all ticked at once. Click a header to sort.</p>
        <div id="ds-grid"></div>
      </div>`;
  }

  function gridCols(ds) {
    const D = S.state.data;
    const entN = (id) => (S.entityById(id) || {}).name || "";
    const svpN = (id) => (S.svpById(id) || {}).name || "";
    const typeN = (id) => (S.actTypeById(id) || {}).name || "";
    const statN = (id) => (S.statusById(id) || {}).name || "";
    const userN = (id) => (S.userById(id) || {}).name || "";
    const campN = (e) => (e.kind === "Campaign") ? "" : (e.campaignId ? ((S.eventById(e.campaignId) || {}).name || "") : "");
    if (ds === "activities") return [
      { key: "date", label: "Date", text: (a) => a.date || "", sort: (a) => a.date || "" },
      { key: "name", label: "Name", text: (a) => a.name || "", sort: (a) => (a.name || "").toLowerCase() },
      { key: "entity", label: "Entity", text: (a) => entN(a.entityId), sort: (a) => entN(a.entityId).toLowerCase() },
      { key: "svp", label: "SVP", text: (a) => svpN(a.svpId), sort: (a) => svpN(a.svpId).toLowerCase() },
      { key: "type", label: "Type", text: (a) => typeN(a.activityTypeId), sort: (a) => typeN(a.activityTypeId).toLowerCase() },
      { key: "status", label: "Status", text: (a) => statN(a.statusId), sort: (a) => statN(a.statusId).toLowerCase() },
      { key: "owner", label: "Owner", text: (a) => userN(a.ownerId), sort: (a) => userN(a.ownerId).toLowerCase() },
      { key: "fN", label: "Forecast net", num: true, text: (a) => S.fmtMoney((a.forecastGross || 0) - (a.forecastPartner || 0)), sort: (a) => (a.forecastGross || 0) - (a.forecastPartner || 0) },
      { key: "aN", label: "Actual net", num: true, text: (a) => S.fmtMoney((a.actualGross || 0) - (a.actualPartner || 0)), sort: (a) => (a.actualGross || 0) - (a.actualPartner || 0) },
    ];
    return [
      { key: "start", label: "Start", text: (e) => e.start || "", sort: (e) => e.start || "" },
      { key: "name", label: "Name", text: (e) => e.name || "", sort: (e) => (e.name || "").toLowerCase() },
      { key: "kind", label: "Kind", text: (e) => e.kind || "Event", sort: (e) => (e.kind || "").toLowerCase() },
      { key: "entity", label: "Entity", text: (e) => entN(e.entityId), sort: (e) => entN(e.entityId).toLowerCase() },
      { key: "type", label: "Type", text: (e) => typeN(e.activityTypeId), sort: (e) => typeN(e.activityTypeId).toLowerCase() },
      { key: "owner", label: "Owner", text: (e) => userN(e.ownerId), sort: (e) => userN(e.ownerId).toLowerCase() },
      { key: "svp", label: "SVP", text: (e) => svpN(e.svpId), sort: (e) => svpN(e.svpId).toLowerCase() },
      { key: "campaign", label: "Campaign", text: (e) => campN(e), sort: (e) => campN(e).toLowerCase() },
      { key: "countries", label: "Countries", text: (e) => S.countryNamesOf(e.countryIds).join(", "), sort: (e) => S.countryNamesOf(e.countryIds).join(", ").toLowerCase() },
    ];
  }

  function gridEditFields(ds) {
    const D = S.state.data;
    const opt = (arr) => arr.map((x) => ({ v: x.id, l: x.name }));
    const users = () => opt((D.settings.users || []).filter((u) => u.active !== false));
    if (ds === "activities") return [
      { field: "statusId", label: "Status", opts: () => opt(D.settings.statuses || []) },
      { field: "ownerId", label: "Owner", opts: users },
      { field: "svpId", label: "SVP", opts: () => opt(D.settings.svps || []) },
      { field: "activityTypeId", label: "Type", opts: () => opt(D.settings.activityTypes || []) },
      { field: "entityId", label: "Entity", opts: () => opt(D.settings.entities || []) },
      { field: "date", label: "Date", date: true },
    ];
    return [
      { field: "ownerId", label: "Owner", opts: users },
      { field: "activityTypeId", label: "Type", opts: () => opt(D.settings.activityTypes || []) },
      { field: "svpId", label: "SVP", opts: () => opt(D.settings.svps || []) },
      { field: "campaignId", label: "Campaign", opts: () => opt((D.events || []).filter((x) => x.kind === "Campaign")) },
      { field: "entityId", label: "Entity", opts: () => opt(D.settings.entities || []) },
      { field: "kind", label: "Kind", opts: () => [{ v: "Event", l: "Event" }, { v: "Campaign", l: "Campaign" }] },
    ];
  }

  function dsValControl(fieldDef) {
    if (!fieldDef) return "";
    if (fieldDef.date) return `<input id="ds-val" type="date" />`;
    const opts = fieldDef.opts ? fieldDef.opts() : [];
    return `<select id="ds-val"><option value="">(clear / none)</option>${opts.map((o) => `<option value="${o.v}">${S.escapeHtml(o.l)}</option>`).join("")}</select>`;
  }

  function renderDatasetGrid() {
    const host = document.getElementById("ds-grid");
    if (!host) return;
    const ds = gridState.ds;
    const cols = gridCols(ds);
    const fields = gridEditFields(ds);
    let rows = (S.state.data[ds] || []).slice();
    if (gridState.sortBy) {
      const col = cols.find((c) => c.key === gridState.sortBy);
      if (col) {
        const dir = gridState.sortDir === "desc" ? -1 : 1;
        rows.sort((a, b) => {
          const va = col.sort(a), vb = col.sort(b);
          if (typeof va === "string" && typeof vb === "string") return va.localeCompare(vb) * dir;
          return ((+va || 0) - (+vb || 0)) * dir;
        });
      }
    }
    const arrow = (k) => gridState.sortBy !== k ? ` <span class="muted">⇅</span>` : (gridState.sortDir === "asc" ? " ▲" : " ▼");
    const acts = (S.state.data.activities || []).length, evs = (S.state.data.events || []).length;
    host.innerHTML = `
      <div style="display:flex; gap:6px; align-items:center; margin-bottom:8px; flex-wrap:wrap;">
        <button class="ds-tab ${ds === "activities" ? "primary" : "secondary"}" data-ds="activities">Budget lines (${acts})</button>
        <button class="ds-tab ${ds === "events" ? "primary" : "secondary"}" data-ds="events">Events (${evs})</button>
      </div>
      <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:8px; padding:8px; background:#f8fafc; border:1px solid #eef0f3; border-radius:6px;">
        <span class="small"><strong id="ds-selcount">${gridState.sel.size}</strong> selected</span>
        <label class="muted small">Set</label>
        <select id="ds-field">${fields.map((f) => `<option value="${f.field}">${S.escapeHtml(f.label)}</option>`).join("")}</select>
        <label class="muted small">to</label>
        <span id="ds-valwrap">${dsValControl(fields[0])}</span>
        <button id="ds-apply" class="primary" ${gridState.sel.size ? "" : "disabled"}>Apply to selected</button>
        <button id="ds-clearsel" class="secondary">Clear selection</button>
      </div>
      <div class="table-wrap" style="max-height:460px; overflow:auto;">
        <table>
          <thead><tr>
            <th style="width:34px"><input type="checkbox" id="ds-all" /></th>
            ${cols.map((c) => `<th data-k="${c.key}" style="cursor:pointer; white-space:nowrap;${c.num ? "text-align:right;" : ""}">${S.escapeHtml(c.label)}${arrow(c.key)}</th>`).join("")}
          </tr></thead>
          <tbody>
            ${rows.map((r) => `<tr data-id="${r.id}">
              <td><input type="checkbox" class="ds-row" value="${r.id}" ${gridState.sel.has(r.id) ? "checked" : ""} /></td>
              ${cols.map((c) => `<td${c.num ? ' class="num"' : ""}>${S.escapeHtml(c.text(r))}</td>`).join("")}
            </tr>`).join("")}
          </tbody>
        </table>
      </div>`;

    host.querySelectorAll(".ds-tab").forEach((b) => { b.onclick = () => { gridState.ds = b.dataset.ds; gridState.sel = new Set(); gridState.sortBy = ""; renderDatasetGrid(); }; });
    const fieldSel = host.querySelector("#ds-field");
    fieldSel.onchange = () => { const fd = fields.find((f) => f.field === fieldSel.value); host.querySelector("#ds-valwrap").innerHTML = dsValControl(fd); };
    host.querySelectorAll("thead th[data-k]").forEach((th) => {
      th.onclick = () => { const k = th.dataset.k; if (gridState.sortBy === k) gridState.sortDir = gridState.sortDir === "asc" ? "desc" : "asc"; else { gridState.sortBy = k; gridState.sortDir = "asc"; } renderDatasetGrid(); };
    });
    const updateSel = () => { host.querySelector("#ds-selcount").textContent = gridState.sel.size; host.querySelector("#ds-apply").disabled = !gridState.sel.size; };
    host.querySelectorAll(".ds-row").forEach((cb) => { cb.onchange = () => { if (cb.checked) gridState.sel.add(cb.value); else gridState.sel.delete(cb.value); updateSel(); }; });
    host.querySelector("#ds-all").onchange = (e) => {
      host.querySelectorAll(".ds-row").forEach((cb) => { cb.checked = e.target.checked; if (e.target.checked) gridState.sel.add(cb.value); else gridState.sel.delete(cb.value); });
      updateSel();
    };
    host.querySelector("#ds-clearsel").onclick = () => { gridState.sel = new Set(); renderDatasetGrid(); };
    host.querySelector("#ds-apply").onclick = () => applyBulk(fields);
  }

  async function applyBulk(fields) {
    const ds = gridState.ds;
    const field = document.getElementById("ds-field").value;
    const fieldDef = fields.find((f) => f.field === field);
    const valEl = document.getElementById("ds-val");
    const value = valEl ? valEl.value : "";
    const list = S.state.data[ds] || [];
    const targets = list.filter((r) => gridState.sel.has(r.id));
    if (!targets.length) return S.toast("No rows selected.", "error");
    const label = fieldDef ? fieldDef.label : field;
    const valLabel = value === "" ? "(cleared)" : (fieldDef && fieldDef.opts ? ((fieldDef.opts().find((o) => o.v === value) || {}).l || value) : value);
    const ok = await S.confirmDialog(`Set ${label} to "${valLabel}" for ${targets.length} ${ds === "activities" ? "budget line(s)" : "event(s)"}?`);
    if (!ok) return;
    let n = 0;
    targets.forEach((row) => {
      if ((row[field] || "") === (value || "")) return;
      row[field] = value;
      if (ds === "events" && field === "entityId") { const ent = S.entityById(value); row.cluster = ent ? (ent.group || "") : ""; }
      row.updatedBy = S.state.currentUserId; row.updatedAt = new Date().toISOString();
      n++;
    });
    if (!n) { S.toast("No change (rows already had that value).", "error"); return; }
    S.scheduleSave(); S.notify();
    S.toast(`Updated ${n} ${ds === "activities" ? "budget line(s)" : "event(s)"}.`, "success");
    renderDatasetGrid();
  }

  // ---- Shared folder (Teams / OneDrive) ----
  const SETUP_FILE = "marketing-hub-setup.json";
  const DATA_FILE = "marketing-hub-budget-events.json"; // old single file (before per-year files)
  const SEEN_KEY = "mb_share_data_seen";
  const BASE_KEY = "mb_share_pub_base"; // signature of budget & events at the last publish/pull
  const PW_FILE = "marketing-hub-passwords.json"; // login passwords (hashed), newest change wins
  const SETUP_SEEN_KEY = "mb_share_setup_seen"; // exportedAt of the shared setup at the last sync
  const SETUP_BASE_KEY = "mb_share_setup_base"; // signature of the shared setup at the last sync
  const SH = window.MB_SHARE;

  // Signature of the local budget & events, to tell whether there are unpublished changes.
  function beSig() {
    return JSON.stringify({ a: S.state.data.activities || [], e: S.state.data.events || [] });
  }
  function markPublishBaseline() {
    try { localStorage.setItem(BASE_KEY, beSig()); } catch (e) {}
  }
  // Show, in the header, the date of the shared file as of this browser's last sync.
  function updateSharedHeader() {
    const el = document.getElementById("shared-updated");
    if (!el) return;
    const f = (iso) => {
      const d = new Date(iso || "");
      if (!iso || isNaN(d)) return "";
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) + " " +
        d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    };
    const data = f(localStorage.getItem(SEEN_KEY));
    const setup = f(localStorage.getItem(SETUP_SEEN_KEY));
    // One line each, shown in the "last updated" pop-up in the header.
    const parts = [];
    if (data) parts.push("Shared budget &amp; events: " + S.escapeHtml(data));
    if (setup) parts.push("Shared setup: " + S.escapeHtml(setup));
    el.innerHTML = parts.map((x) => `<div>${x}</div>`).join("");
  }
  // True when the local budget & events differ from what was last published or pulled.
  function budgetEventsDirty() {
    const cur = beSig();
    const base = localStorage.getItem(BASE_KEY);
    if (base === null) { try { localStorage.setItem(BASE_KEY, cur); } catch (e) {} return false; }
    return cur !== base;
  }
  async function shareFolderConfigured() {
    if (!SH || !SH.supported()) return false;
    return !!(await SH.savedFolder());
  }
  // Wire up a "Publish changes" button that lives on the Budget and Events tabs: shown only when
  // a shared folder is set, enabled only when there are unpublished budget & events changes.
  async function wirePublishButton(btn) {
    if (!btn) return;
    if (!(await shareFolderConfigured())) { btn.style.display = "none"; return; }
    btn.style.display = "";
    const dirty = budgetEventsDirty();
    btn.disabled = !dirty;
    btn.style.opacity = dirty ? "1" : "0.45";
    btn.style.cursor = dirty ? "pointer" : "default";
    btn.textContent = dirty ? "Publish changes" : "No changes to publish";
    btn.title = dirty ? "You have unpublished budget & events changes. Click to publish them to the shared folder." : "No unpublished changes.";
    btn.onclick = async () => { const ok = await publishBudgetEvents(); if (ok) wirePublishButton(btn); };
  }
  // A "Check for updates" button: shows whether the shared file is newer than your last sync,
  // without pulling anything, and offers to refresh from there.
  async function wireCheckButton(btn) {
    if (!btn) return;
    if (!(await shareFolderConfigured())) { btn.style.display = "none"; return; }
    btn.style.display = "";
    btn.title = "See if a newer shared version exists, without changing your copy.";
    btn.onclick = () => checkForShared();
  }
  async function checkForShared() {
    if (!SH || !SH.supported()) return S.toast("Shared folder is not available in this browser.", "error");
    const dir = await SH.savedFolder();
    if (!dir) return S.toast("Choose the shared folder first (Settings > Data & sharing).", "error");
    if (!(await SH.ensurePerm(dir, "readwrite"))) return S.toast("Access to the shared folder was not granted.", "error");
    await syncPasswords({ auto: false });
    await checkSetup({ auto: false });
    let remote;
    try { remote = await readSharedBE(dir); }
    catch (e) { return S.toast("Could not read the shared file: " + e.message, "error"); }
    if (!remote) return S.toast("No budget & events file in the shared folder yet.", "error");
    const seen = localStorage.getItem(SEEN_KEY) || "";
    const stamp = (remote.meta && remote.meta.exportedAt) || "";
    const who = (remote.meta && remote.meta.exportedBy) || "a teammate";
    const fmt = (iso) => iso ? new Date(iso).toLocaleString("en-GB") : "unknown";
    if (!stamp || stamp === seen) {
      return S.toast("You have the latest shared version" + (stamp ? ` (from ${fmt(stamp)})` : "") + ".", "success");
    }
    const m = S.openModal(`
      <h2>A newer shared version is available</h2>
      <p>The shared budget &amp; events file was published by <strong>${S.escapeHtml(who)}</strong> on ${S.escapeHtml(fmt(stamp))}.</p>
      <p class="muted small">Your copy last synced: ${S.escapeHtml(seen ? fmt(seen) : "never")}. Refresh pulls the new and changed rows into your copy. Nothing you have is deleted.</p>
      <div class="actions">
        <button class="secondary" id="ck-close">Not now</button>
        <button class="primary" id="ck-refresh">Refresh now</button>
      </div>`);
    m.querySelector("#ck-close").onclick = S.closeModal;
    m.querySelector("#ck-refresh").onclick = () => { S.closeModal(); refreshFromShared({ auto: false }); };
  }
  // Guarded publish of budget & events, reused by the Data tab and the tab buttons.
  // Signature of a single row's content, ignoring audit fields, to compare versions.
  function rowSig(o) {
    const skip = { createdAt: 1, updatedAt: 1, createdBy: 1, updatedBy: 1 };
    const c = {}; Object.keys(o).sort().forEach((k) => { if (!skip[k]) c[k] = o[k]; });
    return JSON.stringify(c);
  }
  // Three-way merge of one list (activities or events): start from the shared/remote rows, then
  // overlay the rows this user inserted or changed since the last sync (baseline). Rows the user
  // did not touch keep the shared version, so teammates' changes are preserved. Deletions are not
  // propagated here (handled by the Review & merge screen), so nothing is removed by surprise.
  function mergeList(baseArr, localArr, remoteArr) {
    const B = Object.fromEntries((baseArr || []).map((x) => [x.id, x]));
    const Rmap = Object.fromEntries((remoteArr || []).map((x) => [x.id, x]));
    const localIds = new Set((localArr || []).map((x) => x.id));
    const result = Object.fromEntries((remoteArr || []).map((x) => [x.id, x]));
    let inserts = 0, updates = 0, deletes = 0;
    (localArr || []).forEach((row) => {
      const b = B[row.id];
      if (!b) {
        result[row.id] = row;
        if (Object.prototype.hasOwnProperty.call(Rmap, row.id)) updates++; else inserts++;
      } else if (rowSig(row) !== rowSig(b)) {
        result[row.id] = row; updates++;
      }
    });
    // Rows you deleted since the last sync: remove them from the shared file too, so they do not
    // come back. Exception: if a teammate changed that same row in the meantime, keep their version
    // rather than deleting, so their edit is not lost.
    Object.keys(B).forEach((id) => {
      if (localIds.has(id)) return;            // still present locally, not a deletion
      const r = Rmap[id];
      if (!r) return;                          // already gone from the shared file
      if (rowSig(r) === rowSig(B[id])) { delete result[id]; deletes++; }
    });
    return { list: Object.values(result), inserts, updates, deletes };
  }
  // How many merged rows came from teammates (differ from the local copy before merge).
  function countFromRemote(localArr, mergedArr) {
    const L = Object.fromEntries((localArr || []).map((x) => [x.id, x]));
    let n = 0;
    (mergedArr || []).forEach((x) => { const l = L[x.id]; if (!l || rowSig(l) !== rowSig(x)) n++; });
    return n;
  }

  async function publishBudgetEvents() {
    const dir = await shareDir();
    if (!dir) return false;
    try {
      const ok = await S.confirmDialog("Publish your budget & events? Your new, changed and deleted rows are merged into the shared file, and any changes teammates already published are pulled into your copy. A teammate's row you did not touch is never removed.");
      if (!ok) return false;
      const remote = reconcileIncomingCountries(await readSharedBE(dir));
      let baseline = null;
      try { baseline = JSON.parse(localStorage.getItem(BASE_KEY) || "null"); } catch (e) { baseline = null; }
      const localA = S.state.data.activities || [], localE = S.state.data.events || [];
      let stats = { insA: 0, updA: 0, delA: 0, insE: 0, updE: 0, delE: 0, fromRemote: 0 };
      if (remote && (Array.isArray(remote.activities) || Array.isArray(remote.events))) {
        const ma = mergeList(baseline ? baseline.a : [], localA, remote.activities || []);
        const me = mergeList(baseline ? baseline.e : [], localE, remote.events || []);
        stats = { insA: ma.inserts, updA: ma.updates, delA: ma.deletes, insE: me.inserts, updE: me.updates, delE: me.deletes,
          fromRemote: countFromRemote(localA, ma.list) + countFromRemote(localE, me.list) };
        S.state.data.activities = ma.list;
        S.state.data.events = me.list;
      }
      const res = await writeSharedBE(dir, S.state.data.activities, S.state.data.events, remote);
      const seenStamp = [res.newest, (remote && remote.meta && remote.meta.exportedAt) || ""].sort().pop();
      if (seenStamp) localStorage.setItem(SEEN_KEY, seenStamp);
      markPublishBaseline(); updateSharedHeader();
      S.scheduleSave(); S.notify();
      const mine = stats.insA + stats.insE, changed = stats.updA + stats.updE, removed = stats.delA + stats.delE;
      const yrs = res.written.length ? ` Updated file(s): ${res.written.join(", ")}.` : " No shared file needed changes.";
      S.toast(`Published & merged. New: ${mine}, changed: ${changed}, removed: ${removed}. Pulled in from teammates: ${stats.fromRemote}.${yrs}`, "success");
      return true;
    } catch (e) { S.toast("Could not publish budget & events: " + e.message, "error"); return false; }
  }

  function canPushSetup() {
    return !!(window.MB_AUTH && window.MB_AUTH.canSeeSettings && window.MB_AUTH.canSeeSettings());
  }

  function shareCardHtml() {
    if (!SH || !SH.supported()) {
      return `
        <div class="card">
          <h2>Shared folder (Teams / OneDrive)</h2>
          <p class="muted small">This browser cannot write directly to a shared folder. Use Chrome or Edge for that. In the meantime, the Export and Load buttons above do the same job by hand.</p>
        </div>`;
    }
    return `
      <div class="card">
        <h2>Shared folder (Teams / OneDrive)</h2>
        <p class="muted small">Publish and pull the master data through a folder that syncs with your team. Pick the shared folder once and the app remembers it. The setup is published by admins and pulled by everyone. Budget and events are shared: pulling always goes through the review screen, and publishing warns you if a colleague published since you last pulled.</p>
        <div id="share-status" class="muted small" style="margin:6px 0 10px">Checking...</div>
        <div class="actions" style="justify-content:flex-start; flex-wrap:wrap; gap:8px;">
          <button class="secondary" id="sh-folder">Choose shared folder...</button>
        </div>
        <h3 style="margin:14px 0 6px">Setup (structure)</h3>
        <div class="actions" style="justify-content:flex-start; flex-wrap:wrap; gap:8px;">
          ${canPushSetup() ? `<button class="primary" id="sh-push-setup">Publish setup</button>` : `<span class="muted small">Only admins can publish the setup.</span>`}
          <button class="secondary" id="sh-pull-setup">Pull setup</button>
        </div>
        <h3 style="margin:14px 0 6px">Budget &amp; events</h3>
        <div class="actions" style="justify-content:flex-start; flex-wrap:wrap; gap:8px;">
          <button class="primary" id="sh-push-data">Publish budget &amp; events</button>
          <button class="secondary" id="sh-pull-data">Pull budget &amp; events</button>
          <button class="secondary" id="sh-review-data">Review &amp; merge...</button>
        </div>
        <p class="muted small" style="margin-top:6px">Pull applies new and changed items automatically and shows a summary. Use Review &amp; merge only when you need to handle deletions by hand.</p>
      </div>`;
  }

  function shareUserName() {
    const u = (S.state.data.settings.users || []).find((x) => x.id === S.state.currentUserId);
    return u ? u.name : "";
  }

  async function refreshShareStatus(root) {
    const el = root.querySelector("#share-status");
    if (!el || !SH) return;
    const folderBtn = root.querySelector("#sh-folder");
    const dir = await SH.savedFolder();
    if (!dir) {
      el.innerHTML = `<span class="muted">No shared folder selected yet.</span>`;
      if (folderBtn) folderBtn.textContent = "Choose shared folder...";
      return;
    }
    const seen = localStorage.getItem(SEEN_KEY) || "";
    el.innerHTML = `Current shared folder: <strong>${S.escapeHtml(dir.name)}</strong>` +
      (seen ? ` <span class="muted">&middot; last synced budget &amp; events ${S.escapeHtml(new Date(seen).toLocaleString("en-GB"))}</span>` : "") +
      (localStorage.getItem(SETUP_SEEN_KEY) ? ` <span class="muted">&middot; setup ${S.escapeHtml(new Date(localStorage.getItem(SETUP_SEEN_KEY)).toLocaleString("en-GB"))}</span>` : "");
    if (folderBtn) folderBtn.textContent = "Change shared folder...";
    // The browser never reveals the full folder path, so list the shared files found in it
    // (with last-saved date and publisher) to show you are on the right folder.
    const box = document.createElement("div");
    box.style.marginTop = "6px";
    el.appendChild(box);
    if (!(await SH.hasPerm(dir, "readwrite"))) {
      box.innerHTML = `<span class="muted">Files in this folder are shown once the browser has access (click any Publish or Pull button, or Refresh).</span>`;
      return;
    }
    const fmt = (ms) => new Date(ms).toLocaleString("en-GB");
    const rows = [];
    let yearFiles = [];
    try { yearFiles = (await SH.listFiles(dir)).filter((n) => BE_RE.test(n)).sort(); } catch (e) {}
    const list = [[SETUP_FILE, "Setup"]]
      .concat(yearFiles.map((n) => [n, "Budget & events " + n.match(BE_RE)[1]]))
      .concat([[DATA_FILE, "Old single file"], [PW_FILE, "Passwords"]]);
    for (const [file, label] of list) {
      let line;
      if (file === DATA_FILE) {
        // The old single file: only worth showing when it exists.
        let legacy = null;
        try { legacy = await SH.readJson(dir, DATA_FILE); } catch (e) {}
        if (!legacy) continue;
        if (legacy.meta && legacy.meta.splitInto) { rows.push(`<div class="muted">${label}: <code>${S.escapeHtml(file)}</code> &middot; empty, replaced by the per-year files</div>`); continue; }
        if (!yearFiles.length) { rows.push(`<div>Budget &amp; events: <code>${S.escapeHtml(file)}</code> &middot; single file, split into one file per year at the next publish</div>`); continue; }
      }
      try {
        const info = SH.fileInfo ? await SH.fileInfo(dir, file) : null;
        if (!info) line = `<span style="color:#b45309">not found</span>`;
        else {
          let by = "";
          try { const j = await SH.readJson(dir, file); by = (j && j.meta && j.meta.exportedBy) || ""; } catch (e) {}
          line = `saved ${S.escapeHtml(fmt(info.lastModified))}${by ? ` by ${S.escapeHtml(by)}` : ""} &middot; ${Math.round(info.size / 1024)} KB`;
        }
      } catch (e) { line = `<span style="color:#b91c1c">could not read</span>`; }
      rows.push(`<div>${label}: <code>${S.escapeHtml(file)}</code> &middot; ${line}</div>`);
    }
    box.innerHTML = rows.join("");
  }

  // Get the folder handle with write permission, or explain why not.
  async function shareDir() {
    const dir = await SH.savedFolder();
    if (!dir) { S.toast("Choose the shared folder first.", "error"); return null; }
    const ok = await SH.ensurePerm(dir, "readwrite");
    if (!ok) { S.toast("Access to the shared folder was not granted.", "error"); return null; }
    return dir;
  }

  function wireShare(root) {
    if (!SH || !SH.supported()) return;
    refreshShareStatus(root);

    const folderBtn = root.querySelector("#sh-folder");
    if (folderBtn) folderBtn.onclick = async () => {
      try {
        const h = await SH.chooseFolder();
        await refreshShareStatus(root);
        S.toast(`Shared folder set: ${h.name}`, "success");
      } catch (e) {
        if (e && e.name !== "AbortError") S.toast("Could not set the folder: " + e.message, "error");
      }
    };

    const pushSetupBtn = root.querySelector("#sh-push-setup");
    if (pushSetupBtn) pushSetupBtn.onclick = () => publishSetupFlow();

    const pullSetupBtn = root.querySelector("#sh-pull-setup");
    if (pullSetupBtn) pullSetupBtn.onclick = async () => {
      const dir = await shareDir();
      if (!dir) return;
      try {
        const incoming = await SH.readJson(dir, SETUP_FILE);
        if (!incoming) return S.toast("No setup file in the shared folder yet.", "error");
        if (await loadSetupFile(incoming, SETUP_FILE)) markSetupSynced(incoming);
      } catch (e) { S.toast("Could not pull setup: " + e.message, "error"); }
    };

    const pushDataBtn = root.querySelector("#sh-push-data");
    if (pushDataBtn) pushDataBtn.onclick = async () => {
      await publishBudgetEvents();
      await refreshShareStatus(root);
    };

    const pullDataBtn = root.querySelector("#sh-pull-data");
    if (pullDataBtn) pullDataBtn.onclick = async () => {
      await refreshFromShared({ auto: false });
      await refreshShareStatus(root);
    };

    const reviewDataBtn = root.querySelector("#sh-review-data");
    if (reviewDataBtn) reviewDataBtn.onclick = async () => {
      const dir = await shareDir();
      if (!dir) return;
      try {
        const incoming = await readSharedBE(dir);
        if (!incoming) return S.toast("No budget & events file in the shared folder yet.", "error");
        if (incoming.meta && incoming.meta.exportedAt) localStorage.setItem(SEEN_KEY, incoming.meta.exportedAt);
        await refreshShareStatus(root);
        mergeBudgetEventsFile(incoming, "the shared budget & events files");
      } catch (e) { S.toast("Could not review budget & events: " + e.message, "error"); }
    };
  }

  function fullFileChoice(name) {
    return new Promise((resolve) => {
      const m = S.openModal(`
        <h2>Full backup file</h2>
        <p>"${S.escapeHtml(name)}" contains both the setup and the budget &amp; events. What do you want to do?</p>
        <div class="actions" style="flex-direction:column; align-items:stretch; gap:8px;">
          <button class="danger" id="ff-replace">Replace EVERYTHING (restore this backup)</button>
          <button class="secondary" id="ff-setup">Replace only the setup / structure</button>
          <button class="primary" id="ff-merge">Merge only budget &amp; events (review first)</button>
          <button class="secondary" id="ff-cancel">Cancel</button>
        </div>
      `, { closeOnBackdrop: false });
      const pick = (v) => { S.closeModal(); resolve(v); };
      m.querySelector("#ff-replace").onclick = () => pick("replace");
      m.querySelector("#ff-setup").onclick = () => pick("setup");
      m.querySelector("#ff-merge").onclick = () => pick("merge");
      m.querySelector("#ff-cancel").onclick = () => pick(null);
    });
  }

  async function loadSetupFile(incoming, name) {
    const ok = await S.confirmDialog(`Replace your setup (entities, clusters, M1, types, SVPs, statuses, users, yearly budgets, codes) with the one in "${name}"? Your budget lines and events stay. Export a backup first if unsure.`);
    if (!ok) return false;
    S.state.data = API.replaceSetup(S.state.data, incoming);
    S.scheduleSave(); S.notify();
    S.toast("Setup replaced from file", "success");
    return true;
  }

  // Self-healing country tags: incoming events carry the sender's country ids, which may differ
  // from ours. Using the sender's id->name map (countriesRef), re-point each incoming event's
  // country tags to our own country ids by matching names, creating any country we do not have.
  function reconcileIncomingCountries(incoming) {
    if (!incoming || !Array.isArray(incoming.events)) return incoming;
    const ref = incoming.countriesRef;
    if (!Array.isArray(ref) || !ref.length) return incoming; // older file, nothing to map with
    const senderName = {}; ref.forEach((c) => { if (c && c.id) senderName[c.id] = c.name || ""; });
    const local = S.state.data.settings.countries = S.state.data.settings.countries || [];
    const byName = {}; local.forEach((c) => { byName[(c.name || "").trim().toLowerCase()] = c.id; });
    const mapId = (id) => {
      if (!(id in senderName)) return id;           // sender did not describe this id; keep as-is
      const nm = senderName[id]; const key = (nm || "").trim().toLowerCase();
      if (!key) return id;
      if (byName[key]) return byName[key];          // we already have this country
      const nc = { id: API.uid(), name: nm };       // create it locally so the tag resolves
      local.push(nc); byName[key] = nc.id;
      return nc.id;
    };
    incoming.events.forEach((ev) => { if (Array.isArray(ev.countryIds)) ev.countryIds = ev.countryIds.map(mapId); });
    return incoming;
  }

  function mergeBudgetEventsFile(incoming, name) {
    reconcileIncomingCountries(incoming);
    const diff = API.diffBudgetEvents(S.state.data, incoming);
    const ev = diff.events, ac = diff.activities;
    const section = (title, items, chkClass) => {
      if (!items.length) return "";
      return `<h3 style="margin:12px 0 4px; font-size:14px">${title} (${items.length})</h3>` +
        `<div style="max-height:150px; overflow:auto; border:1px solid #eef0f3; border-radius:6px; padding:6px 8px;">` +
        items.map((it) => chkClass
          ? `<label style="display:flex; align-items:center; gap:8px; font-size:13px; padding:2px 0;"><input type="checkbox" class="${chkClass}" value="${it.id}" /> ${S.escapeHtml(it.name)}</label>`
          : `<div style="font-size:13px; padding:2px 0; color:#374151;">${S.escapeHtml(it.name)}</div>`
        ).join("") + `</div>`;
    };
    const warnHtml = diff.warnings.length
      ? `<div class="error" style="margin:10px 0; padding:8px; border-radius:6px;">${diff.warnings.length} incoming item(s) reference an entity or owner you do not have. If so, load the latest setup file first. <details><summary>show</summary>${diff.warnings.slice(0, 40).map((w) => `<div class="small">${S.escapeHtml(w)}</div>`).join("")}</details></div>`
      : "";
    const m = S.openModal(`
      <h2>Merge budget &amp; events</h2>
      <p class="muted small">From "${S.escapeHtml(name)}". New items are added and changed items are updated. Missing items are kept unless you tick them to delete.</p>
      <div class="kpi-row" style="grid-template-columns:repeat(2,1fr)">
        <div class="kpi"><div class="label">Events</div><div class="value" style="font-size:14px">${ev.adds.length} new · ${ev.updates.length} updated · ${ev.missing.length} missing</div></div>
        <div class="kpi"><div class="label">Budget lines</div><div class="value" style="font-size:14px">${ac.adds.length} new · ${ac.updates.length} updated · ${ac.missing.length} missing</div></div>
      </div>
      ${warnHtml}
      ${section("New events", ev.adds, "")}
      ${section("Updated events", ev.updates, "")}
      ${section("Events missing here — tick to delete, otherwise kept", ev.missing, "del-ev")}
      ${section("New budget lines", ac.adds, "")}
      ${section("Updated budget lines", ac.updates, "")}
      ${section("Budget lines missing here — tick to delete, otherwise kept", ac.missing, "del-ac")}
      ${(ev.updates.length + ac.updates.length) ? `<label style="display:flex; align-items:center; gap:8px; margin-top:10px; font-size:13px;"><input type="checkbox" id="mg-updates" checked /> Apply the updates above (take the incoming version). Uncheck if this file looks like it predates a structure change.</label>` : ""}
      <div class="actions" style="margin-top:14px">
        <button class="secondary" id="mg-cancel">Cancel</button>
        <button class="primary" id="mg-apply">Apply merge</button>
      </div>
    `, { closeOnBackdrop: false });
    m.querySelector("#mg-cancel").onclick = S.closeModal;
    m.querySelector("#mg-apply").onclick = () => {
      const delEv = new Set([...m.querySelectorAll(".del-ev:checked")].map((c) => c.value));
      const delAc = new Set([...m.querySelectorAll(".del-ac:checked")].map((c) => c.value));
      const upToggle = m.querySelector("#mg-updates");
      const skipUpdates = upToggle ? !upToggle.checked : false;
      S.state.data = API.applyBudgetEventsMerge(S.state.data, incoming, { delEventIds: delEv, delActIds: delAc, skipUpdates });
      S.scheduleSave(); S.notify(); S.closeModal();
      const added = ev.adds.length + ac.adds.length;
      const upd = skipUpdates ? 0 : (ev.updates.length + ac.updates.length);
      const del = delEv.size + delAc.size;
      S.toast(`Merged: ${added} added, ${upd} updated, ${del} deleted`, "success");
    };
  }

  // Pull the shared budget & events and apply adds + updates automatically (no confirm screen),
  // then show a summary of what changed. Local-only items are kept, never auto-deleted.
  async function refreshFromShared(opts) {
    opts = opts || {};
    if (!SH || !SH.supported()) return;
    const dir = await SH.savedFolder();
    if (!dir) { if (!opts.auto) S.toast("Choose the shared folder first (Settings > Data & sharing).", "error"); return; }
    const permOk = opts.auto ? await SH.hasPerm(dir, "readwrite") : await SH.ensurePerm(dir, "readwrite");
    if (!permOk) { if (!opts.auto) S.toast("Access to the shared folder was not granted.", "error"); return; }
    let incoming;
    try { incoming = await readSharedBE(dir); }
    catch (e) { if (!opts.auto) S.toast("Could not read the shared file: " + e.message, "error"); return; }
    if (!incoming) { if (!opts.auto) S.toast("No budget & events file in the shared folder yet.", "error"); return; }
    reconcileIncomingCountries(incoming);

    const diff = API.diffBudgetEvents(S.state.data, incoming);
    const addN = diff.events.adds.length + diff.activities.adds.length;
    const updN = diff.events.updates.length + diff.activities.updates.length;
    if (addN === 0 && updN === 0) {
      if (incoming.meta && incoming.meta.exportedAt) localStorage.setItem(SEEN_KEY, incoming.meta.exportedAt);
      markPublishBaseline(); updateSharedHeader();
      if (!opts.auto) S.toast("You are up to date with the shared data.", "success");
      return;
    }
    S.state.data = API.applyBudgetEventsMerge(S.state.data, incoming, {});
    if (incoming.meta && incoming.meta.exportedAt) localStorage.setItem(SEEN_KEY, incoming.meta.exportedAt);
    markPublishBaseline(); updateSharedHeader();
    S.scheduleSave(); S.notify();
    showRefreshSummary(diff, incoming);
  }

  function showRefreshSummary(diff, incoming) {
    const by = (incoming.meta && incoming.meta.exportedBy) || "a teammate";
    const when = incoming.meta && incoming.meta.exportedAt ? new Date(incoming.meta.exportedAt).toLocaleString("en-GB") : "";
    const evA = diff.events.adds.length, evU = diff.events.updates.length;
    const acA = diff.activities.adds.length, acU = diff.activities.updates.length;
    const missN = diff.events.missing.length + diff.activities.missing.length;
    const names = (arr) => arr.slice(0, 50).map((x) => `<div class="small" style="color:#374151">${S.escapeHtml(x.name)}</div>`).join("");
    const block = (title, arr) => arr.length ? `<details style="margin:4px 0"><summary style="cursor:pointer">${title} (${arr.length})</summary>${names(arr)}</details>` : "";
    const missNote = missN ? `<p class="muted small" style="margin-top:10px">${missN} item(s) exist only on your copy and were kept (not deleted). To sync deletions, use Settings &rarr; Data &amp; sharing &rarr; Pull budget &amp; events.</p>` : "";
    const m = S.openModal(`
      <h2>Shared data updated</h2>
      <p class="muted small">From ${S.escapeHtml(by)}${when ? " on " + S.escapeHtml(when) : ""}. Applied automatically.</p>
      <div class="kpi-row" style="grid-template-columns:repeat(2,1fr)">
        <div class="kpi"><div class="label">Events</div><div class="value" style="font-size:14px">${evA} new &middot; ${evU} updated</div></div>
        <div class="kpi"><div class="label">Budget lines</div><div class="value" style="font-size:14px">${acA} new &middot; ${acU} updated</div></div>
      </div>
      ${block("New events", diff.events.adds)}
      ${block("Updated events", diff.events.updates)}
      ${block("New budget lines", diff.activities.adds)}
      ${block("Updated budget lines", diff.activities.updates)}
      ${missNote}
      <div class="actions"><button class="primary" id="rs-ok">Got it</button></div>
    `);
    m.querySelector("#rs-ok").onclick = S.closeModal;
  }

  // Show/hide the header Refresh button and, if the browser already has access, auto-check on open.
  async function initSharedRefresh() {
    updateSharedHeader();
    const btn = document.getElementById("refresh-btn");
    if (!btn) return;
    if (!SH || !SH.supported()) { btn.classList.add("hidden"); return; }
    const dir = await SH.savedFolder();
    if (!dir) { btn.classList.add("hidden"); return; }
    btn.classList.remove("hidden");
    btn.onclick = async () => { await syncPasswords({ auto: false }); await checkSetup({ auto: false }); await refreshFromShared({ auto: false }); };
    // On open: check the setup first (new entities or years may be needed by the data), then
    // pull budget & events.
    if (await SH.hasPerm(dir, "readwrite")) {
      await syncPasswords({ auto: true });
      await checkSetup({ auto: true });
      await refreshFromShared({ auto: true });
    }
  }

  // ---- Setup (structure) sync check: v5.1 ----
  // The setup file (entities, yearly budgets, codes, users...) is published separately from the
  // budget & events file. We remember, per browser, a signature of the shared setup as of the
  // last pull or publish (the baseline). Comparing local, shared and baseline tells us whether the
  // shared setup is newer, whether you have unpublished setup changes, or both.
  // Canonical signature of a settings object: sorted keys, empty values dropped, countries skipped
  // (countries are auto-created when pulling budget & events, so they are not a real edit).
  const PW_FIELDS = { pwSalt: 1, pwHash: 1, mustChangePassword: 1, pwChangedAt: 1 };
  function setupSig(settings) {
    const norm = (v) => {
      if (Array.isArray(v)) { const a = v.map(norm).filter((x) => x !== undefined); return a.length ? a : undefined; }
      if (v && typeof v === "object") {
        const o = {};
        Object.keys(v).sort().forEach((k) => {
          if (PW_FIELDS[k]) return; // passwords sync through their own file
          const n = norm(v[k]); if (n !== undefined) o[k] = n;
        });
        return Object.keys(o).length ? o : undefined;
      }
      if (v === null || v === undefined || v === "") return undefined;
      return v;
    };
    const s = {};
    Object.keys(settings || {}).forEach((k) => { if (k !== "countries") s[k] = settings[k]; });
    return JSON.stringify(norm(s) || {});
  }
  function markSetupSynced(fileObj) {
    try {
      localStorage.setItem(SETUP_BASE_KEY, setupSig(fileObj.settings));
      if (fileObj.meta && fileObj.meta.exportedAt) localStorage.setItem(SETUP_SEEN_KEY, fileObj.meta.exportedAt);
    } catch (e) {}
    updateSharedHeader();
    if (window.MB_APP && window.MB_APP.refreshSetupStatus) setTimeout(() => window.MB_APP.refreshSetupStatus(), 0);
  }
  // Compare the local setup with the shared one. Returns one of:
  // "same", "remote-newer", "local-changes", "both-changed", "unknown" (differs, no sync history).
  function setupStatus(remote) {
    const localSig = setupSig(S.state.data.settings);
    const remoteSig = setupSig(remote.settings);
    if (localSig === remoteSig) return "same";
    const base = localStorage.getItem(SETUP_BASE_KEY);
    if (base === null) return "unknown";
    const remoteChanged = remoteSig !== base;
    const localChanged = localSig !== base;
    if (remoteChanged && localChanged) return "both-changed";
    if (remoteChanged) return "remote-newer";
    if (localChanged) return "local-changes";
    return "same";
  }
  // Short, human summary of a setup: entity count and years with a yearly budget.
  function setupSummary(settings) {
    const s = settings || {};
    const ents = (s.entities || []).length;
    const years = Object.keys(s.yearlyBudgets || {}).filter((y) => Object.keys(s.yearlyBudgets[y] || {}).length).sort();
    return `${ents} entities, budget years ${years.length ? years.join(", ") : "none"}`;
  }
  async function publishSetupTo(dir) {
    const obj = API.stampExport(API.pickSetup(S.state.data), shareUserName(), "setup");
    await SH.writeJson(dir, SETUP_FILE, obj);
    markSetupSynced(obj);
    return obj;
  }
  function pullSetupFrom(remote) {
    S.state.data = API.replaceSetup(S.state.data, remote);
    markSetupSynced(remote);
    S.scheduleSave(); S.notify();
    syncPasswords({ auto: true, quiet: true });
  }

  // ---- Budget & events: one shared file per year ----
  // Rows are filed by year: budget lines by their date, events by their start date. Rows without a
  // date go to the "undated" file. Publishing rewrites only the year files whose rows changed, so
  // people working on different years do not write the same file. The old single file
  // (marketing-hub-budget-events.json) is still read if an older app version wrote to it, and is
  // replaced by an empty marker once the per-year files are in use.
  const BE_PREFIX = "marketing-hub-budget-events-";
  const BE_RE = /^marketing-hub-budget-events-(\d{4}|undated)\.json$/;
  function rowYear(r) {
    const y = String((r && (r.start || r.date)) || "").slice(0, 4);
    return /^\d{4}$/.test(y) ? y : "undated";
  }
  function yearFileName(y) { return BE_PREFIX + y + ".json"; }
  // Sort rows by id and stringify, to tell whether a year file's content really changed.
  function rowsSig(acts, evs) {
    const byId = (a, b) => String(a.id).localeCompare(String(b.id));
    return JSON.stringify({ a: [...(acts || [])].sort(byId), e: [...(evs || [])].sort(byId) });
  }
  function isLegacyActive(obj) {
    return !!(obj && !(obj.meta && obj.meta.splitInto) &&
      ((obj.activities || []).length || (obj.events || []).length));
  }
  // Read every budget & events file in the folder and combine them into one dataset, shaped like
  // a single file ({ events, activities, countriesRef, meta }) so the existing merge logic works
  // unchanged. Returns null when there is no budget & events data at all.
  async function readSharedBE(dir) {
    const names = (await SH.listFiles(dir)).filter((n) => BE_RE.test(n));
    const files = {};
    for (const name of names) {
      const obj = await SH.readJson(dir, name);
      if (obj) files[name.match(BE_RE)[1]] = { name, obj };
    }
    const legacy = await SH.readJson(dir, DATA_FILE);
    const legacyActive = isLegacyActive(legacy);
    if (!Object.keys(files).length && !legacyActive) return null;

    const rows = { activities: {}, events: {} };   // id -> { row, stamp }
    const countries = {};
    let stamp = "", by = "";
    // Per row, the most recently edited version wins (its own updatedAt, else createdAt). A file
    // written by an older app version holds that person's whole copy, including stale rows, so a
    // file's publish date alone must not decide.
    const rowStamp = (r) => String(r.updatedAt || r.createdAt || "");
    const take = (obj) => {
      const st = (obj.meta && obj.meta.exportedAt) || "";
      if (st > stamp) { stamp = st; by = (obj.meta && obj.meta.exportedBy) || ""; }
      ["activities", "events"].forEach((k) => (obj[k] || []).forEach((r) => {
        const cur = rows[k][r.id];
        if (!cur || rowStamp(r) > rowStamp(cur.row)) rows[k][r.id] = { row: r };
      }));
      (obj.countriesRef || []).forEach((c) => { if (c && c.id) countries[c.id] = c; });
    };
    Object.values(files).forEach((f) => take(f.obj));
    // Rows an older app version published to the old single file: added when missing, and they
    // replace a year file's row only when that row was edited more recently.
    if (legacyActive) take(legacy);
    return {
      version: 1,
      meta: { exportedAt: stamp, exportedBy: by, exportKind: "budget-events" },
      activities: Object.values(rows.activities).map((x) => x.row),
      events: Object.values(rows.events).map((x) => x.row),
      countriesRef: Object.values(countries),
      _files: files, _legacy: legacy, _legacyActive: legacyActive,
    };
  }
  // Write the given budget lines and events as per-year files. Only years whose rows differ from
  // what is in the shared folder are written. Returns the newest exportedAt written (or "").
  async function writeSharedBE(dir, acts, evs, remote) {
    const groups = {};
    const g = (y) => (groups[y] = groups[y] || { activities: [], events: [] });
    (acts || []).forEach((r) => g(rowYear(r)).activities.push(r));
    (evs || []).forEach((r) => g(rowYear(r)).events.push(r));
    const existing = (remote && remote._files) || {};
    const years = new Set([...Object.keys(groups), ...Object.keys(existing)]);
    let newest = "";
    const written = [];
    for (const y of [...years].sort()) {
      const grp = groups[y] || { activities: [], events: [] };
      const ex = existing[y];
      if (ex && rowsSig(ex.obj.activities, ex.obj.events) === rowsSig(grp.activities, grp.events)) continue;
      if (!ex && !grp.activities.length && !grp.events.length) continue;
      const obj = API.stampExport(API.pickBudgetEvents({ version: S.state.data.version, meta: S.state.data.meta,
        settings: S.state.data.settings, activities: grp.activities, events: grp.events }), shareUserName(), "budget-events");
      obj.meta.year = y;
      await SH.writeJson(dir, yearFileName(y), obj);
      written.push(y);
      if (obj.meta.exportedAt > newest) newest = obj.meta.exportedAt;
    }
    // Retire the old single file: an empty marker, so older versions pull nothing from it.
    if (!remote || !remote._legacy || !(remote._legacy.meta && remote._legacy.meta.splitInto) || remote._legacyActive) {
      const legacyExists = remote ? !!remote._legacy : !!(await SH.readJson(dir, DATA_FILE));
      if (legacyExists) {
        await SH.writeJson(dir, DATA_FILE, { version: 1, events: [], activities: [], meta: {
          exportKind: "budget-events", splitInto: "per-year", exportedAt: new Date().toISOString(), exportedBy: shareUserName(),
          note: "Budget & events now live in one file per year (marketing-hub-budget-events-YYYY.json). This file is kept empty on purpose." } });
      }
    }
    return { newest, written };
  }

  // ---- First connection from the login screen ----
  // Pick the shared folder and load everything from it: the setup (users, entities, budgets...),
  // the budget & events (merged: nothing local is removed) and the passwords. Returns null when
  // cancelled, { error } on a problem, or a summary. The caller saves and reloads the login screen.
  async function connectShared() {
    if (!SH || !SH.supported()) return { error: "This browser cannot use a shared folder. Use Chrome or Edge." };
    let dir;
    try { dir = await SH.chooseFolder(); }
    catch (e) { return (e && e.name === "AbortError") ? null : { error: "Could not open the folder: " + e.message }; }
    let setup, data;
    try {
      setup = await SH.readJson(dir, SETUP_FILE);
      data = await readSharedBE(dir);
    } catch (e) { return { error: "Could not read the shared files: " + e.message }; }
    if (!setup && !data) {
      await SH.forgetFolder();
      return { error: `"${dir.name}" has no Marketing Hub files (${SETUP_FILE}, ${BE_PREFIX}YYYY.json). Pick the team's shared folder.` };
    }
    const cur = S.state.data;
    const hasLocal = ((cur.settings.users || []).length) || (cur.activities || []).length || (cur.events || []).length;
    if (hasLocal) {
      const ok = await S.confirmDialog(`This computer already has data. Load the team's setup from "${dir.name}" and merge in the shared budget & events? Your own budget lines and events are kept. Export a backup first if unsure.`);
      if (!ok) return null;
    }
    if (setup) {
      S.state.data = API.replaceSetup(S.state.data, setup);
      markSetupSynced(setup);
    }
    if (data) {
      reconcileIncomingCountries(data);
      S.state.data = API.applyBudgetEventsMerge(S.state.data, data, {});
      if (data.meta && data.meta.exportedAt) localStorage.setItem(SEEN_KEY, data.meta.exportedAt);
      markPublishBaseline();
    }
    await syncPasswords({ auto: true });
    updateSharedHeader();
    return { folder: dir.name, setup: !!setup, data: !!data };
  }

  // ---- Setup publish status (shown in the Settings sub-menu) ----
  // Is the setup on this computer different from what was last published or pulled?
  // Returns { show, noFolder, dirty } where dirty is true, false or null (unknown: no access yet).
  async function setupPublishState() {
    if (!SH || !SH.supported() || !canPushSetup()) return { show: false };
    const dir = await SH.savedFolder();
    if (!dir) return { show: true, noFolder: true };
    const localSig = setupSig(S.state.data.settings);
    const base = localStorage.getItem(SETUP_BASE_KEY);
    if (base !== null) return { show: true, dirty: localSig !== base };
    // Never synced on this computer: compare with the shared file if we already have access.
    if (await SH.hasPerm(dir, "readwrite")) {
      let remote = null;
      try { remote = await SH.readJson(dir, SETUP_FILE); } catch (e) {}
      if (!remote) return { show: true, dirty: true };
      if (setupSig(remote.settings) === localSig) { markSetupSynced(remote); return { show: true, dirty: false }; }
      return { show: true, dirty: true };
    }
    return { show: true, dirty: null };
  }
  // Publish the setup, with a clear warning if someone else published since your last sync.
  async function publishSetupFlow() {
    if (!canPushSetup()) { S.toast("Only admins can publish the setup.", "error"); return false; }
    // Include any Settings edits that are not saved yet.
    if (window.MB_SETTINGS && window.MB_SETTINGS.isDirty && window.MB_SETTINGS.isDirty()) window.MB_SETTINGS.saveAll();
    const dir = await shareDir();
    if (!dir) return false;
    let remote = null;
    try { remote = await SH.readJson(dir, SETUP_FILE); } catch (e) {}
    const st = remote ? setupStatus(remote) : "local-changes";
    if (st === "same") {
      markSetupSynced(remote);
      S.toast("The shared setup is already up to date.", "success");
      if (window.MB_APP && window.MB_APP.refreshSetupStatus) window.MB_APP.refreshSetupStatus();
      return true;
    }
    const who = (remote && remote.meta && remote.meta.exportedBy) || "a teammate";
    const when = remote && remote.meta && remote.meta.exportedAt ? new Date(remote.meta.exportedAt).toLocaleString("en-GB") : "";
    const msg = (st === "both-changed" || st === "remote-newer" || st === "unknown")
      ? `Careful: the shared setup was published by ${who}${when ? " on " + when : ""}, and it differs from what this computer last synced. Publishing replaces it with your version for everyone. Continue?`
      : "Publish your setup to the shared folder? Everyone gets it the next time they open the app. Budget lines and events are not touched.";
    if (!(await S.confirmDialog(msg))) return false;
    try {
      await publishSetupTo(dir);
      S.toast("Setup published to the shared folder.", "success");
    } catch (e) { S.toast("Could not publish setup: " + e.message, "error"); return false; }
    if (window.MB_APP && window.MB_APP.refreshSetupStatus) window.MB_APP.refreshSetupStatus();
    return true;
  }

  // ---- Shared passwords file ----
  // { version, meta, users: { <userId>: { name, pwSalt, pwHash, mustChangePassword, pwChangedAt,
  // pwChangedBy } } }. Only hashes are stored, never a password. Per user, the newest change wins.
  function pwEntry(u) {
    return { name: u.name || "", pwSalt: u.pwSalt, pwHash: u.pwHash, mustChangePassword: !!u.mustChangePassword,
             pwChangedAt: u.pwChangedAt, pwChangedBy: shareUserName() || u.name || "" };
  }
  async function pwDir(auto) {
    if (!SH || !SH.supported()) return null;
    const dir = await SH.savedFolder();
    if (!dir) return null;
    const ok = auto ? await SH.hasPerm(dir, "readwrite") : await SH.ensurePerm(dir, "readwrite");
    return ok ? dir : null;
  }
  // Two-way sync: take newer passwords from the file, and write back any that are newer here.
  // Returns the number of local passwords that were updated from the file.
  async function syncPasswords(opts) {
    opts = opts || {};
    const dir = await pwDir(opts.auto);
    if (!dir) return 0;
    let file;
    try { file = (await SH.readJson(dir, PW_FILE)) || { version: 1, users: {} }; }
    catch (e) { if (!opts.auto && !opts.quiet) S.toast("Could not read the shared passwords: " + e.message, "error"); return 0; }
    file.users = file.users || {};
    const byName = {};
    Object.entries(file.users).forEach(([id, e]) => { if (e && e.name) byName[e.name.trim().toLowerCase()] = id; });
    let pulled = 0, pushed = 0;
    (S.state.data.settings.users || []).forEach((u) => {
      const id = file.users[u.id] ? u.id : byName[(u.name || "").trim().toLowerCase()];
      const e = id ? file.users[id] : null;
      const mine = u.pwChangedAt || "";
      if (e && e.pwHash && (e.pwChangedAt || "") > mine) {
        u.pwSalt = e.pwSalt; u.pwHash = e.pwHash; u.mustChangePassword = !!e.mustChangePassword;
        u.pwChangedAt = e.pwChangedAt; pulled++;
      } else if (u.pwHash && mine && (!e || mine > (e.pwChangedAt || ""))) {
        if (id && id !== u.id) delete file.users[id];
        file.users[u.id] = pwEntry(u); pushed++;
      }
    });
    if (pulled) { S.scheduleSave(); S.notify(); }
    if (pushed) {
      file.meta = { exportedAt: new Date().toISOString(), exportedBy: shareUserName() };
      try { await SH.writeJson(dir, PW_FILE, file); } catch (e) { console.warn("Could not write passwords", e); }
    }
    return pulled;
  }
  // Called right after a password is set or reset on this computer.
  async function pushPassword(user) {
    if (!SH || !SH.supported() || !(await SH.savedFolder())) return false; // no shared folder: local only
    const dir = await pwDir(false);
    if (!dir) { S.toast("Password saved on this computer only (no access to the shared folder).", "error"); return false; }
    try {
      const file = (await SH.readJson(dir, PW_FILE)) || { version: 1, users: {} };
      file.users = file.users || {};
      const cur = file.users[user.id];
      if (cur && (cur.pwChangedAt || "") > (user.pwChangedAt || "")) return false; // a newer one exists
      file.users[user.id] = pwEntry(user);
      file.meta = { exportedAt: new Date().toISOString(), exportedBy: shareUserName() || user.name || "" };
      await SH.writeJson(dir, PW_FILE, file);
      return true;
    } catch (e) {
      S.toast("Password saved on this computer only: " + e.message, "error");
      return false;
    }
  }
  // Check the shared setup and, if something needs attention, ask what to do. Resolves once the
  // user has answered (or right away when nothing is needed), so callers can chain the budget &
  // events check after it. opts.auto: on app open (quiet when all is well).
  async function checkSetup(opts) {
    opts = opts || {};
    if (!SH || !SH.supported()) return;
    const dir = await SH.savedFolder();
    if (!dir) return;
    const permOk = opts.auto ? await SH.hasPerm(dir, "readwrite") : await SH.ensurePerm(dir, "readwrite");
    if (!permOk) return;
    let remote;
    try { remote = await SH.readJson(dir, SETUP_FILE); }
    catch (e) { if (!opts.auto) S.toast("Could not read the shared setup file: " + e.message, "error"); return; }
    const admin = canPushSetup();
    if (!remote) {
      if (admin && !opts.auto) S.toast("No setup file in the shared folder yet. Publish it from Settings > Data & sharing.", "error");
      return;
    }
    const status = setupStatus(remote);
    if (status === "same") { markSetupSynced(remote); return; }
    if (status === "local-changes" && !admin) return; // only admins can publish the setup

    const fmt = (iso) => iso ? new Date(iso).toLocaleString("en-GB") : "unknown date";
    const who = (remote.meta && remote.meta.exportedBy) || "a teammate";
    const when = fmt(remote.meta && remote.meta.exportedAt);
    const compare = `
      <div class="kpi-row" style="grid-template-columns:repeat(2,1fr); margin:10px 0">
        <div class="kpi"><div class="label">Shared setup (${S.escapeHtml(who)}, ${S.escapeHtml(when)})</div><div class="value" style="font-size:14px">${S.escapeHtml(setupSummary(remote.settings))}</div></div>
        <div class="kpi"><div class="label">Your setup on this computer</div><div class="value" style="font-size:14px">${S.escapeHtml(setupSummary(S.state.data.settings))}</div></div>
      </div>`;
    const keepNote = `<p class="muted small">Your budget lines and events are never touched by this choice.</p>`;
    let html;
    if (status === "remote-newer") {
      html = `<h2>A newer setup is available</h2>
        <p>${S.escapeHtml(who)} published a new setup (entities, yearly budgets, codes, users) on ${S.escapeHtml(when)}.</p>
        ${compare}${keepNote}
        <div class="actions"><button class="secondary" id="su-later">Not now</button><button class="primary" id="su-pull">Pull the new setup</button></div>`;
    } else if (status === "local-changes") {
      html = `<h2>Your setup changes are not published</h2>
        <p>You changed the setup on this computer (for example entities, yearly budgets or codes), but the shared folder still has the older version. Teammates will not see your changes until you publish.</p>
        ${compare}${keepNote}
        <div class="actions"><button class="secondary" id="su-later">Later</button><button class="primary" id="su-publish">Publish setup</button></div>`;
    } else {
      html = `<h2>Your setup is different from the shared setup</h2>
        <p>${status === "both-changed"
          ? "Both your copy and the shared setup have changed since you last synced. Choose which one to keep."
          : "This computer has not synced the setup before, and the two versions differ. Choose which one is right."}</p>
        ${compare}
        <p class="muted small">Using the shared setup replaces yours. ${admin ? "Publishing yours replaces the shared one for everyone." : ""} Your budget lines and events are never touched.</p>
        <div class="actions" style="flex-wrap:wrap; gap:8px">
          <button class="secondary" id="su-later">Decide later</button>
          <button class="${admin ? "secondary" : "primary"}" id="su-pull">Use the shared setup</button>
          ${admin ? `<button class="primary" id="su-publish">Keep mine and publish it</button>` : ""}
        </div>`;
    }
    return new Promise((resolve) => {
      const m = S.openModal(html, { closeOnBackdrop: false });
      const done = () => { S.closeModal(); resolve(); };
      const later = m.querySelector("#su-later"), pull = m.querySelector("#su-pull"), pub = m.querySelector("#su-publish");
      if (later) later.onclick = done;
      if (pull) pull.onclick = () => {
        try { pullSetupFrom(remote); S.toast("Setup updated from the shared folder.", "success"); }
        catch (e) { S.toast("Could not pull the setup: " + e.message, "error"); }
        done();
      };
      if (pub) pub.onclick = async () => {
        try { await publishSetupTo(dir); S.toast("Setup published to the shared folder.", "success"); }
        catch (e) { S.toast("Could not publish setup: " + e.message, "error"); }
        done();
      };
    });
  }


  window.MB_DATA = { render, initSharedRefresh, refreshFromShared, checkSetup, setupPublishState, publishSetupFlow, syncPasswords, pushPassword, connectShared, wirePublishButton, wireCheckButton, checkForShared, budgetEventsDirty, publishBudgetEvents };
})();
