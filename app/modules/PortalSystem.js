// ═══════════════════════════════════════════════════════════════════
// ARCHITECTURE MULTI-PORTAIL — Aureus Social Pro
// ═══════════════════════════════════════════════════════════════════
// 3 Portails : Admin | Client (Employeur) | Employé
// URLs :
//   app.aureussocial.be               → Admin (accès complet)
//   app.aureussocial.be?portal=client  → Portail Client (vue employeur)
//   app.aureussocial.be?portal=employee → Portail Employé (espace personnel)
// ═══════════════════════════════════════════════════════════════════
"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';

const GOLD='#c6a34e',GREEN='#22c55e',BLUE='#3b82f6',RED='#ef4444',PURPLE='#a855f7';

// ── Portal Detection ──
export function usePortalMode() {
  const [portal, setPortal] = useState('admin');
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('portal');
    if (p === 'client' || p === 'employee') setPortal(p);
    else setPortal('admin');
    
    // Listen for popstate (back/forward)
    const onPop = () => {
      const pp = new URLSearchParams(window.location.search).get('portal');
      setPortal(pp === 'client' || pp === 'employee' ? pp : 'admin');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  
  const switchPortal = useCallback((newPortal) => {
    const url = new URL(window.location);
    if (newPortal === 'admin') url.searchParams.delete('portal');
    else url.searchParams.set('portal', newPortal);
    window.history.pushState({}, '', url);
    setPortal(newPortal);
  }, []);
  
  return { portal, switchPortal };
}

// ── Portal Configuration ──
export const PORTAL_CONFIG = {
  admin: {
    label: 'Administration',
    subtitle: 'SECRÉTARIAT SOCIAL',
    icon: '👑',
    color: GOLD,
    gradient: 'linear-gradient(180deg,#080b14,#060810)',
    defaultPage: 'dashboard',
    logoText: 'AUREUS SOCIAL',
    // Admin sees ALL nav items
    allowedGroups: [1,2,3,4],
  },
  client: {
    label: 'Portail Employeur',
    subtitle: 'ESPACE CLIENT',
    icon: '🏢',
    color: GREEN,
    gradient: 'linear-gradient(180deg,#071410,#051008)',
    defaultPage: 'client_dashboard',
    logoText: 'AUREUS CLIENT',
    allowedPages: [
      'client_dashboard','employees','payslip','contratsmenu','rh',
      'onss','fiscal','sepa','reporting','ged','portailclient',
      'planifconges','gestionabs','formationsuivi','echeancier',
      'client_factures','client_declarations','client_documents'
    ],
  },
  employee: {
    label: 'Portail Employé',
    subtitle: 'ESPACE PERSONNEL',
    icon: '👤',
    color: BLUE,
    gradient: 'linear-gradient(180deg,#070d18,#050a14)',
    defaultPage: 'emp_dashboard',
    logoText: 'MON ESPACE',
    allowedPages: [
      'emp_dashboard','emp_payslips','emp_leave','emp_documents',
      'emp_profile','emp_training','emp_timesheet'
    ],
  }
};

// ── Client Portal Nav ──
export const CLIENT_NAV = [
  {id:"_gc1",l:"MON ENTREPRISE",grp:true},
  {id:"client_dashboard",l:"Tableau de Bord",i:'◫'},
  {id:"employees",l:"Travailleurs",i:'👥'},
  {id:"payslip",l:"Fiches de Paie",i:'◈'},
  
  {id:"_gc2",l:"DÉCLARATIONS",grp:true},
  {id:"onss",l:"ONSS / Dimona",i:'🏛',sub:[{id:"dimona",l:"📡 Dimona"},{id:"dmfa",l:"📊 DmfA"},{id:"onss_dash",l:"📊 Dashboard ONSS"}]},
  {id:"fiscal",l:"Fiscal",i:'💰',sub:[{id:"belcotax",l:"📋 Belcotax"},{id:"précompte",l:"💶 Précompte"}]},
  {id:"sepa",l:"SEPA & Paiements",i:'💳'},
  {id:"echeancier",l:"Échéancier",i:'📆'},
  
  {id:"_gc3",l:"GESTION RH",grp:true},
  {id:"contratsmenu",l:"Contrats",i:'📝',sub:[{id:"contrats",l:"📝 Contrats"},{id:"contratgen",l:"📝 Générer Contrat"}]},
  {id:"rh",l:"Absences & Congés",i:'🏖',sub:[{id:"gestionabs",l:"🗓 Absences"},{id:"planifconges",l:"📅 Planning Congés"}]},
  {id:"formationsuivi",l:"Formations",i:'🎓'},
  
  {id:"_gc4",l:"DOCUMENTS",grp:true},
  {id:"ged",l:"Documents (GED)",i:'📁'},
  {id:"client_factures",l:"Mes Factures",i:'🧾'},
  {id:"reporting",l:"Rapports",i:'📊',sub:[{id:"rapports",l:"📊 Rapports Mensuels"},{id:"bilansocial",l:"📋 Bilan Social"}]},
];

// ── Employee Portal Nav ──
export const EMPLOYEE_NAV = [
  {id:"_ge1",l:"MON ESPACE",grp:true},
  {id:"emp_dashboard",l:"Mon Tableau de Bord",i:'◫'},
  {id:"emp_payslips",l:"Mes Fiches de Paie",i:'◈'},
  {id:"emp_leave",l:"Congés & Absences",i:'🏖'},

  {id:"_ge2",l:"MES DOCUMENTS",grp:true},
  {id:"emp_documents",l:"Mes Documents",i:'📁'},
  {id:"emp_profile",l:"Mon Profil",i:'👤'},

  {id:"_ge3",l:"DIVERS",grp:true},
  {id:"emp_training",l:"Mes Formations",i:'🎓'},
  {id:"emp_timesheet",l:"Mes Prestations",i:'⏱'},
];

// ═══════════════════════════════════════════════════════════════════
// COMPOSANT : Portail Employé — Dashboard
// ═══════════════════════════════════════════════════════════════════
export function EmployeeDashboard({s, d, employee}) {
  const emp = employee || s.emps?.[0] || {};
  const pays = s.pays || [];
  const lastPay = pays.filter(p => p.eid === emp.id).sort((a,b) => (b.year*12+b.month) - (a.year*12+a.month))[0];
  
  const cs = {padding:'20px',borderRadius:'14px',border:'1px solid rgba(59,130,246,.06)',background:'rgba(255,255,255,.01)'};
  const stats = [
    {l:'Solde Congés',v: emp.congesRestants || '20',u:'jours',c:BLUE,i:'🏖'},
    {l:'Ancienneté',v: emp.anciennete || '2 ans',u:'',c:GREEN,i:'📅'},
    {l:'Dernier Net',v: lastPay ? `€${lastPay.net?.toFixed(2)}` : '—',u:'',c:GOLD,i:'💶'},
    {l:'Documents',v: '12',u:'fichiers',c:PURPLE,i:'📁'},
  ];

  return React.createElement('div',{style:{maxWidth:960,margin:'0 auto'}},
    // Welcome banner
    React.createElement('div',{style:{padding:'28px 24px',borderRadius:16,background:'linear-gradient(135deg,rgba(59,130,246,.08),rgba(59,130,246,.02))',border:'1px solid rgba(59,130,246,.12)',marginBottom:24}},
      React.createElement('div',{style:{fontSize:24,fontWeight:300,color:'#e5e5e5',marginBottom:4}},`Bonjour, ${emp.prenom || emp.nom || 'Collaborateur'} 👋`),
      React.createElement('div',{style:{fontSize:12,color:'#888'}},'Bienvenue dans votre espace personnel Aureus Social')
    ),
    
    // KPI cards
    React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24},className:'aureus-kpi-grid'},
      stats.map((k,i) => React.createElement('div',{key:i,style:cs},
        React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}},
          React.createElement('div',{style:{fontSize:10,color:'#555',letterSpacing:'1.5px',textTransform:'uppercase'}},k.l),
          React.createElement('span',{style:{fontSize:18}},k.i)
        ),
        React.createElement('div',{style:{fontSize:24,fontWeight:300,color:k.c}},k.v),
        k.u && React.createElement('div',{style:{fontSize:10,color:'#666',marginTop:2}},k.u)
      ))
    ),
    
    // Quick actions
    React.createElement('div',{style:{...cs,marginBottom:24}},
      React.createElement('div',{style:{fontSize:11,color:'#555',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:16}},'Actions rapides'),
      React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}},
        [{i:'📄',l:'Dernière fiche',a:'emp_payslips',c:'rgba(198,163,78,.08)',bc:'rgba(198,163,78,.12)'},
         {i:'🏖',l:'Demander un congé',a:'emp_leave',c:'rgba(59,130,246,.08)',bc:'rgba(59,130,246,.12)'},
         {i:'📁',l:'Mes documents',a:'emp_documents',c:'rgba(34,197,94,.08)',bc:'rgba(34,197,94,.12)'},
         {i:'👤',l:'Mon profil',a:'emp_profile',c:'rgba(168,85,247,.08)',bc:'rgba(168,85,247,.12)'}
        ].map((a,i) => React.createElement('button',{key:i,onClick:()=>d({type:'NAV',page:a.a}),
          style:{padding:16,borderRadius:12,border:'1px solid '+a.bc,background:a.c,cursor:'pointer',textAlign:'center',fontFamily:'inherit',transition:'all .2s'}},
          React.createElement('div',{style:{fontSize:24,marginBottom:6}},a.i),
          React.createElement('div',{style:{fontSize:11,color:'#e5e5e5',fontWeight:500}},a.l)
        ))
      )
    ),
    
    // Recent payslips
    React.createElement('div',{style:cs},
      React.createElement('div',{style:{fontSize:11,color:'#555',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:16}},'Dernières fiches de paie'),
      pays.filter(p => p.eid === emp.id).slice(0,3).length > 0
        ? pays.filter(p => p.eid === emp.id).sort((a,b) => (b.year*12+b.month) - (a.year*12+a.month)).slice(0,3).map((p,i) =>
            React.createElement('div',{key:i,style:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom: i < 2 ? '1px solid rgba(59,130,246,.06)' : 'none'}},
              React.createElement('div',null,
                React.createElement('div',{style:{fontSize:13,color:'#e5e5e5',fontWeight:500}},`${['','Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'][p.month] || p.month} ${p.year}`),
                React.createElement('div',{style:{fontSize:11,color:'#888'}},'Fiche de paie mensuelle')
              ),
              React.createElement('div',{style:{textAlign:'right'}},
                React.createElement('div',{style:{fontSize:14,fontWeight:600,color:GREEN}},`€${p.net?.toFixed(2) || '—'}`),
                React.createElement('button',{style:{fontSize:10,color:BLUE,background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',marginTop:2}},'📄 Télécharger PDF')
              )
            ))
        : React.createElement('div',{style:{textAlign:'center',padding:30,color:'#666',fontSize:12}},'Aucune fiche de paie disponible')
    )
  );
}

