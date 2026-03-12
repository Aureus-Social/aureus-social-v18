'use client';
// ═══ AUREUS SOCIAL PRO — Module Facturation Clients ═══
// Création factures, numérotation auto, TVA, PDF jsPDF, relances intégrées

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/app/lib/supabase';

// ── Helpers ───────────────────────────────────────────
const GOLD = '#c6a34e';
const fmt = v => new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(v || 0);
const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-BE') : '—';
const today = () => new Date().toISOString().split('T')[0];
const addDays = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0]; };
const daysSince = d => d ? Math.floor((Date.now() - new Date(d)) / 86400000) : 0;
const uid = () => `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

const TVA_RATES = [
  { v: 0, l: '0% — Exonéré (Art. 44 CTVA)' },
  { v: 6, l: '6% — Taux réduit' },
  { v: 12, l: '12% — Taux intermédiaire' },
  { v: 21, l: '21% — Taux normal' },
];

const ECHEANCES = [
  { v: 0, l: 'Paiement immédiat' },
  { v: 15, l: '15 jours' },
  { v: 30, l: '30 jours (standard)' },
  { v: 45, l: '45 jours' },
  { v: 60, l: '60 jours (max légal B2B)' },
];

const NIVEAUX_RELANCE = {
  15: { label: 'Rappel amical', color: '#eab308', emoji: '🟡' },
  30: { label: 'Rappel ferme', color: '#f97316', emoji: '🟠' },
  45: { label: 'Mise en demeure', color: '#ef4444', emoji: '🔴' },
};

// ── Composants UI ─────────────────────────────────────
function C({ children, style }) {
  return <div style={{ background: 'linear-gradient(145deg,#0e1220,#131829)', border: '1px solid rgba(139,115,60,.12)', borderRadius: 14, padding: 20, ...style }}>{children}</div>;
}
function ST({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 14 }}>{children}</div>;
}
function Inp({ label, value, onChange, type = 'text', options, span, required, placeholder, min, step }) {
  const style = { gridColumn: span === 2 ? 'span 2' : undefined };
  const base = { width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid rgba(198,163,78,.12)', background: 'rgba(0,0,0,.3)', color: '#e8e6e0', fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };
  return (
    <div style={style}>
      <div style={{ fontSize: 10, color: '#5e5c56', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}{required && <span style={{ color: '#f87171' }}> *</span>}</div>
      {options ? (
        <select value={value} onChange={e => onChange(e.target.value)} style={base}>
          {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      ) : (
        <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} min={min} step={step} style={base} />
      )}
    </div>
  );
}
function Btn({ children, onClick, disabled, variant = 'primary', style: s }) {
  const base = { padding: '9px 18px', borderRadius: 9, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', transition: 'opacity .15s', opacity: disabled ? 0.4 : 1, ...s };
  const colors = {
    primary: { background: `linear-gradient(135deg,${GOLD},#a68a3c)`, color: '#0c0b09' },
    outline: { background: 'transparent', border: `1px solid rgba(198,163,78,.2)`, color: GOLD },
    danger: { background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.2)', color: '#f87171' },
    ghost: { background: 'rgba(255,255,255,.04)', color: '#9e9b93' },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...colors[variant] }}>{children}</button>;
}

// ── Numéro de facture auto ─────────────────────────────
function nextNumero(factures) {
  const year = new Date().getFullYear();
  const existing = factures
    .map(f => f.numero)
    .filter(n => n && n.startsWith(`FAC-${year}-`))
    .map(n => parseInt(n.split('-')[2] || '0', 10))
    .filter(n => !isNaN(n));
  const max = existing.length ? Math.max(...existing) : 0;
  return `FAC-${year}-${String(max + 1).padStart(3, '0')}`;
}

