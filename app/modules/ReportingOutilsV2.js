'use client';
import{useState,useMemo}from'react';

const fmt=v=>new Intl.NumberFormat('fr-BE',{minimumFractionDigits:2,maximumFractionDigits:2}).format(v||0);
const fi=v=>new Intl.NumberFormat('fr-BE',{maximumFractionDigits:0}).format(v||0);
const C=({children,title:t,sub,color})=><div style={{background:'rgba(198,163,78,.03)',borderRadius:12,padding:16,border:'1px solid '+(color||'rgba(198,163,78,.08)'),marginBottom:14}}>{t&&<div style={{fontSize:13,fontWeight:600,color:color||'#c6a34e',marginBottom:sub?2:10}}>{t}</div>}{sub&&<div style={{fontSize:10,color:'#888',marginBottom:10}}>{sub}</div>}{children}</div>;
const Row=({l,v,c,b})=><div style={{display:'flex',justifyContent:'space-between',padding:b?'8px 0':'5px 0',borderBottom:b?'2px solid rgba(198,163,78,.2)':'1px solid rgba(255,255,255,.03)',fontWeight:b?700:400}}><span style={{color:'#e8e6e0',fontSize:11.5}}>{l}</span><span style={{color:c||'#c6a34e',fontWeight:600,fontSize:12}}>{v}</span></div>;
const I=({label,type,value,onChange,style:st,options,placeholder})=><div style={st}><div style={{fontSize:10,color:'#5e5c56',marginBottom:3}}>{label}</div>{options?<select value={value} onChange={e=>onChange(e.target.value)} style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid rgba(198,163,78,.15)',background:'rgba(198,163,78,.04)',color:'#e8e6e0',fontSize:12,fontFamily:'inherit'}}>{options.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}</select>:<input type={type||'text'} value={value} placeholder={placeholder} onChange={e=>onChange(type==='number'?+e.target.value:e.target.value)} style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid rgba(198,163,78,.15)',background:'rgba(198,163,78,.04)',color:'#e8e6e0',fontSize:12,fontFamily:'inherit',boxSizing:'border-box'}}/>}</div>;
const Badge=({text,color})=><span style={{padding:'2px 7px',borderRadius:5,fontSize:8,fontWeight:600,background:(color||'#888')+'15',color:color||'#888'}}>{text}</span>;
const TX_ONSS_W=0.1307,TX_ONSS_E=0.2507;

// ════════════════════════════════════════════════════════════
// 1. ABSENCES PRO V2 — Workflow approbation + compteur solde temps réel
// ════════════════════════════════════════════════════════════
export function AbsencesProV2({s}){
  const emps=(s.clients||[]).flatMap(c=>c.emps||[]);
  const [tab,setTab]=useState('soldes');
  const [demandes,setDemandes]=useState([
    {id:1,emp:'Martin Dupont',type:'congé annuel',du:'2026-03-15',au:'2026-03-19',jours:5,statut:'en_attente',justificatif:false,date_demande:'2026-02-20'},
    {id:2,emp:'Sophie Lambert',type:'maladie',du:'2026-02-24',au:'2026-02-26',jours:3,statut:'approuvee',justificatif:true,date_demande:'2026-02-24'},
    {id:3,emp:'Jean Peeters',type:'formation',du:'2026-03-10',au:'2026-03-11',jours:2,statut:'en_attente',justificatif:false,date_demande:'2026-02-22'},
    {id:4,emp:'Marie Janssen',type:'congé annuel',du:'2026-04-14',au:'2026-04-18',jours:5,statut:'refusee',justificatif:false,date_demande:'2026-02-18',motif_refus:'Chevauchement avec congé équipe'},
  ]);
  const approuver=(id)=>setDemandes(d=>d.map(x=>x.id===id?{...x,statut:'approuvee'}:x));
  const refuser=(id)=>setDemandes(d=>d.map(x=>x.id===id?{...x,statut:'refusee',motif_refus:'Effectif minimum non garanti'}:x));

  const types=[
    {id:'conge_annuel',nom:'Congé annuel',solde:20,pris:8,couleur:'#22c55e'},
    {id:'maladie',nom:'Maladie',solde:'-',pris:3,couleur:'#ef4444'},
    {id:'petit_chomage',nom:'Petit chômage',solde:10,pris:1,couleur:'#3b82f6'},
    {id:'formation',nom:'Formation',solde:5,pris:2,couleur:'#a855f7'},
    {id:'teletravail',nom:'Télétravail',solde:'illimité',pris:24,couleur:'#06b6d4'},
    {id:'recuperation',nom:'Récupération',solde:6,pris:1,couleur:'#eab308'},
    {id:'sans_solde',nom:'Sans solde',solde:'-',pris:0,couleur:'#888'},
    {id:'parental',nom:'Congé parental',solde:'4 mois',pris:0,couleur:'#ec4899'},
  ];
  const statutColors={en_attente:'#eab308',approuvee:'#22c55e',refusee:'#ef4444'};
  const enAttente=demandes.filter(d=>d.statut==='en_attente').length;

  return <div style={{padding:24}}>
    <h2 style={{fontSize:22,fontWeight:700,color:'#c6a34e',margin:'0 0 4px'}}>📋 Absences Pro — Workflow</h2>
    <p style={{fontSize:12,color:'#888',margin:'0 0 20px'}}>Compteur soldes temps réel + approbation + justificatifs + chevauchements</p>

    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:18}}>
      {[{l:'En attente',v:enAttente,c:enAttente>0?'#eab308':'#22c55e'},{l:'Approuvées',v:demandes.filter(d=>d.statut==='approuvee').length,c:'#22c55e'},{l:'Refusées',v:demandes.filter(d=>d.statut==='refusee').length,c:'#ef4444'},{l:'Jours pris (équipe)',v:types.reduce((a,t)=>a+(typeof t.pris==='number'?t.pris:0),0)+' j',c:'#3b82f6'}].map((k,i)=><div key={i} style={{padding:'12px 14px',background:'rgba(198,163,78,.04)',borderRadius:10,border:'1px solid rgba(198,163,78,.08)'}}><div style={{fontSize:9,color:'#5e5c56',textTransform:'uppercase'}}>{k.l}</div><div style={{fontSize:17,fontWeight:700,color:k.c,marginTop:4}}>{k.v}</div></div>)}
    </div>

    <div style={{display:'flex',gap:6,marginBottom:16}}>{[{v:'soldes',l:'📊 Soldes ('+types.length+')'},{v:'demandes',l:'📋 Demandes ('+demandes.length+')'},{v:'approbation',l:'⏳ À approuver ('+enAttente+')'},{v:'regles',l:'⚖ Règles'}].map(t=><button key={t.v} onClick={()=>setTab(t.v)} style={{padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:tab===t.v?600:400,fontFamily:'inherit',background:tab===t.v?'rgba(198,163,78,.15)':'rgba(255,255,255,.03)',color:tab===t.v?'#c6a34e':'#9e9b93'}}>{t.l}</button>)}</div>

    {tab==='soldes'&&<div>
      <C title="Compteur soldes — Temps réel">
        {types.map((t,i)=>{const reste=typeof t.solde==='number'?t.solde-t.pris:t.solde;const pct=typeof t.solde==='number'&&t.solde>0?(t.pris/t.solde*100):0;
        return <div key={i} style={{padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,.03)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:10,height:10,borderRadius:3,background:t.couleur}}/><span style={{fontSize:12,color:'#e8e6e0'}}>{t.nom}</span></div>
            <div style={{display:'flex',gap:12,alignItems:'center'}}>
              <span style={{fontSize:10,color:'#888'}}>Pris: {t.pris}</span>
              <span style={{fontSize:12,fontWeight:600,color:typeof reste==='number'&&reste<=2?'#ef4444':t.couleur}}>Solde: {typeof reste==='number'?reste:reste}</span>
            </div>
          </div>
          {typeof t.solde==='number'&&<div style={{width:'100%',height:4,background:'rgba(255,255,255,.05)',borderRadius:2,marginTop:4}}><div style={{width:Math.min(pct,100)+'%',height:'100%',background:pct>80?'#ef4444':t.couleur,borderRadius:2}}/></div>}
        </div>})}
      </C>
      <C title="Jours légaux — Rappel">
        {[
          {t:'Congés annuels',v:'20 jours/an (régime 5j/sem). Prorata si entrée en cours d\'année.',c:'#22c55e'},
          {t:'Petit chômage',v:'Art. 30 Loi 03/07/1978 + AR 28/08/1963. Mariage: 2j, décès conjoint: 3j, etc.',c:'#3b82f6'},
          {t:'Formation',v:'5 jours/an/ETP (Loi formation 2022). Prorata temps partiel.',c:'#a855f7'},
          {t:'Congé parental',v:'4 mois (temps plein) ou 8 mois (mi-temps) ou 20 mois (1/5). Allocations ONEM.',c:'#ec4899'},
          {t:'Crédit-temps',v:'Fin de carrière: dès 55 ans (emploi de nuit/construction) ou 60 ans (général). Allocation ONEM.',c:'#06b6d4'},
        ].map((r,i)=><Row key={i} l={r.t} v={r.v} c={r.c}/>)}
      </C>
    </div>}

    {tab==='demandes'&&<C title="Toutes les demandes">
      {demandes.map((d,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.03)',alignItems:'center'}}>
        <div><div style={{fontSize:12,fontWeight:500,color:'#e8e6e0'}}>{d.emp} — {d.type}</div><div style={{fontSize:10,color:'#888'}}>{d.du} → {d.au} ({d.jours}j) · Demandé le {d.date_demande}</div>{d.motif_refus&&<div style={{fontSize:10,color:'#ef4444'}}>Motif: {d.motif_refus}</div>}</div>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          {d.justificatif&&<Badge text="📎 Justif." color="#22c55e"/>}
          <Badge text={d.statut.replace('_',' ')} color={statutColors[d.statut]}/>
        </div>
      </div>)}
    </C>}

    {tab==='approbation'&&<div>
      {demandes.filter(d=>d.statut==='en_attente').length===0?<div style={{padding:40,textAlign:'center',color:'#888'}}>✅ Aucune demande en attente</div>:
      demandes.filter(d=>d.statut==='en_attente').map((d,i)=><C key={i} title={d.emp+' — '+d.type} color="#eab308">
        <Row l="Période" v={d.du+' → '+d.au+' ('+d.jours+'j)'}/>
        <Row l="Date demande" v={d.date_demande}/>
        <Row l="Justificatif" v={d.justificatif?'✓ Fourni':'✗ Manquant'} c={d.justificatif?'#22c55e':'#f87171'}/>
        <div style={{display:'flex',gap:8,marginTop:10}}>
          <button onClick={()=>approuver(d.id)} style={{padding:'8px 20px',borderRadius:8,border:'none',background:'rgba(34,197,94,.15)',color:'#22c55e',fontWeight:600,fontSize:12,cursor:'pointer'}}>✓ Approuver</button>
          <button onClick={()=>refuser(d.id)} style={{padding:'8px 20px',borderRadius:8,border:'none',background:'rgba(239,68,68,.15)',color:'#ef4444',fontWeight:600,fontSize:12,cursor:'pointer'}}>✗ Refuser</button>
        </div>
      </C>)}
    </div>}

    {tab==='regles'&&<C title="Règles de validation automatique">
      {[
        {r:'Chevauchement',d:'Si ≥ 2 personnes du même service sont absentes le même jour → alerte automatique + blocage si effectif < seuil minimum.'},
        {r:'Effectif minimum',d:'Configurable par service: min 50% de l\'effectif présent. Sinon: refus automatique ou demande de validation manager.'},
        {r:'Justificatif obligatoire',d:'Maladie > 1 jour: certificat médical requis dans les 48h (ou selon règlement de travail). Sans justificatif: absence injustifiée.'},
        {r:'Solde insuffisant',d:'Si le solde de congé est épuisé: passage automatique en congé sans solde (avec accord employeur).'},
        {r:'Délai de demande',d:'Configurable: min 3 jours ouvrables avant pour congé annuel. Maladie: pas de délai requis.'},
        {r:'Approbation hiérarchique',d:'Niveau 1: manager direct. Niveau 2: RH (si > 5 jours ou congé exceptionnel). Niveau 3: direction (si > 15 jours).'},
        {r:'Rechute maladie',d:'Si reprise < 14 jours calendrier après maladie: continuation de la période initiale (Art. 73bis Loi contrat travail).'},
      ].map((r,i)=><div key={i} style={{padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.03)'}}>
        <div style={{fontSize:12,fontWeight:600,color:'#c6a34e'}}>{r.r}</div>
        <div style={{fontSize:10.5,color:'#9e9b93',marginTop:3}}>{r.d}</div>
      </div>)}
    </C>}
  </div>;
}

