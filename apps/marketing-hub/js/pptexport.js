// Roadmap slide export. Turns a grouped, date-positioned model into an Orange-branded PowerPoint
// swimlane roadmap (one slide). Uses PptxGenJS (loaded from CDN in index.html).
(function () {
  const ORANGE = "FF7900", GREY = "3A3A3A", WHITE = "FFFFFF", BLACK = "000000", SEP = "666666";
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function buildRoadmap(pptx, model) {
    pptx.defineLayout({ name: "MBW", width: 13.33, height: 7.5 });
    pptx.layout = "MBW";
    const s = pptx.addSlide();
    s.background = { color: BLACK };

    const LX = 0.3, LW = 1.65;
    const X0 = 2.05, X1 = 13.0, W = X1 - X0;
    const year = model.year;

    // Title bar
    s.addShape("roundRect", { x: 0.3, y: 0.22, w: 9.4, h: 0.72, rectRadius: 0.04, fill: { color: WHITE }, line: { color: WHITE } });
    s.addText(model.title || "Campaign roadmap", { x: 0.45, y: 0.22, w: 9.1, h: 0.72, fontFace: "Arial", fontSize: 26, bold: true, color: BLACK, align: "left", valign: "middle" });

    // Legend
    s.addShape("rect", { x: 10.55, y: 0.22, w: 2.45, h: 0.7, fill: { color: BLACK }, line: { color: WHITE, width: 1 } });
    s.addText([
      { text: "Campaign / event name", options: { bold: true, fontSize: 9, color: WHITE, breakLine: true } },
      { text: "Detail", options: { fontSize: 8.5, color: WHITE, bullet: { code: "2022", indent: 8 }, breakLine: true } },
      { text: "Detail", options: { fontSize: 8.5, color: WHITE, bullet: { code: "2022", indent: 8 }, breakLine: true } },
    ], { x: 10.68, y: 0.24, w: 2.28, h: 0.66, fontFace: "Arial", align: "left", valign: "middle", margin: 1 });

    // Month axis
    const axisY = 1.55, tileH = 0.28;
    s.addShape("line", { x: X0 - 0.05, y: axisY + tileH / 2, w: W + 0.1, h: 0, line: { color: WHITE, width: 2 } });
    for (let m = 0; m < 12; m++) {
      const cx = X0 + ((m + 0.5) / 12) * W;
      s.addShape("rect", { x: cx - 0.22, y: axisY, w: 0.44, h: tileH, fill: { color: ORANGE }, line: { color: ORANGE } });
      s.addText(MON[m], { x: cx - 0.35, y: axisY, w: 0.7, h: tileH, fontFace: "Arial", fontSize: 9, bold: true, color: WHITE, align: "center", valign: "middle" });
    }
    for (let q = 0; q < 4; q++) {
      const cx = X0 + ((q * 3 + 1.5) / 12) * W;
      s.addText("Q" + (q + 1), { x: cx - 0.4, y: axisY - 0.3, w: 0.8, h: 0.26, fontFace: "Arial", fontSize: 12, bold: true, color: WHITE, align: "center" });
    }

    const frac = (d) => {
      const dt = new Date(d); if (isNaN(dt)) return 0;
      if (dt.getFullYear() < year) return 0;
      if (dt.getFullYear() > year) return 1;
      const dim = new Date(year, dt.getMonth() + 1, 0).getDate();
      return Math.max(0, Math.min(1, (dt.getMonth() + (dt.getDate() - 1) / dim) / 12));
    };

    const lanes = model.lanes.map((ln) => {
      const items = ln.items.map((it) => {
        let a = frac(it.start), b = frac(it.end || it.start);
        if (b - a < 0.055) b = Math.min(1, a + 0.11);
        return { name: it.name, lines: it.lines || [], kind: it.kind, a, b };
      }).sort((p, q) => p.a - q.a);
      const rows = [];
      items.forEach((it) => {
        let r = rows.find((row) => row[row.length - 1].b + 0.008 <= it.a);
        if (!r) { r = []; rows.push(r); }
        r.push(it);
      });
      return { label: ln.label, rows };
    });

    const laneTop = 2.05, bottom = 7.15, laneGap = 0.14, boxGap = 0.09;
    const totalRows = lanes.reduce((n, l) => n + l.rows.length, 0) || 1;
    let boxH = (bottom - laneTop - (lanes.length - 1) * laneGap) / totalRows - boxGap;
    boxH = Math.max(0.42, Math.min(0.9, boxH));

    let y = laneTop;
    lanes.forEach((ln, li) => {
      const bandH = ln.rows.length * (boxH + boxGap) - boxGap;
      s.addText(ln.label, { x: LX, y: y, w: LW, h: bandH, fontFace: "Arial", fontSize: 14, bold: true, color: WHITE, align: "left", valign: "middle" });
      ln.rows.forEach((row, ri) => {
        const ry = y + ri * (boxH + boxGap);
        row.forEach((it) => {
          const bx = X0 + it.a * W, bw = Math.max(0.9, (it.b - it.a) * W);
          const isC = (it.kind || "Campaign") === "Campaign";
          const fill = isC ? ORANGE : GREY, txt = isC ? BLACK : WHITE;
          s.addShape("roundRect", { x: bx, y: ry, w: bw, h: boxH, rectRadius: 0.05, fill: { color: fill }, line: { color: fill } });
          const body = [{ text: it.name || "(no name)", options: { bold: true, fontSize: 10, color: txt, breakLine: true } }];
          (it.lines || []).slice(0, 3).forEach((l) => body.push({ text: String(l), options: { fontSize: 8.5, color: txt, bullet: { code: "2022", indent: 8 }, breakLine: true } }));
          s.addText(body, { x: bx + 0.06, y: ry + 0.02, w: bw - 0.12, h: boxH - 0.04, fontFace: "Arial", align: "left", valign: "middle", margin: 1 });
        });
      });
      y += bandH + laneGap;
      if (li < lanes.length - 1) s.addShape("line", { x: LX, y: y - laneGap / 2, w: X1 - LX, h: 0, line: { color: SEP, width: 1, dashType: "dot" } });
    });

    s.addText("Orange Restricted", { x: 0, y: 7.2, w: 13.33, h: 0.25, fontFace: "Arial", fontSize: 8, color: ORANGE, align: "center" });
    return s;
  }

  function exportRoadmap(model) {
    if (!window.PptxGenJS) { if (window.MB_STATE) window.MB_STATE.toast("PowerPoint library not loaded. Try again in a moment.", "error"); return; }
    if (!model || !model.lanes || !model.lanes.length) { if (window.MB_STATE) window.MB_STATE.toast("Nothing to export in the current view.", "error"); return; }
    const pptx = new PptxGenJS();
    buildRoadmap(pptx, model);
    const name = "campaign-roadmap-" + (model.year || new Date().getFullYear()) + ".pptx";
    pptx.writeFile({ fileName: name });
    if (window.MB_STATE) window.MB_STATE.toast("Roadmap slide downloaded.", "success");
  }

  window.MB_PPT = { exportRoadmap };
})();
