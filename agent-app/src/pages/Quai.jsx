import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Bus, PackageSearch, MapPinCheck, KeyRound, ScanLine } from 'lucide-react';
import client from '../api/client';
import QRScanner from '../components/QRScanner';
import Stepper from '../components/Stepper';

const TABS = [
  { key: 'bus', label: 'Bus', Icon: Bus },
  { key: 'chargement', label: 'Chargement', Icon: PackageSearch },
  { key: 'arrivee', label: 'Arrivée', Icon: MapPinCheck },
  { key: 'livraison', label: 'Livraison', Icon: KeyRound },
];

export default function Quai() {
  const [tab, setTab] = useState('bus');

  return (
    <div>
      <h2 className="section-heading">Quai</h2>
      <p className="section-heading-sub">Chargement, arrivée et livraison des colis</p>
      <div className="route-divider" />

      <div className="quai-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`quai-tab ${tab === t.key ? 'active' : ''}`}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 10 }}
          >
            <t.Icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'bus' && <BusManager />}
      {tab === 'chargement' && <Chargement />}
      {tab === 'arrivee' && <Arrivee />}
      {tab === 'livraison' && <Livraison />}
    </div>
  );
}

function BusManager() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ immatriculation: '', ville_depart: '', ville_arrivee: '', heure_depart: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  function chargerBus() {
    setLoading(true);
    client.get('/bus').then((res) => setBuses(res.data.bus.reverse())).finally(() => setLoading(false));
  }

  useEffect(() => { chargerBus(); }, []);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleCreer(e) {
    e.preventDefault();
    if (!form.immatriculation || !form.ville_depart || !form.ville_arrivee) return;
    setCreating(true);
    setError('');
    try {
      await client.post('/bus', form);
      setForm({ immatriculation: '', ville_depart: '', ville_arrivee: '', heure_depart: '' });
      chargerBus();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création du bus.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <form className="card" onSubmit={handleCreer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div className="icon-badge" style={{ width: 30, height: 30 }}><Bus size={15} /></div>
          <p className="card-title" style={{ marginBottom: 0 }}>Enregistrer un nouveau bus</p>
        </div>
        <p className="card-sub">À faire une fois par bus, avant le premier chargement</p>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="field">
          <label>Immatriculation</label>
          <input value={form.immatriculation} onChange={(e) => update('immatriculation', e.target.value)} placeholder="Ex: CE-123-AB" required />
        </div>
        <div className="field">
          <label>Ville de départ</label>
          <input value={form.ville_depart} onChange={(e) => update('ville_depart', e.target.value)} placeholder="Ex: Douala" required />
        </div>
        <div className="field">
          <label>Ville d'arrivée</label>
          <input value={form.ville_arrivee} onChange={(e) => update('ville_arrivee', e.target.value)} placeholder="Ex: Yaoundé" required />
        </div>
        <div className="field">
          <label>Heure de départ (optionnel)</label>
          <input value={form.heure_depart} onChange={(e) => update('heure_depart', e.target.value)} placeholder="Ex: 14:00" />
        </div>

        <button className="btn btn-primary" type="submit" disabled={creating}>
          {creating ? 'Création...' : 'Créer le bus'}
        </button>
      </form>

      <h3 style={{ fontSize: 15, marginBottom: 12 }}>Bus enregistrés</h3>
      {loading && <p className="card-sub">Chargement...</p>}
      {!loading && buses.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon"><Bus size={22} /></div>
          Aucun bus enregistré. Créez-en un ci-dessus avant de charger des colis.
        </div>
      )}
      {buses.map((b) => (
        <BusTicket key={b.id} bus={b} />
      ))}
    </div>
  );
}

function BusTicket({ bus }) {
  const [showQR, setShowQR] = useState(false);

  return (
    <div className={`ticket ticket-${bus.statut === 'en_attente' ? 'valide' : 'en_transit'}`} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{bus.immatriculation}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{bus.ville_depart} → {bus.ville_arrivee}{bus.heure_depart ? ` · ${bus.heure_depart}` : ''}</div>
        </div>
        <span className={`status-pill status-${bus.statut === 'en_attente' ? 'valide' : 'en_transit'}`}>{bus.statut}</span>
      </div>
      <button className="btn btn-ghost" style={{ marginTop: 8, fontSize: 12 }} onClick={() => setShowQR((v) => !v)}>
        {showQR ? 'Masquer le QR' : 'Afficher le QR à imprimer'}
      </button>
      {showQR && (
        <div style={{ background: '#fff', padding: 16, borderRadius: 10, display: 'flex', justifyContent: 'center', marginTop: 10 }}>
          <QRCodeSVG value={bus.qr_bus} size={160} bgColor="#ffffff" fgColor="#0F1326" level="M" />
        </div>
      )}
    </div>
  );
}

