// Budget tab: activity list with add/edit/delete
(function () {
  const S = window.MB_STATE;
  const API = window.MB_API;

  const view = {
    year: new Date().getFullYear(),
    quarters: [],
    monthFilter: "",
    scope: { m1: "", cluster: "", entityId: "" },
    svpFilter: "",
    typeFilter: "",
    statusFilter: "",
    ownerFilter: "",
    search: "",
    sortBy: "date",
    sortDir: "asc",
    colFilters: {}, // per-column Excel-style filters: { <key>: { op, value } }
    hiddenCols: loadHidden(),
    colWidths: loadWidths(),
    colOrder: null,   // set right after COLUMNS below (it needs the column list)
    _forUser: null,   // user the default filters were set for (reset on a new login)
    _colsOpen: false, // keep the Columns panel open across a re-render
  };

  // The Budget table columns. key matches the sort key and the cell class (bc-<key>).
  const COLUMNS = [
    { key: "actions", label: "", def: 64 },
    { key: "date", label: "Date", def: 95 },
    { key: "name", label: "Name", def: 240 },
    { key: "entity", label: "Entity", def: 150 },
    { key: "code", label: "Budget code", def: 120 },
    { key: "svp", label: "SVP", def: 120 },
    { key: "type", label: "Type", def: 130 },
    { key: "status", label: "Status", def: 110 },
    { key: "owner", label: "Owner", def: 120 },
    { key: "vendor", label: "Vendor", def: 120 },
    { key: "po", label: "PO #", def: 100 },
    { key: "fG", label: "Forecast gross", def: 120, num: true },
    { key: "fP", label: "Forecast partner", def: 120, num: true },
    { key: "fN", label: "Forecast net", def: 120, num: true },
    { key: "aG", label: "Actual gross", def: 120, num: true },
    { key: "aP", label: "Actual partner", def: 120, num: true },
    { key: "aN", label: "Actual net", def: 120, num: true },
    { key: "createdBy", label: "Created by", def: 130 },
    { key: "createdAt", label: "Created on", def: 150 },
    { key: "updatedBy", label: "Updated by", def: 130 },
    { key: "updatedAt", label: "Updated on", def: 150 },
  ];
  view.colOrder = loadOrder();

  function loadHidden() {
    const def = ["createdBy", "createdAt", "updatedBy", "updatedAt"]; // audit columns hidden by default
    const raw = localStorage.getItem("mb_budget_hidden");
    if (raw === null) return new Set(def);
    try { return new Set(JSON.parse(raw)); } catch (e) { return new Set(def); }
  }
  // Column order, per browser. Unknown keys are dropped and new columns are added at the end, so
  // a saved order keeps working when columns are added later. "actions" always stays first.
  function loadOrder() {
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem("mb_budget_order") || "[]") || []; } catch (e) { saved = []; }
    return normalizeOrder(saved);
  }
  function normalizeOrder(keys) {
    const all = COLUMN_KEYS();
    const out = (keys || []).filter((k) => all.includes(k) && k !== "actions");
    all.forEach((k) => { if (k !== "actions" && !out.includes(k)) out.push(k); });
    return ["actions", ...out];
  }
  function COLUMN_KEYS() { return COLUMNS.map((c) => c.key); }
  function orderedCols() {
    const byKey = Object.fromEntries(COLUMNS.map((c) => [c.key, c]));
    return view.colOrder.map((k) => byKey[k]).filter(Boolean);
  }
  function loadWidths() { try { return JSON.parse(localStorage.getItem("mb_budget_widths") || "{}") || {}; } catch (e) { return {}; } }
  function saveColPrefs() {
    try {
      localStorage.setItem("mb_budget_hidden", JSON.stringify([...view.hiddenCols]));
      localStorage.setItem("mb_budget_widths", JSON.stringify(view.colWidths));
      localStorage.setItem("mb_budget_order", JSON.stringify(view.colOrder));
    } catch (e) {}
  }
  function colWidth(c) { return view.colWidths[c.key] || c.def; }
  // Inject the per-column widths and which columns are hidden, plus the fixed table layout.
  function applyColStyles() {
    let total = 0, rules = "";
    COLUMNS.forEach((c) => {
      const hidden = view.hiddenCols.has(c.key);
      rules += `#activities-table .bc-${c.key}{width:${colWidth(c)}px;${hidden ? "display:none;" : ""}}`;
      if (!hidden) total += colWidth(c);
    });
    const css = `#activities-table{table-layout:fixed;width:${Math.max(total, 100)}px;min-width:100%;}` +
      `#activities-table th,#activities-table td{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}` +
      `#activities-table th{position:relative;}` +
      `#activities-table th .col-resize{position:absolute;right:0;top:0;width:8px;height:100%;cursor:col-resize;z-index:3;}` +
      rules;
    let st = document.getElementById("bc-style");
    if (!st) { st = document.createElement("style"); st.id = "bc-style"; document.head.appendChild(st); }
    st.textContent = css;
  }

  // Label for the entity filter: append the entity's budget code (for the selected year) in brackets.
  function entityFilterLabel(e) {
    const bc = ((S.state.data.settings.budgetCodes || {})[view.year]) || {};
    const code = bc[e.id];
    return code ? `${e.name} (${code})` : e.name;
  }

  function render() {
    const root = document.getElementById("tab-budget");
    const data = S.state.data;
    if (!data) { root.innerHTML = ""; return; }

    // On a new login, open on the user's home cluster (set in Users). They can still pick another.
    if (view._forUser !== S.state.currentUserId) {
      view._forUser = S.state.currentUserId;
      const u = S.state.currentUserId ? S.userById(S.state.currentUserId) : null;
      const hc = (u && u.homeCluster) || "";
      const known = S.clusterList ? S.clusterList("").includes(hc) : !!hc;
      view.scope.m1 = ""; view.scope.entityId = "";
      view.scope.cluster = known ? hc : "";
    }

    const years = uniqueYears(data.activities);
    if (!years.includes(view.year)) years.unshift(view.year);

    root.innerHTML = `
      <div class="filter-bar">
        <div>
          <label>Year</label>
          <select id="f-year">${years.sort().map(y => `<option ${y===view.year?"selected":""} value="${y}">${y}</option>`).join("")}</select>
        </div>
        <div>
          <label>Quarters</label>
          ${S.quarterChecks("f", view.quarters)}
        </div>
        <div>
          <label>Month</label>
          <select id="f-month">${S.monthOptions(view.monthFilter)}</select>
        </div>
        ${S.scopeFilterHtml("f", view.scope, entityFilterLabel, view.year)}
        <div class="grow">
          <label>Search</label>
          <input id="f-search" type="text" value="${S.escapeHtml(view.search)}" placeholder="Name, vendor, PO, notes" />
        </div>
        ${Object.keys(view.colFilters || {}).length ? `<div><label>&nbsp;</label><button id="bc-clear-filters" class="secondary" type="button" title="Remove all column filters">Clear filters (${Object.keys(view.colFilters).length})</button></div>` : ""}
        <div><label>&nbsp;</label><span class="muted small" style="padding-top:8px; display:inline-block">Tip: click a column header to sort or filter.</span></div>
        <div style="position:relative">
          <label>&nbsp;</label>
          <button id="bc-cols-btn" class="secondary" type="button">Columns</button>
          <div id="bc-cols-panel" style="display:none; position:absolute; right:0; top:100%; z-index:50; background:#fff; border:1px solid #d1d5db; border-radius:8px; padding:10px; box-shadow:0 6px 18px rgba(0,0,0,.14); max-height:75vh; overflow:auto; min-width:260px;">
            <div class="muted small" style="margin-bottom:6px">Show and order columns (drag, or use the arrows)</div>
            ${orderedCols().filter(c => c.key !== "actions").map((c, i, arr) => `<div class="bc-col-row" draggable="true" data-key="${c.key}" style="display:flex;align-items:center;gap:6px;font-size:13px;padding:2px 0;cursor:grab;">
              <span class="muted" title="Drag to move" style="user-select:none">&#8942;&#8942;</span>
              <label style="display:flex;align-items:center;gap:8px;flex:1;margin:0;cursor:pointer;"><input type="checkbox" class="bc-col-chk" value="${c.key}" ${view.hiddenCols.has(c.key) ? "" : "checked"} /> ${S.escapeHtml(c.label)}</label>
              <button type="button" class="icon bc-col-up" data-key="${c.key}" title="Move left" ${i === 0 ? "disabled" : ""} style="padding:0 5px">&#9650;</button>
              <button type="button" class="icon bc-col-down" data-key="${c.key}" title="Move right" ${i === arr.length - 1 ? "disabled" : ""} style="padding:0 5px">&#9660;</button>
            </div>`).join("")}
            <div style="margin-top:8px; border-top:1px solid #eef0f3; padding-top:6px"><button type="button" class="link" id="bc-col-reset" style="padding:0">Reset column order</button></div>
          </div>
        </div>
        <div>
          <label>&nbsp;</label>
          <button id="bud-check" class="secondary" style="display:none" title="Check for updates">Check for updates</button>
        </div>
        <div>
          <label>&nbsp;</label>
          <button id="bud-publish" class="primary" style="display:none; background:#0a7d33;" title="Publish changes">Publish changes</button>
        </div>
        <div>
          <button id="add-activity" class="primary">+ New budget line</button>
        </div>
      </div>
      <div id="bud-summary"></div>
      <div class="card">
        <div class="table-wrap">
          <table id="activities-table">
            <thead>
              <tr>
                ${orderedCols().map(c => {
                  const sortable = c.key !== "actions";
                  const filtered = sortable && view.colFilters[c.key];
                  return `<th class="bc-${c.key}${c.num ? " num" : ""}" data-col="${c.key}"${sortable ? ` data-sort="${c.key}"` : ""}>${S.escapeHtml(c.label)}${sortable ? sortArrow(c.key) : ""}${filtered ? ' <span title="Filtered" style="color:#0a7d33">&#9873;</span>' : ""}<span class="col-resize"></span></th>`;
                }).join("")}
              </tr>
            </thead>
            <tbody id="activities-body"></tbody>
            <tfoot id="activities-foot"></tfoot>
          </table>
        </div>
      </div>
    `;

    if (window.MB_DATA && window.MB_DATA.wirePublishButton) window.MB_DATA.wirePublishButton(root.querySelector("#bud-publish"));
    if (window.MB_DATA && window.MB_DATA.wireCheckButton) window.MB_DATA.wireCheckButton(root.querySelector("#bud-check"));

    // bind filters
    root.querySelector("#f-year").onchange = (e) => { view.year = +e.target.value; render(); };
    root.querySelectorAll(".f-q").forEach((cb) => { cb.onchange = () => { view.quarters = [...root.querySelectorAll(".f-q:checked")].map((x) => x.value); renderRows(); }; });
    root.querySelector("#f-month").onchange = (e) => { view.monthFilter = e.target.value; renderRows(); };
    S.wireScopeFilter(root, "f", view.scope, renderRows, entityFilterLabel, view.year);
    root.querySelector("#f-search").oninput = (e) => { view.search = e.target.value; renderRows(); };
    const canEditBudget = !window.MB_AUTH || window.MB_AUTH.can("editBudget");
    const addBtn = root.querySelector("#add-activity");
    if (canEditBudget) addBtn.onclick = () => openActivityModal(null);
    else addBtn.style.display = "none";

    // Excel-style headers: click a header to open a sort + filter menu.
    root.querySelectorAll("#activities-table th[data-sort]").forEach((th) => {
      th.style.cursor = "pointer";
      th.onclick = () => openHeaderMenu(th, th.dataset.sort);
    });
    const clearBtn = root.querySelector("#bc-clear-filters");
    if (clearBtn) clearBtn.onclick = () => { view.colFilters = {}; render(); };

    // Columns show/hide
    const colsBtn = root.querySelector("#bc-cols-btn");
    const colsPanel = root.querySelector("#bc-cols-panel");
    if (colsBtn) colsBtn.onclick = (e) => {
      e.stopPropagation();
      view._colsOpen = colsPanel.style.display === "none";
      colsPanel.style.display = view._colsOpen ? "block" : "none";
    };
    if (colsPanel && view._colsOpen) colsPanel.style.display = "block";
    if (colsPanel) colsPanel.onclick = (e) => e.stopPropagation();
    root.querySelectorAll(".bc-col-chk").forEach((chk) => {
      chk.onchange = () => {
        if (chk.checked) view.hiddenCols.delete(chk.value); else view.hiddenCols.add(chk.value);
        applyColStyles(); saveColPrefs(); renderRows();
      };
    });
    // Column order: arrows, drag and drop, reset. Saved per browser.
    const moveCol = (key, toIndex) => {
      const list = view.colOrder.filter((k) => k !== "actions" && k !== key);
      list.splice(Math.max(0, Math.min(toIndex, list.length)), 0, key);
      view.colOrder = normalizeOrder(list);
      saveColPrefs(); view._colsOpen = true; render();
    };
    const posOf = (key) => view.colOrder.filter((k) => k !== "actions").indexOf(key);
    root.querySelectorAll(".bc-col-up").forEach((b) => { b.onclick = () => moveCol(b.dataset.key, posOf(b.dataset.key) - 1); });
    root.querySelectorAll(".bc-col-down").forEach((b) => { b.onclick = () => moveCol(b.dataset.key, posOf(b.dataset.key) + 1); });
    let dragKey = null;
    root.querySelectorAll(".bc-col-row").forEach((row) => {
      row.ondragstart = (e) => { dragKey = row.dataset.key; e.dataTransfer.effectAllowed = "move"; row.style.opacity = "0.4"; };
      row.ondragend = () => { row.style.opacity = ""; };
      row.ondragover = (e) => { e.preventDefault(); row.style.borderTop = "2px solid #ff6a00"; };
      row.ondragleave = () => { row.style.borderTop = ""; };
      row.ondrop = (e) => {
        e.preventDefault(); row.style.borderTop = "";
        if (dragKey && dragKey !== row.dataset.key) {
          const target = posOf(row.dataset.key), from = posOf(dragKey);
          moveCol(dragKey, from < target ? target - 1 : target);
        }
      };
    });
    const resetBtn = root.querySelector("#bc-col-reset");
    if (resetBtn) resetBtn.onclick = () => { view.colOrder = normalizeOrder([]); saveColPrefs(); view._colsOpen = true; render(); };
    // Close the Columns panel when clicking elsewhere.
    document.addEventListener("click", function closeCols() {
      const p = document.getElementById("bc-cols-panel");
      if (p) p.style.display = "none";
      view._colsOpen = false;
      document.removeEventListener("click", closeCols);
    });

    // Column resize (drag the right edge of a header, Excel-style)
    root.querySelectorAll("#activities-table th .col-resize").forEach((h) => {
      h.onclick = (e) => e.stopPropagation();
      h.onmousedown = (e) => {
        e.preventDefault(); e.stopPropagation();
        const th = h.closest("th"); const key = th.dataset.col;
        const startX = e.clientX, startW = th.getBoundingClientRect().width;
        const onMove = (ev) => { view.colWidths[key] = Math.max(50, Math.round(startW + (ev.clientX - startX))); applyColStyles(); };
        const onUp = () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); saveColPrefs(); };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      };
    });

    applyColStyles();
    renderRows();
  }

  function sortArrow(key) {
    if (view.sortBy !== key) return ` <span class="sort-arrow muted">⇅</span>`;
    return view.sortDir === "asc" ? ` <span class="sort-arrow active">▲</span>` : ` <span class="sort-arrow active">▼</span>`;
  }

  function sortValue(a, key) {
    switch (key) {
      case "date": return a.date || "";
      case "name": return (a.name || "").toLowerCase();
      case "entity": return ((S.entityById(a.entityId) || {}).name || "").toLowerCase();
      case "code": return S.budgetCodeForActivity(a).toLowerCase();
      case "svp": return ((S.svpById(a.svpId) || {}).name || "").toLowerCase();
      case "type": return ((S.actTypeById(a.activityTypeId) || {}).name || "").toLowerCase();
      case "status": return ((S.statusById(a.statusId) || {}).name || "").toLowerCase();
      case "owner": return ((S.userById(a.ownerId) || {}).name || "").toLowerCase();
      case "vendor": return (a.vendor || "").toLowerCase();
      case "po": return (a.poNumber || "").toLowerCase();
      case "fG": return a.forecastGross || 0;
      case "fP": return a.forecastPartner || 0;
      case "fN": return (a.forecastGross || 0) - (a.forecastPartner || 0);
      case "aG": return a.actualGross || 0;
      case "aP": return a.actualPartner || 0;
      case "aN": return (a.actualGross || 0) - (a.actualPartner || 0);
      case "createdBy": return userNm(a.createdBy).toLowerCase();
      case "createdAt": return a.createdAt || "";
      case "updatedBy": return userNm(a.updatedBy).toLowerCase();
      case "updatedAt": return a.updatedAt || "";
      default: return "";
    }
  }

  function userNm(id) { if (!id) return ""; const u = S.userById(id); return u ? u.name : ""; }
  // Signature of a record's content, ignoring audit fields, to tell a real edit from a no-op save.
  function contentSig(o) {
    const skip = { createdAt: 1, updatedAt: 1, createdBy: 1, updatedBy: 1 };
    const c = {}; Object.keys(o).sort().forEach((k) => { if (!skip[k]) c[k] = o[k]; });
    return JSON.stringify(c);
  }
  function fmtDT(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function uniqueYears(activities) {
    const ys = new Set();
    activities.forEach((a) => { if (a.date) ys.add(new Date(a.date).getFullYear()); });
    return Array.from(ys);
  }

  // Plain display text of a column for a row, used by the Excel-style column filters.
  function filterText(a, key) {
    switch (key) {
      case "date": return a.date || "";
      case "name": return a.name || "";
      case "entity": return (S.entityById(a.entityId) || {}).name || "";
      case "code": return S.budgetCodeForActivity(a);
      case "svp": return (S.svpById(a.svpId) || {}).name || "";
      case "type": return (S.actTypeById(a.activityTypeId) || {}).name || "";
      case "status": return (S.statusById(a.statusId) || {}).name || "";
      case "owner": return (S.userById(a.ownerId) || {}).name || "";
      case "vendor": return a.vendor || "";
      case "po": return a.poNumber || "";
      case "fG": return a.forecastGross ? String(a.forecastGross) : "";
      case "fP": return a.forecastPartner ? String(a.forecastPartner) : "";
      case "fN": return String((a.forecastGross || 0) - (a.forecastPartner || 0));
      case "aG": return a.actualGross ? String(a.actualGross) : "";
      case "aP": return a.actualPartner ? String(a.actualPartner) : "";
      case "aN": return String((a.actualGross || 0) - (a.actualPartner || 0));
      case "createdBy": return userNm(a.createdBy);
      case "createdAt": return a.createdAt || "";
      case "updatedBy": return userNm(a.updatedBy);
      case "updatedAt": return a.updatedAt || "";
      default: return "";
    }
  }
  // Distinct non-empty values in a column, for the equals / does not equal dropdowns.
  function distinctValues(key) {
    const set = new Set();
    (S.state.data.activities || []).forEach((a) => { const t = filterText(a, key); if (t !== "") set.add(t); });
    return [...set].sort((x, y) => String(x).localeCompare(String(y), undefined, { numeric: true, sensitivity: "base" }));
  }
  function matchColFilter(a, key, f) {
    const t = filterText(a, key);
    const v = (f.value == null ? "" : String(f.value));
    switch (f.op) {
      case "eq": return t === v;
      case "ne": return t !== v;
      case "blank": return t.trim() === "";
      case "data": return t.trim() !== "";
      case "contains": return t.toLowerCase().includes(v.toLowerCase());
      case "ncontains": return !t.toLowerCase().includes(v.toLowerCase());
      default: return true;
    }
  }

  function filteredActivities() {
    const data = S.state.data;
    const q = view.search.trim().toLowerCase();
    const colKeys = Object.keys(view.colFilters || {});
    return data.activities.filter((a) => {
      if (!S.inPeriodQ(a.date, view.year, view.quarters, view.monthFilter)) return false;
      if (!S.entityMatchesScope(a.entityId, view.scope)) return false;
      if (view.svpFilter && a.svpId !== view.svpFilter) return false;
      if (view.typeFilter && a.activityTypeId !== view.typeFilter) return false;
      if (view.statusFilter && a.statusId !== view.statusFilter) return false;
      if (view.ownerFilter && a.ownerId !== view.ownerFilter) return false;
      for (const key of colKeys) { if (!matchColFilter(a, key, view.colFilters[key])) return false; }
      if (q) {
        const hay = [a.name, a.vendor, a.poNumber, a.notes].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      const dir = view.sortDir === "desc" ? -1 : 1;
      const va = sortValue(a, view.sortBy);
      const vb = sortValue(b, view.sortBy);
      if (typeof va === "string" && typeof vb === "string") {
        return va.localeCompare(vb) * dir;
      }
      return ((+va || 0) - (+vb || 0)) * dir;
    });
  }

  // Budget left for the selected entity (its budget code) in the selected year. Uses net amounts
  // (gross - partner funds), like Reporting, and the whole year: other filters (quarter, month,
  // search, column filters) do not change what is left on the budget.
  function renderEntitySummary() {
    const host = document.getElementById("bud-summary");
    if (!host) return;
    const entId = view.scope && view.scope.entityId;
    if (!entId) { renderScopeSummary(host); return; }
    const data = S.state.data;
    const ent = S.entityById(entId);
    if (!ent) { host.innerHTML = ""; return; }
    const cid = S.canonicalEntityId(entId);
    const sameEnt = (id) => id && S.canonicalEntityId(id) === cid;
    const yb = ((data.settings.yearlyBudgets || {})[view.year]) || {};
    const bcs = ((data.settings.budgetCodes || {})[view.year]) || {};
    let budget = 0, code = bcs[entId] || "";
    (data.settings.entities || []).forEach((e) => {
      if (!sameEnt(e.id)) return;
      budget += yb[e.id] || 0;
      if (!code && bcs[e.id]) code = bcs[e.id];
    });
    let fNet = 0, aNet = 0, n = 0;
    (data.activities || []).forEach((a) => {
      if (!sameEnt(a.entityId) || !a.date || new Date(a.date).getFullYear() !== view.year) return;
      fNet += (a.forecastGross || 0) - (a.forecastPartner || 0);
      aNet += (a.actualGross || 0) - (a.actualPartner || 0);
      n++;
    });
    const leftF = budget - fNet, leftA = budget - aNet;
    const pct = budget ? Math.round((fNet / budget) * 100) : 0;
    const barW = Math.max(0, Math.min(100, pct));
    const over = budget && leftF < 0;
    const title = `${S.escapeHtml(ent.name)}${code ? ` <span class="bsum-code">${S.escapeHtml(code)}</span>` : ""} <span class="muted">&middot; ${view.year}</span>`;
    if (!budget) {
      host.innerHTML = `<div class="bsum card"><div class="bsum-title">${title}</div>
        <div class="muted small">No yearly budget set for ${view.year}. Planned spend so far: <strong>${S.fmtMoney(fNet)}</strong> net (${n} line${n === 1 ? "" : "s"}). Set the budget in Settings &gt; Budget structure.</div>${codeShareHtml(code, cid)}</div>`;
      return;
    }
    host.innerHTML = `<div class="bsum card">
      <div class="bsum-title">${title}</div>
      <div class="bsum-kpis">
        <div><div class="bsum-l">Yearly budget</div><div class="bsum-v">${S.fmtMoney(budget)}</div></div>
        <div><div class="bsum-l">Planned (forecast net)</div><div class="bsum-v">${S.fmtMoney(fNet)}</div></div>
        <div><div class="bsum-l">Spent (actual net)</div><div class="bsum-v">${S.fmtMoney(aNet)}</div></div>
        <div class="bsum-left ${over ? "neg" : "pos"}"><div class="bsum-l">Left after planned</div><div class="bsum-v">${S.fmtMoney(leftF)}</div></div>
        <div><div class="bsum-l">Left after actual</div><div class="bsum-v">${S.fmtMoney(leftA)}</div></div>
      </div>
      <div class="bsum-bar" title="${pct}% of the budget is planned"><div class="bsum-fill ${over ? "neg" : ""}" style="width:${barW}%"></div></div>
      <div class="muted small">${pct}% of the budget is planned &middot; ${n} budget line${n === 1 ? "" : "s"} in ${view.year}${over ? " &middot; <strong style=\"color:#b91c1c\">over budget</strong>" : ""}</div>
      ${codeShareHtml(code, cid)}
    </div>`;
  }
  // Overview for everything in the current M1 zone / cluster selection (no single entity picked):
  // totals for the year plus a fold-out table per budget code. Net amounts, whole year.
  function renderScopeSummary(host) {
    const data = S.state.data;
    const yr = view.year;
    const sc = view.scope || {};
    const yb = ((data.settings.yearlyBudgets || {})[yr]) || {};
    const bcs = ((data.settings.budgetCodes || {})[yr]) || {};
    const ents = (data.settings.entities || []).filter((e) => S.entityMatchesScope(e.id, sc));
    const codeOf = (id) => bcs[id] || bcs[S.canonicalEntityId(id)] || "";
    const keyOf = (id) => codeOf(id) || ("ent:" + S.canonicalEntityId(id));
    const groups = {};
    const g = (k) => (groups[k] = groups[k] || { budget: 0, f: 0, a: 0, n: 0, ents: {} });
    let budget = 0;
    ents.forEach((e) => {
      const amt = yb[e.id] || 0;
      budget += amt;
      if (!amt && !S.entityActiveInYear(e, yr)) return;
      const grp = g(keyOf(e.id)); grp.budget += amt;
      grp.ents[S.canonicalEntityId(e.id)] = (S.entityById(S.canonicalEntityId(e.id)) || e).name;
    });
    let f = 0, a = 0, n = 0, noEnt = 0;
    (data.activities || []).forEach((x) => {
      if (!x.date || new Date(x.date).getFullYear() !== yr) return;
      if (!S.entityMatchesScope(x.entityId, sc)) return;
      const fn = (x.forecastGross || 0) - (x.forecastPartner || 0), an = (x.actualGross || 0) - (x.actualPartner || 0);
      f += fn; a += an; n++;
      if (!x.entityId || !S.entityById(x.entityId)) { noEnt += fn; return; }
      const grp = g(keyOf(x.entityId)); grp.f += fn; grp.a += an; grp.n++;
      const cid = S.canonicalEntityId(x.entityId);
      grp.ents[cid] = grp.ents[cid] || (S.entityById(cid) || {}).name || "";
    });
    const scopeLabel = sc.cluster ? `Cluster ${S.escapeHtml(sc.cluster)}` : sc.m1 ? `${S.escapeHtml(sc.m1)}` : "All entities";
    const leftF = budget - f, leftA = budget - a;
    const pct = budget ? Math.round((f / budget) * 100) : 0;
    const over = budget && leftF < 0;
    const rows = Object.entries(groups).filter(([, v]) => v.budget || v.f || v.a)
      .map(([k, v]) => ({ code: k.startsWith("ent:") ? "" : k, ...v, left: v.budget - v.f }))
      .sort((x, y) => (x.code || "~").localeCompare(y.code || "~"));
    const overCodes = rows.filter((r) => r.budget && r.left < 0).length;
    const noBudget = rows.filter((r) => !r.budget && r.f).length;
    const open = (() => { try { return localStorage.getItem("mb_bsum_codes") === "1"; } catch (e) { return false; } })();
    const entLinks = (r) => Object.entries(r.ents).filter(([, nm]) => nm).map(([id, nm]) =>
      `<a href="#" class="bsum-ent" data-id="${id}">${S.escapeHtml(nm)}</a>`).join(", ");
    const table = `
      <table class="bsum-table">
        <thead><tr><th>Budget code</th><th>Entities</th><th class="num">Budget</th><th class="num">Planned</th><th class="num">Spent</th><th class="num">Left after planned</th><th class="num">% planned</th></tr></thead>
        <tbody>${rows.map((r) => {
          const p = r.budget ? Math.round((r.f / r.budget) * 100) : null;
          const cls = !r.budget ? "nob" : r.left < 0 ? "neg" : "pos";
          return `<tr class="${cls}"><td>${r.code ? `<span class="bsum-code">${S.escapeHtml(r.code)}</span>` : '<span class="muted">(no code)</span>'}</td>
            <td>${entLinks(r)}</td>
            <td class="num">${r.budget ? S.fmtMoney(r.budget) : '<span class="muted">-</span>'}</td>
            <td class="num">${S.fmtMoney(r.f)}</td><td class="num">${S.fmtMoney(r.a)}</td>
            <td class="num bsum-leftcell">${r.budget ? S.fmtMoney(r.left) : '<span class="muted">no budget</span>'}</td>
            <td class="num">${p === null ? "" : `<span class="bsum-mini"><span style="width:${Math.max(0, Math.min(100, p))}%"></span></span>${p}%`}</td></tr>`;
        }).join("")}</tbody>
      </table>`;
    host.innerHTML = `<div class="bsum card">
      <div class="bsum-title">${scopeLabel} <span class="muted">&middot; ${yr}</span></div>
      <div class="bsum-kpis">
        <div><div class="bsum-l">Yearly budget</div><div class="bsum-v">${S.fmtMoney(budget)}</div></div>
        <div><div class="bsum-l">Planned (forecast net)</div><div class="bsum-v">${S.fmtMoney(f)}</div></div>
        <div><div class="bsum-l">Spent (actual net)</div><div class="bsum-v">${S.fmtMoney(a)}</div></div>
        <div class="bsum-left ${over ? "neg" : "pos"}"><div class="bsum-l">Left after planned</div><div class="bsum-v">${S.fmtMoney(leftF)}</div></div>
        <div><div class="bsum-l">Left after actual</div><div class="bsum-v">${S.fmtMoney(leftA)}</div></div>
      </div>
      <div class="bsum-bar"><div class="bsum-fill ${over ? "neg" : ""}" style="width:${Math.max(0, Math.min(100, pct))}%"></div></div>
      <div class="muted small">${pct}% of the budget is planned &middot; ${n} budget line${n === 1 ? "" : "s"} in ${yr}${overCodes ? ` &middot; <strong style="color:#b91c1c">${overCodes} budget code${overCodes === 1 ? "" : "s"} over budget</strong>` : ""}${noBudget ? ` &middot; ${noBudget} with spend but no budget` : ""}${noEnt ? ` &middot; ${S.fmtMoney(noEnt)} planned on lines without an entity` : ""}</div>
      <details class="bsum-details"${open ? " open" : ""}><summary>Per budget code (${rows.length})</summary>${table}</details>
    </div>`;
    const det = host.querySelector(".bsum-details");
    if (det) det.addEventListener("toggle", () => { try { localStorage.setItem("mb_bsum_codes", det.open ? "1" : "0"); } catch (e) {} });
    host.querySelectorAll(".bsum-ent").forEach((el) => {
      el.onclick = (ev) => { ev.preventDefault(); view.scope.entityId = el.dataset.id; render(); };
    });
  }

  // When several entities share the same budget code, what is left on the code as a whole matters.
  function codeShareHtml(code, cid) {
    if (!code) return "";
    const data = S.state.data;
    const yb = ((data.settings.yearlyBudgets || {})[view.year]) || {};
    const bcs = ((data.settings.budgetCodes || {})[view.year]) || {};
    const ids = (data.settings.entities || []).filter((e) => bcs[e.id] === code).map((e) => e.id);
    const others = [...new Set(ids.filter((id) => S.canonicalEntityId(id) !== cid).map((id) => (S.entityById(id) || {}).name).filter(Boolean))];
    if (!others.length) return "";
    const idSet = new Set(ids);
    const budget = ids.reduce((t, id) => t + (yb[id] || 0), 0);
    let f = 0, a = 0;
    (data.activities || []).forEach((x) => {
      if (!idSet.has(x.entityId) || !x.date || new Date(x.date).getFullYear() !== view.year) return;
      f += (x.forecastGross || 0) - (x.forecastPartner || 0);
      a += (x.actualGross || 0) - (x.actualPartner || 0);
    });
    const left = budget - f;
    return `<div class="bsum-shared">Budget code <strong>${S.escapeHtml(code)}</strong> is shared with ${S.escapeHtml(others.join(", "))}.
      For the whole code: budget <strong>${S.fmtMoney(budget)}</strong> &middot; planned ${S.fmtMoney(f)} &middot; spent ${S.fmtMoney(a)} &middot;
      left after planned <strong style="color:${left < 0 ? "#b91c1c" : "#0a7d33"}">${S.fmtMoney(left)}</strong></div>`;
  }

  function renderRows() {
    renderEntitySummary();
    const canEditRows = !window.MB_AUTH || window.MB_AUTH.can("editBudget");
    const rows = filteredActivities();
    const tbody = document.getElementById("activities-body");
    const tfoot = document.getElementById("activities-foot");
    if (!tbody) return;

    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${COLUMNS.length}" class="muted" style="text-align:center; padding:32px;">No budget lines yet. Click "+ New budget line" to add one.</td></tr>`;
      tfoot.innerHTML = "";
      return;
    }

    tbody.innerHTML = "";
    rows.forEach((a) => {
      try {
        const fNet = (a.forecastGross || 0) - (a.forecastPartner || 0);
        const aNet = (a.actualGross || 0) - (a.actualPartner || 0);
        const ent = S.entityById(a.entityId);
        const svp = S.svpById(a.svpId);
        const at = S.actTypeById(a.activityTypeId);
        const st = S.statusById(a.statusId);
        const own = S.userById(a.ownerId);
        const statusName = (st && st.name) ? st.name : "";
        const statusSlug = statusName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const nameHtml = a.name && String(a.name).trim() ? S.escapeHtml(a.name) : "<span class='muted'>(no name)</span>";
        const dateHtml = a.date ? S.fmtDate(a.date) : "<span class='muted'>(no date)</span>";
        const cells = {
          actions: `<td class="bc-actions actions-cell">
              ${canEditRows ? `<button class="icon row-menu" title="Actions" aria-label="Actions">&#9776;</button>` : "<span class='muted'>-</span>"}
            </td>`,
          date: `<td class="bc-date">${dateHtml}</td>`,
          name: `<td class="bc-name">${nameHtml}</td>`,
          entity: `<td class="bc-entity">${ent ? S.escapeHtml(ent.name) : "<span class='muted'>-</span>"}</td>`,
          code: `<td class="bc-code">${S.budgetCodeForActivity(a) ? S.escapeHtml(S.budgetCodeForActivity(a)) : "<span class='muted'>-</span>"}</td>`,
          svp: `<td class="bc-svp">${svp ? S.escapeHtml(svp.name) : "<span class='muted'>-</span>"}</td>`,
          type: `<td class="bc-type">${at ? S.escapeHtml(at.name) : "<span class='muted'>-</span>"}</td>`,
          status: `<td class="bc-status">${statusName ? `<span class="status status-${statusSlug}">${S.escapeHtml(statusName)}</span>` : "<span class='muted'>-</span>"}</td>`,
          owner: `<td class="bc-owner">${own ? S.escapeHtml(own.name) : "<span class='muted'>-</span>"}</td>`,
          vendor: `<td class="bc-vendor">${S.escapeHtml(a.vendor || "")}</td>`,
          po: `<td class="bc-po">${S.escapeHtml(a.poNumber || "")}</td>`,
          fG: `<td class="num bc-fG">${S.fmtMoney(a.forecastGross)}</td>`,
          fP: `<td class="num bc-fP">${S.fmtMoney(a.forecastPartner)}</td>`,
          fN: `<td class="num bc-fN">${S.fmtMoney(fNet)}</td>`,
          aG: `<td class="num bc-aG">${S.fmtMoney(a.actualGross)}</td>`,
          aP: `<td class="num bc-aP">${S.fmtMoney(a.actualPartner)}</td>`,
          aN: `<td class="num bc-aN">${S.fmtMoney(aNet)}</td>`,
          createdBy: `<td class="bc-createdBy">${S.escapeHtml(userNm(a.createdBy))}</td>`,
          createdAt: `<td class="bc-createdAt">${fmtDT(a.createdAt)}</td>`,
          updatedBy: `<td class="bc-updatedBy">${S.escapeHtml(userNm(a.updatedBy))}</td>`,
          updatedAt: `<td class="bc-updatedAt">${fmtDT(a.updatedAt)}</td>`,
        };
        const html = `<tr data-id="${a.id}">${orderedCols().map((c) => cells[c.key] || "").join("")}</tr>`;
        tbody.insertAdjacentHTML("beforeend", html);
      } catch (err) {
        console.error("Row render failed for activity", a, err);
        tbody.insertAdjacentHTML("beforeend",
          `<tr><td colspan="${COLUMNS.length}" style="background:#fee2e2; color:#991b1b;">Error rendering "${S.escapeHtml(a.name || a.id)}": ${S.escapeHtml(err.message)}</td></tr>`);
      }
    });

    // totals
    const sum = (k) => rows.reduce((s, a) => s + (a[k] || 0), 0);
    const fG = sum("forecastGross"), fP = sum("forecastPartner");
    const aG = sum("actualGross"), aP = sum("actualPartner");
    const totals = { fG: fG, fP: fP, fN: fG - fP, aG: aG, aP: aP, aN: aG - aP };
    // "Total (n)" goes in the first visible text column of the chosen order.
    const labelKey = (orderedCols().find((c) => c.key !== "actions" && !c.num && !view.hiddenCols.has(c.key)) || {}).key || "actions";
    tfoot.innerHTML = `<tr class="total-row">${orderedCols().map((c) => {
      if (c.num) return `<td class="num bc-${c.key}">${S.fmtMoney(totals[c.key] || 0)}</td>`;
      return `<td class="bc-${c.key}">${c.key === labelKey ? `Total (${rows.length})` : ""}</td>`;
    }).join("")}</tr>`;

    // bind row actions: one menu button per row opens Edit / Copy / Delete
    if (!canEditRows) return;
    tbody.querySelectorAll(".row-menu").forEach((btn) => {
      const id = btn.closest("tr").dataset.id;
      btn.onclick = (e) => { e.stopPropagation(); openRowMenu(btn, id); };
    });
  }

  function openActivityModal(id, preset) {
    const data = S.state.data;
    const isEdit = !!id;
    const a = isEdit ? data.activities.find((x) => x.id === id) : {
      id: API.uid(),
      name: "",
      date: new Date().toISOString().slice(0, 10),
      eventIds: [],
      apCategoryId: "",
      entityId: "",
      svpId: "",
      activityTypeId: "",
      statusId: defaultStatusId(),
      ownerId: S.state.currentUserId || "",
      vendor: "",
      poNumber: "",
      notes: "",
      forecastGross: 0,
      forecastPartner: 0,
      actualGross: 0,
      actualPartner: 0,
      createdBy: S.state.currentUserId,
      createdAt: new Date().toISOString(),
      ...(preset || {}),
    };
    // Normalize links: accept a preset eventId or eventIds, end up with an array.
    if (!Array.isArray(a.eventIds)) a.eventIds = a.eventIds ? [a.eventIds] : [];
    if (preset && preset.eventId && !a.eventIds.includes(preset.eventId)) a.eventIds.push(preset.eventId);

    // For a new line, default the owner from the chosen entity's default owner (if one is set).
    if (!isEdit && a.entityId) {
      const ent0 = S.entityById(a.entityId);
      if (ent0 && ent0.defaultOwnerId) a.ownerId = ent0.defaultOwnerId;
    }

    const groups = Array.from(new Set(
      (data.settings.entities || []).map(e => (e.group || "").trim()).filter(Boolean)
    )).sort();
    const initialEnt = a.entityId ? S.entityById(a.entityId) : null;
    const initialGroup = initialEnt ? (initialEnt.group || "") : "";

    const modal = S.openModal(`
      <h2>${isEdit ? "Edit budget line" : "New budget line"}</h2>
      <div class="form-cols">
        <div>
          <div class="row">
            <div><label>Expenditure or Activity *</label><input id="m-name" type="text" value="${S.escapeHtml(a.name)}" /></div>
            <div class="row" style="gap:10px">
              <div><label>Date *</label><input id="m-date" type="date" value="${a.date || ""}" /></div>
              <div><label>Status</label>
                <select id="m-status"><option value="">Select...</option>
                  ${(data.settings.statuses || []).map(s => `<option ${a.statusId===s.id?"selected":""} value="${s.id}">${S.escapeHtml(s.name)}</option>`).join("")}
                </select></div>
            </div>
          </div>
          <div class="row">
            <div><label>Cluster *</label>
              <select id="m-group"><option value="">Select...</option>
                ${groups.map(g => `<option ${initialGroup===g?"selected":""} value="${S.escapeHtml(g)}">${S.escapeHtml(g)}</option>`).join("")}
              </select></div>
            <div><label>Entity *</label><select id="m-entity"></select></div>
          </div>
          <div class="row">
            <div><label>SVP</label>
              <select id="m-svp"><option value="">Select...</option>
                ${data.settings.svps.map(s => `<option ${a.svpId===s.id?"selected":""} value="${s.id}">${S.escapeHtml(s.name)}</option>`).join("")}
              </select></div>
            <div><label>Activity type</label>
              <select id="m-type"><option value="">Select...</option>
                ${data.settings.activityTypes.map(t => `<option ${a.activityTypeId===t.id?"selected":""} value="${t.id}">${S.escapeHtml(t.name)}</option>`).join("")}
              </select></div>
          </div>
          <div class="row">
            <div><label>A&amp;P category <span class="muted small">(defaults from type)</span></label>
              <select id="m-apcat"><option value="">Select...</option>
                ${(data.settings.apCategories||[]).map(c => `<option ${a.apCategoryId===c.id?"selected":""} value="${c.id}">${S.escapeHtml(c.name)}</option>`).join("")}
              </select></div>
            <div><label>Owner</label>
              <select id="m-owner"><option value="">Unassigned</option>${S.activeOwnerOptions(a.ownerId)}</select></div>
          </div>
          <div class="row">
            <div><label>Vendor</label><input id="m-vendor" type="text" value="${S.escapeHtml(a.vendor || "")}" /></div>
            <div><label>PO number</label><input id="m-po" type="text" value="${S.escapeHtml(a.poNumber || "")}" /></div>
          </div>
        </div>
        <div>
          <label>Linked campaigns / events <span class="muted small">(Ctrl or Cmd to pick several, or none)</span></label>
          <input id="m-event-filter" type="text" placeholder="Type to filter campaigns..." style="margin-bottom:4px" />
          <select id="m-event" multiple size="5">
            ${(data.events || []).slice().sort((x,y)=>(x.name||"").localeCompare(y.name||"")).map(ev => `<option ${(a.eventIds||[]).includes(ev.id)?"selected":""} value="${ev.id}">${S.escapeHtml(ev.name)}</option>`).join("")}
          </select>
          <p class="muted small" style="margin:3px 0 0">Empty means general spend, not tied to a campaign.</p>
          <h3>Amounts (EUR)</h3>
          <div class="amt-grid">
            <div></div><div class="amt-h">Gross</div><div class="amt-h">Partner funds</div><div class="amt-h" style="text-align:right">Net</div>
            <div class="amt-l">Forecast</div>
            <input id="m-fg" type="number" step="0.01" value="${a.forecastGross || 0}" />
            <input id="m-fp" type="number" step="0.01" value="${a.forecastPartner || 0}" />
            <div class="amt-net" id="m-fn"></div>
            <div class="amt-l">Actual</div>
            <input id="m-ag" type="number" step="0.01" value="${a.actualGross || 0}" />
            <input id="m-ap" type="number" step="0.01" value="${a.actualPartner || 0}" />
            <div class="amt-net" id="m-an"></div>
          </div>
          <label>Notes</label>
          <textarea id="m-notes" rows="3">${S.escapeHtml(a.notes || "")}</textarea>
        </div>
      </div>
      <div class="actions sticky-actions">
        <button class="secondary" id="m-cancel">Cancel</button>
        <button class="primary" id="m-save">${isEdit ? "Save" : "Create"}</button>
      </div>
    `, { closeOnBackdrop: false, cls: "modal-form" });

    // Live net amounts (gross - partner) next to the inputs.
    const updNet = () => {
      const v = (sel) => parseFloat(modal.querySelector(sel).value) || 0;
      modal.querySelector("#m-fn").textContent = S.fmtMoney(v("#m-fg") - v("#m-fp"));
      modal.querySelector("#m-an").textContent = S.fmtMoney(v("#m-ag") - v("#m-ap"));
    };
    ["#m-fg", "#m-fp", "#m-ag", "#m-ap"].forEach((sel) => modal.querySelector(sel).addEventListener("input", updNet));
    updNet();

    // Populate Entity dropdown filtered by selected Group (deduped by name) and by the line's
    // year, so only entities in use that year show. The currently selected entity is always kept,
    // even if retired for that year, so an existing line never loses its link.
    const uniqueEnts = S.uniqueEntities();
    const lineYear = () => { const d = modal.querySelector("#m-date").value; return d ? new Date(d).getFullYear() : new Date().getFullYear(); };
    // Show the entity's budget code (for the line's year) in brackets after the name.
    const entLabel = (e, yr) => { const c = (((data.settings.budgetCodes || {})[yr]) || {})[e.id]; return c ? `${e.name} (${c})` : e.name; };
    function populateEntityOptions(selectedGroup, selectedEntityId) {
      const sel = modal.querySelector("#m-entity");
      const yr = lineYear();
      let visible = selectedGroup ? uniqueEnts.filter(e => (e.group || "") === selectedGroup) : uniqueEnts;
      visible = visible.filter(e => S.entityActiveInYear(e, yr) || e.id === selectedEntityId);
      sel.innerHTML = '<option value="">Select...</option>' +
        visible.map(e => `<option ${selectedEntityId===e.id?"selected":""} value="${e.id}">${S.escapeHtml(entLabel(e, yr))}</option>`).join("");
    }
    // Preselect canonical so duplicates map to the visible option
    populateEntityOptions(initialGroup, S.canonicalEntityId(a.entityId));
    // Changing the date can change which year's entities apply; refresh the list.
    modal.querySelector("#m-date").addEventListener("change", () => {
      populateEntityOptions(modal.querySelector("#m-group").value, modal.querySelector("#m-entity").value);
    });

    // When Group changes, narrow Entity options. Keep current entity if still valid.
    modal.querySelector("#m-group").onchange = (e) => {
      const g = e.target.value;
      const currentEntityId = modal.querySelector("#m-entity").value;
      const ent = currentEntityId ? S.entityById(currentEntityId) : null;
      const keep = !g || (ent && (ent.group || "") === g);
      populateEntityOptions(g, keep ? currentEntityId : "");
    };

    // When Entity changes, auto-set Group to that entity's group.
    modal.querySelector("#m-entity").onchange = (e) => {
      const ent = e.target.value ? S.entityById(e.target.value) : null;
      const g = ent ? (ent.group || "") : "";
      modal.querySelector("#m-group").value = g;
      // Default the owner to this entity's default owner (still editable).
      if (ent && ent.defaultOwnerId) {
        const ownerSel = modal.querySelector("#m-owner");
        if (ownerSel) ownerSel.value = ent.defaultOwnerId;
      }
    };

    // A&P category defaults from the activity type unless overridden.
    const apcatSel = modal.querySelector("#m-apcat");
    const typeSel = modal.querySelector("#m-type");
    const typeCatId = (tid) => { const t = tid ? S.actTypeById(tid) : null; return (t && t.apCategoryId) || ""; };
    if (!a.apCategoryId) apcatSel.value = typeCatId(a.activityTypeId);
    typeSel.addEventListener("change", () => { apcatSel.value = typeCatId(typeSel.value); });

    // Live: entering an actual value flips a Planned (or blank) status to Committed right away.
    const statusSel = modal.querySelector("#m-status");
    const agInput = modal.querySelector("#m-ag");
    const apInput = modal.querySelector("#m-ap");
    const syncStatusFromActual = () => {
      const ag = parseFloat(agInput.value) || 0;
      const ap = parseFloat(apInput.value) || 0;
      const next = S.autoCommitStatus(statusSel.value, ag, ap);
      if (next !== statusSel.value) statusSel.value = next;
    };
    if (agInput) agInput.addEventListener("input", syncStatusFromActual);
    if (apInput) apInput.addEventListener("input", syncStatusFromActual);

    const evFilter = modal.querySelector("#m-event-filter");
    if (evFilter) evFilter.oninput = () => {
      const q = evFilter.value.trim().toLowerCase();
      modal.querySelectorAll("#m-event option").forEach((o) => {
        o.hidden = !!q && !o.textContent.toLowerCase().includes(q);
      });
    };
    modal.querySelector("#m-cancel").onclick = S.closeModal;
    modal.querySelector("#m-save").onclick = () => {
      const name = modal.querySelector("#m-name").value.trim();
      const date = modal.querySelector("#m-date").value;
      const group = modal.querySelector("#m-group").value;
      const entityId = modal.querySelector("#m-entity").value;
      if (!name) return S.toast("Expenditure or Activity is required", "error");
      if (!date) return S.toast("Date is required", "error");
      if (!group) return S.toast("Cluster is required", "error");
      if (!entityId) return S.toast("Entity is required", "error");

      const eventIds = [...modal.querySelectorAll("#m-event option")].filter(o => o.selected).map(o => o.value).filter(Boolean);
      const base = {
        ...a,
        name,
        date,
        eventIds,
        apCategoryId: modal.querySelector("#m-apcat").value,
        entityId,
        svpId: modal.querySelector("#m-svp").value,
        activityTypeId: modal.querySelector("#m-type").value,
        statusId: modal.querySelector("#m-status").value,
        ownerId: modal.querySelector("#m-owner").value,
        vendor: modal.querySelector("#m-vendor").value.trim(),
        poNumber: modal.querySelector("#m-po").value.trim(),
        forecastGross: parseFloat(modal.querySelector("#m-fg").value) || 0,
        forecastPartner: parseFloat(modal.querySelector("#m-fp").value) || 0,
        actualGross: parseFloat(modal.querySelector("#m-ag").value) || 0,
        actualPartner: parseFloat(modal.querySelector("#m-ap").value) || 0,
        notes: modal.querySelector("#m-notes").value,
      };
      // A line with an actual value cannot stay "Planned": bump it to "Committed".
      base.statusId = S.autoCommitStatus(base.statusId, base.actualGross, base.actualPartner);
      // Stamp "updated by/on" only when the content really changed (a no-op save or a brand-new
      // line does not count as an update).
      let updated = base;
      if (isEdit && contentSig(base) !== contentSig(a)) {
        updated = { ...base, updatedBy: S.state.currentUserId, updatedAt: new Date().toISOString() };
      }

      if (isEdit) {
        const i = data.activities.findIndex((x) => x.id === id);
        data.activities[i] = updated;
      } else {
        data.activities.push(updated);
      }
      S.scheduleSave();
      S.notify();
      S.closeModal();
      S.toast(isEdit ? "Budget line updated" : "Budget line created", "success");
    };
  }

  function setFilters(f) {
    if (f.year !== undefined) view.year = f.year;
    // Location scope (from a Reporting drill-down): resolve cluster/M1 from the entity.
    const ent = f.entityId ? S.entityById(S.canonicalEntityId(f.entityId)) : null;
    view.scope = {
      m1: ent ? (ent.m1 || "") : "",
      cluster: ent ? ((ent.group || "").trim()) : (f.group || ""),
      entityId: f.entityId ? S.canonicalEntityId(f.entityId) : "",
    };
    // Drill-downs from Reporting now land as column filters, so they show on the headers and
    // can be cleared like any other filter.
    view.svpFilter = view.typeFilter = view.statusFilter = view.ownerFilter = "";
    view.colFilters = {};
    const addEq = (key, name) => { if (name) view.colFilters[key] = { op: "eq", value: name }; };
    if (f.svpId) addEq("svp", (S.svpById(f.svpId) || {}).name);
    if (f.typeId) addEq("type", (S.actTypeById(f.typeId) || {}).name);
    if (f.statusId) addEq("status", (S.statusById(f.statusId) || {}).name);
    if (f.ownerId) addEq("owner", (S.userById(f.ownerId) || {}).name);
    view.search = f.search || "";
  }

  function defaultStatusId() {
    const list = (S.state.data.settings.statuses || []);
    const planned = list.find((s) => s.name.toLowerCase() === "planned");
    return planned ? planned.id : (list[0] && list[0].id) || "";
  }

  // Open a fresh activity modal, optionally pre-filled (used by the Timeline tab to add a budget line linked to a campaign).
  function newActivity(preset) { openActivityModal(null, preset); }

  // ---- Row action menu (Edit / Copy / Delete) ----
  function copyLine(id) {
    const src = S.state.data.activities.find((x) => x.id === id);
    if (!src) return;
    const preset = { ...src };
    delete preset.id; delete preset.createdBy; delete preset.createdAt; delete preset.updatedBy; delete preset.updatedAt;
    openActivityModal(null, preset);
  }
  async function deleteLine(id) {
    const a = S.state.data.activities.find((x) => x.id === id);
    if (!a) return;
    const ok = await S.confirmDialog(`Delete budget line "${a.name}"? This cannot be undone.`);
    if (!ok) return;
    S.state.data.activities = S.state.data.activities.filter((x) => x.id !== id);
    S.scheduleSave(); S.notify(); S.toast("Budget line deleted", "success");
  }
  let _hdrClose = null;
  function closeHeaderMenu() {
    const m = document.querySelector(".hdr-menu-pop"); if (m) m.remove();
    if (_hdrClose) { _hdrClose(); _hdrClose = null; }
  }
  function openHeaderMenu(th, key) {
    closeHeaderMenu();
    const col = COLUMNS.find((c) => c.key === key) || { label: key };
    const cur = view.colFilters[key] || { op: "", value: "" };
    const menu = document.createElement("div");
    menu.className = "hdr-menu-pop";
    menu.style.cssText = "position:fixed; z-index:1000; background:#fff; border:1px solid #cbd5e1; border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,.16); padding:8px; min-width:236px; font-size:13px;";
    menu.innerHTML = `
      <div style="display:flex; gap:6px; margin-bottom:6px;">
        <button class="secondary hm-asc" style="flex:1">&#9650; Sort A&rarr;Z</button>
        <button class="secondary hm-desc" style="flex:1">&#9660; Sort Z&rarr;A</button>
      </div>
      <div style="border-top:1px solid #eef0f3; margin:6px 0; padding-top:6px;">
        <div class="muted small" style="margin-bottom:4px">Filter: ${S.escapeHtml(col.label || "")}</div>
        <select class="hm-op" style="width:100%">
          <option value="">(no filter)</option>
          <option value="eq" ${cur.op === "eq" ? "selected" : ""}>equals</option>
          <option value="ne" ${cur.op === "ne" ? "selected" : ""}>does not equal</option>
          <option value="blank" ${cur.op === "blank" ? "selected" : ""}>is blank</option>
          <option value="data" ${cur.op === "data" ? "selected" : ""}>contains data</option>
          <option value="contains" ${cur.op === "contains" ? "selected" : ""}>contains</option>
          <option value="ncontains" ${cur.op === "ncontains" ? "selected" : ""}>does not contain</option>
        </select>
        <div class="hm-valwrap" style="margin-top:6px"></div>
        <div style="display:flex; gap:6px; margin-top:8px;">
          <button class="primary hm-apply" style="flex:1">Apply</button>
          <button class="secondary hm-clear" style="flex:1">Clear</button>
        </div>
      </div>`;
    document.body.appendChild(menu);
    const r = th.getBoundingClientRect();
    menu.style.top = (r.bottom + 4) + "px";
    menu.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 252)) + "px";

    const opSel = menu.querySelector(".hm-op");
    const valWrap = menu.querySelector(".hm-valwrap");
    function renderVal() {
      const op = opSel.value;
      if (op === "eq" || op === "ne") {
        const vals = distinctValues(key);
        valWrap.innerHTML = `<select class="hm-val" style="width:100%"><option value="">(pick a value)</option>${vals.map((v) => `<option ${String(cur.value) === String(v) ? "selected" : ""} value="${S.escapeHtml(String(v))}">${S.escapeHtml(String(v))}</option>`).join("")}</select>`;
      } else if (op === "contains" || op === "ncontains") {
        valWrap.innerHTML = `<input class="hm-val" type="text" style="width:100%" placeholder="Type text..." value="${S.escapeHtml((cur.op === "contains" || cur.op === "ncontains") ? String(cur.value || "") : "")}" />`;
        const inp = valWrap.querySelector(".hm-val"); if (inp) inp.focus();
      } else {
        valWrap.innerHTML = "";
      }
    }
    renderVal();
    opSel.onchange = renderVal;
    const applyFilter = () => {
      const op = opSel.value;
      if (!op) { delete view.colFilters[key]; }
      else {
        const valEl = menu.querySelector(".hm-val");
        const value = valEl ? valEl.value : "";
        if ((op === "eq" || op === "ne") && value === "") return S.toast("Pick a value", "error");
        if ((op === "contains" || op === "ncontains") && value.trim() === "") return S.toast("Type some text", "error");
        view.colFilters[key] = { op, value };
      }
      closeHeaderMenu(); render();
    };
    menu.querySelector(".hm-asc").onclick = () => { view.sortBy = key; view.sortDir = "asc"; closeHeaderMenu(); render(); };
    menu.querySelector(".hm-desc").onclick = () => { view.sortBy = key; view.sortDir = "desc"; closeHeaderMenu(); render(); };
    menu.querySelector(".hm-apply").onclick = applyFilter;
    menu.querySelector(".hm-clear").onclick = () => { delete view.colFilters[key]; closeHeaderMenu(); render(); };
    valWrap.addEventListener("keydown", (e) => { if (e.key === "Enter") applyFilter(); });
    menu.onclick = (e) => e.stopPropagation();
    setTimeout(() => {
      const onDoc = (e) => { if (!menu.contains(e.target)) closeHeaderMenu(); };
      const onKey = (e) => { if (e.key === "Escape") closeHeaderMenu(); };
      document.addEventListener("click", onDoc);
      document.addEventListener("keydown", onKey);
      _hdrClose = () => { document.removeEventListener("click", onDoc); document.removeEventListener("keydown", onKey); };
    }, 0);
  }

  function closeRowMenu() { const m = document.querySelector(".row-menu-pop"); if (m) m.remove(); }
  function openRowMenu(btn, id) {
    closeRowMenu();
    const menu = document.createElement("div");
    menu.className = "row-menu-pop";
    menu.innerHTML = `
      <button data-act="edit">&#9998; Edit</button>
      <button data-act="copy">&#128203; Copy</button>
      <button data-act="del" class="danger">&#128465; Delete</button>`;
    document.body.appendChild(menu);
    const r = btn.getBoundingClientRect();
    menu.style.position = "fixed";
    menu.style.top = (r.bottom + 4) + "px";
    menu.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 170)) + "px";
    menu.querySelector('[data-act="edit"]').onclick = () => { closeRowMenu(); openActivityModal(id); };
    menu.querySelector('[data-act="copy"]').onclick = () => { closeRowMenu(); copyLine(id); };
    menu.querySelector('[data-act="del"]').onclick = () => { closeRowMenu(); deleteLine(id); };
    setTimeout(() => document.addEventListener("click", closeRowMenu, { once: true }), 0);
  }

  window.MB_BUDGET = { render, setFilters, newActivity };
})();
