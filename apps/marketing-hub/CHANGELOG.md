# Changelog

## [v4.1] - 2026-07-10 - Events and campaigns without a budget

### Added
- The campaign / event form now has a "No budget line (agenda only)" option. An event or
  campaign can exist purely on the agenda, with no budget line created or linked. Budget is no
  longer required. When an item has no budget, the type and entity fields are not forced either.

## [v4.0] - 2026-07-03 - Campaigns are real, global campaigns are gone

### Changed
- The "global campaign" concept is removed. There is no Global campaigns list in Settings, and
  no global-campaign field, column or filter anywhere.
- A campaign is now simply a timeline item of type Campaign. You create and edit campaigns in the
  Campaigns & events area, like events.
- An event can optionally link to a campaign, using the new "Part of campaign" field in the event
  form. Events and campaigns can each exist on their own; the link is optional.
- The timeline can group and color by Campaign, so events linked to a campaign appear grouped
  under it. The hover tooltip shows an event's campaign.
- Exports and the Data grid show a Campaign column (the linked campaign) for events instead of a
  global campaign. Budget lines no longer carry a global campaign.

### Migration
- One-time, on first open of 4.0: the old global campaigns and all their references are dropped,
  per the clean-slate choice. Every event gets an empty campaign link you can set in the form.
  Your budget lines, events and settings are otherwise untouched.

## [v3.31] - 2026-07-03 - Budget line fields inside the campaign form

### Changed
- The budget part of the campaign / event form now behaves like a real budget line. When you
  link an existing budget line, the activity type is not asked again, because it already lives on
  that line and the event inherits it. When you create a new line, the fields to fill are the
  budget line's own fields (activity type, A&P category, status, vendor, PO number, forecast and
  actual amounts). Everything already on the event (name, dates, organising entity, owner, SVP,
  global campaign) is filled in automatically, so it is not typed twice. A&P category defaults
  from the chosen activity type.

### Added
- Data tab: Export to Excel, with separate buttons for budget lines and for campaigns / events.
  Pick a year and tick the quarters to include (no quarter ticked means the whole year).

### Changed
- The Quarter filter on the Budget tab and the Campaigns & events tab is now a multi-select
  (Q1-Q4 checkboxes), so you can view, for example, Q1 and Q2 together. No quarter ticked shows
  all quarters. On the timeline, the visible window spans the selected quarters and only events
  in those quarters show.

## [v3.29] - 2026-07-03 - Campaign form tidy-up and timeline labels

### Changed
- Campaign / event form: Activity type moved out of the event section into the Budget part,
  where it belongs. The event top now holds only event fields (name, kind, dates, owner,
  organising entity/cluster, SVP, global campaign, campaign code, countries, notes, partners,
  content).
- Partner co-funding now fills the budget line automatically: enter co-funding on a partner line
  and it adds up into the budget line's Forecast partner, so you do not type it twice. Still
  editable.
- Timeline: the event name no longer shows twice. The bar shows the event name, and the left
  label now shows the next level down from the grouping (grouping by Cluster shows the Entity
  there, by Entity shows the Owner, and so on).

## [v3.28] - 2026-07-03 - Fix: deleted rows reappearing after publish

### Fixed
- Deleting a budget line or event and publishing now actually removes it from the shared file,
  instead of the merge pulling it back. The merge compares against your last-synced snapshot to
  tell a real deletion from a row you simply never had. If a teammate changed that same row in
  the meantime, their version is kept rather than deleted, so no one's edit is lost. The publish
  message now also reports how many rows were removed.

## [v3.27] - 2026-07-03 - Privacy cleanup: remove real data and internal docs from the repo

### Removed
- `js/seed-events.js` (97 real events with colleague names) and its script tag and seeding code.
  New installs now start empty; existing data in the browser and the shared file is untouched.
- `js/import-2026-h2.js` (dead code with real budget lines, not referenced anywhere).
- `Campaigns-events-structure-review.xlsx` (real dataset).
- Internal docs and scripts that exposed tenant and SharePoint names: DATA-SCHEMA-sharepoint-lists.md,
  IT-REQUEST-entra-app.md, IT-SPEC-multi-tenant-SharePoint.md, HANDOFF.md, DATA-MODEL-cleanup.md,
  check-sharepoint.ps1, migrate-data-to-sharepoint.ps1, provision-sharepoint.ps1.

### Note
- The master code comment was intentionally left for a later, separate change.
- These files still exist in earlier git history. Make the repo private and/or purge history.

## [v3.26] - 2026-07-03 - Header shows the shared file date

### Added
- Next to "Data updated" in the header, a "Shared file" date showing the timestamp of the shared
  budget & events file as of this browser's last sync (pull, publish, or the auto-check on open).
  It stays blank until a shared folder is set and the first sync happens.

## [v3.25] - 2026-07-03 - Publish now merges instead of overwriting

