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
  appVersion: "3.30",
};
