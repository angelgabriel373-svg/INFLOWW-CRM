/**
 * PASO 2 del puente (PRUEBA): leer las conversaciones reales de OnlyFans.
 *
 * Usa la sesion guardada en el paso 1. Abre la pagina de chats de OnlyFans y
 * "escucha" las propias peticiones que hace OnlyFans (asi no hay que falsificar
 * nada: usamos las peticiones firmadas que la web hace por si misma).
 *
 * Si esto imprime tus conversaciones reales -> el puente FUNCIONA y el siguiente
 * paso es volcarlas al dashboard del CRM.
 *
 * Uso:  node read-chats.js marta
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const account = (process.argv[2] || 'marta').toLowerCase();
const sessionFile = path.join(__dirname, 'sessions', `onlyfans-${account}.json`);

if (!fs.existsSync(sessionFile)) {
  console.error(`\n❌ No encuentro la sesion de ${account}. Ejecuta primero:  node login.js ${account}`);
  process.exit(1);
}

(async () => {
  // Usa el Edge instalado del sistema (el chromium descargado lo bloquea el antivirus)
  const browser = await chromium.launch({ headless: false, channel: 'msedge' });
  const context = await browser.newContext({ storageState: sessionFile });
  const page = await context.newPage();

  let chatsPayload = null;

  // Escuchamos las respuestas que OnlyFans hace al cargar la bandeja
  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('/api2/v2/chats') && res.request().method() === 'GET') {
      try { chatsPayload = await res.json(); } catch {}
    }
  });

  console.log(`\n📥 Abriendo bandeja de OnlyFans de ${account.toUpperCase()}...`);
  await page.goto('https://onlyfans.com/my/chats', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(8000); // dar tiempo a que cargue la lista

  if (!chatsPayload || !chatsPayload.list) {
    console.log('\n⚠️  No he podido capturar la lista todavia. Posibles causas:');
    console.log('   - La sesion caduco (repite: node login.js ' + account + ')');
    console.log('   - OnlyFans pidio verificacion. Mira la ventana del navegador.');
  } else {
    const chats = chatsPayload.list;
    console.log(`\n✅ ¡FUNCIONA! ${chats.length} conversaciones reales leidas de OnlyFans:\n`);
    chats.forEach((c, i) => {
      const fan = c.withUser || {};
      const last = c.lastMessage || {};
      console.log(`  ${i + 1}. ${fan.name || fan.username || '?'} (@${fan.username || '?'})`);
      console.log(`     ultimo: ${(last.text || '').replace(/<[^>]+>/g, '').slice(0, 60)}`);
    });
    console.log('\n>>> Siguiente paso: volcar esto al dashboard del CRM automaticamente.');
  }

  await browser.close();
})();
