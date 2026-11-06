// Outcomes report: what campaigns and events delivered, per goal. Each goal (Lead Generation,
// Awareness, Customer Intimacy) has its own results and calculated KPIs (no-show rate, cost per
// MQL, engagement rate, accounts attending...), combined with the spend of the linked budget lines.
(function () {
  const S = window.MB_STATE;

  const view = {
    year: new Date().getFullYear(),  // number or "all"
    quarter: "",
    month: "",
    goal: "all",                     // all | lead | awareness | intimacy | none
    dim: "group",                    // m1 | group | entity | svp | goal | month | quarter
    scope: { m1: "", cluster: "", entityId: "" },
    svpFilter: "",
    kind: "all",                     // all | Event | Campaign
    chartMetric: "",                 // a metric or KPI key; "" = the goal's first
    chart: null,
  };

  const DIM_LABELS = { m1: "M1 zone", group: "Cluster", entity: "Entity", svp: "SVP / vertical", goal: "Goal", month: "Month", quarter: "Quarter" };
  const GOAL_TABS = [["all", "All goals"], ["lead", "Lead Generation"], ["awareness", "Awareness"], ["intimacy", "Customer Intimacy"], ["none", "No goal"]];
  const M = (k) => S.OUTCOME_METRICS.find((m) => m.key === k);

  // Calculated KPIs per goal. ratio: num / den over the items that have both; cost: actual spend of
  // the items that have the metric, divided by it; nos: no-show rate (1 - attended / registered).
  const KPIS = {
    lead: [
      { key: "noshow", label: "No-show rate", type: "noshow", num: "attendees", den: "registrations", fmt: "pct", low: true },
      { key: "conv", label: "MQL to SQL", type: "ratio", num: "sql", den: "mql", fmt: "pct" },
      { key: "cpmql", label: "Cost per MQL", type: "cost", of: "mql", fmt: "money", low: true },
      { key: "cpsql", label: "Cost per SQL", type: "cost", of: "sql", fmt: "money", low: true },
      { key: "piperoi", label: "Pipeline per € spent", type: "roi", of: "pipeline", fmt: "x" },
      { key: "revroi", label: "Revenue per € spent", type: "roi", of: "revenue", fmt: "x" },
    ],
    awareness: [
      { key: "engrate", label: "Engagement rate", type: "ratio", num: "engagement", den: "reach", fmt: "pct" },
      { key: "cpk", label: "Cost per 1,000 reached", type: "cost", of: "reach", per: 1000, fmt: "money", low: true },
      { key: "cpcontact", label: "Cost per new contact", type: "cost", of: "newcontacts", fmt: "money", low: true },
      { key: "noshow", label: "No-show rate", type: "noshow", num: "attendees", den: "registrations", fmt: "pct", low: true },
    ],
    intimacy: [
      { key: "attrate", label: "Accounts attending vs invited", type: "ratio", num: "accAttended", den: "accInvited", fmt: "pct" },
      { key: "cpacc", label: "Cost per attending account", type: "cost", of: "accAttended", fmt: "money", low: true },
      { key: "meetper", label: "Follow-up meetings per item", type: "peritem", of: "meetings", fmt: "num1" },
      { key: "inflroi", label: "Influenced pipeline per € spent", type: "roi", of: "influenced", fmt: "x" },
    ],
  };
  // Headline cards per goal: metric keys (actual vs target) or KPI keys.
  const CARDS = {
    lead: ["mql", "pipeline", "noshow", "cpmql", "piperoi"],
    awareness: ["reach", "engrate", "newcontacts", "cpk"],
    intimacy: ["accAttended", "satisfaction", "meetings", "influenced"],
  };

  // ---- helpers ----
  function parseYMD(s) { if (!s) return null; const [y, m, d] = s.split("-").map(Number); return { y, m: m - 1, d }; }
  function startParts(ev) { return parseYMD(ev.start); }

  function resolvedEntityId(ev) {
    const data = S.state.data;
    if (ev.entityId) return S.canonicalEntityId(ev.entityId);
    if (ev.primaryActivityId) {
      const a = (data.activities || []).find((x) => x.id === ev.primaryActivityId);
      if (a && a.entityId) return S.canonicalEntityId(a.entityId);
    }
    if (ev.entity) { // legacy fallback
      const m = S.uniqueEntities().find((x) => (x.name || "").trim().toLowerCase() === ev.entity.trim().toLowerCase());
      if (m) return m.id;
    }
    return "";
  }

  // Cluster for an outcome row: the organising entity's cluster, falling back to the event's
  // stored cluster, so this matches the timeline and the cluster filter below.
  function clusterOf(ev) {
    const eid = resolvedEntityId(ev);
    const ent = eid ? S.entityById(eid) : null;
    return (ent && (ent.group || "").trim()) || (ev.cluster || "").trim() || "Unspecified";
  }
  function matchesScope(ev) {
    const sc = view.scope || {};
    if (!sc.m1 && !sc.cluster && !sc.entityId) return true;
    const eid = resolvedEntityId(ev);
    const ent = eid ? S.entityById(eid) : null;
    if (sc.entityId) return !!eid && S.canonicalEntityId(eid) === S.canonicalEntityId(sc.entityId);
    if (sc.cluster) {
      if (clusterOf(ev) !== sc.cluster) return false;
      if (sc.m1 && ent && (ent.m1 || "") !== sc.m1) return false;
      return true;
    }
    if (sc.m1) return !!ent && (ent.m1 || "") === sc.m1;
    return true;
  }

  function eventSpend(ev) {
    // Even-split allocation: a line shared across N campaigns counts 1/N toward each.
    const lines = (S.state.data.activities || []).filter((a) => (a.eventIds || []).includes(ev.id));
    const share = (a) => { const n = (a.eventIds || []).length; return n > 0 ? 1 / n : 1; };
    const fNet = lines.reduce((s, a) => s + (((a.forecastGross || 0) - (a.forecastPartner || 0)) * share(a)), 0);
    const aNet = lines.reduce((s, a) => s + (((a.actualGross || 0) - (a.actualPartner || 0)) * share(a)), 0);
    return { fNet, aNet };
  }

  function oc(ev, key, sub) { const o = (ev.outcomes || {})[key] || {}; return +o[sub] || 0; }

  function dimOf(ev) {
    const p = startParts(ev);
    if (view.dim === "month") {
      if (!p) return { key: "0000-00", label: "No date" };
      const dt = new Date(p.y, p.m, 1);
      return { key: `${p.y}-${String(p.m + 1).padStart(2, "0")}`, label: dt.toLocaleDateString("en-GB", { month: "short", year: "numeric" }) };
    }
    if (view.dim === "quarter") {
      if (!p) return { key: "0000-0", label: "No date" };
      const q = Math.floor(p.m / 3) + 1;
      return { key: `${p.y}-${q}`, label: `Q${q} ${p.y}` };
    }
    if (view.dim === "goal") {
      const g = S.goalLabel(ev.goal);
      return { key: ev.goal || "_none", label: g || "No goal" };
    }
    if (view.dim === "svp") {
      const svp = ev.svpId ? S.svpById(ev.svpId) : null;
      return { key: S.canonicalSvpId(ev.svpId) || "_none", label: svp ? svp.name : "Unspecified" };
    }
    // m1, group or entity -> resolve entity
    const eid = resolvedEntityId(ev);
    const ent = eid ? S.entityById(eid) : null;
    if (view.dim === "entity") return { key: eid || "_none", label: ent ? ent.name : "Unspecified" };
    if (view.dim === "m1") { const m1 = (ent && ent.m1) || "Unspecified"; return { key: m1, label: m1 }; }
    const g = clusterOf(ev);
    return { key: g, label: g };
  }

  function passesFilters(ev, ignoreGoal) {
    if (!S.inPeriod(ev.start, view.year, view.quarter, view.month)) return false;
    if (view.kind !== "all" && (ev.kind || "Event") !== view.kind) return false;
    if (!matchesScope(ev)) return false;
    if (view.svpFilter && S.canonicalSvpId(ev.svpId) !== view.svpFilter) return false;
    if (!ignoreGoal && view.goal !== "all") {
      if (view.goal === "none") { if (ev.goal) return false; }
      else if (ev.goal !== view.goal) return false;
    }
    return true;
  }
  const goalSel = () => (["lead", "awareness", "intimacy"].includes(view.goal) ? view.goal : "");
  const kpiDefs = () => KPIS[goalSel()] || [];

  function blankAgg(label, key) {
    const metrics = {};
    S.OUTCOME_METRICS.forEach((m) => { metrics[m.key] = { t: 0, a: 0, p: 0, nT: 0, nA: 0 }; });
    return { key, label, count: 0, metrics, fNet: 0, aNet: 0, spendWith: {}, pairs: {} };
  }
  function addEvent(agg, ev) {
    agg.count++;
    const o = ev.outcomes || {};
    S.OUTCOME_METRICS.forEach((m) => {
      const x = o[m.key] || {}, r = agg.metrics[m.key];
      const t = +(m.kind === "pa" ? x.p : x.t) || 0, a = +x.a || 0;
      r.t += t; r.p += m.kind === "pa" ? t : 0; r.a += a;
      if (t) r.nT++; if (a) r.nA++;
    });
    const sp = eventSpend(ev);
    agg.fNet += sp.fNet; agg.aNet += sp.aNet;
    S.OUTCOME_METRICS.forEach((m) => { if (+((o[m.key] || {}).a) > 0) agg.spendWith[m.key] = (agg.spendWith[m.key] || 0) + sp.aNet; });
    Object.values(KPIS).flat().filter((k) => k.num).forEach((k) => {
      const n = +((o[k.num] || {}).a) || 0, d = +((o[k.den] || {}).a) || 0;
      if (n > 0 && d > 0) { const pr = agg.pairs[k.key] = agg.pairs[k.key] || { n: 0, d: 0 }; pr.n += n; pr.d += d; }
    });
  }
  function merge(t, r) {
    t.count += r.count; t.fNet += r.fNet; t.aNet += r.aNet;
    S.OUTCOME_METRICS.forEach((m) => { const a = t.metrics[m.key], b = r.metrics[m.key]; ["t", "a", "p", "nT", "nA"].forEach((k) => { a[k] += b[k]; }); });
    Object.entries(r.spendWith).forEach(([k, v]) => { t.spendWith[k] = (t.spendWith[k] || 0) + v; });
    Object.entries(r.pairs).forEach(([k, v]) => { const pr = t.pairs[k] = t.pairs[k] || { n: 0, d: 0 }; pr.n += v.n; pr.d += v.d; });
  }
  // Actual and target of a metric for a row: summed, or averaged for scores.
  function mval(r, key) {
    const m = M(key), x = r.metrics[key];
    if (m.agg === "avg") return { a: x.nA ? x.a / x.nA : 0, t: x.nT ? x.t / x.nT : 0 };
    return { a: x.a, t: x.t };
  }
  function kpiVal(r, k) {
    if (k.type === "ratio") { const pr = r.pairs[k.key]; return pr && pr.d ? pr.n / pr.d : null; }
    if (k.type === "noshow") { const pr = r.pairs[k.key]; return pr && pr.d ? Math.max(0, 1 - pr.n / pr.d) : null; }
    if (k.type === "cost") { const n = r.metrics[k.of].a, sp = r.spendWith[k.of] || 0; return n > 0 && sp > 0 ? sp / n * (k.per || 1) : null; }
    if (k.type === "roi") { const v = r.metrics[k.of].a, sp = r.spendWith[k.of] || 0; return sp > 0 ? v / sp : null; }
    if (k.type === "peritem") return r.count ? r.metrics[k.of].a / r.count : null;
    return null;
  }
  function fmtK(v, f) {
    if (v === null || v === undefined || isNaN(v)) return "-";
    if (f === "pct") return Math.round(v * 100) + "%";
    if (f === "money") return S.fmtMoney(v);
    if (f === "x") return v.toFixed(1) + "x";
    if (f === "num1") return (Math.round(v * 10) / 10).toString();
    return S.fmtNum(v);
  }
  const fmtM = (m, v) => m.money ? S.fmtMoney(v) : m.agg === "avg" ? (v ? (Math.round(v * 10) / 10).toString() : "-") : S.fmtNum(v);

  function buildRows() {
    const events = (S.state.data.events || []).filter((ev) => passesFilters(ev));
    const map = {};
    events.forEach((ev) => { const d = dimOf(ev); addEvent(map[d.key] || (map[d.key] = blankAgg(d.label, d.key)), ev); });
    let rows = Object.values(map);
    if (view.dim === "month" || view.dim === "quarter") rows.sort((a, b) => a.key.localeCompare(b.key));
    else rows.sort((a, b) => a.label.localeCompare(b.label));
    return rows;
  }
  function totalsOf(rows) { const t = blankAgg("Total", "_total"); rows.forEach((r) => merge(t, r)); return t; }
  function goalTotals(goal) {
    const t = blankAgg(goal, goal);
    (S.state.data.events || []).filter((ev) => passesFilters(ev, true) && (goal === "none" ? !ev.goal : ev.goal === goal)).forEach((ev) => addEvent(t, ev));
    return t;
  }
  // Metrics shown as columns: the goal's, or (all goals / no goal) every metric with a number.
  function shownMetrics(totals) {
    const g = goalSel();
    if (g) return S.outcomeMetricsFor(g);
    return S.OUTCOME_METRICS.filter((m) => totals.metrics[m.key].a || totals.metrics[m.key].t);
  }

  // ---- render ----
  function render() {
    const root = document.getElementById("tab-outcomes");
    const data = S.state.data;
    if (!data) { root.innerHTML = ""; return; }

    root.innerHTML = `
      <div class="seg o-goals" id="o-goals">${GOAL_TABS.map(([v, l]) => `<button type="button" class="seg-btn ${view.goal === v ? "on" : ""}" data-goal="${v}">${l}</button>`).join("")}</div>
      <div class="filter-bar">
        <div><label>Year</label><select id="o-year">${yearOptions()}</select></div>
        <div><label>Quarter</label><select id="o-quarter">${S.quarterOptions(view.quarter)}</select></div>
        <div><label>Month</label><select id="o-month">${S.monthOptions(view.month)}</select></div>
        <div><label>Group by</label><select id="o-dim">${Object.entries(DIM_LABELS).map(([v, l]) => `<option ${view.dim === v ? "selected" : ""} value="${v}">${l}</option>`).join("")}</select></div>
        ${S.scopeFilterHtml("o", view.scope, null, view.year === "all" ? 0 : view.year)}
        <div><label>SVP / vertical</label><select id="o-svp"><option value="">All</option>${(data.settings.svps || []).map((s) => `<option ${view.svpFilter === s.id ? "selected" : ""} value="${s.id}">${S.escapeHtml(s.name)}</option>`).join("")}</select></div>
        <div><label>Kind</label><select id="o-kind">${[["all", "All"], ["Event", "Events"], ["Campaign", "Campaigns"]].map(([v, l]) => `<option ${view.kind === v ? "selected" : ""} value="${v}">${l}</option>`).join("")}</select></div>
        <div><label>Chart</label><select id="o-chart-metric"></select></div>
        <div class="grow"></div>
        <div><button id="o-export" class="secondary">Export to Excel</button></div>
      </div>
      <div id="outcomes-body"></div>
    `;

    root.querySelectorAll("[data-goal]").forEach((b) => { b.onclick = () => { view.goal = b.dataset.goal; view.chartMetric = ""; render(); }; });
    root.querySelector("#o-year").onchange = (e) => { view.year = e.target.value === "all" ? "all" : +e.target.value; render(); }; // the cluster and entity lists follow the year
    root.querySelector("#o-quarter").onchange = (e) => { view.quarter = e.target.value; renderBody(); };
    root.querySelector("#o-month").onchange = (e) => { view.month = e.target.value; renderBody(); };
    root.querySelector("#o-dim").onchange = (e) => { view.dim = e.target.value; renderBody(); };
    S.wireScopeFilter(root, "o", view.scope, renderBody, null, view.year === "all" ? 0 : view.year);
    root.querySelector("#o-svp").onchange = (e) => { view.svpFilter = e.target.value; renderBody(); };
    root.querySelector("#o-kind").onchange = (e) => { view.kind = e.target.value; renderBody(); };
    root.querySelector("#o-chart-metric").onchange = (e) => { view.chartMetric = e.target.value; drawChart(buildRows()); };
    root.querySelector("#o-export").onclick = exportExcel;

    renderBody();
  }

  function yearOptions() {
    const ys = new Set();
    (S.state.data.events || []).forEach((ev) => { const p = startParts(ev); if (p) ys.add(p.y); });
    ys.add(new Date().getFullYear());
    if (view.year !== "all") ys.add(view.year);
    const list = Array.from(ys).sort();
    return list.map((y) => `<option ${view.year === y ? "selected" : ""} value="${y}">${y}</option>`).join("") +
      `<option ${view.year === "all" ? "selected" : ""} value="all">All years</option>`;
  }

  // Options for the chart: the goal's metrics and KPIs, or every metric with numbers.
  function chartOptions(totals) {
    const list = shownMetrics(totals).map((m) => [m.key, m.label]);
    kpiDefs().forEach((k) => list.push([k.key, k.label]));
    if (!goalSel()) list.unshift(["_spend", "Spend (forecast vs actual)"]);
    return list;
  }

  function renderBody() {
    const host = document.getElementById("outcomes-body");
    const rows = buildRows();
    const totals = totalsOf(rows);
    const noGoal = view.goal === "none" ? 0 : (S.state.data.events || []).filter((ev) => passesFilters(ev, true) && !ev.goal).length;
    const warn = noGoal ? `<div class="o-warn">${noGoal} campaign${noGoal === 1 ? "" : "s"} and events in this selection have no goal yet${view.goal === "all" ? "" : ", so they are not counted here"}. <button type="button" class="linkbtn" id="o-show-nogoal">Show them</button></div>` : "";
    const opts = chartOptions(totals);
    if (!opts.some((o) => o[0] === view.chartMetric)) view.chartMetric = goalSel() ? CARDS[goalSel()][0] : (opts[0] || [""])[0];
    const sel = document.getElementById("o-chart-metric");
    if (sel) sel.innerHTML = opts.map(([v, l]) => `<option value="${v}" ${view.chartMetric === v ? "selected" : ""}>${S.escapeHtml(l)}</option>`).join("");
    if (!rows.length) {
      host.innerHTML = warn + `<div class="card muted">No campaigns or events match. Results are entered on the Outcomes tab of each campaign or event.</div>` + (view.goal === "all" ? "" : "");
      bindWarn(host);
      if (view.chart) { view.chart.destroy(); view.chart = null; }
      return;
    }
    host.innerHTML = `
      ${warn}
      <div class="kpi-row o-kpis">${view.goal === "all" ? overviewCards() : kpiCards(totals)}</div>
      <div id="o-chart-note" class="o-chart-note hidden"></div>
      <div class="chart-wrap"><canvas id="o-chart"></canvas></div>
      <div class="card"><div class="table-wrap">${tableHtml(rows, totals)}</div></div>
    `;
    bindWarn(host);
    host.querySelectorAll("[data-gopen]").forEach((b) => { b.onclick = () => { view.goal = b.dataset.gopen; view.chartMetric = ""; render(); }; });
    drawChart(rows);
  }
  function bindWarn(host) { const b = host.querySelector("#o-show-nogoal"); if (b) b.onclick = () => { view.goal = "none"; view.chartMetric = ""; render(); }; }

  function card(label, value, sub, cls) {
    return `<div class="kpi"><div class="label">${S.escapeHtml(label)}</div><div class="value">${value}</div><div class="delta ${cls || "muted"}">${sub || "&nbsp;"}</div></div>`;
  }
  function kpiCards(t) {
    const g = goalSel();
    const out = [card("Items and actual spend", `${t.count} &middot; ${S.fmtMoney(t.aNet)}`, `${S.fmtMoney(t.fNet)} forecast`)];
    if (!g) {
      shownMetrics(t).slice(0, 4).forEach((m) => { const v = mval(t, m.key); out.push(card(m.label, fmtM(m, v.a), v.t ? `target ${fmtM(m, v.t)}` : "no target")); });
      return out.join("");
    }
    CARDS[g].forEach((key) => {
      const m = M(key);
      if (m) {
        const v = mval(t, key);
        const pct = v.t ? Math.round(v.a / v.t * 100) : null;
        out.push(card(m.label, fmtM(m, v.a), v.t ? `${pct}% of target ${fmtM(m, v.t)}` : "no target set", pct === null ? "muted" : pct >= 100 ? "pos" : "warn"));
      } else {
        const k = kpiDefs().find((x) => x.key === key);
        out.push(card(k.label, fmtK(kpiVal(t, k), k.fmt), kpiHelp(k)));
      }
    });
    return out.join("");
  }
  function kpiHelp(k) {
    if (k.type === "noshow") return "registered but did not attend";
    if (k.type === "cost") return "only items that have this number";
    if (k.type === "roi") return "value / actual spend";
    if (k.type === "ratio") return `${M(k.num).label} / ${M(k.den).label}`;
    return "";
  }
  function overviewCards() {
    const out = [];
    [["lead", ["mql", "pipeline"]], ["awareness", ["reach", "newcontacts"]], ["intimacy", ["accAttended", "satisfaction"]]].forEach(([g, keys]) => {
      const t = goalTotals(g);
      const lines = keys.map((k) => `${fmtM(M(k), mval(t, k).a)} ${S.escapeHtml(M(k).label.toLowerCase())}`).join(" &middot; ");
      out.push(`<div class="kpi o-gcard"><div class="label">${S.escapeHtml(S.goalLabel(g))}</div><div class="value">${t.count} <span class="small muted">items</span></div><div class="delta muted">${lines}<br>${S.fmtMoney(t.aNet)} spent &middot; <button type="button" class="linkbtn" data-gopen="${g}">Open</button></div></div>`);
    });
    const n = goalTotals("none");
    out.push(card("No goal", `${n.count} <span class="small muted">items</span>`, n.count ? `${S.fmtMoney(n.aNet)} spent` : "all items have a goal", n.count ? "warn" : "pos"));
    return out.join("");
  }

  function mCell(r, m) {
    const v = mval(r, m.key);
    return `${fmtM(m, v.a)} <span class="sub">/ ${fmtM(m, v.t)}</span>`;
  }
  function tableHtml(rows, totals) {
    const ms = shownMetrics(totals), ks = kpiDefs();
    const row = (r) => `<td class="num">${r.count}</td>${ms.map((m) => `<td class="num">${mCell(r, m)}</td>`).join("")}
      <td class="num">${S.fmtMoney(r.fNet)}</td><td class="num">${S.fmtMoney(r.aNet)}</td>
      ${ks.map((k) => `<td class="num">${fmtK(kpiVal(r, k), k.fmt)}</td>`).join("")}`;
    const cols = 4 + ms.length + ks.length;
    return `
      <table>
        <thead>
          <tr><th>${DIM_LABELS[view.dim]}</th><th class="num">Items</th>
            ${ms.map((m) => `<th class="num">${S.escapeHtml(m.label)}</th>`).join("")}
            <th class="num">Forecast net</th><th class="num">Actual spend</th>
            ${ks.map((k) => `<th class="num">${S.escapeHtml(k.label)}</th>`).join("")}</tr>
          <tr><th colspan="${cols}" class="sub" style="font-weight:400">Results show actual / target${ms.some((m) => m.kind === "pa") ? " (revenue: actual / potential)" : ""}${ms.some((m) => m.agg === "avg") ? "; satisfaction is the average score" : ""}. ${ks.length ? "Rates and costs only count the items that have the numbers they need." : ""}${!ms.length ? " No results entered yet for this selection." : ""}</th></tr>
        </thead>
        <tbody>${rows.map((r) => `<tr><td class="dim">${S.escapeHtml(r.label)}</td>${row(r)}</tr>`).join("")}</tbody>
        <tfoot><tr class="total-row"><td>Total</td>${row(totals)}</tr></tfoot>
      </table>`;
  }

  function drawChart(rows) {
    const ctx = document.getElementById("o-chart");
    if (!ctx || typeof Chart === "undefined") return;
    if (view.chart) { view.chart.destroy(); view.chart = null; }
    if (window.MB_THEME) window.MB_THEME.chartColors();
    const byDim = " by " + DIM_LABELS[view.dim].toLowerCase();
    const key = view.chartMetric;
    const m = M(key), k = Object.values(KPIS).flat().find((x) => x.key === key);
    const money = { callback: (v) => "€" + new Intl.NumberFormat("en-US").format(v) };
    const plain = { callback: (v) => new Intl.NumberFormat("en-US").format(v) };
    let datasets, title, yTicks;
    if (key === "_spend") {
      datasets = [{ label: "Forecast net", data: rows.map((r) => r.fNet), backgroundColor: "#4bb4e6" }, { label: "Actual spend", data: rows.map((r) => r.aNet), backgroundColor: "#ff7900" }];
      title = "Spend" + byDim; yTicks = money;
    } else if (m) {
      datasets = [
        { label: "Actual", data: rows.map((r) => mval(r, key).a), backgroundColor: "#ff7900" },
        { label: m.kind === "pa" ? "Potential" : "Target", data: rows.map((r) => mval(r, key).t), backgroundColor: "#9aa4ad" },
      ];
      title = m.label + " (actual vs target)" + byDim; yTicks = m.money ? money : plain;
    } else if (k) {
      const vals = rows.map((r) => kpiVal(r, k));
      datasets = [{ label: k.label, data: vals.map((v) => v === null ? null : (k.fmt === "pct" ? Math.round(v * 1000) / 10 : Math.round(v * 100) / 100)), backgroundColor: k.low ? "#4bb4e6" : "#50be87" }];
      title = k.label + byDim + (k.low ? " (lower is better)" : "");
      yTicks = k.fmt === "pct" ? { callback: (v) => v + "%" } : k.fmt === "money" ? money : k.fmt === "x" ? { callback: (v) => v + "x" } : plain;
    } else { datasets = []; title = ""; yTicks = plain; }
    const note = document.getElementById("o-chart-note");
    if (note) {
      const empty = !datasets.length || !(datasets[0].data || []).some((v) => +v);
      note.textContent = empty ? `No numbers yet for this selection. Owners enter results on the Outcomes tab of each campaign or event.` : "";
      note.classList.toggle("hidden", !empty);
    }
    view.chart = new Chart(ctx, {
      type: "bar",
      data: { labels: rows.map((r) => r.label), datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "top" }, title: { display: !!title, text: title } },
        scales: { y: { ticks: yTicks, beginAtZero: true } },
      },
    });
  }

  function exportExcel() {
    const rows = buildRows();
    const totals = totalsOf(rows);
    const ms = shownMetrics(totals), ks = kpiDefs();
    const header = [DIM_LABELS[view.dim], "Items"];
    ms.forEach((m) => { header.push(m.label + " actual", m.label + (m.kind === "pa" ? " potential" : " target")); });
    header.push("Forecast net", "Actual spend");
    ks.forEach((k) => header.push(k.label + (k.fmt === "pct" ? " (%)" : "")));
    const rowArr = (r) => {
      const out = [r.label, r.count];
      ms.forEach((m) => { const v = mval(r, m.key); out.push(m.agg === "avg" ? Math.round(v.a * 10) / 10 : v.a, m.agg === "avg" ? Math.round(v.t * 10) / 10 : v.t); });
      out.push(Math.round(r.fNet), Math.round(r.aNet));
      ks.forEach((k) => { const v = kpiVal(r, k); out.push(v === null ? "" : k.fmt === "pct" ? Math.round(v * 1000) / 10 : Math.round(v * 100) / 100); });
      return out;
    };
    const aoa = [header, ...rows.map(rowArr), rowArr({ ...totals, label: "Total" })];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), "Outcomes");
    const yr = view.year === "all" ? "all-years" : view.year;
    XLSX.writeFile(wb, `marketing-outcomes-${view.goal}-${view.dim}-${yr}.xlsx`);
    S.toast("Excel exported", "success");
  }

  window.MB_OUTCOMES = { render };
})();