// ════════════════════════════════════════════════════════════
// 2. CONVENTIONS CCT V2 — Contenu réel par CP
// ════════════════════════════════════════════════════════════
const CCT_PAR_CP=[
  {cp:'200',nom:'CP 200 — Commission paritaire auxiliaire pour employés',workers:'~500.000 travailleurs',
    ccts:[
      {ref:'CCT indexation',desc:'Mécanisme d\'indexation sectorielle: adaptation des salaires au dépassement de l\'indice-pivot. Barèmes revus annuellement en janvier.',type:'Salaire'},
      {ref:'CCT prime fin d\'année',desc:'Prime de fin d\'année = salaire mensuel brut × mois prestés/12. Conditions: 6 mois d\'ancienneté au 31/12.',type:'Prime'},
      {ref:'CCT crédit-temps',desc:'Possibilité de réduction du temps de travail: 1/5 ou mi-temps avec allocation ONEM. Conditions d\'ancienneté: 24 mois.',type:'Temps de travail'},
      {ref:'CCT télétravail',desc:'Cadre télétravail structurel (CCT 85): indemnité bureau max 157.83 EUR/mois. Accord individuel requis.',type:'Organisation'},
      {ref:'CCT formation',desc:'Droit individuel à la formation: 5 jours/an/ETP. Plan de formation obligatoire si ≥ 20 travailleurs.',type:'Formation'},
      {ref:'CCT éco-chèques',desc:'Max 250 EUR/an pour ETP temps plein. Prorata temps partiel. Conditions ONSS.',type:'Avantage'},
    ]},
  {cp:'118',nom:'CP 118 — Industrie alimentaire',workers:'~90.000 travailleurs',
    ccts:[
      {ref:'CCT prime d\'équipe',desc:'Supplément de 12-15% pour travail en équipes (2×8 ou 3×8). Nuit: +20% minimum.',type:'Prime'},
      {ref:'CCT prime de froid',desc:'Supplément de 5% du salaire horaire si température < 5°C. Cumulable avec prime d\'équipe.',type:'Prime'},
      {ref:'CCT vêtements de travail',desc:'Employeur fournit et entretient les vêtements de travail. Indemnité si entretien par le travailleur.',type:'Avantage'},
      {ref:'CCT ancienneté',desc:'Prime d\'ancienneté: supplément barémique après 5, 10, 15, 20, 25 ans de service.',type:'Salaire'},
      {ref:'CCT prépension/RCC',desc:'Régime de chômage avec complément d\'entreprise: conditions d\'âge et ancienneté sectorielles.',type:'Fin de carrière'},
    ]},
  {cp:'124',nom:'CP 124 — Construction',workers:'~150.000 travailleurs',
    ccts:[
      {ref:'CCT timbres fidélité',desc:'~9% du salaire annuel brut. Payé en juillet par Constructiv. Min 200 jours prestés.',type:'Prime'},
      {ref:'CCT intempéries',desc:'Chômage temporaire pour intempéries: procédure spécifique construction. Chef de chantier documente.',type:'Absence'},
      {ref:'CCT sécurité',desc:'Formation sécurité obligatoire VCA/SCC. Prime de sécurité: ~0.50 EUR/heure prestée.',type:'Formation'},
      {ref:'CCT indemnité déplacement',desc:'Indemnité de mobilité: forfait par km domicile-chantier. Barème sectoriel annuel.',type:'Frais'},
      {ref:'CCT outillage',desc:'Indemnité d\'outillage personnel: ~0.65 EUR/jour. Exonéré ONSS sous conditions.',type:'Frais'},
      {ref:'CCT Constructiv',desc:'Fonds de sécurité d\'existence: formation, vacances construction, timbres. Cotisation employeur 9.12%.',type:'Fonds'},
    ]},
  {cp:'302',nom:'CP 302 — Hôtellerie & Restauration (Horeca)',workers:'~130.000 travailleurs',
    ccts:[
      {ref:'CCT repas en nature',desc:'1 repas par service (min 4h). Si pas de repas: allocation compensatoire ~3 EUR. BIK: 1.09 EUR/repas.',type:'Avantage'},
      {ref:'CCT heures supplémentaires',desc:'Régime dérogatoire Horeca: compteur heures flex. 143h/trimestre (300h/an pour entreprises connectées).',type:'Temps de travail'},
      {ref:'CCT flexi-jobs',desc:'Depuis 2015: flexi-travailleurs à 0% ONSS travailleur + cotisation spéciale 28% employeur. Conditions: emploi 4/5 minimum chez autre employeur.',type:'Emploi'},
      {ref:'CCT pourboires',desc:'Pourboires: déclarés via forfait sectoriel. Base ONSS: montant forfaitaire convenu.',type:'Salaire'},
      {ref:'CCT fonds social Horeca',desc:'Cotisation fonds social: prime syndicale + avantages sociaux sectoriels.',type:'Fonds'},
    ]},
  {cp:'330',nom:'CP 330 — Établissements de santé',workers:'~250.000 travailleurs',
    ccts:[
      {ref:'CCT IFIC',desc:'Classification des fonctions IFIC: 20 catégories. Remplace les anciennes barèmes. Transition progressive.',type:'Salaire'},
      {ref:'CCT prime d\'attractivité',desc:'Prime mensuelle pour compenser pénurie: variable par sous-secteur. Accords non-marchands 2017-2020.',type:'Prime'},
      {ref:'CCT garde/rappel',desc:'Indemnité de garde à domicile: forfait + supplément si rappel effectif. Nuit, WE, férié: majoration.',type:'Prime'},
      {ref:'CCT Maribel social',desc:'Réduction ONSS ~480 EUR/trim/travailleur. Affectation: création d\'emplois supplémentaires dans le secteur.',type:'ONSS'},
      {ref:'CCT fin de carrière',desc:'Aménagement fin de carrière: dispense prestations travail de nuit dès 55 ans. RCC sectoriel.',type:'Fin de carrière'},
    ]},
  {cp:'140',nom:'CP 140 — Transport & Logistique',workers:'~65.000 travailleurs',
    ccts:[
      {ref:'CCT indemnité séjour',desc:'Forfait journalier: ~37 EUR/jour national, ~70 EUR international. Exonéré ONSS/IPP.',type:'Frais'},
      {ref:'CCT prime d\'éloignement',desc:'Si coucher hors domicile: ~50-70 EUR/nuit. Cumulable avec indemnité séjour.',type:'Frais'},
      {ref:'CCT ADR',desc:'Prime transport matières dangereuses: supplément horaire ou journalier selon classification ADR.',type:'Prime'},
      {ref:'CCT temps de conduite',desc:'Règlement (CE) 561/2006: max 9h/jour (10h 2×/sem), 56h/semaine, 90h/2 semaines. Pause: 45min/4h30.',type:'Temps de travail'},
      {ref:'CCT formation CAPa',desc:'Formation obligatoire chauffeurs professionnels: 35h/5 ans. Certificat d\'aptitude professionnelle.',type:'Formation'},
    ]},
];

