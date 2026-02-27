"use client";
// ═══════════════════════════════════════════════════════════
// Item #29 — TABLEAU DE BORD DPO / RGPD
// Registre traitements + PDF Downloads + Droits + Trust Center
// ═══════════════════════════════════════════════════════════
import React, { useState } from 'react';

const GOLD='#c6a34e',GREEN='#22c55e',RED='#ef4444',BLUE='#3b82f6';

const TREATMENTS = [
  { name: 'Gestion de la paie', base: 'Exécution du contrat', retention: '10 ans', data: 'Identité, NISS, IBAN, salaire', status: 'conforme' },
  { name: 'Déclarations ONSS', base: 'Obligation légale', retention: '10 ans', data: 'NISS, cotisations, prestations', status: 'conforme' },
  { name: 'Registre du personnel', base: 'Obligation légale', retention: '5 ans après sortie', data: 'Identité, contrat, dates', status: 'conforme' },
  { name: 'Portail employé', base: 'Intérêt légitime', retention: 'Durée du contrat', data: 'Email, fiches de paie, congés', status: 'conforme' },
  { name: 'Médecine du travail', base: 'Obligation légale', retention: '40 ans', data: 'Données de santé (cat. spéciale)', status: 'attention' },
  { name: 'Logs d\'accès', base: 'Intérêt légitime', retention: '1 an', data: 'IP, user-agent, timestamps', status: 'conforme' },
];

const PDF_DOCS = [
  { id: 'rgpd', icon: '🔒', label: { fr: 'Pack RGPD / DPO', nl: 'AVG/DPO Pakket', en: 'GDPR/DPO Pack', de: 'DSGVO/DSB Paket' }, file: 'Aureus-RGPD-Pack' },
  { id: 'iso', icon: '🏛️', label: { fr: 'ISO 27001 SMSI', nl: 'ISO 27001 ISMS', en: 'ISO 27001 ISMS', de: 'ISO 27001 ISMS' }, file: 'Aureus-ISO27001' },
  { id: 'soc2', icon: '🔐', label: { fr: 'SOC 2 Type II', nl: 'SOC 2 Type II', en: 'SOC 2 Type II', de: 'SOC 2 Typ II' }, file: 'Aureus-SOC2-TypeII' },
  { id: 'bb', icon: '🐛', label: { fr: 'Bug Bounty', nl: 'Bug Bounty', en: 'Bug Bounty', de: 'Bug Bounty' }, file: 'Aureus-BugBounty' },
];

const LANGS = [
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
  { code: 'nl', label: 'NL', flag: '🇧🇪' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'de', label: 'DE', flag: '🇩🇪' },
];

