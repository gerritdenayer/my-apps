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
  };

  // The Budget table columns. key matches the sort key and the cell class (bc-<key>).
  const COLUMNS = [
    { key: "actions", label: "", def: 64 },
    { key: "date", label: "Date", def: 95 },
    { key: "name", label: "Name", def: 240 },
    { key: "entity", label: "Entity", def: 150 },
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

  function loadHidden() {
    const def = ["createdBy", "createdAt", "updatedBy", "updatedAt"]; // audit columns hidden by default
    const raw = localStorage.getItem("mb_budget_hidden");
    if (raw === null) return new Set(def);
    try { return new Set(JSON.parse(raw)); } catch (e) { return new Set(def); }
  }
  function loadWidths() { try { return JSON.parse(localStorage.getItem("mb_budget_widths") || "{}") || {}; } catch (e) { return {}; } }
  function saveColPrefs() {
    try {
      localStorage.setItem("mb_budget_hidden", JSON.stringify([...view.hiddenCols]));
      localStorage.setItem("mb_budget_widths", JSON.stringify(view.colWidths));
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
        ${S.scopeFilterHtml("f", view.scope, entityFilterLabel)}
        <div class="grow">
          <label>Search</label>
          <input id="f-search" type="text" value="${S.escapeHtml(view.search)}" placeholder="Name, vendor, PO, notes" />
        </div>
        ${Object.keys(view.colFilters || {}).length ? `<div><label>&nbsp;</label><button id="bc-clear-filters" class="secondary" type="button" title="Remove all column filters">Clear filters (${Object.keys(view.colFilters).length})</button></div>` : ""}
        <div><label>&nbsp;</label><span class="muted small" style="padding-top:8px; display:inline-block">Tip: click a column header to sort or filter.</span></div>
        <div style="position:relative">
          <label>&nbsp;</label>
          <button id="bc-cols-btn" class="secondary" type="button">Columns</button>
          <div id="bc-cols-panel" style="display:none; position:absolute; right:0; top:100%; z-index:50; background:#fff; border:1px solid #d1d5db; border-radius:8px; padding:10px; box-shadow:0 6px 18px rgba(0,0,0,.14); max-height:340px; overflow:auto; min-width:190px;">
            <div class="muted small" style="margin-bottom:6px">Show columns</div>
            ${COLUMNS.filter(c => c.key !== "actions").map(c => `<label style="display:flex;align-items:center;gap:8px;font-size:13px;padding:3px 0;"><input type="checkbox" class="bc-col-chk" value="${c.key}" ${view.hiddenCols.has(c.key) ? "" : "checked"} /> ${S.escapeHtml(c.label)}</label>`).join("")}
          </div>
        </div>
        <div>
          <label>&nbsp;</label>
          <button id="bud-publish" class="primary" style="display:none; background:#0a7d33;" title="Publish changes">Publish changes</button>
        </div>
        <div>
          <button id="add-activity" class="primary">+ New budget line</button>
        </div>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table id="activities-table">
            <thead>
              <tr>
                ${COLUMNS.map(c => {
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

    // bind filters
    root.querySelector("#f-year").onchange = (e) => { view.year = +e.target.value; render(); };
    root.querySelectorAll(".f-q").forEach((cb) => { cb.onchange = () => { view.quarters = [...root.querySelectorAll(".f-q:checked")].map((x) => x.value); renderRows(); }; });
    root.querySelector("#f-month").onchange = (e) => { view.monthFilter = e.target.value; renderRows(); };
    S.wireScopeFilter(root, "f", view.scope, renderRows, entityFilterLabel);
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
    if (colsBtn) colsBtn.onclick = (e) => { e.stopPropagation(); colsPanel.style.display = colsPanel.style.display === "none" ? "block" : "none"; };
    root.querySelectorAll(".bc-col-chk").forEach((chk) => {
      chk.onchange = () => {
        if (chk.checked) view.hiddenCols.delete(chk.value); else view.hiddenCols.add(chk.value);
        applyColStyles(); saveColPrefs();
      };
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

  function renderRows() {
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
        const html = `
          <tr data-id="${a.id}">
            <td class="bc-actions actions-cell">
              ${canEditRows ? `<button class="icon row-menu" title="Actions" aria-label="Actions">&#9776;</button>` : "<span class='muted'>-</span>"}
            </td>
            <td class="bc-date">${dateHtml}</td>
            <td class="bc-name">${nameHtml}</td>
            <td class="bc-entity">${ent ? S.escapeHtml(ent.name) : "<span class='muted'>-</span>"}</td>
            <td class="bc-svp">${svp ? S.escapeHtml(svp.name) : "<span class='muted'>-</span>"}</td>
            <td class="bc-type">${at ? S.escapeHtml(at.name) : "<span class='muted'>-</span>"}</td>
            <td class="bc-status">${statusName ? `<span class="status status-${statusSlug}">${S.escapeHtml(statusName)}</span>` : "<span class='muted'>-</span>"}</td>
            <td class="bc-owner">${own ? S.escapeHtml(own.name) : "<span class='muted'>-</span>"}</td>
            <td class="bc-vendor">${S.escapeHtml(a.vendor || "")}</td>
            <td class="bc-po">${S.escapeHtml(a.poNumber || "")}</td>
            <td class="num bc-fG">${S.fmtMoney(a.forecastGross)}</td>
            <td class="num bc-fP">${S.fmtMoney(a.forecastPartner)}</td>
            <td class="num bc-fN">${S.fmtMoney(fNet)}</td>
            <td class="num bc-aG">${S.fmtMoney(a.actualGross)}</td>
            <td class="num bc-aP">${S.fmtMoney(a.actualPartner)}</td>
            <td class="num bc-aN">${S.fmtMoney(aNet)}</td>
            <td class="bc-createdBy">${S.escapeHtml(userNm(a.createdBy))}</td>
            <td class="bc-createdAt">${fmtDT(a.createdAt)}</td>
            <td class="bc-updatedBy">${S.escapeHtml(userNm(a.updatedBy))}</td>
            <td class="bc-updatedAt">${fmtDT(a.updatedAt)}</td>
          </tr>
        `;
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
    tfoot.innerHTML = `
      <tr class="total-row">
        <td class="bc-actions"></td>
        <td colspan="9">Total (${rows.length})</td>
        <td class="num bc-fG">${S.fmtMoney(fG)}</td>
        <td class="num bc-fP">${S.fmtMoney(fP)}</td>
        <td class="num bc-fN">${S.fmtMoney(fG - fP)}</td>
        <td class="num bc-aG">${S.fmtMoney(aG)}</td>
        <td class="num bc-aP">${S.fmtMoney(aP)}</td>
        <td class="num bc-aN">${S.fmtMoney(aG - aP)}</td>
        <td class="bc-createdBy"></td>
        <td class="bc-createdAt"></td>
        <td class="bc-updatedBy"></td>
        <td class="bc-updatedAt"></td>
      </tr>
    `;

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
      <div class="row">
        <div>
          <label>Expenditure or Activity *</label>
          <input id="m-name" type="text" value="${S.escapeHtml(a.name)}" />
        </div>
        <div>
          <label>Date *</label>
          <input id="m-date" type="date" value="${a.date || ""}" />
        </div>
      </div>
      <div class="row">
        <div>
          <label>Cluster *</label>
          <select id="m-group">
            <option value="">Select...</option>
            ${groups.map(g => `<option ${initialGroup===g?"selected":""} value="${S.escapeHtml(g)}">${S.escapeHtml(g)}</option>`).join("")}
          </select>
        </div>
        <div>
          <label>Entity *</label>
          <select id="m-entity"></select>
        </div>
      </div>
      <div class="row">
        <div style="grid-column: 1 / -1;">
          <label>Linked campaigns / events <span class="muted small">(hold Ctrl or Cmd to pick several, or none)</span></label>
          <input id="m-event-filter" type="text" placeholder="Type to filter campaigns..." style="margin-bottom:6px" />
          <select id="m-event" multiple size="4">
            ${(data.events || []).slice().sort((x,y)=>(x.name||"").localeCompare(y.name||"")).map(ev => `<option ${(a.eventIds||[]).includes(ev.id)?"selected":""} value="${ev.id}">${S.escapeHtml(ev.name)}</option>`).join("")}
          </select>
          <p class="muted small" style="margin:4px 0 0">Empty means general spend not tied to any campaign. One line can cover several campaigns.</p>
        </div>
      </div>
      <div class="row-3">
        <div>
          <label>SVP</label>
          <select id="m-svp">
            <option value="">Select...</option>
            ${data.settings.svps.map(s => `<option ${a.svpId===s.id?"selected":""} value="${s.id}">${S.escapeHtml(s.name)}</option>`).join("")}
          </select>
        </div>
        <div>
          <label>Activity type</label>
          <select id="m-type">
            <option value="">Select...</option>
            ${data.settings.activityTypes.map(t => `<option ${a.activityTypeId===t.id?"selected":""} value="${t.id}">${S.escapeHtml(t.name)}</option>`).join("")}
          </select>
        </div>
        <div>
          <label>Status</label>
          <select id="m-status">
            <option value="">Select...</option>
            ${(data.settings.statuses || []).map(s => `<option ${a.statusId===s.id?"selected":""} value="${s.id}">${S.escapeHtml(s.name)}</option>`).join("")}
          </select>
        </div>
      </div>
      <div class="row-3">
        <div>
          <label>A&amp;P category <span class="muted small">(defaults from type)</span></label>
          <select id="m-apcat">
            <option value="">Select...</option>
            ${(data.settings.apCategories||[]).map(c => `<option ${a.apCategoryId===c.id?"selected":""} value="${c.id}">${S.escapeHtml(c.name)}</option>`).join("")}
          </select>
        </div>
        <div></div>
        <div></div>
      </div>
      <div class="row-3">
        <div>
          <label>Owner</label>
          <select id="m-owner">
            <option value="">Unassigned</option>
            ${S.activeOwnerOptions(a.ownerId)}
          </select>
        </div>
        <div>
          <label>Vendor</label>
          <input id="m-vendor" type="text" value="${S.escapeHtml(a.vendor || "")}" />
        </div>
        <div>
          <label>PO number</label>
          <input id="m-po" type="text" value="${S.escapeHtml(a.poNumber || "")}" />
        </div>
      </div>
      <h3>Forecast</h3>
      <div class="row">
        <div>
          <label>Forecast gross (EUR)</label>
          <input id="m-fg" type="number" step="0.01" value="${a.forecastGross || 0}" />
        </div>
        <div>
          <label>Forecast partner funds (EUR)</label>
          <input id="m-fp" type="number" step="0.01" value="${a.forecastPartner || 0}" />
        </div>
      </div>
      <h3>Actual</h3>
      <div class="row">
        <div>
          <label>Actual gross (EUR)</label>
          <input id="m-ag" type="number" step="0.01" value="${a.actualGross || 0}" />
        </div>
        <div>
          <label>Actual partner funds (EUR)</label>
          <input id="m-ap" type="number" step="0.01" value="${a.actualPartner || 0}" />
        </div>
      </div>
      <label>Notes</label>
      <textarea id="m-notes">${S.escapeHtml(a.notes || "")}</textarea>
      <div class="actions">
        <button class="secondary" id="m-cancel">Cancel</button>
        <button class="primary" id="m-save">${isEdit ? "Save" : "Create"}</button>
      </div>
    `, { closeOnBackdrop: false });

    // Populate Entity dropdown filtered by selected Group (deduped by name)
    const uniqueEnts = S.uniqueEntities();
    // Show the entity's budget code (for this line's year) in brackets after the name.
    const codeYear = a.date ? new Date(a.date).getFullYear() : new Date().getFullYear();
    const bcByEntity = ((data.settings.budgetCodes || {})[codeYear]) || {};
    const entLabel = (e) => { const c = bcByEntity[e.id]; return c ? `${e.name} (${c})` : e.name; };
    function populateEntityOptions(selectedGroup, selectedEntityId) {
      const sel = modal.querySelector("#m-entity");
      const visible = selectedGroup
        ? uniqueEnts.filter(e => (e.group || "") === selectedGroup)
        : uniqueEnts;
      sel.innerHTML = '<option value="">Select...</option>' +
        visible.map(e => `<option ${selectedEntityId===e.id?"selected":""} value="${e.id}">${S.escapeHtml(entLabel(e))}</option>`).join("");
    }
    // Preselect canonical so duplicates map to the visible option
    populateEntityOptions(initialGroup, S.canonicalEntityId(a.entityId));

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
