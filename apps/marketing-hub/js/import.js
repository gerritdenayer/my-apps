// Generic Excel importer.
// Loads any .xlsx, lets the user pick sheet + map columns, previews, then imports.
(function () {
  const S = window.MB_STATE;
  const API = window.MB_API;

  const COLUMN_HINTS = {
    name: ["name of the program", "program name", "activity name", "action description", "name"],
    activityType: ["a&p category", "category", "activity type"],
    status: ["activity status", "status"],
    svp: ["svp"],
    vendor: ["partner involved", "partner", "vendor", "supplier"],
    notes: ["description", "notes", "comments"],
    entity: ["entity", "country", "m3"],
  };
  const MONTHS = ["january","february","march","april","may","june","july","august","september","october","november","december"];
  const MONTHS_SHORT = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];

  function open() {
    const modal = S.openModal(`
      <h2>Import budget lines from Excel</h2>
      <p>Select an .xlsx file. The app will read the sheets and let you map the columns before importing.</p>
      <label>Excel file</label>
      <input type="file" id="imp-file" accept=".xlsx,.xls" />
      <div class="actions">
        <button class="secondary" id="imp-cancel">Cancel</button>
      </div>
    `);
    modal.querySelector("#imp-cancel").onclick = S.closeModal;
    modal.querySelector("#imp-file").onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const state = {
          wb,
          filename: file.name,
          sheetName: wb.SheetNames[0],
          headerRow: 1,
          year: new Date().getFullYear(),
          mapping: {},
          monthMapping: {},
          fallbackEntity: "International (D&D)",
        };
        autoDetect(state);
        renderMapping(state);
      } catch (err) {
        console.error(err);
        S.toast("Could not read file: " + err.message, "error");
      }
    };
  }

  function getRows(state) {
    const sheet = state.wb.Sheets[state.sheetName];
    return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  }

  function autoDetect(state) {
    const rows = getRows(state);
    // Find header row: scan first 10 rows for the one with the most text cells
    let bestRow = 0, bestScore = 0;
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const r = rows[i] || [];
      const score = r.filter((c) => typeof c === "string" && c.trim().length > 0).length;
      if (score > bestScore) { bestScore = score; bestRow = i; }
    }
    state.headerRow = bestRow + 1;
    const headers = (rows[bestRow] || []).map((h) => (h == null ? "" : String(h)).toLowerCase().trim());

    // Field mappings
    state.mapping = {};
    for (const field in COLUMN_HINTS) {
      state.mapping[field] = -1;
      for (let ci = 0; ci < headers.length; ci++) {
        const h = headers[ci];
        if (!h) continue;
        if (COLUMN_HINTS[field].some((hint) => h.includes(hint))) {
          state.mapping[field] = ci;
          break;
        }
      }
    }
    // Month mappings
    state.monthMapping = {};
    for (let m = 0; m < 12; m++) {
      state.monthMapping[m] = -1;
      for (let ci = 0; ci < headers.length; ci++) {
        const h = headers[ci];
        if (!h) continue;
        if (h === MONTHS[m] || h === MONTHS_SHORT[m] || h.startsWith(MONTHS[m]) || h.startsWith(MONTHS_SHORT[m] + " ")) {
          state.monthMapping[m] = ci;
          break;
        }
      }
    }
  }

  function letter(i) {
    let s = ""; let n = i;
    while (n >= 0) { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1; }
    return s;
  }

  function colOptions(headers) {
    return headers.map((h, i) =>
      `<option value="${i}">${letter(i)}: ${S.escapeHtml(String(h == null ? "" : h).slice(0, 40))}</option>`
    ).join("");
  }

  function renderMapping(state) {
    const rows = getRows(state);
    const headers = rows[state.headerRow - 1] || [];
    const colOpts = colOptions(headers);
    const none = `<option value="-1">(none)</option>`;

    const fields = [
      ["name", "Activity name *"],
      ["activityType", "A&P Category"],
      ["status", "Status"],
      ["svp", "SVP"],
      ["vendor", "Vendor / Partner"],
      ["notes", "Notes / Description"],
      ["entity", "Entity (M3 / country)"],
    ];

    const modal = S.openModal(`
      <h2>Import from Excel</h2>
      <p class="muted small">File: ${S.escapeHtml(state.filename)}</p>

      <div class="row-3">
        <div>
          <label>Sheet</label>
          <select id="imp-sheet">
            ${state.wb.SheetNames.map((n) => `<option ${n===state.sheetName?"selected":""} value="${S.escapeHtml(n)}">${S.escapeHtml(n)}</option>`).join("")}
          </select>
        </div>
        <div>
          <label>Year</label>
          <input id="imp-year" type="number" value="${state.year}" />
        </div>
        <div>
          <label>Header row (1-based)</label>
          <input id="imp-hdr" type="number" min="1" value="${state.headerRow}" />
        </div>
      </div>

      <h3>Column mapping (auto-detected)</h3>
      <div class="row">
        ${fields.map(([key, label]) => `
          <div>
            <label>${label}</label>
            <select data-field="${key}">${none}${colOpts}</select>
          </div>
        `).join("")}
      </div>

      <h3>Monthly amount columns <span class="muted small">(leave any blank if not present)</span></h3>
      <div class="row-4">
        ${MONTHS.map((m, i) => `
          <div>
            <label>${m[0].toUpperCase() + m.slice(1)}</label>
            <select data-month="${i}">${none}${colOpts}</select>
          </div>
        `).join("")}
      </div>

      <label>Fallback entity (used when no country found in the row)</label>
      <input id="imp-fallback" type="text" value="${S.escapeHtml(state.fallbackEntity)}" />

      <h3>Preview <span class="muted small" id="imp-count"></span></h3>
      <div class="table-wrap" style="max-height: 240px; overflow-y: auto;">
        <table>
          <thead><tr><th>Date</th><th>Name</th><th>Entity</th><th>Status</th><th>Type</th><th>SVP</th><th class="num">EUR</th></tr></thead>
          <tbody id="imp-preview"></tbody>
        </table>
      </div>

      <div class="actions">
        <button class="secondary" id="imp-cancel">Cancel</button>
        <button class="primary" id="imp-go">Import all</button>
      </div>
    `);
    modal.style.width = "880px";
    modal.style.maxWidth = "95vw";

    // Set current select values
    fields.forEach(([key]) => {
      modal.querySelector(`select[data-field="${key}"]`).value = state.mapping[key];
    });
    for (let m = 0; m < 12; m++) {
      modal.querySelector(`select[data-month="${m}"]`).value = state.monthMapping[m];
    }

    function pullState() {
      fields.forEach(([key]) => {
        state.mapping[key] = parseInt(modal.querySelector(`select[data-field="${key}"]`).value, 10);
      });
      for (let m = 0; m < 12; m++) {
        state.monthMapping[m] = parseInt(modal.querySelector(`select[data-month="${m}"]`).value, 10);
      }
      state.year = parseInt(modal.querySelector("#imp-year").value, 10) || new Date().getFullYear();
      state.headerRow = Math.max(1, parseInt(modal.querySelector("#imp-hdr").value, 10) || 1);
      state.fallbackEntity = modal.querySelector("#imp-fallback").value.trim();
    }

    function refreshPreview() {
      pullState();
      const all = parseAll(state);
      modal.querySelector("#imp-count").textContent = `(showing ${Math.min(5, all.length)} of ${all.length})`;
      const body = modal.querySelector("#imp-preview");
      if (all.length === 0) {
        body.innerHTML = `<tr><td colspan="7" class="muted" style="text-align:center; padding:16px;">No budget lines parsed. Adjust the column mapping.</td></tr>`;
        return;
      }
      body.innerHTML = all.slice(0, 5).map((a) => `
        <tr>
          <td>${S.escapeHtml(a.date)}</td>
          <td>${S.escapeHtml(a.name)}</td>
          <td>${S.escapeHtml(a.entity || "-")}</td>
          <td>${S.escapeHtml(a.status || "-")}</td>
          <td>${S.escapeHtml(a.activityType || "-")}</td>
          <td>${S.escapeHtml(a.svp || "-")}</td>
          <td class="num">${a.forecastGross.toLocaleString("en-US")}</td>
        </tr>
      `).join("");
    }

    modal.querySelectorAll("select[data-field], select[data-month], input").forEach((el) => {
      el.onchange = refreshPreview;
    });
    modal.querySelector("#imp-sheet").onchange = (e) => {
      state.sheetName = e.target.value;
      autoDetect(state);
      renderMapping(state); // re-render with new auto-detect
    };
    modal.querySelector("#imp-cancel").onclick = S.closeModal;
    modal.querySelector("#imp-go").onclick = () => {
      pullState();
      const all = parseAll(state);
      doImport(all);
    };

    refreshPreview();
  }

  function parseAll(state) {
    const rows = getRows(state);
    const acts = [];
    const start = state.headerRow; // row after header, 0-based index
    for (let i = start; i < rows.length; i++) {
      const row = rows[i] || [];
      const nameRaw = getCell(row, state.mapping.name);
      if (!nameRaw || !String(nameRaw).trim()) continue;
      const name = String(nameRaw).trim();

      const status = normalizeStatus(getCell(row, state.mapping.status));
      const category = strOrEmpty(getCell(row, state.mapping.activityType));
      const svp = strOrEmpty(getCell(row, state.mapping.svp));
      let vendor = strOrEmpty(getCell(row, state.mapping.vendor));
      if (vendor.toUpperCase() === "TBC") vendor = "";
      const notes = strOrEmpty(getCell(row, state.mapping.notes));
      const entityCol = strOrEmpty(getCell(row, state.mapping.entity));
      const entity = entityCol || mapEntityFromName(name) || state.fallbackEntity;

      for (let m = 0; m < 12; m++) {
        const col = state.monthMapping[m];
        if (col === -1 || col === null || col === undefined) continue;
        const v = getCell(row, col);
        const amount = parseFloat(v);
        if (!amount || isNaN(amount)) continue;
        const date = `${state.year}-${String(m + 1).padStart(2, "0")}-01`;
        acts.push({
          name, date, entity, svp, activityType: category, status, vendor, notes,
          forecastGross: amount,
        });
      }
    }
    return acts;
  }

  function getCell(row, idx) {
    if (idx === -1 || idx === null || idx === undefined) return null;
    return row[idx];
  }
  function strOrEmpty(v) { return v == null ? "" : String(v).trim(); }
  function normalizeStatus(v) {
    if (!v) return "";
    const s = String(v).trim();
    if (s.toLowerCase() === "commited") return "Committed";
    return s;
  }
  function mapEntityFromName(name) {
    const n = name.toLowerCase();
    if (n.includes("ch - fr") || n.includes("ch-fr")) return "Switzerland - Geneva";
    if (n.includes("ch - de") || n.includes("ch-de")) return "Switzerland - Zurich";
    if (n.includes("benelux")) return "Belgium";
    if (/\bbe\b/.test(n)) return "Belgium";
    if (/\bnl\b/.test(n)) return "Netherlands";
    if (/\blux?\b/.test(n)) return "Luxembourg";
    if (/\bes\b/.test(n) || /\bspain\b/.test(n)) return "Spain";
    if (/\bno\b/.test(n) || /\bnorway\b/.test(n)) return "Norway";
    if (/\bse\b/.test(n) || /\bsweden\b/.test(n)) return "Sweden";
    return "";
  }

  async function doImport(acts) {
    if (acts.length === 0) return S.toast("Nothing to import. Check the column mapping.", "error");
    const ok = await S.confirmDialog(
      `Import ${acts.length} budget lines? Missing entities, SVPs, types and statuses will be created automatically.`
    );
    if (!ok) return;

    const data = S.state.data;
    data.settings.svps = data.settings.svps || [];
    data.settings.activityTypes = data.settings.activityTypes || [];
    data.settings.statuses = data.settings.statuses || [];
    data.settings.entities = data.settings.entities || [];

    const findOrCreate = (list, name, extra = {}) => {
      if (!name) return "";
      const found = list.find((x) => x.name.trim().toLowerCase() === name.trim().toLowerCase());
      if (found) return found.id;
      const item = { id: API.uid(), name: name.trim(), ...extra };
      list.push(item);
      return item.id;
    };

    let created = 0, skipped = 0;
    acts.forEach((a) => {
      const dup = data.activities.some((x) =>
        x.name === a.name && x.date === a.date && (x.forecastGross || 0) === (a.forecastGross || 0)
      );
      if (dup) { skipped++; return; }
      data.activities.push({
        id: API.uid(),
        name: a.name,
        date: a.date,
        entityId: findOrCreate(data.settings.entities, a.entity, { group: "" }),
        svpId: findOrCreate(data.settings.svps, a.svp),
        activityTypeId: findOrCreate(data.settings.activityTypes, a.activityType),
        statusId: findOrCreate(data.settings.statuses, a.status),
        ownerId: S.state.currentUserId || "",
        vendor: a.vendor || "",
        poNumber: "",
        notes: a.notes || "",
        forecastGross: a.forecastGross || 0,
        forecastPartner: 0,
        actualGross: 0,
        actualPartner: 0,
        createdBy: S.state.currentUserId,
        createdAt: new Date().toISOString(),
      });
      created++;
    });

    S.scheduleSave();
    S.notify();
    S.closeModal();
    S.toast(`Imported ${created} budget lines (${skipped} duplicates skipped).`, "success");
  }

  window.MB_IMPORT = { open };
})();
