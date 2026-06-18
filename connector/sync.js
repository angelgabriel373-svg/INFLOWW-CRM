/**
 * VUELCA los chats reales de OnlyFans al dashboard del CRM.
 * Lee la bandeja (conversaciones + nombres de fans + ultimo mensaje) usando la
 * sesion guardada y los envia al endpoint /api/sync/onlyfans del dashboard.
 *
 * Uso:  node sync.js marta
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const account = (process.argv[2] || 'marta').toLowerCase();
const sessionFile = path.join(__dirname, 'sessions', `onlyfans-${account}.json`);
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'credentials.local.json'), 'utf8'))._config;

const stripHtml = (s) => (s || '').replace(/<[^>]+>/g, '').trim();

if (!fs.existsSync(sessionFile)) {
  console.error(`\n❌ No hay sesion de ${account}. Ejecuta primero el login.`);
  process.exit(1);
}

(async () => {
  const browser = await chromium.launch({ headless: false, channel: 'msedge' });
  const context = await browser.newContext({ storageState: sessionFile });
  const page = await context.newPage();

  const chatsById = new Map();   // userId -> chat
  const usersById = new Map();   // userId -> datos del usuario

  page.on('response', async (res) => {
    const url = res.url();
    if (!url.includes('/api2/v2/')) return;
    try {
      if (url.includes('/chats') && res.request().method() === 'GET') {
        const j = await res.json();
        (j.list || []).forEach((c) => c.withUser && chatsById.set(c.withUser.id, c));
      } else if (url.includes('/users/list')) {
        const j = await res.json();
        Object.values(j).forEach((u) => u && u.id && usersById.set(u.id, u));
      }
    } catch {}
  });

  console.log(`\n📥 Leyendo bandeja real de ${account.toUpperCase()}...`);
  await page.goto('https://onlyfans.com/my/chats', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);
  // Scroll para cargar mas conversaciones
  for (let i = 0; i < 5; i++) {
    await page.mouse.wheel(0, 3000).catch(() => {});
    await page.waitForTimeout(1500);
  }

  const conversations = [];
  for (const [userId, c] of chatsById) {
    const u = usersById.get(userId) || {};
    const lm = c.lastMessage || {};
    conversations.push({
      ofUserId: userId,
      name: u.displayName || u.name || ('Fan ' + userId),
      username: u.username || ('u' + userId),
      avatarUrl: u.avatar || null,
      unreadCount: c.unreadMessagesCount || 0,
      lastMessageText: stripHtml(lm.text),
      lastMessageAt: lm.createdAt || null,
      lastFromFan: lm.fromUser ? lm.fromUser.id === userId : true,
    });
  }
  await browser.close();

  console.log(`   ${conversations.length} conversaciones leidas. Enviando al dashboard...`);

  const resp = await fetch(`${cfg.apiUrl}/api/sync/onlyfans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-sync-key': cfg.syncKey },
    body: JSON.stringify({ model: account, conversations }),
  });
  const data = await resp.json().catch(() => ({}));
  if (resp.ok) {
    console.log(`\n✅ ¡Volcado! ${data.synced} conversaciones de ${data.model} estan ya en el dashboard.`);
    console.log(`   Abre ${cfg.apiUrl} y entra en Chat para verlas.`);
  } else {
    console.log(`\n❌ Error del dashboard (${resp.status}): ${data.error || 'desconocido'}`);
    if (resp.status === 401) console.log('   -> Falta poner SYNC_API_KEY en Render (mismo valor que en credentials.local.json).');
  }
})();