// ═══════════════════════════════════════════════════════════════════
// COMPOSANT : Portail Employé — Mes Fiches de Paie
// ═══════════════════════════════════════════════════════════════════
export function EmployeePayslips({s, d, employee}) {
  const [year, setYear] = useState(2026);
  const emp = employee || s.emps?.[0] || {};
  const pays = (s.pays || []).filter(p => p.eid === emp.id && p.year === year)
    .sort((a,b) => b.month - a.month);
  const MONTHS=['','Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  
  const cs = {padding:'20px',borderRadius:'14px',border:'1px solid rgba(59,130,246,.06)',background:'rgba(255,255,255,.01)'};
  
  return React.createElement('div',{style:{maxWidth:960,margin:'0 auto'}},
    React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}},
      React.createElement('div',null,
        React.createElement('div',{style:{fontSize:22,fontWeight:300,color:'#e5e5e5'}},'Mes Fiches de Paie'),
        React.createElement('div',{style:{fontSize:12,color:'#888',marginTop:4}},`${emp.prenom||''} ${emp.nom||''} — ${pays.length} fiche(s) en ${year}`)
      ),
      React.createElement('div',{style:{display:'flex',gap:6}},
        [2024,2025,2026].map(y => React.createElement('button',{key:y,onClick:()=>setYear(y),
          style:{padding:'6px 14px',borderRadius:8,border:year===y?'1px solid rgba(59,130,246,.3)':'1px solid rgba(255,255,255,.06)',
            background:year===y?'rgba(59,130,246,.12)':'transparent',color:year===y?BLUE:'#666',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}},y))
      )
    ),
    // Monthly grid
    React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}},
      Array.from({length:12},(_,i)=>i+1).map(m => {
        const pay = pays.find(p => p.month === m);
        const available = !!pay;
        return React.createElement('div',{key:m,style:{...cs,opacity:available?1:.4,cursor:available?'pointer':'default',transition:'all .2s',
          border:available?'1px solid rgba(59,130,246,.12)':'1px solid rgba(255,255,255,.04)'}},
          React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center'}},
            React.createElement('div',null,
              React.createElement('div',{style:{fontSize:13,fontWeight:600,color:available?'#e5e5e5':'#555'}},MONTHS[m]),
              React.createElement('div',{style:{fontSize:10,color:'#666'}},year)
            ),
            available
              ? React.createElement('div',{style:{textAlign:'right'}},
                  React.createElement('div',{style:{fontSize:16,fontWeight:600,color:GREEN}},`€${pay.net?.toFixed(2)}`),
                  React.createElement('div',{style:{fontSize:9,color:'#888'}},`Brut: €${pay.brut?.toFixed(2) || '—'}`)
                )
              : React.createElement('div',{style:{fontSize:10,color:'#555'}},'—')
          ),
          available && React.createElement('div',{style:{display:'flex',gap:8,marginTop:12}},
            React.createElement('button',{style:{flex:1,padding:'6px',borderRadius:6,border:'1px solid rgba(59,130,246,.2)',background:'rgba(59,130,246,.06)',color:BLUE,fontSize:10,cursor:'pointer',fontFamily:'inherit',fontWeight:600}},'📄 PDF'),
            React.createElement('button',{style:{flex:1,padding:'6px',borderRadius:6,border:'1px solid rgba(198,163,78,.2)',background:'rgba(198,163,78,.06)',color:GOLD,fontSize:10,cursor:'pointer',fontFamily:'inherit',fontWeight:600}},'👁 Détail')
          )
        );
      })
    )
  );
}

