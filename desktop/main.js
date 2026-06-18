const { app, BrowserWindow, session, ipcMain, shell } = require('electron');
const path = require('path');
const { BLOCK_PATTERNS } = require('./config');

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
      webviewTag: true, // necesario para incrustar OnlyFans
    },
  });

  mainWindow.removeMenu();
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
