// Roadmap slide export. Turns a grouped, date-positioned model into an Orange-branded PowerPoint
// swimlane roadmap (one slide). Uses PptxGenJS (loaded from CDN in index.html).
(function () {
  const ORANGE = "FF7900", GREY = "3A3A3A", WHITE = "FFFFFF", BLACK = "000000", SEP = "666666";
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Layout constants shared by the page planner and the slide drawer (inches, 13.33 x 7.5 slide).
  const LANE_TOP = 2.05, BOTTOM = 7.1, LANE_GAP = 0.14, BOX_GAP = 0.06;
  const X0 = 2.05, X1 = 13.0, W = X1 - X0;
  // Compact boxes (since 5.3.8): the name in bold on one or two lines, the details after it
  // joined with " · ", three lines at most in total. Text that does not fit is cut with
  // "…". A box is at least MIN_W wide (about 1.5 months) so short events still have room.
  const MIN_W = 1.45, NAME_PT = 8, LINE_PT = 7, PAD = 0.05, INSET = 0.05;
  const NAME_LH = NAME_PT * 1.2 / 72, LINE_LH = LINE_PT * 1.2 / 72;
  // Characters per line for Arial at a size, a little on the safe side so PowerPoint never wraps more.
  const cpl = (w, pt, bold) => Math.max(4, Math.floor((w - 2 * INSET) / (pt / 72 * (bold ? 0.6 : 0.53))));
  // Greedy word wrap into at most maxLines lines; the last line gets "…" when text is left over.
  function fitLines(text, perLine, maxLines) {
    const words = String(text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
    const lines = []; let cur = "";
    const push = () => { lines.push(cur); cur = ""; };
    for (let k = 0; k < words.length; k++) {
      let w = words[k];
      while (w.length > perLine) { // a single word longer than a line: hard break
        if (cur) push();
        if (lines.length === maxLines) break;
        lines.push(w.slice(0, perLine)); w = w.slice(perLine);
      }
      if (lines.length >= maxLines) { return cut(lines, maxLines, perLine); }
      const next = cur ? cur + " " + w : w;
      if (next.length <= perLine) { cur = next; continue; }
      push();
      if (lines.length >= maxLines) { lines[maxLines - 1] += " " + w; return cut(lines, maxLines, perLine); }
      cur = w;
    }
    if (cur) push();
    if (lines.length > maxLines) return cut(lines, maxLines, perLine);
    return lines.length ? lines : [""];
  }
  function cut(lines, maxLines, perLine) {
    const out = lines.slice(0, maxLines);
    let last = out[maxLines - 1];
    if (last.length > perLine - 1) last = last.slice(0, perLine - 1);
    out[maxLines - 1] = last.replace(/[\s,·\-]+$/, "") + "…";
    return out;
  }
  // The text of one box: name lines + one detail line, and the box height that fits them.
  function boxText(it) {
    const w = Math.max(MIN_W, (it.b - it.a) * W);
    const details = (it.lines || []).slice(0, 3).map((l) => String(l)).filter((l) => l.trim()).join(" · ");
    const name = fitLines(it.name || "(no name)", cpl(w, NAME_PT, true), details ? 2 : 3);
    // Details get the lines the name leaves free, so the box never goes over three lines.
    const det = details ? fitLines(details, cpl(w, LINE_PT, false), 3 - name.length) : [];
    return { name, det, h: 2 * PAD + name.length * NAME_LH + det.length * LINE_LH };
  }

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
    const minF = MIN_W / W;
    return model.lanes.map((ln) => {
      const items = ln.items.map((it) => {
        let a = frac(it.start), b = frac(it.end || it.start);
        if (b - a < minF) { b = a + minF; if (b > 1) { a = Math.max(0, 1 - minF); b = 1; } }
        return { name: it.name, lines: it.lines || [], kind: it.kind, a, b };
      });
      // Items arrive in the order chosen in the export pop-up (keepOrder); otherwise by start.
      if (!model.keepOrder) items.sort((p, q) => p.a - q.a);
      // Each item goes in the first row where it does not overlap anything already there.
      const rows = [];
      items.forEach((it) => {
        let r = rows.find((row) => row.every((o) => o.b + 0.004 <= it.a || it.b + 0.004 <= o.a));
        if (!r) { r = []; rows.push(r); }
        it.t = boxText(it);
        r.push(it);
      });
      // A row is as high as its tallest box, so there is no empty space under short boxes.
      return { label: ln.label, rows: rows.map((r) => ({ items: r, h: Math.max(...r.map((x) => x.t.h)) })) };
    });
  }

  // Split the lanes over as many slides as needed. Whole lanes stay together on one slide; a lane
  // that is too tall for a slide on its own is cut into parts, marked "(cont.)" after the first.
  function planPages(model) {
    const lanes = packLanes(model);
    const avail = BOTTOM - LANE_TOP;
    const laneH = (l) => l.rows.reduce((h, r) => h + r.h + BOX_GAP, 0) - BOX_GAP;
    const height = (list) => list.reduce((h, l) => h + laneH(l), 0) + Math.max(0, list.length - 1) * LANE_GAP;
    const pages = [];
    let cur = [];
    const flush = () => { if (cur.length) { pages.push(cur); cur = []; } };
    lanes.forEach((ln) => {
      if (laneH(ln) > avail) {
        // Too tall for one slide: cut it into parts that each fill a slide. The last part stays
        // open, so the next lane can join it when there is room.
        flush();
        let part = [], h = 0, first = true;
        ln.rows.forEach((r) => {
          if (part.length && h + r.h > avail) {
            pages.push([{ label: ln.label ? ln.label + (first ? "" : " (cont.)") : "", rows: part }]);
            first = false; part = []; h = 0;
          }
          part.push(r); h += r.h + BOX_GAP;
        });
        cur = [{ label: ln.label ? ln.label + (first ? "" : " (cont.)") : "", rows: part }];
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

    // Title bar
    s.addShape("roundRect", { x: 0.3, y: 0.22, w: 9.4, h: 0.72, rectRadius: 0.04, fill: { color: WHITE }, line: { color: WHITE } });
    s.addText(model.title || "Campaign roadmap", { x: 0.45, y: 0.22, w: 9.1, h: 0.72, fontFace: "Arial", fontSize: 26, bold: true, color: BLACK, align: "left", valign: "middle", fit: "shrink" });

    // Legend: the box name plus the detail fields chosen in the export pop-up.
    if (model.showLegend !== false) {
      const labels = (model.detailLabels || ["Detail", "Detail"]).slice(0, 3);
      const lh = 0.5;
      const leg = [{ text: "Campaign / event name", options: { bold: true, fontSize: 9, color: WHITE, breakLine: true } },
        { text: labels.join(" · "), options: { fontSize: 8.5, color: WHITE, breakLine: true } }];
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

    let y = LANE_TOP;
    lanes.forEach((ln, li) => {
      const bandH = ln.rows.reduce((h, r) => h + r.h + BOX_GAP, 0) - BOX_GAP;
      s.addText(ln.label, { x: LX, y: y, w: LW, h: Math.max(0.3, bandH), fontFace: "Arial", fontSize: 14, bold: true, color: WHITE, align: "left", valign: "middle", fit: "shrink" });
      let ry = y;
      ln.rows.forEach((row) => {
        row.items.forEach((it) => {
          const bx = X0 + it.a * W, bw = Math.max(MIN_W, (it.b - it.a) * W);
          const isC = (it.kind || "Campaign") === "Campaign";
          const fill = isC ? ORANGE : GREY, txt = isC ? BLACK : WHITE;
          s.addShape("roundRect", { x: bx, y: ry, w: bw, h: row.h, rectRadius: 0.04, fill: { color: fill }, line: { color: fill } });
          const body = it.t.name.map((l) => ({ text: l, options: { bold: true, fontSize: NAME_PT, color: txt, breakLine: true } }))
            .concat(it.t.det.map((l) => ({ text: l, options: { fontSize: LINE_PT, color: txt, breakLine: true } })));
          s.addText(body, { x: bx, y: ry, w: bw, h: row.h, fontFace: "Arial", align: "left", valign: "top",
            margin: [Math.round(INSET * 72), Math.round(INSET * 72), Math.round(PAD * 72) - 1, Math.round(PAD * 72) - 1], lineSpacingMultiple: 1.0, paraSpaceBefore: 0, paraSpaceAfter: 0 });
        });
        ry += row.h + BOX_GAP;
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