// ── Génération PDF facture ─────────────────────────────
async function genFacturePDF(facture, co) {
  if (typeof window === 'undefined') return;
  if (!window.jspdf) {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const W = 210, H = 297;

  // Header dark band
  doc.setFillColor(12, 11, 9);
  doc.rect(0, 0, W, 40, 'F');
  doc.setFillColor(198, 163, 78);
  doc.rect(0, 40, W, 1.5, 'F');

  // Logo text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18); doc.setTextColor(198, 163, 78);
  doc.text('AUREUS SOCIAL PRO', 15, 18);
  doc.setFontSize(8); doc.setTextColor(100, 90, 70);
  doc.text('Secrétariat Social Digital — BCE 1028.230.781', 15, 25);

  // Facture badge
  doc.setFillColor(198, 163, 78, 20);
  doc.setFontSize(14); doc.setTextColor(198, 163, 78);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURE', W - 15, 18, { align: 'right' });
  doc.setFontSize(11); doc.setTextColor(160, 140, 100);
  doc.text(facture.numero, W - 15, 26, { align: 'right' });
  doc.setFontSize(9); doc.setTextColor(80, 75, 65);
  doc.text(`Date: ${fmtDate(facture.dateFacture)}`, W - 15, 33, { align: 'right' });
  doc.text(`Échéance: ${fmtDate(facture.dateEcheance)}`, W - 15, 38, { align: 'right' });

  // Émetteur / Client
  let y = 52;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(198, 163, 78);
  doc.text('ÉMETTEUR', 15, y);
  doc.text('CLIENT', 110, y);
  y += 5;
  doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 58, 54);
  const emetLines = [co.name || 'Aureus IA SPRL', `BCE: ${co.vat || '1028.230.781'}`, co.address || 'Place Marcel Broodthaers 8', '1060 Saint-Gilles, Bruxelles', `IBAN: ${co.iban || 'BE—'}`, co.email || 'info@aureussocial.be'];
  emetLines.forEach(l => { doc.text(l, 15, y); y += 4.5; });
  let yc = 57;
  const clientLines = [facture.clientNom, facture.clientBce ? `BCE: ${facture.clientBce}` : '', facture.clientAdresse || '', facture.clientEmail || '', facture.clientIban ? `IBAN: ${facture.clientIban}` : ''].filter(Boolean);
  clientLines.forEach(l => { doc.text(l, 110, yc); yc += 4.5; });

  // Séparateur
  y = Math.max(y, yc) + 4;
  doc.setDrawColor(198, 163, 78, 30); doc.line(15, y, W - 15, y);
  y += 6;

  // En-tête tableau lignes
  doc.setFillColor(20, 18, 15);
  doc.rect(15, y - 4, W - 30, 8, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(198, 163, 78);
  doc.text('Description', 18, y); doc.text('Qté', 130, y, { align: 'right' }); doc.text('Prix unit.', 155, y, { align: 'right' }); doc.text('Total HT', W - 15, y, { align: 'right' });
  y += 6;

  // Lignes
  doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 58, 54);
  (facture.lignes || []).forEach((l, i) => {
    if (i % 2 === 0) { doc.setFillColor(20, 20, 25); doc.rect(15, y - 3.5, W - 30, 7, 'F'); }
    const total = (l.qte || 1) * (l.prix || 0);
    doc.text(l.desc || '—', 18, y); doc.text(String(l.qte || 1), 130, y, { align: 'right' }); doc.text(fmt(l.prix), 155, y, { align: 'right' }); doc.text(fmt(total), W - 15, y, { align: 'right' });
    y += 7;
  });

  y += 3;
  doc.setDrawColor(198, 163, 78, 20); doc.line(15, y, W - 15, y); y += 6;

  // Totaux
  const htTotal = (facture.lignes || []).reduce((a, l) => a + (l.qte || 1) * (l.prix || 0), 0);
  const tva = htTotal * (facture.tvaRate || 21) / 100;
  const ttc = htTotal + tva;

  const totaux = [
    { l: 'Total HT', v: fmt(htTotal) },
    { l: `TVA ${facture.tvaRate || 21}%`, v: fmt(tva) },
  ];
  totaux.forEach(t => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(80, 75, 65);
    doc.text(t.l, W - 60, y); doc.text(t.v, W - 15, y, { align: 'right' }); y += 6;
  });

  // NET À PAYER
  doc.setFillColor(198, 163, 78);
  doc.rect(W - 80, y - 4, 65, 10, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(12, 11, 9);
  doc.text('NET À PAYER', W - 78, y + 2.5);
  doc.text(fmt(ttc), W - 17, y + 2.5, { align: 'right' });
  y += 16;

  // Conditions de paiement
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(198, 163, 78);
  doc.text('CONDITIONS DE PAIEMENT', 15, y); y += 5;
  doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 75, 65);
  doc.text(`Paiement par virement avant le ${fmtDate(facture.dateEcheance)}`, 15, y); y += 4.5;
  if (co.iban) doc.text(`IBAN: ${co.iban} — Communication: ${facture.numero}`, 15, y); y += 4.5;
  doc.text('En cas de retard: intérêts légaux (Loi 02/08/2002) + indemnité forfaitaire 40€', 15, y); y += 10;

  // Footer
  doc.setFillColor(12, 11, 9); doc.rect(0, H - 18, W, 18, 'F');
  doc.setFillColor(198, 163, 78); doc.rect(0, H - 18, W, 0.8, 'F');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(80, 75, 65);
  doc.text(`${co.name || 'Aureus IA SPRL'} · BCE ${co.vat || '1028.230.781'} · Assujetti TVA`, W / 2, H - 11, { align: 'center' });
  doc.text(`${co.address || 'Place Marcel Broodthaers 8, 1060 Saint-Gilles'} · ${co.email || 'info@aureussocial.be'}`, W / 2, H - 7, { align: 'center' });

  doc.save(`${facture.numero}.pdf`);
}