// ═══════════════════════════════════════════════════════════════════
// COMPOSANT : Portail Employé — Congés & Absences
// ═══════════════════════════════════════════════════════════════════
export function EmployeeLeave({s, d, employee}) {
  const [tab, setTab] = useState('solde');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({type:'annuel',debut:'',fin:'',motif:''});
  const emp = employee || s.emps?.[0] || {};
  
  const cs = {padding:'20px',borderRadius:'14px',border:'1px solid rgba(59,130,246,.06)',background:'rgba(255,255,255,.01)'};
  const ts = (a) => ({padding:'8px 18px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:a?600:400,fontFamily:'inherit',
    background:a?'rgba(59,130,246,.15)':'rgba(255,255,255,.03)',color:a?BLUE:'#9e9b93',transition:'all .3s'});
  
  const soldes = [
    {l:'Congés annuels',total:20,pris:8,c:BLUE,i:'🏖'},
    {l:'Récupération',total:6,pris:2,c:GREEN,i:'🔄'},
    {l:'Maladie',total:'-',pris:3,c:RED,i:'🏥'},
    {l:'Formation',total:5,pris:1,c:PURPLE,i:'🎓'},
  ];
  
  const demandes = [
    {id:1,type:'Congé annuel',debut:'2026-03-15',fin:'2026-03-19',jours:5,status:'approuvé',by:'Marie D.'},
    {id:2,type:'Récupération',debut:'2026-02-14',fin:'2026-02-14',jours:1,status:'approuvé',by:'Marie D.'},
    {id:3,type:'Congé annuel',debut:'2026-04-21',fin:'2026-04-25',jours:5,status:'en_attente',by:null},
  ];
  
  return React.createElement('div',{style:{maxWidth:960,margin:'0 auto'}},
    React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}},
      React.createElement('div',{style:{fontSize:22,fontWeight:300,color:'#e5e5e5'}},'Congés & Absences'),
      React.createElement('button',{onClick:()=>setShowForm(!showForm),
        style:{padding:'10px 20px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#3b82f6,#2563eb)',color:'#fff',fontWeight:600,fontSize:12,cursor:'pointer',fontFamily:'inherit'}},
        showForm ? '✕ Annuler' : '+ Nouvelle demande')
    ),
    
    // New request form
    showForm && React.createElement('div',{style:{...cs,marginBottom:20,border:'1px solid rgba(59,130,246,.2)',background:'rgba(59,130,246,.04)'}},
      React.createElement('div',{style:{fontSize:14,fontWeight:600,color:BLUE,marginBottom:16}},'📝 Nouvelle demande de congé'),
      React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}},
        React.createElement('div',null,
          React.createElement('label',{style:{display:'block',fontSize:10,color:'#888',marginBottom:4}},'Type'),
          React.createElement('select',{value:form.type,onChange:e=>setForm({...form,type:e.target.value}),
            style:{width:'100%',padding:'8px',borderRadius:8,border:'1px solid rgba(59,130,246,.15)',background:'rgba(0,0,0,.2)',color:'#e5e5e5',fontSize:12,fontFamily:'inherit'}},
            React.createElement('option',{value:'annuel'},'Congé annuel'),
            React.createElement('option',{value:'recup'},'Récupération'),
            React.createElement('option',{value:'formation'},'Formation'),
            React.createElement('option',{value:'sans_solde'},'Sans solde')
          )
        ),
        React.createElement('div',null,
          React.createElement('label',{style:{display:'block',fontSize:10,color:'#888',marginBottom:4}},'Du'),
          React.createElement('input',{type:'date',value:form.debut,onChange:e=>setForm({...form,debut:e.target.value}),
            style:{width:'100%',padding:'8px',borderRadius:8,border:'1px solid rgba(59,130,246,.15)',background:'rgba(0,0,0,.2)',color:'#e5e5e5',fontSize:12,fontFamily:'inherit',boxSizing:'border-box'}})
        ),
        React.createElement('div',null,
          React.createElement('label',{style:{display:'block',fontSize:10,color:'#888',marginBottom:4}},'Au'),
          React.createElement('input',{type:'date',value:form.fin,onChange:e=>setForm({...form,fin:e.target.value}),
            style:{width:'100%',padding:'8px',borderRadius:8,border:'1px solid rgba(59,130,246,.15)',background:'rgba(0,0,0,.2)',color:'#e5e5e5',fontSize:12,fontFamily:'inherit',boxSizing:'border-box'}})
        ),
        React.createElement('div',{style:{display:'flex',alignItems:'flex-end'}},
          React.createElement('button',{onClick:()=>{alert('✅ Demande envoyée !');setShowForm(false);setForm({type:'annuel',debut:'',fin:'',motif:''});},
            style:{width:'100%',padding:'8px',borderRadius:8,border:'none',background:'linear-gradient(135deg,#3b82f6,#2563eb)',color:'#fff',fontWeight:600,fontSize:12,cursor:'pointer',fontFamily:'inherit'}},'Envoyer')
        )
      )
    ),
    
    // Tabs
    React.createElement('div',{style:{display:'flex',gap:6,marginBottom:20}},
      [{id:'solde',l:'📊 Soldes'},{id:'demandes',l:'📋 Mes demandes'},{id:'calendrier',l:'📅 Calendrier'}].map(t =>
        React.createElement('button',{key:t.id,onClick:()=>setTab(t.id),style:ts(tab===t.id)},t.l))
    ),
    
    tab==='solde' && React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}},
      soldes.map((s,i) => React.createElement('div',{key:i,style:cs},
        React.createElement('div',{style:{display:'flex',justifyContent:'space-between',marginBottom:12}},
          React.createElement('span',{style:{fontSize:20}},s.i),
          React.createElement('div',{style:{fontSize:10,color:'#666',textAlign:'right'}},
            s.total !== '-' ? `${s.total - s.pris} restant(s)` : `${s.pris} jour(s)`)
        ),
        React.createElement('div',{style:{fontSize:12,fontWeight:600,color:'#e5e5e5',marginBottom:8}},s.l),
        s.total !== '-' && React.createElement('div',{style:{height:6,borderRadius:3,background:'rgba(255,255,255,.06)',overflow:'hidden'}},
          React.createElement('div',{style:{height:'100%',borderRadius:3,width:`${(s.pris/s.total)*100}%`,background:s.c,transition:'width .5s'}})
        ),
        React.createElement('div',{style:{display:'flex',justifyContent:'space-between',fontSize:10,color:'#888',marginTop:6}},
          React.createElement('span',null,`Pris: ${s.pris}`),
          s.total !== '-' && React.createElement('span',null,`Total: ${s.total}`)
        )
      ))
    ),
    
    tab==='demandes' && React.createElement('div',{style:cs},
      React.createElement('table',{style:{width:'100%',borderCollapse:'collapse'}},
        React.createElement('thead',null,React.createElement('tr',{style:{borderBottom:'1px solid rgba(59,130,246,.08)'}},
          ['Type','Début','Fin','Jours','Statut','Validé par'].map((h,i) =>
            React.createElement('th',{key:i,style:{padding:'10px 12px',textAlign:'left',fontSize:10,color:BLUE,letterSpacing:'1px',textTransform:'uppercase'}},h))
        )),
        React.createElement('tbody',null,demandes.map((r,i) =>
          React.createElement('tr',{key:i,style:{borderBottom:'1px solid rgba(255,255,255,.02)'}},
            React.createElement('td',{style:{padding:'10px 12px',fontSize:13,color:'#e5e5e5'}},r.type),
            React.createElement('td',{style:{padding:'10px 12px',fontSize:12,color:'#999'}},r.debut),
            React.createElement('td',{style:{padding:'10px 12px',fontSize:12,color:'#999'}},r.fin),
            React.createElement('td',{style:{padding:'10px 12px',fontSize:13,fontWeight:600,color:'#e5e5e5'}},r.jours),
            React.createElement('td',{style:{padding:'10px 12px'}},
              React.createElement('span',{style:{padding:'3px 10px',borderRadius:50,fontSize:10,fontWeight:600,
                background:r.status==='approuvé'?'rgba(34,197,94,.1)':r.status==='en_attente'?'rgba(234,179,8,.1)':'rgba(239,68,68,.1)',
                color:r.status==='approuvé'?GREEN:r.status==='en_attente'?'#eab308':RED}},
                r.status==='approuvé'?'✓ Approuvé':r.status==='en_attente'?'⏳ En attente':'✕ Refusé')
            ),
            React.createElement('td',{style:{padding:'10px 12px',fontSize:12,color:'#888'}},r.by||'—')
          )))
      )
    ),
    
    tab==='calendrier' && React.createElement('div',{style:{...cs,textAlign:'center',padding:40}},
      React.createElement('div',{style:{fontSize:48,marginBottom:12}},'📅'),
      React.createElement('div',{style:{fontSize:14,color:'#888'}},'Vue calendrier bientôt disponible'),
      React.createElement('div',{style:{fontSize:11,color:'#555',marginTop:8}},'Planifiez vos congés dans l\'onglet "Mes demandes"')
    )
  );
}

