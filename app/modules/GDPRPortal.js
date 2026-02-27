"use client";
// ═══════════════════════════════════════════════════════════
// #33 — PORTAIL RGPD / EXERCICE DES DROITS
// Art. 15-22 : Accès, rectification, effacement, limitation,
// portabilité, opposition. Interface employé + gestionnaire.
// ═══════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react';

const GOLD='#c6a34e',GREEN='#22c55e',RED='#ef4444',BLUE='#3b82f6';

const RIGHTS = [
  { id: 'access', art: '15', icon: '👁', label: 'Droit d\'accès', desc: 'Obtenir une copie de toutes vos données personnelles traitées par Aureus Social Pro.', deadline: 30 },
  { id: 'rectify', art: '16', icon: '✏️', label: 'Droit de rectification', desc: 'Corriger des données personnelles inexactes ou incomplètes.', deadline: 30 },
  { id: 'erase', art: '17', icon: '🗑', label: 'Droit à l\'effacement', desc: 'Demander la suppression de vos données (sous réserve des obligations légales de conservation).', deadline: 30 },
  { id: 'restrict', art: '18', icon: '⏸', label: 'Droit à la limitation', desc: 'Limiter le traitement de vos données dans certaines circonstances.', deadline: 30 },
  { id: 'port', art: '20', icon: '📦', label: 'Droit à la portabilité', desc: 'Recevoir vos données dans un format structuré, lisible par machine (JSON/CSV).', deadline: 30 },
  { id: 'oppose', art: '21', icon: '🚫', label: 'Droit d\'opposition', desc: 'Vous opposer au traitement de vos données pour motifs légitimes.', deadline: 30 },
];

const STATUS_COLORS = { pending: GOLD, processing: BLUE, completed: GREEN, rejected: RED };
const STATUS_LABELS = { pending: 'En attente', processing: 'En traitement', completed: 'Traitée', rejected: 'Refusée' };

