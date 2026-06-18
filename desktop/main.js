const { app, BrowserWindow, session, ipcMain, shell } = require('electron');
const path = require('path');
const { BLOCK_PATTERNS, API_URL } = require('./config');

let mainWindow = null;
const registeredPartitions = new Set();
const chatterPartitions = new Set();

// Aplica el bloqueo de dinero a la sesion de una modelo (solo para chatters).
// El rol se lee de forma dinamica (chatterPartitions), no se cachea: asi un
// re-login no puede dejar el bloqueo "pegado" al rol anterior.
function setupBlocking(partition, isChatter) {
  if (isChatter) chatterPartitions.add(partition);
  else chatterPartitions.delete(partition);

  if (registeredPartitions.has(partition)) return;
  registeredPartitions.add(partition);

  const ses = session.fromPartition(partition);
  ses.webRequest.onBeforeRequest({ urls: ['*://*.onlyfans.com/*'] }, (details, callback) => {
    if (chatterPartitions.has(partition) && BLOCK_PATTERNS.some((p) => details.url.includes(p))) {
      return callback({ cancel: true });
    }
    callback({ cancel: false });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: '#0b0e14',
    title: 'OFM Panel',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // permite que el preload haga require('./config'); el renderer sigue sin Node
      webviewTag: true, // necesario para incrustar OnlyFans
    },
  });

  mainWindow.removeMenu();
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Diagnostico: muestra errores del preload y de la pantalla en los registros.
  mainWindow.webContents.on('preload-error', (_e, p, err) => console.log('PRELOAD-ERROR:', p, err && err.message));
  mainWindow.webContents.on('console-message', (_e, _lvl, message, line, source) =>
    console.log('RENDERER:', message, '(', source, ':', line, ')'));

  // Los enlaces externos (target=_blank) se abren en el navegador del sistema, no en ventanas sueltas.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });
}

// El renderer registra cada modelo ANTES de crear su webview, para activar el bloqueo.
ipcMain.handle('register-model', (_evt, { partition, isChatter }) => {
  setupBlocking(partition, !!isChatter);
  return true;
});

// Llamadas a la API desde el proceso principal (usa la pila de red de Electron;
// sin CORS ni CSP). Timeout amplio porque el servidor gratis puede tardar en
// "despertar" (~50s la primera vez).
const { net } = require('electron');

async function apiFetch(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 70000);
  try {
    const res = await net.fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

ipcMain.handle('api-login', async (_evt, { identifier, password }) => {
  console.log('api-login: intentando...');
  try {
    const res = await apiFetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json().catch(() => ({}));
    console.log('api-login: respuesta', res.status);
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    console.log('api-login: ERROR', e && e.message);
    return { ok: false, status: 0, data: { error: 'Sin conexion con el servidor. ' + (e.message || '') } };
  }
});

ipcMain.handle('api-models', async (_evt, token) => {
  try {
    const res = await apiFetch(`${API_URL}/api/models`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json().catch(() => []);
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    console.log('api-models: ERROR', e && e.message);
    return { ok: false, status: 0, data: [] };
  }
});

// Endurece cada webview (contenido de terceros): popups al navegador del sistema
// y navegacion restringida a onlyfans.com.
app.on('web-contents-created', (_e, contents) => {
  if (contents.getType() !== 'webview') return;
  contents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });
  contents.on('will-navigate', (evt, url) => {
    if (!/^https:\/\/([a-z0-9-]+\.)?onlyfans\.com/i.test(url)) evt.preventDefault();
  });
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Guarda en disco las cookies/sesiones de OnlyFans para que NO se pierdan al
// cerrar (asi Marta/Mara siguen logueadas la proxima vez, como en Ferdium).
function flushSessions() {
  for (const p of registeredPartitions) {
    try { session.fromPartition(p).cookies.flushStore(); } catch (e) {}
  }
}
setInterval(flushSessions, 8000);     // cada 8s mientras esta abierta
app.on('before-quit', flushSessions); // y al cerrar

app.on('window-all-closed', () => {
  flushSessions();
  if (process.platform !== 'darwin') app.quit();
});