// ═══════════════════════════════════════════════════════════════════
// COMPOSANT : Portail Employé — Mes Documents
// ═══════════════════════════════════════════════════════════════════
export function EmployeeDocuments({s, d, employee}) {
  const emp = employee || s.emps?.[0] || {};
  
  const docs = [
    {id:1,name:'Contrat de travail',cat:'Contrat',date:'2024-01-15',size:'245 Ko',i:'📝'},
    {id:2,name:'Avenant salaire 2025',cat:'Contrat',date:'2025-01-01',size:'128 Ko',i:'📝'},
    {id:3,name:'Fiche paie Janvier 2026',cat:'Paie',date:'2026-01-31',size:'89 Ko',i:'💶'},
    {id:4,name:'Fiche paie Février 2026',cat:'Paie',date:'2026-02-28',size:'91 Ko',i:'💶'},
    {id:5,name:'Attestation de travail',cat:'Administratif',date:'2025-06-15',size:'56 Ko',i:'📄'},
    {id:6,name:'Fiche 281.10 (2025)',cat:'Fiscal',date:'2026-02-15',size:'134 Ko',i:'💰'},
    {id:7,name:'Règlement de travail',cat:'Entreprise',date:'2024-01-01',size:'890 Ko',i:'📋'},
    {id:8,name:'Convention CCT',cat:'Entreprise',date:'2024-03-01',size:'456 Ko',i:'⚖️'},
    {id:9,name:'Attestation médecine du travail',cat:'Santé',date:'2025-09-20',size:'78 Ko',i:'🏥'},
    {id:10,name:'Certificat formation sécurité',cat:'Formation',date:'2025-11-10',size:'112 Ko',i:'🎓'},
  ];
  
  const [filter, setFilter] = useState('all');
  const cats = [...new Set(docs.map(d=>d.cat))];
  const filtered = filter === 'all' ? docs : docs.filter(d=>d.cat===filter);
  
  const cs = {padding:'20px',borderRadius:'14px',border:'1px solid rgba(59,130,246,.06)',background:'rgba(255,255,255,.01)'};
  
  return React.createElement('div',{style:{maxWidth:960,margin:'0 auto'}},
    React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}},
      React.createElement('div',null,
        React.createElement('div',{style:{fontSize:22,fontWeight:300,color:'#e5e5e5'}},'Mes Documents'),
        React.createElement('div',{style:{fontSize:12,color:'#888',marginTop:4}},`${docs.length} documents disponibles`)
      ),
      React.createElement('div',{style:{display:'flex',gap:6,flexWrap:'wrap'}},
        [{id:'all',l:'Tous'},...cats.map(c=>({id:c,l:c}))].map(f =>
          React.createElement('button',{key:f.id,onClick:()=>setFilter(f.id),
            style:{padding:'5px 12px',borderRadius:6,border:filter===f.id?'1px solid rgba(59,130,246,.3)':'1px solid rgba(255,255,255,.06)',
              background:filter===f.id?'rgba(59,130,246,.12)':'transparent',color:filter===f.id?BLUE:'#666',fontSize:10,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}},f.l))
      )
    ),
    React.createElement('div',{style:cs},
      React.createElement('table',{style:{width:'100%',borderCollapse:'collapse'}},
        React.createElement('thead',null,React.createElement('tr',{style:{borderBottom:'1px solid rgba(59,130,246,.08)'}},
          ['','Document','Catégorie','Date','Taille',''].map((h,i) =>
            React.createElement('th',{key:i,style:{padding:'10px 12px',textAlign:'left',fontSize:10,color:BLUE,letterSpacing:'1px',textTransform:'uppercase'}},h))
        )),
        React.createElement('tbody',null,filtered.map((doc,i) =>
          React.createElement('tr',{key:doc.id,style:{borderBottom:'1px solid rgba(255,255,255,.02)',cursor:'pointer',transition:'all .15s'},
            onMouseEnter:e=>{e.currentTarget.style.background='rgba(59,130,246,.03)'},
            onMouseLeave:e=>{e.currentTarget.style.background='transparent'}},
            React.createElement('td',{style:{padding:'10px 12px',fontSize:18}},doc.i),
            React.createElement('td',{style:{padding:'10px 12px',fontSize:13,color:'#e5e5e5',fontWeight:500}},doc.name),
            React.createElement('td',{style:{padding:'10px 12px'}},
              React.createElement('span',{style:{padding:'3px 10px',borderRadius:50,fontSize:9,background:'rgba(59,130,246,.08)',color:BLUE,fontWeight:600}},doc.cat)),
            React.createElement('td',{style:{padding:'10px 12px',fontSize:12,color:'#999'}},doc.date),
            React.createElement('td',{style:{padding:'10px 12px',fontSize:11,color:'#666'}},doc.size),
            React.createElement('td',{style:{padding:'10px 12px',textAlign:'right'}},
              React.createElement('button',{style:{padding:'5px 12px',borderRadius:6,border:'1px solid rgba(59,130,246,.2)',background:'rgba(59,130,246,.06)',color:BLUE,fontSize:10,cursor:'pointer',fontFamily:'inherit',fontWeight:600}},'⬇ PDF'))
          )))
      )
    )
  );
}

