"use client";
// ═══════════════════════════════════════════════════════════
// Item #37 — MARKETPLACE INTEGRATIONS (Enhanced)
// Connecteurs: BOB50, Winbooks, Exact Online, Horus, Octopus
// Export comptable compatible logiciels comptables belges
// ═══════════════════════════════════════════════════════════
import React, { useState, useCallback } from 'react';

const GOLD='#c6a34e',GREEN='#22c55e',BLUE='#3b82f6';

const CONNECTORS = [
  { id:'bob50', name:'BOB 50', vendor:'Sage', logo:'📗', status:'ready',
    desc:'Export écritures comptables format BOB50 (.txt tab-separated)',
    formats:['TXT (BOB Import)','CSV'],
    map:{'620000':'Rémunérations','621000':'Cotisations patronales ONSS','453000':'Rémunérations dues','454000':'ONSS à payer','455000':'PP à payer'},
    gen:(e,p)=>{const l=[`"${p}"\t"OD"\t"SAL${p}"\t"Salaires ${p}"\t"${new Date().toISOString().slice(0,10)}"`];
      e.forEach(x=>l.push(`"${x.acc}"\t"${x.lbl}"\t${x.d.toFixed(2)}\t${x.c.toFixed(2)}\t"EUR"`));
      return{content:l.join('\n'),fn:`BOB50_SAL_${p}.txt`,type:'text/plain'}}},
  { id:'winbooks', name:'WinBooks', vendor:'WinBooks', logo:'📘', status:'ready',
    desc:'Export format WinBooks Classic et Connect',
    formats:['CSV (Connect)','DBF (Classic)','XML'],
    map:{'620':'Rémunérations','621':'Charges sociales','453':'Rémunérations dues','454':'ONSS','455':'PP'},
    gen:(e,p)=>{const l=['DBKCODE,DBKTYPE,DOCNUMBER,DOCDATE,PERIOD,ACCOUNT,AMOUNT,COMMENT'];
      e.forEach((x,i)=>{const a=x.d>0?x.d:-x.c;l.push(`OD,S,SAL${p}${String(i+1).padStart(3,'0')},${x.dt||''},${p},${x.acc},${a.toFixed(2)},"${x.lbl}"`)});
      return{content:l.join('\n'),fn:`WinBooks_SAL_${p}.csv`,type:'text/csv'}}},
  { id:'exact', name:'Exact Online', vendor:'Exact', logo:'📙', status:'ready',
    desc:'Export via CSV ou API REST Exact Online Belgique',
    formats:['CSV (Exact Import)','XML (API)'],
    map:{'6200':'Rémunérations brutes','6210':'ONSS patronal','4530':'Rémunérations à payer','4540':'ONSS à payer','4550':'PP à payer'},
    gen:(e,p)=>{const l=['Journal,EntryNumber,Date,AccountCode,Description,AmountDC,DCIndicator'];
      e.forEach((x,i)=>{const dc=x.d>0?'D':'C',a=x.d>0?x.d:x.c;l.push(`SAL,${String(i+1).padStart(5,'0')},${x.dt||''},${x.acc},"${x.lbl}",${a.toFixed(2)},${dc}`)});
      return{content:l.join('\n'),fn:`Exact_SAL_${p}.csv`,type:'text/csv'}}},
  { id:'horus', name:'Horus', vendor:'Horus Software', logo:'📕', status:'ready',
    desc:'Export comptable format Horus pour fiduciaires belges',
    formats:['CSV (Horus Import)','TXT'],
    map:{'6200':'Rémunérations','6210':'Charges sociales','4530':'Personnel à payer','4540':'ONSS','4550':'PP'},
    gen:(e,p)=>{const l=['Journal;NumDoc;Date;Compte;Libelle;Debit;Credit'];
      e.forEach((x,i)=>l.push(`DIV;SAL${p}${String(i+1).padStart(3,'0')};${x.dt||''};${x.acc};${x.lbl};${x.d.toFixed(2)};${x.c.toFixed(2)}`));
      return{content:l.join('\n'),fn:`Horus_SAL_${p}.csv`,type:'text/csv'}}},
  { id:'octopus', name:'Octopus', vendor:'Octopus', logo:'🐙', status:'ready',
    desc:'Export via API Octopus ou fichier CSV/JSON',
    formats:['JSON (API)','CSV (Octopus Import)'],
    map:{'620000':'Bezoldigingen','621000':'Werkgeversbijdragen RSZ','453000':'Te betalen bezoldigingen','454000':'RSZ','455000':'Bedrijfsvoorheffing'},
    gen:(e,p)=>{const j={bookYear:new Date().getFullYear(),period:parseInt(p.slice(-2))||1,journal:'OD',
      entries:e.map((x,i)=>({line:i+1,account:x.acc,desc:x.lbl,debit:x.d,credit:x.c,currency:'EUR'}))};
      return{content:JSON.stringify(j,null,2),fn:`Octopus_SAL_${p}.json`,type:'application/json'}}},
];