### Changed
- Publishing budget & events now reads the shared file first and does a real merge. It writes
  only the rows you inserted or changed since your last sync, keeps teammates' changes to rows
  you did not touch, and pulls those into your copy at the same time. Nothing is deleted (use
  Review & merge for that). Because it merges, it no longer blocks you when a colleague published
  since your last pull. The confirmation shows how many rows went out and how many came in.

## [v3.24] - 2026-07-03 - Fix: reopening a column header menu

### Fixed
- On the Budget tab, once a column filter was set you could not click the header again to change
  or clear it. The menu's outside-click listener was left behind and closed the next menu the
  instant it opened. The listener is now cleaned up properly, so headers reopen every time.

## [v3.23] - 2026-07-03 - Excel-style Budget headers and a Data table with bulk edit

### Added
- Excel-style column headers on the Budget tab. Click any header for a menu with Sort A to Z,
  Sort Z to A, and a filter. Filter options: equals, does not equal, is blank, contains data,
  contains, does not contain. Equals and does not equal give a dropdown of the values found in
  that column; contains and does not contain give a text box. Filters stack, filtered columns
  show a small flag, and a "Clear filters" button appears when any are active.
- A Global campaign column on the Budget table (so it can be sorted and filtered like the rest).
- A "Budget & events table" on the Data tab: a grid you switch between budget lines and events,
  with sortable headers, row checkboxes, and multi-row editing. Tick rows, pick a field (status,
  owner, SVP, type, global campaign, entity, date, kind...) and a value, and apply to all ticked
  at once, after a confirm.

### Changed
- The Budget tab top bar now keeps only Year, Quarter, Month, the M1/cluster/entity scope, and
  Search. SVP, global campaign, type, status and owner moved into the column header menus.
  Reporting drill-downs now land as column filters, so they show on the headers and can be cleared.

## [v3.22] - 2026-07-02 - Checkbox picker for linking budget lines

### Changed
- In the event form, linking existing budget lines now uses a checkbox list instead of the old
  multi-select. Each line has a clear checkbox, the selected lines show as chips on top with an
  x to remove one quickly, and the filter box still narrows the list. No more Ctrl or Cmd clicking.

## [v3.21] - 2026-07-02 - Clearer shared folder and a Publish reminder

### Added
- A "Publish changes" button on the Budget and Campaigns & events tabs. It only appears when a
  shared folder is set, and it lights up green as soon as you make a change, so you don't forget
  to publish. It greys out to "No changes to publish" once you are in sync. It uses the same
  guard as the Data tab, so it warns you if a colleague published since you last pulled.