function Chargement() {
  const [qrColis, setQrColis] = useState(null);
  const [qrBus, setQrBus] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [buses, setBuses] = useState([]);
  const [busListLoading, setBusListLoading] = useState(false);

  async function tryLoad(colis, bus) {
    if (!colis || !bus) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await client.post('/scan/chargement', { qr_colis: colis, qr_bus: bus });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de chargement.');
      setQrBus(null); // permet de réessayer (re-scanner ou re-sélectionner un bus) sans tout recommencer
    } finally {
      setLoading(false);
    }
  }

  function chargerListeBus() {
    setBusListLoading(true);
    client.get('/bus').then((res) => setBuses(res.data.bus)).finally(() => setBusListLoading(false));
  }

  function reset() {
    setQrColis(null);
    setQrBus(null);
    setResult(null);
    setError('');
  }

  if (result) {
    return (
      <div className="card">
        <div className="alert alert-success">{result.message}</div>
        <p className="card-title">Colis chargé</p>
        <p className="card-sub">{result.colis.ville_depart} → {result.colis.ville_arrivee} · Manifeste ouvert</p>
        <CloturePanel manifeste={result.manifeste} onCloture={reset} />
        <button className="btn btn-secondary" onClick={reset} style={{ marginTop: 10 }}>Scanner un autre colis</button>
      </div>
    );
  }

  return (
    <div>
      <Stepper
        steps={['Colis', 'Bus', 'Chargé']}
        currentIndex={!qrColis ? 0 : !qrBus ? 1 : 2}
      />
      {error && <div className="alert alert-error">{error}</div>}
      {!qrColis && <QRScanner onScan={(v) => setQrColis(v)} />}

      {qrColis && !qrBus && (
        <>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="icon-badge"><ScanLine size={18} /></div>
            <div>
              <p className="card-title" style={{ marginBottom: 2 }}>Scanner le bus</p>
              <p className="qr-id" style={{ marginBottom: 0 }}>Colis: {qrColis}</p>
            </div>
          </div>
          <QRScanner onScan={(v) => { setQrBus(v); tryLoad(qrColis, v); }} />

          <div className="card" style={{ marginTop: 4 }}>
            <p className="card-title" style={{ fontSize: 14 }}>QR illisible ? Choisissez le bus dans la liste</p>
            {buses.length === 0 && (
              <button className="btn btn-secondary" onClick={chargerListeBus} disabled={busListLoading}>
                {busListLoading ? 'Chargement...' : 'Afficher la liste des bus'}
              </button>
            )}
            {buses.length > 0 && (
              <select
                defaultValue=""
                onChange={(e) => {
                  if (!e.target.value) return;
                  setQrBus(e.target.value);
                  tryLoad(qrColis, e.target.value);
                }}
              >
                <option value="" disabled>Sélectionner un bus...</option>
                {buses.map((b) => (
                  <option key={b.id} value={b.qr_bus}>
                    {b.immatriculation} · {b.ville_depart} → {b.ville_arrivee}{b.heure_depart ? ` · ${b.heure_depart}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
        </>
      )}

      {loading && <p className="card-sub">Vérification de cohérence en cours...</p>}
    </div>
  );
}

function CloturePanel({ manifeste, onCloture }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function cloturer() {
    setLoading(true);
    setError('');
    try {
      await client.post('/cloture-manifeste', { manifeste_id: manifeste.id });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de clôture.');
    } finally {
      setLoading(false);
    }
  }

  if (done) return <div className="alert alert-success">Manifeste clôturé. Bus en transit.</div>;

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}
      <p className="card-sub">{manifeste.colis_ids.length} colis chargé(s) sur ce manifeste.</p>
      <button className="btn btn-danger" onClick={cloturer} disabled={loading}>
        {loading ? 'Clôture...' : 'Clôturer le manifeste (départ du bus)'}
      </button>
    </div>
  );
}

function Arrivee() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleScan(qr) {
    setLoading(true);
    setError('');
    try {
      const { data } = await client.post('/scan/arrivee', { qr_colis: qr });
      setResult(data.colis);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur.');
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="card">
        <div className="alert alert-success">Colis marqué comme arrivé.</div>
        <p className="card-title">Code OTP à transmettre au destinataire</p>
        <div className="otp-display">{result.otp}</div>
        <p className="card-sub" style={{ textAlign: 'center' }}>{result.destinataire_nom} · {result.destinataire_telephone}</p>
        <button className="btn btn-secondary" onClick={() => setResult(null)} style={{ marginTop: 10 }}>Scanner un autre colis</button>
      </div>
    );
  }

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}
      {loading ? <p className="card-sub">Traitement...</p> : <QRScanner onScan={handleScan} />}
    </div>
  );
}

function Livraison() {
  const [qrColis, setQrColis] = useState(null);
  const [otp, setOtp] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLivrer() {
    setLoading(true);
    setError('');
    try {
      const { data } = await client.post('/livraison', { qr_colis: qrColis, otp });
      setResult(data.colis);
    } catch (err) {
      setError(err.response?.data?.message || 'OTP incorrect ou colis invalide.');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setQrColis(null);
    setOtp('');
    setResult(null);
    setError('');
  }

  if (result) {
    return (
      <div className="card">
        <div className="alert alert-success">Colis livré avec succès à {result.destinataire_nom}.</div>
        <button className="btn btn-primary" onClick={reset}>Nouvelle livraison</button>
      </div>
    );
  }

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}
      {!qrColis && (
        <>
          <div className="card"><p className="card-title">Scanner le colis à livrer</p></div>
          <QRScanner onScan={(v) => setQrColis(v)} />
        </>
      )}
      {qrColis && (
        <div className="card">
          <p className="card-title">Confirmer la livraison</p>
          <p className="qr-id" style={{ marginBottom: 16 }}>{qrColis}</p>
          <div className="field">
            <label>Code OTP présenté par le destinataire</label>
            <input value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={4} placeholder="0000" style={{ textAlign: 'center', fontSize: 24, fontFamily: 'var(--font-mono)', letterSpacing: '0.2em' }} />
          </div>
          <button className="btn btn-primary" onClick={handleLivrer} disabled={loading || otp.length !== 4}>
            {loading ? 'Vérification...' : 'Confirmer la livraison'}
          </button>
        </div>
      )}
    </div>
  );
}
