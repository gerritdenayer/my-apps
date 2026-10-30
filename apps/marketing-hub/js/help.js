// Online help: the "?" button in the header (or the ? key) opens a help window with topics on
// the left, a search box, and the text on the right. It opens on the topic for the tab you are on.
// KEEP THIS FILE IN STEP WITH THE APP: every change to what users see or do gets its help text
// updated here in the same release (see CLAUDE.md). "What's new" is read from CHANGELOG.md.
(function () {
  const S = window.MB_STATE;

  // Each topic: id, title, the tabs it belongs to (opens there by default), admin (shown with a tag),
  // and html. Keep sentences short and plain; buttons and labels in <b> exactly as they read in the app.
  const TOPICS = [
    { id: "start", title: "Getting started", tabs: [], html: `
      <p>Marketing Hub is where the team plans campaigns and events and tracks the marketing budget. It runs in your browser and shares its data through the <b>MarketingHub</b> folder in our Teams library, synced to your computer by OneDrive.</p>
      <p>Use <b>Chrome</b> or <b>Edge</b>. Safari and Firefox cannot open the shared folder.</p>
      <h4>First time on a computer</h4>
      <ol>
        <li>Make sure OneDrive syncs the MarketingHub folder to your computer.</li>
        <li>On the login screen, click <b>Connect to shared folder...</b>, pick the MarketingHub folder and allow access.</li>
        <li>Pick your name and type <b>1234</b>. The app then asks you to choose your own password.</li>
      </ol>
      <p>Your name is not in the list? Ask an admin to add you and publish the setup, then connect again.</p>
      <h4>The top bar</h4>
      <table class="help-table">
        <tr><td><b>Inbox N</b></td><td>Events proposed from emails, waiting for your review.</td></tr>
        <tr><td><b>Shared</b></td><td>You are connected to the shared folder. Click it to check for updates.</td></tr>
        <tr><td><b>No access</b>, <b>Folder not found</b>, <b>Local only</b></td><td>You are not on the shared data. Click the pill to fix it before you edit.</td></tr>
        <tr><td>Clock icon</td><td>Hover to see when your data and the shared files were last updated.</td></tr>
        <tr><td><b>Refresh</b></td><td>Loads the latest setup, budget and events from the shared folder.</td></tr>
        <tr><td><b>Switch user</b></td><td>Log out.</td></tr>
      </table>` },

    { id: "roles", title: "Roles and passwords", tabs: [], html: `
      <table class="help-table">
        <tr><th>Role</th><th>What you can do</th></tr>
        <tr><td>Admin</td><td>Everything, including users, publishing the setup and deleted items.</td></tr>
        <tr><td>Budget owner</td><td>Edit budget lines and events, Budget structure, Data &amp; sharing.</td></tr>
        <tr><td>Marketing user</td><td>Edit campaigns and events, view the budget, Reporting and Outcomes.</td></tr>
        <tr><td>Campaigns viewer</td><td>View Campaigns &amp; events only.</td></tr>
      </table>
      <p>Your password works on every computer: it is stored, scrambled, in the shared folder. Forgot it? An admin clicks <b>Reset password</b> in Settings &gt; Users &amp; access, and you log in with 1234 again.</p>
      <p>The lock icon in the top bar opens the admin parts of Settings for one session with the admin pin.</p>` },

    { id: "budget", title: "Budget", tabs: ["budget"], html: `
      <p>The Budget tab lists every budget line: one cost on one date for one entity. It opens on the current year and on your home cluster, if an admin set one.</p>
      <h4>Filters and columns</h4>
      <p>Pick the year, M1 zone, cluster and entity at the top, or type in Search. Click a column header to sort or filter that column, Excel-style (for example Quarter "is one of" Q1, Q2). <b>Columns</b> chooses which columns show and in what order.</p>
      <h4>Budget left</h4>
      <p>The card above the table shows the yearly budget, planned (forecast net), spent (actual net), left after planned and left after actual. Pick one entity to see its budget code; open <b>Per budget code</b> to see every code in your selection. Red means over budget. The card always covers the whole year: quarter, month and search do not change it.</p>
      <h4>Adding a line</h4>
      <p>Click <b>+ New budget line</b>, or click a row to edit. Name, date, cluster and entity are required. Net is always gross minus the partner part. Entering an actual amount moves a Planned line to Committed. Tick <b>Fully partner funded</b> when a partner pays the whole cost: the partner amounts then follow gross and net stays 0. Link the line to one or more campaigns or events so it shows up in Outcomes.</p>
      <p>When you are done, click <b>Publish changes</b> so the team sees it.</p>` },

    { id: "events", title: "Campaigns & events", tabs: ["timeline"], html: `
      <p>The agenda as a timeline: a bar per campaign or event, a diamond for single-day items, a green euro badge when it has a budget line.</p>
      <p>A <b>campaign</b> is an umbrella; an <b>event</b> has a date and usually a place, and can be part of a campaign.</p>
      <h4>View</h4>
      <p>Group rows by cluster, campaign, entity, type, kind or owner, and color the bars. Filter on kind, year, quarters, month, scope, country or search. Click a bar to open its card.</p>
      <h4>The form</h4>
      <table class="help-table">
        <tr><td><b>Details</b></td><td>Name, kind, start and end, owner, cluster, organising entity, SVP, part of campaign, campaign code, notes, countries.</td></tr>
        <tr><td><b>Partners &amp; content</b></td><td>Partners with role and co-funding, and links to decks, pages and recordings.</td></tr>
        <tr><td><b>Budget</b></td><td>Type, and the budget link: create a new line, link existing lines, or "No budget line (agenda only)". For a new line, tick <b>Fully partner funded</b> when a partner pays it all (net is 0).</td></tr>
        <tr><td><b>Outcomes</b></td><td>Targets and actuals: engagement, attendees, registrations, MQL, SQL, revenue.</td></tr>
      </table>
      <p>Deleting an item keeps its budget lines (they lose the link). An admin can restore it.</p>` },

    { id: "agenda", title: "Download agenda (PowerPoint)", tabs: ["timeline"], html: `
      <p><b>Download agenda</b> makes one roadmap slide in the Orange style from the current view. It uses the filters set on the page.</p>
      <p>In the pop-up you choose the title, the year, campaigns and/or events, what the lanes are (cluster, campaign, entity, type, kind, owner, SVP or one lane), the order of the lanes and of the items, and up to three details per item (dates, type, owner, entity, cluster, countries, campaign, partners), in the order you tick them. Legend and quarter labels can be switched off. Your choices are remembered; <b>Reset to defaults</b> clears them.</p>
      <p>When everything does not fit on one slide, you get as many slides as needed. Lanes are kept together on a slide; a lane too big for one slide continues on the next, marked "(cont.)". The pop-up tells you how many slides you will get, and each slide shows its number at the bottom.</p>
      <p>Amounts and notes never go on the slide. Fewer details per box means more items per slide.</p>` },

    { id: "reporting", title: "Reporting", tabs: ["reporting"], html: `
      <p>The budget by month. The matrix has a row per entity (grouped by M1 zone and cluster) and a column per month. Switch between gross, net and partner, and between forecast and actual. The entity view drills into one cluster or entity.</p>
      <p><b>Export to Excel</b> downloads the year as a workbook.</p>` },

    { id: "outcomes", title: "Outcomes", tabs: ["outcomes"], html: `
      <p>What campaigns and events delivered against what they cost. Results come from each item's Outcomes tab; spend comes from its linked budget lines (a line linked to several events is split equally).</p>
      <p>Group by M1 zone, cluster, entity, SVP, month or quarter. You see revenue against spend, attendees, registrations, MQL, SQL, engagement, revenue ROI and cost per MQL, SQL and attendee.</p>
      <p>Outcomes is only as good as what is filled in: enter actuals after each event and link the right budget lines.</p>` },

    { id: "sharing", title: "Publishing and updates", tabs: [], html: `
      <p>Your changes are saved in your browser at once, but colleagues only see them after you <b>publish</b>.</p>
      <ul>
        <li><b>Publish changes</b> (Budget or Campaigns &amp; events tab) merges your new, changed and deleted rows into the shared files and pulls in colleagues' changes. A colleague's row you did not touch is never removed.</li>
        <li>When the app opens, and when you click <b>Refresh</b> or <b>Check for updates</b>, it loads the shared data so you see what the team sees.</li>
        <li>If you have unpublished changes at that moment, it asks first: <b>Publish my changes</b> (usual), <b>Decide later</b>, or <b>Discard mine, load shared</b> (cannot be undone).</li>
        <li>When an admin publishes a new setup, a pop-up lists what changed. Click <b>Pull the new setup</b>. Your budget lines and events are not touched.</li>
      </ul>
      <p>Publish at the end of every working session, and use the same browser each time.</p>` },

    { id: "inbox", title: "Email inbox", tabs: [], html: `
      <p>Events announced by email can be turned into proposals without retyping. When proposals are waiting, an orange <b>Inbox N</b> button shows in the top bar.</p>
      <ul>
        <li><b>Review &amp; add</b> opens the event form already filled in. Check, complete and save: the event is added and published.</li>
        <li><b>Reject</b> drops the proposal.</li>
        <li><b>Mark as handled</b> clears a proposal marked "Already in Marketing Hub" (same start date and a similar name).</li>
      </ul>
      <p>Names the app could not match (an unknown entity or owner) are flagged. "No changes to publish" after accepting is normal: accepting publishes straight away.</p>` },

    { id: "settings", title: "Settings", tabs: ["settings", "budget-structure", "data", "users", "trash"], admin: true, html: `
      <table class="help-table">
        <tr><td><b>Entities &amp; clusters</b></td><td>Entities with their cluster, M1 zone, default owner, budget code per year and active years.</td></tr>
        <tr><td><b>Budget structure</b></td><td>M1 zone &gt; cluster &gt; entity with each yearly budget. Set the numbers or copy last year forward.</td></tr>
        <tr><td><b>SVPs, Countries, Activity types &amp; A&amp;P, Statuses</b></td><td>The lists used in budget lines and events.</td></tr>
        <tr><td><b>Users &amp; access</b></td><td>Add users, set role and home cluster, deactivate, reset a password to 1234. Also the admin pin.</td></tr>
        <tr><td><b>Data &amp; sharing</b></td><td>The shared folder, publish setup and budget &amp; events, file dates, backups and Excel exports, the second folder (bridge).</td></tr>
        <tr><td><b>Bulk import</b></td><td>Load budget lines from an Excel file: pick the sheet, map the columns, check, import.</td></tr>
        <tr><td><b>Deleted items</b></td><td>Restore deleted lines and events, or delete them for good.</td></tr>
      </table>
      <p>Setup changes are saved on your computer first. The bottom of the Settings menu shows when they are not published yet, with a <b>Publish setup</b> button.</p>
      <p><b>Adding a colleague:</b> add them in Users &amp; access, publish the setup, and tell them to connect to the shared folder and log in with 1234. When someone leaves, deactivate rather than delete.</p>` },

    { id: "faq", title: "Problems and questions", tabs: [], html: `
      <table class="help-table">
        <tr><td>A colleague does not see my change</td><td>Click <b>Publish changes</b>, then ask them to click <b>Refresh</b>.</td></tr>
        <tr><td>I see old data</td><td>Check the pill says <b>Shared</b>, then click <b>Refresh</b>. On <b>No access</b>, click it and allow access.</td></tr>
        <tr><td>Folder not found</td><td>OneDrive is not syncing or the folder moved. Check OneDrive, then reconnect in Settings &gt; Data &amp; sharing.</td></tr>
        <tr><td>Chrome says "Can't open this folder"</td><td>Pick the MarketingHub folder itself, not Documents or the OneDrive root.</td></tr>
        <tr><td>"A newer setup is available"</td><td>An admin changed the setup. The pop-up lists what. Click <b>Pull the new setup</b>.</td></tr>
        <tr><td>I deleted something by mistake</td><td>An admin restores it in Settings &gt; Deleted items.</td></tr>
        <tr><td>The agenda has many slides</td><td>Use fewer details per box, or filter on one cluster or quarter.</td></tr>
        <tr><td>I work on two computers</td><td>Publish on the first before you switch, then Refresh on the second.</td></tr>
      </table>` },

    { id: "new", title: "What's new", tabs: [], html: `<div id="help-news" class="muted">Loading...</div>` },
  ];

  const plain = (html) => html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&gt;/g, ">").replace(/\s+/g, " ").toLowerCase();

  function currentTab() {
    const t = document.querySelector("#app-header .tab.active");
    const panel = document.querySelector("#app-main .tab-panel.active");
    return (panel && panel.id.replace(/^tab-/, "")) || (t && t.dataset.tab) || "";
  }
  function topicForTab(tab) {
    const t = TOPICS.find((x) => x.tabs.includes(tab));
    return t ? t.id : "start";
  }

  // "What's new": the latest versions from CHANGELOG.md, shown as short lists.
  async function loadNews(host) {
    try {
      const res = await fetch("CHANGELOG.md", { cache: "no-store" });
      if (!res.ok) throw new Error(res.status);
      const md = await res.text();
      const blocks = md.split(/\n(?=## \[)/).filter((b) => b.startsWith("## [")).slice(0, 4);
      host.className = "";
      host.innerHTML = blocks.map((b) => {
        const lines = b.split("\n");
        const head = lines[0].replace(/^## /, "").replace(/\[|\]/g, "");
        const items = [];
        lines.slice(1).forEach((l) => {
          if (/^- /.test(l)) items.push(l.slice(2).trim());
          else if (/^\s{2,}\S/.test(l) && items.length) items[items.length - 1] += " " + l.trim();
        });
        return `<h4>${S.escapeHtml(head)}</h4><ul>${items.map((i) => `<li>${S.escapeHtml(i)}</li>`).join("")}</ul>`;
      }).join("") || '<p class="muted">No release notes found.</p>';
    } catch (e) {
      host.innerHTML = "Release notes are not available offline.";
    }
  }

  function open(topicId) {
    const ver = (window.MB_CONFIG && window.MB_CONFIG.appVersion) || "";
    const topics = TOPICS;
    const m = S.openModal(`
      <div class="help-head">
        <h2>Help</h2>
        <input id="help-q" type="search" placeholder="Search help..." autocomplete="off" />
        <button class="link" id="help-close" aria-label="Close help">&times;</button>
      </div>
      <div class="help-body">
        <nav class="help-nav" id="help-nav">${topics.map((t) =>
          `<a href="#" data-id="${t.id}">${S.escapeHtml(t.title)}${t.admin ? ' <span class="help-tag">admins</span>' : ""}</a>`).join("")}</nav>
        <div class="help-content" id="help-content"></div>
      </div>
      <div class="help-foot muted small">Marketing Hub v${S.escapeHtml(ver)} &middot; press ? anywhere to open help</div>`, { cls: "modal-help" });
    const nav = m.querySelector("#help-nav"), content = m.querySelector("#help-content"), q = m.querySelector("#help-q");
    const show = (id) => {
      const t = topics.find((x) => x.id === id) || topics[0];
      nav.querySelectorAll("a").forEach((a) => a.classList.toggle("active", a.dataset.id === t.id));
      content.innerHTML = `<h3>${S.escapeHtml(t.title)}</h3>${t.html}`;
      content.scrollTop = 0;
      if (t.id === "new") loadNews(content.querySelector("#help-news"));
    };
    nav.querySelectorAll("a").forEach((a) => a.onclick = (e) => { e.preventDefault(); show(a.dataset.id); });
    q.oninput = () => {
      const term = q.value.trim().toLowerCase();
      let first = null;
      nav.querySelectorAll("a").forEach((a) => {
        const t = topics.find((x) => x.id === a.dataset.id);
        const hit = !term || plain(t.title + " " + t.html).includes(term);
        a.classList.toggle("hidden", !hit);
        if (hit && !first) first = t.id;
      });
      if (first) show(first);
      else content.innerHTML = `<p class="muted">Nothing found for "${S.escapeHtml(q.value)}".</p>`;
    };
    m.querySelector("#help-close").onclick = S.closeModal;
    show(topicId || topicForTab(currentTab()));
    q.focus();
  }

  function init() {
    const btn = document.getElementById("help-btn");
    if (btn) btn.onclick = () => open();
    document.addEventListener("keydown", (e) => {
      if (e.key !== "?" || e.ctrlKey || e.metaKey || e.altKey) return;
      const el = document.activeElement;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      if (document.querySelector("#modal-root .modal")) return;
      if (document.getElementById("app-header").classList.contains("hidden")) return;
      e.preventDefault(); open();
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();

  window.MB_HELP = { open, topics: TOPICS };
})();
