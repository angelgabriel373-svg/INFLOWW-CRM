import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const empty = { title: '', body: '', category: 'general', modelId: '' };

export default function Scripts() {
  const { user } = useAuth();
  const canEdit = user.role === 'ADMIN' || user.role === 'MANAGER';
  const [scripts, setScripts] = useState([]);
  const [models, setModels] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);

  const load = () => api.get('/scripts').then(setScripts).catch(() => {});
  useEffect(() => {
    load();
    api.get('/models').then(setModels).catch(() => {});
  }, []);

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, modelId: form.modelId || null };
    if (editId) await api.put(`/scripts/${editId}`, payload);
    else await api.post('/scripts', payload);
    setForm(empty); setEditId(null);
    load();
  };

  const edit = (s) => { setForm({ title: s.title, body: s.body, category: s.category, modelId: s.modelId || '' }); setEditId(s.id); };
  const remove = async (id) => { if (confirm('Eliminar script?')) { await api.del(`/scripts/${id}`); load(); } };

  const modelName = (id) => models.find((m) => m.id === id)?.alias || models.find((m) => m.id === id)?.name;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Scripts / Respuestas rapidas</h1>
        <p className="text-sm text-gray-500">Plantillas reutilizables en el chat</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {scripts.map((s) => (
            <div key={s.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{s.title}</div>
                  <div className="mt-0.5 flex gap-2 text-xs">
                    <span className="badge bg-ink-600 text-gray-300">{s.category}</span>
                    {s.modelId ? <span className="badge bg-accent/20 text-accent">{modelName(s.modelId) || 'modelo'}</span> : <span className="badge bg-brand-500/20 text-brand-400">global</span>}
                  </div>
                </div>
                {canEdit && (
                  <div className="flex gap-2 text-xs">
                    <button onClick={() => edit(s)} className="text-accent hover:underline">Editar</button>
                    <button onClick={() => remove(s.id)} className="text-red-400 hover:underline">Eliminar</button>
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-400">{s.body}</p>
            </div>
          ))}
          {scripts.length === 0 && <p className="text-gray-500">No hay scripts todavia.</p>}
        </div>

        {canEdit && (
          <form onSubmit={save} className="card h-fit space-y-3">
            <h2 className="font-semibold">{editId ? 'Editar script' : 'Nuevo script'}</h2>
            <input className="input" placeholder="Titulo" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <textarea className="input" rows={4} placeholder="Mensaje..." value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
            <input className="input" placeholder="Categoria" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <select className="input" value={form.modelId} onChange={(e) => setForm({ ...form, modelId: e.target.value })}>
              <option value="">Global (todas)</option>
              {models.map((m) => <option key={m.id} value={m.id}>{m.alias || m.name}</option>)}
            </select>
            <div className="flex gap-2">
              <button className="btn btn-primary flex-1">{editId ? 'Guardar' : 'Crear'}</button>
              {editId && <button type="button" onClick={() => { setForm(empty); setEditId(null); }} className="btn btn-ghost">Cancelar</button>}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
