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
  const DATA_FILE = "marketing-hub-budget-events.json";
  const SEEN_KEY = "mb_share_data_seen";
  const BASE_KEY = "mb_share_pub_base"; // signature of budget & events at the last publish/pull
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
    const seen = localStorage.getItem(SEEN_KEY) || "";
    if (!seen) { el.textContent = ""; return; }
    const d = new Date(seen);
    if (isNaN(d)) { el.textContent = ""; return; }
    const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    el.textContent = "Shared file: " + date + " " + time;
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
      const remote = reconcileIncomingCountries(await SH.readJson(dir, DATA_FILE));
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
      const obj = API.stampExport(API.pickBudgetEvents(S.state.data), shareUserName(), "budget-events");
      await SH.writeJson(dir, DATA_FILE, obj);
      localStorage.setItem(SEEN_KEY, obj.meta.exportedAt);
      markPublishBaseline(); updateSharedHeader();
      S.scheduleSave(); S.notify();
      const mine = stats.insA + stats.insE, changed = stats.updA + stats.updE, removed = stats.delA + stats.delE;
      S.toast(`Published & merged. New: ${mine}, changed: ${changed}, removed: ${removed}. Pulled in from teammates: ${stats.fromRemote}.`, "success");
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
      (seen ? ` <span class="muted">&middot; last synced budget &amp; events ${S.escapeHtml(new Date(seen).toLocaleString("en-GB"))}</span>` : "");
    if (folderBtn) folderBtn.textContent = "Change shared folder...";
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
    if (pushSetupBtn) pushSetupBtn.onclick = async () => {
      const dir = await shareDir();
      if (!dir) return;
      const ok = await S.confirmDialog("Publish your setup to the shared folder? It becomes the master that everyone pulls. Their budget lines and events are not touched.");
      if (!ok) return;
      try {
        const obj = API.stampExport(API.pickSetup(S.state.data), shareUserName(), "setup");
        await SH.writeJson(dir, SETUP_FILE, obj);
        S.toast("Setup published to the shared folder.", "success");
      } catch (e) { S.toast("Could not publish setup: " + e.message, "error"); }
    };

    const pullSetupBtn = root.querySelector("#sh-pull-setup");
    if (pullSetupBtn) pullSetupBtn.onclick = async () => {
      const dir = await shareDir();
      if (!dir) return;
      try {
        const incoming = await SH.readJson(dir, SETUP_FILE);
        if (!incoming) return S.toast("No setup file in the shared folder yet.", "error");
        await loadSetupFile(incoming, SETUP_FILE);
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
        const incoming = await SH.readJson(dir, DATA_FILE);
        if (!incoming) return S.toast("No budget & events file in the shared folder yet.", "error");
        if (incoming.meta && incoming.meta.exportedAt) localStorage.setItem(SEEN_KEY, incoming.meta.exportedAt);
        await refreshShareStatus(root);
        mergeBudgetEventsFile(incoming, DATA_FILE);
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
    if (!ok) return;
    S.state.data = API.replaceSetup(S.state.data, incoming);
    S.scheduleSave(); S.notify();
    S.toast("Setup replaced from file", "success");
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
    if (!dir) { if (!opts.auto) S.toast("Choose the shared folder first (Data tab).", "error"); return; }
    const permOk = opts.auto ? await SH.hasPerm(dir, "readwrite") : await SH.ensurePerm(dir, "readwrite");
    if (!permOk) { if (!opts.auto) S.toast("Access to the shared folder was not granted.", "error"); return; }
    let incoming;
    try { incoming = await SH.readJson(dir, DATA_FILE); }
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
    const missNote = missN ? `<p class="muted small" style="margin-top:10px">${missN} item(s) exist only on your copy and were kept (not deleted). To sync deletions, use Data tab &rarr; Pull budget &amp; events.</p>` : "";
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
    btn.onclick = () => refreshFromShared({ auto: false });
    if (await SH.hasPerm(dir, "readwrite")) refreshFromShared({ auto: true });
  }

  window.MB_DATA = { render, initSharedRefresh, refreshFromShared, wirePublishButton, budgetEventsDirty, publishBudgetEvents };
})();
