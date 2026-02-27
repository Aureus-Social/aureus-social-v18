'use client';
import{useState,useMemo}from'react';

const fmt=v=>new Intl.NumberFormat('fr-BE',{minimumFractionDigits:2,maximumFractionDigits:2}).format(v||0);
const fi=v=>new Intl.NumberFormat('fr-BE',{maximumFractionDigits:0}).format(v||0);
const C=({children,title:t,sub,color})=><div style={{background:'rgba(198,163,78,.03)',borderRadius:12,padding:16,border:'1px solid '+(color||'rgba(198,163,78,.08)'),marginBottom:14}}>{t&&<div style={{fontSize:13,fontWeight:600,color:color||'#c6a34e',marginBottom:sub?2:10}}>{t}</div>}{sub&&<div style={{fontSize:10,color:'#888',marginBottom:10}}>{sub}</div>}{children}</div>;
const Row=({l,v,c,b})=><div style={{display:'flex',justifyContent:'space-between',padding:b?'8px 0':'5px 0',borderBottom:b?'2px solid rgba(198,163,78,.2)':'1px solid rgba(255,255,255,.03)',fontWeight:b?700:400}}><span style={{color:'#e8e6e0',fontSize:11.5}}>{l}</span><span style={{color:c||'#c6a34e',fontWeight:600,fontSize:12}}>{v}</span></div>;
const I=({label,type,value,onChange,style:st,options,placeholder})=><div style={st}><div style={{fontSize:10,color:'#5e5c56',marginBottom:3}}>{label}</div>{options?<select value={value} onChange={e=>onChange(e.target.value)} style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid rgba(198,163,78,.15)',background:'rgba(198,163,78,.04)',color:'#e8e6e0',fontSize:12,fontFamily:'inherit'}}>{options.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}</select>:<input type={type||'text'} value={value} onChange={e=>onChange(type==='number'?+e.target.value:e.target.value)} placeholder={placeholder} style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid rgba(198,163,78,.15)',background:'rgba(198,163,78,.04)',color:'#e8e6e0',fontSize:12,fontFamily:'inherit',boxSizing:'border-box'}}/>}</div>;
const Badge=({text,color})=><span style={{padding:'2px 7px',borderRadius:5,fontSize:8,fontWeight:600,background:(color||'#888')+'15',color:color||'#888'}}>{text}</span>;
const Check=({checked,onChange,label,color})=><div onClick={onChange} style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',padding:'2px 0'}}><div style={{width:16,height:16,borderRadius:4,border:'2px solid '+(checked?(color||'#c6a34e'):'#444'),background:checked?(color||'#c6a34e')+'20':'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:color||'#c6a34e'}}>{checked?'✓':''}</div>{label&&<span style={{fontSize:11,color:'#e8e6e0'}}>{label}</span>}</div>;

// ════════════════════════════════════════════════════════════
// 1. RBAC — Admin Droits par Module
// ════════════════════════════════════════════════════════════
const MODULES_LIST=[
  {id:'paie',nom:'Calcul Paie',cat:'Paie & Calculs',icon:'💰'},
  {id:'fichepaie',nom:'Fiches de Paie',cat:'Paie & Calculs',icon:'📄'},
  {id:'baremes',nom:'Barèmes CP',cat:'Paie & Calculs',icon:'📊'},
  {id:'primes',nom:'Primes & Avantages',cat:'Primes',icon:'🎁'},
  {id:'cheqrepas',nom:'Chèques-Repas',cat:'Primes',icon:'🍽'},
  {id:'vehicules',nom:'Véhicules & ATN',cat:'Primes',icon:'🚗'},
  {id:'contrats',nom:'Contrats Légaux',cat:'Contrats',icon:'📝'},
  {id:'absences',nom:'Absences & Congés',cat:'Absences',icon:'📅'},
  {id:'declarations',nom:'Déclarations ONSS',cat:'ONSS',icon:'🏛'},
  {id:'charges',nom:'Charges Sociales',cat:'ONSS',icon:'🏦'},
  {id:'belcotax',nom:'Belcotax / Fiscal',cat:'Fiscal',icon:'🧾'},
  {id:'exportcompta',nom:'Export Comptable',cat:'Fiscal',icon:'📊'},
  {id:'facturation',nom:'Facturation',cat:'Fiscal',icon:'💳'},
  {id:'reporting',nom:'Reporting',cat:'Reporting',icon:'📈'},
  {id:'analytics',nom:'Analytics',cat:'Reporting',icon:'📊'},
  {id:'bilansocial',nom:'Bilan Social',cat:'Reporting',icon:'📈'},
  {id:'ged',nom:'GED Documents',cat:'Outils',icon:'📁'},
  {id:'employes',nom:'Gestion Personnel',cat:'RH',icon:'👥'},
  {id:'pointage',nom:'Pointage',cat:'RH',icon:'⏱'},
  {id:'formations',nom:'Formations',cat:'RH',icon:'🎓'},
  {id:'evaluations',nom:'Évaluations',cat:'RH',icon:'⭐'},
  {id:'compliance',nom:'Compliance',cat:'Admin',icon:'🛡'},
  {id:'rgpd',nom:'RGPD',cat:'Admin',icon:'🔒'},
  {id:'admin',nom:'Administration',cat:'Admin',icon:'⚙'},
];
const PERMS=['voir','modifier','supprimer','exporter'];
const PERM_COLORS={voir:'#22c55e',modifier:'#3b82f6',supprimer:'#ef4444',exporter:'#a855f7'};
const DEFAULT_PROFILES=[
  {id:'admin',nom:'Administrateur',desc:'Accès complet à tous les modules',perms:Object.fromEntries(MODULES_LIST.map(m=>[m.id,{voir:true,modifier:true,supprimer:true,exporter:true}]))},
  {id:'comptable_senior',nom:'Comptable Senior',desc:'Paie, ONSS, Fiscal, Reporting — modifications autorisées',perms:Object.fromEntries(MODULES_LIST.map(m=>[m.id,{voir:['Paie & Calculs','ONSS','Fiscal','Reporting','Primes'].includes(m.cat),modifier:['Paie & Calculs','ONSS','Fiscal'].includes(m.cat),supprimer:false,exporter:['Paie & Calculs','ONSS','Fiscal','Reporting'].includes(m.cat)}]))},
  {id:'comptable_junior',nom:'Comptable Junior',desc:'Paie et ONSS en lecture, pas de suppression',perms:Object.fromEntries(MODULES_LIST.map(m=>[m.id,{voir:['Paie & Calculs','ONSS','Primes'].includes(m.cat),modifier:false,supprimer:false,exporter:false}]))},
  {id:'drh',nom:'DRH',desc:'RH, Contrats, Absences, Reporting complet',perms:Object.fromEntries(MODULES_LIST.map(m=>[m.id,{voir:['RH','Contrats','Absences','Reporting','Admin'].includes(m.cat),modifier:['RH','Contrats','Absences'].includes(m.cat),supprimer:['Contrats'].includes(m.cat),exporter:true}]))},
  {id:'employe',nom:'Employé',desc:'Portail self-service: absences, fiches, documents',perms:Object.fromEntries(MODULES_LIST.map(m=>[m.id,{voir:['fichepaie','absences','ged'].includes(m.id),modifier:m.id==='absences',supprimer:false,exporter:m.id==='fichepaie'}]))},
  {id:'stagiaire',nom:'Stagiaire',desc:'Accès minimal — consultation uniquement',perms:Object.fromEntries(MODULES_LIST.map(m=>[m.id,{voir:['absences','ged'].includes(m.id),modifier:false,supprimer:false,exporter:false}]))},
];

export function RBACAdminV2({s}){
  const [tab,setTab]=useState('matrice');
  const [profiles,setProfiles]=useState(DEFAULT_PROFILES);
  const [selProfile,setSelProfile]=useState('admin');
  const [users]=useState([
    {id:1,nom:'Ahmed Moussati',email:'admin@aureussocial.be',profil:'admin',actif:true,lastLogin:'2026-02-25 14:30'},
    {id:2,nom:'Sophie Lambert',email:'sophie@cabinet.be',profil:'comptable_senior',actif:true,lastLogin:'2026-02-25 10:15'},
    {id:3,nom:'Jean Peeters',email:'jean@cabinet.be',profil:'comptable_junior',actif:true,lastLogin:'2026-02-24 16:45'},
    {id:4,nom:'Marie Janssen',email:'marie@client.be',profil:'employe',actif:true,lastLogin:'2026-02-23 09:00'},
    {id:5,nom:'Thomas Willems',email:'thomas@client.be',profil:'employe',actif:false,lastLogin:'2026-01-15 11:20'},
  ]);
  const [delegations,setDelegations]=useState([]);
  const [auditLog]=useState([
    {user:'Sophie Lambert',module:'Fiches de Paie',action:'voir',date:'2026-02-25 14:28',ip:'192.168.1.45'},
    {user:'Sophie Lambert',module:'Calcul Paie',action:'modifier',date:'2026-02-25 14:25',ip:'192.168.1.45'},
    {user:'Jean Peeters',module:'Barèmes CP',action:'voir',date:'2026-02-25 10:12',ip:'10.0.0.23'},
    {user:'Marie Janssen',module:'Absences & Congés',action:'modifier',date:'2026-02-24 09:15',ip:'83.134.22.100'},
    {user:'Ahmed Moussati',module:'Administration',action:'modifier',date:'2026-02-24 08:00',ip:'192.168.1.1'},
  ]);

  const profile=profiles.find(p=>p.id===selProfile)||profiles[0];
  const cats=[...new Set(MODULES_LIST.map(m=>m.cat))];

  const togglePerm=(modId,perm)=>{
    setProfiles(prev=>prev.map(p=>p.id===selProfile?{...p,perms:{...p.perms,[modId]:{...p.perms[modId],[perm]:!p.perms[modId]?.[perm]}}}:p));
  };
  const totalPerms=MODULES_LIST.reduce((a,m)=>a+PERMS.filter(p=>profile.perms[m.id]?.[p]).length,0);
  const maxPerms=MODULES_LIST.length*PERMS.length;

  return <div style={{padding:24}}>
    <h2 style={{fontSize:22,fontWeight:700,color:'#c6a34e',margin:'0 0 4px'}}>🔐 Admin — Droits & Permissions</h2>
    <p style={{fontSize:12,color:'#888',margin:'0 0 20px'}}>RBAC par module — Profils rôles — Matrice permissions — Délégation temporaire — Audit</p>

    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:18}}>
      {[{l:'Profils',v:profiles.length,c:'#c6a34e'},{l:'Utilisateurs',v:users.length,c:'#3b82f6'},{l:'Modules',v:MODULES_LIST.length,c:'#22c55e'},{l:'Permissions actives',v:totalPerms+'/'+maxPerms,c:'#a855f7'},{l:'Délégations',v:delegations.length,c:'#fb923c'}].map((k,i)=><div key={i} style={{padding:'12px 14px',background:'rgba(198,163,78,.04)',borderRadius:10,border:'1px solid rgba(198,163,78,.08)'}}><div style={{fontSize:9,color:'#5e5c56',textTransform:'uppercase'}}>{k.l}</div><div style={{fontSize:17,fontWeight:700,color:k.c,marginTop:4}}>{k.v}</div></div>)}
    </div>

    <div style={{display:'flex',gap:6,marginBottom:16}}>{[{v:'matrice',l:'🔲 Matrice permissions'},{v:'profils',l:'👤 Profils ('+profiles.length+')'},{v:'users',l:'👥 Utilisateurs ('+users.length+')'},{v:'delegation',l:'🔄 Délégation'},{v:'audit',l:'📋 Audit accès'}].map(t=><button key={t.v} onClick={()=>setTab(t.v)} style={{padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:tab===t.v?600:400,fontFamily:'inherit',background:tab===t.v?'rgba(198,163,78,.15)':'rgba(255,255,255,.03)',color:tab===t.v?'#c6a34e':'#9e9b93'}}>{t.l}</button>)}</div>

    {/* Profile selector */}
    <div style={{display:'flex',gap:4,marginBottom:14,flexWrap:'wrap'}}>
      {profiles.map(p=><button key={p.id} onClick={()=>setSelProfile(p.id)} style={{padding:'6px 14px',borderRadius:6,border:'none',background:selProfile===p.id?'rgba(198,163,78,.15)':'rgba(255,255,255,.03)',color:selProfile===p.id?'#c6a34e':'#888',fontSize:11,cursor:'pointer',fontWeight:selProfile===p.id?700:400}}>{p.nom}</button>)}
    </div>

    {tab==='matrice'&&<div>
      <C title={'Matrice permissions — '+profile.nom} sub={profile.desc}>
        <div style={{overflowX:'auto'}}>
          <div style={{minWidth:700}}>
            <div style={{display:'grid',gridTemplateColumns:'40px 180px repeat(4,80px)',gap:2,padding:'6px 0',borderBottom:'2px solid rgba(198,163,78,.15)',fontSize:9,fontWeight:700,color:'#c6a34e'}}>
              <div></div><div>Module</div>{PERMS.map(p=><div key={p} style={{textAlign:'center',color:PERM_COLORS[p]}}>{p.charAt(0).toUpperCase()+p.slice(1)}</div>)}
            </div>
            {cats.map(cat=><div key={cat}>
              <div style={{padding:'8px 0 4px',fontSize:10,fontWeight:700,color:'#888',textTransform:'uppercase',letterSpacing:1,borderBottom:'1px solid rgba(255,255,255,.05)'}}>{cat}</div>
              {MODULES_LIST.filter(m=>m.cat===cat).map(m=><div key={m.id} style={{display:'grid',gridTemplateColumns:'40px 180px repeat(4,80px)',gap:2,padding:'4px 0',borderBottom:'1px solid rgba(255,255,255,.02)',alignItems:'center'}}>
                <div style={{fontSize:14}}>{m.icon}</div>
                <div style={{fontSize:11,color:'#e8e6e0'}}>{m.nom}</div>
                {PERMS.map(p=><div key={p} style={{display:'flex',justifyContent:'center'}}>
                  <Check checked={!!profile.perms[m.id]?.[p]} onChange={()=>togglePerm(m.id,p)} color={PERM_COLORS[p]}/>
                </div>)}
              </div>)}
            </div>)}
          </div>
        </div>
      </C>
    </div>}

    {tab==='profils'&&<div>
      {profiles.map(p=>{const cnt=MODULES_LIST.reduce((a,m)=>a+PERMS.filter(pe=>p.perms[m.id]?.[pe]).length,0);
      return <C key={p.id} title={p.nom} sub={p.desc}>
        <Row l="Permissions actives" v={cnt+' / '+maxPerms}/>
        <Row l="Modules accessibles (voir)" v={MODULES_LIST.filter(m=>p.perms[m.id]?.voir).length+' / '+MODULES_LIST.length}/>
        <Row l="Modules modifiables" v={MODULES_LIST.filter(m=>p.perms[m.id]?.modifier).length+''}/>
        <Row l="Suppressions autorisées" v={MODULES_LIST.filter(m=>p.perms[m.id]?.supprimer).length+''} c={MODULES_LIST.filter(m=>p.perms[m.id]?.supprimer).length>0?'#f87171':'#22c55e'}/>
        <Row l="Export autorisé" v={MODULES_LIST.filter(m=>p.perms[m.id]?.exporter).length+''}/>
        <div style={{marginTop:8,display:'flex',flexWrap:'wrap',gap:4}}>{MODULES_LIST.filter(m=>p.perms[m.id]?.voir).map(m=><Badge key={m.id} text={m.icon+' '+m.nom} color="#22c55e"/>)}</div>
      </C>})}
    </div>}

    {tab==='users'&&<C title="Utilisateurs">
      <div style={{display:'grid',gridTemplateColumns:'180px 200px 140px 80px 150px',gap:4,padding:'6px 0',borderBottom:'2px solid rgba(198,163,78,.15)',fontSize:9,fontWeight:700,color:'#c6a34e'}}>
        <div>Nom</div><div>Email</div><div>Profil</div><div>Statut</div><div>Dernier accès</div>
      </div>
      {users.map(u=><div key={u.id} style={{display:'grid',gridTemplateColumns:'180px 200px 140px 80px 150px',gap:4,padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,.03)',fontSize:11,alignItems:'center'}}>
        <div style={{color:'#e8e6e0',fontWeight:600}}>{u.nom}</div>
        <div style={{color:'#888',fontSize:10}}>{u.email}</div>
        <Badge text={profiles.find(p=>p.id===u.profil)?.nom||u.profil} color="#c6a34e"/>
        <Badge text={u.actif?'Actif':'Inactif'} color={u.actif?'#22c55e':'#f87171'}/>
        <div style={{color:'#888',fontSize:10}}>{u.lastLogin}</div>
      </div>)}
    </C>}

    {tab==='delegation'&&<C title="🔄 Délégation temporaire de droits">
      <div style={{fontSize:11,color:'#e8e6e0',marginBottom:12}}>Déléguez vos droits d'accès à un collègue pendant votre absence (congé, maladie). Expiration automatique.</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:10,marginBottom:16}}>
        <I label="Délégant" value="Ahmed Moussati" onChange={()=>{}}/>
        <I label="Délégataire" value="" onChange={()=>{}} options={users.filter(u=>u.actif).map(u=>({v:u.nom,l:u.nom}))}/>
        <I label="Date début" type="date" value="2026-03-01" onChange={()=>{}}/>
        <I label="Date fin" type="date" value="2026-03-15" onChange={()=>{}}/>
      </div>
      <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:12}}>{MODULES_LIST.slice(0,12).map(m=><Badge key={m.id} text={m.icon+' '+m.nom} color="#3b82f6"/>)}</div>
      <button style={{padding:'10px 20px',borderRadius:8,border:'none',background:'rgba(198,163,78,.15)',color:'#c6a34e',fontSize:12,fontWeight:600,cursor:'pointer'}}>✓ Créer la délégation</button>
      <div style={{marginTop:12,fontSize:10,color:'#888'}}>La délégation expire automatiquement à la date de fin. Les accès sont révoqués instantanément. Un email de notification est envoyé aux deux parties.</div>
    </C>}

    {tab==='audit'&&<C title="📋 Audit d'accès — Qui a vu quoi">
      <div style={{display:'grid',gridTemplateColumns:'160px 160px 80px 160px 120px',gap:4,padding:'6px 0',borderBottom:'2px solid rgba(198,163,78,.15)',fontSize:9,fontWeight:700,color:'#c6a34e'}}>
        <div>Utilisateur</div><div>Module</div><div>Action</div><div>Date/Heure</div><div>IP</div>
      </div>
      {auditLog.map((log,i)=><div key={i} style={{display:'grid',gridTemplateColumns:'160px 160px 80px 160px 120px',gap:4,padding:'5px 0',borderBottom:'1px solid rgba(255,255,255,.03)',fontSize:11}}>
        <div style={{color:'#e8e6e0'}}>{log.user}</div>
        <div style={{color:'#888'}}>{log.module}</div>
        <Badge text={log.action} color={PERM_COLORS[log.action]}/>
        <div style={{color:'#888',fontSize:10}}>{log.date}</div>
        <div style={{color:'#555',fontSize:10,fontFamily:'monospace'}}>{log.ip}</div>
      </div>)}
      <div style={{marginTop:10,fontSize:10,color:'#888'}}>Chaque accès à un module est loggé: utilisateur, module, action (voir/modifier/supprimer/exporter), timestamp, adresse IP. Conservation: 2 ans (Art. 24 RGPD).</div>
    </C>}
  </div>;
}

