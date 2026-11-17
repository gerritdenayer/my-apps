// Reporting tab: monthly matrix + entity drill-down + Excel export
(function () {
  const S = window.MB_STATE;

  const view = {
    mode: "matrix",         // "matrix" or "entity"
    year: new Date().getFullYear(),
    quarter: "",
    month: "",
    scope: { m1: "", cluster: "", entityId: "" },  // shared M1>Cluster>Entity scope
    measure: "net",         // "gross" | "net" | "partner"
    showActual: true,       // matrix only, toggles between forecast and actual layer
    chart: null,
    collapsedGroups: null,  // Set of group names collapsed in the matrix (null = not yet initialized)
    // Which rows the matrix shows: forecast, actual, difference. Remembered per browser; one stays on.
    showF: (() => { try { return localStorage.getItem("mb_rep_showf") !== "0"; } catch (e) { return true; } })(),
    showA: (() => { try { return localStorage.getItem("mb_rep_showa") !== "0"; } catch (e) { return true; } })(),
    showDiff: (() => { try { return localStorage.getItem("mb_rep_showdiff") !== "0"; } catch (e) { return true; } })(),
  };

  // Difference = actual - forecast, only for months that have an actual (a month with no actual
  // yet is not "under forecast", it is just not booked). Returns 12 values (null = no actual) + total.
  function diffOf(fArr, aArr) {
    const d = aArr.map((a, i) => a ? a - (fArr[i] || 0) : null);
    return { months: d, total: d.reduce((s, x) => s + (x || 0), 0), any: d.some((x) => x !== null) };
  }
  function fmtDiff(v) {
    if (v === null) return "<span class='muted'>-</span>";
    if (!v) return S.fmtMoney(0);
    return (v > 0 ? "+" : "−") + S.fmtMoney(Math.abs(v));
  }
  function diffClass(v) { return v > 0 ? "diff-over" : v < 0 ? "diff-under" : ""; }
  // One entity, cluster or grand total in the matrix: up to three rows (forecast, actual, difference),
  // depending on the "Show ..." checkboxes. The name and the yearly budget span all visible rows.
  // o: { cls, attrs, nameHtml, F, A, budget, dash (show "-" for empty months), bold (bold YTD) }
  function layerBlock(o) {
    const rows = [];
    const totalF = o.F.reduce((s, x) => s + x, 0), totalA = o.A.reduce((s, x) => s + x, 0);
    const cell = (v) => v || !o.dash ? S.fmtMoney(v) : "<span class='muted'>-</span>";
    const ytd = (v) => o.bold ? `<strong>${v}</strong>` : v;
    if (view.showF) rows.push({ cls: o.cls, label: `<td class="layer-f">Forecast</td>`,
      cells: o.F.map((v) => `<td class="num layer-f">${cell(v)}</td>`).join(""),
      ytd: `<td class="num layer-f">${ytd(S.fmtMoney(totalF))}</td>`,
      vari: `<td class="num ${varianceCellClass(o.budget, totalF)}">${variance(o.budget, totalF)}</td>` });
    if (view.showA) rows.push({ cls: o.cls + " layer-a-row", label: `<td class="layer-a">Actual</td>`,
      cells: o.A.map((v, i) => `<td class="num ${v > (o.F[i] || 0) && v > 0 ? "over-forecast" : ""}">${cell(v)}</td>`).join(""),
      ytd: `<td class="num ${totalA > totalF ? "over-forecast" : ""}">${ytd(S.fmtMoney(totalA))}</td>`,
      vari: `<td class="num ${varianceCellClass(o.budget, totalA)}">${variance(o.budget, totalA)}</td>` });
    if (view.showDiff) {
      const d = diffOf(o.F, o.A);
      rows.push({ cls: o.cls + " diff-row", label: `<td class="layer-diff" title="Actual minus forecast, for the months that have an actual">Difference</td>`,
        cells: d.months.map((v) => `<td class="num ${v === null ? "" : diffClass(v)}">${fmtDiff(v)}</td>`).join(""),
        ytd: `<td class="num ${diffClass(d.total)}"><strong>${d.any ? fmtDiff(d.total) : "<span class='muted'>-</span>"}</strong></td>`,
        vari: `<td class="num"></td>` });
    }
    const n = rows.length;
    return rows.map((r, k) => `<tr class="${r.cls}"${o.attrs || ""}>
      ${k === 0 ? `<td rowspan="${n}"${o.nameCls ? ` class="${o.nameCls}"` : ""}>${o.nameHtml}</td>` : ""}
      ${r.label}${r.cells}${r.ytd}
      ${k === 0 ? `<td class="num" rowspan="${n}">${S.fmtMoney(o.budget)}</td>` : ""}
      ${r.vari}
    </tr>`).join("");
  }

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function render() {
    const root = document.getElementById("tab-reporting");
    const data = S.state.data;
    if (!data) { root.innerHTML = ""; return; }

    root.innerHTML = `
      <div class="filter-bar">
        <div>
          <label>View</label>
          <div class="report-toggle">
            <button id="t-matrix" class="${view.mode==="matrix"?"active":""}">Monthly matrix</button>
            <button id="t-entity" class="${view.mode==="entity"?"active":""}">Entity drill-down</button>
            <button id="t-charts" class="${view.mode==="charts"?"active":""}">Charts</button>
          </div>
        </div>
        <div>
          <label>Year</label>
          <select id="r-year">${yearOptions()}</select>
        </div>
        <div>
          <label>Quarter</label>
          <select id="r-quarter">${S.quarterOptions(view.quarter)}</select>
        </div>
        <div>
          <label>Month</label>
          <select id="r-month">${S.monthOptions(view.month)}</select>
        </div>
        ${S.scopeFilterHtml("r", view.scope, null, view.year)}
        <div>
          <label>Measure</label>
          <select id="r-measure">
            <option value="net" ${view.measure==="net"?"selected":""}>Net (gross - partner)</option>
            <option value="gross" ${view.measure==="gross"?"selected":""}>Gross</option>
            <option value="partner" ${view.measure==="partner"?"selected":""}>Partner funds</option>
          </select>
        </div>
        <div class="grow"></div>
        <div>
          <button id="r-export" class="secondary">Export to Excel</button>
        </div>
      </div>
      <div id="report-body"></div>
    `;

    root.querySelector("#t-matrix").onclick = () => { view.mode = "matrix"; renderBody(); };
    root.querySelector("#t-entity").onclick = () => { view.mode = "entity"; renderBody(); };
    root.querySelector("#t-charts").onclick = () => { view.mode = "charts"; renderBody(); };
    root.querySelector("#r-year").onchange = (e) => { view.year = +e.target.value; render(); }; // the cluster and entity lists follow the year
    root.querySelector("#r-quarter").onchange = (e) => { view.quarter = e.target.value; renderBody(); };
    root.querySelector("#r-month").onchange = (e) => { view.month = e.target.value; renderBody(); };
    S.wireScopeFilter(root, "r", view.scope, renderBody, null, view.year);
    root.querySelector("#r-measure").onchange = (e) => { view.measure = e.target.value; renderBody(); };
    root.querySelector("#r-export").onclick = exportExcel;

    renderBody();
  }

  function yearOptions() {
    const data = S.state.data;
    const ys = new Set([view.year, new Date().getFullYear()]);
    data.activities.forEach((a) => { if (a.date) ys.add(new Date(a.date).getFullYear()); });
    // Also years that only have a yearly budget so far (a new year before its first line).
    Object.keys(data.settings.yearlyBudgets || {}).forEach((y) => { if (/^\d{4}$/.test(y)) ys.add(+y); });
    return Array.from(ys).sort().map(y => `<option ${y===view.year?"selected":""} value="${y}">${y}</option>`).join("");
  }

  function valueOf(a, kind) {
    // kind: "forecast" or "actual"
    const g = a[kind + "Gross"] || 0;
    const p = a[kind + "Partner"] || 0;
    if (view.measure === "gross") return g;
    if (view.measure === "partner") return p;
    return g - p; // net
  }

  // Totals per A&P category for the selected year and scope, in the chosen measure.
  function apCategoryCard() {
    const allowed = new Set(reportEntities().map((e) => e.id));
    const rows = {};
    activitiesInYear().forEach((a) => {
      if (!allowed.has(S.canonicalEntityId(a.entityId))) return;
      const c = S.apCategoryForActivity(a);
      const k = c ? c.name : "No A&P category";
      const r = rows[k] = rows[k] || { n: 0, f: 0, a: 0 };
      r.n++; r.f += valueOf(a, "forecast"); r.a += valueOf(a, "actual");
    });
    const list = Object.entries(rows).sort((x, y) => y[1].f - x[1].f);
    if (!list.length) return "";
    const totF = list.reduce((t, [, r]) => t + r.f, 0), totA = list.reduce((t, [, r]) => t + r.a, 0);
    const m = { net: "net", gross: "gross", partner: "partner" }[view.measure] || "net";
    return `<div class="card" style="margin-top:16px">
      <h2 style="margin:0 0 4px">By A&amp;P category</h2>
      <p class="muted small" style="margin:0 0 10px">Budget lines in ${S.escapeHtml(String(view.year))} for the selected scope, ${m} amounts.</p>
      <table style="width:100%">
        <thead><tr><th>A&amp;P category</th><th class="num">Lines</th><th class="num">Forecast</th><th class="num">% of forecast</th><th class="num">Actual</th></tr></thead>
        <tbody>${list.map(([k, r]) => `<tr><td>${S.escapeHtml(k)}</td><td class="num">${r.n}</td><td class="num">${S.fmtMoney(r.f)}</td><td class="num">${totF ? Math.round(r.f / totF * 100) : 0}%</td><td class="num ${r.a > r.f ? "over-forecast" : ""}">${S.fmtMoney(r.a)}</td></tr>`).join("")}</tbody>
        <tfoot><tr class="total-row"><td>Total</td><td class="num">${list.reduce((t, [, r]) => t + r.n, 0)}</td><td class="num">${S.fmtMoney(totF)}</td><td class="num">100%</td><td class="num">${S.fmtMoney(totA)}</td></tr></tfoot>
      </table>
    </div>`;
  }

  function activitiesInYear() {
    return S.state.data.activities.filter((a) => S.inPeriod(a.date, view.year, view.quarter, view.month));
  }

  // Deduped entities limited to the shared M1 > Cluster > Entity scope.
  // Entities retired for the year are left out, unless they still have a budget or lines that year.
  function reportEntities() {
    const yb = (S.state.data.settings.yearlyBudgets || {})[view.year] || {};
    const used = new Set((S.state.data.activities || []).filter((a) => S.inPeriod(a.date, view.year, "", "")).map((a) => S.canonicalEntityId(a.entityId)));
    return S.uniqueEntities().filter((e) => S.entityMatchesScope(e.id, view.scope)
      && (S.entityActiveInYear(e, view.year) || used.has(e.id) || (S.state.data.settings.entities || []).some((x) => S.canonicalEntityId(x.id) === e.id && yb[x.id])));
  }

  // Yearly budgets are keyed by raw entity ID, but Reporting de-duplicates entities
  // by name. Roll every entity's budget up onto its canonical (deduped) entity ID so
  // budgets entered against duplicate entities are not dropped. This keeps the Reporting
  // total in line with the sum shown in Settings.
  function budgetByCanonical(year) {
    const yb = (S.state.data.settings.yearlyBudgets || {})[year] || {};
    const allowed = new Set(reportEntities().map((e) => e.id));
    const out = {};
    (S.state.data.settings.entities || []).forEach((e) => {
      const cid = S.canonicalEntityId(e.id);
      if (!allowed.has(cid)) return; // respect the M1 filter
      out[cid] = (out[cid] || 0) + (yb[e.id] || 0);
    });
    return out;
  }

  function renderBody() {
    const host = document.getElementById("report-body");
    document.querySelectorAll("#tab-reporting .report-toggle button").forEach((b) => b.classList.toggle("active", b.id === "t-" + view.mode));
    if (view.mode !== "charts" && window.MB_REPCHARTS) window.MB_REPCHARTS.destroy();
    if (view.mode === "charts" && window.MB_REPCHARTS) {
      const allowed = new Set(reportEntities().map((e) => e.id));
      const measureLabel = { net: "Net", gross: "Gross", partner: "Partner" }[view.measure] || "Net";
      window.MB_REPCHARTS.render(host, {
        year: view.year, quarter: view.quarter, month: view.month,
        lines: activitiesInYear().filter((a) => allowed.has(S.canonicalEntityId(a.entityId))),
        valueOf, budgetByEntity: budgetByCanonical(view.year), measureLabel, drill: drillToBudget,
      });
      return;
    }
    if (view.mode === "matrix") {
      host.innerHTML = renderMatrix();
      bindMatrix(host);
    } else {
      host.innerHTML = renderEntity();
      bindEntity(host);
    }
  }

  function buildMatrix() {
    // Returns map[entityId] -> { forecast: [12], actual: [12] }, indexed by canonical entity IDs
    const rows = {};
    reportEntities().forEach((e) => {
      rows[e.id] = { forecast: Array(12).fill(0), actual: Array(12).fill(0) };
    });
    activitiesInYear().forEach((a) => {
      const cid = S.canonicalEntityId(a.entityId);
      if (!rows[cid]) return;
      const m = new Date(a.date).getMonth();
      rows[cid].forecast[m] += valueOf(a, "forecast");
      rows[cid].actual[m] += valueOf(a, "actual");
    });
    return rows;
  }

  function renderMatrix() {
    const data = S.state.data;
    const matrix = buildMatrix();
    const yb = budgetByCanonical(view.year);

    // Group entities (deduped, filtered by M1)
    const groups = {};
    reportEntities().forEach((e) => {
      const g = e.group || "Other";
      (groups[g] = groups[g] || []).push(e);
    });

    // First time in: default every group collapsed for a clean overview.
    if (view.collapsedGroups === null) {
      view.collapsedGroups = new Set(Object.keys(groups));
    }

    let html = `
      <div class="kpi-row">${kpiCards(matrix, yb)}</div>
      <div class="card">
        <div class="report-groupbar">
          <span class="muted small">Grouped by cluster. Click a cluster to expand or collapse.
            <span class="rep-legend"><span class="lg-f">Forecast</span> <span class="lg-a">Actual</span> <span class="diff-over">+ over forecast</span> <span class="diff-under">− under forecast</span></span></span>
          <span class="grow"></span>
          <label class="inline-check small"><input type="checkbox" id="rg-f" ${view.showF ? "checked" : ""}/> Show forecast</label>
          <label class="inline-check small"><input type="checkbox" id="rg-a" ${view.showA ? "checked" : ""}/> Show actual</label>
          <label class="inline-check small"><input type="checkbox" id="rg-diff" ${view.showDiff ? "checked" : ""}/> Show difference</label>
          <button id="rg-expand" class="linkbtn">Expand all</button>
          <button id="rg-collapse" class="linkbtn">Collapse all</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Entity</th>
                <th>Layer</th>
                ${MONTHS.map(m => `<th class="num">${m}</th>`).join("")}
                <th class="num">YTD total</th>
                <th class="num">Yearly budget</th>
                <th class="num">Variance</th>
              </tr>
            </thead>
            <tbody>
    `;

    let gF = Array(12).fill(0), gA = Array(12).fill(0), gB = 0;
    Object.keys(groups).sort().forEach((groupName) => {
      const ents = groups[groupName];
      const collapsed = view.collapsedGroups.has(groupName);
      let groupFY = 0, groupAY = 0, groupB = 0;
      const groupF = Array(12).fill(0), groupA = Array(12).fill(0);

      // Build entity detail rows first so the group header can show subtotals.
      let entityRows = "";
      ents.forEach((e) => {
        const r = matrix[e.id];
        const totalF = r.forecast.reduce((s, x) => s + x, 0);
        const totalA = r.actual.reduce((s, x) => s + x, 0);
        const budget = yb[e.id] || 0;
        groupFY += totalF; groupAY += totalA; groupB += budget;
        r.forecast.forEach((v, i) => groupF[i] += v);
        r.actual.forEach((v, i) => groupA[i] += v);

        entityRows += layerBlock({ cls: "clickable-row entity-row", nameCls: "entity-name", nameHtml: S.escapeHtml(e.name),
          attrs: ` data-entity-id="${e.id}" title="Click to see these budget lines in Budget"`,
          F: r.forecast, A: r.actual, budget, dash: true, bold: true });
      });

      groupF.forEach((v, i) => gF[i] += v);
      groupA.forEach((v, i) => gA[i] += v);
      gB += groupB;

      const caret = collapsed ? "▸" : "▾";
      // Clickable group header carrying the group subtotals.
      html += layerBlock({ cls: "group-row group-toggle",
        nameHtml: `<span class="caret">${caret}</span> ${S.escapeHtml(groupName)} <span class="muted small">(${ents.length})</span>`,
        attrs: ` data-group="${S.escapeHtml(groupName)}" title="Click to expand or collapse"`,
        F: groupF, A: groupA, budget: groupB });
      if (!collapsed) html += entityRows;
    });

    const gFY = gF.reduce((s, x) => s + x, 0);
    const gAY = gA.reduce((s, x) => s + x, 0);
    html += layerBlock({ cls: "total-row", nameHtml: "Grand total", F: gF, A: gA, budget: gB });
    html += `
      </tbody>
          </table>
        </div>
      </div>
      ${apCategoryCard()}
    `;
    return html;
  }

  function variance(budget, actual) {
    if (!budget) return "<span class='muted'>-</span>";
    const v = budget - actual;
    const pct = (v / budget) * 100;
    const cls = v >= 0 ? "pos" : "neg";
    return `<span class="delta ${cls}">${S.fmtMoney(v)} (${pct.toFixed(0)}%)</span>`;
  }

  function varianceCellClass(budget, value) {
    if (!budget) return "";
    return budget - value >= 0 ? "var-pos" : "var-neg";
  }

  function kpiCards(matrix, yb) {
    let tf = 0, ta = 0, tb = 0;
    Object.entries(matrix).forEach(([id, r]) => {
      tf += r.forecast.reduce((s, x) => s + x, 0);
      ta += r.actual.reduce((s, x) => s + x, 0);
      tb += yb[id] || 0;
    });
    const usedPct = tb ? ((ta / tb) * 100).toFixed(0) : "-";
    const fcPct = tb ? ((tf / tb) * 100).toFixed(0) : "-";
    return `
      <div class="kpi"><div class="label">Yearly budget</div><div class="value">${S.fmtMoney(tb)}</div><div class="delta muted">${view.year}</div></div>
      <div class="kpi"><div class="label">Forecast YTD</div><div class="value">${S.fmtMoney(tf)}</div><div class="delta ${tb && tf<=tb?"pos":"neg"}">${tb ? fcPct + "% of budget" : ""}</div></div>
      <div class="kpi"><div class="label">Actual YTD</div><div class="value">${S.fmtMoney(ta)}</div><div class="delta ${tb && ta<=tb?"pos":"neg"}">${tb ? usedPct + "% of budget" : ""}</div></div>
      <div class="kpi"><div class="label">Budget vs Forecast</div><div class="value">${S.fmtMoney(tb - tf)}</div><div class="delta muted">Remaining after forecast</div></div>
    `;
  }

  function bindMatrix() {
    document.querySelectorAll("#report-body .clickable-row").forEach((row) => {
      row.onclick = () => {
        const entityId = row.dataset.entityId;
        drillToBudget({ year: view.year, entityId });
      };
    });
    // Group expand / collapse
    document.querySelectorAll("#report-body .group-toggle").forEach((row) => {
      row.onclick = () => {
        const g = row.dataset.group;
        if (view.collapsedGroups.has(g)) view.collapsedGroups.delete(g);
        else view.collapsedGroups.add(g);
        renderBody();
      };
    });
    // Show forecast / actual / difference. At least one stays ticked.
    [["rg-f", "showF", "mb_rep_showf"], ["rg-a", "showA", "mb_rep_showa"], ["rg-diff", "showDiff", "mb_rep_showdiff"]].forEach(([id, key, store]) => {
      const cb = document.getElementById(id);
      if (!cb) return;
      cb.onchange = () => {
        if (!cb.checked && [view.showF, view.showA, view.showDiff].filter(Boolean).length === 1) {
          cb.checked = true; S.toast("Keep at least one row type ticked", "error"); return;
        }
        view[key] = cb.checked;
        try { localStorage.setItem(store, cb.checked ? "1" : "0"); } catch (e) {}
        renderBody();
      };
    });
    const exp = document.getElementById("rg-expand");
    const col = document.getElementById("rg-collapse");
    if (exp) exp.onclick = () => { view.collapsedGroups = new Set(); renderBody(); };
    if (col) col.onclick = () => {
      view.collapsedGroups = new Set(S.uniqueEntities().map((e) => e.group || "Other"));
      renderBody();
    };
  }

  function drillToBudget(filters) {
    if (!window.MB_BUDGET || !window.MB_APP) return;
    window.MB_BUDGET.setFilters(filters);
    window.MB_APP.switchTab("budget");
    const ent = filters.entityId ? S.entityById(filters.entityId) : null;
    const label = ent ? ent.name : (filters.group || "all entities");
    S.toast(`Filtered Budget to ${label}, ${filters.year}`, "success");
  }

  // Entities in a cluster, within the current scope.
  function clusterEntities(cluster) {
    return reportEntities().filter((e) => (e.group || "") === cluster);
  }
  // Activities for the current drill-down (a single entity, or all entities in a cluster).
  function drillActivities() {
    if (view.scope.entityId) return activitiesInYear().filter((a) => S.canonicalEntityId(a.entityId) === view.scope.entityId);
    if (view.scope.cluster) {
      const ids = new Set(clusterEntities(view.scope.cluster).map((e) => e.id));
      return activitiesInYear().filter((a) => ids.has(S.canonicalEntityId(a.entityId)));
    }
    return [];
  }
  function drillBudget() {
    const yb = budgetByCanonical(view.year);
    if (view.scope.entityId) return yb[view.scope.entityId] || 0;
    if (view.scope.cluster) return clusterEntities(view.scope.cluster).reduce((s, e) => s + (yb[e.id] || 0), 0);
    return 0;
  }
  function drillKpis(totalF, totalA, yb) {
    const fcPct = yb ? ((totalF / yb) * 100).toFixed(0) : "-";
    const acPct = yb ? ((totalA / yb) * 100).toFixed(0) : "-";
    return `
      <div class="kpi-row">
        <div class="kpi"><div class="label">Yearly budget</div><div class="value">${S.fmtMoney(yb)}</div></div>
        <div class="kpi"><div class="label">Forecast YTD</div><div class="value">${S.fmtMoney(totalF)}</div><div class="delta ${yb && totalF<=yb?"pos":"neg"}">${yb ? fcPct + "% of budget" : ""}</div></div>
        <div class="kpi"><div class="label">Actual YTD</div><div class="value">${S.fmtMoney(totalA)}</div><div class="delta ${yb && totalA<=yb?"pos":"neg"}">${yb ? acPct + "% of budget" : ""}</div></div>
        <div class="kpi"><div class="label">Budget vs Forecast</div><div class="value">${S.fmtMoney(yb - totalF)}</div></div>
      </div>`;
  }

  function renderEntity() {
    if (view.scope.entityId) return renderEntityDetail(view.scope.entityId);
    if (view.scope.cluster) return renderClusterDetail(view.scope.cluster);
    return `<div class="card muted">Pick a cluster or an entity in the filters above to drill down. Pick a cluster to see its entities, then click one to go deeper.</div>`;
  }

  function renderClusterDetail(cluster) {
    const ents = clusterEntities(cluster);
    const matrix = buildMatrix();
    const yb = budgetByCanonical(view.year);
    const acts = drillActivities();
    const monthF = Array(12).fill(0), monthA = Array(12).fill(0);
    acts.forEach((a) => { const m = new Date(a.date).getMonth(); monthF[m] += valueOf(a, "forecast"); monthA[m] += valueOf(a, "actual"); });
    const totalF = monthF.reduce((s, x) => s + x, 0), totalA = monthA.reduce((s, x) => s + x, 0);
    const totalB = drillBudget();

    const rows = ents.map((e) => {
      const r = matrix[e.id] || { forecast: Array(12).fill(0), actual: Array(12).fill(0) };
      const tf = r.forecast.reduce((s, x) => s + x, 0), ta = r.actual.reduce((s, x) => s + x, 0);
      const b = yb[e.id] || 0;
      return `<tr class="clickable-row entity-drill" data-entity-id="${e.id}" title="Click to drill into ${S.escapeHtml(e.name)}">
        <td>${S.escapeHtml(e.name)}</td>
        <td class="num">${S.fmtMoney(tf)}</td>
        <td class="num ${ta > tf ? "over-forecast" : ""}">${S.fmtMoney(ta)}</td>
        ${(() => { const d = diffOf(r.forecast, r.actual); return `<td class="num ${diffClass(d.total)}">${d.any ? fmtDiff(d.total) : "<span class='muted'>-</span>"}</td>`; })()}
        <td class="num">${S.fmtMoney(b)}</td>
        <td class="num ${varianceCellClass(b, ta)}">${variance(b, ta)}</td>
      </tr>`;
    }).join("");

    return `
      ${drillKpis(totalF, totalA, totalB)}
      <div class="chart-wrap"><canvas id="r-chart"></canvas></div>
      <div class="card">
        <h2>${S.escapeHtml(cluster)}: entities in ${view.year}</h2>
        <p class="muted small">Click an entity to drill into its budget lines.</p>
        ${ents.length === 0 ? `<p class="muted">No entities in this cluster.</p>` : `
        <div class="table-wrap">
          <table>
            <thead><tr><th>Entity</th><th class="num">Forecast YTD</th><th class="num">Actual YTD</th><th class="num" title="Actual minus forecast, for the months that have an actual">Difference</th><th class="num">Yearly budget</th><th class="num">Variance</th></tr></thead>
            <tbody>
              ${rows}
              <tr class="total-row"><td>Total</td><td class="num">${S.fmtMoney(totalF)}</td><td class="num">${S.fmtMoney(totalA)}</td>${(() => { const d = diffOf(monthF, monthA); return `<td class="num ${diffClass(d.total)}">${d.any ? fmtDiff(d.total) : "-"}</td>`; })()}<td class="num">${S.fmtMoney(totalB)}</td><td class="num ${varianceCellClass(totalB, totalA)}">${variance(totalB, totalA)}</td></tr>
            </tbody>
          </table>
        </div>`}
      </div>
    `;
  }

  function renderEntityDetail(entityId) {
    const e = S.entityById(entityId);
    if (!e) return `<div class="card muted">Pick a cluster or an entity in the filters above to drill down.</div>`;

    const activities = activitiesInYear().filter((a) => S.canonicalEntityId(a.entityId) === entityId);
    const monthF = Array(12).fill(0), monthA = Array(12).fill(0);
    activities.forEach((a) => {
      const m = new Date(a.date).getMonth();
      monthF[m] += valueOf(a, "forecast");
      monthA[m] += valueOf(a, "actual");
    });
    const totalF = monthF.reduce((s, x) => s + x, 0);
    const totalA = monthA.reduce((s, x) => s + x, 0);
    const yb = budgetByCanonical(view.year)[entityId] || 0;
    const back = view.scope.cluster ? `<div style="margin-bottom:8px"><button id="r-back-cluster" class="linkbtn">&larr; back to ${S.escapeHtml(view.scope.cluster)}</button></div>` : "";

    return `
      ${back}
      ${drillKpis(totalF, totalA, yb)}
      <div class="chart-wrap"><canvas id="r-chart"></canvas></div>
      <div class="card">
        <h2>Budget lines in ${view.year}</h2>
        ${activities.length === 0 ? `<p class="muted">No budget lines for ${S.escapeHtml(e.name)} in ${view.year}.</p>` : `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>SVP</th>
                <th>Vertical</th>
                <th>A&amp;P category</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Vendor</th>
                <th class="num">Forecast gross</th>
                <th class="num">Forecast partner</th>
                <th class="num">Forecast net</th>
                <th class="num">Actual gross</th>
                <th class="num">Actual partner</th>
                <th class="num">Actual net</th>
              </tr>
            </thead>
            <tbody>
              ${activities.sort((a,b) => (a.date||"").localeCompare(b.date||"")).map(a => {
                const fG = a.forecastGross || 0, fP = a.forecastPartner || 0;
                const aG = a.actualGross || 0, aP = a.actualPartner || 0;
                const fNet = fG - fP, aNet = aG - aP;
                const overG = aG > fG && aG > 0;
                const overNet = aNet > fNet && aNet > 0;
                return `
                <tr>
                  <td>${S.fmtDate(a.date)}</td>
                  <td>${S.escapeHtml(a.name)}</td>
                  <td>${S.escapeHtml((S.svpById(a.svpId)||{}).name || "")}</td>
                  <td>${S.escapeHtml((S.verticalById(a.verticalId)||{}).name || "")}</td>
                  <td>${S.escapeHtml((S.apCategoryForActivity(a)||{}).name || "")}</td>
                  <td>${S.escapeHtml((S.statusById(a.statusId)||{}).name || "")}</td>
                  <td>${S.escapeHtml((S.userById(a.ownerId)||{}).name || "")}</td>
                  <td>${S.escapeHtml(a.vendor || "")}</td>
                  <td class="num">${S.fmtMoney(fG)}</td>
                  <td class="num">${S.fmtMoney(fP)}</td>
                  <td class="num">${S.fmtMoney(fNet)}</td>
                  <td class="num ${overG ? "over-forecast" : ""}">${S.fmtMoney(aG)}</td>
                  <td class="num">${S.fmtMoney(aP)}</td>
                  <td class="num ${overNet ? "over-forecast" : ""}">${S.fmtMoney(aNet)}</td>
                </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>`}
      </div>
    `;
  }

  function bindEntity() {
    // Cluster view: clicking an entity row drills into that entity.
    document.querySelectorAll("#report-body .entity-drill").forEach((row) => {
      row.onclick = () => {
        view.scope.entityId = row.dataset.entityId;
        const sel = document.getElementById("r-entity");
        if (sel) sel.value = view.scope.entityId;
        renderBody();
      };
    });
    const back = document.getElementById("r-back-cluster");
    if (back) back.onclick = () => {
      view.scope.entityId = "";
      const sel = document.getElementById("r-entity");
      if (sel) sel.value = "";
      renderBody();
    };

    const ctx = document.getElementById("r-chart");
    if (!ctx) return;
    if (view.chart) { view.chart.destroy(); view.chart = null; }
    const acts = drillActivities();
    const monthF = Array(12).fill(0), monthA = Array(12).fill(0);
    acts.forEach((a) => {
      const m = new Date(a.date).getMonth();
      monthF[m] += valueOf(a, "forecast");
      monthA[m] += valueOf(a, "actual");
    });
    const yb = drillBudget();
    const monthlyBudget = Array(12).fill(yb / 12);
    view.chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: MONTHS,
        datasets: [
          { label: "Forecast", data: monthF, backgroundColor: "#fdba74" },
          { label: "Actual", data: monthA, backgroundColor: "#ff6a00" },
          { label: "Budget (monthly avg)", data: monthlyBudget, type: "line",
            borderColor: "#1f2937", backgroundColor: "transparent", borderDash: [6, 4], pointRadius: 0, tension: 0 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "top" } },
        scales: { y: { ticks: { callback: (v) => "EUR " + new Intl.NumberFormat("en-US").format(v) } } },
      },
    });
  }

  function exportExcel() {
    const data = S.state.data;
    const wb = XLSX.utils.book_new();

    // Sheet 1: activities for the year
    const acts = activitiesInYear().sort((a,b) => (a.date||"").localeCompare(b.date||""));
    const actRows = acts.map((a) => ({
      Date: a.date,
      Name: a.name,
      Entity: (S.entityById(a.entityId)||{}).name || "",
      "Entity group": (S.entityById(a.entityId)||{}).group || "",
      SVP: (S.svpById(a.svpId)||{}).name || "",
      Vertical: (S.verticalById(a.verticalId)||{}).name || "",
      "A&P category": (S.apCategoryForActivity(a)||{}).name || "",
      Status: (S.statusById(a.statusId)||{}).name || "",
      Owner: (S.userById(a.ownerId)||{}).name || "",
      Vendor: a.vendor || "",
      "PO #": a.poNumber || "",
      "Forecast gross": a.forecastGross || 0,
      "Forecast partner": a.forecastPartner || 0,
      "Forecast net": (a.forecastGross || 0) - (a.forecastPartner || 0),
      "Actual gross": a.actualGross || 0,
      "Actual partner": a.actualPartner || 0,
      "Actual net": (a.actualGross || 0) - (a.actualPartner || 0),
      Notes: a.notes || "",
    }));
    const ws1 = XLSX.utils.json_to_sheet(actRows);
    XLSX.utils.book_append_sheet(wb, ws1, "Activities " + view.year);

    // Sheet 2: monthly matrix
    const matrix = buildMatrix();
    const yb = budgetByCanonical(view.year);
    const header = ["Entity group", "Entity", "Layer", ...MONTHS, "YTD total", "Yearly budget", "Variance vs Budget"];
    const matRows = [header];
    reportEntities().forEach((e) => {
      const r = matrix[e.id];
      const totalF = r.forecast.reduce((s, x) => s + x, 0);
      const totalA = r.actual.reduce((s, x) => s + x, 0);
      const budget = yb[e.id] || 0;
      matRows.push([e.group || "", e.name, "Forecast", ...r.forecast, totalF, budget, budget - totalF]);
      matRows.push([e.group || "", e.name, "Actual", ...r.actual, totalA, budget, budget - totalA]);
      const d = diffOf(r.forecast, r.actual);
      matRows.push([e.group || "", e.name, "Difference (actual - forecast)", ...d.months.map((v) => v === null ? "" : v), d.any ? d.total : "", "", ""]);
    });
    const ws2 = XLSX.utils.aoa_to_sheet(matRows);
    XLSX.utils.book_append_sheet(wb, ws2, "Monthly matrix");

    // Sheet 3: yearly budgets snapshot (budgets rolled up by canonical entity)
    const bc = (data.settings.budgetCodes || {})[view.year] || {};
    const budgetRows = [["Entity group", "Entity", "Budget code", "Yearly budget (EUR)"]];
    reportEntities().forEach((e) => {
      budgetRows.push([e.group || "", e.name, bc[e.id] || "", yb[e.id] || 0]);
    });
    const ws3 = XLSX.utils.aoa_to_sheet(budgetRows);
    XLSX.utils.book_append_sheet(wb, ws3, "Budgets " + view.year);

    XLSX.writeFile(wb, `marketing-budget-${view.year}.xlsx`);
    S.toast("Excel exported", "success");
  }

  window.MB_REPORTING = { render };
})();
