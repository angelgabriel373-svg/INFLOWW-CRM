// Vista CHATTER de OnlyFans en Ferdium: oculta dinero/estadisticas y bloquea esas paginas.
// (Incluye una barra de prueba para confirmar que el bloqueo se carga.)
(function () {
  var BLOCKED = /\/my\/(statistics|statements|payout|banking|earnings|payments|promotions)/i;

  // --- Barra de prueba: confirma que el bloqueo esta activo ---
  function banner() {
    if (document.getElementById('ofm-block-banner')) return;
    var b = document.createElement('div');
    b.id = 'ofm-block-banner';
    b.textContent = 'BLOQUEO OFM ACTIVO';
    b.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999999;background:#d11;color:#fff;font:bold 13px sans-serif;text-align:center;padding:4px;';
    if (document.body) document.body.appendChild(b);
  }

  function guard() {
    try {
      banner();
      if (BLOCKED.test(location.pathname)) { location.replace('/my/chats'); return; }
      document.querySelectorAll('a[href]').forEach(function (a) {
        var href = a.getAttribute('href') || '';
        if (BLOCKED.test(href)) { a.style.display = 'none'; a.setAttribute('tabindex', '-1'); }
      });
      // Oculta tambien por texto del menu (Estadisticas / Declaraciones), por si el href no coincide
      document.querySelectorAll('a, [role="link"], li, span, div').forEach(function (el) {
        if (el.children && el.children.length > 2) return;
        var t = (el.textContent || '').trim().toLowerCase();
        if (t === 'estadísticas' || t === 'estadisticas' || t === 'declaraciones' || t === 'statistics' || t === 'statements') {
          var row = el.closest('a, li, [role="link"]') || el;
          row.style.display = 'none';
        }
      });
    } catch (e) {}
  }

  document.addEventListener('DOMContentLoaded', guard);
  setInterval(guard, 1000);
  guard();
})();
