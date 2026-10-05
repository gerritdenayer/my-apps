// Settings > Deleted items (admins only). Budget lines and events are never really deleted:
// they wait in the bin (data.bin) and can be restored or permanently deleted here. Restores and
// permanent deletes are published to the shared folder straight away when one is set.
(function () {
  const S = window.MB_STATE;
  const view = { kind: "all", q: "", sel: new Set() };

  const isAdmin = () => !!(window.MB_AUTH && window.MB_AUTH.canSeeSettings && window.MB_AUTH.canSeeSettings());
  const fmtDT = (iso) => { if (!iso) return "-"; const d = new Date(iso); return isNaN(d) ? "-" : d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); };
  const userNm = (id) => ((S.userById && S.userById(id)) || {}).name || "-";

  function items() {
    const bin = S.ensureBin(S.state.data);
    const out = [];
    bin.activities.forEach((r) => out.push({ kind: "activities", label: "Budget line", r, date: r.date || "", ent: r.entityId,
      amount: (r.forecastGross || 0) - (r.forecastPartner || 0) }));
    bin.events.forEach((r) => out.push({ kind: "events", label: r.kind === "Campaign" ? "Campaign" : "Event", r, date: r.start || "", ent: r.entityId, amount: null }));
    const q = view.q.trim().toLowerCase();
    return out.filter((x) => (view.kind === "all" || x.kind === view.kind) && (!q || (x.r.name || "").toLowerCase().includes(q)))
      .sort((a, b) => String(b.r.deletedAt || "").localeCompare(String(a.r.deletedAt || "")));
  }

  function render() {
    const root = document.getElementById("tab-trash");
    if (!root) return;
    if (!isAdmin()) { root.innerHTML = `<div class="card"><h2>Deleted items</h2><p class="muted">Only admins can see deleted items.</p></div>`; return; }
    const list = items();
    const total = S.ensureBin(S.state.data);
    root.innerHTML = `
      <div class="card">
        <h2>Deleted items</h2>
        <p class="muted small">Deleted budget lines and events are kept here instead of being removed. They do not show or count anywhere else in the app. Restore an item to bring it back exactly as it was, or delete it permanently. Changes here are shared with the team straight away.</p>
        <div class="filter-bar" style="margin:8px 0 10px">
          <div><label>Show</label><select id="tr-kind">
            <option value="all" ${view.kind === "all" ? "selected" : ""}>All (${total.activities.length + total.events.length})</option>
            <option value="activities" ${view.kind === "activities" ? "selected" : ""}>Budget lines (${total.activities.length})</option>
            <option value="events" ${view.kind === "events" ? "selected" : ""}>Campaigns &amp; events (${total.events.length})</option>
          </select></div>
          <div class="grow"><label>Search</label><input id="tr-q" type="text" placeholder="Name..." value="${S.escapeHtml(view.q)}" /></div>
          <div><label>&nbsp;</label><button id="tr-restore" class="secondary" ${view.sel.size ? "" : "disabled"}>Restore selected (${view.sel.size})</button></div>
          <div><label>&nbsp;</label><button id="tr-purge" class="danger" ${view.sel.size ? "" : "disabled"}>Delete selected permanently</button></div>
        </div>
        ${list.length ? `<div class="table-wrap"><table class="tr-table">
          <thead><tr><th style="width:28px"><input type="checkbox" id="tr-all" /></th><th>Type</th><th>Name</th><th>Date</th><th>Entity</th><th class="num">Net forecast</th><th>Deleted by</th><th>Deleted on</th><th></th></tr></thead>
          <tbody>${list.map((x) => `<tr>
            <td><input type="checkbox" class="tr-chk" value="${x.kind}|${x.r.id}" ${view.sel.has(x.kind + "|" + x.r.id) ? "checked" : ""}/></td>
            <td>${x.label}</td>
            <td>${S.escapeHtml(x.r.name || "(no name)")}</td>
            <td>${x.date ? S.fmtDate(x.date) : "-"}</td>
            <td>${S.escapeHtml(((S.entityById(x.ent) || {}).name) || "-")}</td>
            <td class="num">${x.amount === null ? "" : S.fmtMoney(x.amount)}</td>
            <td>${S.escapeHtml(userNm(x.r.deletedBy))}</td>
            <td>${fmtDT(x.r.deletedAt)}</td>
            <td class="actions-cell"><button class="secondary tr-one-restore" data-k="${x.kind}|${x.r.id}">Restore</button> <button class="danger tr-one-purge" data-k="${x.kind}|${x.r.id}">Delete permanently</button></td>
          </tr>`).join("")}</tbody></table></div>`
        : `<p class="muted">${total.activities.length + total.events.length ? "Nothing matches this filter." : "Nothing has been deleted."}</p>`}
      </div>`;

    root.querySelector("#tr-kind").onchange = (e) => { view.kind = e.target.value; view.sel.clear(); render(); };
    const q = root.querySelector("#tr-q");
    q.oninput = (e) => { view.q = e.target.value; render(); const n = document.getElementById("tr-q"); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } };
    root.querySelectorAll(".tr-chk").forEach((c) => { c.onchange = () => { if (c.checked) view.sel.add(c.value); else view.sel.delete(c.value); render(); }; });
    const all = root.querySelector("#tr-all");
    if (all) all.onchange = () => { list.forEach((x) => { const k = x.kind + "|" + x.r.id; if (all.checked) view.sel.add(k); else view.sel.delete(k); }); render(); };
    root.querySelectorAll(".tr-one-restore").forEach((b) => { b.onclick = () => restore([b.dataset.k]); });
    root.querySelectorAll(".tr-one-purge").forEach((b) => { b.onclick = () => purge([b.dataset.k]); });
    root.querySelector("#tr-restore").onclick = () => restore([...view.sel]);
    root.querySelector("#tr-purge").onclick = () => purge([...view.sel]);
  }

  async function share() {
    // Publish right away, so teammates see the restore or permanent delete.
    if (window.MB_DATA && window.MB_DATA.shareFolderConfigured && await window.MB_DATA.shareFolderConfigured()) {
      await window.MB_DATA.publishBudgetEvents({ skipConfirm: true });
    }
  }

  async function restore(keys) {
    if (!keys.length) return;
    const data = S.state.data, bin = S.ensureBin(data), now = new Date().toISOString();
    let n = 0;
    keys.forEach((k) => {
      const [kind, id] = k.split("|");
      const row = bin[kind].find((x) => x.id === id);
      if (!row) return;
      bin[kind] = bin[kind].filter((x) => x.id !== id);
      const links = row._links || [];
      const r = { ...row, updatedAt: now, updatedBy: S.state.currentUserId || row.updatedBy };
      delete r.deletedAt; delete r.deletedBy; delete r._links;
      (data[kind] = data[kind] || []).push(r);
      // An event gets its budget line links back, when those lines still exist.
      if (kind === "events") links.forEach((aid) => {
        const a = (data.activities || []).find((x) => x.id === aid);
        if (a && !(a.eventIds || []).includes(id)) { a.eventIds = [...(a.eventIds || []), id]; a.updatedAt = now; a.updatedBy = S.state.currentUserId || a.updatedBy; }
      });
      n++;
    });
    keys.forEach((k) => view.sel.delete(k));
    S.scheduleSave(); S.notify();
    S.toast(`${n} item(s) restored`, "success");
    await share();
    render();
  }

  async function purge(keys) {
    if (!keys.length) return;
    if (!(await S.confirmDialog(`Permanently delete ${keys.length} item(s)? They will be gone for the whole team. This cannot be undone.`))) return;
    const data = S.state.data, bin = S.ensureBin(data);
    const purged = new Set(data.purgedIds || []);
    keys.forEach((k) => {
      const [kind, id] = k.split("|");
      bin[kind] = bin[kind].filter((x) => x.id !== id);
      purged.add(id);
      view.sel.delete(k);
    });
    data.purgedIds = [...purged];
    S.scheduleSave(); S.notify();
    S.toast(`${keys.length} item(s) permanently deleted`, "success");
    await share();
    render();
  }

  window.MB_TRASH = { render };
})();