### Changed
- The Data tab shared folder section now clearly shows the selected folder ("Current shared
  folder: NAME") and the button reads "Change shared folder..." once one is set.

## [v3.20] - 2026-07-02 - Country tagging for the agenda

### Added
- Countries on campaigns and events, so people can see what is happening in their country.
  Purely for the agenda, not linked to budget.
- Settings: a Countries master list (mark one "global", like Pan-European, to show everywhere)
  and Country groups (like BeNeLux = Belgium + Netherlands + Luxembourg) used as tagging shortcuts.
- In the event form, a Countries picker: one-click group chips, a searchable checklist,
  "Copy from last", and Clear, so tagging is fast.
- A Country filter on the Campaigns and events agenda. Picking a country shows its events plus
  any tagged "global"; untagged events show only under "All countries" (an "(untagged)" option
  helps you find and fix them).
- A "Home country" per user (Users tab). If set, the agenda opens filtered to that country; if
  not set, it shows all. Countries also appear in the event tooltip and detail view.
- A starter list of countries and the BeNeLux, DACH and Nordics groups is seeded once so it
  works out of the box. Admins can edit the lists freely.

## [v3.19] - 2026-07-02 - Remove Email export

### Removed
- The "Email export..." button on the Data tab. With the shared folder handling exchange
  between people, the email path is no longer needed. Export and Load stay for manual files.

## [v3.18] - 2026-07-02 - Honest "updated by/on" tracking

### Fixed
- "Updated by/on" now stamps a row only when its content actually changes. Opening a budget
  line or campaign and clicking Save without editing anything no longer marks it as updated,
  and creating a new line no longer stamps it as updated (it only gets "created by/on").

### Changed
- One-time reset of the old "updated by/on" stamps left over from the June data cleanup, which
  had marked almost every row. The audit trail now starts clean and rebuilds from real edits.
  "Created by/on" and all budget content are untouched. After updating, publish to the shared
  folder so the team gets the cleaned trail.

## [v3.17] - 2026-07-02 - Auto-refresh from the shared folder

### Added
- A "Refresh" button in the header (shown once a shared folder is set). It checks the shared
  budget & events file, applies new and changed items automatically, and shows a short summary
  of what changed. No more confirm screen for the shared file.
- Auto-check on opening the app: if the browser already has access to the shared folder, the
  app pulls and applies updates on its own and shows the summary. If the browser needs to ask
  for access again (a new session), it stays quiet and you click Refresh once.

### Changed
- On the Data tab, "Pull budget & events" now applies changes automatically with a summary,
  instead of the review screen. A separate "Review & merge..." button keeps the old
  step-by-step screen for when you need to handle deletions by hand.
- Deletions are never applied automatically. Items only on your copy are kept, and the summary
  tells you how many, so nothing disappears without you choosing it.

## [v3.16] - 2026-07-02 - Shared folder sync (Teams / OneDrive)

### Added
- A "Shared folder" section on the Data tab. Point it once at a Teams or OneDrive synced
  folder and the app remembers it. Then:
  - Publish setup (admins only) writes the setup to a master file everyone pulls.
  - Pull setup loads that master and replaces your local setup. Budget and events are untouched.
  - Publish budget & events writes your budget and events to the shared file. It warns and
    stops if a colleague published since you last pulled, so nobody overwrites the other.
  - Pull budget & events loads the shared file through the normal review-and-merge screen.
- Works in Chrome and Edge when the app is served over https (for example GitHub Pages).
  Other browsers keep the manual Export and Load buttons.

## [v3.15] - 2026-07-01 - Timeline markers show the other dimension

### Changed
- On the Campaigns & events timeline, the marker label (next to the bar or diamond) now shows
  the "other" grouping dimension after the event name. Grouping by Cluster adds the entity
  (e.g. "Roadshow - Retail Bank"); grouping by Organising entity adds the cluster. Other
  groupings are unchanged. The left row label stays as the plain event name.

## [v3.14] - 2026-06-29 - Data tab and inactive users

### Changed
- Import, export and merge moved out of Settings into a new "Data" tab, so Budget owners (not
  just admins) can export, exchange and merge budget & events files and load a setup, without
  the Settings pin.

### Added
- Inactive users. On the Users tab you can Deactivate or Reactivate a user. An inactive user
  cannot log in and is not offered when assigning an owner, but their name is kept on their
  past budget lines and events, and the current owner still shows when editing an old record.

## [v3.13] - 2026-06-29 - Alphabetical lists, kind-driven type, richer linked lines

### Added
- Every dropdown now lists its options alphabetically (SVP, type, status, owner, global
  campaign, A&P category, entity, and so on).
- Settings: the Activity types table headers (Type, A&P category) are clickable to sort A to Z
  or Z to A, and the A&P categories heading toggles its sort the same way.
- New campaign / event form: choosing the Kind fills the activity type automatically. Event
  sets type "Event"; Campaign sets "Digital campaign" (or Lead generation if that is missing).
  Still editable.
- The timeline popup's linked budget lines now show the Cluster and Entity of each line.

## [v3.12] - 2026-06-29 - Created/updated tracking shown

### Added
- Budget lines and campaigns already record who created and last updated them and when. These
  are now visible: four columns (Created by, Created on, Updated by, Updated on) on the Budget
  table, hidden by default but available in the "Columns" menu; and a read-only line at the
  bottom of the campaign / event form showing the same. They are filled in automatically and
  cannot be edited. Existing items may show blanks until they are next edited.

### Removed
- The "Import / Re-import 2026 events" button on the Campaigns and events tab.

## [v3.11] - 2026-06-29 - Row actions menu on the Budget table

### Fixed
- The fixed-width actions column had clipped the Edit and Delete buttons (only Copy showed).
  Each budget line now has a single menu button that opens Edit, Copy, and Delete in a small
  popup, which fits the narrow column and is never clipped.

## [v3.10] - 2026-06-29 - Full-width Budget table, show/hide and resize columns

### Changed
- The app now uses the full browser width (removed the 1400px cap), so the wide Budget table
  and the reports have room to breathe.

### Added
- Budget tab: a "Columns" button to show or hide any column.
- Budget tab: drag the right edge of a column header to resize it, Excel-style.
- Both the chosen columns and their widths are remembered per browser.

## [v3.9] - 2026-06-29 - Editable user names

### Added
- On the Users tab, each user now has an "Edit name" button. Click it to change the name
  inline (Enter to save, Escape to cancel). Since an owner is just a reference to a user,
  renaming a user updates the owner shown on every budget line and event automatically.

## [v3.8] - 2026-06-29 - Drop dead fields

### Changed
- One-time cleanup on load: removes legacy and unused fields now that the data is normalized.
  On events: scope, weblink, the old free-text entity, owner and type. On budget lines: the old
  single eventId (eventIds is used now). Any real campaignLink is first moved into Content and
  assets so no link is lost, then the field is removed. Runs once, guarded by a flag.

## [v3.7] - 2026-06-29 - Split exports and a safe merge

### Added
- Split exports: "Export everything (backup)", "Export setup only" (entities, clusters, M1,
  types, SVPs, statuses, users, yearly budgets, codes), and "Export budget & events". The idea:
  the admin owns and shares the setup file; budget and events are exchanged and merged between
  people, which keeps IDs aligned and avoids structure clashes.
- Export metadata now records who exported it and the file kind (meta.exportedBy, exportKind)
  on top of the timestamp.
- One "Load a file" button that detects whether the file is a setup, a budget & events, or a
  full backup, and offers the right action.
- A proper budget & events merge with a review step: it lists new, updated, and missing items;
  adds new and updates changed (incoming wins) automatically; never deletes on its own, every
  missing item has a keep-or-delete tick; updates can be turned off in one click if the file is
  from an older structure; and it warns about items that reference an entity or owner you do
  not have.

### Changed
- Replaced the old insert-only Merge and Replace buttons with the above.

## [v3.6] - 2026-06-29 - Export timestamp

### Added
- Every JSON export now records the exact date and time it was created (meta.exportedAt), so
  when comparing or merging files it is clear which one is the most recent.

### Planned (not in this release)
- A proper merge with upsert (update existing items, not just add new ones) and a review step
  that lists adds, updates, and possible deletions with a keep-or-delete choice.

## [v3.5] - 2026-06-29 - Load a data file from the login screen

### Added
- The login screen now has a "Load a data file" link, so you can replace the data (for
  example to restore a backup or recover from a bad import) without having to log in first.
  It asks for confirmation, then reloads the login with the new users.

### Note
- If you are ever locked out, the master code 0610 also works as the password for any user.

## [v3.4] - 2026-06-24 - Cluster fix in Outcomes and fewer "Unspecified"

### Fixed
- The Outcomes tab now resolves cluster the same way as the timeline: the organising entity's
  cluster, falling back to the event's stored cluster. Its grouping and cluster filter now
  agree with each other and with the timeline.
- Events whose entity has no cluster were landing in "Unspecified" after v3.2. They now fall
  back to the event's own stored cluster, so most "Unspecified" items move to their real
  cluster. Anything still "Unspecified" has no cluster on either the entity or the event.

## [v3.3] - 2026-06-24 - Align stored event cluster to entity

### Changed
- One-time cleanup: each event's stored cluster is set to its organising entity's cluster, so
  exports and the stored data match what the app shows. Events deliberately placed in "Cloud",
  events without an entity, and events whose entity has no cluster are left as they are. Runs
  once, guarded by a flag.

## [v3.2] - 2026-06-24 - Fix cluster mismatch on the timeline

### Fixed
- On the Campaigns and events timeline, the cluster grouping in the overview used each event's
  stored cluster, while the cluster filter matched on the event's organising entity's cluster.
  When those had drifted apart, a cluster could show many events in the overview but few when
  filtered. Both now use the entity's cluster, so the overview and the filter always agree.

## [v3.1] - 2026-06-24 - Edit lock on Budget Structure

### Changed
- The Budget Structure tab is now read-only by default. Click "Edit budgets" to turn the
  amounts into editable fields (and reveal "Copy from previous year"), and "Done editing" to
  lock them again. This prevents accidental changes to the numbers.

## [v3.0] - 2026-06-24 - Budget editing moves to Budget Structure

### Changed
- The yearly budget amounts are now set in the Budget Structure tab, not in Settings. The
  org chart shows an editable amount per entity (for users who can edit budgets), and cluster,
  zone and grand totals update live as you type.
- "Copy from previous year" now lives in the Budget Structure tab, so you can roll a year's
  budget forward to set up the next one, then adjust the numbers in place.

### Removed
- The "Yearly budget per entity" section in Settings (replaced by the editable Budget
  Structure tab). Budget codes are still set in Settings > Entity structure.

## [v2.23] - 2026-06-24 - Cluster drill-down in Reporting

### Added
- The Reporting drill-down now works at the cluster level too. Pick a cluster (without an
  entity) to see its combined KPIs, monthly chart, and a per-entity breakdown table. Click any
  entity in that table to drill into its budget lines, with a "back to cluster" link to return.

## [v2.22] - 2026-06-24 - Default owner in the campaign form

### Changed
- In the new campaign / event form, choosing the organising entity now fills the Owner with
  that entity's default owner, the same as on a budget line. Still editable.

## [v2.21] - 2026-06-24 - Default owner per entity and smarter end date

### Added
- Entity structure now has a Default owner column (sortable, and on the Add entity form). When
  you pick an entity on a budget line, the Owner fills in with that entity's default owner,
  still editable.

### Changed
- In the new campaign / event form, choosing a start date now fills the end date with the same
  day if it was empty or earlier, and the end date can no longer be set before the start. Still
  editable for multi-day events and campaigns.

## [v2.20] - 2026-06-24 - Consistent budget badge on the timeline

### Fixed
- Single-day events (diamonds) used a faint trailing euro while multi-day bars used the new
  badge, so the timeline showed two different "has budget" markers. Both now use the same
  green euro badge.
- On short bars the badge was cramped. When a bar is too narrow to hold the name and badge,
  they now sit just to the right of the bar instead, so the badge stays clear.

## [v2.19] - 2026-06-24 - Clearer budget marker on the timeline

### Changed
- Campaigns and events that have an allocated budget now show a bold green euro badge at the
  start of their timeline bar, instead of the faint trailing euro sign. The legend matches.

## [v2.18] - 2026-06-24 - PO number in the campaign budget line

### Added
- The budget section of the campaign / event form now has a PO number field, matching the
  Budget line form. It is saved on the campaign's budget line.

## [v2.17] - 2026-06-24 - Budget Structure tab and separate Users tab

### Added
- New "Budget Structure" tab: a top-down org chart of the entity structure (M1 zone >
  cluster > entity) with each entity's yearly budget and rolled-up totals per cluster and
  zone, plus a year picker. Visible to roles that can view Budget or Reporting.

### Changed
- User management (users, roles, password resets, admin pin) moved out of Settings into a new
  "Users" tab, so Settings stays focused on budget and campaign structure. The Users tab is
  protected by the admin pin, like Settings.

## [v2.16] - 2026-06-24 - Sortable Entity structure and cluster autocomplete

### Added
- The Entity structure headings (M1, Cluster, Entity, Budget code) are now clickable to sort
  the table, clicking again reverses the direction. Sorting is for display only and does not
  change the stored order.
- The Cluster field, both when adding an entity and when editing one in the table,
  autocompletes from the clusters already in use.

## [v2.15] - 2026-06-24 - Budget code in the budget entity filter

### Changed
- The Entity filter at the top of the Budget tab now shows each entity's budget code in
  brackets, for the selected filter year. Only the Budget tab shows this; the shared filter on
  other tabs is unchanged. Changing the year filter refreshes the codes.

## [v2.14] - 2026-06-24 - Version on the login screen

### Added
- The version number now also shows on the login screen, next to the title, matching the
  app header.

## [v2.13] - 2026-06-24 - Filter boxes and no accidental close

### Added
- A type-to-filter box above the multi-selects: filter the linked campaigns in the budget
  line form, and filter the existing budget lines in the campaign form. Selected items stay
  selected even while filtered.

### Changed
- The budget line form and the campaign form no longer close when you click outside them.
  They stay open until you click Create/Save or Cancel, so a stray click no longer loses your
  work.

## [v2.12] - 2026-06-24 - Budget code in the entity dropdown

### Changed
- In the Budget line form, the Entity dropdown now shows the entity's budget code in brackets
  after the name, for example "France (OBI-D&D-BE-26)". The code shown is for the line's year.

## [v2.11] - 2026-06-24 - Budget code as last column

### Changed
- In the Entity structure table, swapped the last two columns so the order is now M1, Cluster,
  Entity, Budget code (budget code last).

## [v2.10] - 2026-06-24 - Entity structure with budget code

### Changed
- Renamed the Settings "Entities" section to "Entity structure".
- Reordered the entity table to M1 first and Entity (renamed from Name) last, with Cluster
  and Budget code in between.

### Added
- A per-year Budget code column in the Entity structure table, with a year picker. It edits
  the same budget code as the "Yearly budget per entity" section, so the two stay in sync,
  and the year picker is shared between them. The cluster shown is the same cluster field used
  for grouping in the yearly budget section.

## [v2.9] - 2026-06-24 - Per-user login passwords

### Added
- Login now asks for a password as well as a name. Each user has their own password, stored
  as a one-way salted hash (never in clear text), the same method used for the admin pin.
- New users start with the default password 1234 and are required to set their own at first
  login. Self-signup at the login screen sets a password right away.
- Settings > Users has a "Reset password" action that puts a user back to the 1234 default,
  so they set a new one next time they log in.
- The "Viewer" role is renamed "Campaigns viewer" to make its scope clear: it can only see
  the Campaigns and events tab (view only), nothing else. Assign it to anyone who should be
  limited to campaigns and events.

### Notes
- This is a soft, browser-side lock, like the admin pin: useful to keep people in their lane,
  but not real security. Real enforcement comes with the SharePoint and Entra (AD) move.
- The master code still works as a recovery login for any account.

## [v2.8] - 2026-06-24 - Cluster selector in the campaign budget section

### Added
- The budget section of the campaign / event form now has a Cluster selector next to the
  budget Entity. Picking a cluster filters the entity list, the same cascade used at the top
  of the form. Both default to the campaign's organising cluster and entity, and follow it
  when you change the organising entity, while staying editable so a budget line can sit in a
  different cluster or entity.

## [v2.7] - 2026-06-24 - Consistent naming and field inheritance

### Changed
- Renamed the "activity" concept to "budget line" everywhere in the interface (Budget,
  Import, Reporting, Settings). Code, data fields and the separate "activity type" are
  unchanged.
- Budget lines added from a campaign now inherit the campaign's entity, SVP and global
  campaign by default (still editable), so a line matches its campaign unless you change it.
- An event's cluster now comes from its organising entity (the same source budget lines
  use), so the two can no longer drift. Events without an entity keep a manually chosen
  cluster.