// ═══════════════════════════════════════════════════════════════════
// COMPOSANT : Portail Employé — Mon Profil
// ═══════════════════════════════════════════════════════════════════
export function EmployeeProfile({s, d, employee}) {
  const emp = employee || s.emps?.[0] || {};
  const co = s.co || {};
  
  const cs = {padding:'20px',borderRadius:'14px',border:'1px solid rgba(59,130,246,.06)',background:'rgba(255,255,255,.01)'};
  
  const fields = [
    {section:'Identité',items:[
      {l:'Nom',v:emp.nom||'—'},{l:'Prénom',v:emp.prenom||'—'},
      {l:'NISS',v:emp.niss||'XX.XX.XX-XXX.XX'},{l:'Date de naissance',v:emp.dateNaissance||'—'},
      {l:'Nationalité',v:emp.nationalite||'Belge'},{l:'État civil',v:emp.etatCivil||'—'}
    ]},
    {section:'Contrat',items:[
      {l:'Type de contrat',v:emp.typeContrat||'CDI'},{l:'Fonction',v:emp.fonction||'—'},
      {l:'Date d\'entrée',v:emp.dateEntree||'—'},{l:'Commission paritaire',v:co.cp?`CP ${co.cp}`:'—'},
      {l:'Régime horaire',v:emp.regime||'Temps plein'},{l:'Catégorie',v:emp.categorie||'Employé'}
    ]},
    {section:'Coordonnées',items:[
      {l:'Adresse',v:emp.adresse||'—'},{l:'Email',v:emp.email||'—'},
      {l:'Téléphone',v:emp.tel||'—'},{l:'Personne de contact urgence',v:emp.contactUrgence||'—'}
    ]},
    {section:'Bancaire',items:[
      {l:'IBAN',v:emp.iban?emp.iban.substring(0,8)+'••••••••••':'—'},{l:'BIC',v:emp.bic||'—'}
    ]},
  ];
  
  return React.createElement('div',{style:{maxWidth:960,margin:'0 auto'}},
    // Profile header
    React.createElement('div',{style:{display:'flex',gap:20,alignItems:'center',padding:'24px',borderRadius:16,background:'linear-gradient(135deg,rgba(59,130,246,.08),rgba(59,130,246,.02))',border:'1px solid rgba(59,130,246,.12)',marginBottom:24}},
      React.createElement('div',{style:{width:64,height:64,borderRadius:'50%',background:'linear-gradient(135deg,#3b82f6,#2563eb)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,fontWeight:700,color:'#fff',flexShrink:0}},
        (emp.prenom||'?')[0].toUpperCase()
      ),
      React.createElement('div',{style:{flex:1}},
        React.createElement('div',{style:{fontSize:22,fontWeight:300,color:'#e5e5e5'}},`${emp.prenom||''} ${emp.nom||'Collaborateur'}`),
        React.createElement('div',{style:{fontSize:12,color:'#888',marginTop:2}},`${emp.fonction||'—'} · ${co.name||'Entreprise'}`),
        React.createElement('div',{style:{display:'flex',gap:8,marginTop:8}},
          React.createElement('span',{style:{padding:'3px 10px',borderRadius:50,fontSize:9,background:'rgba(34,197,94,.1)',color:GREEN,fontWeight:600}},emp.typeContrat||'CDI'),
          React.createElement('span',{style:{padding:'3px 10px',borderRadius:50,fontSize:9,background:'rgba(59,130,246,.1)',color:BLUE,fontWeight:600}},emp.regime||'Temps plein'),
          co.cp && React.createElement('span',{style:{padding:'3px 10px',borderRadius:50,fontSize:9,background:'rgba(198,163,78,.1)',color:GOLD,fontWeight:600}},`CP ${co.cp}`)
        )
      ),
      React.createElement('div',{style:{textAlign:'right'}},
        React.createElement('div',{style:{fontSize:10,color:'#666'}},'Employeur'),
        React.createElement('div',{style:{fontSize:13,fontWeight:600,color:GOLD}},co.name||'—'),
        React.createElement('div',{style:{fontSize:10,color:'#888'}},co.vat||'')
      )
    ),
    
    // Info sections
    fields.map((section,si) => React.createElement('div',{key:si,style:{...cs,marginBottom:16}},
      React.createElement('div',{style:{fontSize:11,color:BLUE,letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:16,fontWeight:600}},section.section),
      React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}},
        section.items.map((f,fi) => React.createElement('div',{key:fi},
          React.createElement('div',{style:{fontSize:10,color:'#666',marginBottom:3}},f.l),
          React.createElement('div',{style:{fontSize:13,color:'#e5e5e5',fontWeight:500}},f.v)
        ))
      )
    )),
    
    // Privacy notice
    React.createElement('div',{style:{padding:16,borderRadius:12,background:'rgba(59,130,246,.04)',border:'1px solid rgba(59,130,246,.08)',fontSize:11,color:'#7ba3d6'}},
      '🔒 Vos données sont protégées conformément au RGPD. Pour toute modification ou exercice de vos droits (accès, rectification, effacement), contactez votre DPO : dpo@aureussocial.be')
  );
}

