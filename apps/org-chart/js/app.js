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
  function afterChange() { dirtySinceFile = true; reindex(); render(); store(); syncPanel(); updateButtons(); }
  function undo() { if (!undoStack.length) return; redoStack.push(snap()); doc = JSON.parse(undoStack.pop()); afterChange(); toast("Undone"); }
  function redo() { if (!redoStack.length) return; undoStack.push(snap()); doc = JSON.parse(redoStack.pop()); afterChange(); toast("Redone"); }
  function updateButtons() {
    $("btnUndo").disabled = !undoStack.length; $("btnRedo").disabled = !redoStack.length;
    ["btnExpand", "btnCollapse", "btnFit", "btnZoomIn", "btnZoomOut", "btnExport"].forEach((b) => ($(b).disabled = !doc));
  }

  // ---------- layout ----------
  const visibleKids = (n) => (n.collapsed ? [] : n.children);
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
    measure(doc.root); position(doc.root, 0, 0);
    const html = [], grey = [], orange = [];
    const matchSet = new Set(matches);
    const walk = (n, stackedChild) => {
      const kids = visibleKids(n);
      const cls = ["node"];
      if (n.line) cls.push("line");
      if (n.highlight) cls.push("highlight");
      if (!n.name) cls.push("team");
      if (n.id === selectedId) cls.push("selected");
      if (matchSet.has(n.id)) cls.push("match");
      if (matches[matchPos] === n.id) cls.push("current");
      if (stackedChild) cls.push("stacked-child");
      const title = n.name || n.role || "(empty)";
      const sub = n.name ? n.role : "";
      const tog = n.children.length ? `<button class="tog" data-tog="${n.id}" title="${n.collapsed ? "Open team" : "Close team"}">${n.collapsed ? "+" + n.children.length : "−"}</button>` : "";
      html.push(`<div class="${cls.join(" ")}" data-id="${n.id}" draggable="true" style="left:${n._x}px;top:${n._y}px" title="${esc(title + (sub ? " · " + sub : "") + (n.note ? "\n" + n.note : ""))}">
        <div class="av">${esc(initials(n))}</div>
        <div class="tx"><div class="nm">${esc(title)}</div>${sub ? `<div class="rl">${esc(sub)}</div>` : ""}</div>
        ${n.note ? '<span class="note-dot"></span>' : ""}${tog}</div>`);
      if (!kids.length) return;
      if (n._stack) {
        const lx = n._x + 14, top = n._y + NH;
        const last = kids[kids.length - 1];
        grey.push(`M${lx} ${top}V${last._y + NH / 2}`);
        kids.forEach((k) => {
          const my = k._y + NH / 2, seg = `M${lx} ${my}H${k._x}`;
          (k.line ? orange : grey).push(seg);
          if (k.line) orange.push(`M${lx} ${top}V${my}`);
        });
      } else {
        const px = n._x + NW / 2, py = n._y + NH, mid = py + VG / 2;
        const xs = kids.map((k) => k._x + NW / 2);
        grey.push(`M${px} ${py}V${mid}`);
        grey.push(`M${Math.min(px, ...xs)} ${mid}H${Math.max(px, ...xs)}`);
        kids.forEach((k, i) => {
          const seg = `M${xs[i]} ${mid}V${k._y}`;
          if (k.line) orange.push(`M${px} ${py}V${mid}H${xs[i]}`, seg); else grey.push(seg);
        });
      }
      kids.forEach((k) => walk(k, n._stack));
    };
    walk(doc.root, false);
    nodesEl.innerHTML = html.join("");
    const W = doc.root._w + 40, H = doc.root._h + 40;
    svg.setAttribute("width", W); svg.setAttribute("height", H);
    svg.innerHTML = `<path d="${grey.join("")}" stroke="#4D4D4D" stroke-width="1.5" fill="none"/><path d="${orange.join("")}" stroke="#FF7900" stroke-width="2.5" fill="none"/>`;
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
    if (!doc) return;
    const vp = $("viewport").getBoundingClientRect();
    const w = doc.root._w, h = doc.root._h;
    view.s = Math.min(1.1, (vp.width - 60) / w, (vp.height - 90) / h);
    view.s = Math.max(view.s, minScale);
    // keep the top box in the middle when the chart is wider than the screen
    view.tx = w * view.s <= vp.width ? (vp.width - w * view.s) / 2 : vp.width / 2 - (doc.root._x + NW / 2) * view.s;
    view.ty = 24; applyView();
  }
  function centerOn(id) {
    const n = get(id); if (!n || n._x === undefined) return;
    const vp = $("viewport").getBoundingClientRect();
    if (view.s < 0.6) view.s = 0.8;
    view.tx = vp.width / 2 - (n._x + NW / 2) * view.s; view.ty = vp.height / 3 - (n._y + NH / 2) * view.s; applyView();
  }
  (function setupPan() {
    const vp = $("viewport");
    let pan = null;
    vp.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".node") || e.target.closest(".empty") || e.button !== 0) return;
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
      index.forEach(({ node }) => { if (norm(node.name + " " + node.role + " " + (node.note || "")).includes(q)) matches.push(node.id); });
      // open the teams that hold a match
      matches.forEach((id) => { let p = parentOf(id); while (p) { p.collapsed = false; p = parentOf(p.id); } });
      if (matches.length) matchPos = 0;
    }
    $("searchInfo").textContent = q ? (matches.length ? `${matches.length} found${matches.length > 1 ? " · Enter for next" : ""}` : "No match") : "";
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
    undoStack = []; redoStack = []; afterChange(); fit(); selectAndEdit(doc.root.id);
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

  // keyboard shortcuts (not while typing in a field)
  document.addEventListener("keydown", (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
    if (e.key === "Escape" && !typing) select(null);
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
    if (doc) { ensure(doc.root); applyDefaultOpen(doc.root, 0); reindex(); }
    render(); updateButtons(); status(); fit(0.55);
  }
  window.addEventListener("resize", () => { if (doc) applyView(); });
  start();
})();
