import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const STATUS = {
  OPEN: { label: 'Abierto', cls: 'bg-yellow-500/20 text-yellow-400' },
  IN_PROGRESS: { label: 'En curso', cls: 'bg-blue-500/20 text-blue-400' },
  CLOSED: { label: 'Cerrado', cls: 'bg-green-500/20 text-green-400' },
};

export default function Tickets() {
  const { user } = useAuth();
  const canManage = user.role === 'ADMIN' || user.role === 'MANAGER';
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState({ title: '', body: '' });

  const load = () => api.get('/tickets').then(setTickets).catch(() => {});
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    await api.post('/tickets', form);
    setForm({ title: '', body: '' });
    load();
  };

  const setStatus = async (id, status) => { await api.patch(`/tickets/${id}`, { status }); load(); };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Tickets / Incidencias</h1>
        <p className="text-sm text-gray-500">Reporta problemas y peticiones del equipo</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {tickets.map((t) => (
            <div key={t.id} className="card">
              <div className="flex items-start justify-between">
                <div className="font-semibold">{t.title}</div>
                <span className={`badge ${STATUS[t.status].cls}`}>{STATUS[t.status].label}</span>
              </div>
              <p className="mt-2 text-sm text-gray-400">{t.body}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>Por {t.createdBy?.name} · {new Date(t.createdAt).toLocaleString('es-ES')}</span>
                {canManage && (
                  <select className="input w-auto py-1 text-xs" value={t.status} onChange={(e) => setStatus(t.id, e.target.value)}>
                    <option value="OPEN">Abierto</option>
                    <option value="IN_PROGRESS">En curso</option>
                    <option value="CLOSED">Cerrado</option>
                  </select>
                )}
              </div>
            </div>
          ))}
          {tickets.length === 0 && <p className="text-gray-500">No hay tickets.</p>}
        </div>

        <form onSubmit={create} className="card h-fit space-y-3">
          <h2 className="font-semibold">Nuevo ticket</h2>
          <input className="input" placeholder="Titulo" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <textarea className="input" rows={4} placeholder="Describe la incidencia..." value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
          <button className="btn btn-primary w-full">Crear ticket</button>
        </form>
      </div>
    </div>
  );
}
