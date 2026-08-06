import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { Route as RouteIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { agent, logout } = useAuth();

  if (!agent) return <Navigate to="/login" replace />;

  const canGuichet = agent.role === 'guichet' || agent.role === 'admin';
  const canQuai = agent.role === 'quai' || agent.role === 'admin';

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="brand">
          <div className="brand-icon"><RouteIcon size={16} /></div>
          COLITRACK
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="role-badge">{agent.role} · {agent.agence}</span>
        </div>
      </div>
      <div className="content">
        <Outlet />
      </div>
      <div className="nav-tabs">
        <NavLink to="/" end className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>Accueil</NavLink>
        {canGuichet && (
          <NavLink to="/guichet" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>Guichet</NavLink>
        )}
        {canQuai && (
          <NavLink to="/quai" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>Quai</NavLink>
        )}
        <NavLink to="/statistiques" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>Stats</NavLink>
        <NavLink to="/parametres" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>Réglages</NavLink>
      </div>
    </div>
  );
}
