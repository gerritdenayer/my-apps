/* Org Chart app. Plain JavaScript, no build step.
   Data model: { title, updated, root } where every node is
   { id, name, role, note, line, highlight, collapsed, children: [] }
   Data lives in this browser (localStorage) and in an org.json file you save yourself.
   Nothing is sent to a server. */
(function () {
  "use strict";
  const CFG = Object.assign({ appVersion: "", storageKey: "ob_orgchart_v1", openLevels: 1 }, window.APP_CONFIG || {});
  const NW = 200, NH = 68, HG = 22, VG = 60, SIND = 26, SG = 14;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  let doc = null;            // current chart
  let index = new Map();     // id -> { node, parent, depth }
  let selectedId = null;
  let undoStack = [], redoStack = [];
  let dirtySinceFile = false;
  let view = { tx: 40, ty: 30, s: 1 };
  let matches = [], matchPos = -1;
  // Branch filter: ids of the teams the user ticked. Kept in this browser, not in org.json.
  let branches = new Set();
  let inBranch = new Set(), onPath = new Set(), rendered = new Set();
  let viewTop = null;        // top box of what is drawn now
  let layout = null;         // last drawn boxes and lines, used by the PDF and PowerPoint export
  const BKEY = () => CFG.storageKey + "_branches";

  // ---------- storage ----------
  function store() {
    try { localStorage.setItem(CFG.storageKey, JSON.stringify({ doc, dirtySinceFile })); } catch (e) { /* storage blocked: keep working in memory */ }
    status();
  }
  function restore() {
    try { const raw = localStorage.getItem(CFG.storageKey); if (!raw) return null; const o = JSON.parse(raw); dirtySinceFile = !!o.dirtySinceFile; return o.doc; } catch (e) { return null; }
  }
  function status() {
    const el = $("status");
    if (!doc) { el.textContent = ""; return; }
    el.innerHTML = dirtySinceFile ? '<span style="color:#FF7900">Changes not saved to file yet</span> · kept in this browser' : "Saved in this browser · file up to date";
  }

  // ---------- model helpers ----------
  let idSeq = 0;
  const newId = () => "n" + Date.now().toString(36) + (idSeq++).toString(36);
  function ensure(n) {
    if (!n.id) n.id = newId();
    if (!Array.isArray(n.children)) n.children = [];
    n.children.forEach(ensure);
  }
  function reindex() {
    index = new Map();
    const walk = (n, parent, depth) => { index.set(n.id, { node: n, parent, depth }); n.children.forEach((c) => walk(c, n, depth + 1)); };
    walk(doc.root, null, 0);
  }
  const get = (id) => (index.get(id) || {}).node;
  const parentOf = (id) => (index.get(id) || {}).parent;
  function inSubtree(rootNode, id) { if (rootNode.id === id) return true; return rootNode.children.some((c) => inSubtree(c, id)); }
  function countBelow(n) { return n.children.reduce((a, c) => a + 1 + countBelow(c), 0); }
  function applyDefaultOpen(n, depth) {
    if (n.collapsed === undefined) n.collapsed = n.children.length > 0 && depth >= CFG.openLevels && !n.line;
    n.children.forEach((c) => applyDefaultOpen(c, depth + 1));
  }
  function initials(n) {
    const src = (n.name || n.role || "?").trim();
    const p = src.split(/\s+/).filter(Boolean);
    return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0]).toUpperCase();
  }

  // ---------- undo ----------
  const snap = () => JSON.stringify(doc);
  function pushUndo(s) { undoStack.push(s || snap()); if (undoStack.length > 80) undoStack.shift(); redoStack = []; }
  function commit(fn) { pushUndo(); fn(); afterChange(); }
  function afterChange() { dirtySinceFile = true; reindex(); render(); store(); syncPanel(); updateButtons(); if (!$("branchPanel").hidden) buildBranchList(); }
  function undo() { if (!undoStack.length) return; redoStack.push(snap()); doc = JSON.parse(undoStack.pop()); afterChange(); toast("Undone"); }
  function redo() { if (!redoStack.length) return; undoStack.push(snap()); doc = JSON.parse(redoStack.pop()); afterChange(); toast("Redone"); }
  function updateButtons() {
    $("btnUndo").disabled = !undoStack.length; $("btnRedo").disabled = !redoStack.length;
    ["btnExpand", "btnCollapse", "btnFit", "btnZoomIn", "btnZoomOut", "btnExport", "btnBranches", "btnOut"].forEach((b) => ($(b).disabled = !doc));
  }

  // ---------- branch filter ----------
  // A ticked team is shown with everyone below it. The managers between the teams
  // and their closest shared manager are shown too (dimmed), so the lines still make sense.
  const shown = (n) => !branches.size || inBranch.has(n.id) || onPath.has(n.id);
  function computeFilter() {
    inBranch = new Set(); onPath = new Set();
    branches.forEach((id) => { if (!index.has(id)) branches.delete(id); });
    if (!branches.size) { viewTop = doc.root; return; }
    const mark = (n) => { inBranch.add(n.id); n.children.forEach(mark); };
    branches.forEach((id) => mark(get(id)));
    branches.forEach((id) => { let p = parentOf(id); while (p && !inBranch.has(p.id)) { onPath.add(p.id); p = parentOf(p.id); } });
    let top = doc.root;
    while (!inBranch.has(top.id)) { const k = top.children.filter(shown); if (k.length !== 1) break; top = k[0]; }
    viewTop = top;
  }
  function storeBranches() { try { localStorage.setItem(BKEY(), JSON.stringify([...branches])); } catch (e) { /* ignore */ } }
  function restoreBranches() { try { branches = new Set(JSON.parse(localStorage.getItem(BKEY()) || "[]")); } catch (e) { branches = new Set(); } }

  // ---------- layout ----------
  const visibleKids = (n) => (onPath.has(n.id) ? n.children.filter(shown) : n.collapsed ? [] : n.children);
  const isLeafVisible = (n) => visibleKids(n).length === 0;
  function measure(n) {
    const kids = visibleKids(n);
    n._stack = false;
    if (!kids.length) { n._w = NW; n._h = NH; return; }
    kids.forEach(measure);
    if (kids.length >= 3 && kids.every(isLeafVisible)) {
      n._stack = true; n._w = SIND + NW; n._h = NH + VG / 2 + kids.length * (NH + SG);
      return;
    }
    const total = kids.reduce((a, k) => a + k._w, 0) + HG * (kids.length - 1);
    n._w = Math.max(NW, total); n._h = NH + VG + Math.max(...kids.map((k) => k._h));
  }
  function position(n, x, y) {
    const kids = visibleKids(n);
    if (n._stack) {
      n._x = x; n._y = y;
      kids.forEach((k, i) => position(k, x + SIND, y + NH + VG / 2 + i * (NH + SG)));
      return;
    }
    n._x = x + (n._w - NW) / 2; n._y = y;
    if (!kids.length) return;
    const total = kids.reduce((a, k) => a + k._w, 0) + HG * (kids.length - 1);
    let cx = x + (n._w - total) / 2;
    kids.forEach((k) => { position(k, cx, y + NH + VG); cx += k._w + HG; });
  }

  // ---------- render ----------
  function render() {
    const nodesEl = $("nodes"), svg = $("links");
    if (!doc) { nodesEl.innerHTML = ""; svg.innerHTML = ""; $("empty").hidden = false; $("chartTitle").textContent = "Org chart"; return; }
    $("empty").hidden = true;
    $("chartTitle").textContent = doc.title || "Org chart";
    computeFilter();
    const top = viewTop;
    measure(top); position(top, 0, 0);
    const html = [], segs = [], boxes = [];
    rendered = new Set();
    const L = (x1, y1, x2, y2, o) => segs.push([x1, y1, x2, y2, o ? 1 : 0]);
    const matchSet = new Set(matches);
    const walk = (n, stackedChild) => {
      const kids = visibleKids(n);
      rendered.add(n.id); boxes.push(n);
      const isPath = onPath.has(n.id);
      const cls = ["node"];
      if (n.line) cls.push("line");
      if (n.highlight) cls.push("highlight");
      if (!n.name) cls.push("team");
      if (isPath) cls.push("path");
      if (n.id === selectedId) cls.push("selected");
      if (matchSet.has(n.id)) cls.push("match");
      if (matches[matchPos] === n.id) cls.push("current");
      if (stackedChild) cls.push("stacked-child");
      const title = n.name || n.role || "(empty)";
      const sub = n.name ? n.role : "";
      const tog = n.children.length && !isPath ? `<button class="tog" data-tog="${n.id}" title="${n.collapsed ? "Open team" : "Close team"}">${n.collapsed ? "+" + n.children.length : "−"}</button>` : "";
      html.push(`<div class="${cls.join(" ")}" data-id="${n.id}" draggable="true" style="left:${n._x}px;top:${n._y}px" title="${esc(title + (sub ? " · " + sub : "") + (n.note ? "\n" + n.note : ""))}">
        <div class="av">${esc(initials(n))}</div>
        <div class="tx"><div class="nm">${esc(title)}</div>${sub ? `<div class="rl">${esc(sub)}</div>` : ""}</div>
        ${n.note ? '<span class="note-dot"></span>' : ""}${tog}</div>`);
      if (!kids.length) return;
      if (n._stack) {
        const lx = n._x + 14, ty = n._y + NH;
        const last = kids[kids.length - 1];
        L(lx, ty, lx, last._y + NH / 2, 0);
        kids.forEach((k) => {
          const my = k._y + NH / 2;
          L(lx, my, k._x, my, k.line);
          if (k.line) L(lx, ty, lx, my, 1);
        });
      } else {
        const px = n._x + NW / 2, py = n._y + NH, mid = py + VG / 2;
        const xs = kids.map((k) => k._x + NW / 2);
        L(px, py, px, mid, 0);
        L(Math.min(px, ...xs), mid, Math.max(px, ...xs), mid, 0);
        kids.forEach((k, i) => {
          if (k.line) { L(px, py, px, mid, 1); L(px, mid, xs[i], mid, 1); }
          L(xs[i], mid, xs[i], k._y, k.line);
        });
      }
      kids.forEach((k) => walk(k, n._stack));
    };
    walk(top, false);
    nodesEl.innerHTML = html.join("");
    const W = top._w + 40, H = top._h + 40;
    svg.setAttribute("width", W); svg.setAttribute("height", H);
    const d = (o) => segs.filter((s) => s[4] === o).map((s) => `M${s[0]} ${s[1]}L${s[2]} ${s[3]}`).join("");
    svg.innerHTML = `<path d="${d(0)}" stroke="#4D4D4D" stroke-width="1.5" fill="none"/><path d="${d(1)}" stroke="#FF7900" stroke-width="2.5" fill="none"/>`;
    layout = { top, boxes, segs };
    renderFilterInfo();
    applyView();
  }

  // ---------- view: pan and zoom ----------
  function applyView() { $("stage").style.transform = `translate(${view.tx}px,${view.ty}px) scale(${view.s})`; }
  function zoomAt(f, cx, cy) {
    const s2 = Math.min(2.5, Math.max(0.15, view.s * f));
    view.tx = cx - (cx - view.tx) * (s2 / view.s); view.ty = cy - (cy - view.ty) * (s2 / view.s); view.s = s2; applyView();
  }
  function fit(minScale) {
    minScale = typeof minScale === "number" ? minScale : 0.15;
    if (!doc || !viewTop) return;
    const vp = $("viewport").getBoundingClientRect();
    const w = viewTop._w, h = viewTop._h;
    const top = branches.size ? 64 : 24;   // leave room for the "showing branches" bar
    view.s = Math.min(1.1, (vp.width - 60) / w, (vp.height - 66 - top) / h);
    view.s = Math.max(view.s, minScale);
    // keep the top box in the middle when the chart is wider than the screen
    view.tx = w * view.s <= vp.width ? (vp.width - w * view.s) / 2 : vp.width / 2 - (viewTop._x + NW / 2) * view.s;
    view.ty = top; applyView();
  }
  function centerOn(id) {
    const n = get(id); if (!n || !rendered.has(id)) return;
    const vp = $("viewport").getBoundingClientRect();
    if (view.s < 0.6) view.s = 0.8;
    view.tx = vp.width / 2 - (n._x + NW / 2) * view.s; view.ty = vp.height / 3 - (n._y + NH / 2) * view.s; applyView();
  }
  (function setupPan() {
    const vp = $("viewport");
    let pan = null;
    vp.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".node") || e.target.closest(".empty") || e.target.closest(".filter-info") || e.button !== 0) return;
      pan = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty, moved: false };
      vp.classList.add("panning"); vp.setPointerCapture(e.pointerId);
    });
    vp.addEventListener("pointermove", (e) => {
      if (!pan) return;
      const dx = e.clientX - pan.x, dy = e.clientY - pan.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) pan.moved = true;
      view.tx = pan.tx + dx; view.ty = pan.ty + dy; applyView();
    });
    const end = () => { if (pan && !pan.moved) select(null); pan = null; vp.classList.remove("panning"); };
    vp.addEventListener("pointerup", end); vp.addEventListener("pointercancel", end);
    vp.addEventListener("wheel", (e) => {
      e.preventDefault();
      const r = vp.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) zoomAt(Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top);
      else { view.tx -= e.deltaX; view.ty -= e.deltaY; applyView(); }
    }, { passive: false });
  })();

  // ---------- node interactions ----------
  $("nodes").addEventListener("click", (e) => {
    const t = e.target.closest("[data-tog]");
    if (t) { e.stopPropagation(); toggle(t.dataset.tog); return; }
    const n = e.target.closest(".node"); if (n) select(n.dataset.id);
  });
  $("nodes").addEventListener("dblclick", (e) => { const n = e.target.closest(".node"); if (n && !e.target.closest("[data-tog]")) toggle(n.dataset.id); });
  function toggle(id) {
    const n = get(id); if (!n || !n.children.length) return;
    n.collapsed = !n.collapsed; render(); store();
  }
  // drag and drop to change who someone reports to
  let dragId = null;
  $("nodes").addEventListener("dragstart", (e) => {
    const n = e.target.closest(".node"); if (!n) return;
    dragId = n.dataset.id; n.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", dragId);
  });
  $("nodes").addEventListener("dragend", () => { dragId = null; document.querySelectorAll(".dragging,.drop-ok").forEach((el) => el.classList.remove("dragging", "drop-ok")); });
  $("nodes").addEventListener("dragover", (e) => {
    const n = e.target.closest(".node"); if (!n || !dragId) return;
    const src = get(dragId);
    if (src && !inSubtree(src, n.dataset.id) && parentOf(dragId) !== get(n.dataset.id)) { e.preventDefault(); n.classList.add("drop-ok"); }
  });
  $("nodes").addEventListener("dragleave", (e) => { const n = e.target.closest(".node"); if (n) n.classList.remove("drop-ok"); });
  $("nodes").addEventListener("drop", (e) => {
    const n = e.target.closest(".node"); if (!n || !dragId) return;
    e.preventDefault(); moveUnder(dragId, n.dataset.id);
  });
  function moveUnder(id, newParentId) {
    const node = get(id), np = get(newParentId), op = parentOf(id);
    if (!node || !np || !op || inSubtree(node, newParentId) || op === np) return;
    commit(() => { op.children.splice(op.children.indexOf(node), 1); np.children.push(node); np.collapsed = false; });
    toast(`${label(node)} now reports to ${label(np)}`);
  }
  const label = (n) => n.name || n.role || "this box";

  // ---------- side panel ----------
  function select(id) {
    selectedId = id;
    document.querySelectorAll(".node.selected").forEach((el) => el.classList.remove("selected"));
    if (id) { const el = document.querySelector(`.node[data-id="${id}"]`); if (el) el.classList.add("selected"); }
    $("panel").hidden = !id; $("delConfirm").hidden = true;
    syncPanel();
  }
  function syncPanel() {
    const n = selectedId && get(selectedId);
    if (!n) { if (selectedId) { selectedId = null; $("panel").hidden = true; } return; }
    const p = parentOf(n.id);
    if (document.activeElement !== $("fName")) $("fName").value = n.name || "";
    if (document.activeElement !== $("fRole")) $("fRole").value = n.role || "";
    if (document.activeElement !== $("fNote")) $("fNote").value = n.note || "";
    $("fLine").checked = !!n.line; $("fHighlight").checked = !!n.highlight;
    $("addSibling").disabled = !p;
    const sibs = p ? p.children : [];
    $("moveLeft").disabled = !p || sibs.indexOf(n) === 0;
    $("moveRight").disabled = !p || sibs.indexOf(n) === sibs.length - 1;
    $("delKeep").disabled = !p; $("delAll").disabled = !p;
    const below = countBelow(n);
    $("delInfo").textContent = !p ? "The top box cannot be removed." : below ? `${below} ${below === 1 ? "box sits" : "boxes sit"} below this one.` : "No one reports to this box.";
    $("delKeep").hidden = !below;
    // "Report to" list: everyone outside this person's own team
    const sel = $("fParent"); sel.innerHTML = ""; sel.disabled = !p;
    if (!p) { sel.innerHTML = "<option>Top of the chart</option>"; return; }
    const walk = (k, depth) => {
      if (k.id === n.id) return;
      const o = document.createElement("option");
      o.value = k.id; o.textContent = "  ".repeat(depth) + label(k) + (k.name && k.role ? " · " + k.role : "");
      if (k === p) o.selected = true;
      sel.appendChild(o); k.children.forEach((c) => walk(c, depth + 1));
    };
    walk(doc.root, 0);
  }
  // live text editing, one undo step per field visit
  let pending = null;
  ["fName", "fRole", "fNote"].forEach((f) => {
    $(f).addEventListener("focus", () => { pending = snap(); });
    $(f).addEventListener("input", () => {
      const n = get(selectedId); if (!n) return;
      if (pending) { pushUndo(pending); pending = null; }
      const key = { fName: "name", fRole: "role", fNote: "note" }[f];
      n[key] = $(f).value;
      dirtySinceFile = true; render(); store(); updateButtons();
      const el = document.querySelector(`.node[data-id="${n.id}"]`); if (el) el.classList.add("selected");
    });
  });
  $("fLine").addEventListener("change", () => { const n = get(selectedId); if (n) commit(() => (n.line = $("fLine").checked)); });
  $("fHighlight").addEventListener("change", () => { const n = get(selectedId); if (n) commit(() => (n.highlight = $("fHighlight").checked)); });
  $("fParent").addEventListener("change", () => moveUnder(selectedId, $("fParent").value));
  $("addChild").addEventListener("click", () => {
    const n = get(selectedId); if (!n) return;
    const c = { id: newId(), name: "New person", role: "", children: [], collapsed: false };
    commit(() => { n.children.push(c); n.collapsed = false; });
    selectAndEdit(c.id);
  });
  $("addSibling").addEventListener("click", () => {
    const n = get(selectedId), p = n && parentOf(n.id); if (!p) return;
    const c = { id: newId(), name: "New person", role: "", children: [], collapsed: false };
    commit(() => p.children.splice(p.children.indexOf(n) + 1, 0, c));
    selectAndEdit(c.id);
  });
  function selectAndEdit(id) { select(id); centerOn(id); setTimeout(() => { $("fName").focus(); $("fName").select(); }, 30); }
  function shift(d) {
    const n = get(selectedId), p = n && parentOf(n.id); if (!p) return;
    const i = p.children.indexOf(n), j = i + d; if (j < 0 || j >= p.children.length) return;
    commit(() => { p.children.splice(i, 1); p.children.splice(j, 0, n); });
  }
  $("moveLeft").addEventListener("click", () => shift(-1));
  $("moveRight").addEventListener("click", () => shift(1));
  let delMode = null;
  function askDelete(mode) {
    const n = get(selectedId); if (!n) return;
    const below = countBelow(n);
    delMode = mode;
    $("delConfirmText").textContent = mode === "all" && below
      ? `Remove ${label(n)} and the ${below} ${below === 1 ? "box" : "boxes"} below? You can undo this.`
      : mode === "keep" ? `Remove ${label(n)}? The team moves up to ${label(parentOf(n.id))}.` : `Remove ${label(n)}? You can undo this.`;
    $("delConfirm").hidden = false;
  }
  $("delKeep").addEventListener("click", () => askDelete("keep"));
  $("delAll").addEventListener("click", () => askDelete("all"));
  $("delNo").addEventListener("click", () => ($("delConfirm").hidden = true));
  $("delYes").addEventListener("click", () => {
    const n = get(selectedId), p = n && parentOf(n.id); if (!p) return;
    const name = label(n);
    commit(() => {
      const i = p.children.indexOf(n);
      p.children.splice(i, 1, ...(delMode === "keep" ? n.children : []));
    });
    select(null); toast(`${name} removed`);
  });
  $("panelClose").addEventListener("click", () => select(null));

  // ---------- search ----------
  $("search").addEventListener("input", () => {
    const q = norm($("search").value.trim());
    matches = []; matchPos = -1;
    if (q && doc) {
      index.forEach(({ node }) => {
        if (branches.size && (!shown(node) || onPath.has(node.id) && !inSubtree(viewTop, node.id))) return; // outside the picked branches
        if (norm(node.name + " " + node.role + " " + (node.note || "")).includes(q)) matches.push(node.id);
      });
      // open the teams that hold a match
      matches.forEach((id) => { let p = parentOf(id); while (p) { p.collapsed = false; p = parentOf(p.id); } });
      if (matches.length) matchPos = 0;
    }
    $("searchInfo").textContent = q ? (matches.length ? `${matches.length} found${matches.length > 1 ? " · Enter for next" : ""}` : branches.size ? "No match in these branches" : "No match") : "";
    render(); if (matchPos >= 0) centerOn(matches[0]);
  });
  $("search").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && matches.length) { matchPos = (matchPos + 1) % matches.length; render(); centerOn(matches[matchPos]); select(matches[matchPos]); }
    if (e.key === "Escape") { $("search").value = ""; $("search").dispatchEvent(new Event("input")); }
  });

  // ---------- toolbar ----------
  function setAll(collapsed) {
    const walk = (n, d) => { if (n.children.length) n.collapsed = collapsed ? d >= CFG.openLevels && !n.line : false; n.children.forEach((c) => walk(c, d + 1)); };
    walk(doc.root, 0); render(); store(); fit(collapsed ? 0.55 : 0.15);
  }
  $("btnExpand").addEventListener("click", () => setAll(false));
  $("btnCollapse").addEventListener("click", () => setAll(true));
  $("btnFit").addEventListener("click", () => fit());
  $("btnZoomIn").addEventListener("click", () => { const r = $("viewport").getBoundingClientRect(); zoomAt(1.2, r.width / 2, r.height / 2); });
  $("btnZoomOut").addEventListener("click", () => { const r = $("viewport").getBoundingClientRect(); zoomAt(1 / 1.2, r.width / 2, r.height / 2); });
  $("btnUndo").addEventListener("click", undo);
  $("btnRedo").addEventListener("click", redo);
  $("btnImport").addEventListener("click", () => $("fileInput").click());
  $("emptyImport").addEventListener("click", () => $("fileInput").click());
  $("emptyNew").addEventListener("click", () => {
    doc = { title: "Org chart", root: { id: newId(), name: "New person", role: "Role", children: [] } };
    branches.clear(); storeBranches(); undoStack = []; redoStack = []; afterChange(); fit(); selectAndEdit(doc.root.id);
  });
  $("fileInput").addEventListener("change", (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const o = JSON.parse(r.result);
        const root = o.root || o;
        if (!root || typeof root !== "object" || !("name" in root || "role" in root)) throw new Error("no root");
        if (doc) pushUndo();
        branches.clear(); storeBranches(); openBranches(false);
        doc = { title: o.title || "Org chart", updated: o.updated, root };
        ensure(doc.root); applyDefaultOpen(doc.root, 0);
        dirtySinceFile = false; reindex(); render(); store(); updateButtons(); select(null); fit();
        toast(`Opened ${f.name}`);
      } catch (err) { toast("This file is not a valid org chart file"); }
      e.target.value = "";
    };
    r.readAsText(f);
  });
  $("btnExport").addEventListener("click", () => {
    if (!doc) return;
    const clean = (n) => {
      const o = { id: n.id, name: n.name || "", role: n.role || "" };
      if (n.note) o.note = n.note; if (n.line) o.line = true; if (n.highlight) o.highlight = true;
      if (n.children.length) { o.collapsed = !!n.collapsed; o.children = n.children.map(clean); }
      return o;
    };
    const out = { title: doc.title, updated: new Date().toISOString().slice(0, 10), root: clean(doc.root) };
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "org.json";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    dirtySinceFile = false; store(); toast("Downloaded org.json");
  });
  // rename the chart: double-click the title
  $("chartTitle").addEventListener("dblclick", () => {
    if (!doc) return;
    const el = $("chartTitle"); el.contentEditable = "true"; el.focus();
    document.getSelection().selectAllChildren(el);
    const done = () => { el.contentEditable = "false"; const t = el.textContent.trim(); if (t && t !== doc.title) commit(() => (doc.title = t)); el.removeEventListener("blur", done); };
    el.addEventListener("blur", done);
    el.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); el.blur(); } }, { once: true });
  });

  // ---------- branch picker ----------
  function openBranches(open) {
    $("branchPanel").hidden = !open; $("btnBranches").classList.toggle("on", open);
    if (open) { $("branchSearch").value = ""; buildBranchList(); }
  }
  $("btnBranches").addEventListener("click", () => openBranches($("branchPanel").hidden));
  $("branchClose").addEventListener("click", () => openBranches(false));
  $("branchSearch").addEventListener("input", buildBranchList);
  function buildBranchList() {
    if (!doc) return;
    const q = norm($("branchSearch").value.trim()), out = [];
    // only boxes with people below them are branches
    const walk = (n, d, implied) => {
      if (!n.children.length) return;
      const checked = branches.has(n.id);
      if (!q || norm(n.name + " " + n.role).includes(q)) {
        out.push(`<label class="br${implied ? " implied" : ""}${n.line ? " line" : ""}" style="padding-left:${8 + d * 14}px">
          <input type="checkbox" data-br="${n.id}"${checked || implied ? " checked" : ""}${implied ? " disabled" : ""}>
          <span class="br-tx"><span class="br-nm">${esc(label(n))}</span>${n.name && n.role ? `<span class="br-rl">${esc(n.role)}</span>` : ""}</span>
          <span class="br-n" title="Boxes in this branch">${countBelow(n)}</span></label>`);
      }
      n.children.forEach((c) => walk(c, d + 1, implied || checked));
    };
    walk(doc.root, 0, false);
    $("branchList").innerHTML = out.join("") || '<div class="muted small">No team matches.</div>';
    $("branchAll").disabled = !branches.size;
  }
  $("branchList").addEventListener("change", (e) => {
    const id = e.target.dataset.br; if (!id) return;
    const n = get(id);
    if (e.target.checked) {
      branches.add(id); n.collapsed = false;
      // teams inside a ticked team are already included
      [...branches].forEach((b) => { if (b !== id && inSubtree(n, b)) branches.delete(b); });
    } else branches.delete(id);
    applyBranches();
  });
  function applyBranches() {
    storeBranches();
    matches = []; matchPos = -1; $("search").value = ""; $("searchInfo").textContent = "";
    render(); store(); fit(0.3);
    if (!$("branchPanel").hidden) buildBranchList();
  }
  $("branchAll").addEventListener("click", () => { branches.clear(); applyBranches(); });
  $("filterClear").addEventListener("click", () => { branches.clear(); applyBranches(); });
  $("filterEdit").addEventListener("click", () => openBranches(true));
  function renderFilterInfo() {
    const el = $("filterInfo");
    el.hidden = !branches.size;
    if (!branches.size) return;
    const names = [...branches].map((id) => label(get(id)));
    const shownNames = names.slice(0, 3).join(", ") + (names.length > 3 ? ` and ${names.length - 3} more` : "");
    $("filterText").textContent = `Showing only: ${shownNames}`;
  }

  // ---------- export to PDF and PowerPoint ----------
  // The libraries sit in js/vendor and load only when you export. Nothing leaves your computer.
  const LIBS = {
    pdf: ["js/vendor/jspdf.umd.min.js", () => window.jspdf && window.jspdf.jsPDF],
    pptx: ["js/vendor/pptxgen.bundle.js", () => window.PptxGenJS],
  };
  function loadLib(kind) {
    const [src, ready] = LIBS[kind];
    if (ready()) return Promise.resolve(ready());
    return new Promise((res, rej) => {
      const s = document.createElement("script"); s.src = src;
      s.onload = () => (ready() ? res(ready()) : rej(new Error("library not found")));
      s.onerror = () => rej(new Error("could not load " + src));
      document.head.appendChild(s);
    });
  }
  const THEMES = {
    dark: { bg: "000000", card: "141414", border: "333333", lineFill: "1F1306", orange: "FF7900", name: "FFFFFF", role: "C9C9C9", avFill: "1B1B1B", avLine: "555555", avText: "C9C9C9", grey: "4D4D4D", title: "FFFFFF", sub: "8C8C8C" },
    light: { bg: "FFFFFF", card: "FFFFFF", border: "BDBDBD", lineFill: "FFF1E5", orange: "FF7900", name: "000000", role: "4D4D4D", avFill: "F2F2F2", avLine: "999999", avText: "4D4D4D", grey: "999999", title: "000000", sub: "666666" },
  };
  const LKEY = () => CFG.storageKey + "_exportLight";
  const exportTheme = () => THEMES[$("expLight").checked ? "light" : "dark"];
  // colors of one box, the same rules as on screen
  function boxColors(b, T) {
    if (b.hl) return { fill: T.orange, border: T.orange, name: "000000", role: "000000", avFill: "000000", avLine: "000000", avText: T.orange };
    if (b.line) return { fill: T.lineFill, border: T.orange, name: T.name, role: T.role, avFill: T.avFill, avLine: T.orange, avText: T.orange };
    return { fill: T.card, border: T.border, name: T.name, role: T.role, avFill: T.avFill, avLine: T.avLine, avText: T.avText };
  }
  let mctx = null;
  // Break text into lines that fit the box. Cuts with "..." when it is too long, like the screen does.
  function wrap(text, font, maxW, maxLines) {
    mctx = mctx || document.createElement("canvas").getContext("2d");
    mctx.font = font;
    const fits = (s) => mctx.measureText(s).width <= maxW;
    const words = String(text || "").split(/\s+/).filter(Boolean), lines = [];
    let cur = [];
    words.forEach((w) => { if (!cur.length || fits(cur.concat(w).join(" "))) cur.push(w); else { lines.push(cur); cur = [w]; } });
    if (cur.length) lines.push(cur);
    const out = lines.slice(0, maxLines).map((l) => l.join(" "));
    // the last line takes all the remaining words, then gets cut with "..." if needed
    if (lines.length > maxLines) out[maxLines - 1] = lines.slice(maxLines - 1).flat().join(" ");
    return out.map((l) => {
      if (fits(l)) return l;
      let t = l; while (t.length > 1 && !fits(t + "...")) t = t.slice(0, -1);
      return t.trimEnd() + "...";
    });
  }
  const TX = 54, TW = NW - TX - 10;   // where the text sits in a box
  function exportModel() {
    const boxes = layout.boxes.map((n) => {
      const title = n.name || n.role || "(empty)", sub = n.name ? n.role : "";
      return { x: n._x, y: n._y, name: wrap(title, "bold 13px Arial", TW, 1)[0] || "", role: sub ? wrap(sub, "11.5px Arial", TW, 2) : [],
        ini: initials(n), line: !!n.line, hl: !!n.highlight, team: !n.name };
    });
    const names = [...branches].map((id) => label(get(id)));
    const sub = new Date().toISOString().slice(0, 10) + (names.length ? " · Showing: " + names.join(", ") : "");
    return { W: layout.top._w, H: layout.top._h, boxes, segs: layout.segs, title: doc.title || "Org chart", sub };
  }
  // vertical position of the name and role lines inside a box (in screen pixels)
  function textRows(b) {
    const total = 15.6 + (b.role.length ? 2 + b.role.length * 14.4 : 0);
    const y0 = b.y + (NH - total) / 2;
    return { name: y0, role: b.role.map((_, i) => y0 + 17.6 + i * 14.4) };
  }
  function fileName(ext) {
    const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const first = branches.size ? "-" + slug(label(get([...branches][0]))) + (branches.size > 1 ? "-and-more" : "") : "";
    return (slug(doc.title || "org-chart") || "org-chart") + first + "." + ext;
  }
  const M = 40, HEAD = 64;   // margin and title space around the chart, in screen pixels

  async function exportPdf() {
    const JsPDF = await loadLib("pdf"), T = exportTheme(), m = exportModel();
    // PDF standard fonts only know Western European letters; replace anything else
    const safe = (s) => String(s).replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/[\u2013\u2014\u2212]/g, "-")
      .replace(/[^\x00-\xFF]/g, (ch) => ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x00-\xFF]/g, "") || "?");
    const Wpx = m.W + 2 * M, Hpx = m.H + 2 * M + HEAD;
    let s = 0.75;                                    // 1 screen pixel = 0.75 pt, the size you see at 100%
    if (Math.max(Wpx, Hpx) * s > 14000) s = 14000 / Math.max(Wpx, Hpx);   // PDF page size limit
    const pw = Wpx * s, ph = Hpx * s;
    const pdf = new JsPDF({ orientation: pw >= ph ? "landscape" : "portrait", unit: "pt", format: [pw, ph], compress: true });
    pdf.setProperties({ title: safe(m.title) });
    const X = (x) => (M + x) * s, Y = (y) => (M + HEAD + y) * s, c = (h) => "#" + h;
    pdf.setFillColor(c(T.bg)); pdf.rect(0, 0, pw, ph, "F");
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(22 * s); pdf.setTextColor(c(T.title));
    pdf.text(safe(m.title), M * s, M * s, { baseline: "top" });
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(12 * s); pdf.setTextColor(c(T.sub));
    pdf.text(safe(m.sub), M * s, (M + 32) * s, { baseline: "top" });
    [0, 1].forEach((o) => {
      pdf.setDrawColor(c(o ? T.orange : T.grey)); pdf.setLineWidth((o ? 2.5 : 1.5) * s); pdf.setLineCap(o ? "square" : "butt");
      m.segs.filter((g) => g[4] === o).forEach((g) => pdf.line(X(g[0]), Y(g[1]), X(g[2]), Y(g[3])));
    });
    pdf.setLineCap("butt");
    m.boxes.forEach((b) => {
      const k = boxColors(b, T), r = textRows(b);
      pdf.setLineWidth(1 * s); pdf.setFillColor(c(k.fill)); pdf.setDrawColor(c(k.border));
      pdf.roundedRect(X(b.x), Y(b.y), NW * s, NH * s, 10 * s, 10 * s, "FD");
      const cx = X(b.x + 27), cy = Y(b.y + NH / 2);
      pdf.setFillColor(c(k.avFill)); pdf.setDrawColor(c(k.avLine));
      if (b.team) pdf.setLineDashPattern([3 * s, 2 * s], 0);
      pdf.circle(cx, cy, 17 * s, "FD");
      if (b.team) pdf.setLineDashPattern([], 0);
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(12 * s); pdf.setTextColor(c(k.avText));
      pdf.text(safe(b.ini), cx, cy, { align: "center", baseline: "middle" });
      pdf.setFontSize(13 * s); pdf.setTextColor(c(k.name));
      pdf.text(safe(b.name), X(b.x + TX), Y(r.name), { baseline: "top" });
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(11.5 * s); pdf.setTextColor(c(k.role));
      b.role.forEach((line, i) => pdf.text(safe(line), X(b.x + TX), Y(r.role[i]), { baseline: "top" }));
    });
    pdf.save(fileName("pdf"));
  }

  async function exportPptx() {
    const PptxGenJS = await loadLib("pptx"), T = exportTheme(), m = exportModel();
    const Wpx = m.W + 2 * M, Hpx = m.H + 2 * M + HEAD;
    // 1 screen pixel = 1/96 inch (the size you see at 100%); PowerPoint allows slides up to 56 inches
    const k = Math.min(1 / 96, 54 / Wpx, 54 / Hpx);
    const SW = Math.max(13.333, Wpx * k), SH = Math.max(7.5, Hpx * k);
    const ox = (SW - Wpx * k) / 2, oy = (SH - Hpx * k) / 2;
    const pres = new PptxGenJS();
    pres.defineLayout({ name: "ORGCHART", width: SW, height: SH }); pres.layout = "ORGCHART";
    pres.title = m.title;
    const sl = pres.addSlide(); sl.background = { color: T.bg };
    const X = (x) => ox + (M + x) * k, Y = (y) => oy + (M + HEAD + y) * k, D = (v) => v * k, PT = (px) => px * k * 72;
    const font = { fontFace: "Arial", margin: 0, wrap: false };
    sl.addText(m.title, Object.assign({ x: ox + M * k, y: oy + M * k, w: D(Wpx - 2 * M), h: D(30), fontSize: PT(22), bold: true, color: T.title, valign: "top" }, font));
    sl.addText(m.sub, Object.assign({ x: ox + M * k, y: oy + (M + 32) * k, w: D(Wpx - 2 * M), h: D(18), fontSize: PT(12), color: T.sub, valign: "top" }, font));
    [0, 1].forEach((o) => m.segs.filter((g) => g[4] === o).forEach((g) => {
      const w = Math.abs(g[2] - g[0]), h = Math.abs(g[3] - g[1]); if (!w && !h) return;
      sl.addShape(pres.ShapeType.line, { x: X(Math.min(g[0], g[2])), y: Y(Math.min(g[1], g[3])), w: D(w), h: D(h),
        line: { color: o ? T.orange : T.grey, width: Math.max(0.5, PT(o ? 2.5 : 1.5)) } });
    }));
    m.boxes.forEach((b) => {
      const c = boxColors(b, T);
      sl.addShape(pres.ShapeType.roundRect, { x: X(b.x), y: Y(b.y), w: D(NW), h: D(NH), rectRadius: D(10),
        fill: { color: c.fill }, line: { color: c.border, width: Math.max(0.5, PT(1)) } });
      sl.addText(b.ini, Object.assign({ shape: pres.ShapeType.ellipse, x: X(b.x + 10), y: Y(b.y + NH / 2 - 17), w: D(34), h: D(34),
        fill: { color: c.avFill }, line: { color: c.avLine, width: Math.max(0.5, PT(1)), dashType: b.team ? "dash" : "solid" },
        align: "center", valign: "middle", fontSize: PT(12), bold: true, color: c.avText }, font));
      const runs = [{ text: b.name, options: { bold: true, fontSize: PT(13), color: c.name, breakLine: b.role.length > 0 } }]
        .concat(b.role.map((r, i) => ({ text: r, options: { fontSize: PT(11.5), color: c.role, breakLine: i < b.role.length - 1 } })));
      sl.addText(runs, Object.assign({ x: X(b.x + TX), y: Y(b.y + 2), w: D(TW + 6), h: D(NH - 4), valign: "middle" }, font));
    });
    await pres.writeFile({ fileName: fileName("pptx") });
  }

  async function runExport(fn, name) {
    $("outMenu").hidden = true;
    if (!doc || !layout) return;
    toast(`Making the ${name} file...`);
    try { await fn(); toast(`Downloaded the ${name} file`); }
    catch (err) { console.error(err); toast(`Could not make the ${name} file`); }
  }
  $("btnOut").addEventListener("click", (e) => { e.stopPropagation(); $("outMenu").hidden = !$("outMenu").hidden; });
  document.addEventListener("click", (e) => { if (!e.target.closest(".menu-wrap")) $("outMenu").hidden = true; });
  $("expPdf").addEventListener("click", () => runExport(exportPdf, "PDF"));
  $("expPptx").addEventListener("click", () => runExport(exportPptx, "PowerPoint"));
  try { $("expLight").checked = localStorage.getItem(LKEY()) === "1"; } catch (e) { /* ignore */ }
  $("expLight").addEventListener("change", () => { try { localStorage.setItem(LKEY(), $("expLight").checked ? "1" : "0"); } catch (e) { /* ignore */ } });

  // keyboard shortcuts (not while typing in a field)
  document.addEventListener("keydown", (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
    if (e.key === "Escape" && !typing) { select(null); $("outMenu").hidden = true; }
    if (typing) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
    if (mod && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) { e.preventDefault(); redo(); }
  });

  let toastTimer = null;
  function toast(msg) { const t = $("toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 2200); }

  // ---------- start ----------
  $("version").textContent = CFG.appVersion ? "v" + CFG.appVersion : "";
  async function start() {
    doc = restore();
    if (!doc) {
      // When the app runs on your own computer next to org.json, open it automatically.
      try {
        const r = await fetch("org.json", { cache: "no-store" });
        if (r.ok) { const o = await r.json(); doc = { title: o.title || "Org chart", updated: o.updated, root: o.root || o }; dirtySinceFile = false; }
      } catch (e) { /* no local file, show the open screen */ }
    }
    if (doc) { ensure(doc.root); applyDefaultOpen(doc.root, 0); reindex(); restoreBranches(); }
    render(); updateButtons(); status(); fit(branches.size ? 0.3 : 0.55);
  }
  window.addEventListener("resize", () => { if (doc) applyView(); });
  start();
})();