- README: removed the hard-coded version from the title (the version now lives only in
  `js/config.js` and the app header) and replaced the obsolete OneDrive publish steps with
  the current edit / commit / push workflow.

## [v2.6] - 2026-06-24 - Budget tab: copy line, clearer form, mandatory cluster

### Added
- Copy a budget line: a copy button on each budget row opens the New budget line form
  pre-filled with that row's data.

### Changed
- Renamed the budget line name field to "Expenditure or Activity".
- The "Linked campaigns / events" field now spans the full width of the form.
- Cluster is now required when saving a budget line.

## [v2.5] - 2026-06-22 - Hover details, Christina to Cloud, GitHub Pages prep

### Added
- Richer hover tooltip on the Campaigns and events timeline: name, kind, start/end dates,
  activity type, cluster, entity, owner and SVP (on bars, diamonds and labels).
- GitHub readiness: `.gitignore` that excludes data (`*.json`, `_backups/`), and a README
  section with steps to publish to https://github.com/gerritdenayer/my-apps via GitHub Pages.

### Changed
- One-time cleanup: events owned by Christina are moved into the "Cloud" cluster (guarded
  so it runs once).

## [v2.4] - 2026-06-22 - Cluster cleanup for imported events

### Changed
- One-time remap of the imported event cluster names onto the real clusters:
  BeNeLux -> Digital & Data; Europe, NWE and SSEE -> OB Europe. Global is unchanged.
  Applied to both events and any entity using those cluster names. Guarded by a flag so
  it runs once and won't overwrite a cluster you later name yourself.

