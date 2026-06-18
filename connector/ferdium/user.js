// Vista CHATTER de OnlyFans en Ferdium: bloquea las paginas de dinero/estadisticas.
// Si el chatter intenta entrar (o navegar por la SPA), lo devuelve a los chats,
// y va ocultando del menu los enlaces de dinero.
(function () {
  var BLOCKED = /\/my\/(statistics|statements|payout|banking|earnings|payments|promotions)/i;

  function guard() {
    try {
      if (BLOCKED.test(location.pathname)) {
        location.replace('/my/chats');
        return;
      }
      document.querySelectorAll('a[href]').forEach(function (a) {
        var href = a.getAttribute('href') || '';
        if (BLOCKED.test(href)) {
          a.style.display = 'none';
          a.setAttribute('tabindex', '-1');
        }
      });
    } catch (e) {}
  }

  document.addEventListener('DOMContentLoaded', guard);
  setInterval(guard, 1000);
  guard();
})();
