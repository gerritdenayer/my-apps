// Budget Structure tab: a top-down org chart of M1 > Cluster > Entity, with each entity's
// yearly budget and rolled-up totals. Users who can edit budgets can also set the numbers
// here and copy a previous year forward.
(function () {
  const S = window.MB_STATE;
  const view = { year: new Date().getFullYear(), editing: false };

  function ensureStyles() {
    if (document.getElementById("bs-styles")) return;
    const css = document.createElement("style");
    css.id = "bs-styles";
    css.textContent = `
      #tab-budget-structure .bs-toolbar{display:flex;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:16px}
      #tab-budget-structure .bs-total{margin-left:auto;font-size:14px;color:#374151}
      #tab-budget-structure .bs-total strong{font-size:18px;color:#111}
      .bs-m1{border:1px solid #e5e7eb;border-radius:10px;padding:14px;margin-bottom:16px;background:#fff}
      .bs-m1-head{display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:15px;border-left:4px solid #ff6a00;padding:8px 12px;background:#fff7ed;border-radius:6px}
      .bs-connector{height:14px;width:2px;background:#d1d5db;margin:0 auto}
      .bs-clusters{display:flex;flex-wrap:wrap;gap:12px}
      .bs-cluster{flex:1 1 260px;min-width:240px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;background:#fff}
      .bs-cluster-head{display:flex;justify-content:space-between;align-items:center;gap:8px;background:#f3f4f6;padding:8px 10px;font-weight:600;font-size:13px}
      .bs-ent{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:5px 10px;border-top:1px solid #f1f5f9;font-size:13px}
      .bs-ent-name{color:#374151}
      .bs-ent-amt{font-variant-numeric:tabular-nums;color:#111}
      .bs-ent.zero .bs-ent-amt{color:#9ca3af}
      #tab-budget-structure .bs-amt-input{width:120px;text-align:right;font-size:13px;padding:3px 6px}
      .bs-cluster-total{font-variant-numeric:tabular-nums}
      .bs-empty{color:#6b7280}
    `;
    document.head.appendChild(css);
  }

  function yearOptions() {
    const cur = new Date().getFullYear();
    const ys = new Set([cur, cur + 1, cur - 1, view.year]);
    Object.keys((S.state.data.settings.yearlyBudgets) || {}).forEach((y) => ys.add(+y));
    return Array.from(ys).sort().map((y) => `<option ${y === view.year ? "selected" : ""} value="${y}">${y}</option>`).join("");
  }

  const m1Key = (e) => (e.m1 || "").trim() || "(no zone)";
  const clKey = (e) => (e.group || "").trim() || "(no cluster)";

  function render() {
    ensureStyles();
    const root = document.getElementById("tab-budget-structure");
    const data = S.state.data;
    if (!data) { root.innerHTML = ""; return; }
    const canEdit = !window.MB_AUTH || window.MB_AUTH.can("editBudget");
    const ents = data.settings.entities || [];

    const ybAll = data.settings.yearlyBudgets || (data.settings.yearlyBudgets = {});
    if (canEdit && !ybAll[view.year]) ybAll[view.year] = {};
    const yb = ybAll[view.year] || {};

    const tree = {};
    ents.forEach((e) => { const m = m1Key(e), c = clKey(e); tree[m] = tree[m] || {}; (tree[m][c] = tree[m][c] || []).push(e); });
    const grand = ents.reduce((s, e) => s + (yb[e.id] || 0), 0);

    let html = `
      <div class="bs-toolbar">
        <div><label>Year</label><select id="bs-year">${yearOptions()}</select></div>
        ${canEdit ? (view.editing
          ? `<div><button id="bs-done" class="primary">Done editing</button></div>
             <div><button id="bs-copy" class="secondary">Copy from ${view.year - 1}</button></div>`
          : `<div><button id="bs-edit" class="secondary">Edit budgets</button></div>`) : ""}
        <div class="bs-total">Total budget ${view.year}: <strong id="bs-grand">${S.fmtMoney(grand)}</strong></div>
      </div>
    `;

    if (ents.length === 0) {
      html += `<p class="bs-empty">No entities yet. Add them in Settings &gt; Entity structure.</p>`;
      root.innerHTML = html;
      wire(root, canEdit);
      return;
    }

    Object.keys(tree).sort().forEach((m) => {
      const clusters = tree[m];
      const clNames = Object.keys(clusters).sort();
      const m1Total = clNames.reduce((s, c) => s + clusters[c].reduce((ss, e) => ss + (yb[e.id] || 0), 0), 0);
      html += `
        <div class="bs-m1">
          <div class="bs-m1-head"><span>${S.escapeHtml(m)}</span><span data-m1total="${S.escapeHtml(m)}">${S.fmtMoney(m1Total)}</span></div>
          <div class="bs-connector"></div>
          <div class="bs-clusters">
            ${clNames.map((c) => {
              const list = clusters[c].slice().sort((a, b) => (yb[b.id] || 0) - (yb[a.id] || 0));
              const cTotal = list.reduce((s, e) => s + (yb[e.id] || 0), 0);
              return `
                <div class="bs-cluster">
                  <div class="bs-cluster-head"><span>${S.escapeHtml(c)}</span><span class="bs-cluster-total" data-ctotal="${S.escapeHtml(m)}|${S.escapeHtml(c)}">${S.fmtMoney(cTotal)}</span></div>
                  ${list.map((e) => {
                    const amt = yb[e.id] || 0;
                    const right = (canEdit && view.editing)
                      ? `<input class="bs-amt-input" data-id="${e.id}" type="number" step="100" value="${amt}" />`
                      : `<span class="bs-ent-amt">${amt ? S.fmtMoney(amt) : "-"}</span>`;
                    return `<div class="bs-ent${amt ? "" : " zero"}"><span class="bs-ent-name">${S.escapeHtml(e.name)}</span>${right}</div>`;
                  }).join("")}
                </div>`;
            }).join("")}
          </div>
        </div>`;
    });

    root.innerHTML = html;
    wire(root, canEdit);
  }

  // Recompute cluster, zone and grand totals in place after an edit (keeps the inputs put).
  function recalc(root) {
    const data = S.state.data;
    const yb = (data.settings.yearlyBudgets || {})[view.year] || {};
    const ents = data.settings.entities || [];
    const cT = {}, mT = {}; let grand = 0;
    ents.forEach((e) => {
      const v = yb[e.id] || 0, m = m1Key(e), c = clKey(e);
      cT[m + "|" + c] = (cT[m + "|" + c] || 0) + v;
      mT[m] = (mT[m] || 0) + v;
      grand += v;
    });
    root.querySelectorAll("[data-ctotal]").forEach((el) => { el.textContent = S.fmtMoney(cT[el.dataset.ctotal] || 0); });
    root.querySelectorAll("[data-m1total]").forEach((el) => { el.textContent = S.fmtMoney(mT[el.dataset.m1total] || 0); });
    const g = root.querySelector("#bs-grand"); if (g) g.textContent = S.fmtMoney(grand);
  }

  async function copyPrev() {
    const data = S.state.data;
    const ybAll = data.settings.yearlyBudgets || (data.settings.yearlyBudgets = {});
    const bcAll = data.settings.budgetCodes || (data.settings.budgetCodes = {});
    const prevYb = ybAll[view.year - 1], prevBc = bcAll[view.year - 1];
    if (!prevYb && !prevBc) { S.toast(`No budget for ${view.year - 1}`, "error"); return; }
    if (ybAll[view.year] && Object.keys(ybAll[view.year]).length) {
      if (!await S.confirmDialog(`Overwrite the ${view.year} budget with a copy of ${view.year - 1}?`)) return;
    }
    if (prevYb) ybAll[view.year] = { ...prevYb };
    if (prevBc) bcAll[view.year] = { ...prevBc };
    S.scheduleSave();
    render();
    S.toast(`Copied ${view.year - 1} into ${view.year}`, "success");
  }

  function wire(root, canEdit) {
    const y = root.querySelector("#bs-year");
    if (y) y.onchange = (e) => { view.year = +e.target.value; render(); };
    if (!canEdit) return;
    const editBtn = root.querySelector("#bs-edit");
    if (editBtn) editBtn.onclick = () => { view.editing = true; render(); };
    const doneBtn = root.querySelector("#bs-done");
    if (doneBtn) doneBtn.onclick = () => { view.editing = false; render(); };
    if (!view.editing) return;
    const copy = root.querySelector("#bs-copy");
    if (copy) copy.onclick = () => copyPrev();
    root.querySelectorAll(".bs-amt-input").forEach((inp) => {
      inp.onchange = () => {
        const data = S.state.data;
        const ybAll = data.settings.yearlyBudgets || (data.settings.yearlyBudgets = {});
        const yb = ybAll[view.year] || (ybAll[view.year] = {});
        yb[inp.dataset.id] = parseFloat(inp.value) || 0;
        S.scheduleSave();
        recalc(root);
      };
    });
  }

  window.MB_STRUCTURE = { render };
})();
