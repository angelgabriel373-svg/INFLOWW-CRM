import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(identifier, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const quick = (id, pw) => { setIdentifier(id); setPassword(pw); };

  return (
    <div className="grid min-h-screen place-items-center bg-ink-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-brand-500 text-2xl font-bold text-white">O</div>
          <h1 className="text-2xl font-bold">OFM CRM</h1>
          <p className="text-sm text-gray-500">Gestion de modelos y chatters</p>
        </div>

        <form onSubmit={submit} className="card space-y-4">
          {error && <div className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</div>}
          <div>
            <label className="mb-1 block text-xs text-gray-400">Usuario o email</label>
            <input className="input" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="admin" autoFocus />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Contrasenia</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <button className="btn btn-primary w-full" disabled={busy}>{busy ? 'Entrando...' : 'Entrar'}</button>
        </form>

        <div className="mt-4 rounded-lg border border-ink-600 bg-ink-800 p-3 text-xs text-gray-400">
          <div className="mb-2 font-medium text-gray-300">Accesos de prueba (click para rellenar):</div>
          <div className="space-y-1">
            <button onClick={() => quick('admin', 'admin123')} className="block w-full text-left hover:text-brand-400">👑 admin / admin123</button>
            <button onClick={() => quick('salvador', 'manager123')} className="block w-full text-left hover:text-brand-400">🧭 salvador / manager123 (manager)</button>
            <button onClick={() => quick('giovanni', 'chatter123')} className="block w-full text-left hover:text-brand-400">💬 giovanni / chatter123 (chatter)</button>
          </div>
        </div>
      </div>
    </div>
  );
}
