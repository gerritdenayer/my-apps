# Orange Band Setlist Manager

A small web app for the band to keep a shared song library, build setlists, rate songs, and see stats. Data lives in one JSONBin.io bin so everyone sees the same thing. The page is static, so it runs on GitHub Pages with no server.

## What's in this folder

- `index.html` - the whole app, one file.
- `band-setlist.json` - the starting data (111 songs + the SKO Praag setlist). This is the copy that was loaded into your bin. Keep it as a backup.
- `README.md` - this file.

## One-time setup before deploying

### 1. Create a scoped Access Key (do not use your Master Key)

The app runs in the browser, so whatever key is in the page is visible to anyone who has the page link. So we use a limited **Access Key** instead of your Master Key.

1. Log in to JSONBin.io.
2. Go to **API Keys** (under your profile).
3. Create an **Access Key**.
4. Give it **Read** and **Update** permission, and if JSONBin lets you, restrict it to just this one bin (id `6a39660eda38895dfeec9f11`).
5. Copy the key.

### 2. Paste the key into the app

Open `index.html`, find the `CONFIG` block near the top, and replace the placeholder:

```js
const CONFIG = {
  BIN_ID: "6a39660eda38895dfeec9f11",
  ACCESS_KEY: "PASTE_YOUR_ACCESS_KEY_HERE"   // <- put your Access Key here
};
```

Save the file.

> Note: your bin must allow this Access Key to read and write. If you kept the bin private, the Access Key (not the Master Key) is what the app uses.

### 3. Test it locally

Double-click `index.html` to open it in your browser. You should see the song library load. Try rating a song and adding a test song, then reload to confirm it saved.

## Deploy to GitHub Pages

1. Create a new GitHub repository (private is fine, but note: GitHub Pages on a private repo needs a paid plan; a public repo works on the free plan).
2. Put `index.html` (with your key pasted in) in the repo. You do not need to upload `band-setlist.json` since the data lives in the bin, but you can keep it as a backup.
3. In the repo, go to **Settings > Pages**, set the source to your main branch, root folder, and save.
4. After a minute you'll get a URL like `https://yourname.github.io/band-setlist/`.
5. Share that URL with the band.

## How the app works

- **Library tab** - all songs. Search, sort by any column, add, edit, or delete. Each row has a 1 to 5 star rating you can click, and a Spotify link. Songs a person added in the last 14 days show a green "new" badge (the original imported library is not flagged).
- **Setlists tab** - pick a setlist on the left, drag songs by the ☰ handle to reorder, remove songs, and rename, duplicate, or delete the whole setlist. Duplicate is how you make a variation for a different gig. To add a song, type in the filter box and click a match (filters on title or artist). The **Print** button opens a clean printable version of the setlist (numbered list with key, BPM, transpose, and total time) and sends it to your printer or save-as-PDF.

  Setlist edits are staged. While you change a setlist, an orange "unsaved" tag shows and your edits are kept in your browser (so a reload won't lose them). Click **Save changes** to push them to the shared list (jsonbin), or **Discard** to drop them and reload the saved version. Deleting a whole setlist saves right away. Library changes (adding or editing a song, star ratings) still save instantly.
- **Stats tab** - totals, top rated songs, and how many songs each vocalist sings.
- **Who are you?** (top right) - each person picks their name once; it's saved in their browser so their star ratings are stored under their name.

- **Header** - shows the app version (next to the logo), the date and time of the last save to jsonbin plus the revision number, and an **Export** button that downloads a timestamped backup copy of the whole dataset as a JSON file. The app version is set in the CONFIG area of `index.html` (`APP_VERSION`) and is bumped whenever the app changes.

## Spotify links

Every song has a Spotify link. 17 of the active songs have a verified direct track link (green "Spotify"). The rest show a grey "Search" link that opens a Spotify search for that song, since the lookup tool returned wrong versions (covers, karaoke) for those and a search is safer than a wrong track.

When you add or edit a song, there is a "Find on Spotify" button that opens a Spotify search in a new tab. Copy the exact track link from Spotify and paste it into the "Spotify link" field to upgrade it from a search to a direct link. If you leave the field blank, the app keeps a working search link automatically.

## Multi-user notes

Every change does a read-then-write: the app pulls the latest copy from the bin, applies your change, and saves it back. So if two people edit different things around the same time, both changes survive. If two people edit the very same field within a few seconds, the last save wins. For a band this is plenty.

## Safety reminders

- Never put your JSONBin **Master Key** in `index.html`. Only the scoped Access Key.
- The Master Key you shared earlier in chat should be rotated (deleted and recreated) in JSONBin.
- Keep a copy of `band-setlist.json` somewhere safe as a backup in case the bin gets messed up.

## Ideas for later

- Per-setlist key/transpose overrides (the data already has fields for this).
- Export a setlist to PDF or print view for gig night.
- Tags and filters (rock, party, slow) - the `tags` field is already there.
- A separate band switch for Orange Band vs B-side.