// ═══════════════════════════════════════════════════════════════════
// COMPOSANT : Portail Employé — Prestations / Pointage
// ═══════════════════════════════════════════════════════════════════
export function EmployeeTimesheet({s, d, employee}) {
  const emp = employee || s.emps?.[0] || {};
  const [month, setMonth] = useState(2);
  const MONTHS=['','Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  
  const cs = {padding:'20px',borderRadius:'14px',border:'1px solid rgba(59,130,246,.06)',background:'rgba(255,255,255,.01)'};
  
  // Generate demo timesheet
  const days = Array.from({length:28},(_,i)=>{
    const d = new Date(2026,month-1,i+1);
    const isWE = d.getDay()===0||d.getDay()===6;
    return {
      date:i+1, day:['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][d.getDay()],
      isWE, hours:isWE?0:7.6, start:isWE?'':'09:00', end:isWE?'':'17:36', pause:'00:60'
    };
  });
  
  const totalH = days.reduce((a,d)=>a+d.hours,0);
  
  return React.createElement('div',{style:{maxWidth:960,margin:'0 auto'}},
    React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}},
      React.createElement('div',null,
        React.createElement('div',{style:{fontSize:22,fontWeight:300,color:'#e5e5e5'}},'Mes Prestations'),
        React.createElement('div',{style:{fontSize:12,color:'#888',marginTop:4}},`${MONTHS[month]} 2026 — ${totalH.toFixed(1)}h prestées`)
      ),
      React.createElement('div',{style:{display:'flex',gap:6}},
        [1,2,3].map(m => React.createElement('button',{key:m,onClick:()=>setMonth(m),
          style:{padding:'6px 14px',borderRadius:8,border:month===m?'1px solid rgba(59,130,246,.3)':'1px solid rgba(255,255,255,.06)',
            background:month===m?'rgba(59,130,246,.12)':'transparent',color:month===m?BLUE:'#666',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}},MONTHS[m]))
      )
    ),
    
    // Summary KPIs
    React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20},className:'aureus-kpi-grid'},
      [{l:'Heures prestées',v:`${totalH.toFixed(1)}h`,c:BLUE},{l:'Jours ouvrés',v:days.filter(d=>!d.isWE).length,c:GREEN},{l:'Heures supplémentaires',v:'0h',c:GOLD},{l:'Régime',v:'38h/sem',c:PURPLE}].map((k,i) =>
        React.createElement('div',{key:i,style:cs},
          React.createElement('div',{style:{fontSize:10,color:'#555',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:6}},k.l),
          React.createElement('div',{style:{fontSize:20,fontWeight:300,color:k.c}},k.v)
        ))
    ),
    
    // Timesheet table
    React.createElement('div',{style:cs},
      React.createElement('table',{style:{width:'100%',borderCollapse:'collapse'}},
        React.createElement('thead',null,React.createElement('tr',{style:{borderBottom:'1px solid rgba(59,130,246,.08)'}},
          ['Date','Jour','Début','Fin','Pause','Heures'].map((h,i) =>
            React.createElement('th',{key:i,style:{padding:'8px 12px',textAlign:'left',fontSize:10,color:BLUE,letterSpacing:'1px',textTransform:'uppercase'}},h))
        )),
        React.createElement('tbody',null,days.slice(0,28).map((r,i) =>
          React.createElement('tr',{key:i,style:{borderBottom:'1px solid rgba(255,255,255,.02)',opacity:r.isWE?.4:1,background:r.isWE?'rgba(255,255,255,.01)':'transparent'}},
            React.createElement('td',{style:{padding:'6px 12px',fontSize:12,color:'#e5e5e5',fontWeight:500}},r.date),
            React.createElement('td',{style:{padding:'6px 12px',fontSize:12,color:r.isWE?'#555':'#999'}},r.day),
            React.createElement('td',{style:{padding:'6px 12px',fontSize:12,color:'#999'}},r.start||'—'),
            React.createElement('td',{style:{padding:'6px 12px',fontSize:12,color:'#999'}},r.end||'—'),
            React.createElement('td',{style:{padding:'6px 12px',fontSize:12,color:'#666'}},r.isWE?'—':r.pause),
            React.createElement('td',{style:{padding:'6px 12px',fontSize:13,fontWeight:r.isWE?400:600,color:r.isWE?'#555':GREEN}},r.isWE?'—':`${r.hours}h`)
          )))
      )
    )
  );
}

// ═══════════════════════════════════════════════════════════════════
// COMPOSANT : Portail Employé — Mes Formations
// ═══════════════════════════════════════════════════════════════════
export function EmployeeTraining({s, d}) {
  const cs = {padding:'20px',borderRadius:'14px',border:'1px solid rgba(59,130,246,.06)',background:'rgba(255,255,255,.01)'};
  
  const formations = [
    {id:1,titre:'Sécurité au travail',provider:'CESI',date:'2025-11-10',duree:'8h',status:'terminée',certificat:true},
    {id:2,titre:'RGPD — Sensibilisation',provider:'Aureus Academy',date:'2025-09-15',duree:'4h',status:'terminée',certificat:true},
    {id:3,titre:'Excel Avancé',provider:'IFAPME',date:'2026-03-20',duree:'16h',status:'planifiée',certificat:false},
    {id:4,titre:'Communication assertive',provider:'Cefora',date:'2026-04-12',duree:'8h',status:'planifiée',certificat:false},
  ];
  
  const totalHeures = formations.filter(f=>f.status==='terminée').reduce((a,f)=>a+parseInt(f.duree),0);
  
  return React.createElement('div',{style:{maxWidth:960,margin:'0 auto'}},
    React.createElement('div',{style:{fontSize:22,fontWeight:300,color:'#e5e5e5',marginBottom:24}},'Mes Formations'),
    
    React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:24},className:'aureus-kpi-grid'},
      [{l:'Formations suivies',v:formations.filter(f=>f.status==='terminée').length,c:GREEN},{l:'Heures de formation',v:`${totalHeures}h`,c:BLUE},{l:'Planifiées',v:formations.filter(f=>f.status==='planifiée').length,c:GOLD}].map((k,i) =>
        React.createElement('div',{key:i,style:cs},
          React.createElement('div',{style:{fontSize:10,color:'#555',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:6}},k.l),
          React.createElement('div',{style:{fontSize:22,fontWeight:300,color:k.c}},k.v)
        ))
    ),
    
    React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}},
      formations.map(f => React.createElement('div',{key:f.id,style:{...cs,border:f.status==='terminée'?'1px solid rgba(34,197,94,.12)':'1px solid rgba(234,179,8,.12)'}},
        React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}},
          React.createElement('div',null,
            React.createElement('div',{style:{fontSize:14,fontWeight:600,color:'#e5e5e5'}},f.titre),
            React.createElement('div',{style:{fontSize:11,color:'#888',marginTop:2}},`${f.provider} — ${f.duree}`)
          ),
          React.createElement('span',{style:{padding:'3px 10px',borderRadius:50,fontSize:9,fontWeight:600,
            background:f.status==='terminée'?'rgba(34,197,94,.1)':'rgba(234,179,8,.1)',
            color:f.status==='terminée'?GREEN:'#eab308'}},
            f.status==='terminée'?'✓ Terminée':'📅 Planifiée')
        ),
        React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center'}},
          React.createElement('div',{style:{fontSize:11,color:'#666'}},`📅 ${f.date}`),
          f.certificat && React.createElement('button',{style:{padding:'5px 12px',borderRadius:6,border:'1px solid rgba(34,197,94,.2)',background:'rgba(34,197,94,.06)',color:GREEN,fontSize:10,cursor:'pointer',fontFamily:'inherit',fontWeight:600}},'🎓 Certificat')
        )
      ))
    )
  );
}

