#!/usr/bin/env python3
"""Raise the Marketing Hub dev build number before pushing dev.

Usage:  python3 tools/mh-dev-build.py            (5.2.0-dev.1 -> 5.2.0-dev.2)
        python3 tools/mh-dev-build.py 5.3.0      (start a new series: 5.3.0-dev.1)

It updates js/env.js (the number shown in the dev header) and the ?v= numbers in the dev
index.html, so browsers load the new dev files instead of old cached ones.
Production is not touched.
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEV = os.path.join(ROOT, "apps", "marketing-hub-dev")

def main():
    envp = os.path.join(DEV, "js", "env.js")
    env = open(envp, encoding="utf-8").read()
    m = re.search(r'build: "(\d+\.\d+\.\d+)-dev\.(\d+)"', env)
    if len(sys.argv) > 1:
        if not re.fullmatch(r"\d+\.\d+\.\d+", sys.argv[1]): sys.exit("Usage: python3 tools/mh-dev-build.py [5.3.0]")
        build = f"{sys.argv[1]}-dev.1"
    elif m:
        build = f"{m.group(1)}-dev.{int(m.group(2)) + 1}"
    else:
        sys.exit("No build number in js/env.js yet. Run: python3 tools/mh-dev-build.py 5.2.0")
    env = re.sub(r'build: "[^"]*"', f'build: "{build}"', env) if 'build: "' in env else env.replace('name: "dev"', f'name: "dev", build: "{build}"')
    open(envp, "w", encoding="utf-8").write(env)
    ip = os.path.join(DEV, "index.html")
    html = open(ip, encoding="utf-8").read()
    open(ip, "w", encoding="utf-8").write(re.sub(r'\?v=[0-9A-Za-z.\-]+"', f'?v={build}"', html))
    print(f"Dev build is now {build}.")

if __name__ == "__main__":
    main()
