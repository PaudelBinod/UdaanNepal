/* Udaan Nepal - light / dark theme switch (dark is the default).
   Loaded first in <head> on every page so the right theme is set before anything is painted.
   The choice is remembered in this browser only (localStorage); if the browser blocks storage the page just
   stays dark. Put <span data-theme-slot></span> in a page header to place the button there; otherwise a small
   round button floats at the bottom-left corner. */
(function () {
  var KEY = 'un-theme', root = document.documentElement, current = 'dark';
  try { var s = localStorage.getItem(KEY); if (s === 'light' || s === 'dark') current = s; } catch (e) {}
  var page = (location.pathname.split('/').pop() || 'index').replace(/\.html$/i, '') || 'index';
  root.setAttribute('data-theme', current);
  root.setAttribute('data-page', page);

  var SUN = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  var buttons = [];

  function paint() {
    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      // the icon shows what you will switch TO
      b.innerHTML = current === 'dark' ? SUN : MOON;
      b.setAttribute('aria-label', current === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      b.setAttribute('title', current === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    }
  }
  function set(t) {
    if (t !== 'light' && t !== 'dark') return;
    current = t;
    root.setAttribute('data-theme', t);
    try { localStorage.setItem(KEY, t); } catch (e) {}
    paint();
    try { window.dispatchEvent(new CustomEvent('un-theme', { detail: t })); } catch (e) {}
  }
  function toggle() { set(current === 'dark' ? 'light' : 'dark'); }
  window.UNTheme = { get: function () { return current; }, set: set, toggle: toggle };

  function mount() {
    if (document.querySelector('.un-theme-btn')) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'un-theme-btn';
    b.addEventListener('click', toggle);
    var slot = document.querySelector('[data-theme-slot]');
    if (slot) { slot.appendChild(b); b.classList.add('in-slot'); }
    else { document.body.appendChild(b); }
    buttons.push(b); paint();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();

  // another tab changed the theme -> follow it
  window.addEventListener('storage', function (e) {
    if (e.key === KEY && (e.newValue === 'light' || e.newValue === 'dark') && e.newValue !== current) {
      current = e.newValue; root.setAttribute('data-theme', current); paint();
    }
  });
})();
