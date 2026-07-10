// Settings tab: manage entities, SVPs, activity types, users, yearly budgets, JSONBin config
(function () {
  const S = window.MB_STATE;
  const API = window.MB_API;

  const view = {
    budgetYear: new Date().getFullYear(),
    entSortBy: "name",           // Entity structure sort column: m1 | group | name | code
    entSortDir: "asc",
    typeSortBy: "name",          // Activity types table sort: name | cat
    typeSortDir: "asc",
    apCatSort: "asc",            // A&P categories chip sort direction
  };

  // Settings uses a batch "Save all" model: edits change data in memory and mark the
  // form dirty, but only persist to storage when the user clicks Save all changes.
  let dirty = false;
  function markDirty() { dirty = true; updateSaveBar(); }
  function updateSaveBar() {
    const btn = document.getElementById("set-saveall");
    const status = document.getElementById("set-savestatus");
    if (btn) btn.disabled = !dirty;
    if (status) {
      status.textContent = dirty ? "Unsaved changes" : "All changes saved";
      status.className = "set-savestatus " + (dirty ? "unsaved" : "saved");
    }
  }
  function saveAll() {
    if (!dirty) { S.toast("Nothing to save", "success"); return; }
    S.scheduleSave();
    S.notify();
    dirty = false;
    updateSaveBar();
    S.toast("All changes saved", "success");
  }
  // Warn before leaving with unsaved settings changes.
  if (!window.__mbSettingsUnloadGuard) {
    window.addEventListener("beforeunload", (e) => {
      if (dirty) { e.preventDefault(); e.returnValue = ""; }
    });
    window.__mbSettingsUnloadGuard = true;
  }

  function render() {
    const root = document.getElementById("tab-settings");
    const data = S.state.data;
    if (!data) { root.innerHTML = ""; return; }
    renderInner(root, data);
  }

  function renderInner(root, data) {
    root.innerHTML = `
      <div class="set-savebar">
        <span id="set-savestatus" class="set-savestatus saved">All changes saved</span>
        <span class="grow"></span>
        <button id="set-saveall" class="primary" disabled>Save all changes</button>
      </div>
      <div class="card">
        <h2>Entity structure</h2>
        <p class="muted small">Hierarchy is M1 &gt; Cluster &gt; Entity. Cluster is used for subtotals in reporting; M1 is the top zone level and is a reporting filter. The budget code is per year. The yearly budget amounts are set in the Budget Structure tab.</p>
        <div class="filter-bar">
          <div><label>Budget code year</label><select id="ent-year">${yearOptions()}</select></div>
        </div>
        <div id="entities-list"></div>
        <h3>Add entity</h3>
        <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:12px;">
          <div><label>M1</label><select id="new-ent-m1">${m1Options("")}</select></div>
          <div><label>Cluster</label><input id="new-ent-group" type="text" list="cluster-suggestions" placeholder="e.g. Digital & Data" /></div>
          <div><label>Entity</label><input id="new-ent-name" type="text" placeholder="e.g. France" /></div>
          <div><label>Default owner</label><select id="new-ent-owner">${ownerOptions("")}</select></div>
          <div style="display:flex; align-items:end;"><button class="primary" id="add-ent">Add entity</button></div>
        </div>
        <h3 style="margin-top:16px">M1 levels</h3>
        <p class="muted small">The top zone level. Used as a reporting filter.</p>
        <div id="m1-list" class="chip-list"></div>
        <div class="row">
          <div><label>New M1 level</label><input id="new-m1" type="text" placeholder="e.g. Zone France" /></div>
          <div style="display:flex; align-items:end;"><button class="primary" id="add-m1">Add</button></div>
        </div>
      </div>

      <div class="card">
        <h2>SVPs</h2>
        <p class="muted small">Includes None and All as selectable values.</p>
        <div id="svps-list" class="chip-list"></div>
        <div class="row">
          <div><label>New SVP</label><input id="new-svp" type="text" placeholder="e.g. AI everywhere" /></div>
          <div style="display:flex; align-items:end;"><button class="primary" id="add-svp">Add</button></div>
        </div>
      </div>

      <div class="card">
        <h2>Countries</h2>
        <p class="muted small">Used to tag campaigns and events so people can see what is happening in their country. Not linked to budget. Mark a value as "global" (like Pan-European) to make it show under every country in the agenda.</p>
        <div id="countries-list" class="chip-list"></div>
        <div class="row-3">
          <div><label>New country</label><input id="new-country" type="text" placeholder="e.g. Portugal" /></div>
          <div><label>&nbsp;</label><label class="muted small" style="display:flex; align-items:center; gap:6px; padding-top:8px;"><input id="new-country-global" type="checkbox" /> Global (shows everywhere)</label></div>
          <div style="display:flex; align-items:end;"><button class="primary" id="add-country">Add</button></div>
        </div>
        <h3 style="margin-top:16px">Country groups</h3>
        <p class="muted small">A group is a one-click shortcut when tagging (for example BeNeLux = Belgium + Netherlands + Luxembourg).</p>
        <div id="country-groups-list"></div>
        <div class="row">
          <div><label>New group name</label><input id="new-cgroup" type="text" placeholder="e.g. BeNeLux" /></div>
          <div style="display:flex; align-items:end;"><button class="primary" id="add-cgroup">Add</button></div>
        </div>
      </div>

      <div class="card">
        <h2>Activity types &amp; A&amp;P categories</h2>
        <p class="muted small">Each activity type belongs to one A&amp;P category. Budget lines inherit the category from their type, and can override it per line.</p>
        <h3>Activity types</h3>
        <div id="types-list"></div>
        <div class="row-3">
          <div><label>New type</label><input id="new-type" type="text" placeholder="e.g. Webinar" /></div>
          <div><label>A&amp;P category</label><select id="new-type-cat"><option value="">Select...</option></select></div>
          <div style="display:flex; align-items:end;"><button class="primary" id="add-type">Add</button></div>
        </div>
        <h3 id="apcat-head" style="margin-top:16px; cursor:pointer;" title="Click to sort A to Z / Z to A">A&amp;P categories <span class="sort-arrow muted" id="apcat-arrow"></span></h3>
        <div id="apcats-list" class="chip-list"></div>
        <div class="row">
          <div><label>New A&amp;P category</label><input id="new-apcat" type="text" placeholder="e.g. Lead generation campaigns" /></div>
          <div style="display:flex; align-items:end;"><button class="primary" id="add-apcat">Add</button></div>
        </div>
        <h3 style="margin-top:16px">Link existing budget lines</h3>
        <p class="muted small">Sets the A&amp;P category on budget lines that do not have one yet, using their activity type's category.</p>
        <button class="secondary" id="apply-apcat">Apply A&amp;P category from type to lines without one</button>
      </div>

      <div class="card">
        <h2>Activity statuses</h2>
        <div id="status-list" class="chip-list"></div>
        <div class="row">
          <div><label>New status</label><input id="new-status" type="text" placeholder="e.g. At risk" /></div>
          <div style="display:flex; align-items:end;"><button class="primary" id="add-status">Add</button></div>
        </div>
      </div>

      <div class="card">
        <h2>Bulk import from Excel</h2>
        <p class="muted small">Upload any .xlsx file. Pick the sheet, confirm the column mapping, preview a few rows, then import. Each row with a monthly amount becomes one budget line dated to the first of that month.</p>
        <button id="btn-import-excel" class="primary">Import from Excel file...</button>
      </div>

    `;

    // populate the "new type" category dropdown
    root.querySelector("#new-type-cat").innerHTML = '<option value="">Select...</option>' + apCatOptions("");

    const saveBtn = root.querySelector("#set-saveall");
    if (saveBtn) saveBtn.onclick = saveAll;

    bind(root);
    renderEntities();
    renderM1();
    renderSvps();
    renderCountries();
    renderCountryGroups();
    renderTypes();
    renderApCategories();
    renderStatuses();
    updateSaveBar();
  }

  function m1Options(selected) {
    const levels = S.state.data.settings.m1Levels || [];
    return '<option value="">(none)</option>' + levels.map((m) => `<option ${selected === m ? "selected" : ""} value="${S.escapeHtml(m)}">${S.escapeHtml(m)}</option>`).join("");
  }
  function ownerOptions(selected) {
    return '<option value="">(none)</option>' + S.activeOwnerOptions(selected);
  }
  function apCatOptions(selected) {
    return (S.state.data.settings.apCategories || []).map((c) => `<option ${selected === c.id ? "selected" : ""} value="${c.id}">${S.escapeHtml(c.name)}</option>`).join("");
  }


  function yearOptions() {
    const current = new Date().getFullYear();
    const ys = new Set([current, current + 1, current - 1, view.budgetYear]);
    Object.keys(S.state.data.settings.yearlyBudgets || {}).forEach((y) => ys.add(+y));
    return Array.from(ys).sort().map(y => `<option ${y===view.budgetYear?"selected":""} value="${y}">${y}</option>`).join("");
  }


  function bind(root) {
    root.querySelector("#add-ent").onclick = () => {
      const name = root.querySelector("#new-ent-name").value.trim();
      const group = root.querySelector("#new-ent-group").value.trim();
      if (!name) return S.toast("Name required", "error");
      const exists = (S.state.data.settings.entities || []).some(
        (e) => (e.name || "").trim().toLowerCase() === name.toLowerCase()
      );
      if (exists) return S.toast(`Entity "${name}" already exists`, "error");
      const m1 = root.querySelector("#new-ent-m1").value;
      const defaultOwnerId = root.querySelector("#new-ent-owner").value || "";
      S.state.data.settings.entities.push({ id: API.uid(), name, group, m1, defaultOwnerId });
      root.querySelector("#new-ent-name").value = "";
      root.querySelector("#new-ent-group").value = "";
      persistAndRefresh();
    };
    root.querySelector("#add-m1").onclick = () => {
      const name = root.querySelector("#new-m1").value.trim();
      if (!name) return;
      const list = S.state.data.settings.m1Levels = S.state.data.settings.m1Levels || [];
      if (list.some((m) => m.toLowerCase() === name.toLowerCase())) return S.toast("Already exists", "error");
      list.push(name);
      root.querySelector("#new-m1").value = "";
      persistAndRefresh();
    };
    root.querySelector("#add-svp").onclick = () => {
      const name = root.querySelector("#new-svp").value.trim();
      if (!name) return;
      S.state.data.settings.svps.push({ id: API.uid(), name });
      root.querySelector("#new-svp").value = "";
      persistAndRefresh();
    };
    root.querySelector("#add-country").onclick = () => {
      const name = root.querySelector("#new-country").value.trim();
      if (!name) return;
      const list = S.state.data.settings.countries = S.state.data.settings.countries || [];
      if (list.some((c) => (c.name || "").toLowerCase() === name.toLowerCase())) return S.toast("Already exists", "error");
      const c = { id: API.uid(), name };
      if (root.querySelector("#new-country-global").checked) c.global = true;
      list.push(c);
      root.querySelector("#new-country").value = "";
      root.querySelector("#new-country-global").checked = false;
      persistAndRefresh();
    };
    root.querySelector("#add-cgroup").onclick = () => {
      const name = root.querySelector("#new-cgroup").value.trim();
      if (!name) return;
      const list = S.state.data.settings.countryGroups = S.state.data.settings.countryGroups || [];
      if (list.some((g) => (g.name || "").toLowerCase() === name.toLowerCase())) return S.toast("Already exists", "error");
      list.push({ id: API.uid(), name, countryIds: [] });
      root.querySelector("#new-cgroup").value = "";
      persistAndRefresh();
    };
    root.querySelector("#add-type").onclick = () => {
      const name = root.querySelector("#new-type").value.trim();
      if (!name) return;
      const apCategoryId = root.querySelector("#new-type-cat").value;
      S.state.data.settings.activityTypes.push({ id: API.uid(), name, apCategoryId });
      root.querySelector("#new-type").value = "";
      persistAndRefresh();
    };
    root.querySelector("#add-apcat").onclick = () => {
      const name = root.querySelector("#new-apcat").value.trim();
      if (!name) return;
      S.state.data.settings.apCategories = S.state.data.settings.apCategories || [];
      if (S.state.data.settings.apCategories.some((c) => (c.name || "").toLowerCase() === name.toLowerCase())) return S.toast("Already exists", "error");
      S.state.data.settings.apCategories.push({ id: API.uid(), name });
      root.querySelector("#new-apcat").value = "";
      persistAndRefresh();
    };
    const apHead = root.querySelector("#apcat-head");
    if (apHead) apHead.onclick = () => { view.apCatSort = view.apCatSort === "desc" ? "asc" : "desc"; renderApCategories(); };
    root.querySelector("#apply-apcat").onclick = async () => {
      const acts = S.state.data.activities || [];
      let n = 0;
      acts.forEach((a) => {
        if (!a.apCategoryId) {
          const t = a.activityTypeId ? S.actTypeById(a.activityTypeId) : null;
          if (t && t.apCategoryId) { a.apCategoryId = t.apCategoryId; n++; }
        }
      });
      markDirty();
      S.toast(`Linked ${n} budget line(s). Click Save all changes to keep them.`, "success");
    };
    root.querySelector("#add-status").onclick = () => {
      const name = root.querySelector("#new-status").value.trim();
      if (!name) return;
      if (!S.state.data.settings.statuses) S.state.data.settings.statuses = [];
      S.state.data.settings.statuses.push({ id: API.uid(), name });
      root.querySelector("#new-status").value = "";
      persistAndRefresh();
    };
    root.querySelector("#btn-import-excel").onclick = () => window.MB_IMPORT.open();


    const entYear = root.querySelector("#ent-year");
    if (entYear) entYear.onchange = (e) => {
      view.budgetYear = +e.target.value;
      renderEntities();
    };
  }

  function renderEntities() {
    const list = document.getElementById("entities-list");
    const ents = S.state.data.settings.entities;
    if (ents.length === 0) { list.innerHTML = "<p class='muted'>No entities yet.</p>"; return; }
    // Budget code is per year and shared with the "Yearly budget per entity" section.
    const bc = S.state.data.settings.budgetCodes || (S.state.data.settings.budgetCodes = {});
    if (!bc[view.budgetYear]) bc[view.budgetYear] = {};
    const bcY = bc[view.budgetYear];

    const ownerName = (id) => { const u = (S.state.data.settings.users || []).find((x) => x.id === id); return u ? u.name : ""; };

    // Sorted view only; the stored entity order is not changed.
    const sortVal = (e, key) => {
      if (key === "m1") return (e.m1 || "").toLowerCase();
      if (key === "group") return (e.group || "").toLowerCase();
      if (key === "code") return (bcY[e.id] || "").toLowerCase();
      if (key === "owner") return ownerName(e.defaultOwnerId).toLowerCase();
      return (e.name || "").toLowerCase();
    };
    const dir = view.entSortDir === "desc" ? -1 : 1;
    const rows = ents.slice().sort((a, b) => sortVal(a, view.entSortBy).localeCompare(sortVal(b, view.entSortBy)) * dir);
    const arrow = (key) => view.entSortBy !== key
      ? ` <span class="sort-arrow muted">⇅</span>`
      : (view.entSortDir === "asc" ? ` <span class="sort-arrow active">▲</span>` : ` <span class="sort-arrow active">▼</span>`);

    // Distinct clusters already in use, for the cluster autocomplete.
    const clusterSuggestions = Array.from(new Set(ents.map((e) => (e.group || "").trim()).filter(Boolean))).sort();

    list.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th class="ent-sort" data-sort="m1" style="cursor:pointer">M1${arrow("m1")}</th>
            <th class="ent-sort" data-sort="group" style="cursor:pointer">Cluster${arrow("group")}</th>
            <th class="ent-sort" data-sort="name" style="cursor:pointer">Entity${arrow("name")}</th>
            <th class="ent-sort" data-sort="owner" style="cursor:pointer">Default owner${arrow("owner")}</th>
            <th class="ent-sort" data-sort="code" style="cursor:pointer">Budget code (${view.budgetYear})${arrow("code")}</th>
            <th></th>
          </tr></thead>
          <tbody>
            ${rows.map(e => `
              <tr data-id="${e.id}">
                <td><select class="inp-m1">${m1Options(e.m1 || "")}</select></td>
                <td><input class="inp-group" type="text" list="cluster-suggestions" value="${S.escapeHtml(e.group || "")}" /></td>
                <td><input class="inp-name" type="text" value="${S.escapeHtml(e.name)}" /></td>
                <td><select class="inp-owner">${ownerOptions(e.defaultOwnerId || "")}</select></td>
                <td><input class="inp-code" type="text" placeholder="e.g. OBI-D&amp;D-BE-26" value="${S.escapeHtml(bcY[e.id] || "")}" /></td>
                <td class="actions-cell">
                  <button class="danger del-ent">Delete</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      <datalist id="cluster-suggestions">${clusterSuggestions.map((c) => `<option value="${S.escapeHtml(c)}"></option>`).join("")}</datalist>
    `;

    // Clickable headers: sort by that column, toggling direction.
    list.querySelectorAll("th.ent-sort").forEach((th) => {
      th.onclick = () => {
        const key = th.dataset.sort;
        if (view.entSortBy === key) view.entSortDir = view.entSortDir === "asc" ? "desc" : "asc";
        else { view.entSortBy = key; view.entSortDir = "asc"; }
        renderEntities();
      };
    });
    list.querySelectorAll("tbody tr").forEach((tr) => {
      const id = tr.dataset.id;
      const writeRow = () => {
        const e = S.state.data.settings.entities.find((x) => x.id === id);
        if (!e) return;
        e.name = tr.querySelector(".inp-name").value.trim();
        e.group = tr.querySelector(".inp-group").value.trim();
        e.m1 = tr.querySelector(".inp-m1").value;
        e.defaultOwnerId = tr.querySelector(".inp-owner").value;
        bcY[id] = tr.querySelector(".inp-code").value.trim();
        markDirty();
      };
      tr.querySelector(".inp-name").onchange = writeRow;
      tr.querySelector(".inp-group").onchange = writeRow;
      tr.querySelector(".inp-m1").onchange = writeRow;
      tr.querySelector(".inp-owner").onchange = writeRow;
      tr.querySelector(".inp-code").onchange = writeRow;
      tr.querySelector(".del-ent").onclick = async () => {
        const e = S.state.data.settings.entities.find((x) => x.id === id);
        const used = S.state.data.activities.filter((a) => a.entityId === id).length;
        const msg = used > 0
          ? `Delete entity "${e.name}"? ${used} budget lines use it and will lose their entity reference.`
          : `Delete entity "${e.name}"?`;
        if (!await S.confirmDialog(msg)) return;
        S.state.data.settings.entities = S.state.data.settings.entities.filter((x) => x.id !== id);
        persistAndRefresh();
      };
    });
  }

  function renderSvps() {
    renderChipList("svps-list", S.state.data.settings.svps, (id) => {
      const used = S.state.data.activities.filter((a) => a.svpId === id).length;
      return used;
    }, "SVP / Campaign");
  }
  function renderCountries() {
    const host = document.getElementById("countries-list");
    const list = (S.state.data.settings.countries || []).slice()
      .sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }));
    if (!list.length) { host.innerHTML = "<p class='muted'>None yet.</p>"; return; }
    host.innerHTML = list.map((c) => `<span class="chip" data-id="${c.id}">${S.escapeHtml(c.name)}${c.global ? ' <span class="muted small">(global)</span>' : ""} <button class="co-global" title="Toggle global (shows under every country)">${c.global ? "★" : "☆"}</button><button class="co-del" title="Remove">×</button></span>`).join("");
    host.querySelectorAll(".chip").forEach((chip) => {
      const id = chip.dataset.id;
      chip.querySelector(".co-global").onclick = () => {
        const c = (S.state.data.settings.countries || []).find((x) => x.id === id);
        if (c) { if (c.global) delete c.global; else c.global = true; persistAndRefresh(); }
      };
      chip.querySelector(".co-del").onclick = async () => {
        const c = (S.state.data.settings.countries || []).find((x) => x.id === id);
        const used = (S.state.data.events || []).filter((e) => (e.countryIds || []).includes(id)).length;
        const msg = used > 0 ? `Delete country "${c.name}"? ${used} event(s) are tagged with it and will lose the tag.` : `Delete country "${c.name}"?`;
        if (!await S.confirmDialog(msg)) return;
        S.state.data.settings.countries = (S.state.data.settings.countries || []).filter((x) => x.id !== id);
        (S.state.data.events || []).forEach((e) => { if (Array.isArray(e.countryIds)) e.countryIds = e.countryIds.filter((x) => x !== id); });
        (S.state.data.settings.countryGroups || []).forEach((g) => { if (Array.isArray(g.countryIds)) g.countryIds = g.countryIds.filter((x) => x !== id); });
        persistAndRefresh();
      };
    });
  }
  function renderCountryGroups() {
    const host = document.getElementById("country-groups-list");
    const groups = (S.state.data.settings.countryGroups || []).slice()
      .sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }));
    const countries = (S.state.data.settings.countries || []).slice()
      .sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }));
    if (!groups.length) { host.innerHTML = "<p class='muted'>None yet.</p>"; return; }
    host.innerHTML = groups.map((g) => `
      <div style="border:1px solid #eef0f3; border-radius:6px; padding:8px 10px; margin-bottom:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong>${S.escapeHtml(g.name)}</strong>
          <button class="link cg-del" data-id="${g.id}" style="color:#a00">Remove group</button>
        </div>
        <div class="chip-list" style="margin-top:6px">
          ${countries.map((c) => `<label class="chip" style="cursor:pointer"><input type="checkbox" class="cg-mem" data-gid="${g.id}" value="${c.id}" ${(g.countryIds || []).includes(c.id) ? "checked" : ""}/> ${S.escapeHtml(c.name)}</label>`).join("")}
        </div>
      </div>`).join("");
    host.querySelectorAll(".cg-mem").forEach((cb) => {
      cb.onchange = () => {
        const g = (S.state.data.settings.countryGroups || []).find((x) => x.id === cb.dataset.gid);
        if (!g) return;
        g.countryIds = g.countryIds || [];
        if (cb.checked) { if (!g.countryIds.includes(cb.value)) g.countryIds.push(cb.value); }
        else g.countryIds = g.countryIds.filter((x) => x !== cb.value);
        markDirty();
      };
    });
    host.querySelectorAll(".cg-del").forEach((btn) => {
      btn.onclick = async () => {
        const g = (S.state.data.settings.countryGroups || []).find((x) => x.id === btn.dataset.id);
        if (!await S.confirmDialog(`Remove group "${g.name}"? The countries themselves are kept.`)) return;
        S.state.data.settings.countryGroups = (S.state.data.settings.countryGroups || []).filter((x) => x.id !== btn.dataset.id);
        persistAndRefresh();
      };
    });
  }
  function renderM1() {
    const host = document.getElementById("m1-list");
    const levels = S.state.data.settings.m1Levels || [];
    if (levels.length === 0) { host.innerHTML = "<p class='muted'>None yet.</p>"; return; }
    host.innerHTML = levels.map((m) => `<span class="chip" data-m1="${S.escapeHtml(m)}">${S.escapeHtml(m)}<button title="Remove">×</button></span>`).join("");
    host.querySelectorAll(".chip").forEach((chip) => {
      chip.querySelector("button").onclick = async () => {
        const m = chip.dataset.m1;
        const used = (S.state.data.settings.entities || []).filter((e) => e.m1 === m).length;
        const msg = used > 0 ? `Remove M1 level "${m}"? ${used} entity(ies) use it and will be cleared.` : `Remove M1 level "${m}"?`;
        if (!await S.confirmDialog(msg)) return;
        S.state.data.settings.m1Levels = levels.filter((x) => x !== m);
        (S.state.data.settings.entities || []).forEach((e) => { if (e.m1 === m) e.m1 = ""; });
        persistAndRefresh();
      };
    });
  }
  function renderApCategories() {
    const arrow = document.getElementById("apcat-arrow");
    if (arrow) arrow.textContent = view.apCatSort === "desc" ? "▼" : "▲";
    renderChipList("apcats-list", S.state.data.settings.apCategories || [], (id) => {
      const types = (S.state.data.settings.activityTypes || []).filter((t) => t.apCategoryId === id).length;
      const lines = (S.state.data.activities || []).filter((a) => a.apCategoryId === id).length;
      return types + lines;
    }, "A&P category", view.apCatSort);
  }
  function renderTypes() {
    const host = document.getElementById("types-list");
    const types = S.state.data.settings.activityTypes || [];
    if (types.length === 0) { host.innerHTML = "<p class='muted'>None yet.</p>"; return; }
    const catName = (id) => ((S.state.data.settings.apCategories || []).find((c) => c.id === id) || {}).name || "";
    const dir = view.typeSortDir === "desc" ? -1 : 1;
    const rows = types.slice().sort((a, b) => {
      const va = view.typeSortBy === "cat" ? catName(a.apCategoryId) : (a.name || "");
      const vb = view.typeSortBy === "cat" ? catName(b.apCategoryId) : (b.name || "");
      return va.localeCompare(vb, undefined, { sensitivity: "base" }) * dir;
    });
    const tArrow = (k) => view.typeSortBy !== k ? ` <span class="sort-arrow muted">⇅</span>` : (view.typeSortDir === "asc" ? ` <span class="sort-arrow active">▲</span>` : ` <span class="sort-arrow active">▼</span>`);
    host.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr><th class="ty-sort" data-k="name" style="cursor:pointer">Type${tArrow("name")}</th><th class="ty-sort" data-k="cat" style="cursor:pointer">A&amp;P category${tArrow("cat")}</th><th></th></tr></thead>
          <tbody>
            ${rows.map((t) => `
              <tr data-id="${t.id}">
                <td><input class="t-name" data-id="${t.id}" type="text" value="${S.escapeHtml(t.name)}" /></td>
                <td><select class="t-cat" data-id="${t.id}"><option value="">Select...</option>${apCatOptions(t.apCategoryId || "")}</select></td>
                <td class="actions-cell"><button class="danger del-type" data-id="${t.id}">Delete</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
    host.querySelectorAll(".ty-sort").forEach((th) => {
      th.onclick = () => {
        const k = th.dataset.k;
        if (view.typeSortBy === k) view.typeSortDir = view.typeSortDir === "asc" ? "desc" : "asc";
        else { view.typeSortBy = k; view.typeSortDir = "asc"; }
        renderTypes();
      };
    });
    host.querySelectorAll(".t-name").forEach((inp) => {
      inp.onchange = () => {
        const t = types.find((x) => x.id === inp.dataset.id);
        if (t) { t.name = inp.value.trim(); markDirty(); }
      };
    });
    host.querySelectorAll(".t-cat").forEach((sel) => {
      sel.onchange = () => {
        const t = types.find((x) => x.id === sel.dataset.id);
        if (t) { t.apCategoryId = sel.value; markDirty(); }
      };
    });
    host.querySelectorAll(".del-type").forEach((btn) => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const t = types.find((x) => x.id === id);
        const used = (S.state.data.activities || []).filter((a) => a.activityTypeId === id).length;
        const msg = used > 0 ? `Delete type "${t.name}"? ${used} budget line(s) use it.` : `Delete type "${t.name}"?`;
        if (!await S.confirmDialog(msg)) return;
        S.state.data.settings.activityTypes = types.filter((x) => x.id !== id);
        persistAndRefresh();
      };
    });
  }
  function renderStatuses() {
    renderChipList("status-list", S.state.data.settings.statuses || [], (id) => {
      return S.state.data.activities.filter((a) => a.statusId === id).length;
    }, "Status");
  }

  function renderChipList(elId, items, usageFn, label, dir) {
    const host = document.getElementById(elId);
    if (items.length === 0) { host.innerHTML = "<p class='muted'>None yet.</p>"; return; }
    const disp = items.slice().sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }));
    if (dir === "desc") disp.reverse();
    host.innerHTML = disp.map(it => `
      <span class="chip" data-id="${it.id}">${S.escapeHtml(it.name)}<button title="Remove">×</button></span>
    `).join("");
    host.querySelectorAll(".chip").forEach((chip) => {
      const id = chip.dataset.id;
      chip.querySelector("button").onclick = async () => {
        const it = items.find((x) => x.id === id);
        const used = usageFn(id);
        const msg = used > 0
          ? `Delete ${label} "${it.name}"? ${used} budget lines use it.`
          : `Delete ${label} "${it.name}"?`;
        if (!await S.confirmDialog(msg)) return;
        const i = items.findIndex((x) => x.id === id);
        items.splice(i, 1);
        persistAndRefresh();
      };
    });
  }

  // Structural change (add/delete): update memory + mark dirty, then re-render.
  // Nothing is persisted until the user clicks Save all changes.
  function persistAndRefresh() {
    markDirty();
    render();
  }

  window.MB_SETTINGS = { render };
})();
