// A&P planning file (OBI EUR): fills the finance template (templates/TEMPLATE_OBI_EUR_AP.xlsx) with
// one row per budget line of a year. The template is edited in place (its XML), so its layout,
// drop-down lists, tables and Reference sheet stay exactly as finance made them.
// Columns: A-C copied from the template's first row, D = M3 team (from entity / cluster),
// E = budget code, F = line name, I/J = dates, K = A&P category, L = SVP, M = partner,
// Q-AB = forecast net in kEUR in the line's month, AC-AE = the template's sums.
// Left empty on purpose: G, H (filled in by hand), N, O, P.
(function () {
  const S = window.MB_STATE;
  const TEMPLATE = "templates/TEMPLATE_OBI_EUR_AP.xlsx";
  const MONTH_COLS = ["Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "AA", "AB"];
  const ALL_COLS = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P", ...MONTH_COLS, "AC","AD","AE"];

  const esc = (x) => String(x == null ? "" : x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const unesc = (x) => String(x || "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
  const norm = (x) => String(x || "").trim().toLowerCase().replace(/\s+/g, " ");
  const fmtD = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ""); return m ? `${m[3]}/${m[2]}/${m[1]}` : ""; };

  // M3 team for a budget line. Cluster first (Digital & Data, Cloud Entities), then the entity name.
  const M3_RULES = [
    { key: /^d&d$/i, test: (cl) => /digital\s*(&|and)\s*data/.test(cl) },
    { key: /^cloud$/i, test: (cl) => /cloud/.test(cl) },
    { key: /verticals?$/i, test: (cl, nm) => /vertical/.test(nm) },
    { key: /- ?se$/i, test: (cl, nm) => /spain|italy|iberia|southern/.test(nm) },
    { key: /benelux$/i, test: (cl, nm) => /belgium|netherlands|luxemb|benelux|belux/.test(nm) },
    { key: /- ?uk$/i, test: (cl, nm) => /\buk\b|united kingdom|ireland|britain/.test(nm) },
    { key: /- ?gea$/i, test: (cl, nm) => /germany|austria|\bgea\b|dach/.test(nm) },
    { key: /switzerland$/i, test: (cl, nm) => /switzerland|swiss/.test(nm) },
    { key: /nordics?$/i, test: (cl, nm) => /nordic|norway|sweden|denmark|finland/.test(nm) },
  ];
  function m3For(line, labels) {
    const ent = S.entityById(line.entityId) || S.entityById(S.canonicalEntityId(line.entityId)) || {};
    const cl = norm(ent.group), nm = norm(ent.name);
    for (const r of M3_RULES) {
      if (!r.test(cl, nm)) continue;
      const lab = labels.find((l) => r.key.test(l.trim()));
      if (lab) return lab;
    }
    return "";
  }
  // Pick the template's own spelling for a value (its lists have odd spacing and typos).
  function pickFrom(list, name) {
    const n = norm(name);
    if (!n) return "";
    return list.find((x) => norm(x) === n) || list.find((x) => norm(x).replace(/infrustructure/, "infrastructure") === n) || "";
  }
  function svpFor(line, svpList) {
    const svp = line.svpId ? S.svpById(line.svpId) : null;
    const hit = svp ? pickFrom(svpList, svp.name) : "";
    return hit || svpList.find((x) => norm(x) === "all") || "All";
  }

  // ---- reading the template ----
  function sharedStrings(xml) {
    return [...(xml || "").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => unesc([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join("")));
  }
  function cellsOf(rowXml) {
    const out = {};
    for (const m of rowXml.matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = m[2], inner = m[3] || "";
      const s = (/\ss="(\d+)"/.exec(attrs) || [])[1] || "";
      const t = (/\st="(\w+)"/.exec(attrs) || [])[1] || "";
      const v = (/<v>([\s\S]*?)<\/v>/.exec(inner) || [])[1];
      out[m[1]] = { s, t, v };
    }
    return out;
  }
  function rowsOf(sheetXml) {
    return [...sheetXml.matchAll(/<row [^>]*r="(\d+)"[^>]*?(?:\/>|>[\s\S]*?<\/row>)/g)].map((m) => ({ r: +m[1], xml: m[0] }));
  }
  const textOf = (cell, ss) => !cell ? "" : cell.t === "s" ? (ss[+cell.v] || "") : unesc(cell.v || "");

  async function loadTemplate() {
    if (!window.JSZip) throw new Error("The zip library did not load. Check your internet connection and reload.");
    const res = await fetch(TEMPLATE, { cache: "no-store" });
    if (!res.ok) throw new Error("The template file is missing from the app (" + TEMPLATE + ").");
    const zip = await window.JSZip.loadAsync(await res.arrayBuffer());
    const ss = sharedStrings(await (zip.file("xl/sharedStrings.xml") || { async: async () => "" }).async("string"));
    const sheet = await zip.file("xl/worksheets/sheet1.xml").async("string");
    const ref = await zip.file("xl/worksheets/sheet2.xml").async("string");
    const rows = rowsOf(sheet), first = rows.find((r) => r.r === 5);
    if (!first) throw new Error("The template has no example row 5.");
    const c5 = cellsOf(first.xml);
    const fixed = { A: textOf(c5.A, ss), B: textOf(c5.B, ss), C: textOf(c5.C, ss) };
    const styles = {}; ALL_COLS.forEach((c) => { styles[c] = (c5[c] && c5[c].s) || "9"; });
    const rowAttrs = (/<row ([^>]*)>/.exec(first.xml) || [])[1].replace(/\s*r="\d+"/, "");
    const m3 = rows.filter((r) => r.r >= 5).map((r) => textOf(cellsOf(r.xml).D, ss)).filter((x) => x.trim());
    const refRows = rowsOf(ref).filter((r) => r.r >= 3).map((r) => cellsOf(r.xml));
    const apList = refRows.map((c) => textOf(c.A, ss)).filter((x) => x.trim());
    const svpList = refRows.map((c) => textOf(c.E, ss)).filter((x) => x.trim());
    return { zip, sheet, fixed, styles, rowAttrs, m3, apList, svpList };
  }

  // ---- building the rows ----
  function collect(year, tpl) {
    const data = S.state.data;
    const codes = ((data.settings.budgetCodes || {})[year]) || {};
    const evById = {}; (data.events || []).forEach((e) => { evById[e.id] = e; });
    const rows = [], skipped = [];
    (data.activities || []).forEach((a) => {
      if (!a.date || +a.date.slice(0, 4) !== +year) return;
      const st = S.statusById(a.statusId);
      if (st && /cancel/i.test(st.name || "")) return;
      const m3 = m3For(a, tpl.m3);
      const ent = S.entityById(a.entityId);
      if (!m3) { skipped.push({ name: a.name, why: "no M3 team for entity " + ((ent && ent.name) || "(none)") }); return; }
      const evs = (a.eventIds || []).map((id) => evById[id]).filter(Boolean);
      const endIso = evs.map((e) => e.end || e.start || "").filter((d) => d > a.date).sort().pop() || "";
      const partners = [...new Set(evs.flatMap((e) => (e.partners || []).map((p) => p.name)).filter(Boolean))];
      const ap = a.apCategoryId ? S.apCategoryById(a.apCategoryId) : null;
      const net = ((a.forecastGross || 0) - (a.forecastPartner || 0)) / 1000;
      rows.push({
        m3, date: a.date, name: a.name || "",
        code: codes[a.entityId] || codes[S.canonicalEntityId(a.entityId)] || "",
        start: fmtD(a.date), end: fmtD(endIso),
        ap: ap ? (pickFrom(tpl.apList, ap.name) || ap.name) : "",
        apOff: !ap || !pickFrom(tpl.apList, ap.name),
        svp: svpFor(a, tpl.svpList),
        partner: partners.join(", ") || (a.vendor || ""),
        month: +a.date.slice(5, 7) - 1,
        kEur: Math.round(net * 100) / 100,
      });
    });
    const order = (m) => { const i = tpl.m3.indexOf(m); return i < 0 ? 99 : i; };
    rows.sort((x, y) => order(x.m3) - order(y.m3) || x.date.localeCompare(y.date) || x.name.localeCompare(y.name));
    return { rows, skipped };
  }

  function rowXml(r, n, tpl) {
    const st = tpl.styles;
    const str = (col, v) => v === "" || v == null ? `<c r="${col}${n}" s="${st[col]}"/>` : `<c r="${col}${n}" s="${st[col]}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
    const num = (col, v) => `<c r="${col}${n}" s="${st[col]}"><v>${v}</v></c>`;
    const f = (col, x) => `<c r="${col}${n}" s="${st[col]}"><f>${x}</f></c>`;
    const cells = [
      str("A", tpl.fixed.A), str("B", tpl.fixed.B), str("C", tpl.fixed.C), str("D", r.m3), str("E", r.code),
      str("F", r.name), str("G", ""), str("H", ""), str("I", r.start), str("J", r.end), str("K", r.ap), str("L", r.svp),
      str("M", r.partner), str("N", ""), str("O", ""), str("P", ""),
      ...MONTH_COLS.map((c, i) => i === r.month ? num(c, r.kEur) : str(c, "")),
      f("AC", `SUM(Q${n}:V${n})`), f("AD", `SUM(W${n}:AB${n})`), f("AE", `SUM(AC${n}:AD${n})`),
    ];
    return `<row r="${n}" ${tpl.rowAttrs}>${cells.join("")}</row>`;
  }

  async function build(year) {
    const tpl = await loadTemplate();
    const { rows, skipped } = collect(year, tpl);
    const last = Math.max(5, 4 + rows.length);
    let sheet = tpl.sheet;
    // Drop the example rows (5 and down) and write ours.
    sheet = sheet.replace(/<row [^>]*r="(\d+)"[^>]*?(?:\/>|>[\s\S]*?<\/row>)/g, (m, r) => (+r >= 5 ? "" : m));
    sheet = sheet.replace("</sheetData>", rows.map((r, i) => rowXml(r, 5 + i, tpl)).join("") + "</sheetData>");
    // Title in A1 follows the year.
    sheet = sheet.replace(/<c r="A1"([^>]*?)(?:\/>|>[\s\S]*?<\/c>)/, (m, attrs) =>
      `<c r="A1"${attrs.replace(/\s*t="\w+"/, "")} t="inlineStr"><is><t xml:space="preserve">${esc(year + " Marcom planning input file")}</t></is></c>`);
    sheet = sheet.replace(/<dimension ref="[^"]*"\/>/, `<dimension ref="A1:AE${last}"/>`);
    // Drop-down lists cover all filled rows.
    const tailAt = sheet.indexOf("</sheetData>");
    sheet = sheet.slice(0, tailAt) + sheet.slice(tailAt).replace(/\b([A-Z]{1,2})5:\1\d+\b/g, (m, c) => `${c}5:${c}${last}`);
    const zip = tpl.zip;
    zip.file("xl/worksheets/sheet1.xml", sheet);
    // Sheet name and workbook: year in the name, recalculate on open, no stale calculation chain.
    const sheetName = (x) => x.replace(/!\d{4} Marcom planning input/g, "!" + year + " Marcom planning input");
    let wb = sheetName(await zip.file("xl/workbook.xml").async("string"));
    wb = wb.replace(/<calcPr([^>]*?)\/>/, (m, a) => `<calcPr${a.replace(/\s*fullCalcOnLoad="\d"/, "")} fullCalcOnLoad="1"/>`);
    zip.file("xl/workbook.xml", wb);
    if (zip.file("docProps/app.xml")) zip.file("docProps/app.xml", sheetName(await zip.file("docProps/app.xml").async("string")));
    if (zip.file("xl/calcChain.xml")) {
      zip.remove("xl/calcChain.xml");
      zip.file("[Content_Types].xml", (await zip.file("[Content_Types].xml").async("string")).replace(/<Override [^>]*calcChain[^>]*\/>/, ""));
      zip.file("xl/_rels/workbook.xml.rels", (await zip.file("xl/_rels/workbook.xml.rels").async("string")).replace(/<Relationship [^>]*calcChain[^>]*\/>/, ""));
    }
    const blob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", compression: "DEFLATE" });
    return { blob, rows, skipped };
  }

  function download(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  // The button: ask for the year, build, download, then show what went in and what was left out.
  function open(defaultYear) {
    const ys = new Set((S.state.data.activities || []).map((a) => +(a.date || "").slice(0, 4)).filter(Boolean));
    const now = new Date().getFullYear(); ys.add(now); ys.add(now + 1);
    const years = [...ys].sort();
    const def = defaultYear && years.includes(+defaultYear) ? +defaultYear : now + 1;
    const m = S.openModal(`
      <h2>A&amp;P planning file (OBI EUR)</h2>
      <p class="muted small" style="margin:0 0 10px">Fills the finance template with one row per budget line of the year: forecast net in kEUR in the line's month. Cancelled lines are left out. Description, worldwide initiative and Budget FR / International stay empty for you to fill in.</p>
      <label>Year</label><select id="ap-year">${years.map((y) => `<option ${y === def ? "selected" : ""}>${y}</option>`).join("")}</select>
      <div id="ap-result" class="small" style="margin-top:10px"></div>
      <div class="actions"><button class="secondary" id="ap-close">Close</button><button class="primary" id="ap-go">Create file</button></div>`);
    m.querySelector("#ap-close").onclick = S.closeModal;
    m.querySelector("#ap-go").onclick = async () => {
      const y = +m.querySelector("#ap-year").value, out = m.querySelector("#ap-result"), btn = m.querySelector("#ap-go");
      btn.disabled = true; out.textContent = "Creating the file...";
      try {
        const { blob, rows, skipped } = await build(y);
        download(blob, `OBI_EUR_AP_${y}.xlsx`);
        const tot = Math.round(rows.reduce((t, r) => t + r.kEur, 0) * 100) / 100;
        const per = {}; rows.forEach((r) => { per[r.m3.trim()] = (per[r.m3.trim()] || 0) + 1; });
        out.innerHTML = `<p style="margin:0 0 6px"><b>${rows.length} budget lines</b> written, ${tot.toLocaleString("en-US")} kEUR in total. ${Object.entries(per).map(([k, v]) => `${S.escapeHtml(k)}: ${v}`).join(" · ")}</p>` +
          (rows.some((r) => r.apOff) ? `<p style="margin:0 0 6px;color:var(--fg-aa0000)"><b>Check the A&amp;P category</b> of: ${rows.filter((r) => r.apOff).map((r) => S.escapeHtml(r.name)).slice(0, 10).join(", ")}. It is empty or not one of the template's categories.</p>` : "") +
          (skipped.length ? `<p style="margin:0;color:var(--fg-aa0000)"><b>${skipped.length} left out</b> because no M3 team matches their entity:</p><ul style="margin:4px 0 0;padding-left:18px">${skipped.slice(0, 15).map((s) => `<li>${S.escapeHtml(s.name || "(no name)")} (${S.escapeHtml(s.why)})</li>`).join("")}${skipped.length > 15 ? `<li>and ${skipped.length - 15} more</li>` : ""}</ul>` : "");
      } catch (e) {
        console.error(e);
        out.innerHTML = `<span style="color:var(--fg-aa0000)">Could not create the file: ${S.escapeHtml(e.message)}</span>`;
      } finally { btn.disabled = false; }
    };
  }

  window.MB_APFILE = { open, build, _collect: collect };
})();
