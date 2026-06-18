const { contextBridge, ipcRenderer } = require('electron');
const { API_URL, BLOCK_PATTERNS } = require('./config');

// Puente seguro entre la app y la interfaz (sin exponer Node entero).
contextBridge.exposeInMainWorld('ofm', {
  apiUrl: API_URL,
  blockPatterns: BLOCK_PATTERNS,
  // Registra la sesion de una modelo para activar el bloqueo antes de cargar su webview.
  registerModel: (partition, isChatter) => ipcRenderer.invoke('register-model', { partition, isChatter }),
});
