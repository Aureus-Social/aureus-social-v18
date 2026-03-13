'use client';
// ═══ AUREUS SOCIAL PRO — Alertes Légales Automatiques ═══
// Veille légale temps réel : LOIS_BELGES, échéances, conformité
// Sources : Moniteur Belge · SPF Finances · ONSS · CNT · SPF ETCS

import { useState, useEffect, useCallback, useMemo } from 'react';
import { LOIS_BELGES, RMMMG, TX_ONSS_E, TX_ONSS_W } from '@/app/lib/helpers';

// ── UI ────────────────────────────────────────────────
const GOLD = '#c6a34e';
const fmt = v => new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(v || 0);
const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-BE') : '—';
const today = new Date();
const curMonth = today.getMonth() + 1; // 1-12
const curYear = today.getFullYear();
const curDay = today.getDate();
const quarter = Math.ceil(curMonth / 3);

function C({ children, style }) {
  return <div style={{ background: 'linear-gradient(145deg,#0e1220,#131829)', border: '1px solid rgba(139,115,60,.12)', borderRadius: 14, padding: 20, ...style }}>{children}</div>;
}
function ST({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 14 }}>{children}</div>;
}

const LEVEL_CONFIG = {
  critical: { color: '#f87171', bg: 'rgba(248,113,113,.06)', border: 'rgba(248,113,113,.2)', emoji: '🔴', label: 'Critique' },
  warning:  { color: '#fb923c', bg: 'rgba(251,146,60,.06)',  border: 'rgba(251,146,60,.2)',  emoji: '🟠', label: 'Attention' },
  info:     { color: '#60a5fa', bg: 'rgba(96,165,250,.06)',  border: 'rgba(96,165,250,.2)',  emoji: '🔵', label: 'Info' },
  success:  { color: '#22c55e', bg: 'rgba(34,197,94,.06)',   border: 'rgba(34,197,94,.2)',   emoji: '✅', label: 'OK' },
  update:   { color: GOLD,      bg: 'rgba(198,163,78,.06)',  border: 'rgba(198,163,78,.2)',  emoji: '📋', label: 'Mise à jour' },
};

