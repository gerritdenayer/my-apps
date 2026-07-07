// Local storage backend. All data lives in this browser's localStorage.
// Export / Import / Merge let users move data between machines via JSON files.
(function () {
  const STORAGE_KEY = "mb_data_v1";

  function uid() {
    return "id-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  }

  const AP_SEED = [
    "Enhance market awareness and perception", "Develop influencers", "Account Based Marketing",
    "Lead generation campaigns", "Marketing tools", "Content and Sales enablement",
    "Customer intimacy", "Partner marketing", "Market research and studies",
  ];
  const M1_SEED = ["International Zone", "Zone France", "Business Line", "SCM", "Comms"];

  const defaultData = () => {
    const apCats = AP_SEED.map((name) => ({ id: uid(), name }));
    const catId = (name) => (apCats.find((c) => c.name === name) || {}).id || "";
    return {
      version: 1,
      settings: {
        entities: [
          { id: "es", name: "Spain", group: "Digital & Data", m1: "International Zone" },
          { id: "ch-ge", name: "Switzerland - Geneva", group: "Digital & Data", m1: "International Zone" },
          { id: "ch-zh", name: "Switzerland - Zurich", group: "Digital & Data", m1: "International Zone" },
          { id: "lu", name: "Luxembourg", group: "Digital & Data", m1: "International Zone" },
          { id: "be", name: "Belgium", group: "Digital & Data", m1: "International Zone" },
          { id: "nl", name: "Netherlands", group: "Digital & Data", m1: "International Zone" },
          { id: "no", name: "Norway", group: "Cloud", m1: "International Zone" },
          { id: "se", name: "Sweden", group: "Cloud", m1: "International Zone" },
        ],
        m1Levels: M1_SEED.slice(),
        apCategories: apCats,
        svps: [{ id: uid(), name: "None" }, { id: uid(), name: "All" }],
        globalCampaigns: [{ id: uid(), name: "None" }, { id: uid(), name: "All" }],
        activityTypes: [
          { id: uid(), name: "Event", apCategoryId: catId("Enhance market awareness and perception") },
          { id: uid(), name: "Digital campaign", apCategoryId: catId("Lead generation campaigns") },
          { id: uid(), name: "Sponsorship", apCategoryId: catId("Develop influencers") },
          { id: uid(), name: "Content", apCategoryId: catId("Content and Sales enablement") },
        ],
        users: [],
        statuses: [
          { id: uid(), name: "Committed" },
          { id: uid(), name: "Planned" },
        ],
        yearlyBudgets: {},
        budgetCodes: {},
        partners: [],
        countries: [],
        countryGroups: [],
      },
      activities: [],
      events: [],
      meta: {},
    };
  };

  async function load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    try {
      const data = JSON.parse(raw);
      if (!data || !data.version) return defaultData();
      return data;
    } catch (e) {
      console.error("Local data corrupt, using defaults", e);
      return defaultData();
    }
  }

  async function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function clearAll() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // Stamp an export object with who made it, when, and what kind of file it is.
  // Returns a new object; does not download. Used by exportToFile and the shared folder.
  function stampExport(data, by, kind) {
    const meta = { ...(data.meta || {}), exportedAt: new Date().toISOString() };
    if (by) meta.exportedBy = by;
    if (kind) meta.exportKind = kind;
    return { ...data, meta };
  }

  function exportToFile(data, filename, by, kind) {
    const blob = new Blob([JSON.stringify(stampExport(data, by, kind), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `marketing-budget-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function readJsonFile(file) {
    const text = await file.text();
    let data = JSON.parse(text);
    // JSONBin API responses wrap the content in { record: {...}, metadata: {...} } - unwrap
    if (data && typeof data === "object" && data.record && !data.version) {
      data = data.record;
    }
    validateShape(data);
    return data;
  }

  function validateShape(data) {
    if (!data || typeof data !== "object") throw new Error("File is not a JSON object");
    if (!data.version) throw new Error("Missing 'version' field. Is this a Marketing Budget export?");
    const hasSettings = data.settings && typeof data.settings === "object";
    const hasData = Array.isArray(data.activities) || Array.isArray(data.events);
    if (!hasSettings && !hasData) throw new Error("File has no settings and no budget/events data");
  }

  // ---- Split exports and smart merge (setup vs budget+events) ----
  function pickSetup(data) {
    return { version: data.version || 1, meta: { ...(data.meta || {}) }, settings: JSON.parse(JSON.stringify(data.settings || {})) };
  }
  function pickBudgetEvents(data) {
    return { version: data.version || 1, meta: { ...(data.meta || {}) },
             events: JSON.parse(JSON.stringify(data.events || [])),
             activities: JSON.parse(JSON.stringify(data.activities || [])) };
  }
  // Decide what a loaded file is.
  function detectKind(d) {
    if (d && d.meta && d.meta.exportKind) return d.meta.exportKind;
    const hasSettings = d && d.settings && Object.keys(d.settings).length > 0;
    const hasData = d && (Array.isArray(d.events) || Array.isArray(d.activities));
    if (hasSettings && hasData) return "full";
    if (hasSettings) return "setup";
    return "budget-events";
  }
  function _sig(o) {
    const skip = { createdAt: 1, updatedAt: 1, createdBy: 1, updatedBy: 1 };
    const c = {}; Object.keys(o).forEach((k) => { if (!skip[k]) c[k] = o[k]; });
    return JSON.stringify(c, Object.keys(c).sort());
  }
  // Compare current data with an incoming budget+events file. Returns adds / updates / missing
  // per list, plus warnings for incoming items that reference an entity or owner you do not have.
  function diffBudgetEvents(current, incoming) {
    const entIds = new Set((current.settings.entities || []).map((e) => e.id));
    const userIds = new Set((current.settings.users || []).map((u) => u.id));
    const res = { warnings: [] };
    function go(key) {
      const cur = current[key] || [], inc = incoming[key] || [];
      const curById = Object.fromEntries(cur.map((x) => [x.id, x]));
      const incById = Object.fromEntries(inc.map((x) => [x.id, x]));
      const adds = [], updates = [], missing = [];
      inc.forEach((x) => {
        const isAdd = !curById[x.id];
        const isUpd = curById[x.id] && _sig(x) !== _sig(curById[x.id]);
        if (isAdd) adds.push({ id: x.id, name: x.name || "(no name)" });
        else if (isUpd) updates.push({ id: x.id, name: x.name || "(no name)" });
        if (isAdd || isUpd) {
          if (x.entityId && !entIds.has(x.entityId)) res.warnings.push(`"${x.name || x.id}" references an entity not in your setup`);
          if (x.ownerId && !userIds.has(x.ownerId)) res.warnings.push(`"${x.name || x.id}" references an owner not in your setup`);
        }
      });
      cur.forEach((x) => { if (!incById[x.id]) missing.push({ id: x.id, name: x.name || "(no name)" }); });
      res[key] = { adds, updates, missing };
    }
    go("events"); go("activities");
    return res;
  }
  // Apply the merge: add new items; update changed ones (incoming wins) unless skipUpdates;
  // delete the chosen missing ids. opts = { delEventIds, delActIds, skipUpdates }.
  function applyBudgetEventsMerge(current, incoming, opts) {
    opts = opts || {};
    const result = JSON.parse(JSON.stringify(current));
    function merge(key, delSet) {
      const incById = Object.fromEntries((incoming[key] || []).map((x) => [x.id, x]));
      const out = [];
      (result[key] || []).forEach((x) => {
        if (delSet && delSet.has(x.id)) return;       // deleted by choice
        if (incById[x.id]) { out.push(opts.skipUpdates ? x : incById[x.id]); delete incById[x.id]; }
        else out.push(x);
      });
      Object.values(incById).forEach((x) => out.push(x)); // adds
      result[key] = out;
    }
    merge("events", opts.delEventIds);
    merge("activities", opts.delActIds);
    result.meta = { ...(result.meta || {}), lastUpdated: new Date().toISOString() };
    return result;
  }
  // Replace the structure (entities, clusters, users, lookups, budgets) from a setup file.
  function replaceSetup(current, incoming) {
    const result = JSON.parse(JSON.stringify(current));
    result.settings = JSON.parse(JSON.stringify(incoming.settings || {}));
    result.meta = { ...(result.meta || {}), lastUpdated: new Date().toISOString() };
    return result;
  }

  // Merge incoming JSON into existing data. Returns { data: merged, stats }.
  // Lookup lists (entities, svps, types, statuses, users) merge by name (case-insensitive).
  // Activities merge by id (skip duplicates).
  // Yearly budgets and codes are added only where no existing value exists for that year+entity.
  function mergeData(existing, incoming) {
    const result = JSON.parse(JSON.stringify(existing));
    result.settings = result.settings || {};
    result.settings.entities = result.settings.entities || [];
    result.settings.svps = result.settings.svps || [];
    result.settings.activityTypes = result.settings.activityTypes || [];
    result.settings.statuses = result.settings.statuses || [];
    result.settings.users = result.settings.users || [];
    result.settings.yearlyBudgets = result.settings.yearlyBudgets || {};
    result.settings.budgetCodes = result.settings.budgetCodes || {};
    result.activities = result.activities || [];
    result.events = result.events || [];
    result.settings.partners = result.settings.partners || [];
    result.settings.apCategories = result.settings.apCategories || [];
    result.settings.globalCampaigns = result.settings.globalCampaigns || [];
    result.settings.m1Levels = result.settings.m1Levels || [];

    const stats = { entities: 0, svps: 0, types: 0, statuses: 0, users: 0, activities: 0, events: 0, budgets: 0, codes: 0, skipped: 0 };

    const findByName = (list, name) => {
      const key = (name || "").trim().toLowerCase();
      if (!key) return null;
      return list.find((x) => (x.name || "").trim().toLowerCase() === key) || null;
    };

    // Build ID maps: incoming ID → local canonical ID
    const idMap = { entity: {}, svp: {}, type: {}, status: {}, user: {} };

    function mergeList(localList, incomingList, idMapBucket, statsKey, extraDefaults) {
      (incomingList || []).forEach((item) => {
        if (!item || !item.name) return;
        const existingItem = findByName(localList, item.name);
        if (existingItem) {
          idMapBucket[item.id] = existingItem.id;
        } else {
          const newItem = { ...extraDefaults, ...item, id: uid() };
          localList.push(newItem);
          idMapBucket[item.id] = newItem.id;
          stats[statsKey]++;
        }
      });
    }

    mergeList(result.settings.entities, incoming.settings.entities, idMap.entity, "entities");
    mergeList(result.settings.svps, incoming.settings.svps, idMap.svp, "svps");
    // New name-lists (no id remap needed elsewhere): A&P categories, global campaigns
    mergeList(result.settings.apCategories, (incoming.settings || {}).apCategories, {}, "skipped");
    mergeList(result.settings.globalCampaigns, (incoming.settings || {}).globalCampaigns, {}, "skipped");
    ((incoming.settings || {}).m1Levels || []).forEach((m) => {
      if (m && !result.settings.m1Levels.includes(m)) result.settings.m1Levels.push(m);
    });
    mergeList(result.settings.activityTypes, incoming.settings.activityTypes, idMap.type, "types");
    mergeList(result.settings.statuses, incoming.settings.statuses, idMap.status, "statuses");
    mergeList(result.settings.users, incoming.settings.users, idMap.user, "users");

    // Yearly budgets: add only where local has no value
    Object.entries(incoming.settings.yearlyBudgets || {}).forEach(([year, byEnt]) => {
      result.settings.yearlyBudgets[year] = result.settings.yearlyBudgets[year] || {};
      Object.entries(byEnt || {}).forEach(([incomingEntId, amount]) => {
        const localEntId = idMap.entity[incomingEntId] || incomingEntId;
        if (!(localEntId in result.settings.yearlyBudgets[year])) {
          result.settings.yearlyBudgets[year][localEntId] = amount;
          stats.budgets++;
        }
      });
    });

    // Budget codes: same logic
    Object.entries(incoming.settings.budgetCodes || {}).forEach(([year, byEnt]) => {
      result.settings.budgetCodes[year] = result.settings.budgetCodes[year] || {};
      Object.entries(byEnt || {}).forEach(([incomingEntId, code]) => {
        const localEntId = idMap.entity[incomingEntId] || incomingEntId;
        if (!(localEntId in result.settings.budgetCodes[year]) && code) {
          result.settings.budgetCodes[year][localEntId] = code;
          stats.codes++;
        }
      });
    });

    // Activities: skip duplicates by id, remap references
    const existingActivityIds = new Set(result.activities.map((a) => a.id));
    (incoming.activities || []).forEach((a) => {
      if (existingActivityIds.has(a.id)) {
        stats.skipped++;
        return;
      }
      const remapped = {
        ...a,
        entityId: idMap.entity[a.entityId] || a.entityId,
        svpId: idMap.svp[a.svpId] || a.svpId,
        activityTypeId: idMap.type[a.activityTypeId] || a.activityTypeId,
        statusId: idMap.status[a.statusId] || a.statusId,
        ownerId: idMap.user[a.ownerId] || a.ownerId,
      };
      result.activities.push(remapped);
      existingActivityIds.add(a.id);
      stats.activities++;
    });

    // Events: skip duplicates by id (events use plain-text fields, no id remap needed)
    const existingEventIds = new Set(result.events.map((e) => e.id));
    (incoming.events || []).forEach((e) => {
      if (existingEventIds.has(e.id)) { stats.skipped++; return; }
      result.events.push(e);
      existingEventIds.add(e.id);
      stats.events++;
    });

    // Partners master list: merge by name
    mergeList(result.settings.partners, (incoming.settings || {}).partners, {}, "skipped");

    return { data: result, stats };
  }

  window.MB_API = {
    defaultData, uid,
    load, save, clearAll,
    exportToFile, stampExport, readJsonFile, mergeData,
    pickSetup, pickBudgetEvents, detectKind,
    diffBudgetEvents, applyBudgetEventsMerge, replaceSetup,
  };
})();