// Standard payroll → accounting entries converter
export function payrollToEntries(pr,mapOverrides={}){
  const dt=new Date().toISOString().slice(0,10);
  const e=[];
  if(pr.totalBrut)e.push({acc:mapOverrides['620000']||'620000',lbl:'Rémunérations brutes',d:pr.totalBrut,c:0,dt});
  if(pr.totalCotPat)e.push({acc:mapOverrides['621000']||'621000',lbl:'Cotisations patronales ONSS',d:pr.totalCotPat,c:0,dt});
  if(pr.totalNet)e.push({acc:mapOverrides['453000']||'453000',lbl:'Rémunérations nettes à payer',d:0,c:pr.totalNet,dt});
  if(pr.totalONSS)e.push({acc:mapOverrides['454000']||'454000',lbl:'ONSS à payer',d:0,c:(pr.totalONSS||0)+(pr.totalCotPat||0),dt});
  if(pr.totalPP)e.push({acc:mapOverrides['455000']||'455000',lbl:'Précompte professionnel à payer',d:0,c:pr.totalPP,dt});
  return e;
}

export function MarketplaceConnectors({payrollData,onExport}){
  const [sel,setSel]=useState(null);
  const [result,setResult]=useState(null);

  const doExport=useCallback((c)=>{
    const pr=payrollData||{totalBrut:127450,totalONSS:16629,totalPP:24890,totalNet:85931,totalCotPat:34320};
    const entries=payrollToEntries(pr,c.map);
    const period=new Date().toISOString().slice(0,7).replace('-','');
    const r=c.gen(entries,period);
    setResult(r);
    const blob=new Blob([r.content],{type:r.type});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=r.fn;a.click();
    URL.revokeObjectURL(url);
    onExport?.(c.id,r);
  },[payrollData,onExport]);

  const cs=(isSel)=>({padding:'20px',borderRadius:'16px',cursor:'pointer',
    border:`1px solid ${isSel?'rgba(198,163,78,.3)':'rgba(198,163,78,.04)'}`,
    background:isSel?'rgba(198,163,78,.06)':'rgba(255,255,255,.01)',transition:'all .3s'});

  return React.createElement('div',{style:{maxWidth:900,margin:'0 auto'}},
    React.createElement('div',{style:{fontSize:11,color:'#555',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:20}},'Connecteurs logiciels comptables'),
    React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'12px',marginBottom:'24px'},className:'aureus-grid-4'},
      CONNECTORS.map(c=>React.createElement('div',{key:c.id,style:cs(sel===c.id),onClick:()=>setSel(c.id),className:'hover-glow'},
        React.createElement('div',{style:{fontSize:28,marginBottom:8}},c.logo),
        React.createElement('div',{style:{fontSize:13,fontWeight:600,color:sel===c.id?GOLD:'#e5e5e5',marginBottom:4}},c.name),
        React.createElement('div',{style:{fontSize:10,color:'#666'}},c.vendor),
        React.createElement('div',{style:{marginTop:8}},
          React.createElement('span',{style:{padding:'3px 8px',borderRadius:50,fontSize:9,fontWeight:600,
            background:'rgba(34,197,94,.1)',color:GREEN}},'✓ Prêt'))
      ))
    ),
    sel&&(()=>{
      const c=CONNECTORS.find(x=>x.id===sel);if(!c)return null;
      return React.createElement('div',{style:{padding:'24px',borderRadius:'16px',border:'1px solid rgba(198,163,78,.08)',background:'rgba(255,255,255,.015)'}},
        React.createElement('div',{style:{display:'flex',alignItems:'center',gap:16,marginBottom:20}},
          React.createElement('span',{style:{fontSize:36}},c.logo),
          React.createElement('div',null,
            React.createElement('div',{style:{fontSize:18,fontWeight:600,color:'#e5e5e5'}},c.name),
            React.createElement('div',{style:{fontSize:12,color:'#999'}},c.desc))),
        React.createElement('div',{style:{marginBottom:16}},
          React.createElement('div',{style:{fontSize:10,color:'#555',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:8}},'Formats'),
          React.createElement('div',{style:{display:'flex',gap:8,flexWrap:'wrap'}},
            c.formats.map((f,i)=>React.createElement('span',{key:i,style:{padding:'4px 12px',borderRadius:6,fontSize:11,background:'rgba(198,163,78,.06)',color:'#999',border:'1px solid rgba(198,163,78,.08)'}},f)))),
        React.createElement('div',{style:{marginBottom:20}},
          React.createElement('div',{style:{fontSize:10,color:'#555',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:8}},'Mapping comptable'),
          React.createElement('div',{style:{display:'grid',gridTemplateColumns:'100px 1fr',gap:'4px 12px',fontSize:12}},
            Object.entries(c.map).flatMap(([k,v])=>[
              React.createElement('span',{key:k+'c',style:{fontFamily:"'JetBrains Mono',monospace",color:GOLD}},k),
              React.createElement('span',{key:k+'l',style:{color:'#999'}},v)]))),
        React.createElement('button',{onClick:()=>doExport(c),style:{padding:'14px 32px',borderRadius:12,border:'none',background:'linear-gradient(135deg,#c6a34e,#8b6914)',color:'#fff',fontWeight:700,fontSize:14,cursor:'pointer'}},'📥 Exporter vers '+c.name),
        result&&React.createElement('div',{style:{marginTop:16,padding:'12px 16px',borderRadius:10,background:'rgba(34,197,94,.06)',border:'1px solid rgba(34,197,94,.1)',fontSize:12,color:GREEN}},'✓ '+result.fn+' ('+Math.round(result.content.length/1024)+' KB)'));
    })()
  );
}

