import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const ROLE_LABEL = { ADMIN: 'Admin', MANAGER: 'Manager', CHATTER: 'Chatter' };
const emptyForm = { email: '', username: '', password: '', name: '', role: 'CHATTER', shiftStart: '', shiftEnd: '', modelIds: [] };

export default function Users() {
  const { user } = useAuth();
  const isAdmin = user.role === 'ADMIN';
  const [users, setUsers] = useState([]);
  const [models, setModels] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [assignFor, setAssignFor] = useState(null);
  const [assignIds, setAssignIds] = useState([]);

  const load = () => api.get('/users').then(setUsers).catch(() => {});
  useEffect(() => {
    load();
    api.get('/models').then(setModels).catch(() => {});
  }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', form);
      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch (err) { alert(err.message); }
  };

  const toggleActive = async (u) => {
    await api.put(`/users/${u.id}`, { active: !u.active });
    load();
  };

  const remove = async (u) => {
    if (!confirm(`Eliminar a ${u.name}?`)) return;
    await api.del(`/users/${u.id}`);
    load();
  };

  const openAssign = (u) => {
    setAssignFor(u);
    setAssignIds(u.assignments.map((a) => a.model.id));
  };
  const saveAssign = async () => {
    await api.put(`/users/${assignFor.id}/assignments`, { modelIds: assignIds });
    setAssignFor(null);
    load();
  };

  const toggleModel = (id, set, list) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Equipo</h1>
          <p className="text-sm text-gray-500">{users.length} usuarios</p>
        </div>
        {isAdmin && <button onClick={() => setShowForm(true)} className="btn btn-primary">+ Nuevo usuario</button>}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500">
            <tr className="border-b border-ink-600">
              <th className="py-2">Nombre</th><th>Usuario</th><th>Rol</th><th>Turno</th><th>Modelos</th><th>Estado</th>{isAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-ink-700/50">
                <td className="py-2 font-medium">{u.name}</td>
                <td className="text-gray-400">{u.username}</td>
                <td><span className="badge bg-brand-500/20 text-brand-400">{ROLE_LABEL[u.role]}</span></td>
                <td className="text-gray-400">{u.shiftStart ? `${u.shiftStart}-${u.shiftEnd}` : '—'}</td>
                <td className="text-gray-400">
                  {u.assignments.length ? u.assignments.map((a) => a.model.alias || a.model.name).join(', ') : '—'}
                </td>
                <td>
                  <span className={`badge ${u.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {u.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                {isAdmin && (
                  <td className="space-x-1 text-right">
                    <button onClick={() => openAssign(u)} className="text-xs text-accent hover:underline">Asignar</button>
                    <button onClick={() => toggleActive(u)} className="text-xs text-yellow-400 hover:underline">{u.active ? 'Desactivar' : 'Activar'}</button>
                    {u.id !== user.id && <button onClick={() => remove(u)} className="text-xs text-red-400 hover:underline">Eliminar</button>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal crear usuario */}
      {showForm && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-4" onClick={() => setShowForm(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={create} className="card w-full max-w-lg space-y-3">
            <h2 className="text-lg font-semibold">Nuevo usuario</h2>
            <div className="grid grid-cols-2 gap-3">
              <input className="input" placeholder="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <input className="input" placeholder="Usuario *" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
              <input className="input" type="email" placeholder="Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <input className="input" type="password" placeholder="Contrasenia *" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="CHATTER">Chatter</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input className="input" placeholder="Turno inicio" value={form.shiftStart} onChange={(e) => setForm({ ...form, shiftStart: e.target.value })} />
                <input className="input" placeholder="Turno fin" value={form.shiftEnd} onChange={(e) => setForm({ ...form, shiftEnd: e.target.value })} />
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs text-gray-400">Modelos asignadas</div>
              <div className="flex flex-wrap gap-2">
                {models.map((m) => (
                  <button type="button" key={m.id}
                    onClick={() => toggleModel(m.id, (v) => setForm({ ...form, modelIds: v }), form.modelIds)}
                    className={`badge ${form.modelIds.includes(m.id) ? 'bg-brand-500 text-white' : 'bg-ink-600 text-gray-300'}`}>
                    {m.alias || m.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost">Cancelar</button>
              <button className="btn btn-primary">Crear</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal asignaciones */}
      {assignFor && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-4" onClick={() => setAssignFor(null)}>
          <div onClick={(e) => e.stopPropagation()} className="card w-full max-w-md space-y-3">
            <h2 className="text-lg font-semibold">Modelos de {assignFor.name}</h2>
            <div className="flex flex-wrap gap-2">
              {models.map((m) => (
                <button key={m.id}
                  onClick={() => toggleModel(m.id, setAssignIds, assignIds)}
                  className={`badge ${assignIds.includes(m.id) ? 'bg-brand-500 text-white' : 'bg-ink-600 text-gray-300'}`}>
                  {m.alias || m.name}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setAssignFor(null)} className="btn btn-ghost">Cancelar</button>
              <button onClick={saveAssign} className="btn btn-primary">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
