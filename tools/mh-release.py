#!/usr/bin/env python3
"""Release Marketing Hub: copy the dev copy over production in one step.

Usage:  python3 tools/mh-release.py 5.1.18 "Short title of the release"

What it does:
  1. Sets the version in dev (js/config.js, the ?v= numbers in index.html) and turns
     "## [Unreleased]" in CHANGELOG.md into "## [v<version>] - <today> - <title>".
  2. Copies every file from apps/marketing-hub-dev to apps/marketing-hub, except js/env.js
     (which says dev or prod), CLAUDE.md and .DS_Store.
  3. Lists files that exist in production but not in dev (it never deletes anything).
After that, check with "git status" and commit both folders together.
"""
import datetime, os, re, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEV = os.path.join(ROOT, "apps", "marketing-hub-dev")
PROD = os.path.join(ROOT, "apps", "marketing-hub")
SKIP = {os.path.join("js", "env.js"), "CLAUDE.md", ".DS_Store"}

def edit(path, fn):
    with open(path, encoding="utf-8") as f: s = f.read()
    t = fn(s)
    with open(path, "w", encoding="utf-8") as f: f.write(t)
    return s != t

def main():
    if len(sys.argv) < 3 or not re.fullmatch(r"\d+\.\d+\.\d+", sys.argv[1]):
        sys.exit('Usage: python3 tools/mh-release.py 5.1.18 "Short title"')
    ver, title = sys.argv[1], sys.argv[2]
    today = datetime.date.today().isoformat()
    cl = os.path.join(DEV, "CHANGELOG.md")
    if "## [Unreleased]" not in open(cl, encoding="utf-8").read():
        sys.exit("Nothing to release: CHANGELOG.md in dev has no [Unreleased] section.")
    edit(os.path.join(DEV, "js", "config.js"), lambda s: re.sub(r'appVersion: "[^"]*"', f'appVersion: "{ver}"', s))
    edit(os.path.join(DEV, "index.html"), lambda s: re.sub(r'\?v=[0-9A-Za-z.\-]+"', f'?v={ver}"', s))
    edit(cl, lambda s: s.replace("## [Unreleased]", f"## [v{ver}] - {today} - {title}", 1))

    copied = 0
    for base, dirs, files in os.walk(DEV):
        dirs[:] = [d for d in dirs if not d.startswith(".")]
        for fn in files:
            rel = os.path.relpath(os.path.join(base, fn), DEV)
            if rel in SKIP or fn in SKIP: continue
            dst = os.path.join(PROD, rel)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(os.path.join(base, fn), dst)
            copied += 1
    extra = []
    for base, dirs, files in os.walk(PROD):
        dirs[:] = [d for d in dirs if not d.startswith(".")]
        for fn in files:
            rel = os.path.relpath(os.path.join(base, fn), PROD)
            if rel in SKIP or fn in SKIP: continue
            if not os.path.exists(os.path.join(DEV, rel)): extra.append(rel)
    print(f"Released v{ver}: {copied} files copied from dev to production.")
    if extra:
        print("Files in production that are no longer in dev (not deleted, check them):")
        for e in extra: print("  - " + e)

if __name__ == "__main__":
    main()
