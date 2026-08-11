// Outcomes report tab: campaign/event results (engagement, attendees, registrations,
// MQL, SQL, revenue) combined with budget, grouped/filtered by Group, Entity, SVP,
// Month or Quarter, with cost-per-result and ROI efficiency metrics.
(function () {
  const S = window.MB_STATE;

  const view = {
    year: new Date().getFullYear(),  // number or "all"
    quarter: "",
    month: "",
    dim: "group",                    // m1 | group | entity | svp | month | quarter
    scope: { m1: "", cluster: "", entityId: "" },
    svpFilter: "",
    kind: "all",                     // all | Event | Campaign
    chartMetric: "revenue",          // revenue | attendees | registrations | mql | sql | engagement
    chart: null,
  };

  const DIM_LABELS = { m1: "M1 zone", group: "Cluster", entity: "Entity", svp: "SVP", month: "Month", quarter: "Quarter" };
  const CHART_METRICS = [["revenue", "Revenue vs spend"], ["attendees", "Attendees"], ["registrations", "Registrations"], ["mql", "MQL"], ["sql", "SQL"], ["engagement", "Engagement"]];

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
    if (view.dim === "svp") {
      const svp = ev.svpId ? S.svpById(ev.svpId) : null;
      return { key: ev.svpId || "_none", label: svp ? svp.name : "Unspecified" };
    }
    // m1, group or entity -> resolve entity
    const eid = resolvedEntityId(ev);
    const ent = eid ? S.entityById(eid) : null;
    if (view.dim === "entity") return { key: eid || "_none", label: ent ? ent.name : "Unspecified" };
    if (view.dim === "m1") { const m1 = (ent && ent.m1) || "Unspecified"; return { key: m1, label: m1 }; }
    const g = clusterOf(ev);
    return { key: g, label: g };
  }

  function passesFilters(ev) {
    if (!S.inPeriod(ev.start, view.year, view.quarter, view.month)) return false;
    if (view.kind !== "all" && (ev.kind || "Event") !== view.kind) return false;
    if (!matchesScope(ev)) return false;
    if (view.svpFilter && ev.svpId !== view.svpFilter) return false;
    return true;
  }

  function blankAgg(label, key) {
    const metrics = {};
    S.OUTCOME_METRICS.forEach((m) => { metrics[m.key] = m.kind === "pa" ? { p: 0, a: 0 } : { t: 0, a: 0 }; });
    // spendMql/spendSql/spendAtt: actual spend of only the records that have that metric filled in,
    // so cost-per-metric never counts spend from records with no MQL / SQL / attendee number.
    return { key, label, count: 0, metrics, fNet: 0, aNet: 0, spendMql: 0, spendSql: 0, spendAtt: 0 };
  }

  function buildRows() {
    const events = (S.state.data.events || []).filter(passesFilters);
    const map = {};
    events.forEach((ev) => {
      const d = dimOf(ev);
      const agg = map[d.key] || (map[d.key] = blankAgg(d.label, d.key));
      agg.count++;
      S.OUTCOME_METRICS.forEach((m) => {
        if (m.kind === "pa") { agg.metrics[m.key].p += oc(ev, m.key, "p"); agg.metrics[m.key].a += oc(ev, m.key, "a"); }
        else { agg.metrics[m.key].t += oc(ev, m.key, "t"); agg.metrics[m.key].a += oc(ev, m.key, "a"); }
      });
      const sp = eventSpend(ev);
      agg.fNet += sp.fNet; agg.aNet += sp.aNet;
      if (oc(ev, "mql", "a") > 0) agg.spendMql += sp.aNet;
      if (oc(ev, "sql", "a") > 0) agg.spendSql += sp.aNet;
      if (oc(ev, "attendees", "a") > 0) agg.spendAtt += sp.aNet;
    });
    let rows = Object.values(map);
    if (view.dim === "month" || view.dim === "quarter") rows.sort((a, b) => a.key.localeCompare(b.key));
    else rows.sort((a, b) => a.label.localeCompare(b.label));
    return rows;
  }

  function totalsOf(rows) {
    const t = blankAgg("Total", "_total");
    rows.forEach((r) => {
      t.count += r.count; t.fNet += r.fNet; t.aNet += r.aNet;
      t.spendMql += r.spendMql; t.spendSql += r.spendSql; t.spendAtt += r.spendAtt;
      S.OUTCOME_METRICS.forEach((m) => {
        if (m.kind === "pa") { t.metrics[m.key].p += r.metrics[m.key].p; t.metrics[m.key].a += r.metrics[m.key].a; }
        else { t.metrics[m.key].t += r.metrics[m.key].t; t.metrics[m.key].a += r.metrics[m.key].a; }
      });
    });
    return t;
  }

  // efficiency
  function costPer(spend, count) { return (spend > 0 && count > 0) ? spend / count : null; }
  function roiOf(rev, spend) { return spend > 0 ? rev / spend : null; }

  // ---- render ----
  function render() {
    const root = document.getElementById("tab-outcomes");
    const data = S.state.data;
    if (!data) { root.innerHTML = ""; return; }

    root.innerHTML = `
      <div class="filter-bar">
        <div><label>Year</label><select id="o-year">${yearOptions()}</select></div>
        <div><label>Quarter</label><select id="o-quarter">${S.quarterOptions(view.quarter)}</select></div>
        <div><label>Month</label><select id="o-month">${S.monthOptions(view.month)}</select></div>
        <div><label>Group by</label><select id="o-dim">${Object.entries(DIM_LABELS).map(([v, l]) => `<option ${view.dim === v ? "selected" : ""} value="${v}">${l}</option>`).join("")}</select></div>
        ${S.scopeFilterHtml("o", view.scope)}
        <div><label>SVP</label><select id="o-svp"><option value="">All</option>${(data.settings.svps || []).map((s) => `<option ${view.svpFilter === s.id ? "selected" : ""} value="${s.id}">${S.escapeHtml(s.name)}</option>`).join("")}</select></div>
        <div><label>Kind</label><select id="o-kind">${[["all", "All"], ["Event", "Events"], ["Campaign", "Campaigns"]].map(([v, l]) => `<option ${view.kind === v ? "selected" : ""} value="${v}">${l}</option>`).join("")}</select></div>
        <div><label>Chart</label><select id="o-chart-metric">${CHART_METRICS.map(([v, l]) => `<option ${view.chartMetric === v ? "selected" : ""} value="${v}">${l}</option>`).join("")}</select></div>
        <div class="grow"></div>
        <div><button id="o-export" class="secondary">Export to Excel</button></div>
      </div>
      <div id="outcomes-body"></div>
    `;

    root.querySelector("#o-year").onchange = (e) => { view.year = e.target.value === "all" ? "all" : +e.target.value; renderBody(); };
    root.querySelector("#o-quarter").onchange = (e) => { view.quarter = e.target.value; renderBody(); };
    root.querySelector("#o-month").onchange = (e) => { view.month = e.target.value; renderBody(); };
    root.querySelector("#o-dim").onchange = (e) => { view.dim = e.target.value; renderBody(); };
    S.wireScopeFilter(root, "o", view.scope, renderBody);
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

  function renderBody() {
    const host = document.getElementById("outcomes-body");
    const rows = buildRows();
    if (!rows.length) {
      host.innerHTML = `<div class="card muted">No campaigns or events match. Add outcomes to a campaign in the Campaigns and events tab, then come back here.</div>`;
      if (view.chart) { view.chart.destroy(); view.chart = null; }
      return;
    }
    const totals = totalsOf(rows);
    host.innerHTML = `
      <div class="kpi-row">${kpiCards(totals)}</div>
      <div class="chart-wrap"><canvas id="o-chart"></canvas></div>
      <div class="card"><div class="table-wrap">${tableHtml(rows, totals)}</div></div>
    `;
    drawChart(rows);
  }

  function kpiCards(t) {
    const rev = t.metrics.revenue.a, spend = t.aNet;
    const roi = roiOf(rev, spend);
    const net = rev - spend;
    return `
      <div class="kpi"><div class="label">Actual revenue</div><div class="value">${S.fmtMoney(rev)}</div><div class="delta muted">${view.year === "all" ? "all years" : view.year}</div></div>
      <div class="kpi"><div class="label">Actual spend</div><div class="value">${S.fmtMoney(spend)}</div><div class="delta muted">net of partner funds</div></div>
      <div class="kpi"><div class="label">Revenue ROI</div><div class="value">${roi === null ? "-" : roi.toFixed(1) + "x"}</div><div class="delta ${net >= 0 ? "pos" : "neg"}">${S.fmtMoney(net)} net</div></div>
      <div class="kpi"><div class="label">Pipeline (actual)</div><div class="value">${S.fmtNum(t.metrics.mql.a)} MQL</div><div class="delta muted">${S.fmtNum(t.metrics.sql.a)} SQL &middot; ${S.fmtNum(t.metrics.attendees.a)} attendees</div></div>
    `;
  }

  function taCell(o, money) {
    const fmt = money ? S.fmtMoney : S.fmtNum;
    const t = o.t !== undefined ? o.t : o.p;
    return `${fmt(o.a)} <span class="sub">/ ${fmt(t)}</span>`;
  }

  function effCells(r) {
    const cpm = costPer(r.spendMql, r.metrics.mql.a);
    const cps = costPer(r.spendSql, r.metrics.sql.a);
    const cpa = costPer(r.spendAtt, r.metrics.attendees.a);
    const roi = roiOf(r.metrics.revenue.a, r.aNet);
    const roiCls = roi === null ? "muted" : (roi >= 1 ? "pos" : "warn");
    return `
      <td class="num">${cpm === null ? "<span class='muted'>-</span>" : S.fmtMoney(cpm)}</td>
      <td class="num">${cps === null ? "<span class='muted'>-</span>" : S.fmtMoney(cps)}</td>
      <td class="num">${cpa === null ? "<span class='muted'>-</span>" : S.fmtMoney(cpa)}</td>
      <td class="num"><span class="delta ${roiCls}">${roi === null ? "-" : roi.toFixed(1) + "x"}</span></td>
    `;
  }

  function rowCells(r) {
    const m = r.metrics;
    return `
      <td class="num">${r.count}</td>
      <td class="num">${taCell(m.attendees)}</td>
      <td class="num">${taCell(m.registrations)}</td>
      <td class="num">${taCell(m.mql)}</td>
      <td class="num">${taCell(m.sql)}</td>
      <td class="num">${taCell(m.engagement)}</td>
      <td class="num">${S.fmtMoney(m.revenue.p)}</td>
      <td class="num">${S.fmtMoney(m.revenue.a)}</td>
      <td class="num">${S.fmtMoney(r.fNet)}</td>
      <td class="num">${S.fmtMoney(r.aNet)}</td>
      ${effCells(r)}
    `;
  }

  function tableHtml(rows, totals) {
    return `
      <table>
        <thead>
          <tr>
            <th>${DIM_LABELS[view.dim]}</th>
            <th class="num">Events</th>
            <th class="num">Attendees</th>
            <th class="num">Registr.</th>
            <th class="num">MQL</th>
            <th class="num">SQL</th>
            <th class="num">Engagement</th>
            <th class="num">Pot. revenue</th>
            <th class="num">Act. revenue</th>
            <th class="num">Forecast net</th>
            <th class="num">Actual spend</th>
            <th class="num">Cost / MQL</th>
            <th class="num">Cost / SQL</th>
            <th class="num">Cost / attendee</th>
            <th class="num">ROI</th>
          </tr>
          <tr><th colspan="15" class="sub" style="font-weight:400">Outcome cells show actual / target. Revenue shows potential and actual. Cost per MQL / SQL / attendee counts only the spend of records that have that number filled in.</th></tr>
        </thead>
        <tbody>
          ${rows.map((r) => `<tr><td class="dim">${S.escapeHtml(r.label)}</td>${rowCells(r)}</tr>`).join("")}
        </tbody>
        <tfoot>
          <tr class="total-row"><td>Total (${totals.count})</td>${rowCells(totals)}</tr>
        </tfoot>
      </table>
    `;
  }

  function drawChart(rows) {
    const ctx = document.getElementById("o-chart");
    if (!ctx || typeof Chart === "undefined") return;
    if (view.chart) { view.chart.destroy(); view.chart = null; }
    const byDim = " by " + DIM_LABELS[view.dim].toLowerCase();
    const metric = view.chartMetric || "revenue";
    let datasets, title, yTicks;
    if (metric === "revenue") {
      datasets = [
        { label: "Actual revenue", data: rows.map((r) => r.metrics.revenue.a), backgroundColor: "#50be87" },
        { label: "Actual spend", data: rows.map((r) => r.aNet), backgroundColor: "#ff6a00" },
      ];
      title = "Actual revenue vs spend" + byDim;
      yTicks = { callback: (v) => "EUR " + new Intl.NumberFormat("en-US").format(v) };
    } else {
      const label = (CHART_METRICS.find((m) => m[0] === metric) || [metric, metric])[1];
      datasets = [
        { label: "Actual", data: rows.map((r) => (r.metrics[metric] || {}).a || 0), backgroundColor: "#ff6a00" },
        { label: "Target", data: rows.map((r) => (r.metrics[metric] || {}).t || 0), backgroundColor: "#9aa4ad" },
      ];
      title = label + " (actual vs target)" + byDim;
      yTicks = { callback: (v) => new Intl.NumberFormat("en-US").format(v) };
    }
    view.chart = new Chart(ctx, {
      type: "bar",
      data: { labels: rows.map((r) => r.label), datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "top" }, title: { display: true, text: title } },
        scales: { y: { ticks: yTicks } },
      },
    });
  }

  function exportExcel() {
    const rows = buildRows();
    const totals = totalsOf(rows);
    const header = [DIM_LABELS[view.dim], "Events",
      "Attendees actual", "Attendees target", "Registrations actual", "Registrations target",
      "MQL actual", "MQL target", "SQL actual", "SQL target", "Engagement actual", "Engagement target",
      "Potential revenue", "Actual revenue", "Forecast net", "Actual spend",
      "Cost per MQL", "Cost per SQL", "Cost per attendee", "Revenue ROI"];
    const rowArr = (r) => {
      const m = r.metrics;
      const cpm = costPer(r.spendMql, m.mql.a), cps = costPer(r.spendSql, m.sql.a), cpa = costPer(r.spendAtt, m.attendees.a);
      const roi = roiOf(m.revenue.a, r.aNet);
      return [r.label, r.count,
        m.attendees.a, m.attendees.t, m.registrations.a, m.registrations.t,
        m.mql.a, m.mql.t, m.sql.a, m.sql.t, m.engagement.a, m.engagement.t,
        m.revenue.p, m.revenue.a, r.fNet, r.aNet,
        cpm === null ? "" : Math.round(cpm), cps === null ? "" : Math.round(cps),
        cpa === null ? "" : Math.round(cpa), roi === null ? "" : +roi.toFixed(2)];
    };
    const aoa = [header, ...rows.map(rowArr), rowArr({ ...totals, label: "Total" })];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, "Outcomes");
    const yr = view.year === "all" ? "all-years" : view.year;
    XLSX.writeFile(wb, `marketing-outcomes-${view.dim}-${yr}.xlsx`);
    S.toast("Excel exported", "success");
  }

  window.MB_OUTCOMES = { render };
})();
