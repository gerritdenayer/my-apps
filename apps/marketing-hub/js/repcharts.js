// Reporting > Charts: build your own chart from the budget lines in the Reporting filters
// (year, quarter, month, M1 > cluster > entity, measure). Choose a quick pick or set the chart
// type, what to group by, how to split it, forecast and/or actual, budget, cumulative, top N.
// Choices are remembered per browser (mb_rep_chart).
(function () {
  const S = window.MB_STATE;
  const KEY = "mb_rep_chart";
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  // Orange brand palette first, then extra colors that read well on light and dark.
  const PALETTE = ["#ff7900", "#4bb4e6", "#50be87", "#a885d8", "#ffd200", "#ffb4e6", "#8f8f8f", "#e8604f", "#2f9e9e", "#b5803a", "#6c7fd8", "#9bc53d"];
  const C_FORECAST = "#4bb4e6", C_ACTUAL = "#ff7900", C_BUDGET = "#8f8f8f";

  const TYPES = [["bar", "Bar"], ["stacked", "Stacked"], ["hbar", "Horizontal"], ["line", "Line"], ["pie", "Pie"], ["doughnut", "Doughnut"]];
  const DIMS = [["month", "Month"], ["quarter", "Quarter"], ["m1", "M1 zone"], ["cluster", "Cluster"], ["entity", "Entity"],
    ["apcat", "A&P category"], ["svp", "SVP"], ["vertical", "Vertical"], ["owner", "Owner"], ["status", "Status"], ["vendor", "Vendor"], ["code", "Budget code"]];
  const SPLITS = [["fa", "Forecast / actual"], ["cluster", "Cluster"], ["m1", "M1 zone"], ["apcat", "A&P category"], ["svp", "SVP"], ["vertical", "Vertical"], ["status", "Status"], ["owner", "Owner"]];
  const PRESETS = [
    ["fa-month", "Forecast vs actual by month", { type: "bar", group: "month", split: "fa", show: "both", budget: true, cumulative: false, top: 0 }],
    ["cum-budget", "Spend over the year vs budget", { type: "line", group: "month", split: "fa", show: "both", budget: true, cumulative: true, top: 0 }],
    ["cluster-budget", "Budget, forecast and actual by cluster", { type: "bar", group: "cluster", split: "fa", show: "both", budget: true, cumulative: false, top: 0 }],
    ["entity-budget", "Budget, forecast and actual by entity", { type: "hbar", group: "entity", split: "fa", show: "both", budget: true, cumulative: false, top: 15 }],
    ["apcat-pie", "Share per A&P category", { type: "doughnut", group: "apcat", split: "fa", show: "forecast", budget: false, cumulative: false, top: 0 }],
    ["month-cluster", "Monthly spend per cluster", { type: "stacked", group: "month", split: "cluster", show: "actual", budget: false, cumulative: false, top: 0 }],
    ["month-apcat", "Monthly forecast per A&P category", { type: "stacked", group: "month", split: "apcat", show: "forecast", budget: false, cumulative: false, top: 0 }],
    ["svp", "By SVP", { type: "hbar", group: "svp", split: "fa", show: "both", budget: false, cumulative: false, top: 0 }],
    ["vertical", "By vertical", { type: "hbar", group: "vertical", split: "fa", show: "both", budget: false, cumulative: false, top: 0 }],
    ["vendors", "Top 10 vendors (actual)", { type: "hbar", group: "vendor", split: "fa", show: "actual", budget: false, cumulative: false, top: 10 }],
    ["status-entity", "Status mix per cluster", { type: "stacked", group: "cluster", split: "status", show: "forecast", budget: false, cumulative: false, top: 0 }],
  ];

  let cfg = load();
  let chart = null;
  function load() {
    const def = Object.assign({ preset: "fa-month" }, PRESETS[0][2]);
    try { return Object.assign(def, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { return def; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {} }

  const opt = (list, cur) => list.map(([v, l]) => `<option value="${v}" ${cur === v ? "selected" : ""}>${S.escapeHtml(l)}</option>`).join("");
  const isPie = () => cfg.type === "pie" || cfg.type === "doughnut";
  const timeGroup = () => cfg.group === "month" || cfg.group === "quarter";
  const budgetPossible = () => ["m1", "cluster", "entity", "month", "quarter"].includes(cfg.group) && cfg.split === "fa" && !isPie();

  // ctx from reporting.js: { year, quarter, month, lines (budget lines in period and scope),
  // valueOf(line, "forecast"|"actual"), budgetByEntity: { canonicalEntityId: amount }, measureLabel, drill(filters) }
  function keyOf(dim, a, ctx) {
    const ent = S.entityById(S.canonicalEntityId(a.entityId));
    switch (dim) {
      case "month": return MONTHS[new Date(a.date).getMonth()];
      case "quarter": return "Q" + (Math.floor(new Date(a.date).getMonth() / 3) + 1);
      case "m1": return (ent && ent.m1) || "No M1 zone";
      case "cluster": return (ent && ent.group) || "No cluster";
      case "entity": return ent ? ent.name : "No entity";
      case "apcat": { const c = S.apCategoryForActivity(a); return c ? c.name : "No A&P category"; }
      case "svp": { const v = S.svpById(a.svpId); return v ? v.name : "No SVP"; }
      case "vertical": { const v = S.verticalById(a.verticalId); return v ? v.name : "No vertical"; }
      case "owner": { const u = S.userById(a.ownerId); return u ? u.name : "No owner"; }
      case "status": { const st = S.statusById(a.statusId); return st ? st.name : "No status"; }
      case "vendor": return (a.vendor || "").trim() || "No vendor";
      case "code": { const c = (((S.state.data.settings.budgetCodes || {})[ctx.year]) || {})[a.entityId] || (((S.state.data.settings.budgetCodes || {})[ctx.year]) || {})[S.canonicalEntityId(a.entityId)]; return c || "No budget code"; }
    }
    return "";
  }
  function timeLabels(ctx) {
    if (cfg.group === "quarter") return ctx.quarter ? ["Q" + ctx.quarter] : ["Q1", "Q2", "Q3", "Q4"];
    let ms = MONTHS.map((m, i) => i);
    if (ctx.month !== "") ms = [+ctx.month];
    else if (ctx.quarter) { const q = +ctx.quarter; ms = [0, 1, 2].map((k) => (q - 1) * 3 + k); }
    return ms.map((i) => MONTHS[i]);
  }
  function budgetFor(groupLabel, ctx) {
    let t = 0;
    Object.entries(ctx.budgetByEntity).forEach(([id, amt]) => {
      const e = S.entityById(id);
      const k = cfg.group === "entity" ? (e ? e.name : "") : cfg.group === "cluster" ? ((e && e.group) || "No cluster") : ((e && e.m1) || "No M1 zone");
      if (k === groupLabel) t += amt;
    });
    return t;
  }

  // Returns { labels, datasets: [{ label, data, color, kind }], note }
  function compute(ctx) {
    const lines = ctx.lines;
    const showF = cfg.show !== "actual", showA = cfg.show !== "forecast";
    const pick = (a, which) => ctx.valueOf(a, which);
    let labels;
    const totals = {}; // label -> {f, a}
    lines.forEach((a) => { const k = keyOf(cfg.group, a, ctx); const t = totals[k] = totals[k] || { f: 0, a: 0 }; t.f += pick(a, "forecast"); t.a += pick(a, "actual"); });
    let other = null;
    if (timeGroup()) labels = timeLabels(ctx);
    else {
      labels = Object.keys(totals).sort((x, y) => (showF ? totals[y].f - totals[x].f : totals[y].a - totals[x].a) || x.localeCompare(y));
      if (cfg.group === "cluster" || cfg.group === "m1" || cfg.group === "entity") {
        // Groups with a budget but no lines yet still show when the budget is on.
        if (cfg.budget && budgetPossible()) Object.keys(ctx.budgetByEntity).forEach((id) => {
          const e = S.entityById(id); if (!ctx.budgetByEntity[id]) return;
          const k = cfg.group === "entity" ? e.name : cfg.group === "cluster" ? (e.group || "No cluster") : (e.m1 || "No M1 zone");
          if (!labels.includes(k)) labels.push(k);
        });
      }
      if (cfg.top && labels.length > cfg.top) { other = labels.slice(cfg.top); labels = labels.slice(0, cfg.top).concat(["Other"]); }
    }
    const labelOf = (a) => { const k = keyOf(cfg.group, a, ctx); return other && other.includes(k) ? "Other" : k; };
    const datasets = [];
    let note = "";
    if (isPie()) {
      const which = cfg.show === "actual" ? "actual" : "forecast";
      const data = labels.map(() => 0);
      lines.forEach((a) => { const i = labels.indexOf(labelOf(a)); if (i >= 0) data[i] += pick(a, which); });
      datasets.push({ label: which === "actual" ? "Actual" : "Forecast", data, kind: "pie" });
      if (cfg.show === "both") note = "A pie shows one value: forecast. Pick Actual to see the actual amounts.";
      if (data.some((v) => v < 0)) note = "Some values are negative and cannot show in a pie. Use a bar chart instead.";
      return { labels, datasets, note };
    }
    if (cfg.split === "fa") {
      const sum = (which) => { const d = labels.map(() => 0); lines.forEach((a) => { const i = labels.indexOf(labelOf(a)); if (i >= 0) d[i] += pick(a, which); }); return d; };
      if (showF) datasets.push({ label: "Forecast", data: sum("forecast"), color: C_FORECAST });
      if (showA) datasets.push({ label: "Actual", data: sum("actual"), color: C_ACTUAL });
    } else {
      const which = cfg.show === "forecast" ? "forecast" : "actual";
      if (cfg.show === "both") note = "Split by " + (SPLITS.find((x) => x[0] === cfg.split) || [])[1] + " shows the actual amounts. Pick Forecast to see the forecast.";
      const series = {};
      lines.forEach((a) => {
        const s = keyOf(cfg.split, a, ctx), i = labels.indexOf(labelOf(a));
        if (i < 0) return;
        (series[s] = series[s] || labels.map(() => 0))[i] += pick(a, which);
      });
      Object.entries(series).sort((x, y) => y[1].reduce((t, v) => t + v, 0) - x[1].reduce((t, v) => t + v, 0))
        .forEach(([s, d], i) => datasets.push({ label: s, data: d, color: PALETTE[i % PALETTE.length] }));
    }
    if (cfg.cumulative && timeGroup()) datasets.forEach((ds) => { let run = 0; ds.data = ds.data.map((v) => (run += v)); });
    if (cfg.budget && budgetPossible()) {
      const yb = Object.values(ctx.budgetByEntity).reduce((t, v) => t + v, 0);
      if (timeGroup()) {
        const per = cfg.group === "quarter" ? yb / 4 : yb / 12;
        const startIdx = cfg.group === "quarter" ? ["Q1", "Q2", "Q3", "Q4"].indexOf(labels[0]) : MONTHS.indexOf(labels[0]);
        const data = cfg.cumulative ? labels.map((l, i) => per * (startIdx + i + 1)) : labels.map(() => per);
        datasets.push({ label: cfg.cumulative ? "Budget (spread evenly)" : (cfg.group === "quarter" ? "Budget (quarterly average)" : "Budget (monthly average)"), data, color: C_BUDGET, kind: "budget-line" });
      } else {
        datasets.unshift({ label: "Yearly budget", data: labels.map((l) => l === "Other" ? other.reduce((t, k) => t + budgetFor(k, ctx), 0) : budgetFor(l, ctx)), color: C_BUDGET, kind: "budget" });
      }
    }
    if (!lines.length) note = "No budget lines in this period and scope.";
    return { labels, datasets, note };
  }

  function money(v) { return S.fmtMoney(v); }

  function html(ctx) {
    const typeBtns = TYPES.map(([v, l]) => `<button type="button" class="seg-btn ${cfg.type === v ? "on" : ""}" data-ctype="${v}">${l}</button>`).join("");
    const pie = isPie();
    return `
      <div class="card rc-card">
        <div class="rc-bar">
          <div><label>Quick pick</label><select id="rc-preset"><option value="">Custom</option>${opt(PRESETS.map((p) => [p[0], p[1]]), cfg.preset)}</select></div>
          <div><label>Chart type</label><div class="seg rc-types">${typeBtns}</div></div>
        </div>
        <div class="rc-bar">
          <div><label>Group by</label><select id="rc-group">${opt(DIMS, cfg.group)}</select></div>
          <div class="${pie ? "rc-off" : ""}"><label>Split by</label><select id="rc-split" ${pie ? "disabled" : ""}>${opt(SPLITS.filter((s) => s[0] !== cfg.group), cfg.split)}</select></div>
          <div><label>Values</label><select id="rc-show">${opt([["both", "Forecast and actual"], ["forecast", "Forecast"], ["actual", "Actual"]], cfg.show)}</select></div>
          <div class="${timeGroup() ? "rc-off" : ""}"><label>Show</label><select id="rc-top" ${timeGroup() ? "disabled" : ""}>${opt([["0", "All"], ["5", "Top 5"], ["10", "Top 10"], ["15", "Top 15"]], String(cfg.top || 0))}</select></div>
          <label class="rc-check ${budgetPossible() ? "" : "rc-off"}" title="${budgetPossible() ? "" : "Budget shows when you group by month, quarter, M1 zone, cluster or entity, split by forecast / actual, and use a bar or line chart."}"><input type="checkbox" id="rc-budget" ${cfg.budget && budgetPossible() ? "checked" : ""} ${budgetPossible() ? "" : "disabled"}> Budget</label>
          <label class="rc-check ${timeGroup() && !pie ? "" : "rc-off"}" title="Add each month to the ones before it, to see how spending builds up over the year."><input type="checkbox" id="rc-cum" ${cfg.cumulative && timeGroup() ? "checked" : ""} ${timeGroup() && !pie ? "" : "disabled"}> Cumulative</label>
          <div class="grow"></div>
          <button type="button" class="secondary" id="rc-png">Download image</button>
        </div>
        <p class="muted small" id="rc-note" style="margin:6px 0 0"></p>
        <div class="rc-canvas"><canvas id="rc-chart"></canvas></div>
        <p class="muted small" style="margin:8px 0 0">${S.escapeHtml(ctx.measureLabel)} amounts, budget lines in ${S.escapeHtml(String(ctx.year))}${ctx.quarter ? " Q" + S.escapeHtml(String(ctx.quarter)) : ""}${ctx.month !== "" ? ", " + MONTHS[+ctx.month] : ""}, using the filters above. ${["cluster", "entity"].includes(cfg.group) ? "Click a bar to open those lines in Budget." : ""}</p>
      </div>
      <div class="card" id="rc-table"></div>`;
  }

  function tableHtml(res) {
    if (!res.labels.length) return `<p class="muted">Nothing to show.</p>`;
    const dims = Object.fromEntries(DIMS);
    const tot = res.datasets.map((ds) => ds.data.reduce((t, v) => t + v, 0));
    const cum = cfg.cumulative && timeGroup();
    return `<h2 style="margin:0 0 8px">The numbers</h2>
      <div class="table-wrap"><table style="width:100%">
        <thead><tr><th>${S.escapeHtml(dims[cfg.group] || "")}</th>${res.datasets.map((d) => `<th class="num">${S.escapeHtml(d.label)}</th>`).join("")}</tr></thead>
        <tbody>${res.labels.map((l, i) => `<tr><td>${S.escapeHtml(l)}</td>${res.datasets.map((d) => `<td class="num">${money(d.data[i])}</td>`).join("")}</tr>`).join("")}</tbody>
        ${cum ? "" : `<tfoot><tr class="total-row"><td>Total</td>${tot.map((t) => `<td class="num">${money(t)}</td>`).join("")}</tr></tfoot>`}
      </table></div>`;
  }

  function draw(host, ctx) {
    if (chart) { chart.destroy(); chart = null; }
    const res = compute(ctx);
    host.querySelector("#rc-note").textContent = res.note || "";
    host.querySelector("#rc-table").innerHTML = tableHtml(res);
    const canvas = host.querySelector("#rc-chart");
    if (!window.Chart || !canvas) { host.querySelector("#rc-note").textContent = "The chart library did not load. Check your internet connection and reload."; return; }
    if (window.MB_THEME) window.MB_THEME.chartColors();
    const dark = window.MB_THEME && window.MB_THEME.isDark();
    const pie = isPie();
    const horiz = cfg.type === "hbar";
    const stacked = cfg.type === "stacked";
    const lineType = cfg.type === "line";
    const datasets = res.datasets.map((d) => {
      if (pie) return { label: d.label, data: d.data, backgroundColor: res.labels.map((l, i) => l === "Other" ? "#8f8f8f" : PALETTE[i % PALETTE.length]), borderColor: dark ? "#1d2026" : "#fff", borderWidth: 2 };
      if (d.kind === "budget-line") return { label: d.label, data: d.data, type: "line", borderColor: d.color, backgroundColor: "transparent", borderDash: [6, 4], pointRadius: 0, tension: 0, order: 0 };
      if (lineType) return { label: d.label, data: d.data, type: "line", borderColor: d.color, backgroundColor: d.color, pointRadius: 3, tension: 0.25, fill: false };
      return { label: d.label, data: d.data, backgroundColor: d.kind === "budget" ? (dark ? "rgba(143,143,143,0.45)" : "rgba(143,143,143,0.35)") : d.color, borderColor: d.kind === "budget" ? d.color : undefined, borderWidth: d.kind === "budget" ? 1 : 0, stack: stacked ? (d.kind === "budget" ? "budget" : "s") : undefined, order: 1 };
    });
    const fmtAxis = (v) => "€" + new Intl.NumberFormat("en-US", { notation: Math.abs(v) >= 100000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(v);
    const valueAxis = { stacked, beginAtZero: true, ticks: { callback: fmtAxis } };
    const catAxis = { stacked, ticks: { autoSkip: !horiz } };
    const h = horiz ? Math.max(360, res.labels.length * (stacked ? 26 : 22 + 14 * Math.max(1, datasets.length)) + 80) : 420;
    canvas.parentElement.style.height = Math.min(h, 1400) + "px";
    chart = new Chart(canvas, {
      type: pie ? cfg.type : "bar",
      data: { labels: res.labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        indexAxis: horiz ? "y" : "x",
        plugins: {
          legend: { position: pie ? "right" : "top" },
          tooltip: { callbacks: { label: (c) => {
            const v = pie ? c.parsed : (horiz ? c.parsed.x : c.parsed.y);
            let s = `${c.dataset.label}: ${money(v)}`;
            if (pie) { const t = c.dataset.data.reduce((a, b) => a + b, 0); if (t) s += ` (${Math.round(v / t * 100)}%)`; }
            return s;
          } } },
        },
        scales: pie ? {} : (horiz ? { x: valueAxis, y: catAxis } : { x: catAxis, y: valueAxis }),
        onClick: (evt, els) => {
          if (!els.length || !["cluster", "entity"].includes(cfg.group) || !ctx.drill) return;
          const label = res.labels[els[0].index];
          if (label === "Other" || /^No /.test(label)) return;
          if (cfg.group === "cluster") ctx.drill({ year: ctx.year, group: label });
          else { const e = S.uniqueEntities().find((x) => x.name === label); if (e) ctx.drill({ year: ctx.year, entityId: e.id }); }
        },
        onHover: (evt, els) => { evt.native.target.style.cursor = els.length && ["cluster", "entity"].includes(cfg.group) ? "pointer" : "default"; },
      },
    });
  }

  function render(host, ctx) {
    host.innerHTML = html(ctx);
    const set = (patch) => { Object.assign(cfg, patch); if (!("preset" in patch)) cfg.preset = matchPreset(); save(); render(host, ctx); };
    host.querySelector("#rc-preset").onchange = (e) => { const p = PRESETS.find((x) => x[0] === e.target.value); if (p) set(Object.assign({ preset: p[0] }, p[2])); else set({ preset: "" }); };
    host.querySelectorAll("[data-ctype]").forEach((b) => { b.onclick = () => set({ type: b.dataset.ctype }); });
    host.querySelector("#rc-group").onchange = (e) => { const g = e.target.value; set({ group: g, split: cfg.split === g ? "fa" : cfg.split }); };
    host.querySelector("#rc-split").onchange = (e) => set({ split: e.target.value, show: e.target.value !== "fa" && cfg.show === "both" ? "actual" : cfg.show });
    host.querySelector("#rc-show").onchange = (e) => set({ show: e.target.value });
    host.querySelector("#rc-top").onchange = (e) => set({ top: +e.target.value });
    host.querySelector("#rc-budget").onchange = (e) => set({ budget: e.target.checked });
    host.querySelector("#rc-cum").onchange = (e) => set({ cumulative: e.target.checked });
    host.querySelector("#rc-png").onclick = () => {
      if (!chart) return;
      const a = document.createElement("a");
      const name = (PRESETS.find((p) => p[0] === cfg.preset) || [0, "chart"])[1];
      a.download = `Marketing Hub - ${name} - ${ctx.year}.png`.replace(/[\\/:*?"<>|]/g, "-");
      // Draw on a solid background so the image is readable outside the app.
      const c = chart.canvas, out = document.createElement("canvas"); out.width = c.width; out.height = c.height;
      const g = out.getContext("2d"); g.fillStyle = (window.MB_THEME && window.MB_THEME.isDark()) ? "#1d2026" : "#ffffff"; g.fillRect(0, 0, out.width, out.height); g.drawImage(c, 0, 0);
      a.href = out.toDataURL("image/png"); a.click();
    };
    draw(host, ctx);
  }
  function matchPreset() {
    const keys = ["type", "group", "split", "show", "budget", "cumulative", "top"];
    const p = PRESETS.find((x) => keys.every((k) => (x[2][k] || 0) === (cfg[k] || 0)));
    return p ? p[0] : "";
  }
  function destroy() { if (chart) { chart.destroy(); chart = null; } }

  window.MB_REPCHARTS = { render, destroy, _compute: compute, _cfg: () => cfg };
})();
