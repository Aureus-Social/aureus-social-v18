'use client';
import { useState, useEffect, useCallback } from 'react';

const COMMISSION_PER_FICHE = 2;
const fmt = v => new Intl.NumberFormat('fr-BE', { style:'currency', currency:'EUR' }).format(v||0);

export default function CommissionsModule({ userRole, user }) {
  const [commissions, setCommissions] = useState({});
  const [selectedCommercial, setSelectedCommercial] = useState(null);
  const [tab, setTab] = useState('pending');
  const [showAddTest, setShowAddTest] = useState(false);
  const [testData, setTestData] = useState({ email:'', client:'', fiches:10, period:'' });
  const isAdmin = userRole==='admin' || userRole==='gestionnaire';
  const isCommercial = userRole==='commercial';
  const userEmail = user?.email?.toLowerCase() || '';

  useEffect(() => {
    try { const raw=localStorage.getItem('aureus_commissions'); if(raw) setCommissions(JSON.parse(raw)); } catch(e) {}
  }, []);

  const save = useCallback((updated) => {
    setCommissions(updated);
    localStorage.setItem('aureus_commissions', JSON.stringify(updated));
  }, []);

  // Admin: marquer une commission comme payée (client a payé → commission verte)
  const markPaid = (email, entryId) => {
    const updated = { ...commissions };
    if(!updated[email]) return;
    updated[email] = { ...updated[email],
      entries: updated[email].entries.map(e =>
        e.id===entryId ? { ...e, status:'paid', paidAt:new Date().toISOString() } : e
      )
    };
    updated[email].paid = updated[email].entries.filter(e=>e.status==='paid').reduce((a,e)=>a+e.amount,0);
    save(updated);
  };

  // Admin: payer toutes les commissions en attente d'un commercial
  const markAllPaid = (email) => {
    if(!confirm(`Marquer TOUTES les commissions de ${email} comme payées ?\n(= le client a payé ses factures)`)) return;
    const updated = { ...commissions };
    if(!updated[email]) return;
    const now = new Date().toISOString();
    updated[email] = { ...updated[email],
      entries: updated[email].entries.map(e => e.status==='pending' ? { ...e, status:'paid', paidAt:now } : e)
    };
    updated[email].paid = updated[email].entries.reduce((a,e)=>a+e.amount,0);
    save(updated);
  };

  // Admin: ajouter manuellement une commission (pour test ou rattrapage)
  const addCommission = () => {
    if(!testData.email.trim() || !testData.client.trim()) return alert('Email commercial + nom client requis');
    const email = testData.email.toLowerCase().trim();
    const entry = {
      id: 'COM_'+Date.now(),
      clientName: testData.client,
      period: testData.period || new Date().toLocaleDateString('fr-BE',{month:'long',year:'numeric'}),
      fichesCount: parseInt(testData.fiches)||1,
      amount: (parseInt(testData.fiches)||1) * COMMISSION_PER_FICHE,
      status: 'pending',
      date: new Date().toISOString(),
    };
    const updated = { ...commissions };
    if(!updated[email]) updated[email] = { total:0, paid:0, entries:[] };
    updated[email].entries.push(entry);
    updated[email].total = updated[email].entries.reduce((a,e)=>a+e.amount,0);
    updated[email].paid = updated[email].entries.filter(e=>e.status==='paid').reduce((a,e)=>a+e.amount,0);
    save(updated);
    setTestData({ email:'', client:'', fiches:10, period:'' });
    setShowAddTest(false);
    setSelectedCommercial(email);
  };

  const commercials = Object.entries(commissions);
  const myData = isCommercial ? commissions[userEmail] : null;
  const viewData = selectedCommercial ? commissions[selectedCommercial] : null;
  const globalTotal = commercials.reduce((a,[,c])=>a+(c.total||0),0);
  const globalPaid = commercials.reduce((a,[,c])=>a+(c.paid||0),0);
  const globalPending = globalTotal - globalPaid;
  const totalFiches = commercials.reduce((a,[,c])=>a+c.entries.reduce((b,e)=>b+e.fichesCount,0),0);

  const iS = { width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid rgba(198,163,78,0.2)', background:'rgba(0,0,0,0.3)', color:'#e8e6e0', fontSize:13, fontFamily:'inherit', outline:'none' };

  const KPIs = (items) => (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${items.length},1fr)`, gap:12, marginBottom:24 }}>
      {items.map((k,i) => (<div key={i} style={{ padding:'16px 20px', background:'rgba(198,163,78,0.04)', borderRadius:12, border:'1px solid rgba(198,163,78,0.08)' }}><div style={{ fontSize:10, color:'#5e5c56', textTransform:'uppercase', letterSpacing:1 }}>{k.l}</div><div style={{ fontSize:22, fontWeight:700, color:k.c, marginTop:6 }}>{k.v}</div></div>))}
    </div>
  );

  // ═══ ENTRY ROW — Vert si payé, Jaune si en attente ═══
  const EntryRow = ({ e, showPay, email }) => {
    const isPaid = e.status==='paid';
    return (
      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'center',
        padding:'12px 14px', marginBottom:6, borderRadius:10,
        background: isPaid ? 'rgba(34,197,94,0.04)' : 'rgba(234,179,8,0.04)',
        border: `1px solid ${isPaid ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)'}`,
      }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:18 }}>{isPaid ? '🟢' : '🟡'}</span>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'#e8e6e0' }}>{e.clientName}</div>
              <div style={{ fontSize:11, color:'#9e9b93' }}>
                {e.period} · {e.fichesCount} fiche{e.fichesCount>1?'s':''} × {COMMISSION_PER_FICHE}€
              </div>
              <div style={{ fontSize:10, color:'#5e5c56' }}>
                {new Date(e.date).toLocaleDateString('fr-BE')}
                {e.paidAt && <span style={{ color:'#22c55e', fontWeight:600 }}> · ✅ Client payé le {new Date(e.paidAt).toLocaleDateString('fr-BE')}</span>}
              </div>
            </div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:18, fontWeight:700, color: isPaid ? '#22c55e' : '#eab308' }}>
              {fmt(e.amount)}
            </div>
            <div style={{ fontSize:9, color: isPaid ? '#22c55e' : '#eab308', fontWeight:600 }}>
              {isPaid ? '✅ PAYÉ' : '⏳ EN ATTENTE'}
            </div>
          </div>
          {showPay && !isPaid && (
            <button onClick={() => markPaid(email, e.id)} title="Client a payé → commission validée"
              style={{ padding:'8px 14px', borderRadius:8, border:'none', background:'rgba(34,197,94,0.15)', color:'#22c55e', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              💸 Valider
            </button>
          )}
        </div>
      </div>
    );
  };

  // ═══ VUE COMMERCIAL ═══
  if(isCommercial) {
    const data = myData || { total:0, paid:0, entries:[] };
    const pending = data.total - data.paid;
    const pendingEntries = data.entries.filter(e=>e.status==='pending');
    const paidEntries = data.entries.filter(e=>e.status==='paid');
    return (
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        <h2 style={{ fontSize:22, fontWeight:700, color:'#f97316', margin:'0 0 4px' }}>💰 Mes Commissions</h2>
        <p style={{ fontSize:12, color:'#9e9b93', margin:'0 0 20px' }}>{COMMISSION_PER_FICHE}€ par fiche de paie · 🟢 Vert = client a payé · 🟡 Jaune = en attente</p>
        {KPIs([
          { l:'Total gagné', v:fmt(data.total), c:'#f97316' },
          { l:'À recevoir', v:fmt(pending), c: pending>0?'#eab308':'#22c55e' },
          { l:'Déjà payé', v:fmt(data.paid), c:'#22c55e' },
          { l:'Fiches générées', v:data.entries.reduce((a,e)=>a+e.fichesCount,0), c:'#60a5fa' },
        ])}
        {pendingEntries.length>0 && <>
          <h3 style={{ fontSize:14, color:'#eab308', fontWeight:600, marginBottom:10 }}>🟡 En attente de paiement client ({pendingEntries.length})</h3>
          {pendingEntries.map(e => <EntryRow key={e.id} e={e}/>)}
        </>}
        {paidEntries.length>0 && <>
          <h3 style={{ fontSize:14, color:'#22c55e', fontWeight:600, marginBottom:10, marginTop:24 }}>🟢 Client a payé — Commission validée ({paidEntries.length})</h3>
          {paidEntries.map(e => <EntryRow key={e.id} e={e}/>)}
        </>}
        {data.entries.length===0 && <div style={{ background:'rgba(198,163,78,0.03)', border:'1px solid rgba(198,163,78,0.1)', borderRadius:12, textAlign:'center', padding:60, color:'#5e5c56' }}><div style={{ fontSize:48, marginBottom:12 }}>💰</div><div style={{ fontSize:16, fontWeight:600 }}>Pas encore de commissions</div><div style={{ fontSize:13, marginTop:8 }}>Elles apparaîtront quand les fiches de vos clients seront générées.</div></div>}
      </div>
    );
  }

  // ═══ VUE ADMIN ═══
  return (
    <div style={{ maxWidth:1200, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
        <h2 style={{ fontSize:22, fontWeight:700, color:'#c6a34e', margin:0 }}>💰 Commissions Commerciales</h2>
        <button onClick={() => setShowAddTest(!showAddTest)} style={{ padding:'8px 16px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#c6a34e,#a68a3c)', color:'#0a0e1a', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
          {showAddTest ? '✕ Annuler' : '+ Ajouter commission'}
        </button>
      </div>
      <p style={{ fontSize:12, color:'#9e9b93', margin:'0 0 20px' }}>
        {COMMISSION_PER_FICHE}€/fiche · {commercials.length} commerciaux · 🟢 = client payé · 🟡 = en attente
      </p>

      {KPIs([
        { l:'Total commissions', v:fmt(globalTotal), c:'#f97316' },
        { l:'À payer', v:fmt(globalPending), c: globalPending>0?'#eab308':'#22c55e' },
        { l:'Déjà payé', v:fmt(globalPaid), c:'#22c55e' },
        { l:'Total fiches', v:totalFiches, c:'#60a5fa' },
      ])}

      {/* Formulaire ajout commission */}
      {showAddTest && (
        <div style={{ background:'rgba(198,163,78,0.03)', border:'2px solid rgba(198,163,78,0.3)', borderRadius:12, padding:24, marginBottom:20 }}>
          <h3 style={{ margin:'0 0 14px', color:'#c6a34e', fontSize:15 }}>➕ Ajouter une commission</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12, marginBottom:14 }}>
            <div><label style={{ fontSize:11, color:'#9e9b93', display:'block', marginBottom:4 }}>Email commercial *</label><input value={testData.email} onChange={e=>setTestData({...testData,email:e.target.value})} placeholder="commercial@email.be" style={iS}/></div>
            <div><label style={{ fontSize:11, color:'#9e9b93', display:'block', marginBottom:4 }}>Nom client *</label><input value={testData.client} onChange={e=>setTestData({...testData,client:e.target.value})} placeholder="SPRL Dupont" style={iS}/></div>
            <div><label style={{ fontSize:11, color:'#9e9b93', display:'block', marginBottom:4 }}>Nombre fiches</label><input type="number" value={testData.fiches} onChange={e=>setTestData({...testData,fiches:e.target.value})} min="1" style={iS}/></div>
            <div><label style={{ fontSize:11, color:'#9e9b93', display:'block', marginBottom:4 }}>Période</label><input value={testData.period} onChange={e=>setTestData({...testData,period:e.target.value})} placeholder="Février 2026" style={iS}/></div>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:12, color:'#f97316', fontWeight:600 }}>
              Commission: {(parseInt(testData.fiches)||1)} × {COMMISSION_PER_FICHE}€ = {fmt((parseInt(testData.fiches)||1)*COMMISSION_PER_FICHE)}
            </div>
            <button onClick={addCommission} style={{ padding:'8px 20px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#c6a34e,#a68a3c)', color:'#0a0e1a', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              ✅ Ajouter
            </button>
          </div>
        </div>
      )}

      {commercials.length===0 && !showAddTest && <div style={{ background:'rgba(198,163,78,0.03)', border:'1px solid rgba(198,163,78,0.1)', borderRadius:12, textAlign:'center', padding:60, color:'#5e5c56' }}><div style={{ fontSize:48, marginBottom:12 }}>💰</div><div style={{ fontSize:16, fontWeight:600 }}>Aucune commission</div><div style={{ fontSize:13, marginTop:8 }}>Ajoutez manuellement ou elles seront créées lors de la distribution des fiches.</div></div>}

      {/* Liste commerciaux + détail */}
      <div style={{ display:'grid', gridTemplateColumns: selectedCommercial ? '1fr 1.2fr' : '1fr', gap:20 }}>
        <div>
          {commercials.map(([email, data]) => {
            const pending = data.total - data.paid;
            const pendingCount = data.entries.filter(e=>e.status==='pending').length;
            const paidCount = data.entries.filter(e=>e.status==='paid').length;
            return (
              <div key={email} onClick={() => setSelectedCommercial(selectedCommercial===email?null:email)} style={{
                background:'rgba(198,163,78,0.03)', border:`1px solid ${selectedCommercial===email?'rgba(249,115,22,0.4)':'rgba(198,163,78,0.1)'}`,
                borderRadius:12, padding:16, marginBottom:10, cursor:'pointer',
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:15, fontWeight:600, color:'#e8e6e0' }}>📈 {email}</div>
                    <div style={{ display:'flex', gap:12, marginTop:6, fontSize:11 }}>
                      <span style={{ color:'#f97316' }}>Total: {fmt(data.total)}</span>
                      {pendingCount>0 && <span style={{ color:'#eab308' }}>🟡 {pendingCount} en attente ({fmt(pending)})</span>}
                      {paidCount>0 && <span style={{ color:'#22c55e' }}>🟢 {paidCount} payé{paidCount>1?'s':''}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:22, fontWeight:700, color:'#f97316' }}>{fmt(data.total)}</div>
                    {pendingCount>0 && <button onClick={e=>{e.stopPropagation();markAllPaid(email);}} style={{ padding:'6px 12px', borderRadius:8, border:'none', background:'rgba(34,197,94,0.12)', color:'#22c55e', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', marginTop:4 }}>💸 Tout valider ({pendingCount})</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Panel détail */}
        {selectedCommercial && viewData && (
          <div style={{ background:'rgba(198,163,78,0.03)', border:'1px solid rgba(198,163,78,0.1)', borderRadius:12, padding:20, position:'sticky', top:20, alignSelf:'start', maxHeight:'85vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
              <h3 style={{ margin:0, color:'#f97316', fontSize:16 }}>📈 {selectedCommercial}</h3>
              <button onClick={() => setSelectedCommercial(null)} style={{ background:'none', border:'none', color:'#5e5c56', cursor:'pointer', fontSize:18 }}>✕</button>
            </div>

            <div style={{ display:'flex', gap:6, marginBottom:14 }}>
              {[{v:'pending',l:'🟡 En attente'},{v:'paid',l:'🟢 Payé'}].map(t => (
                <button key={t.v} onClick={() => setTab(t.v)} style={{
                  padding:'6px 14px', borderRadius:8, fontSize:11, cursor:'pointer', fontFamily:'inherit', fontWeight:tab===t.v?600:400,
                  border: tab===t.v ? '1px solid rgba(198,163,78,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  background: tab===t.v ? 'rgba(198,163,78,0.08)' : 'transparent',
                  color: tab===t.v ? '#c6a34e' : '#5e5c56',
                }}>
                  {t.l} ({viewData.entries.filter(e=>e.status===t.v).length})
                </button>
              ))}
            </div>

            {viewData.entries.filter(e=>e.status===tab).sort((a,b)=>new Date(b.date)-new Date(a.date)).map(e =>
              <EntryRow key={e.id} e={e} showPay={true} email={selectedCommercial}/>
            )}

            {viewData.entries.filter(e=>e.status===tab).length===0 && (
              <div style={{ textAlign:'center', padding:30, color:'#5e5c56', fontSize:12 }}>
                {tab==='pending' ? '✅ Aucune commission en attente' : 'Pas encore de paiements'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
