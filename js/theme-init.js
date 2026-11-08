// Applies the saved theme before the page draws, so it never flashes the wrong colors.
// Loaded as a plain script (not a module) at the top of index.html.
(function () {
  var theme = 'system';
  try {
    theme = localStorage.getItem('act-prep-theme') || 'system';
  } catch (e) {
    /* storage unavailable: follow the system */
  }
  if (theme === 'light' || theme === 'dark') {
    document.documentElement.setAttribute('data-theme', theme);
    var color = theme === 'dark' ? '#111215' : '#f5f4f0';
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) metas[i].setAttribute('content', color);
  }
})();
