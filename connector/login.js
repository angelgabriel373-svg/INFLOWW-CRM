/**
 * PASO 1 del puente: capturar la sesion de OnlyFans de una modelo.
 *
 * Abre un navegador real. TU inicias sesion a mano (yo nunca veo la contrasena).
 * Cuando estas dentro, guarda la sesion en sessions/onlyfans-<cuenta>.json
 * para que el puente pueda leer/escribir despues sin volver a pedir login.
 *
 * Uso:  node login.js marta     (o: node login.js mara)
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

const account = (process.argv[2] || 'marta').toLowerCase();
const sessionsDir = path.join(__dirname, 'sessions');
const sessionFile = path.join(sessionsDir, `onlyfans-${account}.json`);

function waitForEnter(msg) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(msg, () => { rl.close(); resolve(); });
  });
}

(async () => {
  fs.mkdirSync(sessionsDir, { recursive: true });
  console.log(`\n🔐 Capturando sesion de OnlyFans para la cuenta: ${account.toUpperCase()}`);
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://onlyfans.com', { waitUntil: 'domcontentloaded' });

  console.log('\n>>> Se ha abierto una ventana de OnlyFans.');
  console.log('>>> Inicia sesion ahi con la cuenta de ' + account.toUpperCase() + ' (yo no veo nada).');
  console.log('>>> Cuando veas tu feed/perfil ya dentro, vuelve a ESTA ventana negra y pulsa ENTER.\n');
  await waitForEnter('   Pulsa ENTER cuando estes dentro de OnlyFans... ');

  await context.storageState({ path: sessionFile });
  console.log(`\n✅ Sesion guardada: ${sessionFile}`);
  console.log('   Ya puedes cerrar esto. Siguiente paso: node read-chats.js ' + account);
  await browser.close();
})();
