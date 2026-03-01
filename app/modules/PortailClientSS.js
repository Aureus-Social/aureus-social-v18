'use client';
import { useState } from 'react';
import { TX_ONSS_E } from '@/app/lib/lois-belges';
import { quickNet } from '@/app/lib/payroll-engine';

const PortailClientSS=({s,d,supabase,user,clientData})=>{
  const clients=s.clients||[];
  const [selClient,setSelClient]=useState(0);
  const [tab,setTab]=useState('overview');
  const [msgInput,setMsgInput]=useState('');
  const [messages,setMessages]=useState([
    {from:'system',text:'Bienvenue sur votre portail client Aureus Social Pro.',date:new Date().toISOString()},
  ]);
  const [demandes,setDemandes]=useState([]);
  const [newDemande,setNewDemande]=useState({type:'attestation',desc:''});
  const f2=v=>new Intl.NumberFormat('fr-BE',{minimumFractionDigits:2,maximumFractionDigits:2}).format(v||0);
  const mois=['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'];
  const cl=clients[selClient];
  const co=cl?.company||{};
  const emps=cl?.emps||[];

  const totalBrut=emps.reduce((a,e)=>a+(+(e.monthlySalary||e.gross||0)),0);
  const totalNet=emps.reduce((a,e)=>{const b=+(e.monthlySalary||e.gross||0);return a+quickNet(b);},0);
  const totalCout=emps.reduce((a,e)=>a+Math.round((+(e.monthlySalary||e.gross||0))*(1+TX_ONSS_E)*100)/100,0);
  const cddCount=emps.filter(e=>(e.contractType||'')==='CDD').length;

  const payslipHistory=[];
  for(let i=0;i<6;i++){
    const d=new Date();d.setMonth(d.getMonth()-1-i);
    payslipHistory.push({month:mois[d.getMonth()],year:d.getFullYear(),emps:emps.length,brut:totalBrut,net:totalNet,status:'sent'});
  }

  const sendMsg=()=>{
    if(!msgInput.trim())return;
    setMessages(p=>[...p,{from:'client',text:msgInput,date:new Date().toISOString()}]);
    setMsgInput('');
    setTimeout(()=>setMessages(p=>[...p,{from:'gestionnaire',text:'Merci pour votre message. Nous traitons votre demande dans les plus brefs delais.',date:new Date().toISOString()}]),1000);
  };

  const submitDemande=()=>{
    if(!newDemande.desc.trim())return;
    setDemandes(p=>[{...newDemande,id:Date.now(),status:'pending',date:new Date().toISOString(),client:co.name},...p]);
    setNewDemande({type:'attestation',desc:''});
  };

  const tabs=[
    {id:'overview',l:'Vue generale',i:'📊'},
    {id:'fiches',l:'Fiches de paie',i:'📄'},
    {id:'employes',l:'Mon personnel',i:'👥'},
    {id:'documents',l:'Documents',i:'📁'},
    {id:'demandes',l:'Demandes',i:'📝'},
    {id:'messagerie',l:'Messagerie',i:'💬'},
    {id:'facturation',l:'Facturation',i:'🧾'},
  ];

  return <div style={{padding:24}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
      <div>
        <h2 style={{fontSize:22,fontWeight:700,color:'#c6a34e',margin:0}}>🌐 Portail Client</h2>
        <p style={{fontSize:12,color:'#888',margin:'4px 0 0'}}>Interface self-service pour vos clients fiduciaires</p>
      </div>
      <select value={selClient} onChange={e=>setSelClient(+e.target.value)} style={{padding:'8px 14px',background:'#090c16',border:'1px solid rgba(139,115,60,.15)',borderRadius:8,color:'#c6a34e',fontSize:12,fontFamily:'inherit'}}>
        {clients.map((c,i)=><option key={i} value={i}>{c.company?.name||'Client '+(i+1)}</option>)}
      </select>
    </div>

    <div style={{padding:16,background:'linear-gradient(135deg,rgba(198,163,78,.06),rgba(198,163,78,.02))',border:'1px solid rgba(198,163,78,.12)',borderRadius:14,marginBottom:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{fontSize:18,fontWeight:700,color:'#e5e5e5'}}>{co.name||'Client'}</div>
          <div style={{fontSize:11,color:'#888'}}>BCE: {co.vat||'N/A'} | CP: {co.cp||'200'} | {emps.length} travailleur{emps.length>1?'s':''}{cddCount>0?' (dont '+cddCount+' CDD)':''}</div>
        </div>
        <div style={{fontSize:10,padding:'4px 10px',borderRadius:6,background:'rgba(34,197,94,.1)',color:'#22c55e',fontWeight:600}}>Actif</div>
      </div>
    </div>

    <div style={{display:'flex',gap:4,marginBottom:16,overflowX:'auto',paddingBottom:4}}>
      {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'8px 14px',borderRadius:8,border:'none',background:tab===t.id?'rgba(198,163,78,.12)':'rgba(255,255,255,.02)',color:tab===t.id?'#c6a34e':'#888',fontSize:11,cursor:'pointer',whiteSpace:'nowrap',fontWeight:tab===t.id?600:400}}>{t.i} {t.l}</button>)}
    </div>

    {tab==='overview'&&<div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        {[{l:'Effectif',v:emps.length,c:'#3b82f6',i:'👥'},
          {l:'Masse brute',v:f2(totalBrut)+' EUR',c:'#e5e5e5',i:'💰'},
          {l:'Net total',v:f2(totalNet)+' EUR',c:'#22c55e',i:'💵'},
          {l:'Cout employeur',v:f2(totalCout)+' EUR',c:'#c6a34e',i:'🏢'},
        ].map((k,i)=><div key={i} style={{padding:14,background:'linear-gradient(135deg,#0d1117,#131820)',border:'1px solid '+k.c+'15',borderRadius:12,textAlign:'center'}}>
          <div style={{fontSize:9,color:'#888'}}>{k.i} {k.l}</div>
          <div style={{fontSize:18,fontWeight:700,color:k.c}}>{k.v}</div>
        </div>)}
      </div>
      <div style={{fontSize:13,fontWeight:600,color:'#c6a34e',marginBottom:8}}>Actions rapides</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
        {[{l:'Demander attestation',i:'📋',action:()=>setTab('demandes')},
          {l:'Consulter fiches',i:'📄',action:()=>setTab('fiches')},
          {l:'Envoyer un message',i:'💬',action:()=>setTab('messagerie')},
          {l:'Declarer un nouvel employe',i:'🟢',action:()=>setTab('demandes')},
          {l:'Signaler une absence',i:'🏥',action:()=>setTab('demandes')},
          {l:'Telecharger documents',i:'📁',action:()=>setTab('documents')},
        ].map((a,i)=><button key={i} onClick={a.action} style={{padding:14,borderRadius:12,border:'1px solid rgba(255,255,255,.05)',background:'rgba(255,255,255,.02)',cursor:'pointer',textAlign:'left',transition:'all .15s'}}>
          <div style={{fontSize:18,marginBottom:4}}>{a.i}</div>
          <div style={{fontSize:11,color:'#e5e5e5',fontWeight:500}}>{a.l}</div>
        </button>)}
      </div>
    </div>}

    {tab==='fiches'&&<div style={{border:'1px solid rgba(198,163,78,.1)',borderRadius:14,overflow:'hidden'}}>
      <div style={{padding:'10px 14px',background:'rgba(198,163,78,.04)',fontSize:12,fontWeight:600,color:'#c6a34e'}}>Historique fiches de paie</div>
      {payslipHistory.map((p,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',borderBottom:'1px solid rgba(255,255,255,.03)'}}>
        <div>
          <div style={{fontSize:12,fontWeight:500,color:'#e5e5e5'}}>{p.month} {p.year}</div>
          <div style={{fontSize:10,color:'#888'}}>{p.emps} fiche{p.emps>1?'s':''} | Brut: {f2(p.brut)} | Net: {f2(p.net)}</div>
        </div>
        <div style={{display:'flex',gap:6}}>
          <button style={{padding:'5px 10px',borderRadius:6,border:'none',background:'rgba(198,163,78,.08)',color:'#c6a34e',fontSize:10,cursor:'pointer'}}>📥 PDF</button>
          <button style={{padding:'5px 10px',borderRadius:6,border:'none',background:'rgba(34,197,94,.08)',color:'#22c55e',fontSize:10,cursor:'pointer'}}>👁 Voir</button>
        </div>
      </div>)}
    </div>}

    {tab==='employes'&&<div style={{border:'1px solid rgba(198,163,78,.1)',borderRadius:14,overflow:'hidden'}}>
      <div style={{padding:'10px 14px',background:'rgba(198,163,78,.04)',display:'flex',justifyContent:'space-between'}}>
        <span style={{fontSize:12,fontWeight:600,color:'#c6a34e'}}>Personnel ({emps.length})</span>
      </div>
      {emps.map((e,i)=><div key={i} style={{display:'grid',gridTemplateColumns:'200px 100px 80px 100px 80px',padding:'8px 14px',borderBottom:'1px solid rgba(255,255,255,.03)',fontSize:11,alignItems:'center'}}>
        <div style={{fontWeight:500,color:'#e5e5e5'}}>{(e.first||e.fn||'')} {(e.last||e.ln||'')}</div>
        <div style={{color:'#888'}}>{e.function||e.job||'Employé'}</div>
        <div style={{color:'#888'}}>{e.contractType||'CDI'}</div>
        <div style={{color:'#22c55e'}}>{f2(+(e.monthlySalary||e.gross||0))} EUR</div>
        <div style={{fontSize:9,padding:'2px 6px',borderRadius:4,background:'rgba(34,197,94,.1)',color:'#22c55e',textAlign:'center'}}>{e.status||'Actif'}</div>
      </div>)}
      {emps.length===0&&<div style={{padding:30,textAlign:'center',color:'#888'}}>Aucun travailleur</div>}
    </div>}

    {tab==='documents'&&<div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
        {[{l:'Contrats de travail',i:'📋',count:emps.length},
          {l:'Fiches de paie',i:'📄',count:emps.length*6},
          {l:'Attestations',i:'📝',count:Math.ceil(emps.length/2)},
          {l:'Declarations ONSS',i:'🏛',count:4},
          {l:'Fiches fiscales 281.10',i:'🧾',count:emps.length},
          {l:'Reglements de travail',i:'📖',count:1},
        ].map((d,i)=><div key={i} style={{padding:16,background:'linear-gradient(135deg,#0d1117,#131820)',border:'1px solid rgba(198,163,78,.08)',borderRadius:12,cursor:'pointer'}}>
          <div style={{fontSize:24,marginBottom:6}}>{d.i}</div>
          <div style={{fontSize:12,fontWeight:600,color:'#e5e5e5'}}>{d.l}</div>
          <div style={{fontSize:10,color:'#888',marginTop:2}}>{d.count} document{d.count>1?'s':''}</div>
        </div>)}
      </div>
    </div>}

    {tab==='demandes'&&<div>
      <div style={{padding:16,background:'linear-gradient(135deg,#0d1117,#131820)',border:'1px solid rgba(198,163,78,.1)',borderRadius:14,marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:600,color:'#c6a34e',marginBottom:10}}>Nouvelle demande</div>
        <div style={{display:'flex',gap:8,marginBottom:8}}>
          {['attestation','embauche','licenciement','absence','modification','autre'].map(t=><button key={t} onClick={()=>setNewDemande(p=>({...p,type:t}))} style={{padding:'5px 10px',borderRadius:6,border:newDemande.type===t?'1px solid #c6a34e':'1px solid rgba(255,255,255,.05)',background:newDemande.type===t?'rgba(198,163,78,.08)':'transparent',color:newDemande.type===t?'#c6a34e':'#888',fontSize:10,cursor:'pointer',textTransform:'capitalize'}}>{t}</button>)}
        </div>
        <textarea value={newDemande.desc} onChange={e=>setNewDemande(p=>({...p,desc:e.target.value}))} placeholder="Decrivez votre demande..." rows={3} style={{width:'100%',padding:10,background:'#090c16',border:'1px solid rgba(139,115,60,.15)',borderRadius:8,color:'#e5e5e5',fontSize:12,fontFamily:'inherit',resize:'none'}}/>
        <button onClick={submitDemande} style={{marginTop:8,padding:'10px 20px',borderRadius:8,border:'none',background:'linear-gradient(135deg,#c6a34e,#a07d3e)',color:'#060810',fontWeight:700,fontSize:12,cursor:'pointer'}}>📝 Soumettre</button>
      </div>
      {demandes.map((dem,i)=><div key={i} style={{padding:12,border:'1px solid rgba(255,255,255,.05)',borderRadius:10,marginBottom:6}}>
        <div style={{display:'flex',justifyContent:'space-between'}}>
          <span style={{fontSize:12,fontWeight:600,color:'#e5e5e5',textTransform:'capitalize'}}>{dem.type}</span>
          <span style={{fontSize:9,padding:'2px 8px',borderRadius:4,background:dem.status==='pending'?'rgba(234,179,8,.1)':'rgba(34,197,94,.1)',color:dem.status==='pending'?'#eab308':'#22c55e'}}>{dem.status==='pending'?'En attente':'Traite'}</span>
        </div>
        <div style={{fontSize:11,color:'#888',marginTop:4}}>{dem.desc}</div>
        <div style={{fontSize:9,color:'#555',marginTop:4}}>{new Date(dem.date).toLocaleString('fr-BE')}</div>
      </div>)}
    </div>}

    {tab==='messagerie'&&<div style={{border:'1px solid rgba(198,163,78,.1)',borderRadius:14,overflow:'hidden'}}>
      <div style={{padding:'10px 14px',background:'rgba(198,163,78,.04)',fontSize:12,fontWeight:600,color:'#c6a34e'}}>Messagerie avec votre gestionnaire</div>
      <div style={{height:300,overflowY:'auto',padding:12,display:'flex',flexDirection:'column',gap:6}}>
        {messages.map((m,i)=><div key={i} style={{alignSelf:m.from==='client'?'flex-end':'flex-start',maxWidth:'70%',padding:'8px 12px',borderRadius:10,background:m.from==='client'?'rgba(198,163,78,.1)':m.from==='gestionnaire'?'rgba(34,197,94,.06)':'rgba(59,130,246,.06)',border:'1px solid '+(m.from==='client'?'rgba(198,163,78,.15)':'rgba(255,255,255,.05)')}}>
          <div style={{fontSize:9,color:'#888',marginBottom:2}}>{m.from==='client'?'Vous':m.from==='gestionnaire'?'Gestionnaire':'Systeme'} — {new Date(m.date).toLocaleTimeString('fr-BE')}</div>
          <div style={{fontSize:11,color:'#e5e5e5'}}>{m.text}</div>
        </div>)}
      </div>
      <div style={{display:'flex',gap:8,padding:10,borderTop:'1px solid rgba(255,255,255,.05)'}}>
        <input value={msgInput} onChange={e=>setMsgInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')sendMsg();}} placeholder="Votre message..." style={{flex:1,padding:'8px 12px',background:'#090c16',border:'1px solid rgba(139,115,60,.15)',borderRadius:8,color:'#e5e5e5',fontSize:12,fontFamily:'inherit'}}/>
        <button onClick={sendMsg} style={{padding:'8px 16px',borderRadius:8,border:'none',background:'linear-gradient(135deg,#c6a34e,#a07d3e)',color:'#060810',fontWeight:700,fontSize:12,cursor:'pointer'}}>Envoyer</button>
      </div>
    </div>}

    {tab==='facturation'&&<div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:14}}>
        {[{l:'Forfait mensuel',v:'350,00 EUR',c:'#c6a34e'},{l:'Fiches/mois',v:emps.length+'',c:'#3b82f6'},{l:'Cout/fiche',v:emps.length>0?f2(350/emps.length)+' EUR':'N/A',c:'#22c55e'}].map((k,i)=>
          <div key={i} style={{padding:14,background:'linear-gradient(135deg,#0d1117,#131820)',border:'1px solid '+k.c+'15',borderRadius:12,textAlign:'center'}}>
            <div style={{fontSize:9,color:'#888'}}>{k.l}</div>
            <div style={{fontSize:18,fontWeight:700,color:k.c}}>{k.v}</div>
          </div>
        )}
      </div>
      <div style={{border:'1px solid rgba(198,163,78,.1)',borderRadius:14,overflow:'hidden'}}>
        <div style={{padding:'10px 14px',background:'rgba(198,163,78,.04)',fontSize:12,fontWeight:600,color:'#c6a34e'}}>Historique facturation</div>
        {[0,1,2,3,4,5].map(i=>{const d=new Date();d.setMonth(d.getMonth()-i);return <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'10px 14px',borderBottom:'1px solid rgba(255,255,255,.03)',alignItems:'center'}}>
          <div>
            <div style={{fontSize:12,color:'#e5e5e5'}}>{mois[d.getMonth()]} {d.getFullYear()}</div>
            <div style={{fontSize:10,color:'#888'}}>{emps.length} fiches traitees</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:13,fontWeight:600,color:'#c6a34e'}}>350,00 EUR</span>
            <span style={{fontSize:9,padding:'2px 8px',borderRadius:4,background:i===0?'rgba(234,179,8,.1)':'rgba(34,197,94,.1)',color:i===0?'#eab308':'#22c55e'}}>{i===0?'En cours':'Paye'}</span>
          </div>
        </div>;})}
      </div>
    </div>}
  </div>;
};

export default PortailClientSS;
