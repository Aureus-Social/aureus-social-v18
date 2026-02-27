'use client';
import{useState,useMemo}from'react';

const fmt=v=>new Intl.NumberFormat('fr-BE',{minimumFractionDigits:2,maximumFractionDigits:2}).format(v||0);
const fi=v=>new Intl.NumberFormat('fr-BE',{maximumFractionDigits:0}).format(v||0);
const C=({children,title:t,sub,color})=><div style={{background:'rgba(198,163,78,.03)',borderRadius:12,padding:16,border:'1px solid '+(color||'rgba(198,163,78,.08)'),marginBottom:14}}>{t&&<div style={{fontSize:13,fontWeight:600,color:color||'#c6a34e',marginBottom:sub?2:10}}>{t}</div>}{sub&&<div style={{fontSize:10,color:'#888',marginBottom:10}}>{sub}</div>}{children}</div>;
const Row=({l,v,c,b,sub})=><div style={{display:'flex',justifyContent:'space-between',padding:b?'8px 0':'5px 0',borderBottom:b?'2px solid rgba(198,163,78,.2)':'1px solid rgba(255,255,255,.03)',fontWeight:b?700:400}}><span style={{color:sub?'#888':'#e8e6e0',fontSize:sub?10:11.5,fontStyle:sub?'italic':'normal'}}>{l}</span><span style={{color:c||'#c6a34e',fontWeight:600,fontSize:12}}>{v}</span></div>;
const I=({label,type,value,onChange,style:st,options})=><div style={st}><div style={{fontSize:10,color:'#5e5c56',marginBottom:3}}>{label}</div>{options?<select value={value} onChange={e=>onChange(e.target.value)} style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid rgba(198,163,78,.15)',background:'rgba(198,163,78,.04)',color:'#e8e6e0',fontSize:12,fontFamily:'inherit'}}>{options.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}</select>:<input type={type||'text'} value={value} onChange={e=>onChange(type==='number'?+e.target.value:e.target.value)} style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid rgba(198,163,78,.15)',background:'rgba(198,163,78,.04)',color:'#e8e6e0',fontSize:12,fontFamily:'inherit',boxSizing:'border-box'}}/>}</div>;
const Badge=({text,color})=><span style={{padding:'2px 7px',borderRadius:5,fontSize:8,fontWeight:600,background:(color||'#888')+'15',color:color||'#888'}}>{text}</span>;

// ════════════════════════════════════════════════════════════
// 1. SALAIRE GARANTI V2 — 30j employés + 7/7/7 ouvriers + reprise progressive
// ════════════════════════════════════════════════════════════
export function SalaireGarantiV2({s}){
  const [salaire,setSalaire]=useState(3000);
  const [statut,setStatut]=useState('employe');
  const [anciennete,setAnciennete]=useState(5);
  const [joursAbsence,setJoursAbsence]=useState(30);
  const [tab,setTab]=useState('simu');
  const brut=+salaire||0;const j=+joursAbsence||0;const salJour=brut/21.67;
  const isOuvrier=statut==='ouvrier';

  const periodes=isOuvrier?[
    {nom:'Période 1 — Jours 1-7',jours:Math.min(j,7),taux:100,source:'Employeur',desc:'100% salaire normal',base:'Art. 52 Loi 03/07/1978'},
    {nom:'Période 2 — Jours 8-14',jours:Math.min(Math.max(j-7,0),7),taux:85.88,source:'Employeur (85.88%)',desc:'85.88% du salaire brut plafonné',base:'Art. 53 Loi 03/07/1978'},
    {nom:'Période 3 — Jours 15-30',jours:Math.min(Math.max(j-14,0),16),taux:85.88,source:'Employeur (25.88%) + Mutuelle (60%)',desc:'25.88% employeur + 60% mutuelle = 85.88%',base:'Art. 54 Loi 03/07/1978 + AR'},
    {nom:'Au-delà de 30 jours',jours:Math.max(j-30,0),taux:60,source:'Mutuelle uniquement',desc:'60% du salaire brut plafonné (plafond mutuelle)',base:'Loi AMI 14/07/1994'},
  ]:[
    {nom:'Période 1 — Jours 1-30',jours:Math.min(j,30),taux:100,source:'Employeur',desc:'100% du salaire normal maintenu',base:'Art. 70 Loi 03/07/1978'},
    {nom:'Au-delà de 30 jours',jours:Math.max(j-30,0),taux:60,source:'Mutuelle uniquement',desc:'60% du salaire brut plafonné (plafond mutuelle)',base:'Loi AMI 14/07/1994'},
  ];
  const totalEmployeur=periodes.reduce((a,p)=>{
    if(p.source.includes('Employeur')){
      const t=p.source.includes('25.88')?25.88:p.taux;
      return a+p.jours*salJour*t/100;
    }return a;
  },0);
  const totalMutuelle=periodes.reduce((a,p)=>{
    if(p.source.includes('Mutuelle'))return a+p.jours*salJour*0.60;
    return a;
  },0);
  const totalTrav=periodes.reduce((a,p)=>a+p.jours*salJour*p.taux/100,0);

  return <div style={{padding:24}}>
    <h2 style={{fontSize:22,fontWeight:700,color:'#c6a34e',margin:'0 0 4px'}}>🏥 Salaire Garanti</h2>
    <p style={{fontSize:12,color:'#888',margin:'0 0 20px'}}>Employés (30j) + Ouvriers (7/7/7/14) + Reprise progressive + Base légale</p>

    <div style={{display:'flex',gap:6,marginBottom:16}}>{[{v:'simu',l:'🧮 Simulateur'},{v:'regles',l:'📋 Règles par statut'},{v:'reprise',l:'🔄 Reprise progressive'},{v:'legal',l:'📜 Base légale'}].map(t=><button key={t.v} onClick={()=>setTab(t.v)} style={{padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:tab===t.v?600:400,fontFamily:'inherit',background:tab===t.v?'rgba(198,163,78,.15)':'rgba(255,255,255,.03)',color:tab===t.v?'#c6a34e':'#9e9b93'}}>{t.l}</button>)}</div>

    {tab==='simu'&&<div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:16}}>
      <C title="Paramètres">
        <I label="Salaire brut mensuel" type="number" value={salaire} onChange={setSalaire}/>
        <div style={{marginTop:8}}><I label="Statut" value={statut} onChange={setStatut} options={[{v:'employe',l:'Employé'},{v:'ouvrier',l:'Ouvrier'}]}/></div>
        <div style={{marginTop:8}}><I label="Jours d'absence maladie" type="number" value={joursAbsence} onChange={setJoursAbsence}/></div>
        <div style={{marginTop:8}}><I label="Ancienneté (années)" type="number" value={anciennete} onChange={setAnciennete}/></div>
        {+anciennete<1&&<div style={{fontSize:10,color:'#f87171',marginTop:4}}>⚠ {'< 1 mois: pas de salaire garanti (période essai). ≥ 1 mois: salaire garanti applicable.'}</div>}
      </C>
      <div>
        <C title={'Décomposition — '+(isOuvrier?'Ouvrier (7/7/7/14)':'Employé (30 jours)')}>
          {periodes.filter(p=>p.jours>0).map((p,i)=><div key={i} style={{padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.05)'}}>
            <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:12,fontWeight:600,color:'#e8e6e0'}}>{p.nom}</span><Badge text={p.source} color={p.source.includes('Mutuelle')?'#3b82f6':'#22c55e'}/></div>
            <div style={{fontSize:10,color:'#888',marginTop:2}}>{p.desc}</div>
            <Row l={p.jours+' jours × '+fmt(salJour)+' €/j × '+p.taux+'%'} v={fmt(p.jours*salJour*p.taux/100)+' €'}/>
          </div>)}
          <Row l="TOTAL coût employeur" v={fmt(totalEmployeur)+' €'} c="#f87171" b/>
          <Row l="Total mutuelle" v={fmt(totalMutuelle)+' €'} c="#3b82f6"/>
          <Row l="Total perçu par le travailleur" v={fmt(totalTrav)+' €'} c="#4ade80" b/>
        </C>
      </div>
    </div>}

    {tab==='regles'&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <C title="Employé — Art. 70-75 Loi 03/07/1978" color="#22c55e">
        {[{p:'Jours 1-30',t:'100% salaire',s:'Employeur'},{p:'Jours 31-365',t:'60% brut plafonné',s:'Mutuelle'},{p:'Après 1 an',t:'60% ou 65% (charge famille)',s:'Mutuelle (invalidité)'}].map((r,i)=><Row key={i} l={r.p+' — '+r.s} v={r.t}/>)}
        <div style={{marginTop:8,fontSize:10,color:'#888'}}>Le plafond mutuelle 2026: ~180 EUR/jour brut. Au-delà: pas de couverture mutuelle supplémentaire.</div>
      </C>
      <C title="Ouvrier — Art. 52-57 Loi 03/07/1978" color="#fb923c">
        {[{p:'Jours 1-7',t:'100% salaire',s:'Employeur'},{p:'Jours 8-14',t:'85.88% brut',s:'Employeur'},{p:'Jours 15-30',t:'25.88% empl. + 60% mut.',s:'Employeur + Mutuelle'},{p:'Jours 31-365',t:'60% brut plafonné',s:'Mutuelle seule'},{p:'Après 1 an',t:'60-65% (invalidité)',s:'Mutuelle (INAMI)'}].map((r,i)=><Row key={i} l={r.p+' — '+r.s} v={r.t}/>)}
        <div style={{marginTop:8,fontSize:10,color:'#888'}}>Jour de carence ouvrier: supprimé depuis 01/01/2014 (statut unique).</div>
      </C>
    </div>}

    {tab==='reprise'&&<C title="🔄 Reprise progressive du travail (mi-temps médical)">
      {[
        {t:'Principe',d:'Le travailleur reprend à temps partiel avec autorisation du médecin-conseil de la mutuelle. L\'employeur paie le salaire pour les heures prestées, la mutuelle complète.'},
        {t:'Procédure',d:'1. Certificat médecin traitant → 2. Accord médecin-conseil mutuelle → 3. Accord employeur (obligé si raisonnable) → 4. Avenant contrat temporaire'},
        {t:'Calcul salaire',d:'Salaire normal × fraction horaire prestée. Ex: mi-temps = 50% du salaire brut. La mutuelle verse un complément (60% de la partie non prestée).'},
        {t:'Durée',d:'Variable: quelques semaines à plusieurs mois. Réévaluée régulièrement par le médecin-conseil.'},
        {t:'Impact ONSS',d:'ONSS calculé sur le salaire effectivement payé par l\'employeur. L\'allocation mutuelle est soumise à une retenue de 11.11%.'},
        {t:'Rechute',d:'Si rechute dans les 14 jours: continuation de la période initiale (pas de nouveau délai de carence). Après 14 jours: nouvelle période de salaire garanti.'},
        {t:'Trajet de réintégration',d:'Code du bien-être: l\'employeur peut initier un trajet de réintégration après 4 mois d\'incapacité. Obligation de moyens, pas de résultat.'},
      ].map((r,i)=><div key={i} style={{padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.03)'}}>
        <div style={{fontSize:12,fontWeight:600,color:'#c6a34e'}}>{r.t}</div>
        <div style={{fontSize:10.5,color:'#9e9b93',marginTop:3}}>{r.d}</div>
      </div>)}
    </C>}

    {tab==='legal'&&<C title="Base légale — Salaire garanti">
      {[
        {t:'Loi 03/07/1978, Art. 52-57',d:'Salaire garanti ouvriers: 7j (100%) + 7j (85.88%) + 14j (25.88% + mutuelle).'},
        {t:'Loi 03/07/1978, Art. 70-75',d:'Salaire garanti employés: 30 jours à 100% du salaire normal.'},
        {t:'Loi AMI 14/07/1994',d:'Assurance obligatoire soins de santé et indemnités. Allocations mutuelle après salaire garanti.'},
        {t:'AR 03/07/1996',d:'Plafonds de rémunération pour le calcul des allocations mutuelle.'},
        {t:'Rechute (Art. 73bis)',d:'Rechute dans les 14 jours calendrier: continuation de la période initiale.'},
        {t:'Certificat médical',d:'Obligatoire si prévu dans le règlement de travail (ou CCT). Délai: selon RT (souvent 48h).'},
        {t:'Contrôle médical',d:'L\'employeur peut envoyer un médecin-contrôleur (à ses frais). Le travailleur doit se rendre disponible.'},
      ].map((r,i)=><div key={i} style={{padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.03)'}}>
        <b style={{color:'#c6a34e',fontSize:12}}>{r.t}</b>
        <div style={{fontSize:10.5,color:'#9e9b93',marginTop:2}}>{r.d}</div>
      </div>)}
    </C>}
  </div>;
}

// ════════════════════════════════════════════════════════════
// 2. CALENDRIER SOCIAL V2 — Échéances + alertes automatiques
// ════════════════════════════════════════════════════════════
const ECHEANCES_SOCIALES=[
  // Mensuelles
  {freq:'mensuel',jour:5,label:'Provisions ONSS',cat:'ONSS',desc:'Acompte ONSS mensuel (si applicable)',gravite:'medium'},
  {freq:'mensuel',jour:15,label:'PP — Déclaration 274',cat:'Fiscal',desc:'Précompte professionnel: déclaration + paiement via MyMinfin',gravite:'high'},
  {freq:'mensuel',jour:25,label:'Virements salaires',cat:'Paie',desc:'SEPA pain.001 — salaires nets + chèques-repas',gravite:'high'},
  {freq:'mensuel',jour:28,label:'Distribution fiches de paie',cat:'Paie',desc:'Fiches de paie aux travailleurs (papier ou électronique)',gravite:'medium'},
  // Trimestrielles
  {freq:'trim',mois:[4,7,10,1],jour:10,label:'DmfA trimestrielle',cat:'ONSS',desc:'Déclaration multifonctionnelle ONSS — via portail socialsecurity.be',gravite:'critical'},
  {freq:'trim',mois:[4,7,10,1],jour:15,label:'PP trimestriel (si applicable)',cat:'Fiscal',desc:'Déclaration PP trimestrielle si < 1.000 EUR/mois de PP',gravite:'high'},
  // Annuelles
  {freq:'annuel',mois:2,jour:28,label:'Belcotax 281.10/281.20',cat:'Fiscal',desc:'Fiches fiscales annuelles — 281.10 (salariés) + 281.20 (dirigeants)',gravite:'critical'},
  {freq:'annuel',mois:3,jour:1,label:'Belcotax XML deadline',cat:'Fiscal',desc:'Envoi fichier XML Belcotax via MyMinfin ou secrétariat social',gravite:'critical'},
  {freq:'annuel',mois:3,jour:31,label:'Plan de formation (≥20 trav.)',cat:'RH',desc:'Dépôt plan de formation annuel. Obligatoire si ≥ 20 travailleurs.',gravite:'medium'},
  {freq:'annuel',mois:4,jour:30,label:'Pécule vacances simple (employés)',cat:'Paie',desc:'Versement pécule simple avec le salaire de vacances (mai-juin)',gravite:'high'},
  {freq:'annuel',mois:5,jour:31,label:'Pécule vacances double',cat:'Paie',desc:'Versement double pécule: 92% du salaire mensuel brut',gravite:'high'},
  {freq:'annuel',mois:6,jour:30,label:'Bilan social (≥20 ETP)',cat:'Compliance',desc:'Dépôt bilan social BNB. Obligatoire si ≥ 20 ETP.',gravite:'high'},
  {freq:'annuel',mois:6,jour:30,label:'Éco-chèques',cat:'Paie',desc:'Distribution éco-chèques annuels (si applicable)',gravite:'low'},
  {freq:'annuel',mois:12,jour:20,label:'13ème mois',cat:'Paie',desc:'Versement prime de fin d\'année / 13ème mois',gravite:'high'},
  {freq:'annuel',mois:1,jour:31,label:'Indexation CP 200',cat:'Paie',desc:'Application indexation salariale selon le mécanisme sectoriel',gravite:'high'},
  {freq:'annuel',mois:1,jour:15,label:'Règlement de travail — MAJ',cat:'RH',desc:'Vérifier si mise à jour nécessaire du règlement de travail',gravite:'low'},
  {freq:'annuel',mois:12,jour:31,label:'Registre du personnel',cat:'Compliance',desc:'Vérification exhaustive du registre du personnel',gravite:'medium'},
  {freq:'annuel',mois:9,jour:30,label:'Visite médicale annuelle',cat:'RH',desc:'Planifier visites médicales (postes de sécurité, surveillance de santé)',gravite:'medium'},
];

export function CalendrierSocialV2({s}){
  const [moisSel,setMoisSel]=useState(new Date().getMonth()+1);
  const [tab,setTab]=useState('calendrier');
  const now=new Date();
  const moisNoms=['','Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const gravColors={critical:'#ef4444',high:'#fb923c',medium:'#eab308',low:'#22c55e'};
  const catColors={ONSS:'#3b82f6',Fiscal:'#f87171',Paie:'#c6a34e',RH:'#a855f7',Compliance:'#06b6d4'};

  const echeancesMois=useMemo(()=>{
    return ECHEANCES_SOCIALES.filter(e=>{
      if(e.freq==='mensuel')return true;
      if(e.freq==='trim')return e.mois.includes(moisSel);
      if(e.freq==='annuel')return e.mois===moisSel;
      return false;
    }).sort((a,b)=>a.jour-b.jour);
  },[moisSel]);

  const prochaines=useMemo(()=>{
    const today=now.getDate();const m=now.getMonth()+1;
    return ECHEANCES_SOCIALES.filter(e=>{
      if(e.freq==='mensuel')return e.jour>=today;
      if(e.freq==='trim')return e.mois.includes(m)&&e.jour>=today;
      if(e.freq==='annuel')return e.mois===m&&e.jour>=today;
      return false;
    }).sort((a,b)=>a.jour-b.jour).slice(0,8);
  },[]);

  return <div style={{padding:24}}>
    <h2 style={{fontSize:22,fontWeight:700,color:'#c6a34e',margin:'0 0 4px'}}>📅 Calendrier Social</h2>
    <p style={{fontSize:12,color:'#888',margin:'0 0 20px'}}>Toutes les échéances légales ONSS, fiscales, paie, RH — alertes automatiques</p>

    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:18}}>
      {[{l:'Échéances ce mois',v:echeancesMois.length,c:'#c6a34e'},{l:'Critiques',v:echeancesMois.filter(e=>e.gravite==='critical').length,c:'#ef4444'},{l:'Prochaine deadline',v:prochaines[0]?prochaines[0].jour+'/'+moisSel:'—',c:'#fb923c'},{l:'Total échéances/an',v:ECHEANCES_SOCIALES.length,c:'#3b82f6'}].map((k,i)=><div key={i} style={{padding:'12px 14px',background:'rgba(198,163,78,.04)',borderRadius:10,border:'1px solid rgba(198,163,78,.08)'}}><div style={{fontSize:9,color:'#5e5c56',textTransform:'uppercase'}}>{k.l}</div><div style={{fontSize:17,fontWeight:700,color:k.c,marginTop:4}}>{k.v}</div></div>)}
    </div>

    <div style={{display:'flex',gap:6,marginBottom:16}}>{[{v:'calendrier',l:'📅 Calendrier'},{v:'prochaines',l:'⏰ Prochaines ('+prochaines.length+')'},{v:'annuel',l:'📊 Vue annuelle'}].map(t=><button key={t.v} onClick={()=>setTab(t.v)} style={{padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:tab===t.v?600:400,fontFamily:'inherit',background:tab===t.v?'rgba(198,163,78,.15)':'rgba(255,255,255,.03)',color:tab===t.v?'#c6a34e':'#9e9b93'}}>{t.l}</button>)}</div>

    {/* Month selector */}
    <div style={{display:'flex',gap:3,marginBottom:16,flexWrap:'wrap'}}>
      {[1,2,3,4,5,6,7,8,9,10,11,12].map(m=><button key={m} onClick={()=>setMoisSel(m)} style={{padding:'5px 10px',borderRadius:6,border:'none',background:moisSel===m?'rgba(198,163,78,.15)':'rgba(255,255,255,.03)',color:moisSel===m?'#c6a34e':'#888',fontSize:10,cursor:'pointer',fontWeight:moisSel===m?700:400}}>{moisNoms[m].slice(0,3)}</button>)}
    </div>

    {tab==='calendrier'&&<div>
      {echeancesMois.length===0?<div style={{padding:20,textAlign:'center',color:'#888'}}>Aucune échéance en {moisNoms[moisSel]}</div>:
      echeancesMois.map((e,i)=>{const daysLeft=e.jour-now.getDate();const isPast=moisSel===now.getMonth()+1&&daysLeft<0;
      return <div key={i} style={{display:'flex',gap:14,padding:'12px 0',borderBottom:'1px solid rgba(255,255,255,.03)',opacity:isPast?0.4:1}}>
        <div style={{width:40,textAlign:'center'}}><div style={{fontSize:18,fontWeight:700,color:gravColors[e.gravite]}}>{e.jour}</div><div style={{fontSize:8,color:'#888'}}>{moisNoms[moisSel].slice(0,3)}</div></div>
        <div style={{flex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}><span style={{fontSize:12,fontWeight:600,color:'#e8e6e0'}}>{e.label}</span><Badge text={e.cat} color={catColors[e.cat]}/><Badge text={e.gravite} color={gravColors[e.gravite]}/></div>
          <div style={{fontSize:10.5,color:'#9e9b93',marginTop:3}}>{e.desc}</div>
          {!isPast&&moisSel===now.getMonth()+1&&daysLeft<=7&&daysLeft>=0&&<div style={{fontSize:10,color:'#f87171',marginTop:2}}>⚠ J-{daysLeft}</div>}
        </div>
      </div>})}
    </div>}

    {tab==='prochaines'&&<C title="⏰ Prochaines échéances">
      {prochaines.map((e,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,.03)'}}>
        <div><div style={{fontSize:12,fontWeight:500,color:'#e8e6e0'}}>{e.label}</div><div style={{fontSize:10,color:'#888'}}>{e.desc}</div></div>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <Badge text={e.cat} color={catColors[e.cat]}/>
          <span style={{fontSize:12,fontWeight:700,color:gravColors[e.gravite]}}>{e.jour}/{moisSel}</span>
        </div>
      </div>)}
    </C>}

    {tab==='annuel'&&<C title="Vue annuelle — Toutes les échéances">
      {[1,2,3,4,5,6,7,8,9,10,11,12].map(m=>{
        const ech=ECHEANCES_SOCIALES.filter(e=>{
          if(e.freq==='mensuel')return true;
          if(e.freq==='trim')return e.mois.includes(m);
          if(e.freq==='annuel')return e.mois===m;
          return false;
        });
        return <div key={m} style={{padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,.03)'}}>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <span style={{fontSize:12,fontWeight:600,color:m===now.getMonth()+1?'#c6a34e':'#e8e6e0'}}>{moisNoms[m]}</span>
            <div style={{display:'flex',gap:3}}>{ech.map((e,j)=><span key={j} style={{width:8,height:8,borderRadius:2,background:gravColors[e.gravite]}} title={e.label}/>)}</div>
          </div>
          <div style={{fontSize:9,color:'#888',marginTop:2}}>{ech.map(e=>e.label).join(' · ')}</div>
        </div>;
      })}
    </C>}
  </div>;
}

// ════════════════════════════════════════════════════════════
// 3. CONTRATS LÉGAUX V2 — Templates complets + clauses
// ════════════════════════════════════════════════════════════
export function ContratsLegauxV2({s}){
  const [tab,setTab]=useState('templates');
  const [expanded,setExpanded]=useState({});
  const templates=[
    {id:'cdi',nom:'CDI — Contrat à durée indéterminée',obligatoire:['Identité parties','Date de début','Fonction/description','Lieu de travail','Rémunération brute','Durée de travail hebdomadaire','CP applicable','Période d\'essai: SUPPRIMÉE depuis 01/01/2014'],optionnel:['Clause de non-concurrence (Art. 65)','Clause de confidentialité','Clause de propriété intellectuelle','Clause de mobilité','Clause de formation (remboursement)','Avantages extra-légaux (voiture, GSM, etc.)','Télétravail: modalités si applicable'],base:'Loi 03/07/1978 — contrat de travail',notes:'Pas de forme obligatoire (oral suffit) mais ÉCRIT fortement recommandé. Dimona IN obligatoire avant le début.'},
    {id:'cdd',nom:'CDD — Contrat à durée déterminée',obligatoire:['ÉCRIT OBLIGATOIRE avant le début','Identité parties','Date de début ET date de fin','Fonction + rémunération','Durée de travail','Motif du CDD (recommandé)'],optionnel:['Clause de renouvellement','Max 4 CDD successifs, durée totale max 2 ans (sauf exception Art. 10bis)','Si pas écrit → requalification en CDI'],base:'Loi 03/07/1978, Art. 9-10bis',notes:'4 CDD max successifs, max 3 ans si durée unique ≥ 3 mois. Si non respecté → CDI automatiquement.'},
    {id:'interim',nom:'Intérim — Travail temporaire',obligatoire:['Contrat de mission (agence ↔ travailleur)','Contrat commercial (agence ↔ utilisateur)','Motif: remplacement, surcroît, travail exceptionnel, insertion','Durée de mission','Rémunération = celle d\'un travailleur permanent comparable'],optionnel:['Clause de non-débauchage (agence ↔ utilisateur)','Indemnité d\'intérim (agence)'],base:'Loi 24/07/1987 sur le travail temporaire + CCT 36',notes:'L\'utilisateur ne peut pas employer directement un intérimaire pour le même poste > 2 ans.'},
    {id:'etudiant',nom:'Étudiant — Contrat occupation étudiant',obligatoire:['ÉCRIT OBLIGATOIRE avant le début','Identité + domicile étudiant','Identité employeur + BCE','Date début et fin','Horaires (temps de travail)','Rémunération','Lieu de travail','Fonction'],optionnel:['Attestation inscription établissement','Planning horaire détaillé','Clause de préavis: 3 jours (1er mois) puis 7 jours'],base:'Loi 03/07/1978, Titre VII (Art. 120-130)',notes:'Contingent 2026: 600 heures/an à cotisations réduites (2.71% travailleur + 5.42% employeur). Au-delà: ONSS normal. Dimona STU obligatoire.'},
    {id:'stage',nom:'Convention de stage — Immersion professionnelle',obligatoire:['Convention tripartite: stagiaire + employeur + institution','Durée + horaires','Objectifs de formation','Tuteur désigné','Couverture accident de travail'],optionnel:['Indemnité de stage (non obligatoire si stage curriculaire)','Évaluation mi-parcours','Confidentialité'],base:'Loi 10/04/1971 + conventions régionales',notes:'Stage curriculaire (école): pas de contrat de travail, pas d\'ONSS. Stage non-curriculaire: vérifier le statut.'},
    {id:'teletravail',nom:'Avenant télétravail',obligatoire:['Lieu(x) de télétravail','Fréquence (jours/semaine)','Plages horaires de joignabilité','Équipement fourni par l\'employeur','Indemnité de bureau (max 157.83 EUR/mois)','Assurance couverture domicile'],optionnel:['Internet (20 EUR/mois)','Matériel (écran, chaise: forfait ou réel)','Droit à la déconnexion (Loi 03/10/2022, ≥20 trav.)','Retour au bureau: conditions'],base:'CCT 85 (structurel) + Loi 03/10/2022 (≥20 trav.)',notes:'Le télétravail n\'est pas un droit. Il nécessite l\'accord des deux parties. L\'employeur peut le révoquer moyennant préavis raisonnable.'},
  ];

  return <div style={{padding:24}}>
    <h2 style={{fontSize:22,fontWeight:700,color:'#c6a34e',margin:'0 0 4px'}}>📄 Contrats Légaux</h2>
    <p style={{fontSize:12,color:'#888',margin:'0 0 20px'}}>Templates CDI, CDD, intérim, étudiant, stage, télétravail — Clauses obligatoires + optionnelles</p>

    <div style={{display:'flex',gap:6,marginBottom:16}}>{[{v:'templates',l:'📋 Templates ('+templates.length+')'},{v:'clauses',l:'📎 Clauses spécifiques'},{v:'checklist',l:'✅ Checklist embauche'}].map(t=><button key={t.v} onClick={()=>setTab(t.v)} style={{padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:tab===t.v?600:400,fontFamily:'inherit',background:tab===t.v?'rgba(198,163,78,.15)':'rgba(255,255,255,.03)',color:tab===t.v?'#c6a34e':'#9e9b93'}}>{t.l}</button>)}</div>

    {tab==='templates'&&<div>
      {templates.map((t,i)=>{const isExp=expanded[t.id];return <div key={t.id} style={{marginBottom:8}}>
        <div onClick={()=>setExpanded(prev=>({...prev,[t.id]:!prev[t.id]}))} style={{padding:'14px 16px',background:'rgba(198,163,78,.03)',borderRadius:isExp?'10px 10px 0 0':'10px',border:'1px solid rgba(198,163,78,.08)',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{fontSize:13,fontWeight:600,color:'#e8e6e0'}}>{t.nom}</div>
          <span style={{fontSize:10,color:isExp?'#c6a34e':'#555',transform:isExp?'rotate(180deg)':'',transition:'transform .2s',display:'inline-block'}}>▼</span>
        </div>
        {isExp&&<div style={{padding:16,background:'rgba(198,163,78,.02)',border:'1px solid rgba(198,163,78,.08)',borderTop:'none',borderRadius:'0 0 10px 10px'}}>
          <div style={{marginBottom:12}}><div style={{fontSize:9,fontWeight:700,color:'#22c55e',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Clauses obligatoires</div>{t.obligatoire.map((c,j)=><div key={j} style={{fontSize:10.5,color:'#ccc',padding:'2px 0',paddingLeft:10,borderLeft:'2px solid rgba(34,197,94,.3)'}}>✓ {c}</div>)}</div>
          {t.optionnel&&<div style={{marginBottom:12}}><div style={{fontSize:9,fontWeight:700,color:'#3b82f6',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Clauses optionnelles</div>{t.optionnel.map((c,j)=><div key={j} style={{fontSize:10.5,color:'#ccc',padding:'2px 0',paddingLeft:10,borderLeft:'2px solid rgba(59,130,246,.2)'}}>○ {c}</div>)}</div>}
          <div style={{display:'flex',gap:20}}>
            <div><div style={{fontSize:9,fontWeight:700,color:'#a855f7',textTransform:'uppercase',letterSpacing:1,marginBottom:3}}>Base légale</div><div style={{fontSize:10,color:'#ccc'}}>{t.base}</div></div>
          </div>
          {t.notes&&<div style={{marginTop:10,padding:8,background:'rgba(198,163,78,.06)',borderRadius:6,fontSize:10,color:'#888'}}>{t.notes}</div>}
        </div>}
      </div>})}
    </div>}

    {tab==='clauses'&&<div>
      {[
        {nom:'Clause de non-concurrence',desc:'Interdit au travailleur d\'exercer une activité concurrente après le départ. Salaire annuel > 41.969 EUR. Durée max 12 mois. Indemnité min 50% × salaire × durée.',base:'Art. 65-67 Loi 03/07/1978'},
        {nom:'Clause d\'écolage',desc:'Le travailleur rembourse une partie des coûts de formation si départ anticipé. Formation > 80h et coût > 2× RMMMG mensuel. Max 30% la 1ère année, 20% la 2ème, 10% la 3ème.',base:'Art. 22bis Loi 03/07/1978'},
        {nom:'Clause de confidentialité',desc:'Obligation de secret sur les informations obtenues pendant le contrat. Valable pendant ET après le contrat (sans limite de durée sauf convention).',base:'Art. 17 §3 Loi 03/07/1978'},
        {nom:'Clause de propriété intellectuelle',desc:'Les créations du travailleur dans le cadre de sa fonction appartiennent à l\'employeur. Doit être explicite pour les droits d\'auteur (Loi 30/06/1994).',base:'Art. XI.289 CDE + Loi 30/06/1994'},
        {nom:'Clause de mobilité',desc:'Le lieu de travail peut changer. Doit être raisonnable (distance, fréquence). Ne peut pas constituer une modification unilatérale substantielle.',base:'Jurisprudence Cass.'},
        {nom:'Clause de dédit-formation',desc:'Identique à écolage. Le travailleur rembourse les coûts de formation spécifique si départ dans les 3 ans.',base:'Art. 22bis Loi 03/07/1978 (statut unique)'},
      ].map((r,i)=><C key={i} title={r.nom}>
        <div style={{fontSize:11,color:'#e8e6e0',marginBottom:6}}>{r.desc}</div>
        <div style={{fontSize:10,color:'#888'}}>{r.base}</div>
      </C>)}
    </div>}

    {tab==='checklist'&&<C title="✅ Checklist embauche — 15 étapes">
      {[
        {n:1,t:'Dimona IN',d:'AVANT le début du travail. Via portail socialsecurity.be ou secrétariat social.',cat:'Obligatoire'},
        {n:2,t:'Contrat de travail signé',d:'CDI oral possible mais écrit recommandé. CDD/étudiant: écrit OBLIGATOIRE.',cat:'Obligatoire'},
        {n:3,t:'Copie carte identité/NISS',d:'Numéro national + identité pour la déclaration ONSS.',cat:'Obligatoire'},
        {n:4,t:'Fiche signalétique (données bancaires)',d:'IBAN pour virement salaire. Formulaire données personnelles.',cat:'Obligatoire'},
        {n:5,t:'Affiliation secrétariat social',d:'Enregistrer le travailleur dans le système de paie.',cat:'Obligatoire'},
        {n:6,t:'Visite médicale préalable',d:'Si poste de sécurité ou surveillance de santé. Avant le début ou dans les 14 jours.',cat:'Si applicable'},
        {n:7,t:'Règlement de travail',d:'Remettre un exemplaire signé au travailleur.',cat:'Obligatoire'},
        {n:8,t:'Registre du personnel',d:'Inscription dans le registre (électronique ou papier).',cat:'Obligatoire'},
        {n:9,t:'Assurance accidents de travail',d:'Vérifier la couverture de la police existante.',cat:'Obligatoire'},
        {n:10,t:'Document RGPD',d:'Information sur le traitement des données personnelles.',cat:'Obligatoire'},
        {n:11,t:'Car policy / télétravail',d:'Si véhicule ou télétravail: signer les documents.',cat:'Si applicable'},
        {n:12,t:'Caisse d\'allocations familiales',d:'Informer le travailleur de l\'organisme compétent.',cat:'Information'},
        {n:13,t:'Fonds sectoriel',d:'Inscription au fonds de sécurité d\'existence si applicable (CP 124, 302, etc.).',cat:'Si applicable'},
        {n:14,t:'Badge / accès',d:'Préparer le badge d\'accès, email, outils informatiques.',cat:'Pratique'},
        {n:15,t:'Accueil et intégration',d:'Programme d\'accueil, présentation équipe, formation sécurité.',cat:'Recommandé'},
      ].map((r,i)=><div key={i} style={{display:'flex',gap:12,padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,.03)'}}>
        <div style={{width:26,height:26,borderRadius:'50%',background:'rgba(198,163,78,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#c6a34e',flexShrink:0}}>{r.n}</div>
        <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:'#e8e6e0'}}>{r.t}</div><div style={{fontSize:10.5,color:'#9e9b93',marginTop:1}}>{r.d}</div></div>
        <Badge text={r.cat} color={r.cat==='Obligatoire'?'#ef4444':r.cat==='Si applicable'?'#eab308':'#22c55e'}/>
      </div>)}
    </C>}
  </div>;
}

// ════════════════════════════════════════════════════════════
// 4. BILAN SOCIAL V2 — Calcul automatique indicateurs BNB
// ════════════════════════════════════════════════════════════
export function BilanSocialV2({s}){
  const emps=(s.clients||[]).flatMap(c=>c.emps||[]);
  const n=emps.length;const [tab,setTab]=useState('indicateurs');
  const totalBrut=emps.reduce((a,e)=>a+(+(e.monthlySalary||e.gross||0)),0);
  const hommes=emps.filter(e=>(e.genre||e.gender||'').toLowerCase()==='m').length;
  const femmes=n-hommes;
  const tp=emps.filter(e=>+(e.regime||e.workingHours||100)>=100).length;
  const partiel=n-tp;
  const cdi=emps.filter(e=>!(e.contractType||'').toLowerCase().includes('cdd')).length;
  const cdd=n-cdi;
  const etp=emps.reduce((a,e)=>a+(+(e.regime||100))/100,0);

  return <div style={{padding:24}}>
    <h2 style={{fontSize:22,fontWeight:700,color:'#c6a34e',margin:'0 0 4px'}}>📊 Bilan Social BNB</h2>
    <p style={{fontSize:12,color:'#888',margin:'0 0 20px'}}>Calcul automatique des indicateurs obligatoires — Dépôt BNB (≥20 ETP)</p>

    <div style={{display:'flex',gap:6,marginBottom:16}}>{[{v:'indicateurs',l:'📊 Indicateurs'},{v:'rubriques',l:'📋 Rubriques BNB'},{v:'obligations',l:'⚖ Obligations'}].map(t=><button key={t.v} onClick={()=>setTab(t.v)} style={{padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:tab===t.v?600:400,fontFamily:'inherit',background:tab===t.v?'rgba(198,163,78,.15)':'rgba(255,255,255,.03)',color:tab===t.v?'#c6a34e':'#9e9b93'}}>{t.l}</button>)}</div>

    {tab==='indicateurs'&&<div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:18}}>
        {[{l:'Effectif total',v:n,c:'#c6a34e'},{l:'ETP',v:etp.toFixed(1),c:'#3b82f6'},{l:'Masse salariale/an',v:fmt(totalBrut*12)+' €',c:'#f87171'},{l:'Obligatoire',v:etp>=20?'OUI':'NON',c:etp>=20?'#ef4444':'#22c55e'}].map((k,i)=><div key={i} style={{padding:'12px 14px',background:'rgba(198,163,78,.04)',borderRadius:10,border:'1px solid rgba(198,163,78,.08)'}}><div style={{fontSize:9,color:'#5e5c56',textTransform:'uppercase'}}>{k.l}</div><div style={{fontSize:17,fontWeight:700,color:k.c,marginTop:4}}>{k.v}</div></div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16}}>
        <C title="Répartition par genre">
          <Row l="Hommes" v={hommes+' ('+((n>0?hommes/n*100:0).toFixed(0))+'%)'} c="#3b82f6"/>
          <Row l="Femmes" v={femmes+' ('+((n>0?femmes/n*100:0).toFixed(0))+'%)'} c="#a855f7"/>
        </C>
        <C title="Répartition par contrat">
          <Row l="CDI" v={cdi} c="#22c55e"/>
          <Row l="CDD" v={cdd} c="#fb923c"/>
          <Row l="Temps plein" v={tp} c="#3b82f6"/>
          <Row l="Temps partiel" v={partiel} c="#a855f7"/>
        </C>
        <C title="Frais de personnel (estimation annuelle)">
          <Row l="Rémunérations brutes" v={fmt(totalBrut*12)+' €'}/>
          <Row l="ONSS patronal (25.07%)" v={fmt(totalBrut*12*0.2507)+' €'} c="#f87171"/>
          <Row l="Provisions vacances (15.38%)" v={fmt(totalBrut*12*0.1538)+' €'}/>
          <Row l="Provisions 13ème (8.33%)" v={fmt(totalBrut*12*0.0833)+' €'}/>
          <Row l="Autres frais personnel" v={fmt(n*1800)+' €'} sub/>
          <Row l="TOTAL frais personnel" v={fmt(totalBrut*12*1.49+n*1800)+' €'} c="#c6a34e" b/>
        </C>
        <C title="Formation">
          <Row l="Droit formation (2024+)" v="5 jours/an/ETP temps plein" c="#22c55e"/>
          <Row l="Budget formation estimé" v={fmt(totalBrut*12*0.02)+' € (2% masse salariale)'}/>
          <Row l="Heures formation estimées" v={fi(etp*5*7.6)+' heures/an'}/>
          <Row l="Plan de formation" v={etp>=20?'OBLIGATOIRE':'Recommandé'} c={etp>=20?'#ef4444':'#888'}/>
        </C>
      </div>
    </div>}

    {tab==='rubriques'&&<C title="Rubriques du bilan social BNB">
      {[
        {r:'I',t:'État des personnes occupées',d:'Effectif moyen, ETP, heures prestées, frais de personnel, avantages extra-légaux.'},
        {r:'II',t:'Tableau des mouvements du personnel',d:'Entrées et sorties pendant l\'exercice. Motifs de sortie (démission, licenciement, fin CDD, pension).'},
        {r:'III',t:'État de l\'utilisation des mesures d\'emploi',d:'Réductions ONSS, Maribel, premiers engagements, groupes-cibles, stages.'},
        {r:'IV',t:'Formation professionnelle',d:'Heures de formation, coûts, participation, formation formelle et informelle.'},
        {r:'V',t:'Égalité de traitement H/F',d:'Répartition H/F par niveau, par contrat, par rémunération. Plan d\'action diversité si applicable.'},
      ].map((r,i)=><div key={i} style={{padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.03)'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}><span style={{width:24,height:24,borderRadius:'50%',background:'rgba(198,163,78,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'#c6a34e'}}>{r.r}</span><span style={{fontSize:12,fontWeight:600,color:'#e8e6e0'}}>{r.t}</span></div>
        <div style={{fontSize:10.5,color:'#9e9b93',marginTop:3,paddingLeft:32}}>{r.d}</div>
      </div>)}
    </C>}

    {tab==='obligations'&&<C title="Obligations légales">
      {[
        {t:'Seuil',d:'Bilan social obligatoire si ≥ 20 ETP (moyenne annuelle).'},
        {t:'Dépôt',d:'À déposer à la BNB avec les comptes annuels (dans les 7 mois après la clôture).'},
        {t:'Format',d:'Formulaire normalisé BNB (schéma complet ou abrégé selon la taille).'},
        {t:'Sanction',d:'Pas de sanction directe mais: refus de dépôt des comptes annuels si bilan social incomplet.'},
        {t:'Formation',d:'Depuis 2024: obligation de 5 jours de formation/an/ETP temps plein (Loi formation 2022).'},
        {t:'Diversité',d:'Plan diversité recommandé. Obligatoire dans certains secteurs publics et entreprises > 250 travailleurs.'},
      ].map((r,i)=><div key={i} style={{padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.03)'}}>
        <b style={{color:'#c6a34e',fontSize:12}}>{r.t}</b>
        <div style={{fontSize:10.5,color:'#9e9b93',marginTop:2}}>{r.d}</div>
      </div>)}
    </C>}
  </div>;
}
