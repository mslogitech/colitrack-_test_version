import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Route as RouteIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Connexion impossible. Vérifiez vos identifiants.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell" style={{ justifyContent: 'center' }}>
      <div className="content" style={{ paddingBottom: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{
            width: 52, height: 52, background: 'var(--accent)', borderRadius: 14,
            margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#1A1206', boxShadow: '0 8px 24px rgba(242, 169, 59, 0.3)',
          }}>
            <RouteIcon size={26} />
          </div>
          <h1 className="section-heading" style={{ fontSize: 28, textAlign: 'center' }}>COLITRACK</h1>
          <p style={{ color: 'var(--text-muted)', margin: '2px 0 0', fontSize: 14 }}>Espace agent — guichet &amp; quai</p>
        </div>

        {/* Motif de trajet : évoque la logistique interurbaine dès l'écran de connexion */}
        <svg viewBox="0 0 300 24" width="100%" height="24" style={{ marginBottom: 28, opacity: 0.6 }}>
          <line x1="10" y1="12" x2="290" y2="12" stroke="var(--border)" strokeWidth="2" strokeDasharray="6 6" />
          <circle cx="10" cy="12" r="5" fill="var(--accent)" />
          <circle cx="150" cy="12" r="4" fill="var(--text-muted)" />
          <circle cx="290" cy="12" r="5" fill="var(--success)" />
        </svg>

        <form onSubmit={handleSubmit} className="card">
          {error && <div className="alert alert-error">{error}</div>}
          <div className="field">
            <label>Adresse email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agent@colitrack.cm"
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 20 }}>
          Compte de test : guichet@colitrack.cm / test123
        </p>
      </div>
    </div>
  );
}
