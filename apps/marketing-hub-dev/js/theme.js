// Light / dark mode. Loaded in <head>, before the page paints, so there is no white flash.
// The choice is kept per browser ("light", "dark" or "system" = follow the computer). It uses the
// original localStorage methods so the dev copy and production share the same choice.
(function () {
  const KEY = "mb_theme";
  const _get = Storage.prototype.getItem, _set = Storage.prototype.setItem;
  const mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function get() { try { return _get.call(localStorage, KEY) || "light"; } catch (e) { return "light"; } }
  function isDark() { const p = get(); return p === "dark" || (p === "system" && !!(mq && mq.matches)); }
  function chartColors() {
    if (!window.Chart || !window.Chart.defaults) return;
    const d = isDark();
    window.Chart.defaults.color = d ? "#c9ced6" : "#666";
    window.Chart.defaults.borderColor = d ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)";
  }
  function apply() {
    document.documentElement.setAttribute("data-theme", isDark() ? "dark" : "light");
    chartColors();
  }
  function set(p) {
    try { _set.call(localStorage, KEY, p); } catch (e) {}
    apply();
    window.dispatchEvent(new CustomEvent("mb-theme", { detail: isDark() ? "dark" : "light" }));
  }
  if (mq && mq.addEventListener) mq.addEventListener("change", () => { if (get() === "system") set("system"); });
  apply();
  window.addEventListener("DOMContentLoaded", chartColors);
  window.MB_THEME = { get, set, isDark, chartColors };
})();
