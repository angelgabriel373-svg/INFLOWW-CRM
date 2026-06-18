// Logica de la app: login contra el CRM, carga de modelos y webviews de OnlyFans.
const api = window.ofm.apiUrl;
const BLOCK_PATTERNS = window.ofm.blockPatterns || [];

const els = {
  login: document.getElementById('login'),
  app: document.getElementById('app'),
  username: document.getElementById('username'),
  password: document.getElementById('password'),
  loginBtn: document.getElementById('login-btn'),
  loginError: document.getElementById('login-error'),
  models: document.getElementById('models'),
  userBox: document.getElementById('user-box'),
  logoutBtn: document.getElementById('logout-btn'),
  stage: document.getElementById('stage'),
  empty: document.getElementById('empty'),
};

let state = { token: null, role: null, name: null };
const webviews = new Map(); // modelId -> <webview>

// CSS que oculta los enlaces de dinero dentro de OnlyFans (refuerzo del bloqueo de red).
const HIDE_MONEY_CSS = `
  a[href*="/my/statistics"], a[href*="/my/statements"], a[href*="/my/payout"],
  a[href*="/my/banking"], a[href*="/my/promotions"], a[href*="/my/payments"] {
    display: none !important;
  }
`;

function showError(msg) {
  els.loginError.textContent = msg;
  els.loginError.hidden = false;
}

async function login() {
  console.log('[LOGIN] click');
  els.loginError.hidden = true;
  const identifier = els.username.value.trim();
  const password = els.password.value;
  if (!identifier || !password) return showError('Pon usuario y contraseña.');

  els.loginBtn.disabled = true;
  els.loginBtn.textContent = 'Entrando...';
  try {
    console.log('[LOGIN] llamando a la API...');
    const r = await window.ofm.login(identifier, password);
    console.log('[LOGIN] respuesta ok=' + r.ok + ' status=' + r.status);
    if (!r.ok) throw new Error((r.data && r.data.error) || 'Credenciales invalidas');
    const data = r.data;
    if (!data || !data.token || !data.user) throw new Error('Respuesta inesperada del servidor');

    state.token = data.token;
    state.role = data.user.role;
    state.name = data.user.name;

    els.login.hidden = true;
    els.app.hidden = false;
    // textContent (no innerHTML) para evitar inyeccion de HTML con el nombre.
    els.userBox.innerHTML = '';
    const nameEl = document.createElement('div'); nameEl.className = 'u-name'; nameEl.textContent = data.user.name;
    const roleEl = document.createElement('div'); roleEl.className = 'u-role'; roleEl.textContent = roleLabel(data.user.role);
    els.userBox.append(nameEl, roleEl);
    console.log('[LOGIN] dentro, cargando modelos...');
    await loadModels();
    console.log('[LOGIN] modelos cargados');
  } catch (e) {
    console.log('[LOGIN] ERROR: ' + e.message);
    showError(e.message);
  } finally {
    els.loginBtn.disabled = false;
    els.loginBtn.textContent = 'Entrar';
  }
}

function roleLabel(r) {
  return r === 'ADMIN' ? 'Administrador' : r === 'MANAGER' ? 'Manager' : 'Chatter';
}

async function loadModels() {
  const r = await window.ofm.getModels(state.token);
  if (!r.ok) {
    els.models.innerHTML = '<div class="no-models">Error cargando modelos (vuelve a entrar)</div>';
    return;
  }
  const models = r.data;
  els.models.innerHTML = '';
  if (!Array.isArray(models) || models.length === 0) {
    els.models.innerHTML = '<div class="no-models">Sin modelos asignadas</div>';
    return;
  }
  models.forEach((m) => {
    const btn = document.createElement('button');
    btn.className = 'model-btn';
    btn.textContent = m.alias || m.name;
    btn.title = m.name;
    btn.onclick = () => openModel(m, btn);
    els.models.appendChild(btn);
  });
}

async function openModel(model, btn) {
  // Marca el boton activo
  document.querySelectorAll('.model-btn').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  els.empty.hidden = true;

  // Oculta las demas webviews
  webviews.forEach((wv) => (wv.style.display = 'none'));

  let wv = webviews.get(model.id);
  if (!wv) {
    const partition = `persist:ofm-model-${model.id}`;
    const isChatter = state.role === 'CHATTER';
    // Activar el bloqueo de red ANTES de cargar la web
    await window.ofm.registerModel(partition, isChatter);

    wv = document.createElement('webview');
    wv.setAttribute('partition', partition);
    wv.setAttribute('src', 'https://onlyfans.com/my/chats');
    wv.setAttribute('allowpopups', 'false');
    wv.setAttribute('webpreferences', 'contextIsolation=yes,nodeIntegration=no,sandbox=yes');
    wv.className = 'ofweb';
    wv.addEventListener('dom-ready', () => {
      if (isChatter) wv.insertCSS(HIDE_MONEY_CSS).catch(() => {});
    });
    // Refuerzo: si es chatter, impedir navegar a paginas de dinero dentro de la SPA.
    if (isChatter) {
      wv.addEventListener('will-navigate', (e) => {
        if (BLOCK_PATTERNS.some((p) => e.url.includes(p))) wv.stop();
      });
    }
    els.stage.appendChild(wv);
    webviews.set(model.id, wv);
  }
  wv.style.display = 'flex';
}

function logout() {
  state = { token: null, role: null, name: null };
  webviews.forEach((wv) => wv.remove());
  webviews.clear();
  els.app.hidden = true;
  els.login.hidden = false;
  els.empty.hidden = false;
  els.username.value = '';
  els.password.value = '';
}

els.loginBtn.addEventListener('click', login);
els.password.addEventListener('keydown', (e) => { if (e.key === 'Enter') login(); });
els.logoutBtn.addEventListener('click', logout);
