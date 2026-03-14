'use client';
// ═══ AUREUS SOCIAL PRO — Tableau de Bord Employeur ═══
// Vue synthèse par employeur : employés actifs, masse salariale, échéances ONSS

import { useState, useMemo } from 'react';
import { C, ST, PH, fmt, f2 } from '@/app/lib/shared-ui';
import { TX_ONSS_E, TX_ONSS_W, RMMMG } from '@/app/lib/lois-belges';

const GOLD = '#c6a34e';
const fmtEur = n => new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(n || 0);
const MN = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

function KPI({ icon, label, value, sub, color = GOLD, onClick }) {
  return (
    <div onClick={onClick}
      style={{ padding: '18px 20px', background: 'rgba(198,163,78,.03)', borderRadius: 12, border: '1px solid rgba(198,163,78,.07)', cursor: onClick ? 'pointer' : 'default', position: 'relative', overflow: 'hidden' }}
      onMouseEnter={e => onClick && (e.currentTarget.style.background = 'rgba(198,163,78,.08)')}
      onMouseLeave={e => onClick && (e.currentTarget.style.background = 'rgba(198,163,78,.03)')}>
      <div style={{ position: 'absolute', top: 10, right: 14, fontSize: 28, opacity: 0.06, color }}>{icon}</div>
      <div style={{ fontSize: 9, color: '#5e5c56', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: '#5e5c56', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Badge({ label, color }) {
  return (
    <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 9, fontWeight: 700, background: `${color}18`, color, border: `1px solid ${color}30` }}>
      {label}
    </span>
  );
}

function EmployeRow({ emp, onSelect }) {
  const brut = +(emp.monthlySalary || emp.salaire_brut || emp.gross || 0);
  const net = Math.round(brut * 0.6687 * 100) / 100;
  const cout = Math.round(brut * 1.2507 * 100) / 100;
  const alerts = [];
  if (!emp.niss) alerts.push('NISS');
  if (!emp.iban) alerts.push('IBAN');
  if (brut < RMMMG && brut > 0) alerts.push('< RMMMG');

  return (
    <div onClick={() => onSelect(emp)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(198,163,78,.06)', background: 'rgba(255,255,255,.01)', cursor: 'pointer', marginBottom: 6 }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(198,163,78,.06)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.01)'}>
      {/* Avatar */}
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#c6a34e,#a68a3c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#0c0b09', flexShrink: 0 }}>
        {((emp.prenom || emp.first || '?')[0] || '?').toUpperCase()}
      </div>
      {/* Nom + info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#e8e6e0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {emp.prenom || emp.first || ''} {emp.nom || emp.last || ''}
        </div>
        <div style={{ fontSize: 10, color: '#5e5c56', marginTop: 2 }}>
          CP {emp.commission_paritaire || emp.cp || '200'} · {emp.type_employe === 'ouvrier' ? 'Ouvrier' : 'Employé'}
          {emp.date_entree && ` · Entrée ${emp.date_entree}`}
        </div>
      </div>
      {/* Alertes */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', gap: 4 }}>
          {alerts.map(a => <Badge key={a} label={a} color="#f87171" />)}
        </div>
      )}
      {/* Salaires */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>{fmtEur(brut)}</div>
        <div style={{ fontSize: 9, color: '#5e5c56' }}>net {fmtEur(net)} · coût {fmtEur(cout)}</div>
      </div>
      {/* Status */}
      <Badge label={emp.status === 'sorti' ? 'Sorti' : 'Actif'} color={emp.status === 'sorti' ? '#f87171' : '#22c55e'} />
    </div>
  );
}

function EcheanceRow({ label, date, days, urgent, icon }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,.03)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: urgent ? '#f87171' : GOLD, fontSize: 12 }}>{icon}</span>
        <div>
          <div style={{ fontSize: 11.5, color: '#e8e6e0', fontWeight: urgent ? 600 : 400 }}>{label}</div>
          <div style={{ fontSize: 9.5, color: '#5e5c56' }}>{date}</div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        {days !== null ? (
          <div style={{ fontSize: 11, fontWeight: 700, color: urgent ? '#f87171' : days <= 30 ? '#fb923c' : '#22c55e' }}>
            {days <= 0 ? 'ÉCHU' : `J-${days}`}
          </div>
        ) : (
          <div style={{ fontSize: 10, color: '#22c55e' }}>Permanent</div>
        )}
      </div>
    </div>
  );
}

