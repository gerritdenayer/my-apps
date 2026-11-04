// One-time cleanup of the 2026 test-year data (Settings > Data & sharing, admins only).
// It moves values to the fields the app now uses and removes what is no longer used:
//  1. Events whose event type is really a goal get that goal; their type becomes "Event"
//     (campaigns: empty, for the owner to choose).
//  2. Events without a goal get one from their linked budget lines' A&P category, when all
//     those lines point to the same goal.
//  3. Budget lines on "ABM - Pan European" move to "ABM", lines on "Digital or Lead generation
//     campaign" move to "Advertising (LinkedIn, Google, ....)". Their A&P category is kept as
//     it was. The two old types are then deleted from the setup.
//  3b. Budget lines whose type no longer exists in the setup (deleted earlier) get a real one:
//     content work -> "Whitepaper, Content and Sales enablement", Google / LinkedIn ads ->
//     "Advertising". Anything else is listed and left alone.
//  3c. Budget lines no longer have an activity type: each line's A&P category is made explicit
//     (taken from its type when it was inherited), then the type is removed from the line.
//     The old types and the types that are really goals are deleted from the setup when no
//     campaign or event uses them any more.
//  4. Events with no SVP / vertical and exactly one old "Domains" tag that matches an SVP /
//     vertical name get that value. Then the hidden "domains" and "scope" fields are removed.
//  5. Rows still pointing at the old "None" SVP point at N.A. directly.
// Everything it changes is stamped as updated (by the admin, now), so the shared-folder merge
// and the second-folder bridge take the cleaned rows. Running it again finds nothing to do.
(function () {
  const S = window.MB_STATE;
  const low = (s) => String(s || "").trim().toLowerCase();

  function plan() {
    const d = S.state.data, set = d.settings;
    const types = set.activityTypes || [];
    const tByName = (n) => types.find((t) => low(t.name) === low(n));
    const abmPan = tByName("ABM - Pan European"), abm = tByName("ABM");
    const digLead = tByName("Digital or Lead generation campaign");
    const adv = types.find((t) => low(t.name).startsWith("advertising"));
    const evType = tByName("Event");
    const typeAp = (id) => { const t = types.find((x) => x.id === id); return (t && t.apCategoryId) || ""; };
    const apGoal = {};
    (S.GOALS || []).forEach((g) => { const ap = S.apCategoryForGoal(g.key); if (ap) apGoal[ap] = g.key; });
    const steps = [];
    const evs = d.events || [], acts = d.activities || [];
    const svps = set.svps || [];
    const aliases = set.svpAliases || {};

    // 1 + 2: goals on events
    evs.forEach((e) => {
      const fromType = S.goalOfType(e.activityTypeId);
      if (fromType) {
        const newType = (e.kind || "Event") === "Campaign" ? "" : (evType ? evType.id : "");
        steps.push({ kind: "event", id: e.id, what: `Goal ${S.goalLabel(e.goal || fromType)}, event type ${newType ? "Event" : "(empty)"}`, name: e.name,
          fix: (x) => { if (!x.goal) x.goal = fromType; x.activityTypeId = newType; } });
        return;
      }
      if (e.goal) return;
      const goals = new Set(acts.filter((a) => (a.eventIds || []).includes(e.id))
        .map((a) => apGoal[a.apCategoryId || typeAp(a.activityTypeId)]).filter(Boolean));
      if (goals.size === 1) {
        const g = [...goals][0];
        steps.push({ kind: "event", id: e.id, what: `Goal ${S.goalLabel(g)} (from its budget lines)`, name: e.name, fix: (x) => { x.goal = g; } });
      }
    });
    // 3: budget lines (and events, if any) on the two old types
    const remap = [];
    if (abmPan && abm) remap.push([abmPan, abm]);
    if (digLead && adv) remap.push([digLead, adv]);
    remap.forEach(([from, to]) => {
      evs.filter((e) => e.activityTypeId === from.id).forEach((e) => {
        steps.push({ kind: "event", id: e.id, what: `Type ${from.name} → ${to.name}`, name: e.name, fix: (x) => { x.activityTypeId = to.id; } });
      });
    });
    // 3b: lines (and events) pointing at a type that is gone
    const content = types.find((t) => low(t.name).startsWith("whitepaper"));
    const known = new Set(types.map((t) => t.id));
    const apName = (id) => { const c = (set.apCategories || []).find((x) => x.id === id); return c ? c.name : ""; };
    [["event", evs]].forEach(([k, list]) => list.forEach((r) => {
      if (!r.activityTypeId || known.has(r.activityTypeId)) return;
      const txt = low([r.name, r.vendor, apName(r.apCategoryId)].join(" "));
      const to = /google|linkedin|\bads\b|advertis/.test(txt) ? adv : /content|designer|sales enablement|whitepaper/.test(txt) ? content : null;
      if (to) steps.push({ kind: k, id: r.id, name: r.name, what: `Type (deleted earlier) \u2192 ${to.name}`, fix: (x) => { x.activityTypeId = to.id; } });
      else steps.push({ kind: k, id: r.id, name: r.name, what: "Type was deleted earlier: please pick one", fix: () => {} , noop: true });
    }));
    // 3c: budget lines keep their A&P category and lose the activity type
    const apContent = (set.apCategories || []).find((c) => low(c.name).startsWith("content"));
    const apAds = (set.apCategories || []).find((c) => low(c.name).startsWith("enhance market awareness"));
    acts.forEach((a) => {
      if (!("activityTypeId" in a)) return;
      let ap = a.apCategoryId || typeAp(a.activityTypeId);
      if (!ap) { const txt = low([a.name, a.vendor].join(" ")); ap = /google|linkedin|\bads\b|advertis/.test(txt) && apAds ? apAds.id : /content|designer|whitepaper/.test(txt) && apContent ? apContent.id : ""; }
      const apN = apName(ap);
      steps.push({ kind: "line", id: a.id, name: a.name, quiet: !!a.apCategoryId || !a.activityTypeId,
        what: apN ? `A&P category ${apN} (was set by its type)` : "Activity type removed; please pick an A&P category",
        fix: (x) => { if (!x.apCategoryId && ap) x.apCategoryId = ap; delete x.activityTypeId; } });
    });
    // 4: domains -> SVP / vertical, then drop the old fields
    evs.forEach((e) => {
      const doms = Array.isArray(e.domains) ? e.domains : [];
      const hasOld = doms.length || (Array.isArray(e.scope) && e.scope.length) || "domains" in e || "scope" in e;
      if (!hasOld) return;
      let svpTxt = "";
      if (!e.svpId && doms.length === 1) {
        const m = svps.find((s) => low(s.name) === low(doms[0]));
        if (m) svpTxt = m.id;
      }
      steps.push({ kind: "event", id: e.id, name: e.name, quiet: !svpTxt,
        what: svpTxt ? `SVP / vertical ${(svps.find((s) => s.id === svpTxt) || {}).name} (from its old domain tag)` : "Old domain tags removed",
        fix: (x) => { if (svpTxt && !x.svpId) x.svpId = svpTxt; delete x.domains; delete x.scope; } });
    });
    // 5: rows on an old SVP id
    [["line", acts], ["event", evs]].forEach(([k, list]) => list.forEach((r) => {
      if (r.svpId && aliases[r.svpId]) steps.push({ kind: k, id: r.id, name: r.name, quiet: true, what: "SVP / vertical None → N.A.", fix: (x) => { x.svpId = aliases[x.svpId]; } });
    }));
    // Types to delete: the two old ones, and the goal-named ones that no event uses after this.
    const evTypeAfter = new Set(evs.map((e) => {
      if (S.goalOfType(e.activityTypeId)) return (e.kind || "Event") === "Campaign" ? "" : (evType ? evType.id : "");
      const r = remap.find(([from]) => from.id === e.activityTypeId);
      return r ? r[1].id : e.activityTypeId;
    }).filter(Boolean));
    const delTypes = types.filter((t) => remap.some(([from]) => from === t) || (S.goalOfType(t.id) && !evTypeAfter.has(t.id)));
    return { steps, delTypes };
  }

  function apply(p) {
    const d = S.state.data, now = new Date().toISOString(), me = S.state.currentUserId || "";
    const touched = new Set();
    p.steps.forEach((st) => {
      const list = st.kind === "line" ? d.activities : d.events;
      const row = (list || []).find((x) => x.id === st.id);
      if (!row) return;
      st.fix(row);
      if (!st.noop) touched.add(row);
    });
    touched.forEach((row) => { row.updatedAt = now; row.updatedBy = me; });
    // Delete the old types only when nothing uses them any more.
    const used = (id) => (d.activities || []).some((a) => a.activityTypeId === id) || (d.events || []).some((e) => e.activityTypeId === id);
    const gone = p.delTypes.filter((t) => !used(t.id));
    d.settings.activityTypes = (d.settings.activityTypes || []).filter((t) => !gone.includes(t));
    S.scheduleSave(); S.notify();
    return { rows: touched.size, types: gone.map((t) => t.name) };
  }

  function cardHtml() {
    if (!(window.MB_AUTH && window.MB_AUTH.canSeeSettings && window.MB_AUTH.canSeeSettings())) return "";
    return `<div class="card" id="cu-card">
      <h2>One-time cleanup: 2026 test year</h2>
      <p class="muted small">Moves 2026 values to the fields the app now uses (goals, event types, A&amp;P categories on budget lines, SVP / vertical) and removes what is no longer used (activity types on budget lines, old and goal-named types, hidden domain tags). Preview first; nothing changes until you click Apply. Afterwards, publish the setup and your budget &amp; events.</p>
      <div style="display:flex;gap:8px;margin-top:8px"><button class="secondary" id="cu-preview" type="button">Preview cleanup</button></div>
      <div id="cu-out" style="margin-top:10px"></div>
    </div>`;
  }

  function wire(root) {
    const btn = root.querySelector("#cu-preview");
    if (!btn) return;
    const out = root.querySelector("#cu-out");
    btn.onclick = () => {
      const p = plan();
      const shown = p.steps.filter((s) => !s.quiet);
      const quiet = p.steps.length - shown.length;
      if (!p.steps.some((s) => !s.noop) && !p.delTypes.length) { out.innerHTML = `<p class="muted small">Nothing left to clean up.</p>`; return; }
      const rowsTouched = new Set(p.steps.filter((s) => !s.noop).map((s) => s.kind + s.id)).size;
      out.innerHTML = `
        <p><strong>${rowsTouched} row${rowsTouched === 1 ? "" : "s"} will change</strong>${p.delTypes.length ? `, and ${p.delTypes.length} type${p.delTypes.length === 1 ? "" : "s"} will be deleted (${p.delTypes.map((t) => S.escapeHtml(t.name)).join(", ")})` : ""}.</p>
        <div style="max-height:280px;overflow:auto;border:1px solid #eef0f3;border-radius:8px">
          <table class="tl-mini" style="width:100%;font-size:12.5px"><thead><tr><th>Item</th><th>Change</th></tr></thead><tbody>
          ${shown.map((s) => `<tr><td>${S.escapeHtml(s.name || "(no name)")} <span class="muted small">${s.kind === "line" ? "budget line" : "event"}</span></td><td>${S.escapeHtml(s.what)}</td></tr>`).join("")}
          </tbody></table></div>
        ${quiet ? `<p class="muted small" style="margin:6px 0 0">Plus ${quiet} small change${quiet === 1 ? "" : "s"} not listed: activity type removed from budget lines that already had their A&amp;P category, old domain tags removed, old "None" SVP values pointed at N.A.</p>` : ""}
        <div style="display:flex;gap:8px;margin-top:10px"><button class="primary" id="cu-apply" type="button">Apply cleanup</button></div>`;
      out.querySelector("#cu-apply").onclick = async () => {
        if (!(await S.confirmDialog(`Apply the cleanup to ${rowsTouched} rows${p.delTypes.length ? " and delete " + p.delTypes.length + " old types" : ""}? Then publish the setup and your budget & events so everyone gets it.`))) return;
        const r = apply(plan());
        // The tab redraws after the change, so the result goes in a message.
        S.toast(`Cleanup done: ${r.rows} rows updated${r.types.length ? `, deleted ${r.types.join(", ")}` : ""}. Now click Publish setup (Data & sharing), then Publish in the top bar.`, "success");
        if (window.MB_APP && window.MB_APP.refreshSetupStatus) window.MB_APP.refreshSetupStatus();
      };
    };
  }

  window.MB_CLEANUP = { plan, apply, cardHtml, wire };
})();
