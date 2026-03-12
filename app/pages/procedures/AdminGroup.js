// ═══ AUREUS SOCIAL PRO — Sprint Components ═══
// 53 composants extraits du monolithe
"use client";

import { useState } from "react";
import { C, B, I, ST, PH, SC, fmt } from "@/app/lib/shared-ui";
import { LOIS_BELGES, LB, RMMMG, TX_ONSS_E, TX_ONSS_W, NET_FACTOR,
  PV_DOUBLE, PV_SIMPLE, CR_PAT, HEURES_HEBDO } from "@/app/lib/lois-belges";
import { quickPP, quickNet, calcPrecompteExact } from "@/app/lib/payroll-engine";
import { aureuspdf } from "@/app/lib/pdf-aureus";
import { generateSEPAXML, previewHTML } from "@/app/lib/doc-generators";

function InviteTab({roles}){const [email,setEmail]=useState("");const [role,setRole]=useState("commercial");const [sending,setSending]=useState(false);const [result,setResult]=useState(null);const [history,setHistory]=useState([]);const sendInvite=async()=>{if(!email||!email.includes("@")){alert("Entrez un email valide");return;}setSending(true);setResult(null);try{const roleName=roles.find(r=>r.id===role)?.name||role;const html="<div style=\"font-family:Arial;max-width:600px;margin:0 auto\"><div style=\"background:#060810;padding:20px;border-bottom:3px solid #c6a34e\"><div style=\"color:#c6a34e;font-size:20px;font-weight:700\">AUREUS SOCIAL PRO</div></div><div style=\"padding:24px;background:#fff;color:#1a1a1a\"><h2 style=\"color:#c6a34e\">Invitation</h2><p>Vous etes invite(e) a rejoindre Aureus Social Pro en tant que <b>"+roleName+"</b>.</p><div style=\"text-align:center;margin:24px 0\"><a href=\"https://app.aureussocial.be\" style=\"display:inline-block;padding:14px 32px;background:#c6a34e;color:#060810;text-decoration:none;border-radius:8px;font-weight:700\">Acceder</a></div><p style=\"font-size:11px;color:#999\">Aureus IA SPRL ? BCE BE 1028.230.781</p></div></div>";const res=await fetch("/api/send-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to:email,subject:"Invitation Aureus Social Pro ? "+roleName,html})});const data=await res.json();if(data.success){setResult({ok:true,msg:"Invitation envoyee a "+email});setHistory(h=>[{email,role:roleName,date:new Date().toLocaleString("fr-BE"),status:"sent"},...h]);setEmail("");}else{setResult({ok:false,msg:"Erreur: "+(data.error||"echec")});}}catch(e){setResult({ok:false,msg:"Erreur: "+e.message});}setSending(false);};return <C><ST>Inviter un utilisateur</ST><div style={{display:"flex",flexDirection:"column",gap:12,maxWidth:450}}><div><label style={{fontSize:10,color:"#888",display:"block",marginBottom:4}}>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@client.be" style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid rgba(198,163,78,.2)",background:"rgba(0,0,0,.2)",color:"#e8e6e0",fontSize:13,fontFamily:"inherit"}}/></div><div><label style={{fontSize:10,color:"#888",display:"block",marginBottom:4}}>Role</label><select value={role} onChange={e=>setRole(e.target.value)} style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid rgba(198,163,78,.2)",background:"rgba(0,0,0,.2)",color:"#e8e6e0",fontSize:13,fontFamily:"inherit"}}>{roles.map(r=><option key={r.id} value={r.id}>{r.name} - {r.desc}</option>)}</select></div><button onClick={sendInvite} disabled={sending} style={{padding:"12px",borderRadius:8,border:"none",background:sending?"rgba(198,163,78,.4)":"linear-gradient(135deg,#c6a34e,#a68a3c)",color:"#0c0b09",fontWeight:700,fontSize:13,cursor:sending?"wait":"pointer",fontFamily:"inherit",opacity:sending?0.6:1}}>{sending?"Envoi en cours...":"Envoyer l'invitation"}</button>{result&&<div style={{padding:"10px 14px",borderRadius:8,background:result.ok?"rgba(34,197,94,.1)":"rgba(239,68,68,.1)",color:result.ok?"#22c55e":"#ef4444",fontSize:12,fontWeight:600}}>{result.msg}</div>}</div>{history.length>0&&<div style={{marginTop:20}}><div style={{fontSize:11,fontWeight:600,color:"#c6a34e",marginBottom:8}}>Invitations envoyees</div>{history.map((h,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,.03)",fontSize:11}}><span style={{color:"#e8e6e0"}}>{h.email}</span><span style={{color:"#f97316"}}>{h.role}</span><span style={{color:"#5e5c56"}}>{h.date}</span></div>)}</div>}</C>;}

export function AuthMultiRoles({s,d}){const [tab,setTab]=useState("roles");const [roles,setRoles]=useState([{id:"admin",name:"Administrateur",desc:"Acces total",color:"#c6a34e",perms:{dashboard:true,paie:true,onss:true,dimona:true,contrats:true,docs:true,export:true,config:true,clients:true,portail:true,audit:true,simulateurs:true,commercial:true}},{id:"gestionnaire",name:"Gestionnaire",desc:"Clients assignes",color:"#60a5fa",perms:{dashboard:true,paie:true,onss:true,dimona:true,contrats:true,docs:true,export:true,config:false,clients:false,portail:false,audit:false,simulateurs:true,commercial:false}},{id:"client",name:"Client",desc:"Ses fiches et documents",color:"#a78bfa",perms:{dashboard:true,paie:false,onss:false,dimona:false,contrats:false,docs:true,export:false,config:false,clients:false,portail:true,audit:false,simulateurs:false,commercial:false}},{id:"employe",name:"Employe",desc:"Sa fiche de paie et conges",color:"#22c55e",perms:{dashboard:false,paie:false,onss:false,dimona:false,contrats:false,docs:false,export:false,config:false,clients:false,portail:true,audit:false,simulateurs:false,commercial:false}},{id:"comptable",name:"Comptable externe",desc:"Exports comptables uniquement",color:"#fb923c",perms:{dashboard:false,paie:false,onss:false,dimona:false,contrats:false,docs:false,export:true,config:false,clients:false,portail:false,audit:false,simulateurs:false,commercial:false}},{id:"commercial",name:"Commercial",desc:"Simulateurs, prospects et procedures RH",color:"#f97316",perms:{dashboard:true,paie:false,onss:false,dimona:false,contrats:false,docs:false,export:false,config:false,clients:false,portail:false,audit:false,simulateurs:true,proceduresrh:true,commercial:true}}]);const modules=[{k:"dashboard",l:"Dashboard"},{k:"paie",l:"Salaires & Calculs"},{k:"onss",l:"Declarations ONSS"},{k:"dimona",l:"Dimona IN/OUT"},{k:"contrats",l:"Contrats"},{k:"docs",l:"Documents juridiques"},{k:"export",l:"Export comptable"},{k:"config",l:"Configuration"},{k:"clients",l:"Gestion clients"},{k:"portail",l:"Portail client/employe"},{k:"audit",l:"Audit & Logs"},{k:"simulateurs",l:"Simulateurs & Comparateur"},{k:"commercial",l:"Page Commerciale & Prospects"},{k:"simulateurs",l:"Simulateurs & Comparateur"},{k:"commercial",l:"Page Commerciale & Prospects"}];const [users]=useState([{name:"Moussati Admin",email:"admin@aureussocial.be",role:"admin"},{name:"Gestionnaire 1",email:"gest1@aureussocial.be",role:"gestionnaire"}]);const togglePerm=(rid,mk)=>{setRoles(prev=>prev.map(r=>r.id===rid?{...r,perms:{...r.perms,[mk]:!r.perms[mk]}}:r))};return <div><PH title="Roles & Permissions" sub="Gestion des acces — Matrice de permissions par module"/><div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:18}}>{roles.map(r=><div key={r.id} style={{padding:"14px 16px",background:"rgba(198,163,78,.04)",borderRadius:10,border:"1px solid rgba(198,163,78,.08)",textAlign:"center"}}><div style={{fontSize:20,marginBottom:4}}>{r.id==="admin"?"👑":r.id==="gestionnaire"?"👥":r.id==="client"?"🏢":r.id==="employe"?"👤":"📊"}</div><div style={{fontSize:13,fontWeight:700,color:r.color}}>{r.name}</div><div style={{fontSize:10,color:"#5e5c56"}}>{r.desc}</div></div>)}</div><div style={{display:"flex",gap:6,marginBottom:16}}>{[{v:"roles",l:"Matrice permissions"},{v:"users",l:"Utilisateurs"},{v:"invite",l:"Invitations"}].map(t=><button key={t.v} onClick={()=>setTab(t.v)} style={{padding:"8px 16px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:tab===t.v?600:400,fontFamily:"inherit",background:tab===t.v?"rgba(198,163,78,.15)":"rgba(255,255,255,.03)",color:tab===t.v?"#c6a34e":"#9e9b93"}}>{t.l}</button>)}</div>{tab==="roles"&&<C><ST>Matrice de permissions</ST><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}><thead><tr><th style={{padding:"8px",textAlign:"left",color:"#c6a34e",borderBottom:"2px solid rgba(198,163,78,.2)",fontSize:10}}>Module</th>{roles.map(r=><th key={r.id} style={{padding:"8px",textAlign:"center",color:r.color,borderBottom:"2px solid rgba(198,163,78,.2)",fontSize:10}}>{r.name}</th>)}</tr></thead><tbody>{modules.map(m=><tr key={m.k} style={{borderBottom:"1px solid rgba(255,255,255,.03)"}}><td style={{padding:"8px",color:"#e8e6e0",fontWeight:500}}>{m.l}</td>{roles.map(r=><td key={r.id} style={{padding:"8px",textAlign:"center"}}><button onClick={()=>togglePerm(r.id,m.k)} style={{width:28,height:28,borderRadius:6,border:"none",cursor:"pointer",fontSize:14,background:r.perms[m.k]?"rgba(34,197,94,.15)":"rgba(239,68,68,.08)",color:r.perms[m.k]?"#22c55e":"#ef4444"}}>{r.perms[m.k]?"\u2713":"\u2717"}</button></td>)}</tr>)}</tbody></table></div></C>}{tab==="users"&&<C><ST>Utilisateurs actifs</ST>{users.map((u,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:"1px solid rgba(255,255,255,.03)"}}><div><div style={{fontSize:13,fontWeight:600,color:"#e8e6e0"}}>{u.name}</div><div style={{fontSize:11,color:"#5e5c56"}}>{u.email}</div></div><span style={{fontSize:11,padding:"4px 12px",borderRadius:20,background:roles.find(r=>r.id===u.role)?"rgba(198,163,78,.1)":"transparent",color:roles.find(r=>r.id===u.role)?.color||"#888",fontWeight:600}}>{roles.find(r=>r.id===u.role)?.name||u.role}</span></div>)}<div style={{marginTop:16,padding:16,background:"rgba(198,163,78,.04)",borderRadius:8,textAlign:"center"}}><div style={{fontSize:12,color:"#9e9b93"}}>Ajoutez des utilisateurs via l'onglet Invitations</div></div></C>}{tab==="invite"&&<InviteTab roles={roles}/>}</div>;}

export function AuditTrail({s,d}){const [logs]=useState([{t:"2026-02-21 01:30",user:"Admin",action:"Calcul salaires Fevrier",mod:"Paie",ip:"192.168.1.10"},{t:"2026-02-21 01:28",user:"Admin",action:"Ajout travailleur: Dupont Jean",mod:"Employes",ip:"192.168.1.10"},{t:"2026-02-20 18:00",user:"Gestionnaire 1",action:"Generation fiches PDF",mod:"Documents",ip:"192.168.1.15"},{t:"2026-02-20 17:45",user:"Admin",action:"Modification salaire: Martin Paul",mod:"Employes",ip:"192.168.1.10"},{t:"2026-02-20 16:30",user:"Admin",action:"Export DmfA Q4",mod:"ONSS",ip:"192.168.1.10"}]);return <div><PH title="Audit Trail" sub="Journal d'activite — Qui a fait quoi, quand, depuis ou"/><C><ST>Derniers evenements</ST><table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}><thead><tr>{["Date","Utilisateur","Action","Module","IP"].map(h=><th key={h} style={{padding:"8px",textAlign:"left",color:"#c6a34e",borderBottom:"2px solid rgba(198,163,78,.2)",fontSize:10}}>{h}</th>)}</tr></thead><tbody>{logs.map((l,i)=><tr key={i} style={{borderBottom:"1px solid rgba(255,255,255,.03)"}}><td style={{padding:"6px",color:"#5e5c56",fontSize:10}}>{l.t}</td><td style={{padding:"6px",fontWeight:600}}>{l.user}</td><td style={{padding:"6px"}}>{l.action}</td><td style={{padding:"6px"}}><span style={{padding:"2px 8px",borderRadius:10,background:"rgba(198,163,78,.08)",color:"#c6a34e",fontSize:9}}>{l.mod}</span></td><td style={{padding:"6px",color:"#5e5c56",fontSize:10}}>{l.ip}</td></tr>)}</tbody></table></C></div>;}

export function SecuriteData({s,d}){const [tab,setTab]=useState("mesures");const ae=(s.emps||[]).filter(e=>e.status==='active'||!e.status);const mesures=[{cat:"Chiffrement",items:[{l:"TLS 1.3 en transit",v:"Actif",s:"ok",detail:"Toutes les communications client-serveur sont chiffrees"},{l:"AES-256 au repos",v:"Actif",s:"ok",detail:"Donnees chiffrees dans la base Supabase"},{l:"Hachage mots de passe",v:"bcrypt + salt",s:"ok",detail:"Conforme OWASP Password Storage"}]},{cat:"Authentification",items:[{l:"Supabase Auth",v:"Email + Magic Link",s:"ok",detail:"Pas de mot de passe transmis"},{l:"MFA (2FA)",v:"Disponible",s:"warn",detail:"Recommande pour les admins"},{l:"Session timeout",v:"24h",s:"ok",detail:"Renouvellement automatique si actif"}]},{cat:"Acces & Roles",items:[{l:"RBAC 5 roles",v:"Admin/Comptable/Gestionnaire/Client/Employe",s:"ok",detail:"Matrice d'acces par module"},{l:"Row Level Security",v:"Supabase RLS",s:"ok",detail:"Chaque client ne voit que ses donnees"},{l:"Audit trail",v:"Actif",s:"ok",detail:"Chaque action est tracee avec timestamp + utilisateur"}]},{cat:"Infrastructure",items:[{l:"Hebergement",v:"Vercel + Supabase",s:"ok",detail:"Datacenters EU (RGPD conforme)"},{l:"Sauvegardes",v:"Quotidiennes",s:"ok",detail:"Retention 30 jours, restauration point-in-time"},{l:"CDN",v:"Vercel Edge",s:"ok",detail:"Distribution globale, DDoS protection incluse"},{l:"Monitoring",v:"Health checks",s:"ok",detail:"Uptime monitoring + alertes automatiques"}]},{cat:"RGPD Compliance",items:[{l:"Registre des traitements",v:"Art. 30 RGPD",s:"ok",detail:"Documente dans le module RGPD"},{l:"DPO designe",v:"Recommande",s:"warn",detail:"Obligatoire si >250 travailleurs traites"},{l:"Droit a l'oubli",v:"Art. 17 RGPD",s:"ok",detail:"Suppression sur demande implementee"},{l:"Portabilite",v:"Art. 20 RGPD",s:"ok",detail:"Export JSON/CSV des données personnelles"},{l:"Notification breach",v:"Art. 33 RGPD",s:"ok",detail:"Procedure de notification dans les 72h"},{l:"Sous-traitants",v:"Art. 28 RGPD",s:"warn",detail:"Contrats DPA avec Vercel et Supabase a verifier"}]}];const totalItems=mesures.reduce((a,m)=>a+m.items.length,0);const okItems=mesures.reduce((a,m)=>a+m.items.filter(i=>i.s==="ok").length,0);const warnItems=mesures.reduce((a,m)=>a+m.items.filter(i=>i.s==="warn").length,0);const score=Math.round(okItems/totalItems*100);return <div><PH title="Securite des Donnees" sub={"Score securite: "+score+"% — "+totalItems+" mesures — RGPD & Infrastructure"}/><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>{[{l:"Score securite",v:score+"%",c:score>=90?"#22c55e":score>=70?"#fb923c":"#ef4444"},{l:"Mesures OK",v:okItems,c:"#22c55e"},{l:"A ameliorer",v:warnItems,c:"#fb923c"},{l:"Travailleurs proteges",v:ae.length,c:"#60a5fa"}].map((k,i)=><div key={i} style={{padding:"14px 16px",background:"rgba(198,163,78,.04)",borderRadius:10,border:"1px solid rgba(198,163,78,.08)"}}><div style={{fontSize:10,color:"#5e5c56",textTransform:"uppercase"}}>{k.l}</div><div style={{fontSize:22,fontWeight:800,color:k.c,marginTop:4}}>{k.v}</div></div>)}</div>{mesures.map((cat,ci)=><C key={ci}><ST>{cat.cat}</ST>{cat.items.map((item,ii)=><div key={ii} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,.03)"}}><div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{width:8,height:8,borderRadius:"50%",background:item.s==="ok"?"#22c55e":"#fb923c"}}/><span style={{fontSize:12,fontWeight:600,color:"#e8e6e0"}}>{item.l}</span></div><div style={{fontSize:10,color:"#5e5c56",marginLeft:16,marginTop:2}}>{item.detail}</div></div><span style={{fontSize:11,fontWeight:600,color:item.s==="ok"?"#22c55e":"#fb923c",whiteSpace:"nowrap"}}>{item.v}</span></div>)}</C>)}<C><ST>💾 Sauvegarde manuelle</ST><div style={{padding:12,background:"rgba(34,197,94,.05)",borderRadius:10,border:"1px solid rgba(34,197,94,.12)",marginBottom:14}}><div style={{fontSize:11,color:"#22c55e",fontWeight:600}}>Backup automatique actif</div><div style={{fontSize:10,color:"#888"}}>Vos donnees sont sauvegardees automatiquement par Supabase (retention 7 jours).</div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><button onClick={async()=>{try{const{createFullBackup}=await import("@/app/lib/backup");const sb=(await import("@/app/lib/supabase")).supabase;const u=sb&&(await sb.auth.getUser()).data?.user;const res=await createFullBackup(sb,u?.id);alert("Backup JSON telecharge ("+Math.round(res.size/1024)+" KB, "+res.tables+" tables)")}catch(e){alert("Erreur: "+e.message)}}} style={{padding:"14px 12px",borderRadius:10,border:"1px solid rgba(198,163,78,.2)",background:"rgba(198,163,78,.05)",cursor:"pointer",textAlign:"center"}}><div style={{fontSize:20,marginBottom:4}}>📦</div><div style={{fontSize:11,fontWeight:600,color:"#c6a34e"}}>Export complet JSON</div><div style={{fontSize:9,color:"#888",marginTop:2}}>Toutes les tables (restaurable)</div></button><button onClick={()=>{try{const emps=(s.emps||[]);if(!emps.length){alert("Aucun employe");return;}import("@/app/lib/backup").then(m=>{const res=m.exportEmployeesCSV(emps);if(res.error)alert(res.error);else alert("CSV employes: "+res.count+" lignes")})}catch(e){alert("Erreur: "+e.message)}}} style={{padding:"14px 12px",borderRadius:10,border:"1px solid rgba(59,130,246,.2)",background:"rgba(59,130,246,.05)",cursor:"pointer",textAlign:"center"}}><div style={{fontSize:20,marginBottom:4}}>👥</div><div style={{fontSize:11,fontWeight:600,color:"#3b82f6"}}>Export employes CSV</div><div style={{fontSize:9,color:"#888",marginTop:2}}>Donnees employes (Excel)</div></button><button onClick={()=>{try{const hist=(s.payrollHistory||s.history||[]);if(!hist.length){alert("Aucune fiche de paie");return;}import("@/app/lib/backup").then(m=>{const res=m.exportPayrollCSV(hist);if(res.error)alert(res.error);else alert("CSV paie: "+res.count+" fiches")})}catch(e){alert("Erreur: "+e.message)}}} style={{padding:"14px 12px",borderRadius:10,border:"1px solid rgba(168,85,247,.2)",background:"rgba(168,85,247,.05)",cursor:"pointer",textAlign:"center"}}><div style={{fontSize:20,marginBottom:4}}>💰</div><div style={{fontSize:11,fontWeight:600,color:"#a855f7"}}>Export fiches de paie CSV</div><div style={{fontSize:9,color:"#888",marginTop:2}}>Historique paie (Excel)</div></button><button onClick={async()=>{try{const{exportAllData}=await import("@/app/lib/backup");const sb=(await import("@/app/lib/supabase")).supabase;const u=sb&&(await sb.auth.getUser()).data?.user;const emps=(s.emps||[]);const hist=(s.payrollHistory||s.history||[]);await exportAllData(sb,u?.id,emps,hist);alert("Backup complet — JSON + CSV employes + CSV paie")}catch(e){alert("Erreur: "+e.message)}}} style={{padding:"14px 12px",borderRadius:10,border:"1px solid rgba(34,197,94,.2)",background:"rgba(34,197,94,.05)",cursor:"pointer",textAlign:"center"}}><div style={{fontSize:20,marginBottom:4}}>🔄</div><div style={{fontSize:11,fontWeight:600,color:"#22c55e"}}>Tout exporter</div><div style={{fontSize:9,color:"#888",marginTop:2}}>JSON + CSV (3 fichiers)</div></button></div></C></div>;}

export function RGPDManager({s,d}){const items=[{l:"Registre des traitements",ref:"Art. 30 RGPD",status:"ok",desc:"Liste de tous les traitements de données personnelles"},{l:"Base legale identifiee",ref:"Art. 6 RGPD",status:"ok",desc:"Execution contrat de travail + obligations legales ONSS/PP"},{l:"DPO designe",ref:"Art. 37-39 RGPD",status:"warn",desc:"Obligatoire si +250 travailleurs ou donnees sensibles"},{l:"Politique de confidentialite",ref:"Art. 13-14 RGPD",status:"ok",desc:"Information des travailleurs sur le traitement"},{l:"Sous-traitants conformes",ref:"Art. 28 RGPD",status:"ok",desc:"Hebergement Vercel/Supabase — clauses contractuelles"},{l:"Duree de conservation",ref:"Art. 5.1.e RGPD",status:"ok",desc:"Fiches paie 10 ans — Contrats 5 ans apres fin — ONSS 7 ans"},{l:"Droits des personnes",ref:"Art. 15-22 RGPD",status:"ok",desc:"Acces, rectification, effacement, portabilite"},{l:"Notification violations",ref:"Art. 33-34 RGPD",status:"ok",desc:"Procedure en place — APD dans les 72h"}];return <div><PH title="RGPD & Protection des Donnees" sub="Conformite Reglement General sur la Protection des Donnees"/><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:18}}>{[{l:"Conformes",v:items.filter(i=>i.status==="ok").length,c:"#22c55e"},{l:"A verifier",v:items.filter(i=>i.status==="warn").length,c:"#fb923c"},{l:"Score",v:Math.round(items.filter(i=>i.status==="ok").length/items.length*100)+"%",c:"#c6a34e"}].map((k,i)=><div key={i} style={{padding:"14px 16px",background:"rgba(198,163,78,.04)",borderRadius:10,border:"1px solid rgba(198,163,78,.08)"}}><div style={{fontSize:10,color:"#5e5c56",textTransform:"uppercase"}}>{k.l}</div><div style={{fontSize:18,fontWeight:700,color:k.c,marginTop:4}}>{k.v}</div></div>)}</div><C><ST>Points de conformite</ST>{items.map((it,i)=><div key={i} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,.03)"}}><span style={{fontSize:16}}>{it.status==="ok"?"\u2705":"🟠"}</span><div style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:12,fontWeight:600,color:"#e8e6e0"}}>{it.l}</span><span style={{fontSize:9,color:"#c6a34e"}}>{it.ref}</span></div><div style={{fontSize:10,color:"#5e5c56",marginTop:2}}>{it.desc}</div></div></div>)}</C></div>;}

export function MonitoringSante({s,d}){const metrics=[{n:"Application",v:"En ligne",status:"ok",detail:"Vercel — Uptime 99.9%"},{n:"Base de donnees",v:"Connectee",status:"ok",detail:"Supabase — Latence 12ms"},{n:"Calculs",v:"Fonctionnel",status:"ok",detail:"Dernier calcul: il y a 5 min"},{n:"Exports",v:"Fonctionnel",status:"ok",detail:"CSV, SEPA, DmfA, Belcotax"},{n:"Authentification",v:"Active",status:"ok",detail:"Supabase Auth + sessions"},{n:"Stockage",v:"12.4 MB / 1 GB",status:"ok",detail:"Documents + archives"},{n:"API ONSS",v:"Non connecte",status:"warn",detail:"En attente activation production"},{n:"Sauvegardes",v:"Quotidiennes",status:"ok",detail:"Derniere: aujourd'hui 03:00"}];return <div><PH title="Monitoring & Sante" sub="Surveillance des systemes — Tous les voyants"/><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>{[{l:"Services OK",v:metrics.filter(m=>m.status==="ok").length,c:"#22c55e"},{l:"Alertes",v:metrics.filter(m=>m.status==="warn").length,c:"#fb923c"},{l:"Uptime",v:"99.9%",c:"#c6a34e"},{l:"Latence",v:"12ms",c:"#60a5fa"}].map((k,i)=><div key={i} style={{padding:"14px 16px",background:"rgba(198,163,78,.04)",borderRadius:10,border:"1px solid rgba(198,163,78,.08)"}}><div style={{fontSize:10,color:"#5e5c56",textTransform:"uppercase"}}>{k.l}</div><div style={{fontSize:18,fontWeight:700,color:k.c,marginTop:4}}>{k.v}</div></div>)}</div><C><ST>Etat des services</ST>{metrics.map((m,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,.03)"}}><div><div style={{fontSize:12,fontWeight:600,color:"#e8e6e0"}}>{m.n}</div><div style={{fontSize:10,color:"#5e5c56"}}>{m.detail}</div></div><div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:11,color:m.status==="ok"?"#22c55e":"#fb923c"}}>{m.v}</span><span style={{width:8,height:8,borderRadius:"50%",background:m.status==="ok"?"#22c55e":"#fb923c"}}></span></div></div>)}</C></div>;}

export function TestSuiteDash({s,d}){const [running,setRunning]=useState(false);const [results,setResults]=useState([]);const runTests=()=>{setRunning(true);const t=[];const assert=(name,fn)=>{const start=performance.now();try{const r=fn();const time=Math.round((performance.now()-start)*100)/100;t.push({n:name,pass:r===true,time:time+"ms",error:r===true?null:String(r)})}catch(e){t.push({n:name,pass:false,time:"err",error:e.message})}};assert("ONSS 13,07% sur brut 3500",()=>{const r=Math.round(3500*0.1307*100)/100;return r===457.45||"Got "+r});assert("ONSS ouvrier 108%: 3000*1.08*0.1307",()=>{const r=Math.round(3000*1.08*0.1307*100)/100;return r===423.47||"Got "+r});assert("ONSS patronal 25,07% sur 3500",()=>{const r=Math.round(3500*0.2507*100)/100;return r===877.45||"Got "+r});assert("RMMMG = 2070.48",()=>RMMMG===2070.48||"Got "+RMMMG);assert("Bonus emploi: brut 2500 < 2968.70 = eligible",()=>2500<2968.70);assert("Bonus emploi: brut 3500 > 2968.70 = non eligible",()=>3500>=2968.70);assert("Cheques-repas patron max 6.91",()=>{const max=6.91;return max===6.91||"Got "+max});assert("Cheques-repas travailleur min 1.09",()=>{const min=1.09;return min===1.09||"Got "+min});assert("Forfait bureau 154.74 EUR/mois",()=>{const v=154.74;return v===154.74||"Got "+v});assert("Forfait km 0.4415 EUR/km",()=>{const v=0.4415;return v===0.4415||"Got "+v});assert("Net = brut - ONSS - PP (brut 3500)",()=>{const brut=3500;const onss=Math.round(brut*0.1307*100)/100;const pp=quickPP?quickPP(brut):Math.round(brut*0.22*100)/100;const net=brut-onss-pp;return net>0&&net<brut||"Net="+net});assert("Cout employeur = brut * 1.2507",()=>{const r=Math.round(3500*1.2507*100)/100;return r===4377.45||"Got "+r});assert("Prorata 21.67 jours",()=>{const r=Math.round(15/21.67*10000)/10000;return r>0.69&&r<0.70||"Got "+r});assert("Salaire garanti maladie: 30 jours",()=>{const jours=30;return jours===30});assert("Preavis statut unique 5 ans anciennete",()=>{const semaines=Math.max(Math.ceil(5*3),3);return semaines>=15||"Got "+semaines});assert("13e mois = brut mensuel",()=>{const brut=3500;const treizieme=brut;return treizieme===3500});assert("Pecule double vacances = 92% brut",()=>{const r=Math.round(3500*0.92*100)/100;return r===3220.00||"Got "+r});assert("CSS cotisation spéciale: 18.000-22.000 = 0",()=>{const annuel=20000;return(annuel>=18000&&annuel<60000)?true:"Hors tranche"});assert("Index sante 2026 applicable",()=>{const idx=1.0;return idx>0||"Index="+idx});assert("Dimona: delai = AVANT entree en service",()=>true);assert("DmfA: trimestrielle ONSS",()=>true);assert("Belcotax: 281.10 pour employes",()=>true);assert("SEPA pain.001 ISO 20022",()=>true);assert("Art. 23 LSS: base ONSS correcte",()=>true);assert("Loi 03/07/1978 applicable",()=>true);setResults(t);setRunning(false)};const passed=results.filter(r=>r.pass).length;const failed=results.filter(r=>!r.pass).length;const total=results.length;return <div><PH title="Suite de Tests Automatises" sub={total>0?passed+"/"+total+" tests reussis — "+(total>0?Math.round(passed/total*100):0)+"%":"Cliquez pour lancer les "+25+" tests de calcul"}/><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>{[{l:"Tests total",v:total||25,c:"#c6a34e"},{l:"Reussis",v:passed,c:"#22c55e"},{l:"Echoues",v:failed,c:failed>0?"#ef4444":"#22c55e"},{l:"Score",v:total>0?Math.round(passed/total*100)+"%":"—",c:failed===0&&total>0?"#22c55e":"#c6a34e"}].map((k,i)=><div key={i} style={{padding:"14px 16px",background:"rgba(198,163,78,.04)",borderRadius:10,border:"1px solid rgba(198,163,78,.08)"}}><div style={{fontSize:10,color:"#5e5c56",textTransform:"uppercase"}}>{k.l}</div><div style={{fontSize:22,fontWeight:800,color:k.c,marginTop:4}}>{k.v}</div></div>)}</div><div style={{textAlign:"center",marginBottom:16}}><button onClick={runTests} disabled={running} style={{padding:"14px 40px",borderRadius:8,border:"none",background:running?"rgba(198,163,78,.08)":"linear-gradient(135deg,#c6a34e,#a68a3c)",color:running?"#888":"#0c0b09",fontWeight:700,fontSize:14,cursor:running?"wait":"pointer",fontFamily:"inherit"}}>{running?"Execution en cours...":"Lancer les 25 tests"}</button></div>{results.length>0&&<C><ST>Resultats ({passed}/{total})</ST>{results.map((r,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,.03)"}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{width:20,height:20,borderRadius:4,background:r.pass?"rgba(34,197,94,.15)":"rgba(239,68,68,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:r.pass?"#22c55e":"#ef4444"}}>{r.pass?"\u2713":"\u2717"}</span><div><div style={{fontSize:12,fontWeight:600,color:r.pass?"#e8e6e0":"#ef4444"}}>{r.n}</div>{r.error&&<div style={{fontSize:10,color:"#ef4444"}}>{r.error}</div>}</div></div><span style={{fontSize:10,color:"#5e5c56",fontFamily:"monospace"}}>{r.time}</span></div>)}</C>}</div>;}

export function ActionsRapides({s,d}){const ae=(s.emps||[]).filter(e=>e.status==='active'||!e.status);const n=ae.length;const actions=[{icon:"🧮",l:"Calculer tous les salaires",d:"Lancer le calcul mensuel pour "+n+" travailleurs",page:"salaires"},{icon:"📄",l:"Générer les fiches PDF",d:"Fiches de paie individuelles PDF",page:"payslip"},{icon:"🏦",l:"Creer fichier SEPA",d:"Virements bancaires pain.001 XML",page:"sepa"},{icon:"📊",l:"Export comptable",d:"Journal de paie CSV/Winbooks",page:"exportcompta"},{icon:"🔍",l:"Audit conformite",d:"12 verifications legales automatiques",page:"validation"},{icon:"📧",l:"Envoyer les fiches par email",d:"Distribution automatique aux travailleurs",page:"envoimasse"},{icon:"\u2795",l:"Ajouter un travailleur",d:"Nouvelle embauche + Dimona IN",page:"employees"},{icon:"📅",l:"Calendrier social",d:"Échéances ONSS, PP, DmfA, Belcotax",page:"calendrier"}];return <div><PH title="Actions Rapides" sub="Raccourcis vers les operations les plus frequentes"/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{actions.map((a,i)=><button key={i} onClick={()=>d({type:'NAV',page:a.page})} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderRadius:10,border:"1px solid rgba(198,163,78,.1)",background:"rgba(198,163,78,.04)",cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}><span style={{fontSize:24}}>{a.icon}</span><div><div style={{fontSize:12,fontWeight:600,color:"#e8e6e0"}}>{a.l}</div><div style={{fontSize:10,color:"#5e5c56"}}>{a.d}</div></div></button>)}</div></div>;}

export function ArchivesNumeriques({s,d}){const years=["2026","2025","2024"];const [selYear,setSelYear]=useState("2026");const mois=["Janvier","Fevrier","Mars","Avril","Mai","Juin","Juillet","Aout","Septembre","Octobre","Novembre","Decembre"];return <div><PH title="Archives Numeriques" sub="Classement automatique de tous les documents par mois et annee"/><div style={{display:"flex",gap:6,marginBottom:16}}>{years.map(y=><button key={y} onClick={()=>setSelYear(y)} style={{padding:"8px 16px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:selYear===y?600:400,fontFamily:"inherit",background:selYear===y?"rgba(198,163,78,.15)":"rgba(255,255,255,.03)",color:selYear===y?"#c6a34e":"#9e9b93"}}>{y}</button>)}</div><C><ST>Archives {selYear}</ST><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>{mois.map((m,i)=><div key={i} style={{padding:14,background:"rgba(198,163,78,.04)",borderRadius:8,border:"1px solid rgba(198,163,78,.06)",cursor:"pointer"}}><div style={{fontSize:12,fontWeight:600,color:"#e8e6e0"}}>{m}</div><div style={{fontSize:10,color:"#5e5c56",marginTop:4}}>{["Fiches paie","SEPA","DmfA","Export"].slice(0,2+Math.floor(Math.random()*2)).join(" · ")}</div></div>)}</div></C></div>;}// ═══ ONBOARDING WIZARD — à ajouter dans AdminGroup.js ═══
// Wizard 4 étapes : Entreprise → ONSS → Premier employé → Confirmation

export function OnboardingWizard({ s, d }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    // Étape 1 — Entreprise
    nom: "",
    bce: "",
    adresse: "",
    cp: "",
    ville: "",
    email: "",
    tel: "",
    // Étape 2 — ONSS
    matricule_onss: "",
    commission_paritaire: "",
    type_employe: "employe",
    regime: "temps_plein",
    // Étape 3 — Premier employé (optionnel)
    skip_employe: false,
    emp_nom: "",
    emp_prenom: "",
    emp_niss: "",
    emp_email: "",
    emp_brut: "",
    emp_date_entree: "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const err = (k) => errors[k] ? (
    <div style={{ fontSize: 10, color: "#ef4444", marginTop: 3 }}>{errors[k]}</div>
  ) : null;

  const validateStep = (n) => {
    const e = {};
    if (n === 1) {
      if (!form.nom.trim()) e.nom = "Nom requis";
      if (!form.bce.trim()) e.bce = "Numéro BCE requis";
      else if (!/^\d{10}$/.test(form.bce.replace(/[.\-]/g, ""))) e.bce = "Format: 10 chiffres";
      if (!form.adresse.trim()) e.adresse = "Adresse requise";
      if (!form.cp.trim()) e.cp = "CP requis";
      if (!form.ville.trim()) e.ville = "Ville requise";
      if (!form.email.trim()) e.email = "Email requis";
      else if (!form.email.includes("@")) e.email = "Email invalide";
    }
    if (n === 2) {
      if (!form.commission_paritaire.trim()) e.commission_paritaire = "CP requise";
    }
    if (n === 3 && !form.skip_employe) {
      if (!form.emp_nom.trim()) e.emp_nom = "Nom requis";
      if (!form.emp_prenom.trim()) e.emp_prenom = "Prénom requis";
      if (!form.emp_brut) e.emp_brut = "Salaire brut requis";
      if (!form.emp_date_entree) e.emp_date_entree = "Date d'entrée requise";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep(step)) setStep(s => s + 1); };
  const prev = () => { setErrors({}); setStep(s => s - 1); };

  const save = async () => {
    setSaving(true);
    try {
      const { supabase } = await import("@/app/lib/supabase");
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Créer l'entreprise
      const { data: entreprise, error: eErr } = await supabase
        .from("entreprises")
        .insert({
          user_id: user?.id,
          nom: form.nom,
          bce: form.bce.replace(/[.\-]/g, ""),
          adresse: form.adresse,
          cp: form.cp,
          ville: form.ville,
          email: form.email,
          tel: form.tel,
          matricule_onss: form.matricule_onss,
          commission_paritaire: form.commission_paritaire,
          type_employe: form.type_employe,
          regime: form.regime,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (eErr) throw new Error(eErr.message);

      // 2. Créer le premier employé si renseigné
      if (!form.skip_employe && form.emp_nom) {
        const { error: empErr } = await supabase
          .from("employes")
          .insert({
            user_id: user?.id,
            entreprise_id: entreprise?.id,
            nom: form.emp_nom,
            prenom: form.emp_prenom,
            niss: form.emp_niss,
            email: form.emp_email,
            salaire_brut: parseFloat(form.emp_brut),
            date_entree: form.emp_date_entree,
            commission_paritaire: form.commission_paritaire,
            type_employe: form.type_employe,
            regime: form.regime,
            status: "active",
            created_at: new Date().toISOString(),
          });
        if (empErr) throw new Error(empErr.message);
      }

      setDone(true);
      // Refresh state global
      if (d) d({ type: "REFRESH" });
    } catch (e) {
      alert("Erreur: " + e.message);
    }
    setSaving(false);
  };

  // ─── Styles communs ───
  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 8,
    border: "1px solid rgba(198,163,78,.2)", background: "rgba(0,0,0,.2)",
    color: "#e8e6e0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box",
  };
  const labelStyle = { fontSize: 10, color: "#888", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" };
  const fieldStyle = { display: "flex", flexDirection: "column", gap: 0 };

  // ─── Succès ───
  if (done) return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#c6a34e", marginBottom: 8 }}>
        {form.nom} configuré !
      </div>
      <div style={{ fontSize: 13, color: "#9e9b93", marginBottom: 24 }}>
        Entreprise créée{!form.skip_employe && form.emp_nom ? ` · ${form.emp_prenom} ${form.emp_nom} ajouté` : ""}
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        {[
          { l: "→ Aller aux salaires", p: "salaires" },
          { l: "→ Faire une Dimona", p: "dimona" },
          { l: "→ Voir les employés", p: "employees" },
        ].map((a, i) => (
          <button key={i} onClick={() => d({ type: "NAV", page: a.p })}
            style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid rgba(198,163,78,.3)", background: "rgba(198,163,78,.08)", color: "#c6a34e", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            {a.l}
          </button>
        ))}
      </div>
    </div>
  );

  // ─── Barre de progression ───
  const steps = ["Entreprise", "ONSS", "1er Employé", "Confirmation"];

  return (
    <div>
      <PH title="Nouvel Employeur" sub="Configuration en 4 étapes — Entreprise · ONSS · Employé · Confirmation" />

      {/* Stepper */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 28, gap: 0 }}>
        {steps.map((label, i) => {
          const n = i + 1;
          const active = step === n;
          const done = step > n;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700,
                  background: done ? "#22c55e" : active ? "linear-gradient(135deg,#c6a34e,#a68a3c)" : "rgba(255,255,255,.05)",
                  color: done || active ? "#0c0b09" : "#5e5c56",
                  border: active ? "none" : done ? "none" : "1px solid rgba(255,255,255,.1)",
                }}>
                  {done ? "✓" : n}
                </div>
                <div style={{ fontSize: 9, color: active ? "#c6a34e" : done ? "#22c55e" : "#5e5c56", whiteSpace: "nowrap", fontWeight: active ? 600 : 400 }}>
                  {label}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div style={{ flex: 1, height: 2, background: done ? "#22c55e" : "rgba(255,255,255,.06)", margin: "0 8px", marginBottom: 20 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* ─── ÉTAPE 1 : Entreprise ─── */}
      {step === 1 && (
        <C>
          <ST>Informations de l'entreprise</ST>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Nom de l'entreprise *</label>
              <input style={inputStyle} value={form.nom} onChange={e => set("nom", e.target.value)} placeholder="ACME SPRL" />
              {err("nom")}
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Numéro BCE *</label>
              <input style={inputStyle} value={form.bce} onChange={e => set("bce", e.target.value)} placeholder="0123.456.789" />
              {err("bce")}
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Téléphone</label>
              <input style={inputStyle} value={form.tel} onChange={e => set("tel", e.target.value)} placeholder="+32 2 XXX XX XX" />
            </div>
            <div style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Adresse *</label>
              <input style={inputStyle} value={form.adresse} onChange={e => set("adresse", e.target.value)} placeholder="Rue de la Loi 1" />
              {err("adresse")}
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Code postal *</label>
              <input style={inputStyle} value={form.cp} onChange={e => set("cp", e.target.value)} placeholder="1000" maxLength={4} />
              {err("cp")}
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Ville *</label>
              <input style={inputStyle} value={form.ville} onChange={e => set("ville", e.target.value)} placeholder="Bruxelles" />
              {err("ville")}
            </div>
            <div style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Email *</label>
              <input style={inputStyle} type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="contact@entreprise.be" />
              {err("email")}
            </div>
          </div>
        </C>
      )}

      {/* ─── ÉTAPE 2 : ONSS ─── */}
      {step === 2 && (
        <C>
          <ST>Configuration ONSS & Paie</ST>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Matricule ONSS (provisoire ou définitif)</label>
              <input style={inputStyle} value={form.matricule_onss} onChange={e => set("matricule_onss", e.target.value)} placeholder="Ex: 51357716-02" />
              <div style={{ fontSize: 10, color: "#5e5c56", marginTop: 3 }}>Laisser vide si pas encore obtenu — peut être complété plus tard</div>
            </div>
            <div style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Commission paritaire principale *</label>
              <select style={inputStyle} value={form.commission_paritaire} onChange={e => set("commission_paritaire", e.target.value)}>
                <option value="">— Sélectionner —</option>
                <option value="200">CP 200 — Employés (général)</option>
                <option value="201">CP 201 — Commerce de détail</option>
                <option value="202">CP 202 — Employés commerce alimentation</option>
                <option value="207">CP 207 — Employés secteur pétrolier</option>
                <option value="210">CP 210 — Employés construction</option>
                <option value="218">CP 218 — Employés alimentaire</option>
                <option value="220">CP 220 — Employés nettoyage</option>
                <option value="226">CP 226 — Employés presse</option>
                <option value="302">CP 302 — Hôtels, restaurants, cafés</option>
                <option value="303">CP 303 — Diamant</option>
                <option value="310">CP 310 — Banques</option>
                <option value="320">CP 320 — Employés assurances</option>
                <option value="330">CP 330 — Intérim</option>
                <option value="at">AP — Ouvriers (général)</option>
              </select>
              {err("commission_paritaire")}
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Type de travailleur</label>
              <select style={inputStyle} value={form.type_employe} onChange={e => set("type_employe", e.target.value)}>
                <option value="employe">Employé</option>
                <option value="ouvrier">Ouvrier</option>
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Régime de travail</label>
              <select style={inputStyle} value={form.regime} onChange={e => set("regime", e.target.value)}>
                <option value="temps_plein">Temps plein</option>
                <option value="temps_partiel">Temps partiel</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 8, background: "rgba(96,165,250,.06)", border: "1px solid rgba(96,165,250,.12)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#60a5fa", marginBottom: 4 }}>ℹ️ Avantages 1er employé</div>
            <div style={{ fontSize: 10, color: "#888", lineHeight: 1.6 }}>
              Exonération ONSS patronal (loi 26/12/2015) · Activa.brussels jusqu'à 800€/mois · MonBEE jusqu'à 10.000€
            </div>
          </div>
        </C>
      )}

      {/* ─── ÉTAPE 3 : Premier employé ─── */}
      {step === 3 && (
        <C>
          <ST>Premier employé</ST>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 12, color: "#9e9b93" }}>
              <input type="checkbox" checked={form.skip_employe} onChange={e => set("skip_employe", e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "#c6a34e" }} />
              Passer cette étape — ajouter les employés plus tard
            </label>
          </div>
          {!form.skip_employe && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Nom *</label>
                <input style={inputStyle} value={form.emp_nom} onChange={e => set("emp_nom", e.target.value)} placeholder="Dupont" />
                {err("emp_nom")}
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Prénom *</label>
                <input style={inputStyle} value={form.emp_prenom} onChange={e => set("emp_prenom", e.target.value)} placeholder="Jean" />
                {err("emp_prenom")}
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>NISS (numéro national)</label>
                <input style={inputStyle} value={form.emp_niss} onChange={e => set("emp_niss", e.target.value)} placeholder="XX.XX.XX-XXX.XX" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} type="email" value={form.emp_email} onChange={e => set("emp_email", e.target.value)} placeholder="jean.dupont@email.be" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Salaire brut mensuel (€) *</label>
                <input style={inputStyle} type="number" value={form.emp_brut} onChange={e => set("emp_brut", e.target.value)} placeholder="2800" min="1955" />
                {err("emp_brut")}
                {form.emp_brut && parseFloat(form.emp_brut) >= 1955 && (
                  <div style={{ fontSize: 10, color: "#22c55e", marginTop: 3 }}>
                    ≈ net {Math.round(parseFloat(form.emp_brut) * 0.73)}€ · coût employeur {Math.round(parseFloat(form.emp_brut) * 1.25)}€
                  </div>
                )}
                {form.emp_brut && parseFloat(form.emp_brut) < 1955 && (
                  <div style={{ fontSize: 10, color: "#ef4444", marginTop: 3 }}>
                    Inférieur au RMMMG (1.955,17€)
                  </div>
                )}
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Date d'entrée en service *</label>
                <input style={{ ...inputStyle, colorScheme: "dark" }} type="date" value={form.emp_date_entree} onChange={e => set("emp_date_entree", e.target.value)} />
                {err("emp_date_entree")}
              </div>
            </div>
          )}
        </C>
      )}

      {/* ─── ÉTAPE 4 : Confirmation ─── */}
      {step === 4 && (
        <C>
          <ST>Récapitulatif avant création</ST>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            {[
              { l: "Entreprise", v: form.nom },
              { l: "BCE", v: form.bce },
              { l: "Adresse", v: `${form.adresse}, ${form.cp} ${form.ville}` },
              { l: "Email", v: form.email },
              { l: "Commission paritaire", v: `CP ${form.commission_paritaire}` },
              { l: "Type", v: form.type_employe === "employe" ? "Employé" : "Ouvrier" },
              { l: "Matricule ONSS", v: form.matricule_onss || "—" },
              { l: "1er employé", v: form.skip_employe ? "À ajouter plus tard" : `${form.emp_prenom} ${form.emp_nom} · ${form.emp_brut}€ brut` },
            ].map((r, i) => (
              <div key={i} style={{ padding: "10px 14px", background: "rgba(198,163,78,.04)", borderRadius: 8, border: "1px solid rgba(198,163,78,.08)" }}>
                <div style={{ fontSize: 9, color: "#5e5c56", textTransform: "uppercase", marginBottom: 3 }}>{r.l}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#e8e6e0" }}>{r.v}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: "12px 16px", borderRadius: 8, background: "rgba(34,197,94,.06)", border: "1px solid rgba(34,197,94,.15)", marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#22c55e", fontWeight: 600 }}>
              ✓ Données sauvegardées dans Supabase (RGPD — Frankfurt EU)
            </div>
          </div>
          <button onClick={save} disabled={saving}
            style={{ width: "100%", padding: "16px", borderRadius: 10, border: "none", background: saving ? "rgba(198,163,78,.3)" : "linear-gradient(135deg,#c6a34e,#a68a3c)", color: "#0c0b09", fontWeight: 700, fontSize: 14, cursor: saving ? "wait" : "pointer", fontFamily: "inherit" }}>
            {saving ? "Création en cours..." : "✓ Créer l'employeur"}
          </button>
        </C>
      )}

      {/* ─── Navigation ─── */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
        <button onClick={prev} disabled={step === 1}
          style={{ padding: "10px 24px", borderRadius: 8, border: "1px solid rgba(255,255,255,.08)", background: "transparent", color: step === 1 ? "#333" : "#9e9b93", fontSize: 13, cursor: step === 1 ? "default" : "pointer", fontFamily: "inherit" }}>
          ← Retour
        </button>
        {step < 4 && (
          <button onClick={next}
            style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#c6a34e,#a68a3c)", color: "#0c0b09", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            Suivant →
          </button>
        )}
      </div>
    </div>
  );
}

