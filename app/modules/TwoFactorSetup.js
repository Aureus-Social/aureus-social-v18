'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ═══════════════════════════════════════════════════════════
// AUREUS SOCIAL PRO — 2FA/MFA TOTP Setup Component
// Enrollment, QR code, verification, unenrollment
// ═══════════════════════════════════════════════════════════

export default function TwoFactorSetup() {
  const [factors, setFactors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { loadFactors(); }, []);

  const loadFactors = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data } = await supabase.auth.mfa.listFactors();
      setFactors(data?.totp || []);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const startEnroll = async () => {
    setEnrolling(true);
    setError('');
    setSuccess('');
    try {
      const { data, error: enrollErr } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Aureus Social Pro',
      });
      if (enrollErr) throw enrollErr;
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
    } catch (e) {
      setError(e.message);
      setEnrolling(false);
    }
  };

  const verifyEnrollment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
      if (chErr) throw chErr;

      const { error: verErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: verifyCode,
      });
      if (verErr) throw verErr;

      setSuccess('2FA activé avec succès !');
      setEnrolling(false);
      setQrCode(null);
      setSecret('');
      setVerifyCode('');
      await loadFactors();
    } catch (err) {
      setError(err.message === 'Invalid TOTP code' ? 'Code incorrect. Réessayez.' : err.message);
    }
    setLoading(false);
  };

  const unenroll = async (id) => {
    if (!confirm('Désactiver la vérification en 2 étapes ?')) return;
    setError('');
    try {
      const { error: unErr } = await supabase.auth.mfa.unenroll({ factorId: id });
      if (unErr) throw unErr;
      setSuccess('2FA désactivé.');
      await loadFactors();
    } catch (e) {
      setError(e.message);
    }
  };

  const card = {
    padding: 24, borderRadius: 12,
    background: 'rgba(198,163,78,0.03)', border: '1px solid rgba(198,163,78,0.12)',
    marginBottom: 16,
  };
  const btn = (color = '#c6a34e') => ({
    padding: '10px 20px', background: `linear-gradient(135deg, ${color}, ${color}dd)`,
    color: '#060810', fontWeight: 700, fontSize: 13, border: 'none', borderRadius: 8,
    cursor: 'pointer', fontFamily: 'inherit',
  });
  const inputSt = {
    padding: '12px 14px', fontSize: 22, textAlign: 'center', letterSpacing: 10,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(198,163,78,0.15)',
    borderRadius: 8, color: '#e8e6e0', outline: 'none', fontFamily: 'monospace',
    fontWeight: 700, width: '100%', boxSizing: 'border-box',
  };

  const hasActive = factors.some(f => f.status === 'verified');

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#c6a34e', marginBottom: 16 }}>
        Vérification en 2 étapes (2FA/TOTP)
      </div>

      {error && (
        <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', color: '#fb923c', fontSize: 13 }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e', fontSize: 13 }}>
          {success}
        </div>
      )}

      {/* Status */}
      <div style={card}>
        <div style={{ fontSize: 13, color: '#9e9b93', marginBottom: 8 }}>Statut</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: hasActive ? '#22c55e' : '#fb923c' }}>
          {hasActive ? 'Activé — Votre compte est protégé' : 'Désactivé — Activez la 2FA pour sécuriser votre compte'}
        </div>
      </div>

      {/* Enrolled factors */}
      {factors.length > 0 && (
        <div style={card}>
          <div style={{ fontSize: 13, color: '#9e9b93', marginBottom: 10 }}>Facteurs enregistrés</div>
          {factors.map(f => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <span style={{ color: '#e8e6e0', fontSize: 13 }}>{f.friendly_name || 'TOTP'}</span>
                <span style={{ marginLeft: 8, fontSize: 11, color: f.status === 'verified' ? '#22c55e' : '#fb923c' }}>
                  {f.status === 'verified' ? 'Vérifié' : 'En attente'}
                </span>
              </div>
              <button onClick={() => unenroll(f.id)} style={{ ...btn('#ef4444'), padding: '6px 12px', fontSize: 11 }}>
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Enroll */}
      {!enrolling && !hasActive && (
        <button onClick={startEnroll} style={btn()}>
          Activer la 2FA
        </button>
      )}

      {/* QR Code enrollment */}
      {enrolling && qrCode && (
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e8e6e0', marginBottom: 12 }}>
            1. Scannez ce QR code avec votre application
          </div>
          <div style={{ fontSize: 11, color: '#9e9b93', marginBottom: 12 }}>
            Google Authenticator, Authy, 1Password, ou toute app compatible TOTP
          </div>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <img src={qrCode} alt="QR Code 2FA" style={{ width: 200, height: 200, borderRadius: 8, background: '#fff', padding: 8 }} />
          </div>
          <div style={{ fontSize: 11, color: '#9e9b93', marginBottom: 4 }}>Clé secrète (si scan impossible) :</div>
          <div style={{
            fontFamily: 'monospace', fontSize: 12, color: '#c6a34e', padding: '8px 12px',
            background: 'rgba(0,0,0,0.3)', borderRadius: 6, wordBreak: 'break-all', marginBottom: 20,
          }}>
            {secret}
          </div>

          <div style={{ fontSize: 14, fontWeight: 600, color: '#e8e6e0', marginBottom: 12 }}>
            2. Entrez le code à 6 chiffres
          </div>
          <form onSubmit={verifyEnrollment}>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              style={inputSt}
              placeholder="000000"
              autoFocus
            />
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button type="submit" disabled={verifyCode.length !== 6 || loading} style={btn('#22c55e')}>
                {loading ? 'Vérification...' : 'Vérifier et activer'}
              </button>
              <button type="button" onClick={() => { setEnrolling(false); setQrCode(null); setSecret(''); setVerifyCode(''); }} style={{ ...btn('#666'), background: 'rgba(255,255,255,0.05)', color: '#9e9b93' }}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
