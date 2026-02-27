'use client';
import { useState, useEffect, useCallback } from 'react';

const COMMISSION_RATE = 2;
const fmt = v => new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(v || 0);

export default function CommissionsModule({ userRole, user }) {
  const [commissions, setCommissions] = useState({});
  const [selectedCommercial, setSelectedCommercial] = useState(null);
  const [tab, setTab] = useState('pending');
  const isAdmin = userRole === 'admin' || userRole === 'gestionnaire';
  const isCommercial = userRole === 'commercial';
  const userEmail = user?.email?.toLowerCase() || '';

  useEffect(() => {
    try { const raw = localStorage.getItem('aureus_commissions'); if (raw) setCommissions(JSON.parse(raw)); } catch (e) {}
  }, []);

  const save = useCallback((updated) => {
    setCommissions(updated);
    localStorage.setItem('aureus_commissions', JSON.stringify(updated));
  }, []);

  const markPaid = (email, entryId) => {
    const updated = { ...commissions };
    if (!updated[email]) return;
    updated[email] = { ...updated[email], entries: updated[email].entries.map(e => e.id === entryId ? { ...e, status: 'paid', paidAt: new Date().toISOString() } : e) };
    updated[email].paid = updated[email].entries.filter(e => e.status === 'paid').reduce((a, e) => a + e.amount, 0);
    save(updated);
  };

  const markAllPaid = (email) => {
    if (!confirm(`Marquer toutes les commissions de ${email} comme payées ?`)) return;
    const updated = { ...commissions };
    if (!updated[email]) return;
    const now = new Date().toISOString();
    updated[email] = { ...updated[email], entries: updated[email].entries.map(e => e.status === 'pending' ? { ...e, status: 'paid', paidAt: now } : e) };
    updated[email].paid = updated[email].total;
    save(updated);
  };

  const commercials = Object.entries(commissions);
  const myData = isCommercial ? commissions[userEmail] : null;
  const viewData = selectedCommercial ? commissions[selectedCommercial] : null;
  const globalTotal = commercials.reduce((a, [, c]) => a + (c.total || 0), 0);
  const globalPaid = commercials.reduce((a, [, c]) => a + (c.paid || 0), 0);
  const globalPending = globalTotal - globalPaid;
  const totalFiches = commercials.reduce((a, [, c]) => a + c.entries.reduce((b, e) => b + e.fichesCount, 0), 0);

  const S = {
    card: { background: 'rgba(198,163,78,0.03)', border: '1px solid rgba(198,163,78,0.1)', borderRadius: 12, padding: 20, marginBottom: 16 },
    kpi: { padding: '16px 20px', background: 'rgba(198,163,78,0.04)', borderRadius: 12, border: '1px solid rgba(198,163,78,0.08)' },
    btn: (bg, color) => ({ padding: '6px 14px', borderRadius: 8, border: 'none', background: bg, color, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }),
  };

  const KPIs = (items) => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 12, marginBottom: 24 }}>
      {items.map((k, i) => (<div key={i} style={S.kpi}><div style={{ fontSize: 10, color: '#5e5c56', textTransform: 'uppercase', letterSpacing: 1 }}>{k.l}</div><div style={{ fontSize: 22, fontWeight: 700, color: k.c, marginTop: 6 }}>{k.v}</div></div>))}
    </div>
  );

  const EntryRow = ({ e, showPay, email }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#e8e6e0' }}>{e.clientName}</div>
        <div style={{ fontSize: 10, color: '#9e9b93' }}>{e.period} · {e.fichesCount} fiche{e.fichesCount > 1 ? 's' : ''} × {COMMISSION_RATE}€</div>
        <div style={{ fontSize: 9, color: '#5e5c56' }}>{new Date(e.date).toLocaleDateString('fr-BE')}{e.paidAt && ` · Payé le ${new Date(e.paidAt).toLocaleDateString('fr-BE')}`}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: e.status === 'paid' ? '#22c55e' : '#eab308' }}>{fmt(e.amount)}</span>
        {showPay && e.status === 'pending' && <button onClick={() => markPaid(email, e.id)} style={S.btn('rgba(34,197,94,0.12)', '#22c55e')}>💸</button>}
      </div>
    </div>
  );

  // ═══ COMMERCIAL VIEW ═══
  if (isCommercial) {
    const data = myData || { total: 0, paid: 0, entries: [] };
    const pending = data.total - data.paid;
    return (
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f97316', margin: '0 0 4px' }}>💰 Mes Commissions</h2>
        <p style={{ fontSize: 12, color: '#9e9b93', margin: '0 0 20px' }}>{COMMISSION_RATE}€ par fiche de paie distribuée</p>
        {KPIs([
          { l: 'Total gagné', v: fmt(data.total), c: '#f97316' },
          { l: 'À recevoir', v: fmt(pending), c: pending > 0 ? '#eab308' : '#22c55e' },
          { l: 'Déjà payé', v: fmt(data.paid), c: '#22c55e' },
          { l: 'Fiches générées', v: data.entries.reduce((a, e) => a + e.fichesCount, 0), c: '#60a5fa' },
        ])}
        {data.entries.filter(e => e.status === 'pending').length > 0 && <><h3 style={{ fontSize: 14, color: '#eab308', fontWeight: 600, marginBottom: 10 }}>⏳ En attente</h3>{data.entries.filter(e => e.status === 'pending').map(e => <EntryRow key={e.id} e={e} />)}</>}
        {data.entries.filter(e => e.status === 'paid').length > 0 && <><h3 style={{ fontSize: 14, color: '#22c55e', fontWeight: 600, marginBottom: 10, marginTop: 20 }}>✅ Payé</h3>{data.entries.filter(e => e.status === 'paid').map(e => <EntryRow key={e.id} e={e} />)}</>}
        {data.entries.length === 0 && <div style={{ ...S.card, textAlign: 'center', padding: 60, color: '#5e5c56' }}><div style={{ fontSize: 48, marginBottom: 12 }}>💰</div><div style={{ fontSize: 16, fontWeight: 600 }}>Pas encore de commissions</div><div style={{ fontSize: 13, marginTop: 8 }}>Elles apparaîtront quand les fiches de vos clients seront distribuées.</div></div>}
      </div>
    );
  }

  // ═══ ADMIN VIEW ═══
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#c6a34e', margin: '0 0 4px' }}>💰 Commissions Commerciales</h2>
      <p style={{ fontSize: 12, color: '#9e9b93', margin: '0 0 20px' }}>{COMMISSION_RATE}€ par fiche distribuée — {commercials.length} commerciaux</p>
      {KPIs([
        { l: 'Total commissions', v: fmt(globalTotal), c: '#f97316' },
        { l: 'À payer', v: fmt(globalPending), c: globalPending > 0 ? '#eab308' : '#22c55e' },
        { l: 'Déjà payé', v: fmt(globalPaid), c: '#22c55e' },
        { l: 'Total fiches', v: totalFiches, c: '#60a5fa' },
      ])}
      {commercials.length === 0 && <div style={{ ...S.card, textAlign: 'center', padding: 60, color: '#5e5c56' }}><div style={{ fontSize: 48, marginBottom: 12 }}>💰</div><div style={{ fontSize: 16, fontWeight: 600 }}>Aucune commission</div><div style={{ fontSize: 13, marginTop: 8 }}>Générées automatiquement lors de la distribution des fiches.</div></div>}
      <div style={{ display: 'grid', gridTemplateColumns: selectedCommercial ? '1fr 1fr' : '1fr', gap: 20 }}>
        <div>
          {commercials.map(([email, data]) => {
            const pending = data.total - data.paid;
            const pendingCount = data.entries.filter(e => e.status === 'pending').length;
            return (
              <div key={email} onClick={() => setSelectedCommercial(selectedCommercial === email ? null : email)} style={{ ...S.card, cursor: 'pointer', borderColor: selectedCommercial === email ? 'rgba(249,115,22,0.4)' : undefined }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#e8e6e0' }}>📈 {email}</div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11 }}>
                      <span style={{ color: '#f97316' }}>Total: {fmt(data.total)}</span>
                      <span style={{ color: pending > 0 ? '#eab308' : '#22c55e' }}>{pending > 0 ? `⏳ ${fmt(pending)}` : '✅ Tout payé'}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#f97316' }}>{fmt(data.total)}</div>
                    {pendingCount > 0 && <button onClick={e => { e.stopPropagation(); markAllPaid(email); }} style={S.btn('rgba(34,197,94,0.12)', '#22c55e')}>💸 Tout payer ({pendingCount})</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {selectedCommercial && viewData && (
          <div style={{ ...S.card, position: 'sticky', top: 20, alignSelf: 'start', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: '#f97316', fontSize: 15 }}>📈 {selectedCommercial}</h3>
              <button onClick={() => setSelectedCommercial(null)} style={{ background: 'none', border: 'none', color: '#5e5c56', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {[{ v: 'pending', l: '⏳ À payer' }, { v: 'paid', l: '✅ Payé' }].map(t => (
                <button key={t.v} onClick={() => setTab(t.v)} style={{ padding: '6px 12px', borderRadius: 6, fontSize: 11, border: tab === t.v ? '1px solid rgba(198,163,78,0.3)' : '1px solid rgba(255,255,255,0.06)', background: tab === t.v ? 'rgba(198,163,78,0.08)' : 'transparent', color: tab === t.v ? '#c6a34e' : '#5e5c56', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {t.l} ({viewData.entries.filter(e => e.status === t.v).length})
                </button>
              ))}
            </div>
            {viewData.entries.filter(e => e.status === tab).sort((a, b) => new Date(b.date) - new Date(a.date)).map(e => <EntryRow key={e.id} e={e} showPay={true} email={selectedCommercial} />)}
          </div>
        )}
      </div>
    </div>
  );
}