export default MarketplaceConnectors;

// ═══ IMPORT UI COMPONENT ═══
export function MarketplaceImport({ onImport }) {
  const [file, setFile] = React.useState(null);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const inputRef = React.useRef();

  const handleFile = async (f) => {
    if (!f) return;
    setFile(f); setError(null); setResult(null); setLoading(true);
    try {
      const { importFromFile } = await import('../lib/marketplace-import');
      const res = await importFromFile(f);
      setResult(res);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const confirm = () => {
    if (result?.employees && onImport) onImport(result.employees.filter(e => e._validation.nomOk));
  };

  const FORMATS = [
    { label: 'BOB50', ext: '.txt (TAB)', icon: '📊' },
    { label: 'Winbooks', ext: '.txt / .csv', icon: '📗' },
    { label: 'Exact Online', ext: '.csv', icon: '☁️' },
    { label: 'Horus', ext: '.csv (;)', icon: '📐' },
    { label: 'Octopus', ext: '.csv', icon: '🐙' },
    { label: 'Grand SS national', ext: '.csv / .xlsx', icon: '🔵' },
    { label: 'SS mutualiste', ext: '.csv', icon: '🟢' },
    { label: 'CSV Générique', ext: '.csv', icon: '📄' },
  ];

  return React.createElement('div', { style: { maxWidth: 800, margin: '0 auto' } },
    React.createElement('div', { style: { fontSize: 10, color: '#555', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 16, textAlign: 'center' } }, 'Importer des travailleurs'),

    // Supported formats
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 24 }, className: 'aureus-grid-3' },
      FORMATS.map((f, i) => React.createElement('div', { key: i, style: { textAlign: 'center', padding: '12px 8px', borderRadius: 10, border: '1px solid rgba(198,163,78,.05)', background: 'rgba(255,255,255,.01)' } },
        React.createElement('div', { style: { fontSize: 20 } }, f.icon),
        React.createElement('div', { style: { fontSize: 11, fontWeight: 600, color: '#e5e5e5', marginTop: 4 } }, f.label),
        React.createElement('div', { style: { fontSize: 9, color: '#555' } }, f.ext),
      ))
    ),

    // Drop zone
    React.createElement('div', {
      onClick: () => inputRef.current?.click(),
      onDragOver: e => { e.preventDefault(); e.currentTarget.style.borderColor = 'rgba(198,163,78,.4)'; },
      onDragLeave: e => { e.currentTarget.style.borderColor = 'rgba(198,163,78,.1)'; },
      onDrop: e => { e.preventDefault(); e.currentTarget.style.borderColor = 'rgba(198,163,78,.1)'; handleFile(e.dataTransfer.files[0]); },
      style: { border: '2px dashed rgba(198,163,78,.1)', borderRadius: 16, padding: '48px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all .3s', marginBottom: 20 }
    },
      React.createElement('input', { ref: inputRef, type: 'file', accept: '.csv,.txt,.tsv,.xlsx', style: { display: 'none' }, onChange: e => handleFile(e.target.files[0]) }),
      React.createElement('div', { style: { fontSize: 32, marginBottom: 8 } }, '📁'),
      React.createElement('div', { style: { fontSize: 14, color: '#e5e5e5', fontWeight: 500, marginBottom: 4 } }, file ? file.name : 'Glissez un fichier ou cliquez pour sélectionner'),
      React.createElement('div', { style: { fontSize: 11, color: '#555' } }, file ? (Math.round(file.size / 1024) + ' KB') : 'CSV, TXT, TSV — détection automatique du format')
    ),

    loading && React.createElement('div', { style: { textAlign: 'center', padding: 20, color: GOLD } }, 'Analyse en cours...'),
    error && React.createElement('div', { style: { padding: 16, borderRadius: 12, background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.1)', color: '#ef4444', fontSize: 12, marginBottom: 16 } }, '❌ ' + error),

    // Results
    result && React.createElement('div', null,
      // Summary KPIs
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 } },
        [
          { l: 'Total lignes', v: result.totalCount, c: '#e5e5e5' },
          { l: 'Valides', v: result.validCount, c: '#22c55e' },
          { l: 'Avertissements', v: result.warningCount, c: '#f97316' },
          { l: 'Format détecté', v: result.format, c: GOLD },
        ].map((k, i) => React.createElement('div', { key: i, style: { padding: '14px 16px', background: 'rgba(198,163,78,.04)', borderRadius: 12, border: '1px solid rgba(198,163,78,.06)' } },
          React.createElement('div', { style: { fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: '.5px' } }, k.l),
          React.createElement('div', { style: { fontSize: 20, fontWeight: 300, color: k.c, marginTop: 4, fontFamily: "'JetBrains Mono',monospace" } }, k.v)
        ))
      ),

      // Validation details
      result.validationSummary && React.createElement('div', { style: { padding: 16, borderRadius: 12, background: 'rgba(255,255,255,.01)', border: '1px solid rgba(198,163,78,.05)', marginBottom: 16, fontSize: 12 } },
        React.createElement('div', { style: { fontSize: 10, color: '#555', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 } }, 'Validation'),
        Object.entries(result.validationSummary).map(([k, v]) => React.createElement('div', { key: k, style: { display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: v > 0 ? '#f97316' : '#22c55e' } },
          React.createElement('span', null, { nissInvalid: 'NISS invalides', ibanInvalid: 'IBAN invalides', missingNom: 'Noms manquants', missingBrut: 'Salaires manquants' }[k] || k),
          React.createElement('span', { style: { fontWeight: 600 } }, v)
        ))
      ),

      // Preview table (first 5)
      React.createElement('div', { style: { overflowX: 'auto', marginBottom: 16 } },
        React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse', fontSize: 11 } },
          React.createElement('thead', null,
            React.createElement('tr', { style: { borderBottom: '1px solid rgba(198,163,78,.08)' } },
              ['Nom', 'Prénom', 'NISS', 'Brut', 'CP', 'IBAN', 'Status'].map((h, i) =>
                React.createElement('th', { key: i, style: { padding: '8px 10px', textAlign: 'left', fontSize: 9, color: GOLD, letterSpacing: '1px', textTransform: 'uppercase' } }, h)))),
          React.createElement('tbody', null,
            result.employees.slice(0, 8).map((emp, i) => React.createElement('tr', { key: i, style: { borderBottom: '1px solid rgba(255,255,255,.02)' } },
              React.createElement('td', { style: { padding: '6px 10px', color: '#e5e5e5' } }, emp.nom || '—'),
              React.createElement('td', { style: { padding: '6px 10px', color: '#e5e5e5' } }, emp.prenom || '—'),
              React.createElement('td', { style: { padding: '6px 10px', color: emp.nissValid ? '#22c55e' : '#ef4444', fontFamily: "'JetBrains Mono',monospace" } }, emp.niss ? (emp.niss.substring(0, 2) + '.XX.XX-XXX.' + emp.niss.slice(-2)) : '—'),
              React.createElement('td', { style: { padding: '6px 10px', color: '#e5e5e5', fontFamily: "'JetBrains Mono',monospace" } }, emp.brut ? (emp.brut.toFixed(2) + ' €') : '—'),
              React.createElement('td', { style: { padding: '6px 10px', color: '#999' } }, emp.cp || '—'),
              React.createElement('td', { style: { padding: '6px 10px', color: emp.ibanValid ? '#22c55e' : '#f97316', fontSize: 10 } }, emp.iban ? (emp.iban.substring(0, 4) + '****' + emp.iban.slice(-4)) : '—'),
              React.createElement('td', { style: { padding: '6px 10px' } },
                React.createElement('span', { style: { padding: '2px 8px', borderRadius: 50, fontSize: 9, fontWeight: 600, background: emp._validation.nomOk && emp._validation.niss.valid ? 'rgba(34,197,94,.1)' : 'rgba(249,115,22,.1)', color: emp._validation.nomOk && emp._validation.niss.valid ? '#22c55e' : '#f97316' } }, emp._validation.nomOk && emp._validation.niss.valid ? '✓ OK' : '⚠ Vérifier')
              )
            )))
        )
      ),

      result.employees.length > 8 && React.createElement('div', { style: { fontSize: 11, color: '#555', marginBottom: 16 } }, '... et ' + (result.employees.length - 8) + ' autres travailleurs'),

      // Confirm button
      React.createElement('div', { style: { textAlign: 'center' } },
        React.createElement('button', {
          onClick: confirm,
          style: { padding: '14px 40px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#c6a34e,#8b6914)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }
        }, '✓ Importer ' + result.validCount + ' travailleurs valides')
      )
    )
  );
}
