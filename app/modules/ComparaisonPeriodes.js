"use client";
// ═══════════════════════════════════════════════════════════
// Item #20 — COMPARAISON INTER-PÉRIODES
// Compare payroll month N vs N-1 or N vs N-12
// ═══════════════════════════════════════════════════════════
import React, { useState, useMemo } from 'react';

const GOLD='#c6a34e',GREEN='#22c55e',RED='#ef4444';

function DeltaBadge({old,now}){
  if(!old||!now)return null;
  const delta=now-old;const pct=old?Math.round(delta/old*100):0;
  const isPos=delta>0;
  return React.createElement('span',{style:{
    padding:'3px 10px',borderRadius:50,fontSize:10,fontWeight:600,
    background:isPos?'rgba(239,68,68,.1)':'rgba(34,197,94,.1)',
    color:isPos?RED:GREEN
  }},(isPos?'+':'')+pct+'%');
}

export function ComparaisonPeriodes({payrollHistory=[]}){
  const [mode,setMode]=useState('m1'); // m1 = N vs N-1, m12 = N vs N-12

  const mockCurrent={brut:127450,onss:16629,pp:24890,net:85931,effectifs:42,coutTotal:161850};
  const mockPrev=mode==='m1'?
    {brut:125200,onss:16335,pp:24300,net:84565,effectifs:41,coutTotal:159000}:
    {brut:118500,onss:15461,pp:22890,net:80149,effectifs:38,coutTotal:150500};

  const rows=[
    {label:'Masse salariale brute',k:'brut'},
    {label:'Cotisations ONSS',k:'onss'},
    {label:'Précompte professionnel',k:'pp'},
    {label:'Net total',k:'net'},
    {label:'Effectifs (ETP)',k:'effectifs',noEuro:true},
    {label:'Coût total employeur',k:'coutTotal'},
  ];

  return React.createElement('div',{style:{maxWidth:700,margin:'0 auto'}},
    React.createElement('div',{style:{display:'flex',gap:8,marginBottom:24,justifyContent:'center'}},
      [{k:'m1',l:'Mois N vs N-1'},{k:'m12',l:'Mois N vs N-12'}].map(m=>
        React.createElement('button',{key:m.k,onClick:()=>setMode(m.k),style:{
          padding:'10px 20px',borderRadius:10,border:`1px solid ${mode===m.k?'rgba(198,163,78,.3)':'rgba(198,163,78,.08)'}`,
          background:mode===m.k?'rgba(198,163,78,.08)':'transparent',color:mode===m.k?GOLD:'#999',cursor:'pointer',fontSize:13,fontWeight:600
        }},m.l)
      )
    ),
    React.createElement('div',{style:{borderRadius:16,border:'1px solid rgba(198,163,78,.06)',overflow:'hidden'}},
      React.createElement('table',{style:{width:'100%',borderCollapse:'collapse'}},
        React.createElement('thead',null,
          React.createElement('tr',{style:{background:'rgba(198,163,78,.04)'}},
            React.createElement('th',{style:{padding:'12px 16px',textAlign:'left',fontSize:11,color:'#555',letterSpacing:'1px'}},''),
            React.createElement('th',{style:{padding:'12px 16px',textAlign:'right',fontSize:11,color:GOLD,letterSpacing:'1px'}},'ACTUEL'),
            React.createElement('th',{style:{padding:'12px 16px',textAlign:'right',fontSize:11,color:'#555',letterSpacing:'1px'}},mode==='m1'?'N-1':'N-12'),
            React.createElement('th',{style:{padding:'12px 16px',textAlign:'right',fontSize:11,color:'#555',letterSpacing:'1px'}},'DELTA')
          )
        ),
        React.createElement('tbody',null,
          rows.map((r,i)=>
            React.createElement('tr',{key:i,style:{borderBottom:'1px solid rgba(255,255,255,.02)'}},
              React.createElement('td',{style:{padding:'12px 16px',fontSize:13,color:'#999'}},r.label),
              React.createElement('td',{style:{padding:'12px 16px',textAlign:'right',fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:'#e5e5e5'}},(r.noEuro?'':'\u20AC ')+mockCurrent[r.k].toLocaleString('fr-BE')),
              React.createElement('td',{style:{padding:'12px 16px',textAlign:'right',fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:'#666'}},(r.noEuro?'':'\u20AC ')+mockPrev[r.k].toLocaleString('fr-BE')),
              React.createElement('td',{style:{padding:'12px 16px',textAlign:'right'}},React.createElement(DeltaBadge,{old:mockPrev[r.k],now:mockCurrent[r.k]}))
            )
          )
        )
      )
    )
  );
}

export default ComparaisonPeriodes;