// ── Formulaire nouvelle facture ────────────────────────
function FormulaireFacture({ factures, co, clients, onSave, onClose }) {
  const [f, setF] = useState({
    numero: nextNumero(factures),
    dateFacture: today(),
    dateEcheance: addDays(today(), 30),
    echeanceDays: 30,
    tvaRate: 21,
    clientNom: '',
    clientEmail: '',
    clientBce: '',
    clientAdresse: '',
    clientIban: '',
    lignes: [{ id: uid(), desc: 'Gestion sociale mensuelle', qte: 1, prix: '' }],
    notes: '',
  });

  const setF_ = (k, v) => setF(p => ({ ...p, [k]: v }));
  const htTotal = f.lignes.reduce((a, l) => a + (+(l.qte || 1)) * (+(l.prix || 0)), 0);
  const tva = htTotal * f.tvaRate / 100;
  const ttc = htTotal + tva;

  const addLigne = () => setF(p => ({ ...p, lignes: [...p.lignes, { id: uid(), desc: '', qte: 1, prix: '' }] }));
  const delLigne = id => setF(p => ({ ...p, lignes: p.lignes.filter(l => l.id !== id) }));
  const updLigne = (id, k, v) => setF(p => ({ ...p, lignes: p.lignes.map(l => l.id === id ? { ...l, [k]: v } : l) }));

  const handleEcheance = (days) => {
    setF(p => ({ ...p, echeanceDays: +days, dateEcheance: addDays(p.dateFacture, +days) }));
  };
  const handleDateFacture = (d) => {
    setF(p => ({ ...p, dateFacture: d, dateEcheance: addDays(d, p.echeanceDays) }));
  };

  const fillFromClient = (clientId) => {
    const c = (clients || []).find(c => c.id === clientId);
    if (!c) return;
    setF(p => ({ ...p, clientNom: c.name || c.nom || '', clientEmail: c.email || '', clientBce: c.bce || c.vat || '', clientAdresse: c.address || c.adresse || '' }));
  };

  const canSave = f.clientNom && f.lignes.some(l => l.desc && l.prix > 0);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#0e0d0b', borderRadius: 16, border: '1px solid rgba(198,163,78,.15)', width: '100%', maxWidth: 760, padding: 28, margin: '20px auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#e8e6e0', fontFamily: "'Cormorant Garamond',serif" }}>Nouvelle facture</div>
            <div style={{ fontSize: 11, color: '#5e5c56', marginTop: 2 }}>Réf: {f.numero}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#5e5c56', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          {/* Info facture */}
          <C>
            <ST>Informations facture</ST>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Inp label="Numéro" value={f.numero} onChange={v => setF_('numero', v)} required />
              <Inp label="Date facture" type="date" value={f.dateFacture} onChange={handleDateFacture} required />
              <Inp label="Délai paiement" value={f.echeanceDays} onChange={handleEcheance} options={ECHEANCES.map(e => ({ v: e.v, l: e.l }))} />
              <Inp label="Échéance" type="date" value={f.dateEcheance} onChange={v => setF_('dateEcheance', v)} />
              <Inp label="TVA" value={f.tvaRate} onChange={v => setF_('tvaRate', +v)} options={TVA_RATES.map(t => ({ v: t.v, l: t.l }))} span={2} />
            </div>
          </C>

          {/* Client */}
          <C>
            <ST>Client</ST>
            {clients?.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <Inp label="Sélectionner un client existant" value="" onChange={fillFromClient}
                  options={[{ v: '', l: '— Choisir —' }, ...(clients || []).map(c => ({ v: c.id, l: c.name || c.nom || c.id }))]} />
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Inp label="Nom / Société" value={f.clientNom} onChange={v => setF_('clientNom', v)} required span={2} />
              <Inp label="Email" type="email" value={f.clientEmail} onChange={v => setF_('clientEmail', v)} />
              <Inp label="BCE / TVA" value={f.clientBce} onChange={v => setF_('clientBce', v)} />
              <Inp label="Adresse" value={f.clientAdresse} onChange={v => setF_('clientAdresse', v)} span={2} />
            </div>
          </C>
        </div>

        {/* Lignes */}
        <C style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <ST>Lignes de facturation</ST>
            <Btn onClick={addLigne} variant="outline" style={{ fontSize: 11, padding: '5px 12px' }}>+ Ligne</Btn>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 100px 90px 32px', gap: 6, marginBottom: 6 }}>
            {['Description', 'Qté', 'Prix unit.', 'Total HT', ''].map((h, i) => (
              <div key={i} style={{ fontSize: 9, color: '#5e5c56', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{h}</div>
            ))}
          </div>
          {f.lignes.map(l => (
            <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 100px 90px 32px', gap: 6, marginBottom: 6, alignItems: 'center' }}>
              <input value={l.desc} onChange={e => updLigne(l.id, 'desc', e.target.value)} placeholder="Description prestation"
                style={{ padding: '7px 9px', borderRadius: 6, border: '1px solid rgba(198,163,78,.12)', background: 'rgba(0,0,0,.3)', color: '#e8e6e0', fontSize: 12, fontFamily: 'inherit' }} />
              <input type="number" value={l.qte} min="1" onChange={e => updLigne(l.id, 'qte', e.target.value)}
                style={{ padding: '7px 9px', borderRadius: 6, border: '1px solid rgba(198,163,78,.12)', background: 'rgba(0,0,0,.3)', color: '#e8e6e0', fontSize: 12, fontFamily: 'inherit', textAlign: 'right' }} />
              <input type="number" value={l.prix} min="0" step="0.01" onChange={e => updLigne(l.id, 'prix', e.target.value)} placeholder="0.00"
                style={{ padding: '7px 9px', borderRadius: 6, border: '1px solid rgba(198,163,78,.12)', background: 'rgba(0,0,0,.3)', color: '#e8e6e0', fontSize: 12, fontFamily: 'inherit', textAlign: 'right' }} />
              <div style={{ fontSize: 12, color: GOLD, fontWeight: 700, textAlign: 'right', padding: '0 4px' }}>{fmt((+l.qte || 1) * (+l.prix || 0))}</div>
              <button onClick={() => delLigne(l.id)} disabled={f.lignes.length === 1}
                style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'rgba(239,68,68,.1)', color: '#f87171', cursor: f.lignes.length === 1 ? 'not-allowed' : 'pointer', fontSize: 14, opacity: f.lignes.length === 1 ? 0.3 : 1 }}>✕</button>
            </div>
          ))}

          {/* Totaux */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', marginTop: 10, paddingTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            {[['Total HT', fmt(htTotal)], [`TVA ${f.tvaRate}%`, fmt(tva)]].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', gap: 20, fontSize: 11, color: '#9e9b93' }}>
                <span>{l}</span><span style={{ minWidth: 80, textAlign: 'right' }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 20, padding: '6px 12px', background: 'linear-gradient(135deg,rgba(198,163,78,.15),rgba(198,163,78,.05))', borderRadius: 7, fontSize: 13, fontWeight: 800, color: GOLD, marginTop: 4 }}>
              <span>NET À PAYER</span><span style={{ minWidth: 80, textAlign: 'right' }}>{fmt(ttc)}</span>
            </div>
          </div>
        </C>

        {/* Notes */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: '#5e5c56', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Notes / Remarques</div>
          <textarea value={f.notes} onChange={e => setF_('notes', e.target.value)} rows={2} placeholder="Conditions particulières, numéro de bon de commande..."
            style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid rgba(198,163,78,.12)', background: 'rgba(0,0,0,.3)', color: '#e8e6e0', fontSize: 12, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Btn onClick={onClose} variant="ghost">Annuler</Btn>
          <Btn onClick={() => genFacturePDF({ ...f, lignes: f.lignes }, co)} variant="outline" disabled={!canSave}>📄 Aperçu PDF</Btn>
          <Btn onClick={() => onSave({ ...f, id: uid(), status: 'envoyee', ttc, ht: htTotal, tva, relances: [], createdAt: new Date().toISOString() })} disabled={!canSave}>✓ Créer la facture</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Ligne facture dans le tableau ─────────────────────
function LigneFacture({ fac, onAction, co }) {
  const jours = daysSince(fac.dateFacture);
  const enRetard = fac.status === 'envoyee' && fac.dateEcheance && new Date() > new Date(fac.dateEcheance);
  const joursRetard = enRetard ? daysSince(fac.dateEcheance) : 0;
  const niveauRelance = Object.keys(NIVEAUX_RELANCE).reverse().find(j => joursRetard >= +j);
  const niveau = niveauRelance ? NIVEAUX_RELANCE[niveauRelance] : null;

  const statusInfo = {
    brouillon: { l: 'Brouillon', c: '#5e5c56' },
    envoyee: { l: enRetard ? `Retard ${joursRetard}j` : 'Envoyée', c: enRetard ? '#f87171' : '#60a5fa' },
    payee: { l: 'Payée ✓', c: '#22c55e' },
    annulee: { l: 'Annulée', c: '#5e5c56' },
  }[fac.status] || { l: fac.status, c: '#9e9b93' };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 90px 90px 100px 140px', gap: 10, alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,.03)', fontSize: 12 }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(198,163,78,.03)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ fontFamily: 'monospace', fontSize: 11, color: GOLD }}>{fac.numero}</div>
      <div>
        <div style={{ color: '#e8e6e0', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fac.clientNom}</div>
        <div style={{ fontSize: 10, color: '#5e5c56', marginTop: 1 }}>{fmtDate(fac.dateFacture)} → {fmtDate(fac.dateEcheance)}</div>
      </div>
      <div style={{ textAlign: 'right', fontWeight: 700, color: GOLD }}>{fmt(fac.ttc)}</div>
      <div style={{ textAlign: 'right', fontSize: 10, color: '#5e5c56' }}>{fmt(fac.ht)} HT</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {niveau && <span>{niveau.emoji}</span>}
        <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: `${statusInfo.c}18`, color: statusInfo.c }}>{statusInfo.l}</span>
      </div>
      <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
        <button onClick={() => onAction('pdf', fac)} title="Télécharger PDF"
          style={{ padding: '4px 8px', borderRadius: 5, border: 'none', background: 'rgba(198,163,78,.1)', color: GOLD, cursor: 'pointer', fontSize: 11 }}>📄</button>
        {fac.status === 'envoyee' && (
          <button onClick={() => onAction('payer', fac)} title="Marquer payée"
            style={{ padding: '4px 8px', borderRadius: 5, border: 'none', background: 'rgba(34,197,94,.1)', color: '#22c55e', cursor: 'pointer', fontSize: 11 }}>✓</button>
        )}
        {enRetard && (
          <button onClick={() => onAction('relance', fac)} title="Envoyer relance"
            style={{ padding: '4px 8px', borderRadius: 5, border: 'none', background: 'rgba(239,68,68,.1)', color: '#f87171', cursor: 'pointer', fontSize: 11 }}>📧</button>
        )}
        <button onClick={() => onAction('annuler', fac)} title="Annuler"
          style={{ padding: '4px 8px', borderRadius: 5, border: 'none', background: 'rgba(255,255,255,.04)', color: '#5e5c56', cursor: 'pointer', fontSize: 11 }}>✕</button>
      </div>
    </div>
  );
}