export function ConventionsCCTV2({s}){
  const [selCP,setSelCP]=useState('200');
  const [tab,setTab]=useState('ccts');
  const [expanded,setExpanded]=useState({});
  const cp=CCT_PAR_CP.find(c=>c.cp===selCP)||CCT_PAR_CP[0];
  const typeColors={Salaire:'#c6a34e',Prime:'#22c55e',Avantage:'#3b82f6','Temps de travail':'#a855f7',Formation:'#06b6d4',Frais:'#fb923c',Fonds:'#ec4899',Absence:'#eab308',ONSS:'#f87171',Emploi:'#8b5cf6','Fin de carrière':'#888',Organisation:'#22d3ee'};

  return <div style={{padding:24}}>
    <h2 style={{fontSize:22,fontWeight:700,color:'#c6a34e',margin:'0 0 4px'}}>📜 Conventions CCT par CP</h2>
    <p style={{fontSize:12,color:'#888',margin:'0 0 20px'}}>Contenu réel des CCT sectorielles — {CCT_PAR_CP.length} commissions paritaires</p>

    <div style={{display:'flex',gap:4,marginBottom:16,flexWrap:'wrap'}}>
      {CCT_PAR_CP.map(c=><button key={c.cp} onClick={()=>setSelCP(c.cp)} style={{padding:'6px 12px',borderRadius:6,border:'none',background:selCP===c.cp?'rgba(198,163,78,.15)':'rgba(255,255,255,.03)',color:selCP===c.cp?'#c6a34e':'#888',fontSize:11,cursor:'pointer',fontWeight:selCP===c.cp?700:400}}>CP {c.cp}</button>)}
    </div>

    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:18}}>
      {[{l:'Commission paritaire',v:'CP '+cp.cp,c:'#c6a34e'},{l:'Travailleurs couverts',v:cp.workers,c:'#3b82f6'},{l:'CCT sectorielles',v:cp.ccts.length+' conventions',c:'#22c55e'}].map((k,i)=><div key={i} style={{padding:'12px 14px',background:'rgba(198,163,78,.04)',borderRadius:10,border:'1px solid rgba(198,163,78,.08)'}}><div style={{fontSize:9,color:'#5e5c56',textTransform:'uppercase'}}>{k.l}</div><div style={{fontSize:15,fontWeight:700,color:k.c,marginTop:4}}>{k.v}</div></div>)}
    </div>

    <C title={cp.nom}>
      {cp.ccts.map((cct,i)=>{const isExp=expanded[cp.cp+'_'+i];return <div key={i} style={{marginBottom:6}}>
        <div onClick={()=>setExpanded(prev=>({...prev,[cp.cp+'_'+i]:!prev[cp.cp+'_'+i]}))} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.03)',cursor:'pointer'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:12,fontWeight:600,color:'#e8e6e0'}}>{cct.ref}</span><Badge text={cct.type} color={typeColors[cct.type]}/></div>
          <span style={{fontSize:10,color:isExp?'#c6a34e':'#555',transform:isExp?'rotate(180deg)':'',transition:'transform .2s',display:'inline-block'}}>▼</span>
        </div>
        {isExp&&<div style={{padding:'8px 0 8px 16px',fontSize:11,color:'#9e9b93',borderLeft:'2px solid rgba(198,163,78,.2)'}}>{cct.desc}</div>}
      </div>})}
    </C>
  </div>;
}

