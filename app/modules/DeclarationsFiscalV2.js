'use client';
import{useState,useMemo}from'react';
import{TX_ONSS_W,TX_ONSS_E}from'../lib/lois-belges';

const fmt=v=>new Intl.NumberFormat('fr-BE',{minimumFractionDigits:2,maximumFractionDigits:2}).format(v||0);
const fi=v=>new Intl.NumberFormat('fr-BE',{maximumFractionDigits:0}).format(v||0);
const C=({children,title:t,sub,color})=><div style={{background:'rgba(198,163,78,.03)',borderRadius:12,padding:16,border:'1px solid '+(color||'rgba(198,163,78,.08)'),marginBottom:14}}>{t&&<div style={{fontSize:13,fontWeight:600,color:color||'#c6a34e',marginBottom:sub?2:10}}>{t}</div>}{sub&&<div style={{fontSize:10,color:'#888',marginBottom:10}}>{sub}</div>}{children}</div>;
const Row=({l,v,c,b,sub})=><div style={{display:'flex',justifyContent:'space-between',padding:b?'8px 0':'5px 0',borderBottom:b?'2px solid rgba(198,163,78,.2)':'1px solid rgba(255,255,255,.03)',fontWeight:b?700:400}}><span style={{color:sub?'#888':'#e8e6e0',fontSize:sub?10:11.5,fontStyle:sub?'italic':'normal'}}>{l}</span><span style={{color:c||'#c6a34e',fontWeight:600,fontSize:12}}>{v}</span></div>;
const I=({label,type,value,onChange,style:st,options})=><div style={st}><div style={{fontSize:10,color:'#5e5c56',marginBottom:3}}>{label}</div>{options?<select value={value} onChange={e=>onChange(e.target.value)} style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid rgba(198,163,78,.15)',background:'rgba(198,163,78,.04)',color:'#e8e6e0',fontSize:12,fontFamily:'inherit'}}>{options.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}</select>:<input type={type||'text'} value={value} onChange={e=>onChange(type==='number'?+e.target.value:e.target.value)} style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid rgba(198,163,78,.15)',background:'rgba(198,163,78,.04)',color:'#e8e6e0',fontSize:12,fontFamily:'inherit',boxSizing:'border-box'}}/>}</div>;
const Badge=({text,color})=><span style={{padding:'2px 7px',borderRadius:5,fontSize:8,fontWeight:600,background:(color||'#888')+'15',color:color||'#888'}}>{text}</span>;

// ════════════════════════════════════════════════════════════
// 1. CHARGES ONSS V2 — Réductions groupes-cibles complètes
// ════════════════════════════════════════════════════════════
const REDUCTIONS_GC=[
  {id:'premiers_eng',nom:'Premiers engagements',cible:'1er-6ème travailleur',reduction:'1er: exonération totale ONSS patronal à vie\n2ème: -1.550 EUR/trim (5 trim) puis -1.050 (8 trim)\n3ème: -1.050 EUR/trim (9 trim) puis -450 (4 trim)\n4ème-6ème: -1.050 EUR/trim (9 trim) puis -450 (4 trim)',conditions:['Jamais eu ce nombre de travailleurs avant','Pas de lien avec ancien employeur','Unité technique d\'exploitation autonome'],base_legale:'AR 16/05/2003 — Premiers engagements',region:'Fédéral',montant_max:'Exo totale (1er) / 1.550€/trim (2ème)',cumulable:true},
  {id:'jeunes_25',nom:'Jeunes travailleurs < 26 ans',cible:'Travailleurs < 26 ans, peu qualifiés',reduction:'Forfait: -1.500 EUR/trim (salaire < plafond)',conditions:['< 26 ans au moment de l\'engagement','Max CESS (pas de diplôme supérieur)','Inscrit comme demandeur d\'emploi','Salaire trimestriel < 9.000 EUR'],base_legale:'AR 19/12/2001 — Groupes-cibles jeunes',region:'Régional (Flandre/Wallonie/Bruxelles)',montant_max:'1.500 EUR/trim',cumulable:true},
  {id:'ages_55',nom:'Travailleurs âgés ≥ 55 ans',cible:'Travailleurs ≥ 55 ans en service',reduction:'55-57 ans: -400 EUR/trim\n58-61 ans: -1.000 EUR/trim\n62-64 ans: -1.500 EUR/trim\n65+: -1.500 EUR/trim',conditions:['Salaire trimestriel < 16.000 EUR (plafond 2026)','En service au trimestre de la réduction','Pas de condition d\'ancienneté minimale'],base_legale:'AR 16/05/2003 + régionalisation',region:'Régional',montant_max:'1.500 EUR/trim',cumulable:true},
  {id:'restructuration',nom:'Restructuration / Activa',cible:'Demandeurs d\'emploi de longue durée',reduction:'Forfait: -1.000 à -1.500 EUR/trim selon durée chômage',conditions:['Inscrit comme demandeur d\'emploi','Durée inoccupation: min 12 mois (ou 6 mois si < 25 ans)','Carte Activa délivrée par ONEM/Forem/Actiris/VDAB','Engagement en CDI ou CDD ≥ 6 mois'],base_legale:'AR 19/12/2001 + régionalisation 2014',region:'Régional',montant_max:'1.500 EUR/trim',cumulable:true},
  {id:'maribel',nom:'Réduction structurelle Maribel',cible:'Secteur non-marchand (santé, social)',reduction:'Forfait: ~480 EUR/trimestre par travailleur',conditions:['Secteur non-marchand (CP 330, 319, 327, etc.)','Min 5 travailleurs','Affectation obligatoire: création d\'emplois supplémentaires'],base_legale:'AR 18/07/2002 Maribel social',region:'Fédéral',montant_max:'~480 EUR/trim',cumulable:true},
  {id:'structurelle',nom:'Réduction structurelle générale',cible:'Tous les travailleurs (bas/moyens salaires)',reduction:'Forfait de base: 0 EUR si salaire > plafond haut\nBas salaires (< 9.588 EUR/trim): réduction augmentée\nHauts salaires (> 16.000 EUR/trim): pas de réduction',conditions:['Automatique pour tous les travailleurs','Calculée par l\'ONSS via DmfA','Pas de démarche employeur'],base_legale:'AR 16/05/2003 Art. 2',region:'Fédéral',montant_max:'Variable (formule complexe)',cumulable:true},
  {id:'art60',nom:'Article 60 §7 CPAS',cible:'Bénéficiaires aide sociale mis au travail',reduction:'Exonération totale ONSS patronal',conditions:['Contrat via CPAS','Mise au travail pour obtenir droit chômage','Durée: selon situation individuelle'],base_legale:'Loi organique CPAS 08/07/1976, Art. 60 §7',region:'Fédéral',montant_max:'Exonération totale',cumulable:false},
  {id:'collectif_reduction',nom:'Réduction collective temps de travail',cible:'Entreprises passant à -38h/sem ou semaine 4 jours',reduction:'Forfait: 400-1.000 EUR/trim par travailleur',conditions:['Réduction effective du temps de travail','Semaine 4 jours: -400 EUR/trim','Combinaison semaine 4 jours + réduction: -1.000 EUR/trim','CCT ou modification règlement de travail'],base_legale:'AR 16/05/2003 Art. 9-13',region:'Fédéral',montant_max:'1.000 EUR/trim',cumulable:true},
  {id:'tuteur',nom:'Tuteurs apprentis',cible:'Tuteurs encadrant des apprentis/stagiaires',reduction:'Forfait: 800 EUR/trim par tuteur',conditions:['Le tuteur encadre effectivement un apprenti','Formation de tuteur suivie','Max 4 apprentis par tuteur','Contrat d\'apprentissage valide'],base_legale:'AR 16/05/2003 + Loi alternance 2015',region:'Fédéral',montant_max:'800 EUR/trim',cumulable:true},
];

export function ChargesONSSV2({s}){
  const emps=(s.clients||[]).flatMap(c=>c.emps||[]);
  const [tab,setTab]=useState('reductions');
  const [selRed,setSelRed]=useState(null);
  const [expanded,setExpanded]=useState({});
  const totalBrut=emps.reduce((a,e)=>a+(+(e.monthlySalary||e.gross||0)),0)*3;
  const totalOnssE=totalBrut*TX_ONSS_E;
  const totalOnssW=totalBrut*TX_ONSS_W;
  const n=emps.length;

  // Estimation réductions applicables
  const estimations=useMemo(()=>{
    let premierEng=0;if(n<=6)premierEng=n>=1?(totalOnssE/n)*0.8:0;// Simplifié
    let ages=emps.filter(e=>{const bd=e.birthDate||e.birth;if(!bd)return false;const age=(new Date()-new Date(bd))/(365.25*24*3600*1000);return age>=55;}).length;
    let jeunes=emps.filter(e=>{const bd=e.birthDate||e.birth;if(!bd)return false;const age=(new Date()-new Date(bd))/(365.25*24*3600*1000);return age<26;}).length;
    return {premierEng:n<=1?totalOnssE:0,ages55:ages*1000,jeunes26:jeunes*1500,maribel:n>=5?n*480:0,structurelle:Math.round(totalBrut*0.02)};
  },[emps,totalOnssE,totalBrut,n]);
  const totalRed=Object.values(estimations).reduce((a,v)=>a+v,0);

  return <div style={{padding:24}}>
    <h2 style={{fontSize:22,fontWeight:700,color:'#c6a34e',margin:'0 0 4px'}}>🏛 Charges ONSS — Réductions groupes-cibles</h2>
    <p style={{fontSize:12,color:'#888',margin:'0 0 20px'}}>Toutes les réductions ONSS patronales disponibles en Belgique (2026)</p>

    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:18}}>
      {[{l:'ONSS patronal brut',v:fmt(totalOnssE)+' €/trim',c:'#f87171'},{l:'Réductions estimées',v:'-'+fmt(totalRed)+' €/trim',c:'#22c55e'},{l:'ONSS net estimé',v:fmt(Math.max(0,totalOnssE-totalRed))+' €/trim',c:'#c6a34e'},{l:'Économie',v:totalOnssE>0?(totalRed/totalOnssE*100).toFixed(0)+'%':'0%',c:'#4ade80'},{l:'Travailleurs',v:n,c:'#3b82f6'}].map((k,i)=><div key={i} style={{padding:'12px 14px',background:'rgba(198,163,78,.04)',borderRadius:10,border:'1px solid rgba(198,163,78,.08)'}}><div style={{fontSize:9,color:'#5e5c56',textTransform:'uppercase',letterSpacing:'.5px'}}>{k.l}</div><div style={{fontSize:17,fontWeight:700,color:k.c,marginTop:4}}>{k.v}</div></div>)}
    </div>

    <div style={{display:'flex',gap:6,marginBottom:16}}>{[{v:'reductions',l:'📋 Réductions ('+REDUCTIONS_GC.length+')'},{v:'estimation',l:'🧮 Estimation'},{v:'dmfa',l:'🏛 DmfA'},{v:'legal',l:'📜 Base légale'}].map(t=><button key={t.v} onClick={()=>setTab(t.v)} style={{padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:tab===t.v?600:400,fontFamily:'inherit',background:tab===t.v?'rgba(198,163,78,.15)':'rgba(255,255,255,.03)',color:tab===t.v?'#c6a34e':'#9e9b93'}}>{t.l}</button>)}</div>

    {tab==='reductions'&&<div>
      {REDUCTIONS_GC.map((r,i)=>{const isExp=expanded[r.id];return <div key={r.id} style={{marginBottom:8}}>
        <div onClick={()=>setExpanded(prev=>({...prev,[r.id]:!prev[r.id]}))} style={{padding:'12px 16px',background:'rgba(198,163,78,.03)',borderRadius:isExp?'10px 10px 0 0':'10px',border:'1px solid rgba(198,163,78,.08)',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div><div style={{fontSize:12,fontWeight:600,color:'#e8e6e0'}}>{r.nom}</div><div style={{fontSize:10,color:'#888',marginTop:2}}>{r.cible}</div></div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <Badge text={r.region} color={r.region==='Fédéral'?'#3b82f6':'#a855f7'}/>
            <Badge text={r.montant_max} color="#22c55e"/>
            <span style={{fontSize:10,color:isExp?'#c6a34e':'#555',transform:isExp?'rotate(180deg)':'',transition:'transform .2s',display:'inline-block'}}>▼</span>
          </div>
        </div>
        {isExp&&<div style={{padding:16,background:'rgba(198,163,78,.02)',border:'1px solid rgba(198,163,78,.08)',borderTop:'none',borderRadius:'0 0 10px 10px'}}>
          <div style={{marginBottom:12}}><div style={{fontSize:9,fontWeight:700,color:'#c6a34e',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Réduction</div><div style={{fontSize:11,color:'#e8e6e0',whiteSpace:'pre-line'}}>{r.reduction}</div></div>
          <div style={{marginBottom:12}}><div style={{fontSize:9,fontWeight:700,color:'#3b82f6',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Conditions</div>{r.conditions.map((c,j)=><div key={j} style={{fontSize:10.5,color:'#ccc',padding:'2px 0',paddingLeft:10,borderLeft:'2px solid rgba(59,130,246,.2)'}}>• {c}</div>)}</div>
          <div style={{display:'flex',gap:20}}>
            <div><div style={{fontSize:9,fontWeight:700,color:'#a855f7',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Base légale</div><div style={{fontSize:10,color:'#ccc'}}>{r.base_legale}</div></div>
            <div><div style={{fontSize:9,fontWeight:700,color:'#22c55e',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Cumulable</div><div style={{fontSize:10,color:r.cumulable?'#22c55e':'#f87171'}}>{r.cumulable?'OUI — cumulable avec autres réductions':'NON — non cumulable'}</div></div>
          </div>
        </div>}
      </div>})}
    </div>}

    {tab==='estimation'&&<div>
      <C title="Estimation des réductions applicables à votre effectif">
        {n<=1&&<div style={{padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.03)'}}>
          <Row l="🎉 Premier engagement (exo totale)" v={'-'+fmt(estimations.premierEng)+' €/trim'} c="#22c55e"/>
          <div style={{fontSize:10,color:'#888',marginTop:2}}>Votre 1er travailleur: exonération ONSS patronal à vie</div>
        </div>}
        <Row l="Réduction structurelle (bas salaires)" v={'-'+fmt(estimations.structurelle)+' €/trim'} c="#22c55e"/>
        <Row l="Travailleurs ≥ 55 ans" v={'-'+fmt(estimations.ages55)+' €/trim'} c="#22c55e"/>
        <Row l="Jeunes < 26 ans" v={'-'+fmt(estimations.jeunes26)+' €/trim'} c="#22c55e"/>
        {n>=5&&<Row l="Maribel social" v={'-'+fmt(estimations.maribel)+' €/trim'} c="#22c55e"/>}
        <Row l="TOTAL RÉDUCTIONS ESTIMÉES" v={'-'+fmt(totalRed)+' €/trim'} c="#4ade80" b/>
        <Row l="Économie annuelle estimée" v={'-'+fmt(totalRed*4)+' €/an'} c="#4ade80"/>
        <div style={{marginTop:10,fontSize:10,color:'#888'}}>⚠ Estimation indicative. Les réductions exactes sont calculées par l'ONSS via la DmfA trimestrielle. Consultez votre secrétariat social pour le calcul officiel.</div>
      </C>
    </div>}

    {tab==='dmfa'&&<C title="🏛 Déclaration DmfA — Structure">
      <div style={{fontSize:11,color:'#e8e6e0',marginBottom:12}}>La DmfA (Déclaration Multifonctionnelle) est la déclaration trimestrielle à l'ONSS. Elle contient:</div>
      {[
        {n:'1',t:'Identification employeur',d:'BCE, ONSS, CP, catégorie employeur, nombre de travailleurs'},
        {n:'2',t:'Ligne travailleur',d:'NISS, catégorie ONSS (code 015/495/etc.), rémunérations par catégorie'},
        {n:'3',t:'Rémunérations',d:'Zone 001: salaire normal, Zone 002: pécule vacances, Zone 003: 13ème mois, Zone 010: primes'},
        {n:'4',t:'Cotisations',d:'Base × taux (25.07% global). Détail: 16.27% pension + 2.35% chômage + 3.80% maladie + 0.15% modération + 2.50% autres'},
        {n:'5',t:'Réductions',d:'Code réduction + montant. Structurelle (1000), groupes-cibles (3000-3999), Maribel (6000)'},
        {n:'6',t:'Prestations',d:'Jours prestés, heures, jours maladie, vacances, formation, petit chômage'},
        {n:'7',t:'Cotisations spéciales',d:'Cotisation CO2, cotisation pension extra-légale 8.86%, cotisation Fonds de fermeture'},
      ].map((r,i)=><div key={i} style={{display:'flex',gap:12,padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.03)'}}>
        <div style={{width:28,height:28,borderRadius:'50%',background:'rgba(198,163,78,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#c6a34e',flexShrink:0}}>{r.n}</div>
        <div><div style={{fontSize:12,fontWeight:600,color:'#e8e6e0'}}>{r.t}</div><div style={{fontSize:10.5,color:'#9e9b93',marginTop:2}}>{r.d}</div></div>
      </div>)}
      <div style={{marginTop:12,padding:10,background:'rgba(59,130,246,.06)',borderRadius:8,fontSize:10,color:'#60a5fa'}}>Délai: DmfA à déposer avant le 10ème jour du mois suivant le trimestre. T1 (jan-mar) → 10 avril. T2 (avr-jun) → 10 juillet.</div>
    </C>}

    {tab==='legal'&&<C title="Base légale — Réductions ONSS">
      {[
        {t:'Loi programme 24/12/2002',d:'Base légale des réductions de cotisations ONSS patronales.'},
        {t:'AR 16/05/2003',d:'Arrêté royal d\'exécution: modalités réduction structurelle + groupes-cibles.'},
        {t:'6ème Réforme de l\'État (2014)',d:'Régionalisation des groupes-cibles: jeunes, âgés, longue durée → compétence Régions.'},
        {t:'Décret flamand 04/03/2016',d:'Groupes-cibles en Flandre: Jeunes (<25), Âgés (≥55), Personnes handicapées.'},
        {t:'Décret wallon 02/02/2017',d:'Groupes-cibles en Wallonie: Impulsion -25, Impulsion 12+, Tremplin 24+, Sesam.'},
        {t:'Ordonnance bruxelloise 23/06/2017',d:'Groupes-cibles à Bruxelles: Activa.brussels, formation alternance, ACS/APE.'},
        {t:'DmfA — Instruction ONSS',d:'Instructions techniques pour la déclaration: www.socialsecurity.be/employer/instructions'},
      ].map((r,i)=><div key={i} style={{padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.03)'}}>
        <b style={{color:'#c6a34e',fontSize:12}}>{r.t}</b>
        <div style={{fontSize:10.5,color:'#9e9b93',marginTop:2}}>{r.d}</div>
      </div>)}
    </C>}
  </div>;
}

// ════════════════════════════════════════════════════════════
// 2. CHÔMAGE TEMPORAIRE V2 — Calcul allocation + C3.2
// ════════════════════════════════════════════════════════════
export function ChomageTemporaireV2({s}){
  const [salaire,setSalaire]=useState(3000);
  const [jours,setJours]=useState(10);
  const [motif,setMotif]=useState('eco');
  const [tab,setTab]=useState('simu');
  const brut=+salaire||0;const j=+jours||0;
  const salJour=brut/26;
  const alloc65=salJour*0.65;const alloc70=salJour*0.70;
  const plafond=3295.79;
  const allocPlafonnee=Math.min(motif==='force'?alloc70:alloc65,plafond/26*(motif==='force'?0.70:0.65));
  const totalAlloc=allocPlafonnee*j;
  const ppChom=totalAlloc*0.2672;
  const netTrav=totalAlloc-ppChom;

  const motifs=[
    {id:'eco',nom:'Économique — Ouvriers',taux:65,desc:'Manque de travail pour raisons économiques',duree:'Max 4 sem consécutives (ouvriers) / 16 sem/an (employés)',procedure:'C3.2A à l\'ONEM + notification travailleur (7j avant)',base:'Art. 51 Loi 03/07/1978 + AR 25/11/1991'},
    {id:'eco_emp',nom:'Économique — Employés',taux:65,desc:'Suspension temporaire pour raisons économiques (entreprise en difficulté)',duree:'Max 16 semaines/an calendrier',procedure:'Conditions strictes: chiffre d\'affaires -10%, chômage temporaire 10%+ effectif, commandes -10%, ou force majeure reconnue',base:'Loi 12/04/2011 + AR 06/06/2013'},
    {id:'force',nom:'Force majeure',taux:70,desc:'Événement imprévisible et irrésistible (incendie, inondation, pandémie)',duree:'Durée de la force majeure',procedure:'Demande motivée à l\'ONEM + preuve de la force majeure',base:'Art. 26 Loi 03/07/1978'},
    {id:'intemperies',nom:'Intempéries (construction)',taux:65,desc:'Gel, neige, pluie intense empêchant le travail — CP 124',duree:'Durée de l\'intempérie',procedure:'Chef de chantier note l\'arrêt + déclaration dans 48h',base:'Art. 50 Loi 03/07/1978 + CCT CP 124'},
    {id:'technique',nom:'Accident technique',taux:65,desc:'Panne machine rendant le travail impossible',duree:'Max 7 jours (prolongeable avec accord ONEM)',procedure:'Notification immédiate à l\'ONEM + CPPT',base:'Art. 49 Loi 03/07/1978'},
    {id:'medical',nom:'Force majeure médicale',taux:65,desc:'Incapacité de travail suivie de rupture pour force majeure médicale',duree:'Selon trajet de réintégration',procedure:'Art. 34 Loi 03/07/1978 + trajet de réintégration Livre I Titre 4 Code BET',base:'Art. 34 Loi 03/07/1978'},
  ];
  const selMotif=motifs.find(m=>m.id===motif)||motifs[0];

  return <div style={{padding:24}}>
    <h2 style={{fontSize:22,fontWeight:700,color:'#c6a34e',margin:'0 0 4px'}}>⏸ Chômage Temporaire</h2>
    <p style={{fontSize:12,color:'#888',margin:'0 0 20px'}}>Calcul allocation ONEM + formulaire C3.2 + procédure par motif</p>

    <div style={{display:'flex',gap:6,marginBottom:16}}>{[{v:'simu',l:'🧮 Simulateur'},{v:'motifs',l:'📋 Motifs ('+motifs.length+')'},{v:'c32',l:'📄 Formulaire C3.2'},{v:'procedure',l:'📌 Procédure'},{v:'legal',l:'📜 Base légale'}].map(t=><button key={t.v} onClick={()=>setTab(t.v)} style={{padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:tab===t.v?600:400,fontFamily:'inherit',background:tab===t.v?'rgba(198,163,78,.15)':'rgba(255,255,255,.03)',color:tab===t.v?'#c6a34e':'#9e9b93'}}>{t.l}</button>)}</div>

    {tab==='simu'&&<div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:16}}>
      <C title="Paramètres">
        <I label="Salaire brut mensuel (EUR)" type="number" value={salaire} onChange={setSalaire}/>
        <div style={{marginTop:8}}><I label="Jours de chômage temporaire" type="number" value={jours} onChange={setJours}/></div>
        <div style={{marginTop:8}}><I label="Motif" value={motif} onChange={setMotif} options={motifs.map(m=>({v:m.id,l:m.nom}))}/></div>
        <div style={{marginTop:10,padding:8,background:'rgba(198,163,78,.06)',borderRadius:6,fontSize:10,color:'#888'}}>{selMotif.desc}</div>
      </C>
      <div>
        <C title="Calcul allocation ONEM">
          <Row l="Salaire brut mensuel" v={fmt(brut)+' €'}/>
          <Row l="Salaire journalier (/ 26 jours)" v={fmt(salJour)+' €/jour'}/>
          <Row l={'Taux allocation ('+selMotif.taux+'%)'} v={selMotif.taux+'%'} c={selMotif.taux>=70?'#22c55e':'#fb923c'}/>
          <Row l="Plafond salarial ONEM 2026" v={fmt(plafond)+' €/mois'}/>
          <Row l="Allocation journalière" v={fmt(allocPlafonnee)+' €/jour'} b/>
          <Row l={'Total allocation ('+j+' jours)'} v={fmt(totalAlloc)+' €'} c="#c6a34e" b/>
          <Row l="PP (26.72%)" v={'-'+fmt(ppChom)+' €'} c="#f87171"/>
          <Row l="NET travailleur" v={fmt(netTrav)+' €'} c="#4ade80" b/>
        </C>
        <C title="Impact financier employeur">
          <Row l="Salaire économisé (jours CT)" v={fmt(salJour*j)+' € brut'}/>
          <Row l="ONSS économisé" v={fmt(salJour*j*TX_ONSS_E)+' €'}/>
          <Row l="Coût employeur par jour CT" v="0.00 € (à charge ONEM)" c="#22c55e"/>
          <Row l="Pécule vacances: impacté" v="OUI — jours CT réduisent le pécule" c="#fb923c"/>
          <div style={{marginTop:8,fontSize:10,color:'#888'}}>Le chômage temporaire n'interrompt pas le contrat de travail. L'ancienneté continue à courir.</div>
        </C>
        <C title="Comparaison travailleur" color="#3b82f6">
          <Row l="Salaire normal (si travaillé)" v={fmt(salJour*j)+' brut → ~'+fmt(salJour*j*(1-TX_ONSS_W)*0.65)+' net'}/>
          <Row l="Allocation CT" v={fmt(totalAlloc)+' brut → '+fmt(netTrav)+' net'} c="#fb923c"/>
          <Row l="Perte nette travailleur" v={'-'+fmt(salJour*j*(1-TX_ONSS_W)*0.65-netTrav)+' €'} c="#f87171" b/>
        </C>
      </div>
    </div>}

    {tab==='motifs'&&<div>
      {motifs.map((m,i)=><C key={m.id} title={m.nom} color={m.taux>=70?'#22c55e':'#c6a34e'}>
        <Row l="Description" v={m.desc}/>
        <Row l="Taux allocation" v={m.taux+'%'} c={m.taux>=70?'#22c55e':'#fb923c'}/>
        <Row l="Durée maximale" v={m.duree}/>
        <Row l="Procédure" v={m.procedure}/>
        <div style={{marginTop:6,fontSize:10,color:'#888'}}>{m.base}</div>
      </C>)}
    </div>}

    {tab==='c32'&&<C title="📄 Formulaire C3.2A — Chômage temporaire">
      <div style={{background:'rgba(198,163,78,.06)',borderRadius:8,padding:14,fontSize:11,lineHeight:1.8,color:'#ccc',fontFamily:'monospace',whiteSpace:'pre-wrap'}}>
{`FORMULAIRE C3.2A — CHÔMAGE TEMPORAIRE
════════════════════════════════════════
EMPLOYEUR
Raison sociale: [                          ]
BCE:            [BE 0___.___.___           ]
CP:             [____                      ]
ONSS:           [___-_______-__            ]

TRAVAILLEUR
Nom:            [                          ]
NISS:           [__.__.__.___-__           ]

MOTIF: ${selMotif.nom}
PÉRIODE: du [__/__/____] au [__/__/____]
JOURS: ${j} jours ouvrables

DÉCLARATION:
□ Communication à l'ONEM effectuée
□ Notification aux travailleurs effectuée
□ Affichage dans les locaux

Date: [__/__/____]
Signature employeur: ________________`}
      </div>
      <div style={{marginTop:10,fontSize:10,color:'#888'}}>Ce formulaire doit être transmis à l'ONEM par voie électronique (portail socialsecurity.be) ou via votre secrétariat social.</div>
    </C>}

    {tab==='procedure'&&<C title="Procédure chômage temporaire — 6 étapes">
      {[
        {n:1,t:'Constater le motif',d:'Identifier le motif: économique, force majeure, intempéries, accident technique. Documenter la situation.'},
        {n:2,t:'Notifier l\'ONEM',d:'Communication électronique à l\'ONEM (portail socialsecurity.be). Formulaire C3.2A. Délai: 7 jours calendrier AVANT le début (économique) ou DÈS QUE POSSIBLE (force majeure).'},
        {n:3,t:'Informer les travailleurs',d:'Notification individuelle par affichage, courrier ou email. Contenu: motif, dates, jours concernés.'},
        {n:4,t:'Période de chômage',d:'Le travailleur ne preste pas. Le contrat est suspendu (pas rompu). L\'employeur ne paie pas de salaire pour les jours CT.'},
        {n:5,t:'Formulaire C3.2',d:'Le travailleur remet le formulaire C3.2 à son organisme de paiement (syndicat ou CAPAC) pour obtenir ses allocations.'},
        {n:6,t:'Reprise du travail',d:'Le travailleur reprend le travail à la date prévue. L\'employeur communique la fin du CT à l\'ONEM si anticipée.'},
      ].map((r,i)=><div key={i} style={{display:'flex',gap:12,padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.03)'}}>
        <div style={{width:28,height:28,borderRadius:'50%',background:'rgba(198,163,78,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#c6a34e',flexShrink:0}}>{r.n}</div>
        <div><div style={{fontSize:12,fontWeight:600,color:'#e8e6e0'}}>{r.t}</div><div style={{fontSize:10.5,color:'#9e9b93',marginTop:2}}>{r.d}</div></div>
      </div>)}
    </C>}

    {tab==='legal'&&<C title="Base légale">
      {[
        {t:'Loi 03/07/1978 — Contrat de travail',d:'Art. 49-51: suspension du contrat pour raisons économiques, intempéries, accident technique.'},
        {t:'AR 25/11/1991',d:'Réglementation chômage. Conditions d\'octroi des allocations de chômage temporaire.'},
        {t:'Loi 12/04/2011',d:'Extension du chômage temporaire économique aux employés (Art. 77/1-77/7 Loi 03/07/1978).'},
        {t:'AR 06/06/2013',d:'Conditions entreprise en difficulté pour CT employés: -10% CA, -10% commandes, ou 10% CT effectif.'},
        {t:'Plafond 2026',d:fmt(plafond)+' EUR/mois. Allocation = taux × salaire journalier plafonné.'},
        {t:'PP sur allocation',d:'26.72% (PP chômage). Pas de cotisations ONSS sur l\'allocation.'},
      ].map((r,i)=><div key={i} style={{padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.03)'}}>
        <b style={{color:'#c6a34e',fontSize:12}}>{r.t}</b>
        <div style={{fontSize:10.5,color:'#9e9b93',marginTop:2}}>{r.d}</div>
      </div>)}
    </C>}
  </div>;
}

// ════════════════════════════════════════════════════════════
// 3. EXPORT COMPTABLE V2 — Multi-format (Exact, BOB, Winbooks)
// ════════════════════════════════════════════════════════════
export function ExportComptaProV2({s}){
  const emps=(s.clients||[]).flatMap(c=>c.emps||[]);
  const [format,setFormat]=useState('bob50');
  const [periode,setPeriode]=useState('01/2026');
  const [tab,setTab]=useState('ecritures');
  const totalBrut=emps.reduce((a,e)=>a+(+(e.monthlySalary||e.gross||0)),0);
  const onssW=totalBrut*TX_ONSS_W;const onssE=totalBrut*TX_ONSS_E;
  const ppEst=totalBrut*0.30;const net=totalBrut-onssW-ppEst;

  const formats=[
    {id:'bob50',nom:'BOB 50/Sage BOB',ext:'.csv',encoding:'ANSI',separator:';',
      comptes:{brut:'620000',onssE:'621000',onssW:'454000',pp:'453000',net:'455000',provision:'460000'},
      note:'Format BOB 50: fichier CSV point-virgule, comptes PCMN belge'},
    {id:'winbooks',nom:'Winbooks',ext:'.txt',encoding:'ANSI',separator:'\t',
      comptes:{brut:'620000',onssE:'621000',onssW:'454100',pp:'453100',net:'455100',provision:'460100'},
      note:'Format Winbooks Classic/Virtual Invoice: tab-separated'},
    {id:'exact',nom:'Exact Online',ext:'.csv',encoding:'UTF-8',separator:',',
      comptes:{brut:'620000',onssE:'621000',onssW:'454200',pp:'453200',net:'455200',provision:'460200'},
      note:'Format Exact Online: CSV UTF-8, import via module comptabilité'},
    {id:'horus',nom:'Horus / PopCompta',ext:'.csv',encoding:'ANSI',separator:';',
      comptes:{brut:'620000',onssE:'621000',onssW:'454300',pp:'453300',net:'455300',provision:'460300'},
      note:'Format Horus/PopCompta: CSV point-virgule'},
    {id:'octopus',nom:'Octopus',ext:'.csv',encoding:'UTF-8',separator:';',
      comptes:{brut:'620000',onssE:'621000',onssW:'454400',pp:'453400',net:'455400',provision:'460400'},
      note:'Format Octopus Online: CSV UTF-8 point-virgule'},
  ];
  const selFormat=formats.find(f=>f.id===format)||formats[0];

  const ecritures=[
    {compte:selFormat.comptes.brut,lib:'Rémunérations brutes',debit:totalBrut,credit:0,nature:'Charge'},
    {compte:selFormat.comptes.onssE,lib:'ONSS patronal (25.07%)',debit:onssE,credit:0,nature:'Charge'},
    {compte:selFormat.comptes.onssW,lib:'ONSS travailleur (13.07%)',debit:0,credit:onssW,nature:'Passif'},
    {compte:selFormat.comptes.pp,lib:'Précompte professionnel',debit:0,credit:ppEst,nature:'Passif'},
    {compte:selFormat.comptes.net,lib:'Salaires nets à payer',debit:0,credit:net,nature:'Passif'},
    {compte:selFormat.comptes.provision,lib:'Provisions vacances/13ème',debit:totalBrut*0.1923,credit:0,nature:'Charge'},
    {compte:'460010',lib:'Prov. vacances à payer',debit:0,credit:totalBrut*0.1923,nature:'Passif'},
  ];
  const totalD=ecritures.reduce((a,e)=>a+e.debit,0);
  const totalC=ecritures.reduce((a,e)=>a+e.credit,0);

  return <div style={{padding:24}}>
    <h2 style={{fontSize:22,fontWeight:700,color:'#c6a34e',margin:'0 0 4px'}}>📊 Export Comptable Pro</h2>
    <p style={{fontSize:12,color:'#888',margin:'0 0 20px'}}>Multi-format: BOB 50, Winbooks, Exact Online, Horus, Octopus — PCMN belge</p>

    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:18}}>
      {[{l:'Total charges',v:fmt(totalBrut+onssE+totalBrut*0.1923)+' €',c:'#f87171'},{l:'Total passif',v:fmt(onssW+ppEst+net+totalBrut*0.1923)+' €',c:'#3b82f6'},{l:'Équilibre D/C',v:Math.abs(totalD-totalC)<0.01?'✓ OK':'✗ ERREUR',c:Math.abs(totalD-totalC)<0.01?'#22c55e':'#f87171'},{l:'Format',v:selFormat.nom,c:'#c6a34e'}].map((k,i)=><div key={i} style={{padding:'12px 14px',background:'rgba(198,163,78,.04)',borderRadius:10,border:'1px solid rgba(198,163,78,.08)'}}><div style={{fontSize:9,color:'#5e5c56',textTransform:'uppercase'}}>{k.l}</div><div style={{fontSize:15,fontWeight:700,color:k.c,marginTop:4}}>{k.v}</div></div>)}
    </div>

    <div style={{display:'flex',gap:6,marginBottom:16}}>{[{v:'ecritures',l:'📋 Écritures'},{v:'format',l:'💾 Formats ('+formats.length+')'},{v:'pcmn',l:'📖 PCMN'},{v:'export',l:'⬇ Aperçu export'}].map(t=><button key={t.v} onClick={()=>setTab(t.v)} style={{padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:tab===t.v?600:400,fontFamily:'inherit',background:tab===t.v?'rgba(198,163,78,.15)':'rgba(255,255,255,.03)',color:tab===t.v?'#c6a34e':'#9e9b93'}}>{t.l}</button>)}</div>

    <div style={{marginBottom:16,display:'flex',gap:10,alignItems:'flex-end'}}>
      <I label="Format comptable" value={format} onChange={setFormat} options={formats.map(f=>({v:f.id,l:f.nom}))} style={{width:200}}/>
      <I label="Période" value={periode} onChange={setPeriode} style={{width:120}}/>
    </div>

    {tab==='ecritures'&&<C title={'Écritures comptables — '+periode}>
      <div style={{display:'grid',gridTemplateColumns:'80px 1fr 100px 100px 80px',gap:4,padding:'6px 0',borderBottom:'2px solid rgba(198,163,78,.15)',fontSize:9,fontWeight:700,color:'#c6a34e'}}>
        <div>Compte</div><div>Libellé</div><div style={{textAlign:'right'}}>Débit</div><div style={{textAlign:'right'}}>Crédit</div><div>Nature</div>
      </div>
      {ecritures.map((e,i)=><div key={i} style={{display:'grid',gridTemplateColumns:'80px 1fr 100px 100px 80px',gap:4,padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,.03)',fontSize:11}}>
        <div style={{fontFamily:'monospace',color:'#c6a34e'}}>{e.compte}</div>
        <div style={{color:'#e8e6e0'}}>{e.lib}</div>
        <div style={{textAlign:'right',fontFamily:'monospace',color:e.debit>0?'#f87171':'#555'}}>{e.debit>0?fmt(e.debit):''}</div>
        <div style={{textAlign:'right',fontFamily:'monospace',color:e.credit>0?'#22c55e':'#555'}}>{e.credit>0?fmt(e.credit):''}</div>
        <Badge text={e.nature} color={e.nature==='Charge'?'#f87171':'#3b82f6'}/>
      </div>)}
      <div style={{display:'grid',gridTemplateColumns:'80px 1fr 100px 100px 80px',gap:4,padding:'8px 0',borderTop:'2px solid rgba(198,163,78,.2)',fontSize:12,fontWeight:700}}>
        <div></div><div style={{color:'#c6a34e'}}>TOTAUX</div>
        <div style={{textAlign:'right',color:'#f87171'}}>{fmt(totalD)}</div>
        <div style={{textAlign:'right',color:'#22c55e'}}>{fmt(totalC)}</div>
        <Badge text={Math.abs(totalD-totalC)<0.01?"ÉQUILIBRÉ":"ERREUR"} color={Math.abs(totalD-totalC)<0.01?"#22c55e":"#f87171"}/>
      </div>
    </C>}

    {tab==='format'&&<div>
      {formats.map(f=><C key={f.id} title={f.nom} color={format===f.id?'#c6a34e':'#888'}>
        <Row l="Extension" v={f.ext}/>
        <Row l="Encodage" v={f.encoding}/>
        <Row l="Séparateur" v={f.separator===';'?'Point-virgule (;)':f.separator==='\t'?'Tabulation':'Virgule (,)'}/>
        <div style={{marginTop:6,fontSize:10,color:'#888'}}>{f.note}</div>
      </C>)}
    </div>}

    {tab==='pcmn'&&<C title="Plan Comptable Minimum Normalisé (PCMN) — Comptes salariaux">
      {[
        {c:'620000',d:'Rémunérations et avantages sociaux directs',nature:'6 — Charges'},
        {c:'621000',d:'Cotisations patronales ONSS',nature:'6 — Charges'},
        {c:'622000',d:'Primes patronales assurances extralégales',nature:'6 — Charges'},
        {c:'623000',d:'Autres frais de personnel',nature:'6 — Charges'},
        {c:'453000',d:'Précomptes retenus (PP)',nature:'4 — Passif'},
        {c:'454000',d:'ONSS à payer (part travailleur + employeur)',nature:'4 — Passif'},
        {c:'455000',d:'Rémunérations à payer (salaires nets)',nature:'4 — Passif'},
        {c:'456000',d:'Pécules de vacances à payer',nature:'4 — Passif'},
        {c:'460000',d:'Provisions pour pécules et 13ème mois',nature:'4 — Passif'},
      ].map((r,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,.03)'}}>
        <div style={{display:'flex',gap:12}}><span style={{fontFamily:'monospace',color:'#c6a34e',fontWeight:600}}>{r.c}</span><span style={{fontSize:11,color:'#e8e6e0'}}>{r.d}</span></div>
        <Badge text={r.nature} color={r.nature.startsWith('6')?'#f87171':'#3b82f6'}/>
      </div>)}
    </C>}

    {tab==='export'&&<C title={'Aperçu export — '+selFormat.nom+' ('+selFormat.ext+')'}>
      <div style={{background:'#0d1117',borderRadius:8,padding:14,fontSize:10,lineHeight:1.6,color:'#ccc',fontFamily:'monospace',whiteSpace:'pre-wrap',overflowX:'auto'}}>
{ecritures.map(e=>[selFormat.comptes.brut?periode:'',e.compte,e.lib,e.debit>0?e.debit.toFixed(2):'',e.credit>0?e.credit.toFixed(2):'','EUR'].join(selFormat.separator)).join('\n')}
      </div>
      <div style={{marginTop:10,fontSize:10,color:'#888'}}>Encodage: {selFormat.encoding} | Séparateur: {selFormat.separator===';'?'point-virgule':selFormat.separator==='\t'?'tabulation':'virgule'} | Extension: {selFormat.ext}</div>
    </C>}
  </div>;
}

// ════════════════════════════════════════════════════════════
// 4. BUDGET PRÉVISIONNEL V2 — Moteur avec hypothèses
// ════════════════════════════════════════════════════════════
export function BudgetPrevisionnelV2({s}){
  const emps=(s.clients||[]).flatMap(c=>c.emps||[]);
  const [indexation,setIndexation]=useState(2.0);
  const [embauches,setEmbauches]=useState(0);
  const [salMoyenNew,setSalMoyenNew]=useState(3000);
  const [departs,setDeparts]=useState(0);
  const [augMerite,setAugMerite]=useState(1.5);
  const [tab,setTab]=useState('prevision');
  const n=emps.length;
  const masseBrut=emps.reduce((a,e)=>a+(+(e.monthlySalary||e.gross||0)),0);

  const prevision=useMemo(()=>{
    const mois=[];let effectif=n;let masse=masseBrut;
    for(let m=1;m<=12;m++){
      // Embauches réparties sur l'année
      if(+embauches>0&&m<=+embauches)effectif++;
      if(+departs>0&&m<=+departs){effectif=Math.max(0,effectif-1);masse=effectif>0?masse*(effectif/(effectif+1)):0;}
      // Indexation en janvier
      if(m===1)masse=masse*(1+(+indexation||0)/100);
      // Augmentation mérite en juillet
      if(m===7)masse=masse*(1+(+augMerite||0)/100);
      // Nouvelles embauches
      const masseNew=(+embauches>0&&m<=+embauches)?(+salMoyenNew||3000):0;
      const masseTotal=masse+masseNew;
      const onssE=masseTotal*TX_ONSS_E;
      const provVac=masseTotal*0.0769;const prov13=masseTotal/12;
      const cheqRepas=effectif*6.91*20;
      const assurances=effectif*100;
      const formation=masseTotal*0.02;
      const total=masseTotal+onssE+provVac+prov13+cheqRepas+assurances+formation;
      mois.push({m,effectif,brut:masseTotal,onssE,provVac,prov13,cheqRepas,assurances,formation,total});
      masse=masseTotal-masseNew;// Remove one-time new
    }
    return mois;
  },[n,masseBrut,indexation,embauches,salMoyenNew,departs,augMerite]);

  const totalAn=prevision.reduce((a,m)=>a+m.total,0);
  const totalBrutAn=prevision.reduce((a,m)=>a+m.brut,0);

  const moisNoms=['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

  return <div style={{padding:24}}>
    <h2 style={{fontSize:22,fontWeight:700,color:'#c6a34e',margin:'0 0 4px'}}>📊 Budget Prévisionnel RH</h2>
    <p style={{fontSize:12,color:'#888',margin:'0 0 20px'}}>Projection 12 mois avec hypothèses d'indexation, embauches, départs et mérite</p>

    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:18}}>
      {[{l:'Effectif actuel',v:n,c:'#3b82f6'},{l:'Masse salariale/mois',v:fmt(masseBrut)+' €',c:'#c6a34e'},{l:'Budget annuel estimé',v:fmt(totalAn)+' €',c:'#f87171'},{l:'Coût moyen/ETP',v:n>0?fmt(totalAn/n/12)+' €/mois':'N/A',c:'#a855f7'},{l:'Index '+indexation+'% + Mérite '+augMerite+'%',v:'+'+(+indexation+(+augMerite)).toFixed(1)+'%',c:'#22c55e'}].map((k,i)=><div key={i} style={{padding:'12px 14px',background:'rgba(198,163,78,.04)',borderRadius:10,border:'1px solid rgba(198,163,78,.08)'}}><div style={{fontSize:9,color:'#5e5c56',textTransform:'uppercase'}}>{k.l}</div><div style={{fontSize:15,fontWeight:700,color:k.c,marginTop:4}}>{k.v}</div></div>)}
    </div>

    <div style={{display:'flex',gap:6,marginBottom:16}}>{[{v:'prevision',l:'📊 Prévision 12 mois'},{v:'hypotheses',l:'⚙ Hypothèses'},{v:'detail',l:'📋 Détail mensuel'},{v:'kpi',l:'📈 KPIs'}].map(t=><button key={t.v} onClick={()=>setTab(t.v)} style={{padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:tab===t.v?600:400,fontFamily:'inherit',background:tab===t.v?'rgba(198,163,78,.15)':'rgba(255,255,255,.03)',color:tab===t.v?'#c6a34e':'#9e9b93'}}>{t.l}</button>)}</div>

    {tab==='hypotheses'&&<div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16}}>
      <C title="Hypothèses salariales">
        <I label="Indexation annuelle (%)" type="number" value={indexation} onChange={setIndexation}/>
        <div style={{marginTop:8}}><I label="Augmentation mérite (%)" type="number" value={augMerite} onChange={setAugMerite}/></div>
        <div style={{marginTop:6,fontSize:10,color:'#888'}}>Indexation appliquée en janvier. Mérite en juillet.</div>
      </C>
      <C title="Hypothèses effectif">
        <I label="Embauches prévues" type="number" value={embauches} onChange={setEmbauches}/>
        <div style={{marginTop:8}}><I label="Salaire moyen nouvelles recrues" type="number" value={salMoyenNew} onChange={setSalMoyenNew}/></div>
        <div style={{marginTop:8}}><I label="Départs prévus" type="number" value={departs} onChange={setDeparts}/></div>
      </C>
    </div>}

    {tab==='prevision'&&<div>
      {/* Bar chart */}
      <C title="Coût total mensuel — Projection 2026">
        <div style={{display:'flex',gap:4,alignItems:'flex-end',height:180,marginBottom:10}}>
          {prevision.map((m,i)=>{const maxV=Math.max(...prevision.map(p=>p.total));const h=maxV>0?m.total/maxV*160:0;
          return <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center'}}>
            <div style={{fontSize:8,color:'#888',marginBottom:2}}>{fmt(m.total)}</div>
            <div style={{width:'100%',height:h,background:'linear-gradient(180deg,#c6a34e,rgba(198,163,78,.3))',borderRadius:'4px 4px 0 0',minHeight:2}}/>
            <div style={{fontSize:9,color:'#888',marginTop:4}}>{moisNoms[i]}</div>
          </div>})}
        </div>
      </C>
      <C title="Répartition annuelle des coûts">
        {[
          {l:'Salaires bruts',v:fmt(totalBrutAn),pct:totalAn>0?(totalBrutAn/totalAn*100).toFixed(0):0,c:'#c6a34e'},
          {l:'ONSS patronal',v:fmt(prevision.reduce((a,m)=>a+m.onssE,0)),pct:totalAn>0?(prevision.reduce((a,m)=>a+m.onssE,0)/totalAn*100).toFixed(0):0,c:'#f87171'},
          {l:'Provisions vacances',v:fmt(prevision.reduce((a,m)=>a+m.provVac,0)),pct:totalAn>0?(prevision.reduce((a,m)=>a+m.provVac,0)/totalAn*100).toFixed(0):0,c:'#fb923c'},
          {l:'Provisions 13ème mois',v:fmt(prevision.reduce((a,m)=>a+m.prov13,0)),pct:totalAn>0?(prevision.reduce((a,m)=>a+m.prov13,0)/totalAn*100).toFixed(0):0,c:'#eab308'},
          {l:'Chèques-repas',v:fmt(prevision.reduce((a,m)=>a+m.cheqRepas,0)),pct:totalAn>0?(prevision.reduce((a,m)=>a+m.cheqRepas,0)/totalAn*100).toFixed(0):0,c:'#22c55e'},
          {l:'Assurances + Formation',v:fmt(prevision.reduce((a,m)=>a+m.assurances+m.formation,0)),pct:totalAn>0?(prevision.reduce((a,m)=>a+m.assurances+m.formation,0)/totalAn*100).toFixed(0):0,c:'#3b82f6'},
        ].map((r,i)=><div key={i} style={{padding:'6px 0'}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11}}><span style={{color:'#e8e6e0'}}>{r.l}</span><span style={{color:r.c,fontWeight:600}}>{r.v} € ({r.pct}%)</span></div>
          <div style={{width:'100%',height:6,background:'rgba(255,255,255,.05)',borderRadius:3,marginTop:3}}><div style={{width:r.pct+'%',height:'100%',background:r.c,borderRadius:3}}/></div>
        </div>)}
        <Row l="BUDGET TOTAL ANNUEL" v={fmt(totalAn)+' €'} c="#c6a34e" b/>
      </C>
    </div>}

    {tab==='detail'&&<C title="Détail mensuel">
      <div style={{overflowX:'auto'}}>
        <div style={{display:'grid',gridTemplateColumns:'60px repeat(7,1fr)',gap:2,padding:'6px 0',borderBottom:'2px solid rgba(198,163,78,.15)',fontSize:8,fontWeight:700,color:'#c6a34e',minWidth:800}}>
          <div>Mois</div><div>Effectif</div><div>Brut</div><div>ONSS E</div><div>Prov. vac</div><div>Prov. 13e</div><div>Avantages</div><div style={{fontWeight:700}}>TOTAL</div>
        </div>
        {prevision.map((m,i)=><div key={i} style={{display:'grid',gridTemplateColumns:'60px repeat(7,1fr)',gap:2,padding:'4px 0',borderBottom:'1px solid rgba(255,255,255,.03)',fontSize:10,minWidth:800}}>
          <div style={{fontWeight:600,color:'#c6a34e'}}>{moisNoms[i]}</div>
          <div>{m.effectif}</div>
          <div style={{fontFamily:'monospace'}}>{fi(m.brut)}</div>
          <div style={{fontFamily:'monospace',color:'#f87171'}}>{fi(m.onssE)}</div>
          <div style={{fontFamily:'monospace'}}>{fi(m.provVac)}</div>
          <div style={{fontFamily:'monospace'}}>{fi(m.prov13)}</div>
          <div style={{fontFamily:'monospace'}}>{fi(m.cheqRepas+m.assurances+m.formation)}</div>
          <div style={{fontFamily:'monospace',fontWeight:700,color:'#c6a34e'}}>{fi(m.total)}</div>
        </div>)}
      </div>
    </C>}

    {tab==='kpi'&&<C title="KPIs RH prévisionnels">
      {[
        {l:'Coût moyen par ETP/mois',v:n>0?fmt(totalAn/n/12)+' €':'N/A',c:'#c6a34e'},
        {l:'Coût moyen par ETP/an',v:n>0?fmt(totalAn/n)+' €':'N/A',c:'#c6a34e'},
        {l:'Ratio ONSS/masse salariale',v:(TX_ONSS_E*100).toFixed(2)+'%',c:'#f87171'},
        {l:'Ratio provisions/masse',v:totalBrutAn>0?((prevision.reduce((a,m)=>a+m.provVac+m.prov13,0))/totalBrutAn*100).toFixed(1)+'%':'0%',c:'#fb923c'},
        {l:'Ratio avantages/coût total',v:totalAn>0?(prevision.reduce((a,m)=>a+m.cheqRepas+m.assurances+m.formation,0)/totalAn*100).toFixed(1)+'%':'0%',c:'#22c55e'},
        {l:'Impact indexation annuel',v:'+'+fmt(masseBrut*12*(+indexation/100))+' €',c:'#a855f7'},
        {l:'Impact embauches annuel',v:'+'+fmt((+embauches||0)*(+salMoyenNew||3000)*12*(1+TX_ONSS_E))+' €',c:'#3b82f6'},
      ].map((r,i)=><Row key={i} l={r.l} v={r.v} c={r.c}/>)}
    </C>}
  </div>;
}