// ════════════════════════════════════════════════════════════
// 2. POINTAGE / TIMESHEETS
// ════════════════════════════════════════════════════════════
export function PointageV2({s}){
  const emps=(s.clients||[]).flatMap(c=>(c.emps||[]).map(e=>({...e,_cl:c.company?.name||''})));
  const [tab,setTab]=useState('pointage');
  const [date,setDate]=useState(new Date().toISOString().slice(0,10));
  const [pointages,setPointages]=useState(()=>{
    const p={};
    emps.forEach((e,i)=>{
      const key=i;
      const h1=7+Math.floor(Math.random()*2);const m1=Math.floor(Math.random()*4)*15;
      const h2=12;const m2=0;const h3=13;const m3=0;
      const h4=16+Math.floor(Math.random()*2);const m4=Math.floor(Math.random()*4)*15;
      p[key]={arrivee:h1.toString().padStart(2,'0')+':'+m1.toString().padStart(2,'0'),
        pauseDebut:h2+':'+m2.toString().padStart(2,'0'),
        pauseFin:h3+':'+m3.toString().padStart(2,'0'),
        depart:h4.toString().padStart(2,'0')+':'+m4.toString().padStart(2,'0'),
        projet:'',note:''};
    });
    return p;
  });

  const calcHeures=(p)=>{
    if(!p?.arrivee||!p?.depart)return{brut:0,pause:0,net:0};
    const [ah,am]=(p.arrivee||'08:00').split(':').map(Number);
    const [dh,dm]=(p.depart||'17:00').split(':').map(Number);
    const [ph,pm]=(p.pauseDebut||'12:00').split(':').map(Number);
    const [fh,fm]=(p.pauseFin||'13:00').split(':').map(Number);
    const brut=(dh*60+dm)-(ah*60+am);
    const pause=(fh*60+fm)-(ph*60+pm);
    return{brut:brut/60,pause:pause/60,net:(brut-pause)/60};
  };

  const totalHeures=Object.values(pointages).reduce((a,p)=>{const h=calcHeures(p);return a+h.net;},0);
  const regime=7.6;// 38h/5j
  const supp=emps.reduce((a,_,i)=>{const h=calcHeures(pointages[i]);return a+Math.max(0,h.net-regime);},0);

  return <div style={{padding:24}}>
    <h2 style={{fontSize:22,fontWeight:700,color:'#c6a34e',margin:'0 0 4px'}}>⏱ Pointage & Timesheets</h2>
    <p style={{fontSize:12,color:'#888',margin:'0 0 20px'}}>Enregistrement heures prestées — Lien calcul paie — Export client</p>

    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:18}}>
      {[{l:'Travailleurs',v:emps.length,c:'#3b82f6'},{l:'Total heures/jour',v:totalHeures.toFixed(1)+'h',c:'#c6a34e'},{l:'Heures supp.',v:supp.toFixed(1)+'h',c:supp>0?'#fb923c':'#22c55e'},{l:'Régime',v:'38h/sem (7h36/j)',c:'#888'},{l:'Date',v:date,c:'#888'}].map((k,i)=><div key={i} style={{padding:'12px 14px',background:'rgba(198,163,78,.04)',borderRadius:10,border:'1px solid rgba(198,163,78,.08)'}}><div style={{fontSize:9,color:'#5e5c56',textTransform:'uppercase'}}>{k.l}</div><div style={{fontSize:15,fontWeight:700,color:k.c,marginTop:4}}>{k.v}</div></div>)}
    </div>

    <div style={{display:'flex',gap:6,marginBottom:16}}>{[{v:'pointage',l:'⏱ Pointage du jour'},{v:'semaine',l:'📅 Vue semaine'},{v:'regles',l:'⚖ Règles temps de travail'},{v:'export',l:'⬇ Export'}].map(t=><button key={t.v} onClick={()=>setTab(t.v)} style={{padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:tab===t.v?600:400,fontFamily:'inherit',background:tab===t.v?'rgba(198,163,78,.15)':'rgba(255,255,255,.03)',color:tab===t.v?'#c6a34e':'#9e9b93'}}>{t.l}</button>)}</div>

    {tab==='pointage'&&<C title={'Pointage — '+new Date(date).toLocaleDateString('fr-BE',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}>
      <div style={{display:'grid',gridTemplateColumns:'180px 80px 80px 80px 80px 70px 70px 60px',gap:4,padding:'6px 0',borderBottom:'2px solid rgba(198,163,78,.15)',fontSize:9,fontWeight:700,color:'#c6a34e'}}>
        <div>Employé</div><div>Arrivée</div><div>Pause ↓</div><div>Pause ↑</div><div>Départ</div><div>Brut</div><div>Net</div><div>Supp.</div>
      </div>
      {emps.slice(0,20).map((e,i)=>{const p=pointages[i]||{};const h=calcHeures(p);const suppH=Math.max(0,h.net-regime);
      return <div key={i} style={{display:'grid',gridTemplateColumns:'180px 80px 80px 80px 80px 70px 70px 60px',gap:4,padding:'4px 0',borderBottom:'1px solid rgba(255,255,255,.03)',alignItems:'center'}}>
        <div style={{fontSize:11,color:'#e8e6e0'}}>{(e.first||e.fn||'')+' '+(e.last||e.ln||'')}</div>
        {['arrivee','pauseDebut','pauseFin','depart'].map(f=><input key={f} type="time" value={p[f]||''} onChange={ev=>{const np={...pointages};if(!np[i])np[i]={};np[i][f]=ev.target.value;setPointages(np);}} style={{padding:'4px 6px',borderRadius:4,border:'1px solid rgba(198,163,78,.1)',background:'rgba(198,163,78,.03)',color:'#e8e6e0',fontSize:11,fontFamily:'inherit'}}/>)}
        <div style={{fontSize:11,fontFamily:'monospace',color:'#888'}}>{h.brut.toFixed(1)}h</div>
        <div style={{fontSize:11,fontFamily:'monospace',fontWeight:600,color:'#c6a34e'}}>{h.net.toFixed(1)}h</div>
        <div style={{fontSize:11,fontFamily:'monospace',color:suppH>0?'#fb923c':'#22c55e'}}>{suppH>0?'+'+suppH.toFixed(1):'—'}</div>
      </div>})}
      <div style={{display:'grid',gridTemplateColumns:'180px 80px 80px 80px 80px 70px 70px 60px',gap:4,padding:'8px 0',borderTop:'2px solid rgba(198,163,78,.2)',fontWeight:700,fontSize:12}}>
        <div style={{color:'#c6a34e'}}>TOTAL</div><div></div><div></div><div></div><div></div>
        <div style={{fontFamily:'monospace',color:'#888'}}></div>
        <div style={{fontFamily:'monospace',color:'#c6a34e'}}>{totalHeures.toFixed(1)}h</div>
        <div style={{fontFamily:'monospace',color:'#fb923c'}}>{supp>0?'+'+supp.toFixed(1):''}</div>
      </div>
    </C>}

    {tab==='semaine'&&<C title="Vue hebdomadaire">
      {['Lundi','Mardi','Mercredi','Jeudi','Vendredi'].map((jour,ji)=>{
        const dayTotal=emps.reduce((a,_,i)=>{const h=calcHeures(pointages[i]);return a+h.net;},0)/emps.length;
        return <div key={ji} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,.03)'}}>
          <span style={{fontSize:12,fontWeight:600,color:'#e8e6e0',width:100}}>{jour}</span>
          <div style={{flex:1,height:12,background:'rgba(255,255,255,.05)',borderRadius:6,margin:'0 12px'}}>
            <div style={{width:Math.min(100,dayTotal/regime*100)+'%',height:'100%',background:dayTotal>regime?'#fb923c':'#22c55e',borderRadius:6}}/>
          </div>
          <span style={{fontSize:11,fontFamily:'monospace',color:dayTotal>regime?'#fb923c':'#c6a34e',width:60,textAlign:'right'}}>{dayTotal.toFixed(1)}h</span>
        </div>})}
      <Row l="Objectif semaine" v="38h00" b/>
    </C>}

    {tab==='regles'&&<C title="Règles temps de travail — Droit belge">
      {[
        {r:'Durée maximale journalière',v:'9h (max 11h avec dérogation)',base:'Art. 19 Loi 16/03/1971'},
        {r:'Durée maximale hebdomadaire',v:'38h (CCT n°2) — max 50h avec récupération',base:'Loi 16/03/1971 + CCT n°2'},
        {r:'Pause obligatoire',v:'30 min après 6h consécutives',base:'Art. 38quater Loi 16/03/1971'},
        {r:'Repos journalier',v:'11h consécutives entre 2 prestations',base:'Art. 38ter Loi 16/03/1971'},
        {r:'Repos hebdomadaire',v:'35h consécutives (dimanche inclus en principe)',base:'Art. 11 Loi 16/03/1971'},
        {r:'Heures supplémentaires',v:'Sursalaire: +50% (semaine) / +100% (dimanche/férié)',base:'Art. 29 Loi 16/03/1971'},
        {r:'Travail de nuit',v:'20h-06h. Sursalaire sectoriel. Interdit < 18 ans.',base:'Art. 35 Loi 16/03/1971 + CCT CP'},
        {r:'Dimanche',v:'Repos obligatoire sauf dérogation sectorielle (horeca, santé)',base:'Art. 11 Loi 16/03/1971'},
        {r:'Annualisation (flexibilité)',v:'Moyenne 38h sur période de référence (max 1 an)',base:'Art. 20bis Loi 16/03/1971 + CCT'},
        {r:'Crédit-temps',v:'Réduction temps de travail (1/5, 1/2) avec allocation ONEM',base:'CCT n°103'},
      ].map((r,i)=><div key={i} style={{padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,.03)'}}>
        <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:12,fontWeight:600,color:'#e8e6e0'}}>{r.r}</span><span style={{fontSize:11,color:'#c6a34e'}}>{r.v}</span></div>
        <div style={{fontSize:9,color:'#888',marginTop:2}}>{r.base}</div>
      </div>)}
    </C>}

    {tab==='export'&&<C title="Export pointage">
      {[{f:'CSV',d:'Export CSV pour comptabilité',ext:'.csv'},{f:'Excel',d:'Tableau Excel avec totaux par employé',ext:'.xlsx'},{f:'PDF',d:'Rapport pointage mensuel imprimable',ext:'.pdf'},{f:'Paie',d:'Injection directe dans le calcul de paie',ext:'→ module'}].map((e,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.03)'}}>
        <div><div style={{fontSize:12,fontWeight:600,color:'#e8e6e0'}}>{e.f}</div><div style={{fontSize:10,color:'#888'}}>{e.d}</div></div>
        <button style={{padding:'6px 16px',borderRadius:6,border:'none',background:'rgba(198,163,78,.1)',color:'#c6a34e',fontSize:11,cursor:'pointer'}}>⬇ {e.ext}</button>
      </div>)}
    </C>}
  </div>;
}