function EmpDetail({ emp, onClose }) {
  const brut = +(emp.monthlySalary || emp.salaire_brut || emp.gross || 0);
  const onssW = Math.round(brut * TX_ONSS_W * 100) / 100;
  const onssE = Math.round(brut * TX_ONSS_E * 100) / 100;
  const net = Math.round((brut - onssW) * 0.78 * 100) / 100; // estimation PP ~22%
  const cout = brut + onssE;
  const pv = Math.round(brut * 0.1523 * 100) / 100;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#0e0d0b', borderRadius: 16, border: '1px solid rgba(198,163,78,.15)', width: '100%', maxWidth: 500, maxHeight: '80vh', overflow: 'auto', padding: 28 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#c6a34e,#a68a3c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#0c0b09' }}>
              {((emp.prenom || emp.first || '?')[0] || '?').toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#e8e6e0' }}>{emp.prenom || emp.first || ''} {emp.nom || emp.last || ''}</div>
              <div style={{ fontSize: 11, color: '#5e5c56', marginTop: 2 }}>NISS: {emp.niss || '—'} · IBAN: {emp.iban ? `${emp.iban.slice(0,8)}...` : '—'}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#5e5c56', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Calculs */}
        {[
          { l: 'Salaire brut', v: fmtEur(brut), bold: true, color: GOLD },
          { l: `ONSS travailleur (${(TX_ONSS_W * 100).toFixed(2)}%)`, v: `-${fmtEur(onssW)}`, color: '#f87171' },
          { l: 'Brut imposable', v: fmtEur(brut - onssW) },
          { l: 'Précompte professionnel (est.)', v: `-${fmtEur(Math.round((brut - onssW) * 0.22 * 100) / 100)}`, color: '#f87171' },
          { l: 'NET À PAYER (estimé)', v: fmtEur(net), bold: true, color: '#22c55e' },
          { sep: true },
          { l: `ONSS patronal (${(TX_ONSS_E * 100).toFixed(2)}%)`, v: fmtEur(onssE), color: '#fb923c' },
          { l: 'Coût total employeur', v: fmtEur(cout), bold: true, color: '#a78bfa' },
          { l: 'Pécule vacances (15,23%)', v: fmtEur(pv), color: '#60a5fa' },
        ].map((r, i) => r.sep ? (
          <div key={i} style={{ height: 1, background: 'rgba(255,255,255,.06)', margin: '8px 0' }} />
        ) : (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,.03)' }}>
            <span style={{ fontSize: 11.5, color: '#9e9b93' }}>{r.l}</span>
            <span style={{ fontSize: 12, fontWeight: r.bold ? 700 : 400, color: r.color || '#e8e6e0' }}>{r.v}</span>
          </div>
        ))}

        {/* Infos contrat */}
        <div style={{ marginTop: 16, padding: 12, background: 'rgba(198,163,78,.04)', borderRadius: 8, border: '1px solid rgba(198,163,78,.08)' }}>
          {[
            { l: 'Commission paritaire', v: `CP ${emp.commission_paritaire || emp.cp || '200'}` },
            { l: 'Type', v: emp.type_employe === 'ouvrier' ? 'Ouvrier' : 'Employé' },
            { l: 'Régime', v: emp.regime === 'temps_partiel' ? 'Temps partiel' : 'Temps plein' },
            { l: 'Date d\'entrée', v: emp.date_entree || '—' },
            { l: 'Email', v: emp.email || emp.emp_email || '—' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11 }}>
              <span style={{ color: '#5e5c56' }}>{r.l}</span>
              <span style={{ color: '#e8e6e0', fontWeight: 500 }}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TableauBordEmployeur({ s, d }) {
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [filter, setFilter] = useState('tous');
  const [kpiPayroll, setKpiPayroll] = useState(null);

  const now = new Date();
  const co = s?.co || {};
  const allEmps = s?.emps || [];
  const ae = allEmps.filter(e => e.status === 'active' || !e.status);
  const sortis = allEmps.filter(e => e.status === 'sorti');

  // ── Charger KPIs paie du mois depuis Supabase ───────────────────
  useEffect(() => {
    if (!supabase || !s?.user?.id) return;
    const now2 = new Date();
    supabase.from('fiches_paie')
      .select('gross, net, onss_e, pp, cost_total, emp_id')
      .eq('user_id', s.user.id)
      .eq('year', now2.getFullYear())
      .eq('month', now2.getMonth() + 1)
      .then(({ data }) => {
        if (data?.length) {
          setKpiPayroll({
            masseBrute: data.reduce((a, r) => a + (+(r.gross || 0)), 0),
            masseNette: data.reduce((a, r) => a + (+(r.net || 0)), 0),
            coutTotal: data.reduce((a, r) => a + (+(r.cost_total || 0)), 0),
            nbFiches: data.length,
          });
        }
      });
  }, [s?.user?.id]);
  // ────────────────────────────────────────────────────────────────

  const displayed = filter === 'tous' ? ae : filter === 'sortis' ? sortis : ae.filter(e => {
    if (filter === 'sans_niss') return !e.niss;
    if (filter === 'sans_iban') return !e.iban;
    return true;
  });

  // KPIs
  const masse = ae.reduce((a, e) => a + +(e.monthlySalary || e.salaire_brut || 0), 0);
  const coutTotal = Math.round(masse * 1.2507 * 100) / 100;
  const netTotal = Math.round(masse * 0.6687 * 100) / 100;
  const sansDossier = ae.filter(e => !e.niss || !e.iban).length;

  // Échéances
  const q = Math.floor(now.getMonth() / 3) + 1;
  const qEnd = new Date(now.getFullYear(), q * 3, 0);
  const daysDmfa = Math.ceil((qEnd - now) / 86400000);
  const nextPP = new Date(now.getFullYear(), now.getMonth() + 1, 5);
  const daysPP = Math.ceil((nextPP - now) / 86400000);
  const nextONSS = new Date(now.getFullYear(), now.getMonth() + 1, 5);
  const daysONSS = Math.ceil((nextONSS - now) / 86400000);

  const echeances = [
    { label: `DmfA T${q}/${now.getFullYear()}`, date: qEnd.toLocaleDateString('fr-BE'), days: daysDmfa, urgent: daysDmfa <= 14, icon: '◆' },
    { label: 'Précompte professionnel 274', date: nextPP.toLocaleDateString('fr-BE'), days: daysPP, urgent: daysPP <= 5, icon: '◇' },
    { label: 'Provisions ONSS mensuelles', date: nextONSS.toLocaleDateString('fr-BE'), days: daysONSS, urgent: daysONSS <= 5, icon: '◆' },
    { label: 'Dimona IN — Avant embauche', date: 'Avant chaque entrée', days: null, urgent: false, icon: '⬆' },
  ];

  // Répartition par CP
  const cpGroups = useMemo(() => {
    const g = {};
    ae.forEach(e => {
      const cp = `CP ${e.commission_paritaire || e.cp || '200'}`;
      if (!g[cp]) g[cp] = { count: 0, masse: 0 };
      g[cp].count++;
      g[cp].masse += +(e.monthlySalary || e.salaire_brut || 0);
    });
    return Object.entries(g).sort((a, b) => b[1].masse - a[1].masse);
  }, [ae]);

  return (
    <div>
      <PH title="Tableau de Bord Employeur" sub={`${MN[now.getMonth()]} ${now.getFullYear()} · ${co.name || 'Employeur'} · BCE ${co.bce || co.vat || '—'}`} />

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        <KPI icon="◉" label="Employés actifs" value={ae.length} sub={`${sortis.length} sorti(s) · ${sansDossier} dossier(s) incomplet(s)`} onClick={() => setFilter('tous')} />
        <KPI icon="◈" label="Masse salariale brute" value={fmtEur(masse)} sub={`Moy: ${fmtEur(ae.length ? masse / ae.length : 0)}/emp`} color="#4ade80" />
        <KPI icon="▤" label="Net total estimé" value={fmtEur(netTotal)} sub={`${ae.length ? Math.round(netTotal / masse * 100) : 0}% du brut`} color="#60a5fa" />
        <KPI icon="◆" label="Coût employeur total" value={fmtEur(coutTotal)} sub={`Ratio: ${ae.length ? Math.round(coutTotal / masse * 100) : 0}% du brut`} color="#a78bfa" />
      </div>

      {/* Grille principale */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, marginBottom: 16 }}>

        {/* Liste employés */}
        <C>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <ST>Travailleurs ({displayed.length})</ST>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { v: 'tous', l: `Actifs (${ae.length})` },
                { v: 'sans_niss', l: `Sans NISS (${ae.filter(e => !e.niss).length})` },
                { v: 'sans_iban', l: `Sans IBAN (${ae.filter(e => !e.iban).length})` },
                { v: 'sortis', l: `Sortis (${sortis.length})` },
              ].map(f => (
                <button key={f.v} onClick={() => setFilter(f.v)}
                  style={{ padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: filter === f.v ? 700 : 400, fontFamily: 'inherit', background: filter === f.v ? 'rgba(198,163,78,.2)' : 'rgba(255,255,255,.04)', color: filter === f.v ? GOLD : '#5e5c56' }}>
                  {f.l}
                </button>
              ))}
              <button onClick={() => d({ type: 'NAV', page: 'nouveauemployeur' })}
                style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, fontFamily: 'inherit', background: 'linear-gradient(135deg,#c6a34e,#a68a3c)', color: '#0c0b09' }}>
                + Employeur
              </button>
            </div>
          </div>

          {displayed.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
              <div style={{ fontSize: 13, color: '#9e9b93', marginBottom: 8 }}>Aucun travailleur dans cette vue</div>
              <button onClick={() => d({ type: 'NAV', page: 'employees' })}
                style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(198,163,78,.2)', background: 'transparent', color: GOLD, fontSize: 12, cursor: 'pointer' }}>
                + Ajouter un travailleur
              </button>
            </div>
          ) : (
            displayed.map((emp, i) => (
              <EmployeRow key={emp.id || i} emp={emp} onSelect={setSelectedEmp} />
            ))
          )}
        </C>

        {/* Colonne droite */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Échéances */}
          <C>
            <ST>Prochaines échéances</ST>
            {echeances.map((e, i) => (
              <EcheanceRow key={i} {...e} />
            ))}
            <button onClick={() => d({ type: 'NAV', page: 'declarations' })}
              style={{ marginTop: 10, width: '100%', padding: '8px', borderRadius: 8, border: '1px solid rgba(198,163,78,.15)', background: 'transparent', color: GOLD, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
              Voir toutes les déclarations →
            </button>
          </C>

          {/* Répartition par CP */}
          {cpGroups.length > 0 && (
            <C>
              <ST>Répartition par CP</ST>
              {cpGroups.map(([cp, data], i) => {
                const pct = masse > 0 ? Math.round(data.masse / masse * 100) : 0;
                return (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                      <span style={{ color: '#e8e6e0', fontWeight: 500 }}>{cp}</span>
                      <span style={{ color: '#5e5c56' }}>{data.count} emp · {fmtEur(data.masse)}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.06)' }}>
                      <div style={{ height: '100%', borderRadius: 2, width: `${pct}%`, background: `linear-gradient(90deg,${GOLD},#a68a3c)` }} />
                    </div>
                  </div>
                );
              })}
            </C>
          )}

          {/* Actions rapides */}
          <C>
            <ST>Actions rapides</ST>
            {[
              { icon: '📄', l: 'Fiches de paie', page: 'payslip', color: GOLD },
              { icon: '⬆', l: 'Dimona IN/OUT', page: 'declarations', color: '#60a5fa' },
              { icon: '🏦', l: 'Fichier SEPA', page: 'sepa', color: '#22c55e' },
              { icon: '📊', l: 'DmfA trimestrielle', page: 'declarations', color: '#a78bfa' },
              { icon: '📤', l: 'Export comptable', page: 'exportcomptapro', color: '#fb923c' },
            ].map((a, i) => (
              <button key={i} onClick={() => d({ type: 'NAV', page: a.page })}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', marginBottom: 6, borderRadius: 8, border: '1px solid rgba(198,163,78,.06)', background: 'rgba(255,255,255,.01)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(198,163,78,.07)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.01)'}>
                <span style={{ fontSize: 16 }}>{a.icon}</span>
                <span style={{ fontSize: 11.5, color: '#e8e6e0', fontWeight: 500 }}>{a.l}</span>
                <span style={{ marginLeft: 'auto', color: a.color, fontSize: 11 }}>→</span>
              </button>
            ))}
          </C>
        </div>
      </div>

      {/* Modal détail employé */}
      {selectedEmp && <EmpDetail emp={selectedEmp} onClose={() => setSelectedEmp(null)} />}
    </div>
  );
}
