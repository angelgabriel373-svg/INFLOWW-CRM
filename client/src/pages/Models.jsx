import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const empty = { name: '', alias: '', description: '', subPrice: '', instagram: '', onlyfans: '', telegram: '', avatarUrl: '' };

export default function Models() {
  const { user } = useAuth();
  const canEdit = user.role === 'ADMIN' || user.role === 'MANAGER';
  const [models, setModels] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => api.get('/models').then(setModels).catch(() => {});
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(empty); setEditId(null); setShowForm(true); };
  const openEdit = (m) => {
    const s = m.socials ? JSON.parse(m.socials) : {};
    setForm({ name: m.name, alias: m.alias || '', description: m.description || '', subPrice: m.subPrice || '', instagram: s.instagram || '', onlyfans: s.onlyfans || '', telegram: s.telegram || '', avatarUrl: m.avatarUrl || '' });
    setEditId(m.id);
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name, alias: form.alias, description: form.description,
      subPrice: form.subPrice, avatarUrl: form.avatarUrl,
      socials: { instagram: form.instagram, onlyfans: form.onlyfans, telegram: form.telegram },
    };
    if (editId) await api.put(`/models/${editId}`, payload);
    else await api.post('/models', payload);
    setShowForm(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Eliminar esta modelo y todas sus conversaciones?')) return;
    await api.del(`/models/${id}`);
    load();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Modelos</h1>
          <p className="text-sm text-gray-500">{models.length} modelos</p>
        </div>
        {canEdit && <button onClick={openNew} className="btn btn-primary">+ Nueva modelo</button>}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {models.map((m) => {
          const s = m.socials ? JSON.parse(m.socials) : {};
          return (
            <div key={m.id} className="card">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-500/30 text-lg font-bold text-brand-400 overflow-hidden">
                  {m.avatarUrl ? <img src={m.avatarUrl} className="h-full w-full object-cover" /> : (m.alias || m.name)[0]}
                </div>
                <div>
                  <div className="font-semibold">{m.name}</div>
                  <div className="text-xs text-gray-500">{m.alias} · sub {m.subPrice}€</div>
                </div>
              </div>
              {m.description && <p className="mt-3 text-sm text-gray-400">{m.description}</p>}
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-accent">
                {s.instagram && <span>IG {s.instagram}</span>}
                {s.onlyfans && <span>OF {s.onlyfans}</span>}
                {s.telegram && <span>TG {s.telegram}</span>}
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                <span>👥 {m._count?.fans || 0} fans</span>
                <span>💬 {m._count?.conversations || 0} chats</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {m.assignments?.map((a) => (
                  <span key={a.user.id} className="badge bg-ink-600 text-gray-300">{a.user.name}</span>
                ))}
              </div>
              {canEdit && (
                <div className="mt-4 flex gap-2">
                  <button onClick={() => openEdit(m)} className="btn btn-ghost flex-1 text-xs">Editar</button>
                  {user.role === 'ADMIN' && <button onClick={() => remove(m.id)} className="btn btn-danger text-xs">Eliminar</button>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-4" onClick={() => setShowForm(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={save} className="card w-full max-w-lg space-y-3">
            <h2 className="text-lg font-semibold">{editId ? 'Editar modelo' : 'Nueva modelo'}</h2>
            <div className="grid grid-cols-2 gap-3">
              <input className="input" placeholder="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <input className="input" placeholder="Alias" value={form.alias} onChange={(e) => setForm({ ...form, alias: e.target.value })} />
            </div>
            <textarea className="input" placeholder="Descripcion" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input className="input" type="number" step="0.01" placeholder="Precio sub €" value={form.subPrice} onChange={(e) => setForm({ ...form, subPrice: e.target.value })} />
              <input className="input" placeholder="URL foto" value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input className="input" placeholder="Instagram" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
              <input className="input" placeholder="OnlyFans" value={form.onlyfans} onChange={(e) => setForm({ ...form, onlyfans: e.target.value })} />
              <input className="input" placeholder="Telegram" value={form.telegram} onChange={(e) => setForm({ ...form, telegram: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost">Cancelar</button>
              <button className="btn btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