// ════════════════════════════════════════════════════════════
// 3. ÉVALUATIONS & OBJECTIFS
// ════════════════════════════════════════════════════════════
export function EvaluationsV2({s}){
  const emps=(s.clients||[]).flatMap(c=>(c.emps||[]).map(e=>({...e,_cl:c.company?.name||''})));
  const [tab,setTab]=useState('cycle');
  const [evaluations,setEvaluations]=useState(emps.slice(0,10).map((e,i)=>({
    emp:(e.first||e.fn||'E')+' '+(e.last||e.ln||i),
    manager:'Sophie Lambert',
    statut:['planifie','en_cours','complete','valide'][i%4],
    dateEval:i%4>=2?'2026-01-'+(15+i):null,
    note:i%4>=2?(3+Math.random()*2).toFixed(1):null,
    objectifs:[
      {titre:'Objectif performance '+((i%3)+1),poids:40,realise:Math.round(Math.random()*100),type:'quantitatif'},
      {titre:'Développement compétences',poids:30,realise:Math.round(Math.random()*100),type:'qualitatif'},
      {titre:'Esprit d\'équipe & collaboration',poids:30,realise:Math.round(Math.random()*100),type:'comportemental'},
    ],
    bonus_cct90:i%4>=2&&Math.random()>0.5,
  })));
  const statutColors={planifie:'#888',en_cours:'#eab308',complete:'#3b82f6',valide:'#22c55e'};
  const avgNote=evaluations.filter(e=>e.note).reduce((a,e)=>a+(+e.note),0)/Math.max(evaluations.filter(e=>e.note).length,1);

  return <div style={{padding:24}}>
    <h2 style={{fontSize:22,fontWeight:700,color:'#c6a34e',margin:'0 0 4px'}}>⭐ Évaluations & Objectifs</h2>
    <p style={{fontSize:12,color:'#888',margin:'0 0 20px'}}>Cycle annuel — Objectifs pondérés — Lien bonus CCT 90 — Entretiens</p>

    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:18}}>
      {[{l:'Évaluations',v:evaluations.length,c:'#3b82f6'},{l:'Complétées',v:evaluations.filter(e=>e.statut==='complete'||e.statut==='valide').length,c:'#22c55e'},{l:'En attente',v:evaluations.filter(e=>e.statut==='planifie'||e.statut==='en_cours').length,c:'#eab308'},{l:'Note moyenne',v:avgNote.toFixed(1)+'/5',c:'#c6a34e'},{l:'Éligibles CCT 90',v:evaluations.filter(e=>e.bonus_cct90).length,c:'#a855f7'}].map((k,i)=><div key={i} style={{padding:'12px 14px',background:'rgba(198,163,78,.04)',borderRadius:10,border:'1px solid rgba(198,163,78,.08)'}}><div style={{fontSize:9,color:'#5e5c56',textTransform:'uppercase'}}>{k.l}</div><div style={{fontSize:17,fontWeight:700,color:k.c,marginTop:4}}>{k.v}</div></div>)}
    </div>

    <div style={{display:'flex',gap:6,marginBottom:16}}>{[{v:'cycle',l:'🔄 Cycle évaluation'},{v:'objectifs',l:'🎯 Objectifs'},{v:'entretiens',l:'📋 Entretiens'},{v:'cct90',l:'💰 Lien CCT 90'},{v:'legal',l:'📜 Cadre légal'}].map(t=><button key={t.v} onClick={()=>setTab(t.v)} style={{padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:tab===t.v?600:400,fontFamily:'inherit',background:tab===t.v?'rgba(198,163,78,.15)':'rgba(255,255,255,.03)',color:tab===t.v?'#c6a34e':'#9e9b93'}}>{t.l}</button>)}</div>

    {tab==='cycle'&&<C title="Cycle d'évaluation annuel">
      {[{n:1,t:'Fixation objectifs',m:'Janvier',d:'Manager et employé fixent les objectifs annuels (3-5 objectifs pondérés)',s:'planifie'},
        {n:2,t:'Mid-year review',m:'Juin-Juillet',d:'Point intermédiaire: avancement, ajustements, feedback 360°',s:'en_cours'},
        {n:3,t:'Évaluation annuelle',m:'Novembre-Décembre',d:'Entretien formel: évaluation objectifs, note globale, plan développement',s:'complete'},
        {n:4,t:'Validation & suite',m:'Janvier N+1',d:'Validation RH/Direction, impact bonus CCT 90, plan formation, augmentation mérite',s:'valide'},
      ].map((step,i)=><div key={i} style={{display:'flex',gap:12,padding:'12px 0',borderBottom:'1px solid rgba(255,255,255,.03)'}}>
        <div style={{width:32,height:32,borderRadius:'50%',background:statutColors[step.s]+'20',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:statutColors[step.s],flexShrink:0}}>{step.n}</div>
        <div style={{flex:1}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:13,fontWeight:600,color:'#e8e6e0'}}>{step.t}</span><Badge text={step.m} color={statutColors[step.s]}/></div>
          <div style={{fontSize:10.5,color:'#9e9b93',marginTop:2}}>{step.d}</div>
        </div>
      </div>)}
    </C>}

    {tab==='objectifs'&&<div>
      {evaluations.slice(0,6).map((ev,i)=><C key={i} title={ev.emp}>
        {ev.objectifs.map((obj,j)=><div key={j} style={{padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,.03)'}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11}}>
            <span style={{color:'#e8e6e0'}}>{obj.titre}</span>
            <div style={{display:'flex',gap:8}}>
              <Badge text={'Poids: '+obj.poids+'%'} color="#888"/>
              <Badge text={obj.realise+'%'} color={obj.realise>=80?'#22c55e':obj.realise>=50?'#eab308':'#f87171'}/>
            </div>
          </div>
          <div style={{width:'100%',height:6,background:'rgba(255,255,255,.05)',borderRadius:3,marginTop:4}}>
            <div style={{width:obj.realise+'%',height:'100%',background:obj.realise>=80?'#22c55e':obj.realise>=50?'#eab308':'#f87171',borderRadius:3}}/>
          </div>
        </div>)}
        <Row l="Score pondéré" v={ev.note?ev.note+'/5':'En cours'} c={ev.note&&+ev.note>=4?'#22c55e':ev.note&&+ev.note>=3?'#eab308':'#888'} b/>
      </C>)}
    </div>}

    {tab==='entretiens'&&<C title="Entretiens d'évaluation">
      <div style={{display:'grid',gridTemplateColumns:'180px 140px 100px 80px 100px',gap:4,padding:'6px 0',borderBottom:'2px solid rgba(198,163,78,.15)',fontSize:9,fontWeight:700,color:'#c6a34e'}}>
        <div>Employé</div><div>Manager</div><div>Date</div><div>Note</div><div>Statut</div>
      </div>
      {evaluations.map((ev,i)=><div key={i} style={{display:'grid',gridTemplateColumns:'180px 140px 100px 80px 100px',gap:4,padding:'5px 0',borderBottom:'1px solid rgba(255,255,255,.03)',fontSize:11,alignItems:'center'}}>
        <div style={{color:'#e8e6e0',fontWeight:600}}>{ev.emp}</div>
        <div style={{color:'#888'}}>{ev.manager}</div>
        <div style={{color:'#888',fontSize:10}}>{ev.dateEval||'À planifier'}</div>
        <div style={{fontWeight:700,color:ev.note&&+ev.note>=4?'#22c55e':ev.note?'#eab308':'#888'}}>{ev.note||'—'}</div>
        <Badge text={ev.statut.replace('_',' ')} color={statutColors[ev.statut]}/>
      </div>)}
    </C>}

    {tab==='cct90'&&<C title="💰 Lien Évaluation → Bonus CCT 90">
      <div style={{fontSize:11,color:'#e8e6e0',marginBottom:12}}>Les résultats d'évaluation déterminent l'éligibilité au bonus non récurrent CCT 90.</div>
      <Row l="Principe" v="Objectifs collectifs mesurables → Bonus exonéré ONSS/IPP"/>
      <Row l="Lien évaluation" v="Note ≥ 3/5 = éligible au bonus collectif"/>
      <Row l="Plafond 2026" v="4.020 EUR brut (3.496 EUR net après cotisation solidarité 13.07%)" c="#22c55e"/>
      <Row l="ONSS" v="Cotisation de solidarité: 33% employeur + 13.07% travailleur"/>
      <Row l="Fiscal" v="Exonéré d'impôt sur le revenu (IPP) pour le travailleur"/>
      <div style={{marginTop:10,fontSize:10,color:'#888'}}>Le plan d'objectifs CCT 90 doit être déposé au SPF ETCS avant le 1/3 de la période de référence. Voir module CCT 90 Bonus pour le simulateur complet.</div>
    </C>}

    {tab==='legal'&&<C title="Cadre légal — Évaluations">
      {[
        {t:'CCT n°9 du 09/03/1972',d:'Information et consultation des travailleurs. Le CE doit être informé des critères d\'évaluation.'},
        {t:'CCT n°109 du 12/02/2014',d:'Motivation du licenciement. L\'évaluation peut servir de base à un licenciement motivé.'},
        {t:'Loi 03/07/1978, Art. 17',d:'Obligations du travailleur: exécuter le travail avec soin. Base des objectifs de performance.'},
        {t:'CCT n°90 du 20/12/2007',d:'Avantages non récurrents liés aux résultats. Lien direct évaluation → bonus.'},
        {t:'RGPD Art. 22',d:'Droit de ne pas faire l\'objet d\'une décision automatisée. L\'évaluation doit comporter un entretien humain.'},
      ].map((r,i)=><div key={i} style={{padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.03)'}}>
        <b style={{color:'#c6a34e',fontSize:12}}>{r.t}</b>
        <div style={{fontSize:10.5,color:'#9e9b93',marginTop:2}}>{r.d}</div>
      </div>)}
    </C>}
  </div>;
}

// ════════════════════════════════════════════════════════════
// 4. GESTION FORMATIONS — VCA, HACCP, budget, suivi
// ════════════════════════════════════════════════════════════
const FORMATIONS_OBL=[
  {id:'vca',nom:'VCA (Veiligheid, gezondheid en milieu Checklist Aannemers)',secteurs:'Construction (CP 124), Industrie, Intérim',duree:'1 jour (base) / 3 jours (cadre opérationnel)',validite:'10 ans',organisme:'BeSaCC-VCA asbl',prix:'150-400 EUR',desc:'Sécurité, santé et environnement sur chantiers. Obligatoire pour travailleurs sur sites industriels/construction.'},
  {id:'haccp',nom:'HACCP (Hazard Analysis Critical Control Points)',secteurs:'Horeca (CP 302), Alimentation (CP 118, 119, 220)',duree:'1 jour (base) / 2 jours (responsable)',validite:'Pas de durée légale — recyclage recommandé tous les 3 ans',organisme:'AFSCA (Agence fédérale sécurité alimentaire)',prix:'100-250 EUR',desc:'Hygiène alimentaire et analyse des dangers. Obligatoire pour tout personnel manipulant des aliments.'},
  {id:'secours',nom:'Premiers secours (secouriste)',secteurs:'Tous secteurs (≥ 20 travailleurs: 1 secouriste / 20)',duree:'15h (formation initiale) + 4h/an (recyclage)',validite:'Recyclage annuel obligatoire',organisme:'Croix-Rouge, SEPPT, organisme agréé',prix:'200-350 EUR',desc:'Formation obligatoire secouristes d\'entreprise. AR 15/12/2010.'},
  {id:'incendie',nom:'Prévention incendie (équipier 1ère intervention)',secteurs:'Tous secteurs',duree:'4h (base) + 2h/an (recyclage)',validite:'Recyclage annuel recommandé',organisme:'SEPPT, zone de secours',prix:'100-200 EUR',desc:'Utilisation extincteurs, évacuation, plan d\'urgence interne.'},
  {id:'ba4ba5',nom:'BA4/BA5 (habilitation électrique)',secteurs:'Construction, industrie, maintenance',duree:'1-2 jours selon niveau',validite:'Pas de durée légale — recyclage tous les 3-5 ans recommandé',organisme:'RGIE (Règlement Général sur les Installations Électriques)',prix:'200-500 EUR',desc:'Habilitation pour travaux sur/près installations électriques. BA4=averti, BA5=qualifié.'},
  {id:'adr',nom:'ADR (transport matières dangereuses)',secteurs:'Transport (CP 140), logistique, chimie',duree:'3-5 jours selon spécialisation',validite:'5 ans',organisme:'SPF Mobilité — examen agréé',prix:'400-800 EUR',desc:'Transport routier de marchandises dangereuses. Certificat ADR obligatoire pour chauffeurs.'},
  {id:'ergonomie',nom:'Prévention TMS (troubles musculosquelettiques)',secteurs:'Logistique, industrie, bureau (écran)',duree:'2-4h',validite:'Recyclage tous les 5 ans',organisme:'SEPPT, conseiller en prévention ergonome',prix:'50-150 EUR',desc:'Postes à écran: AR 27/08/1993. Manutention manuelle: AR 12/08/1993.'},
  {id:'droit_formation',nom:'Droit individuel à la formation',secteurs:'Tous secteurs ≥ 10 travailleurs',duree:'5 jours/an par ETP (2026)',validite:'Annuel — prorata temps partiel',organisme:'Employeur + compte formation individuel',prix:'Budget: 2% masse salariale minimum',desc:'Loi 03/10/2022. Chaque travailleur a droit à min 5 jours formation/an (ETP). Compte formation individuel obligatoire.'},
];

export function FormationsV2({s}){
  const emps=(s.clients||[]).flatMap(c=>(c.emps||[]).map(e=>({...e,_cl:c.company?.name||''})));
  const [tab,setTab]=useState('obligatoires');
  const [expanded,setExpanded]=useState({});
  const n=emps.length;
  const budgetMin=emps.reduce((a,e)=>a+(+(e.monthlySalary||e.gross||0)),0)*12*0.02;

  return <div style={{padding:24}}>
    <h2 style={{fontSize:22,fontWeight:700,color:'#c6a34e',margin:'0 0 4px'}}>🎓 Gestion Formations</h2>
    <p style={{fontSize:12,color:'#888',margin:'0 0 20px'}}>Formations obligatoires (VCA, HACCP, secours) + Droit individuel 5j/an + Budget</p>

    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:18}}>
      {[{l:'Formations obligatoires',v:FORMATIONS_OBL.length,c:'#c6a34e'},{l:'Travailleurs',v:n,c:'#3b82f6'},{l:'Droit formation/ETP',v:'5 jours/an',c:'#22c55e'},{l:'Budget min (2%)',v:fmt(budgetMin)+' €/an',c:'#fb923c'},{l:'Heures formation/an',v:fi(n*5*7.6)+'h',c:'#a855f7'}].map((k,i)=><div key={i} style={{padding:'12px 14px',background:'rgba(198,163,78,.04)',borderRadius:10,border:'1px solid rgba(198,163,78,.08)'}}><div style={{fontSize:9,color:'#5e5c56',textTransform:'uppercase'}}>{k.l}</div><div style={{fontSize:15,fontWeight:700,color:k.c,marginTop:4}}>{k.v}</div></div>)}
    </div>

    <div style={{display:'flex',gap:6,marginBottom:16}}>{[{v:'obligatoires',l:'📋 Obligatoires ('+FORMATIONS_OBL.length+')'},{v:'suivi',l:'📊 Suivi employés'},{v:'budget',l:'💰 Budget'},{v:'planification',l:'📅 Planification'},{v:'legal',l:'📜 Base légale'}].map(t=><button key={t.v} onClick={()=>setTab(t.v)} style={{padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:tab===t.v?600:400,fontFamily:'inherit',background:tab===t.v?'rgba(198,163,78,.15)':'rgba(255,255,255,.03)',color:tab===t.v?'#c6a34e':'#9e9b93'}}>{t.l}</button>)}</div>

    {tab==='obligatoires'&&<div>
      {FORMATIONS_OBL.map(f=>{const isExp=expanded[f.id];return <div key={f.id} style={{marginBottom:8}}>
        <div onClick={()=>setExpanded(prev=>({...prev,[f.id]:!prev[f.id]}))} style={{padding:'12px 16px',background:'rgba(198,163,78,.03)',borderRadius:isExp?'10px 10px 0 0':'10px',border:'1px solid rgba(198,163,78,.08)',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div><div style={{fontSize:12,fontWeight:600,color:'#e8e6e0'}}>{f.nom}</div><div style={{fontSize:10,color:'#888',marginTop:2}}>{f.secteurs}</div></div>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <Badge text={f.validite.split(' — ')[0]} color="#22c55e"/>
            <Badge text={f.prix} color="#c6a34e"/>
            <span style={{fontSize:10,color:isExp?'#c6a34e':'#555',transform:isExp?'rotate(180deg)':'',transition:'transform .2s',display:'inline-block'}}>▼</span>
          </div>
        </div>
        {isExp&&<div style={{padding:16,background:'rgba(198,163,78,.02)',border:'1px solid rgba(198,163,78,.08)',borderTop:'none',borderRadius:'0 0 10px 10px'}}>
          <Row l="Description" v={f.desc}/>
          <Row l="Durée" v={f.duree}/>
          <Row l="Validité" v={f.validite}/>
          <Row l="Organisme" v={f.organisme}/>
          <Row l="Coût" v={f.prix}/>
          <Row l="Secteurs" v={f.secteurs}/>
        </div>}
      </div>})}
    </div>}

    {tab==='suivi'&&<C title="Suivi formations par employé">
      <div style={{display:'grid',gridTemplateColumns:'180px repeat(4,1fr) 80px',gap:4,padding:'6px 0',borderBottom:'2px solid rgba(198,163,78,.15)',fontSize:9,fontWeight:700,color:'#c6a34e'}}>
        <div>Employé</div><div>Jours pris</div><div>Solde</div><div>Dernière formation</div><div>Prochaine</div><div>Statut</div>
      </div>
      {emps.slice(0,15).map((e,i)=>{const pris=Math.floor(Math.random()*5);const solde=5-pris;
      return <div key={i} style={{display:'grid',gridTemplateColumns:'180px repeat(4,1fr) 80px',gap:4,padding:'5px 0',borderBottom:'1px solid rgba(255,255,255,.03)',fontSize:11,alignItems:'center'}}>
        <div style={{color:'#e8e6e0'}}>{(e.first||e.fn||'')+' '+(e.last||e.ln||'')}</div>
        <div style={{fontFamily:'monospace'}}>{pris}j / 5j</div>
        <div style={{fontFamily:'monospace',fontWeight:600,color:solde>2?'#22c55e':solde>0?'#eab308':'#f87171'}}>{solde}j</div>
        <div style={{color:'#888',fontSize:10}}>{pris>0?'2026-0'+Math.max(1,Math.floor(Math.random()*3)):'-'}</div>
        <div style={{color:'#888',fontSize:10}}>{solde>0?'2026-0'+(Math.floor(Math.random()*6)+4):'-'}</div>
        <Badge text={solde>=3?'OK':solde>0?'En cours':'Épuisé'} color={solde>=3?'#22c55e':solde>0?'#eab308':'#f87171'}/>
      </div>})}
    </C>}

    {tab==='budget'&&<C title="Budget formation">
      <Row l="Obligation légale" v="2% de la masse salariale (Loi 03/10/2022)"/>
      <Row l="Masse salariale annuelle" v={fmt(emps.reduce((a,e)=>a+(+(e.monthlySalary||e.gross||0)),0)*12)+' €'}/>
      <Row l="Budget minimum obligatoire (2%)" v={fmt(budgetMin)+' €/an'} c="#fb923c" b/>
      <Row l="Jours formation: droit individuel" v={n+' ETP × 5j = '+n*5+' jours'}/>
      <Row l="Coût moyen par jour" v={n>0?fmt(budgetMin/(n*5))+' €/jour':'N/A'}/>
      <Row l="Formations VCA/HACCP (estimation)" v={fmt(n*250)+' €'} c="#888"/>
      <Row l="Premiers secours (recyclage)" v={fmt(Math.ceil(n/20)*150)+' €'} c="#888"/>
      <div style={{marginTop:10,fontSize:10,color:'#888'}}>Le budget formation non utilisé doit être versé au Fonds sectoriel (via la CP) ou reporté sur l'année suivante. Le compte formation individuel est accessible sur le portail Federal Learning Account.</div>
    </C>}

    {tab==='planification'&&<C title="Planification annuelle">
      {['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'].map((m,i)=>{
        const formations=i===0?['Fixation plan formation']:i===1?['VCA (nouveaux)']:i===2?['Premiers secours recyclage']:i===4?['HACCP (horeca)']:i===5?['Mid-year: bilan formation']:i===8?['BA4/BA5']:i===9?['Ergonomie postes']:i===11?['Bilan annuel + soldes']:[];
        return <div key={i} style={{display:'flex',gap:12,padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,.03)',alignItems:'center'}}>
          <span style={{fontSize:11,fontWeight:600,color:'#c6a34e',width:100}}>{m}</span>
          <div style={{flex:1,display:'flex',gap:4,flexWrap:'wrap'}}>{formations.map((f,j)=><Badge key={j} text={f} color="#3b82f6"/>)}{formations.length===0&&<span style={{fontSize:10,color:'#555'}}>—</span>}</div>
        </div>})}
    </C>}

    {tab==='legal'&&<C title="Base légale — Formations">
      {[
        {t:'Loi 03/10/2022',d:'Droit individuel à la formation: 5 jours/an par ETP (2026). Prorata temps partiel. Compte formation individuel.'},
        {t:'AR 15/12/2010',d:'Premiers secours en entreprise. 1 secouriste par 20 travailleurs minimum.'},
        {t:'Code du bien-être au travail, Livre I Titre 2',d:'Formation sécurité obligatoire pour tout nouveau travailleur + recyclage.'},
        {t:'RGIE Art. 47',d:'Habilitation électrique BA4 (averti) / BA5 (qualifié). Formation + évaluation obligatoires.'},
        {t:'Règlement CE 852/2004',d:'HACCP: formation hygiène alimentaire obligatoire pour tout personnel alimentaire.'},
        {t:'VCA — Petrochemical Standard',d:'Exigence contractuelle pour accès sites industriels/construction. Pas une obligation légale directe mais standard sectoriel.'},
        {t:'CCT sectorielles — Fonds de formation',d:'Chaque CP a un fonds de formation sectoriel qui organise et finance des formations spécifiques.'},
        {t:'Federal Learning Account',d:'Portail fédéral de suivi des droits de formation individuels. Obligatoire depuis 01/04/2024.'},
      ].map((r,i)=><div key={i} style={{padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.03)'}}>
        <b style={{color:'#c6a34e',fontSize:12}}>{r.t}</b>
        <div style={{fontSize:10.5,color:'#9e9b93',marginTop:2}}>{r.d}</div>
      </div>)}
    </C>}
  </div>;
}

// ════════════════════════════════════════════════════════════
// 5. HUB FIDUCIAIRE — Dashboard consolidé multi-clients
// ════════════════════════════════════════════════════════════
export function HubFiduciaireV2({s}){
  const clients=s.clients||[];
  const [tab,setTab]=useState('dashboard');
  const [selClient,setSelClient]=useState(null);
  const totalEmps=clients.reduce((a,c)=>a+(c.emps||[]).length,0);
  const totalMasse=clients.reduce((a,c)=>a+(c.emps||[]).reduce((b,e)=>b+(+(e.monthlySalary||e.gross||0)),0),0);
  const totalCout=totalMasse*(1+0.2507);

  const clientData=clients.map(c=>{
    const emps=c.emps||[];const co=c.company||{};
    const masse=emps.reduce((a,e)=>a+(+(e.monthlySalary||e.gross||0)),0);
    const missingNISS=emps.filter(e=>!(e.niss||e.NISS)).length;
    const missingIBAN=emps.filter(e=>!(e.iban||e.IBAN)).length;
    const cdd=emps.filter(e=>(e.contractType||'').toUpperCase()==='CDD').length;
    const completude=emps.length>0?Math.round((1-(missingNISS+missingIBAN)/(emps.length*2))*100):0;
    return {nom:co.name||'Client',vat:co.vat||'',cp:co.cp||'200',emps:emps.length,masse,cout:masse*(1+0.2507),missingNISS,missingIBAN,cdd,completude};
  });

  return <div style={{padding:24}}>
    <h2 style={{fontSize:22,fontWeight:700,color:'#c6a34e',margin:'0 0 4px'}}>🏢 Hub Fiduciaire</h2>
    <p style={{fontSize:12,color:'#888',margin:'0 0 20px'}}>Dashboard consolidé multi-clients — Vue cabinet comptable</p>

    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:18}}>
      {[{l:'Clients actifs',v:clients.length,c:'#c6a34e'},{l:'Travailleurs total',v:totalEmps,c:'#3b82f6'},{l:'Masse salariale/mois',v:fmt(totalMasse)+' €',c:'#22c55e'},{l:'Coût total/mois',v:fmt(totalCout)+' €',c:'#f87171'},{l:'Complétude moy.',v:clientData.length>0?Math.round(clientData.reduce((a,c)=>a+c.completude,0)/clientData.length)+'%':'N/A',c:'#a855f7'}].map((k,i)=><div key={i} style={{padding:'12px 14px',background:'rgba(198,163,78,.04)',borderRadius:10,border:'1px solid rgba(198,163,78,.08)'}}><div style={{fontSize:9,color:'#5e5c56',textTransform:'uppercase'}}>{k.l}</div><div style={{fontSize:17,fontWeight:700,color:k.c,marginTop:4}}>{k.v}</div></div>)}
    </div>

    <div style={{display:'flex',gap:6,marginBottom:16}}>{[{v:'dashboard',l:'📊 Dashboard'},{v:'clients',l:'🏢 Clients ('+clients.length+')'},{v:'alertes',l:'⚠ Alertes'},{v:'echeances',l:'📅 Échéances'},{v:'facturation',l:'💳 Facturation'}].map(t=><button key={t.v} onClick={()=>setTab(t.v)} style={{padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:tab===t.v?600:400,fontFamily:'inherit',background:tab===t.v?'rgba(198,163,78,.15)':'rgba(255,255,255,.03)',color:tab===t.v?'#c6a34e':'#9e9b93'}}>{t.l}</button>)}</div>

    {tab==='dashboard'&&<div>
      {/* Chart */}
      <C title="Répartition masse salariale par client">
        <div style={{display:'flex',alignItems:'flex-end',gap:6,height:160,marginBottom:10}}>
          {clientData.sort((a,b)=>b.masse-a.masse).map((c,i)=>{const mx=Math.max(...clientData.map(x=>x.masse),1);return <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',maxWidth:80}}>
            <div style={{fontSize:8,color:'#888',marginBottom:2}}>{fmt(c.masse)}</div>
            <div style={{width:'100%',height:(c.masse/mx*140),background:'linear-gradient(180deg,#c6a34e,rgba(198,163,78,.3))',borderRadius:'4px 4px 0 0',minHeight:c.masse>0?4:0}}/>
            <div style={{fontSize:8,color:'#888',marginTop:4,textAlign:'center',whiteSpace:'nowrap',overflow:'hidden',maxWidth:80}}>{c.nom}</div>
          </div>})}
        </div>
      </C>
      <C title="Détail par client">
        <div style={{display:'grid',gridTemplateColumns:'200px 60px 120px 120px 60px 80px',gap:4,padding:'6px 0',borderBottom:'2px solid rgba(198,163,78,.15)',fontSize:9,fontWeight:700,color:'#c6a34e'}}>
          <div>Client</div><div>ETP</div><div>Masse sal.</div><div>Coût total</div><div>CDD</div><div>Complétude</div>
        </div>
        {clientData.sort((a,b)=>b.masse-a.masse).map((c,i)=><div key={i} style={{display:'grid',gridTemplateColumns:'200px 60px 120px 120px 60px 80px',gap:4,padding:'5px 0',borderBottom:'1px solid rgba(255,255,255,.03)',fontSize:11,alignItems:'center'}}>
          <div style={{color:'#e8e6e0',fontWeight:600}}>{c.nom}</div>
          <div>{c.emps}</div>
          <div style={{fontFamily:'monospace'}}>{fmt(c.masse)} €</div>
          <div style={{fontFamily:'monospace',color:'#f87171'}}>{fmt(c.cout)} €</div>
          <div style={{color:c.cdd>0?'#fb923c':'#888'}}>{c.cdd}</div>
          <Badge text={c.completude+'%'} color={c.completude>=90?'#22c55e':c.completude>=70?'#eab308':'#f87171'}/>
        </div>)}
        <Row l="TOTAL" v={fmt(totalMasse)+' € masse / '+fmt(totalCout)+' € coût'} c="#c6a34e" b/>
      </C>
    </div>}

    {tab==='alertes'&&<C title="⚠ Alertes tous clients" color="#f87171">
      {clientData.flatMap(c=>[
        ...(c.missingNISS>0?[{client:c.nom,type:'NISS manquant',count:c.missingNISS,sev:'critical'}]:[]),
        ...(c.missingIBAN>0?[{client:c.nom,type:'IBAN manquant',count:c.missingIBAN,sev:'warning'}]:[]),
        ...(c.completude<70?[{client:c.nom,type:'Dossier incomplet ('+c.completude+'%)',count:1,sev:'critical'}]:[]),
        ...(c.cdd>0?[{client:c.nom,type:'CDD à vérifier',count:c.cdd,sev:'info'}]:[]),
      ]).sort((a,b)=>a.sev==='critical'?-1:1).map((a,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,.03)'}}>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <Badge text={a.sev==='critical'?'🔴':'⚠'} color={a.sev==='critical'?'#f87171':'#eab308'}/>
          <span style={{fontSize:11,color:'#e8e6e0'}}>{a.client}</span>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span style={{fontSize:11,color:'#888'}}>{a.type}</span>
          <Badge text={a.count+''} color={a.sev==='critical'?'#f87171':'#eab308'}/>
        </div>
      </div>)}
      {clientData.every(c=>c.missingNISS===0&&c.missingIBAN===0&&c.completude>=70)&&<div style={{padding:20,textAlign:'center',color:'#22c55e'}}>✓ Aucune alerte — tous les dossiers sont complets</div>}
    </C>}

    {tab==='echeances'&&<C title="📅 Échéances légales — Tous clients">
      {[
        {date:'10/04/2026',action:'DmfA T1 2026',desc:'Déclaration trimestrielle ONSS — tous clients',sev:'critical'},
        {date:'15/04/2026',action:'PP Mars 2026',desc:'Versement précompte professionnel Mars',sev:'critical'},
        {date:'30/04/2026',action:'Fiches 281.10',desc:'Envoi fiches fiscales annuelles (Belcotax)',sev:'warning'},
        {date:'30/06/2026',action:'Bilan social',desc:'Dépôt bilan social BNB — clients > 20 ETP',sev:'warning'},
        {date:'01/07/2026',action:'Pécule vacances',desc:'Versement pécule vacances employés (double)',sev:'critical'},
        {date:'10/07/2026',action:'DmfA T2 2026',desc:'Déclaration trimestrielle ONSS T2',sev:'critical'},
        {date:'31/12/2026',action:'Prime fin d\'année',desc:'Versement 13ème mois / prime fin d\'année',sev:'warning'},
      ].map((e,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,.03)',alignItems:'center'}}>
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <Badge text={e.date} color={e.sev==='critical'?'#f87171':'#eab308'}/>
          <div><div style={{fontSize:12,fontWeight:600,color:'#e8e6e0'}}>{e.action}</div><div style={{fontSize:10,color:'#888'}}>{e.desc}</div></div>
        </div>
        <Badge text={clients.length+' clients'} color="#3b82f6"/>
      </div>)}
    </C>}

    {tab==='facturation'&&<C title="💳 Facturation cabinet">
      <div style={{fontSize:11,color:'#e8e6e0',marginBottom:12}}>Grille tarifaire par client basée sur le nombre de travailleurs gérés.</div>
      <div style={{display:'grid',gridTemplateColumns:'200px 60px 100px 100px 100px',gap:4,padding:'6px 0',borderBottom:'2px solid rgba(198,163,78,.15)',fontSize:9,fontWeight:700,color:'#c6a34e'}}>
        <div>Client</div><div>ETP</div><div>Tarif/ETP</div><div>Total/mois</div><div>Total/an</div>
      </div>
      {clientData.map((c,i)=>{const tarif=c.emps<=5?45:c.emps<=20?35:c.emps<=50?30:25;return <div key={i} style={{display:'grid',gridTemplateColumns:'200px 60px 100px 100px 100px',gap:4,padding:'5px 0',borderBottom:'1px solid rgba(255,255,255,.03)',fontSize:11}}>
        <div style={{color:'#e8e6e0',fontWeight:600}}>{c.nom}</div>
        <div>{c.emps}</div>
        <div style={{fontFamily:'monospace'}}>{tarif} €/ETP</div>
        <div style={{fontFamily:'monospace',color:'#c6a34e'}}>{fmt(c.emps*tarif)} €</div>
        <div style={{fontFamily:'monospace',color:'#22c55e'}}>{fmt(c.emps*tarif*12)} €</div>
      </div>})}
      <Row l="TOTAL FACTURATION/MOIS" v={fmt(clientData.reduce((a,c)=>{const t=c.emps<=5?45:c.emps<=20?35:c.emps<=50?30:25;return a+c.emps*t;},0))+' €'} c="#c6a34e" b/>
      <Row l="TOTAL FACTURATION/AN" v={fmt(clientData.reduce((a,c)=>{const t=c.emps<=5?45:c.emps<=20?35:c.emps<=50?30:25;return a+c.emps*t*12;},0))+' €'} c="#22c55e" b/>
    </C>}
  </div>;
}
