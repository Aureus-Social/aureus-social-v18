'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('password'); // password | magic

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!supabase) {
      // Mode démo sans Supabase
      onLogin({ email: email || 'demo@aureus-ia.com', role: 'admin' });
      setLoading(false);
      return;
    }

    try {
      if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
        setError('✅ Lien de connexion envoyé à ' + email);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data?.user) onLogin(data.user);
      }
    } catch (err) {
      setError(err.message || 'Erreur de connexion');
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0c0b09' }}>
      {/* Left — Branding */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 80px', background: 'linear-gradient(135deg, #0c0b09 0%, #1a1816 100%)' }}>
        <div style={{ fontSize: 42, fontWeight: 800, color: '#c6a34e', letterSpacing: '3px' }}>AUREUS</div>
        <div style={{ fontSize: 14, color: '#9e9b93', marginTop: 8, letterSpacing: '4px' }}>SOCIAL PRO</div>
        <div style={{ fontSize: 16, color: '#5e5c56', marginTop: 32, lineHeight: 1.8, maxWidth: 400 }}>
          Gestion de paie belge nouvelle génération.
          <br />Sécurisé. Conforme. Automatisé.
        </div>
        <div style={{ marginTop: 48, display: 'flex', gap: 24 }}>
          {[
            { v: '205+', l: 'Modules' },
            { v: '100%', l: 'Belge' },
            { v: 'RGPD', l: 'Conforme' },
          ].map((k, i) => (
            <div key={i}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#c6a34e' }}>{k.v}</div>
              <div style={{ fontSize: 10, color: '#5e5c56', marginTop: 2 }}>{k.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — Login Form */}
      <div style={{ width: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(198,163,78,.02)' }}>
        <form onSubmit={handleLogin} style={{ width: 340 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#e8e6e0', marginBottom: 6 }}>Connexion</div>
          <div style={{ fontSize: 12, color: '#5e5c56', marginBottom: 32 }}>Accédez à votre espace de gestion</div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 12,
              background: error.startsWith('✅') ? 'rgba(34,197,94,.08)' : 'rgba(239,68,68,.08)',
              color: error.startsWith('✅') ? '#22c55e' : '#ef4444',
              border: `1px solid ${error.startsWith('✅') ? 'rgba(34,197,94,.15)' : 'rgba(239,68,68,.15)'}` }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, color: '#9e9b93', marginBottom: 6 }}>Email professionnel</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder="nom@entreprise.be"
              style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(198,163,78,.15)', background: 'rgba(0,0,0,.3)', color: '#e8e6e0', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {mode === 'password' && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#9e9b93', marginBottom: 6 }}>Mot de passe</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(198,163,78,.15)', background: 'rgba(0,0,0,.3)', color: '#e8e6e0', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: loading ? '#5e5c56' : 'linear-gradient(135deg, #c6a34e, #a68a3c)', color: '#0c0b09', fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', letterSpacing: '.5px' }}>
            {loading ? 'Connexion...' : mode === 'magic' ? 'Envoyer le lien' : 'Se connecter'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button type="button" onClick={() => setMode(mode === 'password' ? 'magic' : 'password')}
              style={{ background: 'none', border: 'none', color: '#c6a34e', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
              {mode === 'password' ? 'Connexion par lien magique →' : '← Connexion par mot de passe'}
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: 40, fontSize: 10, color: '#5e5c56' }}>
            Aureus IA SPRL · BCE BE 1028.230.781
            <br />Données hébergées en UE · Chiffrement AES-256
          </div>
        </form>
      </div>
    </div>
  );
}
