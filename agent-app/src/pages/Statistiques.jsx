import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { TrendingUp, Clock, Truck, AlertTriangle, Wallet, PackageCheck } from 'lucide-react';
import client from '../api/client';

const STATUT_LABELS = {
  valide: 'Validé', charge: 'Chargé', en_transit: 'En transit', arrive: 'Arrivé', livre: 'Livré',
};
const STATUT_COLORS = {
  valide: '#F2A93B', charge: '#8EA6FF', en_transit: '#8EA6FF', arrive: '#3FBF7F', livre: '#3FBF7F',
};

function formatFCFA(n) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
}

function formatDateCourt(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

export default function Statistiques() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function charger() {
    client.get('/statistiques')
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Erreur de chargement des statistiques.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { charger(); }, []);

  if (loading) {
    return (
      <div>
        <h2 className="section-heading">Statistiques</h2>
        <p className="section-heading-sub">Chargement de l'analyse...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div>
        <h2 className="section-heading">Statistiques</h2>
        <div className="alert alert-error">{error || 'Aucune donnée disponible.'}</div>
      </div>
    );
  }

  const { totaux, par_statut, serie_temporelle, top_trajets, performance_agences } = stats;

  const serieFormatee = serie_temporelle.map((j) => ({ ...j, label: formatDateCourt(j.date) }));
  const repartitionData = Object.entries(par_statut).map(([statut, count]) => ({
    statut: STATUT_LABELS[statut],
    count,
    fill: STATUT_COLORS[statut],
  }));

  return (
    <div>
      <h2 className="section-heading">Statistiques</h2>
      <p className="section-heading-sub">Analyse des opérations sur les 14 derniers jours</p>
      <div className="route-divider" />

      {/* KPIs principaux */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <KpiCard icon={PackageCheck} label="Colis au total" value={totaux.total_colis} color="var(--accent)" />
        <KpiCard icon={Wallet} label="Revenu total" value={formatFCFA(totaux.total_revenue)} color="var(--success)" small />
        <KpiCard icon={TrendingUp} label="Taux de livraison" value={`${totaux.taux_livraison_pct}%`} color="var(--success)" />
        <KpiCard icon={Clock} label="Délai moyen livraison" value={totaux.temps_moyen_livraison_heures != null ? `${totaux.temps_moyen_livraison_heures}h` : '—'} color="#8EA6FF" />
        <KpiCard icon={Truck} label="Utilisation du parc" value={`${totaux.taux_utilisation_bus_pct}%`} color="var(--accent)" />
        <KpiCard icon={AlertTriangle} label="Colis en retard (+24h)" value={totaux.colis_en_retard} color={totaux.colis_en_retard > 0 ? 'var(--danger)' : 'var(--text-muted)'} />
      </div>

      {/* Tendance colis par jour */}
      <div className="card">
        <p className="card-title" style={{ marginBottom: 12 }}>Colis enregistrés par jour</p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={serieFormatee} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colisGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F2A93B" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#F2A93B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2E3768" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#8B92BE', fontSize: 11 }} axisLine={{ stroke: '#2E3768' }} tickLine={false} />
            <YAxis tick={{ fill: '#8B92BE', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: '#1A2040', border: '1px solid #2E3768', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#EDEFF7' }}
            />
            <Area type="monotone" dataKey="colis" stroke="#F2A93B" strokeWidth={2} fill="url(#colisGradient)" name="Colis" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Revenu par jour */}
      <div className="card">
        <p className="card-title" style={{ marginBottom: 12 }}>Revenu par jour (FCFA)</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={serieFormatee} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2E3768" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#8B92BE', fontSize: 11 }} axisLine={{ stroke: '#2E3768' }} tickLine={false} />
            <YAxis tick={{ fill: '#8B92BE', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#1A2040', border: '1px solid #2E3768', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#EDEFF7' }}
              formatter={(value) => formatFCFA(value)}
            />
            <Bar dataKey="revenue" fill="#3FBF7F" radius={[4, 4, 0, 0]} name="Revenu" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Répartition par statut */}
      <div className="card">
        <p className="card-title" style={{ marginBottom: 12 }}>Répartition par statut</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={repartitionData} layout="vertical" margin={{ top: 4, right: 20, left: 10, bottom: 0 }}>
            <XAxis type="number" tick={{ fill: '#8B92BE', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="statut" tick={{ fill: '#8B92BE', fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
            <Tooltip contentStyle={{ background: '#1A2040', border: '1px solid #2E3768', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {repartitionData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Trajets les plus actifs */}
      <div className="card">
        <p className="card-title" style={{ marginBottom: 12 }}>Trajets les plus actifs</p>
        {top_trajets.map((t, i) => (
          <div key={t.trajet} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
            <span style={{ width: 18, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>#{i + 1}</span>
            <span style={{ flex: 1, fontSize: 13 }}>{t.trajet}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)' }}>{t.count}</span>
          </div>
        ))}
      </div>

      {/* Performance par agence */}
      {performance_agences.length > 0 && (
        <div className="card">
          <p className="card-title" style={{ marginBottom: 12 }}>Performance par agence</p>
          {performance_agences.map((a) => (
            <div key={a.agence} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{a.agence}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--success)' }}>{formatFCFA(a.revenue)}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {a.total} colis · {a.livres} livrés ({a.total > 0 ? Math.round((a.livres / a.total) * 100) : 0}%)
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color, small }) {
  return (
    <div className="hero-stat" style={{ borderLeftColor: color }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Icon size={13} color={color} />
      </div>
      <div className="hero-stat-value" style={{ color, fontSize: small ? 18 : 26 }}>{value}</div>
      <div className="hero-stat-label">{label}</div>
    </div>
  );
}