// ── Page principale ────────────────────────────────────
export default function FacturationClients({ s, d }) {
  const co = s?.co || {};
  const clients = s?.clients || [];

  const [factures, setFactures] = useState([]);
  const [tab, setTab] = useState('toutes');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Charger factures depuis Supabase
  useEffect(() => {
    if (!supabase) return;
    const uid = s?.user?.id;
    if (!uid) return;
    setLoading(true);
    supabase.from('factures').select('*').eq('user_id', uid).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setFactures(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [s?.user?.id]);

  const saveFacture = async (fac) => {
    const uid_ = s?.user?.id;
    const newFac = { ...fac, user_id: uid_ };
    setFactures(p => [newFac, ...p]);
    setShowForm(false);
    if (supabase && uid_) {
      await supabase.from('factures').insert([newFac]);
    }
  };

  const handleAction = async (action, fac) => {
    if (action === 'pdf') { await genFacturePDF(fac, co); return; }
    if (action === 'payer') {
      if (!confirm(`Marquer ${fac.numero} comme payée ?`)) return;
      const updated = { ...fac, status: 'payee', paidAt: new Date().toISOString() };
      setFactures(p => p.map(f => f.id === fac.id ? updated : f));
      if (supabase) await supabase.from('factures').update({ status: 'payee', paid_at: updated.paidAt }).eq('id', fac.id);
    }
    if (action === 'relance') {
      const jours = daysSince(fac.dateEcheance);
      const nv = Object.keys(NIVEAUX_RELANCE).reverse().find(j => jours >= +j);
      const niveau = nv ? NIVEAUX_RELANCE[nv] : { label: 'Rappel', emoji: '📧' };
      alert(`${niveau.emoji} Relance "${niveau.label}" pour ${fac.clientNom}\nMontant: ${fmt(fac.ttc)}\nRetard: ${jours} jours\n\nEmail: ${fac.clientEmail || 'Non renseigné'}\n\nContenu standard envoyé (simulation)`);
      const updated = { ...fac, relances: [...(fac.relances || []), { at: new Date().toISOString(), niveau: niveau.label, jours }] };
      setFactures(p => p.map(f => f.id === fac.id ? updated : f));
    }
    if (action === 'annuler') {
      if (!confirm(`Annuler la facture ${fac.numero} ?`)) return;
      setFactures(p => p.map(f => f.id === fac.id ? { ...f, status: 'annulee' } : f));
      if (supabase) await supabase.from('factures').update({ status: 'annulee' }).eq('id', fac.id);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const envoyees = factures.filter(f => f.status === 'envoyee');
    const payees = factures.filter(f => f.status === 'payee');
    const retard = envoyees.filter(f => f.dateEcheance && new Date() > new Date(f.dateEcheance));
    return {
      totalEnAttente: envoyees.reduce((a, f) => a + (f.ttc || 0), 0),
      totalPaye: payees.reduce((a, f) => a + (f.ttc || 0), 0),
      retardCount: retard.length,
      retardMontant: retard.reduce((a, f) => a + (f.ttc || 0), 0),
      totalFactures: factures.length,
    };
  }, [factures]);

  // Filtrage
  const filtered = useMemo(() => {
    let list = factures;
    if (tab === 'retard') list = list.filter(f => f.status === 'envoyee' && f.dateEcheance && new Date() > new Date(f.dateEcheance));
    else if (tab === 'payees') list = list.filter(f => f.status === 'payee');
    else if (tab === 'envoyees') list = list.filter(f => f.status === 'envoyee');
    if (search) list = list.filter(f => (f.clientNom + f.numero + f.clientEmail).toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [factures, tab, search]);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 700, color: '#e8e6e0', margin: 0 }}>Facturation Clients</h1>
          <div style={{ fontSize: 12, color: '#8b7340', marginTop: 4 }}>{co.name || '—'} · {factures.length} facture{factures.length !== 1 ? 's' : ''}</div>
        </div>
        <Btn onClick={() => setShowForm(true)}>+ Nouvelle facture</Btn>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { icon: '◈', label: 'En attente', value: fmt(stats.totalEnAttente), sub: `${factures.filter(f => f.status === 'envoyee').length} facture(s)`, color: '#60a5fa' },
          { icon: '◉', label: 'Encaissé', value: fmt(stats.totalPaye), sub: `${factures.filter(f => f.status === 'payee').length} facture(s)`, color: '#22c55e' },
          { icon: '▲', label: 'En retard', value: fmt(stats.retardMontant), sub: `${stats.retardCount} facture(s) impayée(s)`, color: stats.retardCount > 0 ? '#f87171' : '#5e5c56' },
          { icon: '◆', label: 'Total émis', value: fmt(factures.reduce((a, f) => a + (f.ttc || 0), 0)), sub: `${stats.totalFactures} factures`, color: GOLD },
        ].map((k, i) => (
          <div key={i} style={{ padding: '18px 20px', background: 'linear-gradient(145deg,#0e1220,#131829)', border: '1px solid rgba(139,115,60,.12)', borderRadius: 14, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 10, right: 14, fontSize: 26, opacity: .06, color: k.color }}>{k.icon}</div>
            <div style={{ fontSize: 9, color: '#5e5c56', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 600, marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 10, color: '#5e5c56', marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Onglets + recherche */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        {[
          { v: 'toutes', l: `Toutes (${factures.length})` },
          { v: 'envoyees', l: `Envoyées (${factures.filter(f => f.status === 'envoyee').length})` },
          { v: 'retard', l: `En retard (${stats.retardCount})` },
          { v: 'payees', l: `Payées (${factures.filter(f => f.status === 'payee').length})` },
        ].map(t => (
          <button key={t.v} onClick={() => setTab(t.v)}
            style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: tab === t.v ? 700 : 400, fontFamily: 'inherit', background: tab === t.v ? 'rgba(198,163,78,.15)' : 'rgba(255,255,255,.03)', color: tab === t.v ? GOLD : '#9e9b93' }}>
            {t.l}
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Rechercher..." 
          style={{ marginLeft: 'auto', padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(198,163,78,.12)', background: 'rgba(0,0,0,.3)', color: '#e8e6e0', fontSize: 11, fontFamily: 'inherit', width: 200 }} />
      </div>

      {/* Tableau */}
      <C style={{ padding: 0, overflow: 'hidden' }}>
        {/* Header colonnes */}
        <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 90px 90px 100px 140px', gap: 10, padding: '10px 14px', background: 'rgba(198,163,78,.04)', borderBottom: '1px solid rgba(198,163,78,.08)' }}>
          {['Numéro', 'Client', 'TTC', 'HT', 'Statut', 'Actions'].map((h, i) => (
            <div key={i} style={{ fontSize: 9, color: '#5e5c56', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', textAlign: i >= 2 && i <= 3 ? 'right' : undefined }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#5e5c56', fontSize: 13 }}>⏳ Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <div style={{ color: '#9e9b93', fontSize: 13, marginBottom: 10 }}>
              {tab === 'retard' ? 'Aucune facture en retard 🎉' : 'Aucune facture dans cette vue'}
            </div>
            <Btn onClick={() => setShowForm(true)} variant="outline" style={{ fontSize: 11 }}>+ Créer une facture</Btn>
          </div>
        ) : (
          filtered.map(fac => <LigneFacture key={fac.id} fac={fac} onAction={handleAction} co={co} />)
        )}
      </C>

      {/* Alerte retards */}
      {stats.retardCount > 0 && tab !== 'retard' && (
        <div onClick={() => setTab('retard')} style={{ marginTop: 14, padding: '12px 16px', background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.15)', borderRadius: 10, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#f87171', fontWeight: 600 }}>🔴 {stats.retardCount} facture{stats.retardCount > 1 ? 's' : ''} en retard — {fmt(stats.retardMontant)} impayé{stats.retardCount > 1 ? 's' : ''}</span>
          <span style={{ fontSize: 11, color: '#f87171' }}>Voir →</span>
        </div>
      )}

      {/* Formulaire */}
      {showForm && <FormulaireFacture factures={factures} co={co} clients={clients} onSave={saveFacture} onClose={() => setShowForm(false)} />}
    </div>
  );
}
