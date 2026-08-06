import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRScanner({ onScan, active = true }) {
  const containerId = useRef(`qr-reader-${Math.random().toString(36).slice(2)}`);
  const scannerRef = useRef(null);
  const [cameraError, setCameraError] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [manualValue, setManualValue] = useState('');
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(
    () => localStorage.getItem('colitrack_camera_id') || null
  );

  // Liste les caméras disponibles (webcam intégrée + toute caméra USB branchée)
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => setCameras(devices || []))
      .catch(() => setCameras([]));
  }, []);

  useEffect(() => {
    if (!active || manualMode) return;
    const scanner = new Html5Qrcode(containerId.current);
    scannerRef.current = scanner;
    let stopped = false;

    const cameraTarget = selectedCameraId ? { deviceId: { exact: selectedCameraId } } : { facingMode: 'environment' };

    scanner
      .start(
        cameraTarget,
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          if (!stopped) {
            stopped = true;
            onScan(decodedText);
          }
        },
        () => {} // ignore per-frame scan failures
      )
      .catch(() => {
        setCameraError('Caméra indisponible. Utilisez la saisie manuelle ci-dessous, ou choisissez une autre caméra.');
        setManualMode(true);
      });

    return () => {
      stopped = true;
      const s = scannerRef.current;
      if (!s) return;
      try {
        const maybePromise = s.stop();
        if (maybePromise && typeof maybePromise.then === 'function') {
          maybePromise
            .then(() => { try { s.clear(); } catch (_) {} })
            .catch(() => { try { s.clear(); } catch (_) {} });
        } else {
          try { s.clear(); } catch (_) {}
        }
      } catch (_) {
        // stop() a levé une erreur synchrone car le scanner n'avait pas encore
        // démarré (ex: composant démonté avant la fin de l'initialisation caméra).
        // On ignore et on tente quand même de nettoyer.
        try { s.clear(); } catch (_) {}
      }
    };
  }, [active, manualMode, selectedCameraId]);

  function handleCameraChange(deviceId) {
    localStorage.setItem('colitrack_camera_id', deviceId);
    setSelectedCameraId(deviceId);
    setManualMode(false);
    setCameraError('');
  }

  const cameraSelector = cameras.length > 1 && (
    <div className="field">
      <label>Caméra utilisée</label>
      <select value={selectedCameraId || ''} onChange={(e) => handleCameraChange(e.target.value)}>
        <option value="">Caméra par défaut</option>
        {cameras.map((cam) => (
          <option key={cam.id} value={cam.id}>{cam.label || `Caméra ${cam.id.slice(0, 6)}`}</option>
        ))}
      </select>
    </div>
  );

  if (manualMode) {
    return (
      <div className="card">
        {cameraError && <div className="alert alert-info">{cameraError}</div>}
        {cameraSelector}
        <div className="field">
          <label>Coller ou saisir le code QR (ou scanner avec un lecteur USB)</label>
          <input
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && manualValue) onScan(manualValue); }}
            placeholder="Code QR..."
            autoFocus
          />
        </div>
        <button className="btn btn-primary" onClick={() => manualValue && onScan(manualValue)}>
          Valider le code
        </button>
        {cameras.length > 0 && (
          <button className="btn btn-ghost" onClick={() => setManualMode(false)} style={{ marginTop: 8 }}>
            Revenir au scan caméra
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {cameraSelector}
      <div className="scan-frame" id={containerId.current} />
      <button className="btn btn-ghost" onClick={() => setManualMode(true)}>
        Saisir le code manuellement / utiliser un lecteur USB
      </button>
    </div>
  );
}