// ── Moteur d'alertes ──────────────────────────────────
function buildAlertes(s) {
  const alerts = [];
  const ae = (s?.emps || []).filter(e => e.status === 'active' || !e.status);
  const co = s?.co || {};
  const dims = s?.dims || [];
  const pays = s?.pays || [];

  const push = (level, cat, title, msg, detail, action) =>
    alerts.push({ id: `${cat}-${title}`.replace(/\s/g,'-').toLowerCase(), level, cat, title, msg, detail, action, ts: new Date().toISOString() });

  // ═══ 1. ÉCHÉANCES IMMINENTES ═══
  const nextPP5 = new Date(curYear, curMonth - 1, 5); // 5 du mois courant (si passé → mois prochain)
  const pp5 = curDay > 5 ? new Date(curYear, curMonth, 5) : nextPP5;
  const daysPP = Math.ceil((pp5 - today) / 86400000);
  if (daysPP <= 0) push('critical', 'Échéances', 'Précompte professionnel EN RETARD', `Versement PP 274 dû le 5/${curMonth < 10 ? '0' + curMonth : curMonth}/${curYear}`, 'Risque amende SPF Finances + intérêts de retard', 'Virer immédiatement au SPF Finances');
  else if (daysPP <= 5) push('critical', 'Échéances', `PP 274 dans ${daysPP} jour(s)`, `Précompte professionnel à verser avant le ${fmtDate(pp5)}`, 'Amende de 10% + intérêts légaux en cas de retard', 'Préparer le virement PP');
  else if (daysPP <= 15) push('warning', 'Échéances', `PP 274 — J-${daysPP}`, `Versement précompte professionnel avant le ${fmtDate(pp5)}`, 'Art. 412 CIR 1992', 'Planifier le virement');

  const qEnd = new Date(curYear, quarter * 3, 0);
  const daysDmfa = Math.ceil((qEnd - today) / 86400000);
  if (daysDmfa <= 0) push('critical', 'Échéances', 'DmfA EN RETARD', `DmfA T${quarter}/${curYear} non déposée`, 'Amende ONSS Art. 181 CPS : 2.500€–12.500€ par travailleur', 'Déposer DmfA immédiatement');
  else if (daysDmfa <= 7) push('critical', 'Échéances', `DmfA T${quarter} — J-${daysDmfa}`, `Dépôt DmfA trimestrielle avant le ${fmtDate(qEnd)}`, 'ONSS — délai légal impératif', 'Générer et déposer DmfA');
  else if (daysDmfa <= 21) push('warning', 'Échéances', `DmfA T${quarter} — J-${daysDmfa}`, `Dépôt DmfA T${quarter}/${curYear} avant le ${fmtDate(qEnd)}`, 'Loi 27/06/1969 Art. 22', 'Préparer la DmfA');

  // Belcotax (avant 1er mars)
  if (curMonth === 1 || curMonth === 2) {
    const belco = new Date(curYear, 2, 1);
    const daysBelco = Math.ceil((belco - today) / 86400000);
    if (daysBelco <= 14) push('critical', 'Échéances', `Belcotax 281.xx — J-${daysBelco}`, `Fiches fiscales 281.10/281.20 à déposer avant le 1/03/${curYear}`, 'Loi 01/09/2016 — fiche par travailleur', 'Générer fiches Belcotax');
    else push('warning', 'Échéances', `Belcotax 281.xx avant le 1/03/${curYear}`, `Fiches 281.10 (employés) et 281.20 (dirigeants)`, 'SPF Finances — déclaration annuelle obligatoire', 'Préparer Belcotax');
  }

  // Bilan social BNB (avant fin février)
  if (curMonth === 1 || curMonth === 2) {
    const bilan = new Date(curYear, 1, 28);
    const daysBilan = Math.ceil((bilan - today) / 86400000);
    if (daysBilan <= 14) push('warning', 'Échéances', `Bilan social BNB — J-${daysBilan}`, `Dépôt bilan social à la Banque Nationale avant le 28/02/${curYear}`, 'Loi 22/12/1995 — obligatoire si 20 ETP ou plus', 'Préparer bilan social');
  }

  // Congés légaux (juin — solde N-1 à solder)
  if (curMonth === 6) push('info', 'Congés', 'Solde congés N-1 à vérifier', `Fin juin ${curYear} : les congés restants de ${curYear - 1} doivent être soldés`, 'CNT CCT n°103 — report limité', 'Vérifier compteurs congés');

  // ═══ 2. CONFORMITÉ TRAVAILLEURS ═══
  ae.forEach(e => {
    const name = `${e.prenom || e.first || ''} ${e.nom || e.last || ''}`.trim() || `Employé #${(e.id || '').slice(-4)}`;
    const brut = +(e.monthlySalary || e.salaire_brut || 0);

    // NISS manquant
    if (!e.niss) push('critical', 'Conformité', `NISS manquant — ${name}`, 'Dimona impossible sans NISS valide', 'Art. 3 AR 05/11/2002 — amende niveau 4 : 2.500€–5.000€', 'Compléter le dossier');

    // IBAN manquant
    if (!e.iban) push('warning', 'Conformité', `IBAN manquant — ${name}`, 'Virement salaire impossible', 'CCT n°43 — paiement salaire par virement obligatoire pour > 1 travailleur', 'Ajouter IBAN');

    // Salaire sous RMMMG
    if (brut > 0 && brut < RMMMG) push('critical', 'Rémunération', `Salaire sous RMMMG — ${name}`, `${fmt(brut)}/mois < RMMMG ${fmt(RMMMG)}`, `Infraction loi 12/04/1965 sur la protection de la rémunération — risque ONSS + amende SPF ETCS`, 'Corriger le salaire');

    // CDD expiré ou proche
    if (e.endD || e.date_fin) {
      const endDate = new Date(e.endD || e.date_fin);
      const daysEnd = Math.ceil((endDate - today) / 86400000);
      if (daysEnd < 0) push('critical', 'Contrats', `CDD expiré — ${name}`, `CDD terminé le ${fmtDate(e.endD || e.date_fin)} — risque requalification CDI`, 'Art. 10 loi 03/07/1978 — CDD → CDI si prolongé sans renouvellement', 'Renouveler ou régulariser');
      else if (daysEnd <= 14) push('warning', 'Contrats', `CDD expire dans ${daysEnd}j — ${name}`, `Fin de contrat le ${fmtDate(e.endD || e.date_fin)}`, 'Préparer renouvellement ou Dimona OUT', 'Gérer le contrat');
    }

    // Pas de Dimona IN trouvée
    const hasDimona = dims.some(dim => dim.eid === e.id && dim.action === 'IN');
    if (!hasDimona && (e.status === 'active' || !e.status)) push('critical', 'Dimona', `Dimona IN manquante — ${name}`, 'Aucune Dimona IN enregistrée pour ce travailleur', 'Art. 3 AR 05/11/2002 — amende niveau 4 par travailleur non déclaré', 'Déclarer Dimona IN');
  });

  // ═══ 3. CHANGEMENTS LÉGAUX 2026 ═══
  const legal2026 = [
    { title: 'RMMMG 2026 — 2.070,48€/mois', msg: `Salaire minimum interprofessionnel revalorisé à ${fmt(RMMMG)} depuis le 01/01/2026`, detail: 'CNT CCT n°43 révisée — applicable à tous les secteurs sans barème CP spécifique supérieur', level: 'update' },
    { title: 'Indexation 2026 — Coefficient 1,0', msg: 'Coefficient d\'indexation sectoriel applicable selon CP', detail: 'Vérifier barème spécifique de chaque commission paritaire', level: 'info' },
    { title: 'Bonus emploi 2026 revalorisé', msg: 'Seuil bonus emploi (Art. 2756 CIR 1992) revalorisé', detail: 'Rémunération brute imposable max : 3.249,12€/mois pour bonus emploi plein', level: 'update' },
    { title: 'Cotisation spéciale SS 2026', msg: 'Cotisation spéciale sécurité sociale recalculée sur revenus 2025', detail: 'CSSS : 0% (< 18.592€) à 695,50€ (> 61.071€) annuel', level: 'info' },
    { title: 'TVA — Nouvelles règles facturation B2B', msg: 'Obligations e-invoicing B2B obligatoires à partir de 2026 pour certaines entreprises', detail: 'Art. 53decies CTVA — facture électronique structurée (Peppol) pour transactions B2B belges', level: 'update' },
    { title: 'Loi mobilité 2024 — Budget mobilité', msg: 'Plafond budget mobilité revu à la hausse au 01/01/2026', detail: 'Max 20% du salaire brut annuel (avec minimum et maximum légaux)', level: 'info' },
  ];

  legal2026.forEach(({ title, msg, detail, level }) => push(level || 'update', 'Mises à jour légales', title, msg, detail, 'Consulter le texte'));

  // ═══ 4. ÉTAT ONSS & MANDATS ═══
  if (!co.onss) push('critical', 'ONSS', 'Matricule ONSS manquant', 'Aucun matricule ONSS configuré pour l\'entreprise', 'Toute déclaration ONSS est impossible sans matricule', 'Configurer le matricule ONSS');
  if (!co.vat && !co.bce) push('warning', 'Entreprise', 'Numéro BCE manquant', 'BCE de l\'entreprise non configuré', 'Requis pour toutes les déclarations légales', 'Configurer le BCE');

  // Bonne santé
  const nCritical = alerts.filter(a => a.level === 'critical').length;
  if (nCritical === 0 && ae.length > 0) push('success', 'Conformité', 'Dossier conforme ✓', `${ae.length} travailleur(s) actif(s) — aucune anomalie critique détectée`, 'Continuez à maintenir votre conformité sociale', null);

  return alerts.sort((a, b) => {
    const order = { critical: 0, warning: 1, update: 2, info: 3, success: 4 };
    return (order[a.level] ?? 5) - (order[b.level] ?? 5);
  });
}

