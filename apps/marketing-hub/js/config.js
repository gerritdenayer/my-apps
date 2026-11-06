// App configuration. The admin PIN is stored here as a salted one-way hash, never in
// plain text. To change the baked-in default PIN, replace adminPinHash below with the hash
// of your new PIN (the app can compute it: Settings has a "Change admin pin" tool that
// updates the stored hash for you). The god code is a universal master code and is not
// stored here in readable form.
//
// Security note: this app runs entirely in the browser, so this PIN is a soft lock for
// normal use, not real security. Real enforcement comes with SharePoint permissions.
window.MB_CONFIG = {
  // Salt mixed into the PIN before hashing. Changing it invalidates existing hashes.
  pinSalt: "MBHUB::v1::",
  // SHA-256 of (pinSalt + PIN). Default PIN is 2468.
  adminPinHash: "94c4d698ea9ed65b0e8a4f73b107d6bb7ea3169836657e5d983c36e1421dfc10",
  // Single source of truth for the version shown in the header. Bump this on each change set.
  appVersion: "5.3.0",
};

// ---- Dev copy safeguards (apps/marketing-hub-dev, see js/env.js) ----
// Production and dev live on the same website, and browsers keep storage per website, not per
// folder. So the dev copy gives every stored key and database its own "mbdev:" prefix: it never
// sees or changes production's local data or its remembered shared folder. It also shows a DEV
// banner and a "-dev" version. Writing to a shared folder is blocked unless the folder name
// contains "TEST" (see share.js).
(function () {
  const env = (window.MB_ENV && window.MB_ENV.name) || "prod";
  window.MB_CONFIG.env = env;
  if (env !== "dev") return;
  window.MB_CONFIG.appVersion = window.MB_ENV.build || (window.MB_CONFIG.appVersion + "-dev");
  const P = "mbdev:";
  const sp = Storage.prototype, get = sp.getItem, set = sp.setItem, del = sp.removeItem;
  sp.getItem = function (k) { return get.call(this, P + k); };
  sp.setItem = function (k, v) { return set.call(this, P + k, v); };
  sp.removeItem = function (k) { return del.call(this, P + k); };
  if (window.indexedDB) {
    const open = window.indexedDB.open.bind(window.indexedDB);
    window.indexedDB.open = (name, version) => open(P + name, version);
  }
  document.title = "DEV - " + document.title;
  document.addEventListener("DOMContentLoaded", () => {
    const b = document.createElement("div");
    b.className = "env-banner";
    b.textContent = "DEV version: for testing only. It works on the MarketingHub-TEST folder, never on the team's data.";
    document.body.insertBefore(b, document.body.firstChild);
  });
})();
