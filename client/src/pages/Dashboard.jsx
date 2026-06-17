import { useEffect, useState } from 'react';
import { api } from '../api';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const GRID = { color: '#1d2433' };
const TICK = { color: '#8a93a6' };

function Kpi({ label, value, sub }) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-white">{value}</div>
      {sub && <div className="mt-1 text-xs text-gray-500">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/stats/overview').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="p-6 text-red-300">{error}</div>;
  if (!data) return <div className="p-6 text-gray-400">Cargando estadisticas...</div>;

  const { kpis, revenueByModel, messagesByChatter } = data;

  const revenueChart = {
    labels: revenueByModel.map((r) => r.name),
    datasets: [
      { label: 'Revenue PPV (€)', data: revenueByModel.map((r) => r.ppvRevenue), backgroundColor: '#6c47ff', borderRadius: 6 },
      { label: 'Revenue fans (€)', data: revenueByModel.map((r) => r.fansRevenue), backgroundColor: '#00d4ff', borderRadius: 6 },
    ],
  };

  const chatterChart = {
    labels: messagesByChatter.map((c) => c.name),
    datasets: [
      { data: messagesByChatter.map((c) => c.messages), backgroundColor: ['#6c47ff', '#00d4ff', '#22c55e', '#f59e0b', '#ef4444', '#ec4899'] },
    ],
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500">Vision general del rendimiento</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Ingresos totales" value={`${kpis.totalRevenue.toLocaleString('es-ES')} €`} sub="PPV comprados" />
        <Kpi label="Conversion PPV" value={`${kpis.conversionRate}%`} sub={`${kpis.ppvBought}/${kpis.ppvSent} enviados`} />
        <Kpi label="Conversaciones" value={kpis.conversations} sub={`${kpis.models} modelos`} />
        <Kpi label="Equipo activo" value={kpis.activeUsers} sub="usuarios" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="mb-4 font-semibold">Revenue por modelo</h2>
          <Bar
            data={revenueChart}
            options={{
              responsive: true,
              plugins: { legend: { labels: { color: '#cbd2e0' } } },
              scales: { x: { grid: GRID, ticks: TICK }, y: { grid: GRID, ticks: TICK } },
            }}
          />
        </div>
        <div className="card">
          <h2 className="mb-4 font-semibold">Mensajes por chatter</h2>
          {messagesByChatter.length ? (
            <Doughnut data={chatterChart} options={{ plugins: { legend: { labels: { color: '#cbd2e0' } } } }} />
          ) : (
            <p className="text-sm text-gray-500">Sin datos todavia.</p>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4 font-semibold">Detalle por modelo</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr className="border-b border-ink-600">
                <th className="py-2">Modelo</th>
                <th className="py-2">Revenue PPV</th>
                <th className="py-2">Revenue fans</th>
                <th className="py-2">Mensajes enviados</th>
              </tr>
            </thead>
            <tbody>
              {revenueByModel.map((r) => (
                <tr key={r.modelId} className="border-b border-ink-700/50">
                  <td className="py-2 font-medium">{r.name}</td>
                  <td className="py-2">{r.ppvRevenue.toLocaleString('es-ES')} €</td>
                  <td className="py-2">{r.fansRevenue.toLocaleString('es-ES')} €</td>
                  <td className="py-2">{r.messagesSent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
