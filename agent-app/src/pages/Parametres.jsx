import { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { UserCircle, Camera, Server, Info, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Parametres() {
  const { agent, logout } = useAuth();
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(
    () => localStorage.getItem('colitrack_camera_id') || ''
  );
  const [loadingCameras, setLoadingCameras] = useState(false);
  const [saved, setSaved] = useState(false);

  function chargerCameras() {
    setLoadingCameras(true);
    Html5Qrcode.getCameras()
      .then((devices) => setCameras(devices || []))
      .catch(() => setCameras([]))
      .finally(() => setLoadingCameras(false));
  }

  useEffect(() => { chargerCameras(); }, []);

  function handleSelectCamera(id) {
    setSelectedCameraId(id);
    localStorage.setItem('colitrack_camera_id', id);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  return (
    <div>
      <h2 className="section-heading">Paramètres</h2>
      <p className="section-heading-sub">Profil, caméra et connexion serveur</p>
      <div className="route-divider" />

      <div className="card">
        <SectionTitle icon={UserCircle}>Profil</SectionTitle>
        <Row label="Nom" value={agent?.nom} />
        <Row label="Email" value={agent?.email} />
        <Row label="Rôle" value={agent?.role} />
        <Row label="Agence" value={agent?.agence} />
        <button className="btn btn-danger" onClick={logout} style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <LogOut size={16} />
          Se déconnecter
        </button>
      </div>

      <div className="card">
        <SectionTitle icon={Camera}>Caméra de scan</SectionTitle>
        <p className="card-sub">
          Choisissez la caméra à utiliser par défaut pour tous les scans (webcam intégrée,
          webcam USB, ou caméra virtuelle type DroidCam/iVCam).
        </p>
        {loadingCameras && <p className="card-sub">Détection des caméras...</p>}
        {!loadingCameras && cameras.length === 0 && (
          <div className="alert alert-info">
            Aucune caméra détectée pour l'instant. Autorisez l'accès caméra dans votre navigateur,
            puis rafraîchissez cette page.
          </div>
        )}
        {cameras.length > 0 && (
          <div className="field">
            <label>Caméra par défaut</label>
            <select value={selectedCameraId} onChange={(e) => handleSelectCamera(e.target.value)}>
              <option value="">Caméra par défaut du système</option>
              {cameras.map((cam) => (
                <option key={cam.id} value={cam.id}>{cam.label || `Caméra ${cam.id.slice(0, 6)}`}</option>
              ))}
            </select>
          </div>
        )}
        {saved && <div className="alert alert-success" style={{ marginTop: 10 }}>Préférence enregistrée.</div>}
        <button className="btn btn-secondary" onClick={chargerCameras} style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <RefreshCw size={14} />
          Rafraîchir la liste des caméras
        </button>
      </div>

      <div className="card">
        <SectionTitle icon={Server}>Connexion serveur</SectionTitle>
        <Row label="Adresse API" value={apiUrl} />
        <p className="card-sub" style={{ marginTop: 10 }}>
          Pour changer cette adresse, modifiez le fichier <code>.env</code> du projet
          (variable <code>VITE_API_URL</code>) puis relancez l'application.
        </p>
      </div>

      <div className="card">
        <SectionTitle icon={Info}>À propos</SectionTitle>
        <Row label="Application" value="COLITRACK Agent" />
        <Row label="Version" value="1.0.0" />
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <div className="icon-badge" style={{ width: 30, height: 30 }}><Icon size={15} /></div>
      <p className="card-title" style={{ marginBottom: 0 }}>{children}</p>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ textAlign: 'right', fontWeight: 500 }}>{value || '—'}</span>
    </div>
  );
}