export function GDPRPortal({ supabase, user, isManager = false }) {
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(null);
  const [formData, setFormData] = useState({ details: '', urgency: 'normal' });
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('rights');

  // Load existing requests
  useEffect(() => {
    if (!supabase || !user) return;
    loadRequests();
  }, [supabase, user]);

  const loadRequests = async () => {
    try {
      const query = isManager
        ? supabase.from('gdpr_requests').select('*').order('created_at', { ascending: false })
        : supabase.from('gdpr_requests').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
      const { data } = await query;
      setRequests(data || []);
    } catch (e) { setRequests([]); }
  };

  const submitRequest = async (rightId) => {
    if (!supabase || !user) return;
    setLoading(true);
    try {
      const right = RIGHTS.find(r => r.id === rightId);
      await supabase.from('gdpr_requests').insert({
        user_id: user.id,
        user_email: user.email,
        right_type: rightId,
        right_article: 'Art. ' + right.art,
        details: formData.details,
        urgency: formData.urgency,
        status: 'pending',
        deadline: new Date(Date.now() + right.deadline * 86400000).toISOString(),
        created_at: new Date().toISOString(),
      });
      setShowForm(null);
      setFormData({ details: '', urgency: 'normal' });
      loadRequests();
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const updateRequestStatus = async (id, newStatus, response = '') => {
    if (!supabase) return;
    await supabase.from('gdpr_requests').update({
      status: newStatus,
      manager_response: response,
      processed_at: newStatus === 'completed' || newStatus === 'rejected' ? new Date().toISOString() : null,
    }).eq('id', id);
    loadRequests();
  };

  // Export all user data (Art. 15 + Art. 20)
  const exportUserData = async () => {
    if (!supabase || !user) return;
    setLoading(true);
    try {
      const tables = ['app_state', 'payroll_history', 'documents', 'activity_log'];
      const exportData = { exported_at: new Date().toISOString(), user_id: user.id, user_email: user.email, data: {} };
      for (const table of tables) {
        const { data } = await supabase.from(table).select('*').eq('user_id', user.id);
        exportData.data[table] = data || [];
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `mes-donnees-aureus-${new Date().toISOString().slice(0, 10)}.json`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const cs = {
    card: { padding: '20px', borderRadius: '14px', border: '1px solid rgba(198,163,78,.06)', background: 'rgba(255,255,255,.01)', cursor: 'pointer', transition: 'all .3s' },
    tabBtn: (a) => ({ padding: '8px 16px', borderRadius: 8, border: 'none', background: a ? 'rgba(198,163,78,.12)' : 'transparent', color: a ? GOLD : '#666', cursor: 'pointer', fontSize: 12, fontWeight: a ? 600 : 400 }),
  };

  return React.createElement('div', { style: { maxWidth: 900, margin: '0 auto' } },
    React.createElement('div', { style: { display: 'flex', gap: 6, marginBottom: 20 } },
      ['rights', 'requests', 'export'].map(t => React.createElement('button', { key: t, style: cs.tabBtn(tab === t), onClick: () => setTab(t) },
        { rights: '🛡️ Mes droits', requests: '📋 Mes demandes (' + requests.length + ')', export: '📦 Exporter mes données' }[t]
      ))
    ),

    // Rights grid
    tab === 'rights' && React.createElement('div', null,
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }, className: 'aureus-grid-3' },
        RIGHTS.map(r => React.createElement('div', {
          key: r.id, style: { ...cs.card, border: showForm === r.id ? '1px solid rgba(198,163,78,.3)' : cs.card.border },
          onClick: () => setShowForm(showForm === r.id ? null : r.id), className: 'hover-glow'
        },
          React.createElement('div', { style: { fontSize: 28, marginBottom: 8 } }, r.icon),
          React.createElement('div', { style: { fontSize: 13, fontWeight: 600, color: '#e5e5e5', marginBottom: 4 } }, r.label),
          React.createElement('div', { style: { fontSize: 10, color: GOLD, marginBottom: 6 } }, 'RGPD Art. ' + r.art),
          React.createElement('div', { style: { fontSize: 11, color: '#666', lineHeight: 1.5 } }, r.desc),
          React.createElement('div', { style: { fontSize: 10, color: '#444', marginTop: 8 } }, 'Délai réponse : ' + r.deadline + ' jours')
        ))
      ),
      showForm && React.createElement('div', { style: { ...cs.card, marginTop: 16, cursor: 'default' } },
        React.createElement('div', { style: { fontSize: 13, fontWeight: 600, color: GOLD, marginBottom: 12 } }, 'Exercer mon ' + RIGHTS.find(r => r.id === showForm)?.label),
        React.createElement('textarea', {
          placeholder: 'Détails de votre demande (optionnel)...',
          value: formData.details, onChange: e => setFormData({ ...formData, details: e.target.value }),
          style: { width: '100%', minHeight: 80, padding: 12, borderRadius: 10, border: '1px solid rgba(198,163,78,.1)', background: '#0a0e1a', color: '#e5e5e5', fontSize: 13, resize: 'vertical', marginBottom: 12 }
        }),
        React.createElement('button', {
          onClick: () => submitRequest(showForm), disabled: loading,
          style: { padding: '12px 28px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#c6a34e,#8b6914)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }
        }, loading ? 'Envoi...' : 'Soumettre ma demande')
      )
    ),

    // Requests list
    tab === 'requests' && React.createElement('div', { style: cs.card },
      requests.length === 0 ?
        React.createElement('div', { style: { textAlign: 'center', padding: 40, color: '#555', fontSize: 13 } }, 'Aucune demande en cours') :
        requests.map((req, i) => React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,.02)' } },
          React.createElement('span', { style: { fontSize: 20, flexShrink: 0 } }, RIGHTS.find(r => r.id === req.right_type)?.icon || '📋'),
          React.createElement('div', { style: { flex: 1 } },
            React.createElement('div', { style: { fontSize: 13, color: '#e5e5e5' } }, RIGHTS.find(r => r.id === req.right_type)?.label || req.right_type),
            React.createElement('div', { style: { fontSize: 10, color: '#555' } }, 'Soumise le ' + new Date(req.created_at).toLocaleDateString('fr-BE')),
            req.details && React.createElement('div', { style: { fontSize: 11, color: '#666', marginTop: 4 } }, req.details)
          ),
          React.createElement('span', { style: { padding: '4px 12px', borderRadius: 50, fontSize: 10, fontWeight: 600, background: (STATUS_COLORS[req.status] || '#555') + '15', color: STATUS_COLORS[req.status] || '#555' } }, STATUS_LABELS[req.status] || req.status),
          isManager && req.status === 'pending' && React.createElement('div', { style: { display: 'flex', gap: 4 } },
            React.createElement('button', { onClick: () => updateRequestStatus(req.id, 'completed'), style: { padding: '6px 12px', borderRadius: 6, border: 'none', background: 'rgba(34,197,94,.1)', color: GREEN, fontSize: 10, cursor: 'pointer', fontWeight: 600 } }, '✓ Traiter'),
            React.createElement('button', { onClick: () => updateRequestStatus(req.id, 'rejected'), style: { padding: '6px 12px', borderRadius: 6, border: 'none', background: 'rgba(239,68,68,.1)', color: RED, fontSize: 10, cursor: 'pointer', fontWeight: 600 } }, '✕ Refuser')
          )
        ))
    ),

    // Data export
    tab === 'export' && React.createElement('div', { style: { ...cs.card, textAlign: 'center', padding: 48 } },
      React.createElement('div', { style: { fontSize: 48, marginBottom: 16 } }, '📦'),
      React.createElement('div', { style: { fontSize: 18, fontWeight: 600, color: '#e5e5e5', marginBottom: 8 } }, 'Portabilité des données (Art. 20)'),
      React.createElement('div', { style: { fontSize: 13, color: '#666', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.6 } },
        'Téléchargez l\'intégralité de vos données personnelles traitées par Aureus Social Pro au format JSON, structuré et lisible par machine.'),
      React.createElement('button', {
        onClick: exportUserData, disabled: loading,
        style: { padding: '14px 36px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#c6a34e,#8b6914)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }
      }, loading ? 'Export en cours...' : '📥 Télécharger mes données'),
      React.createElement('div', { style: { fontSize: 10, color: '#444', marginTop: 16 } }, 'Inclut : données de paie, fiches, documents, historique d\'activité')
    )
  );
}

export default GDPRPortal;