## [v2.3] - 2026-06-22 - Unified location filter across all tabs

### Changed
- Budget, Campaigns and events, Reporting and Outcomes now use the exact same location
  filter: M1 zone > Cluster > Entity, with the same cascade and drill-down everywhere.
  Picking an M1 narrows the Cluster list; picking a Cluster narrows the Entity list;
  picking an Entity reflects its Cluster and M1. Built once as a shared helper in
  `js/state.js` (clusterList, entityListFor, entityMatchesScope, scopeFilterHtml,
  wireScopeFilter) so the four tabs cannot drift apart again.
- This replaces the old per-tab filters (Budget's lone Cluster, Reporting's lone M1,
  Outcomes' separate M1/Cluster/Entity, Timeline's lone Cluster), which read the value
  through slightly different paths and could disagree.
- Reporting's entity drill-down now uses the shared Entity filter (one entity control
  instead of two).
- Renamed the "Campaigns & Timeline" tab to "Campaigns and events".

## [v2.2] - 2026-06-22 - Remove JSONBin, local files only

### Changed
- Removed the JSONBin cloud sync (code and Settings section) by choice, to avoid the
  risk of data in a third-party store. The app stays on local browser storage plus the
  Export / Merge / Replace JSON files. Recommended team workflow: keep the JSON export in
  the OneDrive "Marketing Hub" folder and use Merge to combine teammates' files.

