// Roadmap slide export. Turns a grouped, date-positioned model into an Orange-branded PowerPoint
// swimlane roadmap (one slide). Uses PptxGenJS (loaded from CDN in index.html).
(function () {
  const ORANGE = "FF7900", GREY = "3A3A3A", WHITE = "FFFFFF", BLACK = "000000", SEP = "666666";
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Layout constants shared by the page planner and the slide drawer (inches, 13.33 x 7.5 slide).
  const LANE_TOP = 2.05, BOTTOM = 7.1, LANE_GAP = 0.14, BOX_GAP = 0.09;
  // Smallest box that still reads well: taller when each box carries more detail lines.
  const minBoxH = (nLines) => 0.38 + 0.1 * Math.min(3, nLines);

  // Place every item on the year axis (0..1) and pack each lane into rows without overlap.
  function packLanes(model) {
    const year = model.year;
    const frac = (d) => {
      const dt = new Date(d); if (isNaN(dt)) return 0;
      if (dt.getFullYear() < year) return 0;
      if (dt.getFullYear() > year) return 1;
      const dim = new Date(year, dt.getMonth() + 1, 0).getDate();
      return Math.max(0, Math.min(1, (dt.getMonth() + (dt.getDate() - 1) / dim) / 12));
    };
    return model.lanes.map((ln) => {
      const items = ln.items.map((it) => {
        let a = frac(it.start), b = frac(it.end || it.start);
        if (b - a < 0.055) b = Math.min(1, a + 0.11);
        return { name: it.name, lines: it.lines || [], kind: it.kind, a, b };
      });
      // Items arrive in the order chosen in the export pop-up (keepOrder); otherwise by start.
      if (!model.keepOrder) items.sort((p, q) => p.a - q.a);
      // Each item goes in the first row where it does not overlap anything already there.
      const rows = [];
      items.forEach((it) => {
        let r = rows.find((row) => row.every((o) => o.b + 0.008 <= it.a || it.b + 0.008 <= o.a));
        if (!r) { r = []; rows.push(r); }
        r.push(it);
      });
      return { label: ln.label, rows };
    });
  }

  // Split the lanes over as many slides as needed. Whole lanes stay together on one slide; a lane
  // that is too tall for a slide on its own is cut into parts, marked "(cont.)" after the first.
  function planPages(model) {
    const lanes = packLanes(model);
    const nLines = Math.max(0, ...lanes.flatMap((l) => l.rows.flat().map((it) => Math.min(3, (it.lines || []).length))));
    const rowH = minBoxH(nLines) + BOX_GAP;
    const avail = BOTTOM - LANE_TOP + BOX_GAP;
    const maxRows = Math.max(1, Math.floor(avail / rowH));
    const height = (laneList) => laneList.reduce((h, l) => h + l.rows.length * rowH, 0) + Math.max(0, laneList.length - 1) * LANE_GAP;
    const pages = [];
    let cur = [];
    const flush = () => { if (cur.length) { pages.push(cur); cur = []; } };
    lanes.forEach((ln) => {
      if (ln.rows.length > maxRows) {
        // Too big for one slide: cut it into even parts on their own slides. The last part stays
        // open, so the next lane can join it when there is room.
        flush();
        const parts = Math.ceil(ln.rows.length / maxRows), size = Math.ceil(ln.rows.length / parts);
        for (let i = 0; i < ln.rows.length; i += size) {
          const part = { label: ln.label ? ln.label + (i ? " (cont.)" : "") : "", rows: ln.rows.slice(i, i + size) };
          if (i + size < ln.rows.length) pages.push([part]); else cur = [part];
        }
        return;
      }
      if (cur.length && height(cur.concat([ln])) > avail) flush();
      cur.push(ln);
    });
    flush();
    return pages.length ? pages : [[]];
  }

  function drawSlide(pptx, model, lanes, pageNo, pageCount) {
    const s = pptx.addSlide();
    s.background = { color: BLACK };

    const LX = 0.3, LW = 1.65;
    const X0 = 2.05, X1 = 13.0, W = X1 - X0;

    // Title bar
    s.addShape("roundRect", { x: 0.3, y: 0.22, w: 9.4, h: 0.72, rectRadius: 0.04, fill: { color: WHITE }, line: { color: WHITE } });
    s.addText(model.title || "Campaign roadmap", { x: 0.45, y: 0.22, w: 9.1, h: 0.72, fontFace: "Arial", fontSize: 26, bold: true, color: BLACK, align: "left", valign: "middle", fit: "shrink" });

    // Legend: the box name plus the detail fields chosen in the export pop-up.
    if (model.showLegend !== false) {
      const labels = (model.detailLabels || ["Detail", "Detail"]).slice(0, 3);
      const lh = 0.3 + labels.length * 0.17;
      const leg = [{ text: "Campaign / event name", options: { bold: true, fontSize: 9, color: WHITE, breakLine: true } }];
      labels.forEach((l) => leg.push({ text: l, options: { fontSize: 8.5, color: WHITE, bullet: { code: "2022", indent: 8 }, breakLine: true } }));
      s.addShape("rect", { x: 10.55, y: 0.22, w: 2.45, h: lh, fill: { color: BLACK }, line: { color: WHITE, width: 1 } });
      s.addText(leg, { x: 10.68, y: 0.24, w: 2.28, h: lh - 0.04, fontFace: "Arial", align: "left", valign: "middle", margin: 1 });
    }

    // Month axis
    const axisY = 1.55, tileH = 0.28;
    s.addShape("line", { x: X0 - 0.05, y: axisY + tileH / 2, w: W + 0.1, h: 0, line: { color: WHITE, width: 2 } });
    for (let m = 0; m < 12; m++) {
      const cx = X0 + ((m + 0.5) / 12) * W;
      s.addShape("rect", { x: cx - 0.22, y: axisY, w: 0.44, h: tileH, fill: { color: ORANGE }, line: { color: ORANGE } });
      s.addText(MON[m], { x: cx - 0.35, y: axisY, w: 0.7, h: tileH, fontFace: "Arial", fontSize: 9, bold: true, color: WHITE, align: "center", valign: "middle" });
    }
    if (model.showQuarters !== false) for (let q = 0; q < 4; q++) {
      const cx = X0 + ((q * 3 + 1.5) / 12) * W;
      s.addText("Q" + (q + 1), { x: cx - 0.4, y: axisY - 0.3, w: 0.8, h: 0.26, fontFace: "Arial", fontSize: 12, bold: true, color: WHITE, align: "center" });
    }

    const totalRows = lanes.reduce((n, l) => n + l.rows.length, 0) || 1;
    let boxH = (BOTTOM - LANE_TOP - Math.max(0, lanes.length - 1) * LANE_GAP) / totalRows - BOX_GAP;
    boxH = Math.max(0.42, Math.min(0.9, boxH));

    // Text size: estimate how many text lines each box needs at full size (name wraps by box width,
    // each detail line may wrap too) and shrink all box text evenly so the busiest box still fits.
    const boxW = (it) => Math.max(0.9, (it.b - it.a) * W) - 0.12;
    const wrap = (txt, w, cpi) => Math.max(1, Math.ceil(String(txt || "").length / Math.max(1, w * cpi)));
    let scale = 1;
    lanes.forEach((ln) => ln.rows.forEach((row) => row.forEach((it) => {
      const w = boxW(it);
      const need = 0.05 + wrap(it.name, w, 13) * 0.165 + (it.lines || []).slice(0, 3).reduce((n, l) => n + wrap(l, w - 0.1, 16) * 0.14, 0);
      scale = Math.min(scale, boxH / need);
    })));
    scale = Math.max(0.6, Math.min(1, scale));
    const nameSize = Math.round(10 * scale * 2) / 2, lineSize = Math.round(8.5 * scale * 2) / 2;

    let y = LANE_TOP;
    lanes.forEach((ln, li) => {
      const bandH = ln.rows.length * (boxH + BOX_GAP) - BOX_GAP;
      s.addText(ln.label, { x: LX, y: y, w: LW, h: bandH, fontFace: "Arial", fontSize: 14, bold: true, color: WHITE, align: "left", valign: "middle", fit: "shrink" });
      ln.rows.forEach((row, ri) => {
        const ry = y + ri * (boxH + BOX_GAP);
        row.forEach((it) => {
          const bx = X0 + it.a * W, bw = Math.max(0.9, (it.b - it.a) * W);
          const isC = (it.kind || "Campaign") === "Campaign";
          const fill = isC ? ORANGE : GREY, txt = isC ? BLACK : WHITE;
          s.addShape("roundRect", { x: bx, y: ry, w: bw, h: boxH, rectRadius: 0.05, fill: { color: fill }, line: { color: fill } });
          const body = [{ text: it.name || "(no name)", options: { bold: true, fontSize: nameSize, color: txt, breakLine: true } }];
          (it.lines || []).slice(0, 3).forEach((l) => body.push({ text: String(l), options: { fontSize: lineSize, color: txt, bullet: { code: "2022", indent: 6 }, breakLine: true } }));
          s.addText(body, { x: bx + 0.06, y: ry + 0.02, w: bw - 0.12, h: boxH - 0.04, fontFace: "Arial", align: "left", valign: "middle", margin: 1, fit: "shrink" });
        });
      });
      y += bandH + LANE_GAP;
      if (li < lanes.length - 1) s.addShape("line", { x: LX, y: y - LANE_GAP / 2, w: X1 - LX, h: 0, line: { color: SEP, width: 1, dashType: "dot" } });
    });

    s.addText("Orange Restricted", { x: 0, y: 7.2, w: 13.33, h: 0.25, fontFace: "Arial", fontSize: 8, color: ORANGE, align: "center" });
    if (pageCount > 1) s.addText(pageNo + " / " + pageCount, { x: 11.8, y: 7.2, w: 1.2, h: 0.25, fontFace: "Arial", fontSize: 8, color: WHITE, align: "right" });
    return s;
  }

  function buildRoadmap(pptx, model) {
    pptx.defineLayout({ name: "MBW", width: 13.33, height: 7.5 });
    pptx.layout = "MBW";
    const pages = planPages(model);
    pages.forEach((lanes, i) => drawSlide(pptx, model, lanes, i + 1, pages.length));
    return pages.length;
  }

  function exportRoadmap(model) {
    if (!window.PptxGenJS) { if (window.MB_STATE) window.MB_STATE.toast("PowerPoint library not loaded. Try again in a moment.", "error"); return; }
    if (!model || !model.lanes || !model.lanes.length) { if (window.MB_STATE) window.MB_STATE.toast("Nothing to export in the current view.", "error"); return; }
    const pptx = new PptxGenJS();
    const n = buildRoadmap(pptx, model);
    const name = "campaign-roadmap-" + (model.year || new Date().getFullYear()) + ".pptx";
    pptx.writeFile({ fileName: name });
    if (window.MB_STATE) window.MB_STATE.toast(n > 1 ? `Roadmap downloaded (${n} slides).` : "Roadmap slide downloaded.", "success");
  }

  // slideCount: how many slides a model needs, for the export pop-up.
  window.MB_PPT = { exportRoadmap, slideCount: (model) => planPages(model).length };
})();
