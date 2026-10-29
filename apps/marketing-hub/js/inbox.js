// Email inbox: events proposed from emails, waiting for a person to confirm them.
// Proposals live in marketing-hub-inbox.json in the shared folder (written by Claude when you
// send it an email). Nothing reaches the real data until someone opens a proposal in the normal
// event form and saves it. Format: see "Email inbox" in README.md.
(function () {
  const S = window.MB_STATE;
  const FILE = "marketing-hub-inbox.json";
  let cache = { items: [] };
  let showDone = false;

  const canReview = () => !window.MB_AUTH || window.MB_AUTH.can("editCampaign");
  const SH = () => window.MB_SHARE;
  const norm = (x) => String(x || "").trim().toLowerCase();
  const fmtD = (d) => d ? S.fmtDate(d) : "-";
  const fmtDT = (iso) => { const d = new Date(iso || ""); return isNaN(d) ? "" : d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); };

  async function dir(ask) {
    const sh = SH();
    if (!sh || !sh.supported()) return null;
    const d = await sh.savedFolder();
    if (!d) return null;
    const ok = ask ? await sh.ensurePerm(d, "readwrite") : await sh.hasPerm(d, "readwrite");
    return ok ? d : null;
  }
  async function readFile(d) { try { return (await SH().readJson(d, FILE)) || { version: 1, items: [] }; } catch (e) { return { version: 1, items: [] }; } }

  // Combine two inbox files (bridge): per item, a decided one wins over pending; newest decision wins.
  function mergeFiles(a, b) {
    const m = {};
    [a, b].forEach((f) => ((f && f.items) || []).forEach((it) => {
      const c = m[it.id];
      const score = (x) => (x.status && x.status !== "pending" ? "1" : "0") + String(x.decidedAt || "");
      if (!c || score(it) > score(c)) m[it.id] = it;
    }));
    return { version: 1, items: Object.values(m).sort((x, y) => String(y.receivedAt || "").localeCompare(String(x.receivedAt || ""))) };
  }

  const pending = () => (cache.items || []).filter((x) => (!x.status || x.status === "pending") && !existingFor(x));

  async function refresh(connected) {
    const pill = document.getElementById("inbox-pill");
    if (!pill) return;
    if (!connected || !canReview()) { pill.classList.add("hidden"); return; }
    const d = await dir(false);
    if (!d) { pill.classList.add("hidden"); return; }
    cache = await readFile(d);
    const n = pending().length;
    pill.textContent = `Inbox ${n}`;
    pill.classList.toggle("hidden", n === 0);
    pill.onclick = () => openInbox();
  }

  // Turn a proposal (names as written in the email) into the event form's fields (ids).
  function toPreset(p) {
    const D = S.state.data, set = D.settings;
    const warn = [];
    const ents = S.uniqueEntities ? S.uniqueEntities() : (set.entities || []);
    const byName = (arr, n) => n ? (arr || []).find((x) => norm(x.name) === norm(n)) : null;
    let ent = p.entityId ? S.entityById(p.entityId) : byName(ents, p.entity);
    if (p.entity && !ent) warn.push(`Entity "${p.entity}" not found: pick it in the form.`);
    const owner = byName(set.users, p.owner);
    if (p.owner && !owner) warn.push(`Owner "${p.owner}" is not a user: pick an owner in the form.`);
    const svp = byName(set.svps, p.svp);
    if (p.svp && !svp) warn.push(`SVP "${p.svp}" not found.`);
    const camp = byName((D.events || []).filter((x) => x.kind === "Campaign"), p.campaign);
    if (p.campaign && !camp) warn.push(`Campaign "${p.campaign}" not found.`);
    const countryIds = [], missingC = [];
    (p.countries || []).forEach((c) => { const m = byName(set.countries, c); if (m) countryIds.push(m.id); else missingC.push(c); });
    if (missingC.length) warn.push(`Countries not in the list: ${missingC.join(", ")}.`);
    if (!p.start) warn.push("No date found in the email: set the start date.");
    const src = p._source || {};
    const note = [p.notes || "", src.subject ? `From email: "${src.subject}"${src.from ? " (" + src.from + (src.date ? ", " + src.date : "") + ")" : ""}` : ""].filter(Boolean).join("\n\n");
    const preset = {
      name: p.name || src.subject || "",
      kind: p.kind === "Campaign" ? "Campaign" : "Event",
      start: p.start || new Date().toISOString().slice(0, 10),
      end: p.end || "",
      entityId: ent ? ent.id : "",
      cluster: ent ? (ent.group || "") : (p.cluster || ""),
      ownerId: owner ? owner.id : (S.state.currentUserId || ""),
      svpId: svp ? svp.id : "",
      campaignId: camp ? camp.id : "",
      campaignCode: p.campaignCode || "",
      countryIds,
      partners: (p.partners || []).map((x) => typeof x === "string" ? { name: x, role: "", coFunding: 0 } : { name: x.name || "", role: x.role || "", coFunding: x.coFunding || 0 }),
      content: (p.links || []).map((x) => typeof x === "string" ? { label: "Link", url: x } : { label: x.label || "Link", url: x.url || "" }),
      info: note,
      _bmode: "none", // agenda only by default; add a budget line in the form if needed
    };
    return { preset, warn, entName: ent ? ent.name : (p.entity || "") };
  }

  // Is this proposal already on the agenda? Same start date, and the same name or one name
  // containing the other (ignoring case and punctuation). Also true when its event id exists.
  function existingFor(it) {
    const p = it.proposal || {};
    const evs = S.state.data.events || [];
    if (it.eventId) { const e = evs.find((x) => x.id === it.eventId); if (e) return e; }
    const clean = (x) => norm(x).replace(/\(date tbc\)/g, "").replace(/[^a-z0-9]+/g, " ").trim();
    const n = clean(p.name);
    if (!n || !p.start) return null;
    return evs.find((e) => e.start === p.start && (clean(e.name) === n || clean(e.name).includes(n) || n.includes(clean(e.name)))) || null;
  }

  async function decide(id, status, eventId) {
    const d = await dir(true);
    if (!d) { S.toast("No access to the shared folder.", "error"); return false; }
    const f = await readFile(d);
    const it = (f.items || []).find((x) => x.id === id);
    if (!it) return false;
    it.status = status;
    it.decidedAt = new Date().toISOString();
    it.decidedBy = ((S.userById && S.userById(S.state.currentUserId)) || {}).name || "";
    if (eventId) it.eventId = eventId;
    await SH().writeJson(d, FILE, f);
    cache = f;
    if (window.MB_DATA && window.MB_DATA.bridgeSync) window.MB_DATA.bridgeSync({ auto: true, quiet: true });
    return true;
  }

  function openInbox() {
    const items = (cache.items || []).filter((x) => showDone || !x.status || x.status === "pending")
      .sort((a, b) => (existingFor(a) ? 1 : 0) - (existingFor(b) ? 1 : 0));
    const doneN = (cache.items || []).length - pending().length;
    const card = (it) => {
      const p = { ...(it.proposal || {}), _source: it.source };
      const { warn, entName } = toPreset(p);
      const src = it.source || {};
      const done = it.status && it.status !== "pending";
      const exists = !done ? existingFor(it) : null;
      return `<div class="ib-item${done ? " done" : ""}">
        <div class="ib-head"><span class="ib-title">${S.escapeHtml(p.name || src.subject || "(no name)")}</span>
          ${done ? `<span class="ib-status ${it.status}">${it.status === "accepted" ? "Added" : "Rejected"}${it.decidedBy ? " by " + S.escapeHtml(it.decidedBy) : ""}</span>` : ""}</div>
        <div class="ib-meta">Email: ${S.escapeHtml(src.subject || "-")}${src.from ? " &middot; from " + S.escapeHtml(src.from) : ""}${src.date ? " &middot; " + S.escapeHtml(src.date) : ""}${it.receivedAt ? " &middot; proposed " + S.escapeHtml(fmtDT(it.receivedAt)) : ""}</div>
        <div class="ib-grid">
          <span class="k">Type</span><span>${p.kind === "Campaign" ? "Campaign" : "Event"}</span>
          <span class="k">Date</span><span>${fmtD(p.start)}${p.end && p.end !== p.start ? " to " + fmtD(p.end) : ""}</span>
          <span class="k">Entity</span><span>${S.escapeHtml(entName || "-")}</span>
          ${p.owner ? `<span class="k">Owner</span><span>${S.escapeHtml(p.owner)}</span>` : ""}
          ${(p.countries || []).length ? `<span class="k">Countries</span><span>${S.escapeHtml(p.countries.join(", "))}</span>` : ""}
          ${(p.partners || []).length ? `<span class="k">Partners</span><span>${S.escapeHtml(p.partners.map((x) => typeof x === "string" ? x : x.name).join(", "))}</span>` : ""}
          ${p.notes ? `<span class="k">Notes</span><span>${S.escapeHtml(p.notes).slice(0, 300)}</span>` : ""}
        </div>
        ${exists ? `<div class="ib-warn" style="background:#f0fdf4;border-color:#bbf7d0;color:#166534">Already in Marketing Hub as "${S.escapeHtml(exists.name)}" (${fmtD(exists.start)}). Nothing to add.</div>` : ""}
        ${!done && !exists && warn.length ? `<div class="ib-warn">${warn.map(S.escapeHtml).join("<br>")}</div>` : ""}
        ${!done && exists ? `<div class="ib-actions"><button class="secondary ib-handled" data-id="${it.id}" data-ev="${exists.id}">Mark as handled</button></div>` : ""}
        ${!done && !exists ? `<div class="ib-actions"><button class="secondary ib-reject" data-id="${it.id}">Reject</button><button class="primary ib-review" data-id="${it.id}">Review &amp; add</button></div>` : ""}
      </div>`;
    };
    const m = S.openModal(`
      <h2>Email inbox</h2>
      <p class="muted small">Events proposed from emails. Nothing is added until you open a proposal, check it in the event form and save it.</p>
      ${items.length ? items.map(card).join("") : `<p class="muted">No proposals waiting.</p>`}
      <div class="actions" style="justify-content:space-between">
        ${doneN ? `<button class="link" id="ib-toggle">${showDone ? "Hide handled" : `Show handled (${doneN})`}</button>` : "<span></span>"}
        <button class="secondary" id="ib-close">Close</button>
      </div>`, { cls: "modal-form" });
    m.querySelector("#ib-close").onclick = S.closeModal;
    const t = m.querySelector("#ib-toggle"); if (t) t.onclick = () => { showDone = !showDone; openInbox(); };
    m.querySelectorAll(".ib-reject").forEach((b) => { b.onclick = async () => {
      if (!(await S.confirmDialog("Reject this proposal? It will not be added. It stays listed under handled items."))) return openInbox();
      if (await decide(b.dataset.id, "rejected")) S.toast("Proposal rejected", "success");
      await refresh(true); openInbox();
    }; });
    m.querySelectorAll(".ib-review").forEach((b) => { b.onclick = () => review(b.dataset.id); });
    m.querySelectorAll(".ib-handled").forEach((b) => { b.onclick = async () => {
      if (await decide(b.dataset.id, "accepted", b.dataset.ev)) S.toast("Marked as handled", "success");
      await refresh(true); openInbox();
    }; });
  }

  function review(id) {
    const it = (cache.items || []).find((x) => x.id === id);
    if (!it || !window.MB_TIMELINE || !window.MB_TIMELINE.openCampaignModal) return;
    const { preset } = toPreset({ ...(it.proposal || {}), _source: it.source });
    S.closeModal();
    window.MB_TIMELINE.openCampaignModal(null, {
      preset,
      onSaved: async (ev) => {
        await decide(id, "accepted", ev && ev.id);
        await refresh(true);
        // Share it with the team straight away, like any other change.
        if (window.MB_DATA && window.MB_DATA.shareFolderConfigured && await window.MB_DATA.shareFolderConfigured()) {
          await window.MB_DATA.publishBudgetEvents({ skipConfirm: true });
        }
        if (pending().length) openInbox();
      },
    });
  }

  window.MB_INBOX = { refresh, mergeFiles, toPreset, open: () => openInbox() };
})();
