import { useEffect, useRef, useState } from 'react';
import { PackageOpen } from 'lucide-react';
import client from '../api/client';

const STATUT_LABELS = {
  valide: 'Validé',
  charge: 'Chargé',
  en_transit: 'En transit',
  arrive: 'Arrivé',
  livre: 'Livré',
};

const STATUT_ORDER = ['valide', 'charge', 'en_transit', 'arrive', 'livre'];
const REFRESH_MS = 15000;

function estAujourdHui(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export default function Home() {
  const [colis, setColis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);

  function charger(silencieux = false) {
    if (!silencieux) setLoading(true);
    client.get('/colis')
      .then((res) => {
        setColis(res.data.colis.slice().reverse());
        setLastUpdate(new Date());
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    charger();
    intervalRef.current = setInterval(() => charger(true), REFRESH_MS);
    return () => clearInterval(intervalRef.current);
  }, []);

  const counts = colis.reduce((acc, c) => {
    acc[c.statut] = (acc[c.statut] || 0) + 1;
    return acc;
  }, {});
  const total = colis.length;

  const colisAujourdhui = colis.filter((c) => estAujourdHui(c.created_at));
  const livresAujourdhui = colisAujourdhui.filter((c) => c.statut === 'livre').length;

  const trajetsCount = colis.reduce((acc, c) => {
    const key = `${c.ville_depart} → ${c.ville_arrivee}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const topTrajets = Object.entries(trajetsCount).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
        <h2 className="section-heading">Vue d'ensemble</h2>
        {lastUpdate && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            màj {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
      </div>
      <p className="section-heading-sub">Activité en temps réel des colis · actualisation auto toutes les 15s</p>
      <div className="route-divider" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <div className="hero-stat">
          <div className="hero-stat-value" style={{ color: 'var(--accent)' }}>{total}</div>
          <div className="hero-stat-label">Colis au total</div>
        </div>
        <div className="hero-stat" style={{ borderLeftColor: 'var(--success)' }}>
          <div className="hero-stat-value" style={{ color: 'var(--success)' }}>{livresAujourdhui}</div>
          <div className="hero-stat-label">Livrés aujourd'hui ({colisAujourdhui.length} traités)</div>
        </div>
      </div>

      <div className="card">
        <p className="card-title" style={{ marginBottom: 12 }}>Répartition par statut</p>
        {STATUT_ORDER.map((key) => {
          const n = counts[key] || 0;
          const pct = total > 0 ? Math.round((n / total) * 100) : 0;
          return (
            <div key={key} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>{STATUT_LABELS[key]}</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{n}</span>
              </div>
              <div style={{ height: 6, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: n > 0 ? 'var(--accent)' : 'transparent',
                    borderRadius: 4,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {topTrajets.length > 0 && (
        <div className="card">
          <p className="card-title" style={{ marginBottom: 12 }}>Trajets les plus actifs</p>
          {topTrajets.map(([trajet, n]) => (
            <div key={trajet} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
              <span>{trajet}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{n} colis</span>
            </div>
          ))}
        </div>
      )}

      <h3 style={{ fontSize: 15, marginBottom: 12 }}>Derniers colis</h3>
      {loading && <p className="card-sub">Chargement...</p>}
      {!loading && colis.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon"><PackageOpen size={22} /></div>
          Aucun colis enregistré pour le moment.
        </div>
      )}
      {colis.slice(0, 10).map((c) => (
        <div className={`ticket ticket-${c.statut}`} key={c.id}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{c.ville_depart} → {c.ville_arrivee}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.destinataire_nom}</div>
          </div>
          <span className={`status-pill status-${c.statut}`}>{STATUT_LABELS[c.statut] || c.statut}</span>
        </div>
      ))}
    </div>
  );
}