## [v2.1] - 2026-06-22 - Cloud sync via JSONBin (stopgap)

### Added
- A "Cloud sync (JSONBin)" section in Settings > Data management. Set a Bin ID and key,
  then Save to cloud / Load from cloud / Create new bin. Lets the team share one dataset
  online while SharePoint is being set up. The app keeps running on local browser storage
  and JSON export/import as before; cloud sync is optional and manual.
- The Bin ID and key are stored only in this browser (not inside the dataset, so they are
  never exported). Note: this is a convenience stopgap, not enterprise security.

## [v2.0] - 2026-06-22 - Data model normalization

Major change. A full backup of v1.9 is in `_backups/` (tar.gz) for rollback.

### Changed
- Campaigns now reference their organising entity and owner by ID (entityId, ownerId)
  instead of by name, matching how budget lines already work. This removes the main source
  of broken roll-ups when an entity or person is renamed.
- The legacy free-text "type" on campaigns is dropped; the activity type (by ID) is the
  single source, and its name is derived for display.
- On load, existing campaigns are migrated automatically: names are matched to entity and
  user IDs, the legacy type is matched to an activity type, and the old text fields are
  removed once matched. Unmatched values are kept as a fallback so nothing is lost.
- The campaign form's organising-entity and owner dropdowns now use IDs; reporting,
  outcomes, timeline grouping, detail view and search all resolve names from IDs.
- SharePoint migration script uses the event IDs (with name fallback).

### Notes
- The two-list shape (Campaigns = OB Marketing events, plus BudgetLines and reference
  lists) is unchanged. This release normalizes references, it does not redesign the model.
- Entity de-duplication helpers are retained as a safety net; entity names are still
  enforced unique on add.

## [v1.9] - 2026-06-18 - Budget row actions + timeline period view

### Changed
- Budget tab: the edit and delete icons are now the first column of each row.
- Campaigns & Timeline, when a Year/Quarter/Month filter is set:
  - shows every campaign or event ACTIVE in that period, even if it starts before or ends
    after it (overlap, not just start date);
  - zooms the timeline to the selected window (e.g. a quarter shows just its three months);
  - marks a bar's edge with a dashed border when it spans beyond the visible window;
  - lets a multi-day bar's title continue outside the bar when it does not fit inside.

## [v1.8] - 2026-06-18 - Unified entity hierarchy (Cluster)