// ═══════════════════════════════════════════════════════════════════
// COMPOSANT : Client Portal — Dashboard Employeur
// ═══════════════════════════════════════════════════════════════════
export function ClientDashboard({s, d}) {
  const co = s.co || {};
  const emps = s.emps || [];
  const pays = s.pays || [];
  const lastMonth = pays.length > 0 ? pays.reduce((a,b) => (b.year*12+b.month) > (a.year*12+a.month) ? b : a) : null;
  
  const cs = {padding:'20px',borderRadius:'14px',border:'1px solid rgba(34,197,94,.06)',background:'rgba(255,255,255,.01)'};
  
  const totalBrut = pays.filter(p => lastMonth && p.month === lastMonth.month && p.year === lastMonth.year).reduce((a,p) => a + (p.brut||0), 0);
  const totalNet = pays.filter(p => lastMonth && p.month === lastMonth.month && p.year === lastMonth.year).reduce((a,p) => a + (p.net||0), 0);
  const totalONSS = pays.filter(p => lastMonth && p.month === lastMonth.month && p.year === lastMonth.year).reduce((a,p) => a + (p.onss_total||0), 0);
  
  const MONTHS=['','Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  
  return React.createElement('div',{style:{maxWidth:960,margin:'0 auto'}},
    // Company header
    React.createElement('div',{style:{padding:'28px 24px',borderRadius:16,background:'linear-gradient(135deg,rgba(34,197,94,.08),rgba(34,197,94,.02))',border:'1px solid rgba(34,197,94,.12)',marginBottom:24}},
      React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center'}},
        React.createElement('div',null,
          React.createElement('div',{style:{fontSize:24,fontWeight:300,color:'#e5e5e5'}},co.name || 'Mon Entreprise'),
          React.createElement('div',{style:{fontSize:12,color:'#888',marginTop:4}},`${co.vat||''} ${co.cp?`· CP ${co.cp}`:''} · ${emps.length} travailleur(s)`)
        ),
        React.createElement('div',{style:{display:'flex',gap:8}},
          React.createElement('span',{style:{padding:'5px 12px',borderRadius:50,fontSize:10,background:'rgba(34,197,94,.1)',color:GREEN,fontWeight:600}},'✓ Dossier actif'),
          lastMonth && React.createElement('span',{style:{padding:'5px 12px',borderRadius:50,fontSize:10,background:'rgba(198,163,78,.1)',color:GOLD,fontWeight:600}},`Paie: ${MONTHS[lastMonth.month]} ${lastMonth.year}`)
        )
      )
    ),
    
    // KPIs
    React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24},className:'aureus-kpi-grid'},
      [{l:'Travailleurs',v:emps.length,c:GREEN,i:'👥'},
       {l:'Masse salariale brute',v:totalBrut>0?`€${totalBrut.toFixed(0)}`:'—',c:GOLD,i:'💶'},
       {l:'Total Net',v:totalNet>0?`€${totalNet.toFixed(0)}`:'—',c:BLUE,i:'💳'},
       {l:'Charges ONSS',v:totalONSS>0?`€${totalONSS.toFixed(0)}`:'—',c:RED,i:'🏛'}
      ].map((k,i) => React.createElement('div',{key:i,style:cs},
        React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}},
          React.createElement('div',{style:{fontSize:10,color:'#555',letterSpacing:'1.5px',textTransform:'uppercase'}},k.l),
          React.createElement('span',{style:{fontSize:18}},k.i)
        ),
        React.createElement('div',{style:{fontSize:22,fontWeight:300,color:k.c}},k.v)
      ))
    ),
    
    // Quick actions
    React.createElement('div',{style:{...cs,marginBottom:24}},
      React.createElement('div',{style:{fontSize:11,color:'#555',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:16}},'Accès rapide'),
      React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}},
        [{i:'👥',l:'Travailleurs',a:'employees',c:'rgba(34,197,94,.08)',bc:'rgba(34,197,94,.12)'},
         {i:'◈',l:'Fiches de paie',a:'payslip',c:'rgba(198,163,78,.08)',bc:'rgba(198,163,78,.12)'},
         {i:'🏛',l:'Déclarations ONSS',a:'onss',c:'rgba(59,130,246,.08)',bc:'rgba(59,130,246,.12)'},
         {i:'📁',l:'Documents',a:'ged',c:'rgba(168,85,247,.08)',bc:'rgba(168,85,247,.12)'}
        ].map((a,i) => React.createElement('button',{key:i,onClick:()=>d({type:'NAV',page:a.a}),
          style:{padding:16,borderRadius:12,border:'1px solid '+a.bc,background:a.c,cursor:'pointer',textAlign:'center',fontFamily:'inherit',transition:'all .2s'}},
          React.createElement('div',{style:{fontSize:24,marginBottom:6}},a.i),
          React.createElement('div',{style:{fontSize:11,color:'#e5e5e5',fontWeight:500}},a.l)
        ))
      )
    ),
    
    // Workers list preview
    React.createElement('div',{style:cs},
      React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}},
        React.createElement('div',{style:{fontSize:11,color:'#555',letterSpacing:'1.5px',textTransform:'uppercase'}},'Travailleurs'),
        React.createElement('button',{onClick:()=>d({type:'NAV',page:'employees'}),style:{fontSize:10,color:GREEN,background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',fontWeight:600}},'Voir tout →')
      ),
      emps.length > 0
        ? emps.slice(0,5).map((e,i) => React.createElement('div',{key:i,style:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:i<Math.min(emps.length-1,4)?'1px solid rgba(34,197,94,.06)':'none'}},
            React.createElement('div',{style:{display:'flex',alignItems:'center',gap:10}},
              React.createElement('div',{style:{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#22c55e,#16a34a)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff'}},
                (e.prenom||e.nom||'?')[0].toUpperCase()),
              React.createElement('div',null,
                React.createElement('div',{style:{fontSize:13,color:'#e5e5e5',fontWeight:500}},`${e.prenom||''} ${e.nom||''}`),
                React.createElement('div',{style:{fontSize:10,color:'#888'}},e.fonction||'—')
              )
            ),
            React.createElement('div',{style:{display:'flex',gap:8,alignItems:'center'}},
              React.createElement('span',{style:{padding:'3px 8px',borderRadius:50,fontSize:9,background:'rgba(34,197,94,.1)',color:GREEN,fontWeight:600}},e.typeContrat||'CDI'),
              React.createElement('span',{style:{fontSize:11,color:'#888'}},e.regime||'TP')
            )
          ))
        : React.createElement('div',{style:{textAlign:'center',padding:30,color:'#666',fontSize:12}},'Aucun travailleur enregistré')
    ),
    
    // Client factures
    React.createElement('div',{style:{...cs,marginTop:16}},
      React.createElement('div',{style:{fontSize:11,color:'#555',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:16}},'Dernières factures Aureus Social'),
      [{ref:'2026-02-001',date:'28/02/2026',montant:'89,00 €',status:'payée'},
       {ref:'2026-01-001',date:'31/01/2026',montant:'89,00 €',status:'payée'},
       {ref:'2025-12-001',date:'31/12/2025',montant:'89,00 €',status:'payée'}
      ].map((f,i) => React.createElement('div',{key:i,style:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:i<2?'1px solid rgba(34,197,94,.06)':'none'}},
        React.createElement('div',null,
          React.createElement('div',{style:{fontSize:13,color:'#e5e5e5'}},`Facture ${f.ref}`),
          React.createElement('div',{style:{fontSize:10,color:'#888'}},f.date)
        ),
        React.createElement('div',{style:{display:'flex',gap:10,alignItems:'center'}},
          React.createElement('span',{style:{fontSize:13,fontWeight:600,color:GOLD}},f.montant),
          React.createElement('span',{style:{padding:'3px 8px',borderRadius:50,fontSize:9,background:'rgba(34,197,94,.1)',color:GREEN,fontWeight:600}},'✓ '+f.status)
        )
      ))
    )
  );
}