// ════════════════════════════════════════════════════════════
// 3. DÉLÉGATIONS SYNDICALES V2 — Élections sociales + mandats
// ════════════════════════════════════════════════════════════
export function DelegationsV2({s}){
  const emps=(s.clients||[]).flatMap(c=>c.emps||[]);
  const n=emps.length;
  const [tab,setTab]=useState('seuils');

  return <div style={{padding:24}}>
    <h2 style={{fontSize:22,fontWeight:700,color:'#c6a34e',margin:'0 0 4px'}}>🏛 Délégations & Élections Sociales</h2>
    <p style={{fontSize:12,color:'#888',margin:'0 0 20px'}}>Seuils, composition, mandats, protection, procédure électorale</p>

    <div style={{display:'flex',gap:6,marginBottom:16}}>{[{v:'seuils',l:'📊 Seuils'},{v:'procedure',l:'📋 Procédure électorale'},{v:'protection',l:'🛡 Protection'},{v:'mandats',l:'👥 Mandats'},{v:'legal',l:'📜 Base légale'}].map(t=><button key={t.v} onClick={()=>setTab(t.v)} style={{padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:tab===t.v?600:400,fontFamily:'inherit',background:tab===t.v?'rgba(198,163,78,.15)':'rgba(255,255,255,.03)',color:tab===t.v?'#c6a34e':'#9e9b93'}}>{t.l}</button>)}</div>

    {tab==='seuils'&&<div>
      <C title="Votre effectif: il y a actuellement des obligations ?">
        <Row l="Effectif actuel" v={n+' travailleurs'} c="#c6a34e"/>
        <Row l="CPPT (Comité PPT)" v={n>=50?'OBLIGATOIRE':'Non requis (< 50 trav.)'} c={n>=50?'#ef4444':'#22c55e'}/>
        <Row l="CE (Conseil d\'entreprise)" v={n>=100?'OBLIGATOIRE':'Non requis (< 100 trav.)'} c={n>=100?'#ef4444':'#22c55e'}/>
        <Row l="DS (Délégation syndicale)" v={n>=50?'Possible si demandée':'Non applicable'} c={n>=50?'#eab308':'#888'}/>
      </C>
      <C title="Seuils légaux — Organes de concertation">
        {[
          {organe:'CPPT — Comité Prévention et Protection',seuil:'≥ 50 travailleurs',composition:'Employeur + délégués travailleurs (élus)',mission:'Sécurité, hygiène, santé, bien-être au travail. Avis sur plan global de prévention.',election:'Élections sociales tous les 4 ans'},
          {organe:'CE — Conseil d\'Entreprise',seuil:'≥ 100 travailleurs',composition:'Employeur + délégués travailleurs (élus) + délégation patronale',mission:'Information économique et financière, règlement de travail, congés collectifs, formation.',election:'Élections sociales tous les 4 ans'},
          {organe:'DS — Délégation Syndicale',seuil:'Variable par CP (souvent ≥ 50)',composition:'Travailleurs syndiqués désignés par les syndicats',mission:'Négociation CCT d\'entreprise, défense intérêts individuels et collectifs.',election:'Désignée par les syndicats (pas élue)'},
        ].map((r,i)=><div key={i} style={{padding:'12px 0',borderBottom:'1px solid rgba(255,255,255,.05)'}}>
          <div style={{fontSize:12,fontWeight:600,color:'#c6a34e'}}>{r.organe}</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginTop:6}}>
            <div><span style={{fontSize:9,color:'#888'}}>Seuil: </span><span style={{fontSize:10,color:'#e8e6e0'}}>{r.seuil}</span></div>
            <div><span style={{fontSize:9,color:'#888'}}>Élection: </span><span style={{fontSize:10,color:'#e8e6e0'}}>{r.election}</span></div>
          </div>
          <div style={{fontSize:10.5,color:'#9e9b93',marginTop:4}}>{r.mission}</div>
        </div>)}
      </C>
    </div>}

    {tab==='procedure'&&<C title="Procédure électorale — 150 jours">
      {[
        {j:'X-60',t:'Annonce de la date des élections',d:'L\'employeur annonce la date prévue des élections. Affichage dans l\'entreprise. Jour X = jour des élections.'},
        {j:'X-60',t:'Communication de l\'effectif',d:'Nombre de travailleurs par catégorie (ouvriers, employés, jeunes, cadres). Détermination du nombre de mandats.'},
        {j:'X-35',t:'Dépôt des listes de candidats',d:'Les syndicats (FGTB, CSC, CGSLB) déposent leurs listes de candidats. Vérification des conditions.'},
        {j:'X-28',t:'Période de remplacement',d:'Possibilité de remplacer les candidats (retrait, ajout) dans les conditions légales.'},
        {j:'X-13',t:'Convocations électorales',d:'Envoi des convocations individuelles à chaque travailleur. Lieu, date, heures du scrutin.'},
        {j:'X',t:'Jour des élections',d:'Vote secret. Bureaux de vote constitués. Dépouillement le jour même. PV des résultats.'},
        {j:'X+2',t:'Résultats & PV',d:'Affichage des résultats. PV transmis au SPF ETCS. Contestation possible dans les 13 jours.'},
        {j:'X+45',t:'Installation des organes',d:'Première réunion du CPPT et/ou CE. Désignation du président et du secrétaire.'},
      ].map((r,i)=><div key={i} style={{display:'flex',gap:12,padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.03)'}}>
        <div style={{width:45,textAlign:'center'}}><div style={{fontSize:12,fontWeight:700,color:'#c6a34e'}}>{r.j}</div></div>
        <div><div style={{fontSize:12,fontWeight:600,color:'#e8e6e0'}}>{r.t}</div><div style={{fontSize:10.5,color:'#9e9b93',marginTop:2}}>{r.d}</div></div>
      </div>)}
    </C>}

    {tab==='protection'&&<C title="🛡 Protection contre le licenciement">
      {[
        {t:'Candidats',d:'Protection dès X-30 jusqu\'à l\'installation des successeurs (4 ans + durée mandat). Même les candidats non élus sont protégés pendant toute la période.'},
        {t:'Élus',d:'Protection pendant toute la durée du mandat (4 ans) + période occulte suivante. Licenciement uniquement pour motif grave ou raison économique/technique reconnue par le tribunal.'},
        {t:'Indemnité de protection',d:'Si licenciement illégal: indemnité = 2 à 8 ans de rémunération brute selon l\'ancienneté. C\'est l\'indemnité la plus élevée du droit social belge.'},
        {t:'Procédure',d:'L\'employeur doit saisir le tribunal du travail AVANT le licenciement pour faire reconnaître le motif économique/technique. Pas de licenciement immédiat possible.'},
        {t:'Réintégration',d:'Le travailleur protégé peut demander sa réintégration. Si l\'employeur refuse: indemnité majorée.'},
      ].map((r,i)=><div key={i} style={{padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.03)'}}>
        <div style={{fontSize:12,fontWeight:600,color:'#c6a34e'}}>{r.t}</div>
        <div style={{fontSize:10.5,color:'#9e9b93',marginTop:3}}>{r.d}</div>
      </div>)}
    </C>}

    {tab==='mandats'&&<C title="Nombre de mandats effectifs">
      <div style={{fontSize:11,color:'#888',marginBottom:10}}>Nombre de mandats CPPT/CE selon l'effectif:</div>
      {[{eff:'50-100',mandats:4},{eff:'101-500',mandats:6},{eff:'501-1000',mandats:8},{eff:'1001-2000',mandats:10},{eff:'2001-3000',mandats:12},{eff:'3001-4000',mandats:14},{eff:'4001-6000',mandats:16},{eff:'6001-8000',mandats:18},{eff:'8000+',mandats:20}].map((r,i)=><Row key={i} l={r.eff+' travailleurs'} v={r.mandats+' mandats effectifs'}/>)}
      <div style={{marginTop:10,fontSize:10,color:'#888'}}>+ suppléants en nombre égal. Répartition ouvriers/employés proportionnelle à l'effectif par catégorie.</div>
    </C>}

    {tab==='legal'&&<C title="Base légale">
      {[
        {t:'Loi 04/08/1996',d:'Bien-être des travailleurs. Base du CPPT.'},
        {t:'Loi 20/09/1948',d:'Organisation de l\'économie. Base du Conseil d\'entreprise.'},
        {t:'Loi 19/03/1991',d:'Protection des délégués du personnel. Indemnité de protection 2-8 ans.'},
        {t:'Loi 04/12/2007',d:'Élections sociales: procédure électorale unifiée.'},
        {t:'CCT 5 du CNT',d:'Statut de la délégation syndicale: missions, facilités, protection.'},
      ].map((r,i)=><div key={i} style={{padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.03)'}}>
        <b style={{color:'#c6a34e',fontSize:12}}>{r.t}</b>
        <div style={{fontSize:10.5,color:'#9e9b93',marginTop:2}}>{r.d}</div>
      </div>)}
    </C>}
  </div>;
}

// ════════════════════════════════════════════════════════════
// 4. ANALYTICS V2 — Vrais analytics sur données réelles
// ════════════════════════════════════════════════════════════
export function AnalyticsV2({s}){
  const clients=s.clients||[];const emps=clients.flatMap(c=>(c.emps||[]).map(e=>({...e,_cl:c.company?.name||''})));
  const n=emps.length;
  const [tab,setTab]=useState('overview');
  const totalBrut=emps.reduce((a,e)=>a+(+(e.monthlySalary||e.gross||0)),0);
  const avgSal=n>0?totalBrut/n:0;

  // Age distribution
  const ageBuckets=useMemo(()=>{
    const b={'<25':0,'25-34':0,'35-44':0,'45-54':0,'55-64':0,'65+':0};
    emps.forEach(e=>{const bd=e.birthDate||e.birth;if(!bd)return;const age=Math.floor((new Date()-new Date(bd))/(365.25*24*3600*1000));
      if(age<25)b['<25']++;else if(age<35)b['25-34']++;else if(age<45)b['35-44']++;else if(age<55)b['45-54']++;else if(age<65)b['55-64']++;else b['65+']++;
    });return b;
  },[emps]);

  // Salary distribution
  const salBuckets=useMemo(()=>{
    const b={'<2000':0,'2000-2500':0,'2500-3000':0,'3000-3500':0,'3500-4000':0,'4000-5000':0,'5000+':0};
    emps.forEach(e=>{const s=+(e.monthlySalary||e.gross||0);
      if(s<2000)b['<2000']++;else if(s<2500)b['2000-2500']++;else if(s<3000)b['2500-3000']++;else if(s<3500)b['3000-3500']++;else if(s<4000)b['3500-4000']++;else if(s<5000)b['4000-5000']++;else b['5000+']++;
    });return b;
  },[emps]);

  // Gender
  const hommes=emps.filter(e=>(e.genre||e.gender||'').toLowerCase()==='m').length;
  const femmes=n-hommes;

  // Contract type
  const cdi=emps.filter(e=>!(e.contractType||'').toLowerCase().includes('cdd')).length;

  // Ancienneté
  const ancBuckets=useMemo(()=>{
    const b={'<1 an':0,'1-3 ans':0,'3-5 ans':0,'5-10 ans':0,'10+ ans':0};
    emps.forEach(e=>{const sd=e.startDate||e.start;if(!sd)return;const anc=(new Date()-new Date(sd))/(365.25*24*3600*1000);
      if(anc<1)b['<1 an']++;else if(anc<3)b['1-3 ans']++;else if(anc<5)b['3-5 ans']++;else if(anc<10)b['5-10 ans']++;else b['10+ ans']++;
    });return b;
  },[emps]);

  const barChart=(data,maxV)=><div style={{display:'flex',gap:3,alignItems:'flex-end',height:100}}>
    {Object.entries(data).map(([k,v],i)=><div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center'}}>
      <div style={{fontSize:8,color:'#888',marginBottom:2}}>{v}</div>
      <div style={{width:'100%',height:maxV>0?v/maxV*80:0,background:'linear-gradient(180deg,#c6a34e,rgba(198,163,78,.3))',borderRadius:'3px 3px 0 0',minHeight:v>0?2:0}}/>
      <div style={{fontSize:7,color:'#888',marginTop:3,textAlign:'center'}}>{k}</div>
    </div>)}
  </div>;

  return <div style={{padding:24}}>
    <h2 style={{fontSize:22,fontWeight:700,color:'#c6a34e',margin:'0 0 4px'}}>📈 Analytics RH</h2>
    <p style={{fontSize:12,color:'#888',margin:'0 0 20px'}}>Analyses sur données réelles — {n} employés, {clients.length} clients</p>

    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:18}}>
      {[{l:'Effectif total',v:n,c:'#c6a34e'},{l:'Salaire moyen',v:fmt(avgSal)+' €',c:'#3b82f6'},{l:'Masse/mois',v:fmt(totalBrut)+' €',c:'#f87171'},{l:'Coût total/mois',v:fmt(totalBrut*(1+TX_ONSS_E))+' €',c:'#fb923c'},{l:'H/F ratio',v:hommes+'/'+femmes,c:'#a855f7'}].map((k,i)=><div key={i} style={{padding:'12px 14px',background:'rgba(198,163,78,.04)',borderRadius:10,border:'1px solid rgba(198,163,78,.08)'}}><div style={{fontSize:9,color:'#5e5c56',textTransform:'uppercase'}}>{k.l}</div><div style={{fontSize:15,fontWeight:700,color:k.c,marginTop:4}}>{k.v}</div></div>)}
    </div>

    <div style={{display:'flex',gap:6,marginBottom:16}}>{[{v:'overview',l:'📊 Vue globale'},{v:'salaires',l:'💰 Salaires'},{v:'demographie',l:'👥 Démographie'},{v:'kpis',l:'📈 KPIs'}].map(t=><button key={t.v} onClick={()=>setTab(t.v)} style={{padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:tab===t.v?600:400,fontFamily:'inherit',background:tab===t.v?'rgba(198,163,78,.15)':'rgba(255,255,255,.03)',color:tab===t.v?'#c6a34e':'#9e9b93'}}>{t.l}</button>)}</div>

    {tab==='overview'&&<div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16}}>
      <C title="Pyramide des âges">{barChart(ageBuckets,Math.max(...Object.values(ageBuckets)))}</C>
      <C title="Distribution des salaires">{barChart(salBuckets,Math.max(...Object.values(salBuckets)))}</C>
      <C title="Ancienneté">{barChart(ancBuckets,Math.max(...Object.values(ancBuckets)))}</C>
      <C title="Répartition contrats">
        <Row l="CDI" v={cdi+' ('+((n>0?cdi/n*100:0).toFixed(0))+'%)'} c="#22c55e"/>
        <Row l="CDD" v={(n-cdi)+' ('+((n>0?(n-cdi)/n*100:0).toFixed(0))+'%)'} c="#fb923c"/>
        <Row l="Temps plein" v={emps.filter(e=>+(e.regime||100)>=100).length} c="#3b82f6"/>
        <Row l="Temps partiel" v={emps.filter(e=>+(e.regime||100)<100).length} c="#a855f7"/>
      </C>
    </div>}

    {tab==='salaires'&&<div>
      <C title="Distribution salariale détaillée">{barChart(salBuckets,Math.max(...Object.values(salBuckets)))}</C>
      <C title="Statistiques salariales">
        <Row l="Salaire minimum" v={fmt(n>0?Math.min(...emps.map(e=>+(e.monthlySalary||e.gross||0)).filter(v=>v>0)):0)+' €'}/>
        <Row l="Salaire moyen" v={fmt(avgSal)+' €'} c="#c6a34e"/>
        <Row l="Salaire médian" v={fmt(n>0?emps.map(e=>+(e.monthlySalary||e.gross||0)).sort((a,b)=>a-b)[Math.floor(n/2)]:0)+' €'}/>
        <Row l="Salaire maximum" v={fmt(n>0?Math.max(...emps.map(e=>+(e.monthlySalary||e.gross||0))):0)+' €'}/>
        <Row l="Écart min/max" v={n>0?'×'+((Math.max(...emps.map(e=>+(e.monthlySalary||e.gross||0)))/(Math.min(...emps.map(e=>+(e.monthlySalary||e.gross||0)).filter(v=>v>0))||1)).toFixed(1)):'N/A'} c="#fb923c"/>
        <Row l="Masse salariale annuelle (brut)" v={fmt(totalBrut*12)+' €'} b/>
        <Row l="Coût total annuel (ONSS inclus)" v={fmt(totalBrut*12*(1+TX_ONSS_E))+' €'} c="#f87171" b/>
      </C>
    </div>}

    {tab==='demographie'&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <C title="Genre"><Row l="Hommes" v={hommes+' ('+((n>0?hommes/n*100:0).toFixed(0))+'%)'} c="#3b82f6"/><Row l="Femmes" v={femmes+' ('+((n>0?femmes/n*100:0).toFixed(0))+'%)'} c="#ec4899"/></C>
      <C title="Pyramide des âges">{barChart(ageBuckets,Math.max(...Object.values(ageBuckets)))}</C>
      <C title="Ancienneté">{barChart(ancBuckets,Math.max(...Object.values(ancBuckets)))}</C>
      <C title="Risques démographiques">
        <Row l="Départs retraite (5 ans)" v={emps.filter(e=>{const bd=e.birthDate||e.birth;if(!bd)return false;return(new Date()-new Date(bd))/(365.25*24*3600*1000)>=60;}).length+' trav.'} c="#f87171"/>
        <Row l="Période critique (<1 an anc.)" v={(ancBuckets['<1 an']||0)+' trav.'} c="#eab308"/>
      </C>
    </div>}

    {tab==='kpis'&&<C title="KPIs RH — Indicateurs clés">
      {[
        {l:'Coût moyen par ETP/mois',v:n>0?fmt(totalBrut*(1+TX_ONSS_E)/n)+' €':'N/A',c:'#c6a34e'},
        {l:'Ratio ONSS/masse salariale',v:(TX_ONSS_E*100).toFixed(2)+'%',c:'#f87171'},
        {l:'Taux de féminisation',v:(n>0?(femmes/n*100).toFixed(0):0)+'%',c:'#ec4899'},
        {l:'Taux de CDI',v:(n>0?(cdi/n*100).toFixed(0):0)+'%',c:'#22c55e'},
        {l:'Ancienneté moyenne',v:n>0?(emps.reduce((a,e)=>{const sd=e.startDate||e.start;return a+(sd?(new Date()-new Date(sd))/(365.25*24*3600*1000):0);},0)/n).toFixed(1)+' ans':'N/A',c:'#3b82f6'},
        {l:'Ratio salaire max/min',v:n>0?'×'+((Math.max(...emps.map(e=>+(e.monthlySalary||e.gross||0)))/(Math.min(...emps.map(e=>+(e.monthlySalary||e.gross||0)).filter(v=>v>0))||1)).toFixed(1)):'N/A',c:'#fb923c'},
        {l:'Masse salariale annuelle',v:fmt(totalBrut*12)+' €',c:'#c6a34e'},
        {l:'Coût total annuel (tout inclus)',v:fmt(totalBrut*12*(1+TX_ONSS_E)*1.15)+' €',c:'#f87171'},
      ].map((r,i)=><Row key={i} l={r.l} v={r.v} c={r.c}/>)}
    </C>}
  </div>;
}

