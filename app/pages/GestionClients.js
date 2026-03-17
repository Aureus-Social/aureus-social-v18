'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/app/lib/supabase';

const GOLD = '#c6a34e';
const GREEN = '#22c55e';
const RED = '#ef4444';
const BLUE = '#60a5fa';

const PLANS = [
  { id: 'starter', label: 'Starter', price: '49 EUR/mois', desc: "Jusqu'a 5 employes" },
  { id: 'pro', label: 'Pro', price: '99 EUR/mois', desc: "Jusqu'a 25 employes" },
  { id: 'enterprise', label: 'Enterprise', price: '199 EUR/mois', desc: 'Employes illimites' },
];

export default function GestionClients({ s, d }) {
  const [tab, setTab] = useState('liste');
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [form, setForm] = useState({ email: '', nom: '', bce: '', plan: 'starter', message_perso: '' });
  const [result, setResult] = useState(null);
  const [search, setSearch] = useState('');

  const getToken = useCallback(async () => {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }, []);

  // Charger la liste des clients
  const loadClients = useCallback(async () => {
    setLoading(true);
    const token = await getToken();
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch('/api/invite-client', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setClients(data.data || []);
    } catch (e) {
      console.warn('Erreur chargement clients:', e.message);
    }
    setLoading(false);
  }, [getToken]);

  useEffect(() => { loadClients(); }, [loadClients]);

  // Inviter un client
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!form.email || !form.nom) return alert('Email et nom requis');
    setInviting(true);
    setResult(null);
    const token = await getToken();
    if (!token) { setInviting(false); return alert('Session expirée'); }

    try {
      const res = await fetch('/api/invite-client', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        setResult({ success: true, message: data.message });
        setForm({ email: '', nom: '', bce: '', plan: 'starter', message_perso: '' });
        await loadClients();
      } else {
        setResult({ success: false, message: data.error || 'Erreur inconnue' });
      }
    } catch (e) {
      setResult({ success: false, message: e.message });
    }
    setInviting(false);
  };

  // Desactiver un client
  const handleDeactivate = async (clientId, nom) => {
    if (!window.confirm(`Desactiver le client "${nom}" ?`)) return;
    const token = await getToken();
    if (!token) return;
    await fetch(`/api/invite-client?id=${clientId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    await loadClients();
  };

  const filtered = clients.filter(c =>
    (c.nom || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.bce || '').includes(search)
  );

  const actifs = clients.filter(c => c.actif !== false).length;
  const plans_count = {};
  clients.forEach(c => { plans_count[c.plan || 'starter'] = (plans_count[c.plan || 'starter'] || 0) + 1; });

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.04)',
    color: '#e8e6e0', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box',
  };

  return (
    <div style={{ fontFamily: 'inherit', color: '#e8e6e0' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: GOLD }}>
          👥 Gestion des Clients
        </h2>
        <p style={{ margin: '4px 0 0', color: '#9e9b93', fontSize: 13 }}>
          Invitez vos clients — chacun retrouve son travail a chaque connexion
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { l: 'Clients actifs', v: actifs, c: GREEN },
          { l: 'Plan Starter', v: plans_count.starter || 0, c: GOLD },
          { l: 'Plan Pro', v: plans_count.pro || 0, c: BLUE },
          { l: 'Plan Enterprise', v: plans_count.enterprise || 0, c: '#a78bfa' },
        ].map((k, i) => (
          <div key={i} style={{ padding: '14px 16px', background: 'rgba(255,255,255,.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,.06)' }}>
            <div style={{ fontSize: 10, color: '#5e5c56', textTransform: 'uppercase' }}>{k.l}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.c, marginTop: 4 }}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {[['liste', '📋 Liste clients'], ['inviter', '✉️ Inviter un client']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 13, fontFamily: 'inherit', fontWeight: tab === id ? 700 : 400,
            background: tab === id ? 'rgba(198,163,78,.15)' : 'rgba(255,255,255,.03)',
            color: tab === id ? GOLD : '#9e9b93',
          }}>{label}</button>
        ))}
      </div>

      {/* LISTE */}
      {tab === 'liste' && (
        <div>
          <div style={{ marginBottom: 14 }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par nom, email ou BCE..."
              style={{ ...inputStyle, maxWidth: 400 }} />
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#5e5c56' }}>Chargement...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#e8e6e0', marginBottom: 8 }}>
                Aucun client encore
              </div>
              <div style={{ fontSize: 13, color: '#5e5c56', marginBottom: 20 }}>
                Invitez votre premier client — il recevra un email et pourra se connecter immediatement
              </div>
              <button onClick={() => setTab('inviter')} style={{
                padding: '10px 24px', borderRadius: 8, border: 'none',
                background: 'rgba(198,163,78,.15)', color: GOLD,
                cursor: 'pointer', fontSize: 13, fontWeight: 700,
              }}>+ Inviter un client</button>
            </div>
          ) : (
            <div>
              {filtered.map((client, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '1fr 200px 120px 100px 120px',
                  alignItems: 'center', gap: 12, padding: '14px 16px', marginBottom: 8,
                  background: 'rgba(255,255,255,.02)', borderRadius: 10,
                  border: `1px solid ${client.actif !== false ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.02)'}`,
                  opacity: client.actif !== false ? 1 : 0.5,
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{client.nom || 'Sans nom'}</div>
                    <div style={{ fontSize: 12, color: '#9e9b93', marginTop: 2 }}>
                      {client.email} {client.bce ? ` · ${client.bce}` : ''}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#9e9b93' }}>
                    {client.invited_at ? new Date(client.invited_at).toLocaleDateString('fr-BE') : 'N/A'}
                  </div>
                  <div>
                    <span style={{
                      fontSize: 10, padding: '3px 8px', borderRadius: 6,
                      background: 'rgba(198,163,78,.12)', color: GOLD,
                    }}>{(client.plan || 'starter').toUpperCase()}</span>
                  </div>
                  <div>
                    <span style={{
                      fontSize: 10, padding: '3px 8px', borderRadius: 6,
                      background: client.actif !== false ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.12)',
                      color: client.actif !== false ? GREEN : RED,
                    }}>{client.actif !== false ? 'ACTIF' : 'DESACTIVE'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => {
                      setForm({ email: client.email, nom: client.nom, bce: client.bce || '', plan: client.plan || 'starter', message_perso: '' });
                      setTab('inviter');
                    }} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${GOLD}40`, background: 'transparent', color: GOLD, cursor: 'pointer', fontSize: 11 }}>
                      Renvoyer
                    </button>
                    {client.actif !== false && (
                      <button onClick={() => handleDeactivate(client.id, client.nom)}
                        style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${RED}40`, background: 'transparent', color: RED, cursor: 'pointer', fontSize: 11 }}>
                        Desact.
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* INVITER */}
      {tab === 'inviter' && (
        <div style={{ maxWidth: 600 }}>
          <div style={{ padding: 20, background: 'rgba(198,163,78,.04)', borderRadius: 12, border: '1px solid rgba(198,163,78,.15)', marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: GOLD, fontWeight: 600, marginBottom: 6 }}>Comment ca marche</div>
            <div style={{ fontSize: 12, color: '#9e9b93', lineHeight: 1.7 }}>
              1. Vous entrez l'email et le nom du client<br />
              2. Le client recoit un email avec un lien de connexion<br />
              3. Il cree son mot de passe et arrive sur SON espace vierge<br />
              4. Il saisit ses employes, fait ses fiches de paie, Dimona...<br />
              5. A chaque reconnexion il retrouve TOUT son travail
            </div>
          </div>

          {result && (
            <div style={{
              padding: 14, borderRadius: 10, marginBottom: 16,
              background: result.success ? 'rgba(34,197,94,.08)' : 'rgba(239,68,68,.08)',
              border: `1px solid ${result.success ? GREEN : RED}30`,
            }}>
              <div style={{ fontSize: 13, color: result.success ? GREEN : RED, fontWeight: 600 }}>
                {result.success ? '✅' : '❌'} {result.message}
              </div>
            </div>
          )}

          <form onSubmit={handleInvite}>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: '#9e9b93', display: 'block', marginBottom: 6 }}>
                  Email du client *
                </label>
                <input type="email" required value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="fiduciaire@exemple.be"
                  style={inputStyle} />
              </div>

              <div>
                <label style={{ fontSize: 11, color: '#9e9b93', display: 'block', marginBottom: 6 }}>
                  Nom de l'entreprise *
                </label>
                <input required value={form.nom}
                  onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Fiduciaire Dupont SPRL"
                  style={inputStyle} />
              </div>

              <div>
                <label style={{ fontSize: 11, color: '#9e9b93', display: 'block', marginBottom: 6 }}>
                  Numero BCE (optionnel)
                </label>
                <input value={form.bce}
                  onChange={e => setForm(f => ({ ...f, bce: e.target.value }))}
                  placeholder="BE 0123.456.789"
                  style={inputStyle} />
              </div>

              <div>
                <label style={{ fontSize: 11, color: '#9e9b93', display: 'block', marginBottom: 6 }}>
                  Plan tarifaire
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {PLANS.map(plan => (
                    <div key={plan.id} onClick={() => setForm(f => ({ ...f, plan: plan.id }))}
                      style={{
                        padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                        border: `1px solid ${form.plan === plan.id ? GOLD : 'rgba(255,255,255,.08)'}`,
                        background: form.plan === plan.id ? 'rgba(198,163,78,.1)' : 'rgba(255,255,255,.02)',
                      }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: form.plan === plan.id ? GOLD : '#e8e6e0' }}>{plan.label}</div>
                      <div style={{ fontSize: 11, color: GOLD, marginTop: 2 }}>{plan.price}</div>
                      <div style={{ fontSize: 10, color: '#5e5c56', marginTop: 2 }}>{plan.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, color: '#9e9b93', display: 'block', marginBottom: 6 }}>
                  Message personnalise (optionnel)
                </label>
                <textarea value={form.message_perso}
                  onChange={e => setForm(f => ({ ...f, message_perso: e.target.value }))}
                  placeholder="Bonjour, voici votre acces a Aureus Social Pro..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              <button type="submit" disabled={inviting} style={{
                padding: '12px 24px', borderRadius: 10, border: 'none',
                background: inviting ? 'rgba(255,255,255,.05)' : 'rgba(198,163,78,.2)',
                color: inviting ? '#5e5c56' : GOLD,
                cursor: inviting ? 'not-allowed' : 'pointer',
                fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
              }}>
                {inviting ? 'Envoi en cours...' : '✉️ Envoyer l'invitation'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