// ═══════════════════════════════════════════════════════════════════
// COMPOSANT : Client Portal — Mes Factures
// ═══════════════════════════════════════════════════════════════════
export function ClientFactures({s}) {
  const cs = {padding:'20px',borderRadius:'14px',border:'1px solid rgba(34,197,94,.06)',background:'rgba(255,255,255,.01)'};
  
  const factures = Array.from({length:12},(_,i)=>({
    ref:`${2026-Math.floor(i/12)}-${String(12-i%12).padStart(2,'0')}-001`,
    date:new Date(2026,11-i,28).toLocaleDateString('fr-BE'),
    montant:89,
    status:i<2?'en_attente':'payée',
    desc:`Gestion paie — ${['Décembre','Novembre','Octobre','Septembre','Août','Juillet','Juin','Mai','Avril','Mars','Février','Janvier'][i%12]} ${2026-Math.floor(i/12)}`
  }));
  
  const totalDu = factures.filter(f=>f.status==='en_attente').reduce((a,f)=>a+f.montant,0);
  
  return React.createElement('div',{style:{maxWidth:960,margin:'0 auto'}},
    React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}},
      React.createElement('div',{style:{fontSize:22,fontWeight:300,color:'#e5e5e5'}},'Mes Factures'),
      totalDu > 0 && React.createElement('div',{style:{padding:'8px 16px',borderRadius:10,background:'rgba(234,179,8,.08)',border:'1px solid rgba(234,179,8,.15)',fontSize:12,color:'#eab308',fontWeight:600}},`⚠ ${totalDu.toFixed(2)} € en attente`)
    ),
    React.createElement('div',{style:cs},
      React.createElement('table',{style:{width:'100%',borderCollapse:'collapse'}},
        React.createElement('thead',null,React.createElement('tr',{style:{borderBottom:'1px solid rgba(34,197,94,.08)'}},
          ['Référence','Description','Date','Montant','Statut',''].map((h,i) =>
            React.createElement('th',{key:i,style:{padding:'10px 12px',textAlign:'left',fontSize:10,color:GREEN,letterSpacing:'1px',textTransform:'uppercase'}},h))
        )),
        React.createElement('tbody',null,factures.map((f,i) =>
          React.createElement('tr',{key:i,style:{borderBottom:'1px solid rgba(255,255,255,.02)'}},
            React.createElement('td',{style:{padding:'10px 12px',fontSize:13,color:'#e5e5e5',fontWeight:500,fontFamily:'monospace'}},f.ref),
            React.createElement('td',{style:{padding:'10px 12px',fontSize:12,color:'#999'}},f.desc),
            React.createElement('td',{style:{padding:'10px 12px',fontSize:12,color:'#999'}},f.date),
            React.createElement('td',{style:{padding:'10px 12px',fontSize:13,fontWeight:600,color:GOLD}},`${f.montant.toFixed(2)} €`),
            React.createElement('td',{style:{padding:'10px 12px'}},
              React.createElement('span',{style:{padding:'3px 10px',borderRadius:50,fontSize:9,fontWeight:600,
                background:f.status==='payée'?'rgba(34,197,94,.1)':'rgba(234,179,8,.1)',
                color:f.status==='payée'?GREEN:'#eab308'}},
                f.status==='payée'?'✓ Payée':'⏳ En attente')),
            React.createElement('td',{style:{padding:'10px 12px',textAlign:'right'}},
              React.createElement('button',{style:{padding:'5px 12px',borderRadius:6,border:'1px solid rgba(34,197,94,.2)',background:'rgba(34,197,94,.06)',color:GREEN,fontSize:10,cursor:'pointer',fontFamily:'inherit',fontWeight:600}},'⬇ PDF'))
          )))
      )
    )
  );
}

// ═══════════════════════════════════════════════════════════════════
// COMPOSANT : Portail Sidebar Branding
// ═══════════════════════════════════════════════════════════════════
export function PortalBadge({portal}) {
  const config = PORTAL_CONFIG[portal];
  if (portal === 'admin') return null;
  
  return React.createElement('div',{style:{
    margin:'8px 0',padding:'8px 12px',borderRadius:8,
    background:`linear-gradient(135deg,${config.color}15,${config.color}08)`,
    border:`1px solid ${config.color}25`,
    display:'flex',alignItems:'center',gap:8,
    fontSize:10,fontWeight:600,color:config.color,letterSpacing:'.5px'
  }},
    React.createElement('span',{style:{fontSize:14}},config.icon),
    config.label
  );
}

// ═══════════════════════════════════════════════════════════════════
// COMPOSANT : Portal Switcher (Admin only)
// ═══════════════════════════════════════════════════════════════════
export function PortalSwitcher({portal, switchPortal, userRole}) {
  if (userRole !== 'admin' && portal === 'admin') return null;
  
  const portals = [
    {id:'admin',l:'👑 Admin',c:GOLD},
    {id:'client',l:'🏢 Client',c:GREEN},
    {id:'employee',l:'👤 Employé',c:BLUE},
  ];
  
  return React.createElement('div',{style:{display:'flex',gap:4,padding:'6px',background:'rgba(255,255,255,.02)',borderRadius:8,border:'1px solid rgba(255,255,255,.04)'}},
    portals.map(p => React.createElement('button',{key:p.id,onClick:()=>switchPortal(p.id),
      style:{padding:'5px 10px',borderRadius:6,border:'none',cursor:'pointer',fontSize:10,fontWeight:portal===p.id?600:400,
        background:portal===p.id?`${p.c}20`:'transparent',color:portal===p.id?p.c:'#666',fontFamily:'inherit',transition:'all .2s'}},p.l))
  );
}

export default {
  usePortalMode, PORTAL_CONFIG, CLIENT_NAV, EMPLOYEE_NAV,
  EmployeeDashboard, EmployeePayslips, EmployeeLeave, EmployeeDocuments, EmployeeProfile, EmployeeTimesheet, EmployeeTraining,
  ClientDashboard, ClientFactures,
  PortalBadge, PortalSwitcher
};
