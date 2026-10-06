// Shared folder sync using the browser File System Access API. Lets the app read and write
// JSON files in a folder the user picks (typically a Teams / OneDrive synced folder), so a
// team can publish and pull the master data. The chosen folder handle is remembered in
// IndexedDB so people only pick it once; the browser may still ask to confirm access per
// session, which is a single click. Only works in Chromium browsers (Chrome, Edge) over
// https or localhost. Everything here is plumbing; the buttons live in the Data tab.
(function () {
  const DB_NAME = "mbhub_share";
  const STORE = "handles";

  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function idbSet(key, val) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(val, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  async function idbGet(key) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const rq = tx.objectStore(STORE).get(key);
      rq.onsuccess = () => resolve(rq.result || null);
      rq.onerror = () => reject(rq.error);
    });
  }
  async function idbDel(key) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Is the direct-write feature available in this browser and context?
  function supported() {
    return typeof window.showDirectoryPicker === "function";
  }

  // Ask the user to pick the shared folder, and remember it.
  async function chooseFolder() {
    const handle = await window.showDirectoryPicker({ id: "mbhub-shared", mode: "readwrite" });
    await idbSet("dir", handle);
    return handle;
  }
  async function savedFolder() {
    return idbGet("dir");
  }
  // Optional second shared folder (bridge): an admin who can reach two team folders keeps them
  // in sync. Stored separately; the main folder stays the one the app works with.
  async function chooseBridge() {
    const handle = await window.showDirectoryPicker({ id: "mbhub-bridge", mode: "readwrite" });
    await idbSet("dir2", handle);
    return handle;
  }
  async function savedBridge() { return idbGet("dir2"); }
  async function forgetBridge() { return idbDel("dir2"); }
  async function forgetFolder() {
    return idbDel("dir");
  }

  // Make sure we still have permission to the folder; may prompt once per session.
  async function ensurePerm(handle, mode) {
    if (!handle) return false;
    const opts = { mode: mode || "readwrite" };
    if ((await handle.queryPermission(opts)) === "granted") return true;
    return (await handle.requestPermission(opts)) === "granted";
  }

  // Check permission without prompting. Safe to call on page load (no user gesture).
  async function hasPerm(handle, mode) {
    if (!handle) return false;
    try { return (await handle.queryPermission({ mode: mode || "readwrite" })) === "granted"; }
    catch (e) { return false; }
  }

  // Read and parse a JSON file from the folder. Returns null if the file is not there yet.
  async function readJson(dir, filename) {
    try {
      const fh = await dir.getFileHandle(filename);
      const file = await fh.getFile();
      const text = await file.text();
      if (!text.trim()) return null;
      return JSON.parse(text);
    } catch (e) {
      if (e && e.name === "NotFoundError") return null;
      throw e;
    }
  }

  // Write an object to the folder as pretty JSON, creating the file if needed.
  async function writeJson(dir, filename, obj) {
    const fh = await dir.getFileHandle(filename, { create: true });
    const w = await fh.createWritable();
    await w.write(JSON.stringify(obj, null, 2));
    await w.close();
  }

  // Basic info about a file in the folder: last saved date and size. Null if it is not there.
  async function fileInfo(dir, filename) {
    try {
      const f = await (await dir.getFileHandle(filename)).getFile();
      return { name: filename, lastModified: f.lastModified, size: f.size };
    } catch (e) {
      if (e && e.name === "NotFoundError") return null;
      throw e;
    }
  }

  // Names of the files directly in the folder.
  async function listFiles(dir) {
    const out = [];
    for await (const [name, h] of dir.entries()) { if (h.kind === "file") out.push(name); }
    return out;
  }

  window.MB_SHARE = { chooseBridge, savedBridge, forgetBridge, listFiles, supported, chooseFolder, savedFolder, forgetFolder, ensurePerm, hasPerm, readJson, writeJson, fileInfo };
})();