### Changed
- "Group" is renamed to "Cluster" everywhere (Settings, Budget filter and form, Reporting,
  Outcomes), so the entities hierarchy reads M1 > Cluster > Entity and matches the term
  used on the campaign side.
- Campaign form now uses the entities hierarchy directly: Cluster comes first and filters
  the Organising entity dropdown; picking an entity sets its Cluster. The campaign keeps
  both an organising entity and a budget entity, and the budget entity defaults to the
  organising entity (still changeable).
- SharePoint schema/scripts: the Entities "Group" column is now "Cluster" (MHCluster).

## [v1.7] - 2026-06-18 - Editable activity type names

### Changed
- Activity type names can be edited inline in Settings (alongside the A&P category).

## [v1.6] - 2026-06-18 - Settings: batch "Save all"

### Changed
- Settings no longer auto-saves on each change. Edits are held in the form and committed
  together with a sticky "Save all changes" button. An "Unsaved changes" indicator shows
  the state, and the browser warns if you try to leave with unsaved edits. Per-row entity
  Save buttons are removed (edit inline, then Save all). The admin pin and the Data
  management actions (export/import/merge) still apply immediately.

## [v1.5] - 2026-06-18 - Remove duplicate website field

### Changed
- Removed the standalone "Website link" field from the campaign/event form. Links live in
  Content & assets only. Existing website links are migrated into Content (labeled
  "Website") on load, so nothing is lost. The detail view shows them under Content.

## [v1.4] - 2026-06-18 - Filters: SVP/Global split and date periods

### Changed
- Budget tab: the "SVP / Campaign" filter is now "SVP", with a separate "Global campaign"
  filter, matching the split in Settings. The SVP column header is renamed too.

### Added
- Year, Quarter, and Month filters on the Budget, Reporting, Outcomes, and Timeline tabs
  (Budget and Reporting/Outcomes already had Year; Quarter and Month are new everywhere,
  and Timeline gains all three). Shared `S.inPeriod` helper drives the date logic.

## [v1.3] - 2026-06-18 - Campaign form refinements

### Fixed
- The header version is now read from `js/config.js` (`appVersion`) instead of being
  hardcoded in the page, so it no longer goes stale. Bump it in one place.

### Changed
- The Campaigns & Timeline "+ New campaign" button is now just "New".
- In the campaign/event form, Organising entity, Cluster, and Owner are dropdowns
  (entities and users from settings; clusters from existing values). Free-typed legacy
  values stay available as options.
- Partners and Content & assets now sit above the Budget section in the form.
- The Budget section offers two modes: link existing budget line(s) via a multi-select,
  or create a new line from this campaign (which inserts a line carrying the campaign's
  Type, SVP, Global campaign, entity, status, and amounts into the Budget dataset).

## [v1.2] - 2026-06-18 - Data model upgrade (Phases 2 and 3)

### Added
- M1 zone on entities (hierarchy M1 > Group > Entity). Configurable M1 levels seeded with
  International Zone, Zone France, Business Line, SCM, Comms. M1 is a filter (with All) in
  both Reporting and Outcomes, and an extra group-by option in Outcomes.
- A&P categories (9 seeded), with each activity type mapped to one category. Budget lines
  inherit the category from their type and can override it per line. Settings has a bulk
  tool to set the A&P category on existing lines from their type.
- Campaign "Type" and budget "Activity type" are now one field. The campaign editor picks
  an activity type, and the linked budget line uses it.
- SVP and Global campaign are now two separate, configurable lists, each including None and
  All. Both appear on campaigns and budget lines.
- Every campaign must be linked to a budget line: the campaign editor now requires a Type
  and a budget entity, and creates/keeps the linked line.

### Changed
- Budget lines are now many-to-many with campaigns (`eventIds` instead of a single
  `eventId`). One line can cover several campaigns, or none (general spend). The Budget
  form's "Linked campaigns" field is multi-select. Shared lines use an even split when
  rolled up per campaign (campaign detail and Outcomes); entity/group/A&P totals use the
  full amount.

### Migration
- Existing data is upgraded on load: eventId becomes a one-item eventIds list; free-text
  campaign types are matched to activity types by name; M1/A&P/global fields are added;
  None and All are ensured in both SVP and Global campaign lists. Nothing is deleted.

## [v1.2] - 2026-06-18 - Roles and access (Phase 1)

### Added
- User roles: Admin, Budget owner, Marketing user, Viewer. Each user carries a role,
  set by an Admin in Settings. The header shows the current role.
- Tab access by role: Admin sees all; Budget owner all except Settings; Marketing user
  sees Budget (read-only), Campaigns, Reporting, Outcomes; Viewer sees Campaigns only,
  read-only. Budget add/edit/delete and campaign add/edit are hidden when not allowed.
- Settings is locked behind an admin pin. The pin is stored as a salted one-way hash in
  `js/config.js` (default 2468, changeable in Settings). The god code 0610 always opens
  Settings for any user, via the lock button in the header. (`js/auth.js`, `js/config.js`)
