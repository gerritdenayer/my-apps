// Which copy of the app this is. This is the ONLY file that differs between production
// (apps/marketing-hub) and dev (apps/marketing-hub-dev). A release copies everything else.
// build: the dev build number shown in the header ("5.2.0-dev.1"). tools/mh-dev-build.py raises
// it on every dev push; tools/mh-release.py starts a new series after each release.
window.MB_ENV = { name: "dev", build: "5.2.1-dev.2" };
