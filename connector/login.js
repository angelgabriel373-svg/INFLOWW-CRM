/**
 * PASO 1 del puente: capturar la sesion de OnlyFans de una modelo.
 *
 * Abre Edge, rellena email+contrasena. TU solo das a INICIAR SESION y, si pide,
 * metes el codigo del email. El script DETECTA solo cuando has entrado y guarda
 * la sesion (no hay que pulsar nada en la ventana negra).
 *
 * Uso:  node login.js marta     (o: node login.js mara)
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const account = (process.argv[2] || 'marta').toLowerCase();
const sessionsDir = path.join(__dirname, 'sessions');
const sessionFile = path.join(sessionsDir, `onlyfans-${account}.json`);

(async () => {
  fs.mkdirSync(sessionsDir, { recursive: true });
  console.log(`\n🔐 Abriendo OnlyFans para ${account.toUpperCase()}...`);

  // Usa el Edge instalado del sistema
  const browser = await chromium.launch({ headless: false, channel: 'msedge' });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://onlyfans.com', { waitUntil: 'domcontentloaded' });

  // Autorelleno de email + contrasena
  const credsFile = path.join(__dirname, 'credentials.local.json');
  if (fs.existsSync(credsFile)) {
    try {
      const creds = JSON.parse(fs.readFileSync(credsFile, 'utf8'))[account];
      if (creds) {
        await page.waitForTimeout(3000);
        await page.fill('input[name="email"], input[type="email"]', creds.email).catch(() => {});
        await page.fill('input[name="password"], input[type="password"]', creds.password).catch(() => {});
        console.log('✅ Email y contrasena rellenados.');
      }
    } catch {}
  }

  console.log('\n>>> En la ventana de Edge: dale a INICIAR SESION.');
  console.log('>>> Si pide un codigo, sacalo del Gmail de ' + account.toUpperCase() + ' y metelo.');
  console.log('>>> NO toques esta ventana: detecto solo cuando entres y guardo la sesion.\n');

  // Detecta el login esperando la cookie de sesion de OnlyFans (hasta 5 min)
  let ok = false;
  for (let i = 0; i < 100; i++) {
    const cookies = await context.cookies();
    if (cookies.some((c) => c.name === 'auth_id' && c.value)) { ok = true; break; }
    await page.waitForTimeout(3000);
  }

  if (ok) {
    await context.storageState({ path: sessionFile });
    console.log(`\n✅ ¡DENTRO! Sesion de ${account.toUpperCase()} guardada en ${sessionFile}`);
  } else {
    console.log('\n⚠️  No detecte el login en 5 minutos. Vuelve a intentarlo.');
  }
  await browser.close();
})();