- Migration: existing users without a role become Admin so no one is locked out. New
  self-added users at login start as Viewer (the very first user becomes Admin).

### Note
- Roles and the pin are browser-side soft gating, not real security. Real enforcement
  comes with the SharePoint move. See `DATA-SCHEMA-sharepoint-lists.md`.

## [v1.1] - 2026-06-16 - Outcomes reporting + versioned header

### Added
- App version "v1.1" now shows in the header, plus a "Data updated: ..." timestamp that
  tracks the last change to the dataset (`data.meta.lastUpdated`, set on every save).
  (`index.html`, `js/state.js`, `js/app.js`)
- Campaign editor (Campaigns & Timeline) now captures outcomes: engagement, attendees,
  registrations, MQL, SQL (each with a target and an actual) and revenue (potential and
  actual). Added an SVP / Global campaign field to the campaign, which also flows to the
  linked budget line. Outcomes also show as a summary block in the campaign detail view.
  (`js/timeline.js`, shared metric list in `js/state.js`)
- New **Outcomes** tab (`js/outcomes.js`): a report combining results and budget. Group by
  Group, Entity, SVP, Month, or Quarter; filter by group, entity, SVP, kind, and year.
  Shows outcome totals (actual vs target), potential/actual revenue, forecast net and
  actual spend, plus efficiency: cost per MQL, cost per SQL, cost per attendee, and revenue
  ROI. Includes KPI cards, a revenue-vs-spend chart, and Excel export.

## [Unreleased] - 2026-06-16 - Campaign budget link from the timeline

### Added
- The campaign add/edit form (Campaigns & Timeline) now has a Budget section. Pick an
  organising entity, type, status, and forecast/actual amounts, and saving the campaign
  creates one linked budget line so the campaign appears in the Budget overview and in
  Reporting. Editing the campaign updates that same line (name and date stay in sync); it
  never creates duplicates. Each campaign tracks its line via `event.primaryActivityId`.
  Clearing the entity asks before removing the line. Additional lines can still be added
  from the campaign detail view. (`js/timeline.js`)

## [Unreleased] - 2026-06-16 - Group > Entity hierarchy

### Added
- Reporting matrix groups (e.g. Digital & Data, Cloud) are now collapsible. Each group
  header shows the group's monthly subtotals, budget, and variance, and folds open to the
  entity rows. Added an "Expand all / Collapse all" bar. Groups default to collapsed for a
  clean overview. (`js/reporting.js`)
- Settings yearly-budget editor is now grouped by entity group. Each group header shows the
  group's total budget (read-only, updates live as you type) and folds open to the per-entity
  budget code and amount inputs. Added "Expand all / Collapse all" and a grand-total row.
  Groups default to collapsed. (`js/settings.js`)
- Supporting styles for collapsible group headers, carets, and totals (`css/styles.css`).

## [Unreleased] - 2026-06-16 - Reporting yearly budget fix

### Fixed
- Reporting tab under-counted the yearly budget total. Budgets are stored per entity ID,
  but Reporting de-duplicates entities by name and only summed each canonical entity's
  budget. Any budget entered against a duplicate entity was dropped, so the Reporting
  total was lower than the sum shown in Settings. Added `budgetByCanonical()` in
  `js/reporting.js` to roll every entity's budget up onto its canonical entity. The KPI
  cards, matrix rows, entity drill-down, monthly budget line, and Excel export now all
  use the rolled-up figures, so Reporting matches Settings.

## [Unreleased] - 2026-06-16 - Campaigns & Timeline

Added a Campaigns & Timeline tab and linked campaigns to the budget. All changes are
additive. No existing data, features, or files were removed. A full backup of the app
as it was before these edits is in
`Marketing Dashboard/_backups/budget-app-backup-20260616-0647.zip`.

### Added
- New tab **Campaigns & Timeline** (`js/timeline.js`): a visual 2026 Gantt of campaigns
  and events. Multi-day items as bars, single-day as diamonds, "today" marker, group by
  cluster / entity / type / kind / owner, color picker, filters, and search.
- Click a campaign to see a detail view: details, partners (multiple, with co-funding),
  content and asset links, and a roll-up of all linked budget lines (forecast net,
  actual net, partner co-funding). Add or edit campaigns from here.
- One-time import of the 97 marketing events from the OB export (`js/seed-events.js`,
  loaded via the "Import 2026 events" button).
- Shared data model extended: `data.events` (campaigns) and `data.settings.partners`
  (partner master list). Back-filled on load for older data.

### Changed
- Budget activity form now has an optional **Linked campaign / event** field, so each
  cost ties to a campaign. The campaign detail rolls these up. (`js/budget.js`)
- Export / Import / Merge now also carry events and partners. (`js/api.js`)

### Notes
- Storage is unchanged (local storage today). Target is SharePoint Lists, see
  `Marketing Dashboard/SharePoint Lists Data Model.md`. The data layer is the only thing
  that swaps when the SharePoint backend is ready.