export function DPODashboard() {
  const [sel, setSel] = useState(null);
  const [tab, setTab] = useState('registre');
  const [dlLang, setDlLang] = useState('fr');

  const stats = { traitements: TREATMENTS.length, conformes: TREATMENTS.filter(t => t.status === 'conforme').length, incidents: 0, droitsExerces: 2 };
  const cs = { padding: '20px', borderRadius: '14px', border: '1px solid rgba(198,163,78,.06)', background: 'rgba(255,255,255,.01)' };
  const ts = (a) => ({ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: a ? 600 : 400, fontFamily: 'inherit', background: a ? 'rgba(198,163,78,.15)' : 'rgba(255,255,255,.03)', color: a ? GOLD : '#9e9b93', transition: 'all .3s' });

  const handleDL = (doc, lang) => { const a = document.createElement('a'); a.href = `/docs/compliance/${doc.file}-${lang.toUpperCase()}.pdf`; a.download = `${doc.file}-${lang.toUpperCase()}.pdf`; a.target = '_blank'; a.click(); };

  return React.createElement('div', { style: { maxWidth: 960, margin: '0 auto' } },
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }, className: 'aureus-kpi-grid' },
      [{ l: 'Traitements', v: stats.traitements, c: BLUE }, { l: 'Conformes', v: stats.conformes + '/' + stats.traitements, c: GREEN }, { l: 'Incidents', v: stats.incidents, c: stats.incidents > 0 ? RED : GREEN }, { l: 'Droits exercés', v: stats.droitsExerces, c: GOLD }].map((k, i) =>
        React.createElement('div', { key: i, style: cs },
          React.createElement('div', { style: { fontSize: 10, color: '#555', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 } }, k.l),
          React.createElement('div', { style: { fontSize: 24, fontWeight: 300, color: k.c } }, k.v)))
    ),
    React.createElement('div', { style: { display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' } },
      [{ id: 'registre', l: '📋 Registre Art.30' }, { id: 'documents', l: '📄 Documents PDF' }, { id: 'droits', l: '👤 Droits' }, { id: 'trustcenter', l: '🛡️ Trust Center' }].map(t =>
        React.createElement('button', { key: t.id, onClick: () => setTab(t.id), style: ts(tab === t.id) }, t.l))
    ),

    tab === 'registre' && React.createElement('div', { style: cs },
      React.createElement('div', { style: { fontSize: 11, color: '#555', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 16 } }, 'Registre des traitements (Art. 30 RGPD)'),
      React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse' } },
        React.createElement('thead', null, React.createElement('tr', { style: { borderBottom: '1px solid rgba(198,163,78,.08)' } },
          ['Traitement', 'Base légale', 'Rétention', 'Status'].map((h, i) => React.createElement('th', { key: i, style: { padding: '10px 12px', textAlign: 'left', fontSize: 10, color: GOLD, letterSpacing: '1px', textTransform: 'uppercase' } }, h)))),
        React.createElement('tbody', null, TREATMENTS.map((t, i) => React.createElement('tr', { key: i, style: { borderBottom: '1px solid rgba(255,255,255,.02)', cursor: 'pointer' }, onClick: () => setSel(t) },
          React.createElement('td', { style: { padding: '10px 12px', fontSize: 13, color: '#e5e5e5' } }, t.name),
          React.createElement('td', { style: { padding: '10px 12px', fontSize: 12, color: '#999' } }, t.base),
          React.createElement('td', { style: { padding: '10px 12px', fontSize: 12, color: '#999' } }, t.retention),
          React.createElement('td', { style: { padding: '10px 12px' } }, React.createElement('span', { style: { padding: '3px 10px', borderRadius: 50, fontSize: 10, fontWeight: 600, background: t.status === 'conforme' ? 'rgba(34,197,94,.1)' : 'rgba(234,179,8,.1)', color: t.status === 'conforme' ? GREEN : '#eab308' } }, t.status === 'conforme' ? '✓ Conforme' : '⚠ Attention')))))),
      sel && React.createElement('div', { style: { marginTop: 16, padding: 16, background: 'rgba(198,163,78,.04)', borderRadius: 12, border: '1px solid rgba(198,163,78,.08)' } },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 } },
          React.createElement('div', { style: { fontSize: 14, fontWeight: 600, color: GOLD } }, sel.name),
          React.createElement('button', { onClick: () => setSel(null), style: { background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 16 } }, '✕')),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 } },
          React.createElement('div', null, React.createElement('div', { style: { color: '#666' } }, 'Base légale'), React.createElement('div', { style: { color: '#e5e5e5' } }, sel.base)),
          React.createElement('div', null, React.createElement('div', { style: { color: '#666' } }, 'Rétention'), React.createElement('div', { style: { color: '#e5e5e5' } }, sel.retention)),
          React.createElement('div', { style: { gridColumn: '1/-1' } }, React.createElement('div', { style: { color: '#666' } }, 'Données'), React.createElement('div', { style: { color: '#e5e5e5' } }, sel.data))))
    ),

    tab === 'documents' && React.createElement('div', { style: cs },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 } },
        React.createElement('div', { style: { fontSize: 11, color: '#555', letterSpacing: '1.5px', textTransform: 'uppercase' } }, 'Documents de conformité'),
        React.createElement('div', { style: { display: 'flex', gap: 4 } },
          LANGS.map(l => React.createElement('button', { key: l.code, onClick: () => setDlLang(l.code), style: { padding: '5px 10px', borderRadius: 6, border: dlLang === l.code ? '1px solid rgba(198,163,78,.3)' : '1px solid rgba(255,255,255,.06)', background: dlLang === l.code ? 'rgba(198,163,78,.12)' : 'transparent', color: dlLang === l.code ? GOLD : '#666', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' } }, l.flag + ' ' + l.label)))),
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }, className: 'aureus-grid-1' },
        PDF_DOCS.map(doc => React.createElement('div', { key: doc.id, onClick: () => handleDL(doc, dlLang), style: { padding: 20, borderRadius: 12, border: '1px solid rgba(198,163,78,.06)', background: 'rgba(255,255,255,.01)', cursor: 'pointer', transition: 'all .3s' }, className: 'hover-glow' },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
            React.createElement('div', { style: { fontSize: 28 } }, doc.icon),
            React.createElement('div', { style: { flex: 1 } },
              React.createElement('div', { style: { fontSize: 14, fontWeight: 600, color: '#e5e5e5', marginBottom: 2 } }, doc.label[dlLang]),
              React.createElement('div', { style: { fontSize: 11, color: '#666' } }, doc.file + '-' + dlLang.toUpperCase() + '.pdf')),
            React.createElement('div', { style: { fontSize: 20, color: GOLD } }, '⬇'))))),
      React.createElement('div', { style: { marginTop: 16, padding: 12, background: 'rgba(59,130,246,.06)', borderRadius: 10, fontSize: 11, color: '#7ba3d6' } }, '💡 Documents confidentiels destinés aux auditeurs, DPO et direction.')
    ),

    tab === 'droits' && React.createElement('div', { style: cs },
      React.createElement('div', { style: { fontSize: 11, color: '#555', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 16 } }, 'Exercice des droits (Art. 15-22 RGPD)'),
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }, className: 'aureus-grid-1' },
        [{ i: '👁️', a: '15', t: 'Droit d\'accès', d: 'Accès à toutes les données via Portail Employé' }, { i: '✏️', a: '16', t: 'Rectification', d: 'Modification données incorrectes sous 30 jours' }, { i: '🗑️', a: '17', t: 'Effacement', d: 'Suppression sauf obligations légales' }, { i: '⏸️', a: '18', t: 'Limitation', d: 'Limitation du traitement en cas de contestation' }, { i: '📦', a: '20', t: 'Portabilité', d: 'Export JSON complet en un clic' }, { i: '🚫', a: '21', t: 'Opposition', d: 'Opposition au traitement (intérêt légitime)' }].map((d, idx) =>
          React.createElement('div', { key: idx, style: { padding: 16, borderRadius: 10, background: 'rgba(198,163,78,.03)', border: '1px solid rgba(198,163,78,.06)' } },
            React.createElement('div', { style: { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 } },
              React.createElement('span', { style: { fontSize: 20 } }, d.i),
              React.createElement('div', { style: { flex: 1 } },
                React.createElement('div', { style: { fontSize: 13, fontWeight: 600, color: '#e5e5e5' } }, d.t),
                React.createElement('div', { style: { fontSize: 10, color: GOLD } }, 'Art. ' + d.a)),
              React.createElement('span', { style: { fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(34,197,94,.1)', color: GREEN, fontWeight: 600 } }, '✓')),
            React.createElement('div', { style: { fontSize: 11, color: '#999' } }, d.d)))),
      React.createElement('div', { style: { marginTop: 16, fontSize: 12, color: '#666' } }, 'Contact DPO : ', React.createElement('span', { style: { color: GOLD } }, 'dpo@aureussocial.be'), ' — Délai : 30 jours')
    ),

    tab === 'trustcenter' && React.createElement('div', { style: { ...cs, textAlign: 'center', padding: 40 } },
      React.createElement('div', { style: { fontSize: 48, marginBottom: 16 } }, '🛡️'),
      React.createElement('div', { style: { fontSize: 18, fontWeight: 600, color: '#e5e5e5', marginBottom: 8 } }, 'Trust Center Public'),
      React.createElement('div', { style: { fontSize: 13, color: '#999', marginBottom: 24, maxWidth: 500, margin: '0 auto 24px' } }, 'Page publique présentant vos mesures de sécurité aux prospects sans détails sensibles.'),
      React.createElement('a', { href: '/compliance', target: '_blank', style: { display: 'inline-block', padding: '14px 32px', borderRadius: 12, background: 'linear-gradient(135deg,#c6a34e,#8b6914)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 14 } }, '🌐 Ouvrir le Trust Center'),
      React.createElement('div', { style: { marginTop: 12, fontSize: 11, color: '#666' } }, 'app.aureussocial.be/compliance — FR / NL / EN / DE'))
  );
}

export default DPODashboard;
