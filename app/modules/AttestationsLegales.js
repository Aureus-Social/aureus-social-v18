"use client";
// ═══════════════════════════════════════════════════════════
// Item #23 — ATTESTATIONS & DOCUMENTS LÉGAUX
// Generate: C4, C131A, attestation employeur, certificat,
// fiche 281.10 — all compliant with Belgian law
// ═══════════════════════════════════════════════════════════
import React, { useState } from 'react';

const GOLD='#c6a34e';

const DOC_TYPES = [
  { id: 'c4', label: 'Formulaire C4', icon: '📄', desc: 'Certificat de chômage — fin de contrat', ref: 'Art. 137 AR 25/11/1991' },
  { id: 'c131a', label: 'Formulaire C131A', icon: '📋', desc: 'Attestation vacances annuelles', ref: 'AR 30/03/1967' },
  { id: 'attestation', label: 'Attestation employeur', icon: '✉️', desc: 'Attestation d\'emploi personnalisée', ref: 'Usage' },
  { id: 'registre', label: 'Registre du personnel', icon: '📒', desc: 'Extrait conforme AR 08/08/1980', ref: 'AR 08/08/1980' },
  { id: '281.10', label: 'Fiche 281.10', icon: '🏛️', desc: 'Fiche fiscale annuelle — SPF Finances', ref: 'AR/CIR 92' },
  { id: 'dimona', label: 'Déclaration DIMONA', icon: '📡', desc: 'DIMONA IN/OUT — déclaration immédiate', ref: 'AR 05/11/2002' },
  { id: 'contrat', label: 'Contrat de travail', icon: '📝', desc: 'CDI/CDD/Intérim — modèle conforme', ref: 'Loi 03/07/1978' },
  { id: 'rupture', label: 'Lettre de rupture', icon: '⚖️', desc: 'Licenciement avec préavis calculé', ref: 'Loi 26/12/2013' },
];

export function AttestationsLegales({ employees = [], onGenerate }) {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedEmp, setSelectedEmp] = useState('');

  const cardStyle = (isSelected) => ({
    padding: '16px', borderRadius: '12px', cursor: 'pointer',
    border: `1px solid ${isSelected ? 'rgba(198,163,78,.3)' : 'rgba(198,163,78,.04)'}`,
    background: isSelected ? 'rgba(198,163,78,.06)' : 'rgba(255,255,255,.01)',
    transition: 'all .3s',
  });

  return React.createElement('div', { style: { maxWidth: 900, margin: '0 auto' } },
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }, className: 'aureus-grid-4' },
      DOC_TYPES.map(doc => React.createElement('div', {
        key: doc.id, style: cardStyle(selectedDoc === doc.id),
        onClick: () => setSelectedDoc(doc.id), className: 'hover-glow'
      },
        React.createElement('div', { style: { fontSize: '24px', marginBottom: '8px' } }, doc.icon),
        React.createElement('div', { style: { fontSize: '12px', fontWeight: 600, color: selectedDoc === doc.id ? GOLD : '#e5e5e5', marginBottom: '4px' } }, doc.label),
        React.createElement('div', { style: { fontSize: '10px', color: '#666', lineHeight: 1.4 } }, doc.desc),
        React.createElement('div', { style: { fontSize: '9px', color: '#444', marginTop: '6px' } }, doc.ref)
      ))
    ),
    selectedDoc && React.createElement('div', { style: { padding: '24px', borderRadius: '16px', border: '1px solid rgba(198,163,78,.08)', background: 'rgba(255,255,255,.015)' } },
      React.createElement('div', { style: { display: 'flex', gap: '16px', alignItems: 'center' } },
        React.createElement('select', {
          value: selectedEmp, onChange: e => setSelectedEmp(e.target.value),
          style: { flex: 1, padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(198,163,78,.1)', background: '#0a0e1a', color: '#e5e5e5', fontSize: '13px' }
        },
          React.createElement('option', { value: '' }, '— Sélectionner un travailleur —'),
          (employees || []).map((emp, i) => React.createElement('option', { key: i, value: emp.id || i }, `${emp.nom || 'Nom'} ${emp.prenom || ''}`))
        ),
        React.createElement('button', {
          onClick: () => onGenerate?.(selectedDoc, selectedEmp),
          disabled: !selectedEmp,
          style: { padding: '12px 28px', borderRadius: '10px', border: 'none', background: selectedEmp ? 'linear-gradient(135deg,#c6a34e,#8b6914)' : '#333', color: selectedEmp ? '#fff' : '#666', fontWeight: 700, cursor: selectedEmp ? 'pointer' : 'not-allowed', fontSize: '13px', whiteSpace: 'nowrap' }
        }, 'Générer ' + (DOC_TYPES.find(d => d.id === selectedDoc)?.label || ''))
      )
    )
  );
}

export default AttestationsLegales;
