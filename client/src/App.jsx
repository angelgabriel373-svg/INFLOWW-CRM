import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Models from './pages/Models';
import Users from './pages/Users';
import Scripts from './pages/Scripts';
import Tickets from './pages/Tickets';

function Protected({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid h-screen place-items-center text-gray-400">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="chat" element={<Chat />} />
        <Route path="models" element={<Models />} />
        <Route path="scripts" element={<Scripts />} />
        <Route path="tickets" element={<Tickets />} />
        <Route
          path="users"
          element={
            <Protected roles={['ADMIN', 'MANAGER']}>
              <Users />
            </Protected>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
