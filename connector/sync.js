/**
 * VUELCA los chats reales de OnlyFans al dashboard, CON historial completo.
 * Lee la bandeja (conversaciones + nombres) y, por cada chat, abre la conversacion
 * para leer todos sus mensajes. Luego los envia al dashboard (sin duplicar).
 *
 * Uso:  node sync.js marta        (opcional 2o argumento: nº max de chats, ej: node sync.js marta 10)
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const account = (process.argv[2] || 'marta').toLowerCase();
const maxChats = parseInt(process.argv[3] || '15', 10);
const sessionFile = path.join(__dirname, 'sessions', `onlyfans-${account}.json`);
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'credentials.local.json'), 'utf8'))._config;
const stripHtml = (s) => (s || '').replace(/<[^>]+>/g, '').trim();

if (!fs.existsSync(sessionFile)) {
  console.error(`\n❌ No hay sesion de ${account}. Haz primero el login.`);
  process.exit(1);
}

(async () => {
  const browser = await chromium.launch({ headless: false, channel: 'msedge' });
  const context = await browser.newContext({ storageState: sessionFile });
  const page = await context.newPage();

  const chatsById = new Map();
  const usersById = new Map();
  let messagesCapture = null; // se rellena al abrir cada chat

  page.on('response', async (res) => {
    const url = res.url();
    if (!url.includes('/api2/v2/')) return;
    try {
      if (url.includes('/chats') && url.includes('/messages')) {
        messagesCapture = await res.json();
      } else if (url.includes('/chats') && res.request().method() === 'GET') {
        const j = await res.json();
        (j.list || []).forEach((c) => c.withUser && chatsById.set(c.withUser.id, c));
      } else if (url.includes('/users/list')) {
        const j = await res.json();
        Object.values(j).forEach((u) => u && u.id && usersById.set(u.id, u));
      }
    } catch {}
  });

  console.log(`\n📥 Leyendo bandeja de ${account.toUpperCase()}...`);
  await page.goto('https://onlyfans.com/my/chats', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);
  for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, 3000).catch(() => {}); await page.waitForTimeout(1200); }

  const ids = [...chatsById.keys()].slice(0, maxChats);
  console.log(`   ${chatsById.size} conversaciones. Leyendo historial de las ${ids.length} mas recientes...`);

  const conversations = [];
  for (const userId of ids) {
    const c = chatsById.get(userId);
    const u = usersById.get(userId) || {};
    messagesCapture = null;
    await page.goto(`https://onlyfans.com/my/chats/chat/${userId}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3500);

    let messages = [];
    if (messagesCapture && messagesCapture.list) {
      messages = messagesCapture.list
        .map((m) => ({
          extId: m.id,
          senderType: m.fromUser && m.fromUser.id === userId ? 'FAN' : 'MODEL',
          body: stripHtml(m.text),
          createdAt: m.createdAt,
        }))
        .filter((m) => m.body)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    const lm = c.lastMessage || {};
    conversations.push({
      ofUserId: userId,
      name: u.displayName || u.name || ('Fan ' + userId),
      username: u.username || ('u' + userId),
      avatarUrl: u.avatar || null,
      unreadCount: c.unreadMessagesCount || 0,
      lastMessageAt: lm.createdAt || null,
      messages,
    });
    process.stdout.write('.');
  }
  await browser.close();
  console.log('');

  const total = conversations.reduce((s, c) => s + c.messages.length, 0);
  console.log(`   ${conversations.length} conversaciones, ${total} mensajes. Enviando al dashboard...`);

  const resp = await fetch(`${cfg.apiUrl}/api/sync/onlyfans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-sync-key': cfg.syncKey },
    body: JSON.stringify({ model: account, conversations }),
  });
  const data = await resp.json().catch(() => ({}));
  if (resp.ok) {
    console.log(`\n✅ ¡Volcado con historial! ${data.synced} conversaciones de ${data.model} en el dashboard.`);
  } else {
    console.log(`\n❌ Error (${resp.status}): ${data.error || 'desconocido'}`);
  }
})();