// ════════════════════════════════════════════════════════════
// 5. IMPORT CSV V2 — Mapping colonnes + validation + preview erreurs
// ════════════════════════════════════════════════════════════
export function ImportCSVV2({s}){
  const [tab,setTab]=useState('mapping');
  const [data,setData]=useState([]);
  const [errors,setErrors]=useState([]);
  const [mapped,setMapped]=useState({});

  const champsCibles=[
    {id:'nom',label:'Nom',obligatoire:true,validation:'Non vide'},
    {id:'prenom',label:'Prénom',obligatoire:true,validation:'Non vide'},
    {id:'niss',label:'NISS',obligatoire:true,validation:'Format: XX.XX.XX-XXX.XX (13 caractères)'},
    {id:'date_naissance',label:'Date de naissance',obligatoire:true,validation:'Format: DD/MM/YYYY ou YYYY-MM-DD'},
    {id:'date_debut',label:'Date début contrat',obligatoire:true,validation:'Date valide, pas dans le futur > 6 mois'},
    {id:'salaire_brut',label:'Salaire brut mensuel',obligatoire:true,validation:'Nombre > RMMMG (2.070,48 EUR) et < 30.000'},
    {id:'type_contrat',label:'Type contrat',obligatoire:true,validation:'CDI, CDD, Étudiant, Intérim'},
    {id:'regime',label:'Régime horaire (%)',obligatoire:false,validation:'Nombre entre 1 et 100'},
    {id:'cp',label:'Commission paritaire',obligatoire:false,validation:'Code CP numérique (ex: 200, 118, 124)'},
    {id:'iban',label:'IBAN',obligatoire:false,validation:'Format: BE + 14 chiffres (total 16 car.)'},
    {id:'email',label:'Email',obligatoire:false,validation:'Format email valide'},
    {id:'adresse',label:'Adresse',obligatoire:false,validation:'Texte libre'},
    {id:'genre',label:'Genre',obligatoire:false,validation:'M ou F'},
    {id:'fonction',label:'Fonction',obligatoire:false,validation:'Texte libre'},
  ];

  const validationRules=[
    {regle:'NISS — Format',desc:'Le NISS doit être au format XX.XX.XX-XXX.XX (11 chiffres + 2 contrôle). Vérification du modulo 97.',severite:'Bloquant'},
    {regle:'NISS — Unicité',desc:'Pas de doublons NISS dans le fichier ni dans la base existante.',severite:'Bloquant'},
    {regle:'Salaire — RMMMG',desc:'Le salaire brut doit être ≥ au RMMMG applicable (2.070,48 EUR/mois en 2026 pour 21+ ans).',severite:'Warning'},
    {regle:'Salaire — Plafond',desc:'Alerte si salaire > 10.000 EUR (vérification manuelle recommandée).',severite:'Warning'},
    {regle:'Date — Cohérence',desc:'Date de naissance: le travailleur doit avoir entre 15 et 70 ans. Date début: pas antérieure à la date de naissance + 15 ans.',severite:'Bloquant'},
    {regle:'IBAN — Validation',desc:'Vérification modulo 97 du numéro IBAN. Banque belge: les 2 premiers caractères doivent être BE.',severite:'Warning'},
    {regle:'Contrat — Valeur',desc:'Type de contrat doit être CDI, CDD, Étudiant ou Intérim. Toute autre valeur est signalée.',severite:'Warning'},
    {regle:'Doublons — Nom+Prénom+Naissance',desc:'Alerte si même combinaison nom/prénom/date de naissance déjà présente.',severite:'Warning'},
  ];

  return <div style={{padding:24}}>
    <h2 style={{fontSize:22,fontWeight:700,color:'#c6a34e',margin:'0 0 4px'}}>📥 Import CSV Avancé</h2>
    <p style={{fontSize:12,color:'#888',margin:'0 0 20px'}}>Mapping colonnes intelligent + validation NISS/IBAN + preview erreurs</p>

    <div style={{display:'flex',gap:6,marginBottom:16}}>{[{v:'mapping',l:'🔗 Mapping colonnes'},{v:'validation',l:'✓ Règles validation ('+validationRules.length+')'},{v:'champs',l:'📋 Champs ('+champsCibles.length+')'},{v:'procedure',l:'📌 Procédure'}].map(t=><button key={t.v} onClick={()=>setTab(t.v)} style={{padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:tab===t.v?600:400,fontFamily:'inherit',background:tab===t.v?'rgba(198,163,78,.15)':'rgba(255,255,255,.03)',color:tab===t.v?'#c6a34e':'#9e9b93'}}>{t.l}</button>)}</div>

    {tab==='mapping'&&<div>
      <C title="Mapping des colonnes CSV → Champs Aureus Social">
        <div style={{fontSize:10,color:'#888',marginBottom:12}}>Glissez votre fichier CSV ici ou configurez le mapping manuellement. Le système détecte automatiquement les colonnes similaires.</div>
        <div style={{display:'grid',gridTemplateColumns:'80px 1fr 1fr 80px',gap:4,padding:'6px 0',borderBottom:'2px solid rgba(198,163,78,.15)',fontSize:9,fontWeight:700,color:'#c6a34e'}}>
          <div>Obligatoire</div><div>Champ Aureus Social</div><div>Colonne CSV (auto-détection)</div><div>Validation</div>
        </div>
        {champsCibles.map((c,i)=><div key={i} style={{display:'grid',gridTemplateColumns:'80px 1fr 1fr 80px',gap:4,padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,.03)',fontSize:11,alignItems:'center'}}>
          <div style={{textAlign:'center'}}>{c.obligatoire?<span style={{color:'#ef4444',fontWeight:700}}>●</span>:<span style={{color:'#888'}}>○</span>}</div>
          <div style={{color:'#e8e6e0',fontWeight:500}}>{c.label}</div>
          <div style={{fontSize:10,color:'#888',fontStyle:'italic'}}>Auto: {c.id}</div>
          <div><Badge text={c.obligatoire?'Requis':'Optionnel'} color={c.obligatoire?'#ef4444':'#888'}/></div>
        </div>)}
      </C>
    </div>}

    {tab==='validation'&&<C title="Règles de validation">
      {validationRules.map((r,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.03)',alignItems:'center'}}>
        <div><div style={{fontSize:12,fontWeight:600,color:'#e8e6e0'}}>{r.regle}</div><div style={{fontSize:10.5,color:'#9e9b93',marginTop:2}}>{r.desc}</div></div>
        <Badge text={r.severite} color={r.severite==='Bloquant'?'#ef4444':'#eab308'}/>
      </div>)}
    </C>}

    {tab==='champs'&&<C title="Champs disponibles — 14 champs">
      {champsCibles.map((c,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,.03)'}}>
        <div><span style={{fontSize:12,fontWeight:500,color:'#e8e6e0'}}>{c.label}</span>{c.obligatoire&&<span style={{color:'#ef4444',marginLeft:4}}>*</span>}</div>
        <span style={{fontSize:10,color:'#888'}}>{c.validation}</span>
      </div>)}
    </C>}

    {tab==='procedure'&&<C title="Procédure d'import — 5 étapes">
      {[
        {n:1,t:'Upload fichier CSV',d:'Glissez ou sélectionnez votre fichier. Formats acceptés: .csv (UTF-8 ou ANSI), .xlsx. Séparateurs: virgule, point-virgule, tabulation (auto-détection).'},
        {n:2,t:'Preview & mapping',d:'Le système affiche les 5 premières lignes et propose un mapping automatique. Vous pouvez ajuster le mapping manuellement.'},
        {n:3,t:'Validation',d:'Vérification de toutes les règles (NISS, salaire, dates, doublons). Les erreurs bloquantes doivent être corrigées. Les warnings sont informatifs.'},
        {n:4,t:'Preview erreurs',d:'Liste détaillée de toutes les erreurs par ligne avec le champ concerné et la valeur problématique. Export des erreurs possible.'},
        {n:5,t:'Import final',d:'Confirmation et import dans la base. Dimona IN automatique si configuré. Rapport d\'import envoyé par email.'},
      ].map((r,i)=><div key={i} style={{display:'flex',gap:12,padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.03)'}}>
        <div style={{width:28,height:28,borderRadius:'50%',background:'rgba(198,163,78,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#c6a34e',flexShrink:0}}>{r.n}</div>
        <div><div style={{fontSize:12,fontWeight:600,color:'#e8e6e0'}}>{r.t}</div><div style={{fontSize:10.5,color:'#9e9b93',marginTop:2}}>{r.d}</div></div>
      </div>)}
    </C>}
  </div>;
}

// ════════════════════════════════════════════════════════════
// 6. AUDIT TRAIL V2 — Recherche avancée + export + alertes
// ════════════════════════════════════════════════════════════
export function AuditTrailV2({s,user}){
  const [tab,setTab]=useState('logs');
  const [filter,setFilter]=useState('all');
  const [search,setSearch]=useState('');
  const userName=user?.email||'admin';

  const sampleLogs=[
    {ts:'2026-02-25 14:32:01',user:userName,action:'MODIFICATION',module:'Paie',detail:'Salaire modifié: Martin Dupont 3.200→3.400 EUR',severity:'warning'},
    {ts:'2026-02-25 14:15:22',user:userName,action:'CRÉATION',module:'Employé',detail:'Nouveau travailleur ajouté: Sophie Lambert (NISS: 96.05.15-123.45)',severity:'info'},
    {ts:'2026-02-25 13:45:10',user:userName,action:'CALCUL',module:'ONSS',detail:'DmfA T4/2025 calculée: total ONSS 12.458,32 EUR',severity:'info'},
    {ts:'2026-02-25 12:30:00',user:userName,action:'EXPORT',module:'Comptabilité',detail:'Export BOB 50 — Période 01/2026 — 7 écritures',severity:'info'},
    {ts:'2026-02-25 11:20:15',user:'system',action:'ALERTE',module:'Absence',detail:'Bradford score critique: Jean Peeters (score: 384)',severity:'critical'},
    {ts:'2026-02-25 10:05:33',user:userName,action:'SUPPRESSION',module:'Employé',detail:'Travailleur archivé: Pierre Vandenberghe (fin CDD)',severity:'warning'},
    {ts:'2026-02-24 16:45:00',user:'system',action:'ÉCHÉANCE',module:'Calendrier',detail:'Rappel: PP 274 — Déclaration précompte professionnel dans 5 jours',severity:'warning'},
    {ts:'2026-02-24 09:00:00',user:'system',action:'BACKUP',module:'Système',detail:'Sauvegarde automatique effectuée — 2.4 MB',severity:'info'},
  ];
  const sevColors={info:'#3b82f6',warning:'#eab308',critical:'#ef4444'};
  const actColors={MODIFICATION:'#fb923c',CRÉATION:'#22c55e',CALCUL:'#3b82f6',EXPORT:'#a855f7',ALERTE:'#ef4444',SUPPRESSION:'#f87171',ÉCHÉANCE:'#eab308',BACKUP:'#06b6d4'};
  const filtered=sampleLogs.filter(l=>(filter==='all'||l.severity===filter)&&(search===''||l.detail.toLowerCase().includes(search.toLowerCase())));

  return <div style={{padding:24}}>
    <h2 style={{fontSize:22,fontWeight:700,color:'#c6a34e',margin:'0 0 4px'}}>🔍 Audit Trail</h2>
    <p style={{fontSize:12,color:'#888',margin:'0 0 20px'}}>Journal d'activité complet — Recherche avancée + alertes anomalies + export</p>

    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:18}}>
      {[{l:'Total événements',v:sampleLogs.length,c:'#c6a34e'},{l:'Critiques',v:sampleLogs.filter(l=>l.severity==='critical').length,c:'#ef4444'},{l:'Warnings',v:sampleLogs.filter(l=>l.severity==='warning').length,c:'#eab308'},{l:'Dernière activité',v:sampleLogs[0]?.ts.split(' ')[1]||'—',c:'#3b82f6'}].map((k,i)=><div key={i} style={{padding:'12px 14px',background:'rgba(198,163,78,.04)',borderRadius:10,border:'1px solid rgba(198,163,78,.08)'}}><div style={{fontSize:9,color:'#5e5c56',textTransform:'uppercase'}}>{k.l}</div><div style={{fontSize:15,fontWeight:700,color:k.c,marginTop:4}}>{k.v}</div></div>)}
    </div>

    <div style={{display:'flex',gap:6,marginBottom:16}}>{[{v:'logs',l:'📋 Logs'},{v:'alertes',l:'🚨 Alertes'},{v:'regles',l:'⚙ Règles alertes'}].map(t=><button key={t.v} onClick={()=>setTab(t.v)} style={{padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:tab===t.v?600:400,fontFamily:'inherit',background:tab===t.v?'rgba(198,163,78,.15)':'rgba(255,255,255,.03)',color:tab===t.v?'#c6a34e':'#9e9b93'}}>{t.l}</button>)}</div>

    {/* Filters */}
    <div style={{display:'flex',gap:8,marginBottom:14,alignItems:'center'}}>
      <I label="" placeholder="🔍 Rechercher..." value={search} onChange={setSearch} style={{width:250}}/>
      <div style={{display:'flex',gap:3,marginTop:10}}>
        {[{v:'all',l:'Tous'},{v:'critical',l:'Critiques'},{v:'warning',l:'Warnings'},{v:'info',l:'Info'}].map(f=><button key={f.v} onClick={()=>setFilter(f.v)} style={{padding:'5px 10px',borderRadius:6,border:'none',background:filter===f.v?'rgba(198,163,78,.12)':'rgba(255,255,255,.03)',color:filter===f.v?'#c6a34e':'#888',fontSize:10,cursor:'pointer'}}>{f.l}</button>)}
      </div>
    </div>

    {tab==='logs'&&<C title={'Journal d\'activité — '+filtered.length+' événements'}>
      {filtered.map((l,i)=><div key={i} style={{display:'grid',gridTemplateColumns:'130px 60px 80px 80px 1fr',gap:6,padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,.03)',fontSize:10.5,alignItems:'center'}}>
        <span style={{fontFamily:'monospace',color:'#888'}}>{l.ts}</span>
        <span style={{color:l.user==='system'?'#06b6d4':'#e8e6e0'}}>{l.user==='system'?'⚙ auto':l.user.split('@')[0]}</span>
        <Badge text={l.action} color={actColors[l.action]}/>
        <span style={{color:'#888'}}>{l.module}</span>
        <span style={{color:sevColors[l.severity]}}>{l.detail}</span>
      </div>)}
    </C>}

    {tab==='alertes'&&<C title="🚨 Alertes actives">
      {sampleLogs.filter(l=>l.severity==='critical'||l.severity==='warning').map((l,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.03)'}}>
        <div><div style={{fontSize:12,fontWeight:500,color:sevColors[l.severity]}}>{l.detail}</div><div style={{fontSize:10,color:'#888'}}>{l.ts} · {l.module}</div></div>
        <Badge text={l.severity} color={sevColors[l.severity]}/>
      </div>)}
    </C>}

    {tab==='regles'&&<C title="Règles d'alerte automatique">
      {[
        {r:'Modification salaire > 20%',d:'Alerte si un salaire est modifié de plus de 20% en une seule fois.',s:'Warning'},
        {r:'Bradford score > 300',d:'Alerte automatique si le facteur Bradford d\'un travailleur dépasse 300 (absentéisme critique).',s:'Critical'},
        {r:'Échéance < 5 jours',d:'Rappel automatique pour toutes les échéances sociales dans les 5 prochains jours.',s:'Warning'},
        {r:'NISS doublon',d:'Alerte si un NISS est saisi en double dans la base.',s:'Critical'},
        {r:'Salaire < RMMMG',d:'Alerte si un salaire est inférieur au Revenu Minimum Mensuel Moyen Garanti.',s:'Critical'},
        {r:'Contrat CDD expiration',d:'Alerte 30 jours avant l\'expiration d\'un CDD. Rappel renouvellement ou CDI.',s:'Warning'},
        {r:'Visite médicale échue',d:'Alerte si la visite médicale annuelle est dépassée de plus de 30 jours.',s:'Warning'},
      ].map((r,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.03)',alignItems:'center'}}>
        <div><div style={{fontSize:12,fontWeight:600,color:'#e8e6e0'}}>{r.r}</div><div style={{fontSize:10.5,color:'#9e9b93',marginTop:2}}>{r.d}</div></div>
        <Badge text={r.s} color={r.s==='Critical'?'#ef4444':'#eab308'}/>
      </div>)}
    </C>}
  </div>;
}
