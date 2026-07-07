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
  };

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
        ${S.scopeFilterHtml("r", view.scope)}
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
    root.querySelector("#r-year").onchange = (e) => { view.year = +e.target.value; renderBody(); };
    root.querySelector("#r-quarter").onchange = (e) => { view.quarter = e.target.value; renderBody(); };
    root.querySelector("#r-month").onchange = (e) => { view.month = e.target.value; renderBody(); };
    S.wireScopeFilter(root, "r", view.scope, renderBody);
    root.querySelector("#r-measure").onchange = (e) => { view.measure = e.target.value; renderBody(); };
    root.querySelector("#r-export").onclick = exportExcel;

    renderBody();
  }

  function yearOptions() {
    const data = S.state.data;
    const ys = new Set([view.year, new Date().getFullYear()]);
    data.activities.forEach((a) => { if (a.date) ys.add(new Date(a.date).getFullYear()); });
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

  function activitiesInYear() {
    return S.state.data.activities.filter((a) => S.inPeriod(a.date, view.year, view.quarter, view.month));
  }

  // Deduped entities limited to the shared M1 > Cluster > Entity scope.
  function reportEntities() {
    return S.uniqueEntities().filter((e) => S.entityMatchesScope(e.id, view.scope));
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
          <span class="muted small">Grouped by cluster. Click a cluster to expand or collapse.</span>
          <span class="grow"></span>
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

        entityRows += `
          <tr class="clickable-row entity-row" data-entity-id="${e.id}" title="Click to see these budget lines in Budget">
            <td rowspan="2" class="entity-name">${S.escapeHtml(e.name)}</td>
            <td class="muted">Forecast</td>
            ${r.forecast.map(v => `<td class="num">${v ? S.fmtMoney(v) : "<span class='muted'>-</span>"}</td>`).join("")}
            <td class="num"><strong>${S.fmtMoney(totalF)}</strong></td>
            <td class="num" rowspan="2">${S.fmtMoney(budget)}</td>
            <td class="num ${varianceCellClass(budget, totalF)}">${variance(budget, totalF)}</td>
          </tr>
          <tr class="clickable-row entity-row" data-entity-id="${e.id}" title="Click to see these budget lines in Budget">
            <td>Actual</td>
            ${r.actual.map((v, i) => {
              const over = v > (r.forecast[i] || 0) && v > 0;
              return `<td class="num ${over ? "over-forecast" : ""}">${v ? S.fmtMoney(v) : "<span class='muted'>-</span>"}</td>`;
            }).join("")}
            <td class="num ${totalA > totalF ? "over-forecast" : ""}"><strong>${S.fmtMoney(totalA)}</strong></td>
            <td class="num ${varianceCellClass(budget, totalA)}">${variance(budget, totalA)}</td>
          </tr>
        `;
      });

      groupF.forEach((v, i) => gF[i] += v);
      groupA.forEach((v, i) => gA[i] += v);
      gB += groupB;

      const caret = collapsed ? "▸" : "▾";
      // Clickable group header carrying the group subtotals.
      html += `
        <tr class="group-row group-toggle" data-group="${S.escapeHtml(groupName)}" title="Click to expand or collapse">
          <td rowspan="2"><span class="caret">${caret}</span> ${S.escapeHtml(groupName)} <span class="muted small">(${ents.length})</span></td>
          <td>Forecast</td>
          ${groupF.map(v => `<td class="num">${S.fmtMoney(v)}</td>`).join("")}
          <td class="num">${S.fmtMoney(groupFY)}</td>
          <td class="num" rowspan="2">${S.fmtMoney(groupB)}</td>
          <td class="num ${varianceCellClass(groupB, groupFY)}">${variance(groupB, groupFY)}</td>
        </tr>
        <tr class="group-row group-toggle" data-group="${S.escapeHtml(groupName)}" title="Click to expand or collapse">
          <td>Actual</td>
          ${groupA.map((v, i) => {
            const over = v > (groupF[i] || 0) && v > 0;
            return `<td class="num ${over ? "over-forecast" : ""}">${S.fmtMoney(v)}</td>`;
          }).join("")}
          <td class="num ${groupAY > groupFY ? "over-forecast" : ""}">${S.fmtMoney(groupAY)}</td>
          <td class="num ${varianceCellClass(groupB, groupAY)}">${variance(groupB, groupAY)}</td>
        </tr>
      `;
      if (!collapsed) html += entityRows;
    });

    const gFY = gF.reduce((s, x) => s + x, 0);
    const gAY = gA.reduce((s, x) => s + x, 0);
    html += `
        <tr class="total-row">
          <td>Grand total</td>
          <td>Forecast</td>
          ${gF.map(v => `<td class="num">${S.fmtMoney(v)}</td>`).join("")}
          <td class="num">${S.fmtMoney(gFY)}</td>
          <td class="num" rowspan="2">${S.fmtMoney(gB)}</td>
          <td class="num ${varianceCellClass(gB, gFY)}">${variance(gB, gFY)}</td>
        </tr>
        <tr class="total-row">
          <td></td>
          <td>Actual</td>
          ${gA.map((v, i) => {
            const over = v > (gF[i] || 0) && v > 0;
            return `<td class="num ${over ? "over-forecast" : ""}">${S.fmtMoney(v)}</td>`;
          }).join("")}
          <td class="num ${gAY > gFY ? "over-forecast" : ""}">${S.fmtMoney(gAY)}</td>
          <td class="num ${varianceCellClass(gB, gAY)}">${variance(gB, gAY)}</td>
        </tr>
      </tbody>
          </table>
        </div>
      </div>
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
    const label = ent ? ent.name : "all entities";
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
            <thead><tr><th>Entity</th><th class="num">Forecast YTD</th><th class="num">Actual YTD</th><th class="num">Yearly budget</th><th class="num">Variance</th></tr></thead>
            <tbody>
              ${rows}
              <tr class="total-row"><td>Total</td><td class="num">${S.fmtMoney(totalF)}</td><td class="num">${S.fmtMoney(totalA)}</td><td class="num">${S.fmtMoney(totalB)}</td><td class="num ${varianceCellClass(totalB, totalA)}">${variance(totalB, totalA)}</td></tr>
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
                <th>SVP / Campaign</th>
                <th>Type</th>
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
                  <td>${S.escapeHtml((S.actTypeById(a.activityTypeId)||{}).name || "")}</td>
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
      "SVP / Campaign": (S.svpById(a.svpId)||{}).name || "",
      Type: (S.actTypeById(a.activityTypeId)||{}).name || "",
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