// ── Composant carte alerte ────────────────────────────
function AlerteCard({ alerte, onDismiss, dismissed }) {
  const cfg = LEVEL_CONFIG[alerte.level] || LEVEL_CONFIG.info;
  if (dismissed) return null;
  return (
    <div style={{ padding: '14px 16px', borderRadius: 10, border: `1px solid ${cfg.border}`, background: cfg.bg, marginBottom: 8, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{cfg.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: cfg.color }}>{alerte.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span style={{ padding: '1px 7px', borderRadius: 10, fontSize: 9, fontWeight: 700, background: `${cfg.color}20`, color: cfg.color }}>{alerte.cat}</span>
              {onDismiss && <button onClick={() => onDismiss(alerte.id)} style={{ background: 'none', border: 'none', color: '#5e5c56', cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}>✕</button>}
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: '#c8c5bb', marginBottom: 4 }}>{alerte.msg}</div>
          {alerte.detail && <div style={{ fontSize: 10.5, color: '#5e5c56', fontStyle: 'italic', marginBottom: alerte.action ? 6 : 0 }}>{alerte.detail}</div>}
          {alerte.action && <div style={{ fontSize: 10, color: cfg.color, fontWeight: 600 }}>→ {alerte.action}</div>}
        </div>
      </div>
    </div>
  );
}

// ── Veille légale API ─────────────────────────────────
async function fetchLegalWatch() {
  try {
    const res = await fetch('/api/legal-watch');
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// ── Page principale ────────────────────────────────────
export default function AlertesLegales({ s, d }) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem('aureus_alerts_dismissed') || '{}'); } catch { return {}; }
  });
  const [legalWatchData, setLegalWatchData] = useState(null);
  const [legalWatchLoading, setLegalWatchLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);
  const [catFilter, setCatFilter] = useState('Toutes');
  const [levelFilter, setLevelFilter] = useState('Tous');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const alertes = useMemo(() => buildAlertes(s), [s]);

  const filtered = useMemo(() => alertes.filter(a => {
    if (catFilter !== 'Toutes' && a.cat !== catFilter) return false;
    if (levelFilter !== 'Tous' && a.level !== levelFilter) return false;
    return true;
  }), [alertes, catFilter, levelFilter]);

  const cats = useMemo(() => ['Toutes', ...new Set(alertes.map(a => a.cat))], [alertes]);
  const stats = useMemo(() => ({
    critical: alertes.filter(a => a.level === 'critical').length,
    warning: alertes.filter(a => a.level === 'warning').length,
    update: alertes.filter(a => a.level === 'update').length,
    info: alertes.filter(a => a.level === 'info').length,
  }), [alertes]);

  const dismiss = useCallback((id) => {
    setDismissed(prev => {
      const next = { ...prev, [id]: true };
      try { localStorage.setItem('aureus_alerts_dismissed', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const resetDismissed = () => {
    setDismissed({});
    try { localStorage.removeItem('aureus_alerts_dismissed'); } catch {}
  };

  const runLegalWatch = useCallback(async () => {
    setLegalWatchLoading(true);
    const data = await fetchLegalWatch();
    setLegalWatchData(data);
    setLastCheck(new Date());
    setLegalWatchLoading(false);
  }, []);

  // Auto-refresh toutes les 6h si activé
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(runLegalWatch, 6 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, runLegalWatch]);

  // Premier chargement
  useEffect(() => { runLegalWatch(); }, []);

  const visibleAlerts = filtered.filter(a => !dismissed[a.id]);
  const dismissedCount = filtered.filter(a => dismissed[a.id]).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 700, color: '#e8e6e0', margin: 0 }}>Alertes Légales</h1>
          <div style={{ fontSize: 12, color: '#8b7340', marginTop: 4 }}>
            Veille automatique · {alertes.length} alerte(s) · Dernière vérification : {lastCheck ? lastCheck.toLocaleTimeString('fr-BE') : '—'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#5e5c56', cursor: 'pointer' }}>
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} style={{ accentColor: GOLD }} />
            Auto-refresh 6h
          </label>
          <button onClick={runLegalWatch} disabled={legalWatchLoading}
            style={{ padding: '8px 16px', borderRadius: 9, border: `1px solid rgba(198,163,78,.2)`, background: 'transparent', color: GOLD, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {legalWatchLoading ? '⏳ Vérification...' : '🔄 Vérifier maintenant'}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Critiques', value: stats.critical, color: '#f87171', emoji: '🔴', onClick: () => setLevelFilter('critical') },
          { label: 'Attention', value: stats.warning, color: '#fb923c', emoji: '🟠', onClick: () => setLevelFilter('warning') },
          { label: 'Mises à jour', value: stats.update, color: GOLD, emoji: '📋', onClick: () => setLevelFilter('update') },
          { label: 'Informations', value: stats.info, color: '#60a5fa', emoji: '🔵', onClick: () => setLevelFilter('info') },
        ].map((k, i) => (
          <div key={i} onClick={k.onClick} style={{ padding: '16px 18px', background: 'linear-gradient(145deg,#0e1220,#131829)', border: `1px solid ${levelFilter === ['critical','warning','update','info'][i] ? k.color + '40' : 'rgba(139,115,60,.12)'}`, borderRadius: 12, cursor: 'pointer', transition: 'border-color .2s' }}>
            <div style={{ fontSize: 9, color: '#5e5c56', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 16, marginTop: 2 }}>{k.emoji}</div>
          </div>
        ))}
      </div>

      {/* Veille légale externe */}
      {legalWatchData && (
        <div style={{ marginBottom: 16, padding: 14, background: 'rgba(198,163,78,.04)', borderRadius: 10, border: '1px solid rgba(198,163,78,.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>📡 Veille Moniteur Belge</div>
            <div style={{ fontSize: 10, color: '#5e5c56' }}>{lastCheck?.toLocaleString('fr-BE')}</div>
          </div>
          {legalWatchData.sources?.map((src, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,.03)' }}>
              <span style={{ color: '#c8c5bb' }}>{src.name}</span>
              <span style={{ color: src.status === 'ok' ? '#22c55e' : '#f87171', fontWeight: 600 }}>{src.status === 'ok' ? '✓ Vérifié' : '⚠ Erreur'}</span>
            </div>
          ))}
          {legalWatchData.changes?.length > 0 && (
            <div style={{ marginTop: 10, padding: 10, background: 'rgba(251,146,60,.06)', borderRadius: 7, border: '1px solid rgba(251,146,60,.15)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#fb923c', marginBottom: 6 }}>⚠ Modifications détectées</div>
              {legalWatchData.changes.map((c, i) => (
                <div key={i} style={{ fontSize: 11, color: '#e8e6e0', marginBottom: 3 }}>• {c}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {cats.map(cat => (
            <button key={cat} onClick={() => setCatFilter(cat)}
              style={{ padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: catFilter === cat ? 700 : 400, fontFamily: 'inherit', background: catFilter === cat ? 'rgba(198,163,78,.2)' : 'rgba(255,255,255,.03)', color: catFilter === cat ? GOLD : '#5e5c56' }}>
              {cat}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          {levelFilter !== 'Tous' && (
            <button onClick={() => setLevelFilter('Tous')} style={{ padding: '5px 10px', borderRadius: 7, border: 'none', background: 'rgba(255,255,255,.04)', color: '#9e9b93', cursor: 'pointer', fontSize: 10, fontFamily: 'inherit' }}>✕ Réinitialiser filtre</button>
          )}
          {dismissedCount > 0 && (
            <button onClick={resetDismissed} style={{ padding: '5px 10px', borderRadius: 7, border: 'none', background: 'rgba(255,255,255,.04)', color: '#9e9b93', cursor: 'pointer', fontSize: 10, fontFamily: 'inherit' }}>
              🔁 Rétablir {dismissedCount} masquée(s)
            </button>
          )}
        </div>
      </div>

      {/* Liste alertes */}
      <div style={{ display: 'grid', gridTemplateColumns: stats.critical > 0 ? '1fr 320px' : '1fr', gap: 16 }}>
        <div>
          {visibleAlerts.length === 0 ? (
            <C>
              <div style={{ padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 14, color: '#22c55e', fontWeight: 700, marginBottom: 6 }}>Aucune alerte active</div>
                <div style={{ fontSize: 11, color: '#5e5c56' }}>
                  {dismissedCount > 0 ? `${dismissedCount} alerte(s) masquée(s)` : 'Votre dossier social est conforme'}
                </div>
              </div>
            </C>
          ) : (
            visibleAlerts.map(a => <AlerteCard key={a.id} alerte={a} onDismiss={dismiss} dismissed={false} />)
          )}
        </div>

        {/* Panel latéral — récap critiques + références légales */}
        {stats.critical > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <C>
              <ST>Action immédiate requise</ST>
              {alertes.filter(a => a.level === 'critical' && !dismissed[a.id]).map((a, i) => (
                <div key={i} style={{ padding: '8px 10px', borderRadius: 7, background: 'rgba(248,113,113,.06)', border: '1px solid rgba(248,113,113,.12)', marginBottom: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171', marginBottom: 2 }}>{a.title}</div>
                  {a.action && <div style={{ fontSize: 10, color: '#fb923c' }}>→ {a.action}</div>}
                </div>
              ))}
            </C>
            <C>
              <ST>Références légales clés</ST>
              {[
                { ref: 'Loi 12/04/1965', desc: 'Protection rémunération (RMMMG)' },
                { ref: 'AR 05/11/2002', desc: 'Déclaration immédiate Dimona' },
                { ref: 'Loi 27/06/1969', desc: 'ONSS — sécurité sociale' },
                { ref: 'Loi 03/07/1978', desc: 'Contrats de travail (CDD/CDI)' },
                { ref: 'Art. 412 CIR 1992', desc: 'Précompte professionnel' },
                { ref: 'CNT CCT n°43', desc: 'Paiement salaire par virement' },
                { ref: 'Loi 02/08/2002', desc: 'Lutte contre retards paiement B2B' },
              ].map((r, i) => (
                <div key={i} style={{ padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,.03)', fontSize: 11 }}>
                  <span style={{ color: GOLD, fontWeight: 600, fontFamily: 'monospace', fontSize: 10 }}>{r.ref}</span>
                  <div style={{ color: '#5e5c56', fontSize: 10, marginTop: 1 }}>{r.desc}</div>
                </div>
              ))}
            </C>
          </div>
        )}
      </div>
    </div>
  );
}
