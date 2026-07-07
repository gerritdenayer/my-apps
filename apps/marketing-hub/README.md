# Marketing Hub

The current version is shown in the app header and set in `js/config.js`.

Small HTML/JS web app for planning campaigns and forecasting, tracking, and reporting marketing spend and outcomes.
**Local-only:** every user keeps their own dataset in their browser. No external service. No accounts. Export to a JSON file when you want to back up or share with a teammate.

## Getting started

1. Open `index.html` in a browser (Chrome, Edge, Safari, or Firefox).
2. On the login screen, pick "+ Add new user..." the first time to enter your name.
3. Use the Budget, Campaigns & Timeline, Reporting, Outcomes and Settings tabs to plan, register and review spend and results.
4. Everything saves automatically to this browser's local storage.

## Sharing data between users

Each person has their own local dataset. To move data around:

- **Export** (Settings → Data management → Export to JSON file)
  Downloads `marketing-budget-YYYY-MM-DD.json` with the full current dataset.
- **Merge** (Settings → Data management → Merge JSON file)
  Pick a JSON file. Activities, entities, SVPs, types, statuses, users, yearly budgets and budget codes from that file are added to your dataset.
  - Lookups (entities, SVPs, types, statuses, users) are matched by name, so duplicates are not created.
  - Activities are matched by ID; existing IDs are skipped.
  - Yearly budgets and budget codes are added only when the local data has no value yet for that year/entity.
- **Replace** (Settings → Data management → Replace with JSON file)
  Wipes your current dataset and loads the file as-is. Use this when restoring a backup.
- **Clear all local data** wipes everything in this browser. Always export first.

Tip: keep your exports next to `index.html` so the JSON file lives alongside the app.

## Tabs

- **Budget:** all budget lines. Filter by year, group, entity, SVP, type, status, owner, or free text search. Sort by any column. Add / edit / copy / delete budget lines.
- **Campaigns & Timeline:** a visual Gantt of campaigns and events. Add or edit a campaign, link it to the budget (pick an organising entity to create a linked budget line), record partners and content, and capture outcomes (engagement, attendees, registrations, MQL, SQL, revenue).
- **Reporting:** monthly matrix per entity with forecast and actual side by side, with yearly budget and variance. Groups are collapsible. Entity drill-down with chart. Export to Excel.
- **Outcomes:** results combined with budget. Group by Group, Entity, SVP, Month or Quarter; filter by group, entity, SVP, kind and year. Shows outcome totals (actual vs target), revenue, spend, and efficiency (cost per MQL/SQL/attendee, revenue ROI). KPI cards, chart, Excel export.
- **Settings:** manage entities and groups (with collapsible per-group budgets), SVPs, activity types, statuses, users, yearly budgets and budget codes, plus the Data management section described above. Bulk import from any Excel file is also here.

## File map

- `index.html` - app shell, tabs, login screen
- `css/styles.css` - all styling
- `js/api.js` - local storage backend, plus export/import/merge helpers
- `js/state.js` - shared state, formatters, modal helpers
- `js/budget.js` - Budget tab
- `js/timeline.js` - Campaigns & Timeline tab (Gantt, campaign editor with budget + outcomes)
- `js/reporting.js` - Reporting tab + Excel export
- `js/outcomes.js` - Outcomes tab (results + budget, efficiency) + Excel export
- `js/settings.js` - Settings tab
- `js/import.js` - generic Excel importer
- `js/app.js` - bootstrap, login, tab routing

## Share with the team via GitHub Pages

The app is static files, so it can be hosted on GitHub Pages and shared with the team by a
link. Your data is NOT hosted: each person's dataset lives only in their own browser, and is
shared by emailing JSON exports (Settings > Data management > Export / Merge).

Privacy and the `.gitignore`: the included `.gitignore` excludes `*.json` and `_backups/`,
so your data can never be committed by accident. Only the code goes to GitHub.

Caveat: a Pages site and its code are readable by anyone with the link, including the
hashed admin pin and the master code. On a public Pages site the pin/role lock is
effectively cosmetic. That is fine here because the data stays local; just do not treat the
pin as real security. Real enforcement comes with the SharePoint move.

### Update and publish

The app lives in the repo at `apps/marketing-hub`. To publish a change, edit the files
there, then from the repo root run:

```
cd ~/my-apps
git add -A
git commit -m "Update Marketing Hub"
git push
```

If GitHub Pages is on for the repo (Settings > Pages > Build and deployment > Source:
"Deploy from a branch", Branch: `main`, folder `/ (root)`), the app updates about a minute
later at:

```
https://gerritdenayer.github.io/my-apps/apps/marketing-hub/
```

Note: the repo is private. GitHub Pages from a private repo needs a paid GitHub plan; on the
free plan the repo would have to be public for Pages to serve it. Either way your data stays
private, since it never leaves the browser.

## Notes

- Local storage is per-browser and per-address. Opening the app from a file on disk and
  from the Pages link are two separate datasets; move data between them with Export/Import.
- Local storage is per-browser. If you use Chrome at home and Edge at work, those are two separate datasets.
- Clearing browser data (cookies + site data) will wipe the app's data. Export regularly.
- The IT spec for moving to enterprise SharePoint storage is in `IT-SPEC-multi-tenant-SharePoint.md` if you decide to go that route later.
