import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ScanLine, PackageCheck, Printer, User, UserCheck, MapPinned } from 'lucide-react';
import client from '../api/client';
import QRScanner from '../components/QRScanner';
import Stepper from '../components/Stepper';
import { isValidName, isValidCameroonPhone } from '../utils/validators';

export default function Guichet() {
  const [step, setStep] = useState('scan'); // scan | preview | validated
  const [preEnrolement, setPreEnrolement] = useState(null);
  const [colisFinal, setColisFinal] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [poidsFinal, setPoidsFinal] = useState('');
  const [prix, setPrix] = useState('');
  const [edits, setEdits] = useState(null);

  async function handleScan(qr) {
    setError('');
    setLoading(true);
    try {
      const { data } = await client.get(`/pre-enrolement/${encodeURIComponent(qr)}`);
      setPreEnrolement(data.pre_enrolement);
      setEdits({
        expediteur_nom: data.pre_enrolement.expediteur_nom,
        expediteur_telephone: data.pre_enrolement.expediteur_telephone,
        destinataire_nom: data.pre_enrolement.destinataire_nom,
        destinataire_telephone: data.pre_enrolement.destinataire_telephone,
        ville_depart: data.pre_enrolement.ville_depart,
        ville_arrivee: data.pre_enrolement.ville_arrivee,
        description_colis: data.pre_enrolement.description_colis,
      });
      setPoidsFinal(data.pre_enrolement.poids_estime || '');
      setStep('preview');
    } catch (err) {
      setError(err.response?.data?.message || 'QR introuvable ou déjà utilisé.');
    } finally {
      setLoading(false);
    }
  }

  function updateEdit(key, value) {
    setEdits((e) => ({ ...e, [key]: value }));
  }

  function editError(key) {
    if (!edits || !edits[key]) return null;
    if (key.endsWith('_nom') && !isValidName(edits[key])) {
      return 'Lettres uniquement, 2 caractères minimum.';
    }
    if (key.endsWith('_telephone') && !isValidCameroonPhone(edits[key])) {
      return 'Numéro camerounais invalide (ex: 677123456).';
    }
    return null;
  }

  function editsValides() {
    if (!edits) return false;
    return (
      isValidName(edits.expediteur_nom) &&
      isValidCameroonPhone(edits.expediteur_telephone) &&
      isValidName(edits.destinataire_nom) &&
      isValidCameroonPhone(edits.destinataire_telephone)
    );
  }

  async function handleValider() {
    if (!editsValides()) {
      setError('Corrigez les champs en rouge avant de valider (noms et téléphones).');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await client.post('/valider-colis', {
        qr_temporaire: preEnrolement.qr_temporaire,
        poids_final: poidsFinal ? Number(poidsFinal) : undefined,
        prix: prix ? Number(prix) : undefined,
        ...edits,
      });
      setColisFinal(data.colis);
      setStep('validated');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la validation.');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep('scan');
    setPreEnrolement(null);
    setColisFinal(null);
    setError('');
    setPoidsFinal('');
    setPrix('');
    setEdits(null);
  }

  return (
    <div>
      <h2 className="section-heading">Guichet</h2>
      <p className="section-heading-sub">Enregistrement et validation des colis</p>
      <div className="route-divider" />

      <Stepper
        steps={['Scanner', 'Vérifier', 'Étiquette']}
        currentIndex={step === 'scan' ? 0 : step === 'preview' ? 1 : 2}
      />

      {error && <div className="alert alert-error">{error}</div>}

      {step === 'scan' && (
        <>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="icon-badge"><ScanLine size={18} /></div>
            <div>
              <p className="card-title" style={{ marginBottom: 2 }}>Scanner le QR client</p>
              <p className="card-sub" style={{ marginBottom: 0 }}>Demandez au client d'afficher son QR de pré-enrôlement</p>
            </div>
          </div>
          <QRScanner onScan={handleScan} />
        </>
      )}

      {step === 'preview' && preEnrolement && edits && (
        <div className="card">
          <p className="card-title">Vérifier et corriger les informations</p>
          <p className="card-sub">Modifiez directement en cas de faute de saisie du client</p>

          <div className="field-group-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={13} /> Expéditeur</div>
          <div className="field">
            <label>Nom complet</label>
            <input
              value={edits.expediteur_nom}
              onChange={(e) => updateEdit('expediteur_nom', e.target.value)}
              style={editError('expediteur_nom') ? { borderColor: 'var(--danger)' } : undefined}
            />
            {editError('expediteur_nom') && <p className="field-error">{editError('expediteur_nom')}</p>}
          </div>
          <div className="field">
            <label>Téléphone</label>
            <input
              value={edits.expediteur_telephone}
              onChange={(e) => updateEdit('expediteur_telephone', e.target.value)}
              placeholder="Ex: 677123456"
              style={editError('expediteur_telephone') ? { borderColor: 'var(--danger)' } : undefined}
            />
            {editError('expediteur_telephone') && <p className="field-error">{editError('expediteur_telephone')}</p>}
          </div>

          <div className="field-group-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><UserCheck size={13} /> Destinataire</div>
          <div className="field">
            <label>Nom complet</label>
            <input
              value={edits.destinataire_nom}
              onChange={(e) => updateEdit('destinataire_nom', e.target.value)}
              style={editError('destinataire_nom') ? { borderColor: 'var(--danger)' } : undefined}
            />
            {editError('destinataire_nom') && <p className="field-error">{editError('destinataire_nom')}</p>}
          </div>
          <div className="field">
            <label>Téléphone</label>
            <input
              value={edits.destinataire_telephone}
              onChange={(e) => updateEdit('destinataire_telephone', e.target.value)}
              placeholder="Ex: 699333444"
              style={editError('destinataire_telephone') ? { borderColor: 'var(--danger)' } : undefined}
            />
            {editError('destinataire_telephone') && <p className="field-error">{editError('destinataire_telephone')}</p>}
          </div>

          <div className="field-group-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPinned size={13} /> Trajet & colis</div>
          <div className="field">
            <label>Ville de départ</label>
            <input value={edits.ville_depart} onChange={(e) => updateEdit('ville_depart', e.target.value)} />
          </div>
          <div className="field">
            <label>Ville d'arrivée</label>
            <input value={edits.ville_arrivee} onChange={(e) => updateEdit('ville_arrivee', e.target.value)} />
          </div>
          <div className="field">
            <label>Description du colis</label>
            <input value={edits.description_colis} onChange={(e) => updateEdit('description_colis', e.target.value)} />
          </div>
          <div className="field">
            <label>Poids final (kg)</label>
            <input type="number" value={poidsFinal} onChange={(e) => setPoidsFinal(e.target.value)} step="0.1" />
          </div>
          <div className="field">
            <label>Prix (FCFA)</label>
            <input type="number" value={prix} onChange={(e) => setPrix(e.target.value)} placeholder="Ex: 3500" />
          </div>

          <button className="btn btn-primary" onClick={handleValider} disabled={loading} style={{ marginBottom: 10 }}>
            {loading ? 'Validation...' : 'Valider et générer le QR final'}
          </button>
          <button className="btn btn-ghost" onClick={reset}>Annuler</button>
        </div>
      )}

      {step === 'validated' && colisFinal && (
        <div className="card">
          <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PackageCheck size={16} />
            Colis validé avec succès. Imprimez l'étiquette QR ci-dessous.
          </div>
          <p className="card-title">Étiquette colis</p>
          <div style={{ background: '#fff', padding: 20, borderRadius: 12, display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <QRCodeSVG value={colisFinal.qr_final} size={200} bgColor="#ffffff" fgColor="#0F1326" level="M" />
          </div>
          <div className="qr-id" style={{ marginBottom: 16, textAlign: 'center' }}>{colisFinal.qr_final}</div>
          <InfoRow label="Trajet" value={`${colisFinal.ville_depart} → ${colisFinal.ville_arrivee}`} />
          <InfoRow label="Destinataire" value={colisFinal.destinataire_nom} />
          <InfoRow label="Prix" value={colisFinal.prix ? `${colisFinal.prix} FCFA` : '—'} />
          <button className="btn btn-primary" onClick={() => window.print()} style={{ marginTop: 16, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Printer size={16} />
            Imprimer l'étiquette
          </button>
          <button className="btn btn-secondary" onClick={reset}>Enregistrer un autre colis</button>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ textAlign: 'right', fontWeight: 500 }}>{value}</span>
    </div>
  );
}
