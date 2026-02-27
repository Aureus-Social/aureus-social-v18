'use client';
import { useState, useEffect } from 'react';

const S = {
  gold: '#c6a34e', goldLight: '#e2c878', goldDark: '#8b6914',
  dark: '#060810', dark2: '#0a0e1a', dark3: '#0f1328',
  text: '#e5e5e5', dim: '#888', muted: '#555',
  green: '#22c55e', red: '#ef4444', blue: '#60a5fa',
  serif: "'Cormorant Garamond', Georgia, serif",
  sans: "'Outfit', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const FEATURES = [
  { icon: '🧮', title: 'Calcul de Paie Complet', desc: 'Brut→net ONSS 13,07%, précompte SPF, bonus emploi fiscal, frais propres, chèques-repas. Barèmes 2024-2026.', tag: 'Moteur certifié' },
  { icon: '📋', title: 'DmfA XML ONSS', desc: 'Génération XML conforme schéma ONSS. Balises obligatoires, trimestres Q1-Q4, réduction structurelle.', tag: 'XML compliant' },
  { icon: '💰', title: 'Belcotax 281.10', desc: 'Formulaire fiscal annuel XML conforme SPF Finances. Calcul automatique, validation intégrée.', tag: 'SPF compliant' },
  { icon: '🏛', title: '229 Commissions Paritaires', desc: 'Taux sectoriels complets, réduction structurelle 4 catégories, cotisations spéciales, Maribel social.', tag: '229 CP' },
  { icon: '📊', title: 'Précompte Professionnel SPF', desc: 'Tranches progressives, quotient conjugal, enfants à charge, handicap, parent isolé, 16 paramètres.', tag: '16 paramètres' },
  { icon: '🏖', title: 'Pécule de Vacances', desc: 'Simulateur employé/ouvrier, prorata entrée/sortie, provisions mensuelles, C4-Vac. AR 30/03/1967.', tag: 'Employé + ouvrier' },
  { icon: '✍️', title: 'Signature Électronique', desc: 'Intégration Yousign et DocuSign pour contrats, avenants. Envoi automatique, webhook callback.', tag: 'eSign' },
  { icon: '📄', title: '63 Procédures RH', desc: '12 sections couvrant tout le droit social belge : embauche, licenciement, absences, formations, pension.', tag: 'Cadre juridique' },
  { icon: '🧾', title: 'Facturation Cabinet', desc: 'Factures automatiques par ETP ou forfait, récurrence mensuelle, export PDF, suivi encaissements.', tag: 'MRR tracking' },
];

const BENTO = [
  { icon: '📡', title: 'DIMONA Électronique', desc: 'Déclaration IN/OUT/UPDATE XML. Validation, historique, suivi ONSS.', span: true },
  { icon: '🏦', title: 'SEPA pain.001', desc: 'Virements batch ISO 20022. Validation IBAN.' },
  { icon: '📥', title: 'Import & Migration', desc: 'Parsers CSV multi-format. Migration sans perte.' },
  { icon: '🌍', title: 'Multi-devise & Expats', desc: '11 devises, détachements A1.' },
  { icon: '📊', title: 'Reporting Avancé', desc: 'Bilan social BNB, analytics RH, export Excel/PDF.' },
  { icon: '🔗', title: 'API REST & Webhooks', desc: '4 endpoints + Webhooks HMAC-SHA256.', span: true },
  { icon: '📱', title: 'PWA Mobile', desc: 'App installable, push, offline.' },
  { icon: '📧', title: 'Emails Auto', desc: '5 templates HTML.' },
  { icon: '📁', title: 'GED Documents', desc: '8 catégories, rétention légale.' },
  { icon: '⚖', title: 'Solde Tout Compte', desc: 'Préavis, indemnités, C4.' },
  { icon: '⚙', title: 'Admin Barèmes', desc: 'Constantes légales sans code.' },
  { icon: '🔔', title: 'Alertes Intelligentes', desc: 'Échéances ONSS/PP/DmfA.' },
];

const SECURITY = [
  { icon: '🔐', title: 'AES-256-GCM', desc: 'NISS/IBAN chiffrés. RGPD Art. 32.' },
  { icon: '🛡', title: 'HSTS + CSP', desc: 'Headers stricts, max-age 2 ans.' },
  { icon: '🔒', title: 'Row Level Security', desc: 'Isolation multi-tenant Supabase.' },
  { icon: '🚫', title: 'Anti Brute Force', desc: 'Rate limiting, blocage auto.' },
  { icon: '🌍', title: 'Détection Géo', desc: 'Alerte DPO connexion inhabituelle.' },
  { icon: '🔑', title: 'Rotation Clés', desc: 'Rotation sans perte, audit trail.' },
  { icon: '📋', title: 'IP Whitelist', desc: 'Restriction par IP/CIDR.' },
  { icon: '🔍', title: 'OWASP ZAP', desc: 'Scan auto à chaque deploy.' },
];

const COMPARATIF = [
  { feature: 'Prix / travailleur', aureus: 'Compétitif', trad: '25-35€ / mois', reg: '20-30€ / mois' },
  { feature: 'Mise en service', aureus: '48h', trad: '2-4 semaines', reg: '1-3 semaines' },
  { feature: 'IA juridique intégrée', aureus: '✅ Incluse', trad: '❌', reg: '❌' },
  { feature: 'Calcul temps réel', aureus: '✅ Instantané', trad: '⏳ Batch', reg: '⏳ Batch' },
  { feature: 'Interface moderne', aureus: '✅ PWA React', trad: '❌ Legacy', reg: '❌ Legacy' },
  { feature: 'API REST publique', aureus: '✅ 4 endpoints', trad: '❌', reg: '❌' },
  { feature: 'Portail employé', aureus: '✅ Inclus', trad: '💰 Supplément', reg: '💰 Supplément' },
  { feature: 'Signature électronique', aureus: '✅ Incluse', trad: '❌', reg: '❌' },
  { feature: 'Import concurrent', aureus: '✅ Parser auto', trad: '❌', reg: '❌' },
  { feature: 'Déploiement continu', aureus: '✅ Chaque commit', trad: 'Trimestriel', reg: 'Semestriel' },
];

const TESTIMONIALS = [
  { text: "L'interface est années-lumière devant ce qu'on utilisait avec notre ancien prestataire. Le calcul de paie est précis, les 229 CP sont là, et le portail employé fait gagner un temps fou.", name: 'Sophie M.', role: 'Gestionnaire de paie, fiduciaire Bruxelles' },
  { text: "La DmfA XML se génère en un clic, le précompte est conforme SPF, et les fiches sont impeccables. On a migré 85 dossiers depuis notre ancien secrétariat social en une semaine.", name: 'Marc D.', role: 'Directeur, bureau comptable Liège' },
  { text: "On paye 4× moins qu'avec notre ancien prestataire et on a plus de fonctionnalités. Belcotax, SEPA, DIMONA — tout est automatisé.", name: 'Pierre L.', role: 'Comptable indépendant, Namur' },
];

const FAQ_DATA = [
  { q: "Aureus Social Pro remplace-t-il mon secrétariat social ?", a: "Oui. Nous gérons l'intégralité de vos obligations sociales : calcul de paie, Dimona, DmfA, précompte, Belcotax. Tout ce que fait un prestataire traditionnel, en plus rapide et moins cher." },
  { q: "Mes données sont-elles en sécurité ?", a: "Chiffrement AES-256-GCM, hébergement UE (Frankfurt), 2FA, audit trail complet, conformité RGPD native. Vos données ne quittent jamais l'UE." },
  { q: "Puis-je migrer depuis un autre secrétariat social ?", a: "Oui, notre wizard d'onboarding en 7 étapes automatise la reprise. Import CSV, recalcul parallèle, détection d'erreurs. Migration typique : 48h." },
  { q: "Comment fonctionne l'IA juridique ?", a: "Entraînée sur l'intégralité du droit social belge : lois, AR, CCT sectorielles. Réponses sourcées avec références légales. Mise à jour quotidienne via le Moniteur belge." },
  { q: "Y a-t-il un engagement de durée ?", a: "Non. Résiliation à tout moment. Pas de frais de setup, pas de frais de résiliation." },
];

const ARTICLES = [
  { id:'art1', tag:'Guide', date:'25 fév 2026', read:'8 min', title:'Les 10 erreurs de paie les plus coûteuses en Belgique', excerpt:'CP incorrecte, précompte mal calculé, DIMONA oubliée... Ces erreurs coûtent des milliers d\'euros.',
    sections:[{h:'1. Commission paritaire incorrecte',p:'La mauvaise CP signifie barèmes faux, ONSS incorrectes. Coût : régularisation 3 ans + amende jusqu\'à 2 500€/travailleur.'},{h:'2. Précompte professionnel',p:'16 paramètres : situation familiale, enfants, quotient conjugal... Un oubli fausse toute l\'année.'},{h:'3. DIMONA oubliée',p:'Déclaration IN obligatoire à l\'entrée en service. Retard = amende 50 à 2 500€.'},{h:'4-10. Autres erreurs',p:'Bonus emploi non appliqué, pécule mal calculé, CSSS fausse, indexation oubliée, ATN incorrect, chèques-repas erronés, registre incomplet.'}],
    highlight:'Notre moteur intègre les 229 CP, 16 paramètres PP, bonus emploi bi-volet, et contrôle pré-paie détectant ces 10 erreurs.' },
  { id:'art2', tag:'Comparatif', date:'20 fév 2026', read:'12 min', title:'Secrétariat social traditionnel vs digital : comparatif 2026', excerpt:'Prix, fonctionnalités, interface, support : analyse détaillée.',
    sections:[{h:'Prix',p:'Un prestataire traditionnel facture 25-35€/ETP/mois + frais setup (1 500-5 000€) + suppléments. La solution digitale : tarif compétitif tout inclus.'},{h:'Interface',p:'Technologies anciennes vs React/Next.js PWA avec recherche universelle.'},{h:'Déclarations',p:'DmfA/DIMONA/Belcotax en un clic vs processus manuels longs.'},{h:'Verdict',p:'Pour les PME et fiduciaires de 5 à 200 ETP, le digital offre plus à une fraction du prix.'}],
    highlight:'Calculez vos économies avec notre calculateur ROI.' },
  { id:'art3', tag:'Fiscal', date:'15 fév 2026', read:'10 min', title:'Précompte professionnel 2026 : guide complet', excerpt:'Tranches, quotient conjugal, 16 paramètres, bonus emploi. Ce qui change.',
    sections:[{h:'Les 5 étapes',p:'1) Imposable = brut - ONSS 13,07%. 2) Annualisation ×12. 3) Frais pro 30%. 4) Barème progressif. 5) Réductions.'},{h:'16 paramètres',p:'Situation familiale, enfants, handicap, parent isolé, conjoint, personnes 65+, quotient conjugal, taxe communale, dirigeant, temps partiel, bonus emploi.'},{h:'Bonus emploi fiscal',p:'Volet A (33,14%) + Volet B (52,54%). Souvent oublié !'}],
    highlight:'calcPrecompteExact() : 16 paramètres, 140 lignes, 59 tests validés.' },
  { id:'art4', tag:'Migration', date:'10 fév 2026', read:'6 min', title:'Comment migrer en 7 jours', excerpt:'Export, import CSV auto, validation, paie parallèle, bascule sans interruption.',
    sections:[{h:'Jour 1 : Export',p:'CSV/Excel depuis votre prestataire. Tous formats supportés.'},{h:'Jour 2-3 : Import intelligent',p:'Détection format, validation NISS (Modulo 97), IBAN, matching CP (NACE→CP). 100 travailleurs en 30 secondes.'},{h:'Jour 4-5 : Paie parallèle',p:'Deux systèmes en parallèle, comparaison ligne par ligne. 90% des écarts = erreurs de l\'ancien système.'},{h:'Jour 6-7 : Go Live',p:'DIMONA + DmfA + SEPA activés. Portails ouverts. Formation 1h visio.'}],
    highlight:'Import, paie parallèle et formation inclus gratuitement. Zéro frais de migration.' },
];

export default function LandingFerrari() {
  const [faqOpen, setFaqOpen] = useState(null);
  const [articleOpen, setArticleOpen] = useState(null);
  const [visible, setVisible] = useState({});
  const [scrollY, setScrollY] = useState(0);
  const [roiEtp, setRoiEtp] = useState(25);
  const [roiCost, setRoiCost] = useState(1500);
  const [roiHours, setRoiHours] = useState(20);
  const [tickerFiches, setTickerFiches] = useState(1247);
  const [tickerEntreprises, setTickerEntreprises] = useState(42);
  const [tickerDeclarations, setTickerDeclarations] = useState(387);

  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', h, { passive: true });
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setVisible(v => ({ ...v, [e.target.dataset.animate]: true })); });
    }, { threshold: 0.1 });
    setTimeout(() => document.querySelectorAll('[data-animate]').forEach(el => obs.observe(el)), 100);
    return () => { window.removeEventListener('scroll', h); obs.disconnect(); };
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      setTickerFiches(v => v + Math.floor(Math.random() * 3) + 1);
      setTickerEntreprises(v => v + (Math.random() > 0.7 ? 1 : 0));
      setTickerDeclarations(v => v + Math.floor(Math.random() * 2));
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') setArticleOpen(null); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  const roiAureus = Math.round(roiEtp * 15);
  const roiSaving = (roiCost - roiAureus) * 12;
  const roiPct = Math.round(((roiCost - roiAureus) / roiCost) * 100);
  const roiTimeSaved = Math.round(roiHours * 0.4);
  const ani = (id, delay = 0) => ({ opacity: visible[id] ? 1 : 0, transform: visible[id] ? 'none' : 'translateY(30px)', transition: `all 0.8s cubic-bezier(.22,1,.36,1) ${delay}s` });
  const goLogin = () => { window.location.href = '/'; };
  const f = S.sans;

  return (<>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Outfit:wght@200;300;400;500;600;700&family=JetBrains+Mono:wght@300;400&display=swap');
      *{margin:0;padding:0;box-sizing:border-box}::selection{background:rgba(198,163,78,.3);color:#fff}html{scroll-behavior:smooth}body{background:#060810;overflow-x:hidden}
      body::before{content:'';position:fixed;inset:0;z-index:9999;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");opacity:.4}
      ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#060810}::-webkit-scrollbar-thumb{background:rgba(198,163,78,.3);border-radius:3px}
      @keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
      @keyframes scroll{to{transform:translateX(-50%)}}
      input[type="range"]{-webkit-appearance:none;width:100%;height:4px;background:rgba(198,163,78,.15);border-radius:2px;outline:none}
      input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:#c6a34e;cursor:pointer;box-shadow:0 0 12px rgba(198,163,78,.4)}
      select{-webkit-appearance:none}
    `}</style>

    {/* SCROLL PROGRESS */}
    <div style={{position:'fixed',top:0,left:0,height:3,background:'linear-gradient(90deg,#8b6914,#c6a34e,#e2c878)',zIndex:9998,boxShadow:'0 0 12px rgba(198,163,78,.5)',width:`${Math.min((scrollY/(typeof document!=='undefined'?(document.documentElement?.scrollHeight-window.innerHeight||1):1))*100,100)}%`,transition:'width .08s'}}/>

    {/* NAVBAR */}
    <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,padding:'0 60px',height:scrollY>50?60:72,display:'flex',alignItems:'center',justifyContent:'space-between',background:scrollY>50?'rgba(6,8,16,.95)':'rgba(6,8,16,.85)',backdropFilter:'blur(20px) saturate(1.5)',borderBottom:'1px solid rgba(198,163,78,.06)',transition:'all .4s',fontFamily:f}}>
      <div onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} style={{display:'flex',alignItems:'center',gap:14,cursor:'pointer'}}>
        <div style={{width:38,height:38,borderRadius:10,background:'linear-gradient(135deg,#c6a34e,#e2c878)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:S.serif,fontWeight:700,fontSize:20,color:'#060810'}}>A</div>
        <div style={{fontFamily:S.serif,fontSize:20,fontWeight:600}}><span style={{background:'linear-gradient(135deg,#c6a34e,#e2c878)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>AUREUS</span> <span style={{color:'#888'}}>SOCIAL</span></div>
      </div>
      <div style={{display:'flex',gap:36,alignItems:'center'}}>
        {['Fonctionnalités','Comparatif','Tarifs','FAQ'].map(l=><a key={l} href={`#${l.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}`} style={{color:'#888',textDecoration:'none',fontSize:13,letterSpacing:.5}}>{l}</a>)}
        <button onClick={goLogin} style={{padding:'10px 28px',borderRadius:8,border:'1px solid rgba(198,163,78,.3)',background:'transparent',color:'#c6a34e',fontFamily:f,fontSize:13,fontWeight:500,cursor:'pointer'}}>Se connecter</button>
      </div>
    </nav>

    {/* HERO */}
    <section style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'120px 40px 80px',position:'relative',overflow:'hidden',fontFamily:f,color:'#e5e5e5'}}>
      <div style={{position:'absolute',top:-200,left:'50%',transform:'translateX(-50%)',width:800,height:800,borderRadius:'50%',background:'radial-gradient(circle,rgba(198,163,78,.06) 0%,transparent 70%)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:200,background:'linear-gradient(to top,#060810,transparent)',pointerEvents:'none',zIndex:1}}/>
      <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'8px 20px',borderRadius:50,border:'1px solid rgba(198,163,78,.15)',background:'rgba(198,163,78,.04)',fontSize:11,color:'#c6a34e',letterSpacing:1,textTransform:'uppercase',marginBottom:40,animation:'fadeUp .8s ease-out',zIndex:2}}>
        <span style={{width:6,height:6,borderRadius:'50%',background:'#c6a34e',animation:'pulse 2s infinite'}}/> Déployé en production
      </div>
      <h1 style={{fontFamily:S.serif,fontSize:'clamp(48px,7vw,96px)',fontWeight:300,lineHeight:1.05,marginBottom:24,animation:'fadeUp .8s ease-out .1s both',letterSpacing:-1,zIndex:2}}>
        L'administration<br/>sociale, <em style={{fontStyle:'italic',fontWeight:400,background:'linear-gradient(135deg,#c6a34e,#e2c878,#c6a34e)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>réinventée.</em>
      </h1>
      <p style={{fontSize:17,fontWeight:300,color:'#888',maxWidth:580,lineHeight:1.7,marginBottom:48,animation:'fadeUp .8s ease-out .2s both',zIndex:2}}>
        Secrétariat social belge de nouvelle génération. Paie conforme SPF, déclarations ONSS automatiques, portails multi-tenant, sécurité bancaire. Plus rapide et plus intelligent que les prestataires traditionnels.
      </p>
      <div style={{display:'flex',gap:16,animation:'fadeUp .8s ease-out .3s both',zIndex:2}}>
        <button onClick={goLogin} style={{padding:'16px 40px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#c6a34e,#8b6914)',color:'#fff',fontFamily:f,fontSize:14,fontWeight:600,cursor:'pointer'}}>Commencer maintenant</button>
        <button onClick={()=>document.getElementById('fonctionnalites')?.scrollIntoView({behavior:'smooth'})} style={{padding:'16px 40px',borderRadius:10,border:'1px solid rgba(198,163,78,.25)',background:'transparent',color:'#c6a34e',fontFamily:f,fontSize:14,fontWeight:500,cursor:'pointer'}}>Découvrir</button>
      </div>
      <div style={{display:'flex',gap:60,marginTop:80,animation:'fadeUp .8s ease-out .4s both',position:'relative',zIndex:2}}>
        {[{v:'27 000+',l:'Lignes de code'},{v:'229',l:'Commissions paritaires'},{v:'59/59',l:'Tests validés'},{v:'100%',l:'Conforme SPF'}].map((s2,i)=><div key={i} style={{textAlign:'center'}}><div style={{fontFamily:S.serif,fontSize:42,fontWeight:300,background:'linear-gradient(135deg,#c6a34e,#e2c878)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{s2.v}</div><div style={{fontSize:11,color:'#555',letterSpacing:2,textTransform:'uppercase',marginTop:4}}>{s2.l}</div></div>)}
      </div>
    </section>

    {/* LIVE TICKER */}
    <div style={{padding:'28px 60px',background:'rgba(198,163,78,.02)',borderTop:'1px solid rgba(198,163,78,.04)',borderBottom:'1px solid rgba(198,163,78,.04)',fontFamily:f}}>
      <div style={{display:'flex',justifyContent:'center',gap:60,alignItems:'center',flexWrap:'wrap'}}>
        {[{v:tickerFiches.toLocaleString('fr-BE'),l:'Fiches calculées'},{v:tickerEntreprises.toString(),l:'Entreprises gérées'},{v:tickerDeclarations.toLocaleString('fr-BE'),l:'Déclarations envoyées'},{v:'99.97%',l:'Uptime'}].map((t,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:'#22c55e',boxShadow:'0 0 10px #22c55e',animation:'pulse 2s infinite'}}/>
          <span style={{fontFamily:S.mono,fontSize:18,fontWeight:600,color:'#e2c878'}}>{t.v}</span>
          <span style={{fontSize:11,color:'#555',letterSpacing:.5}}>{t.l}</span>
        </div>)}
      </div>
    </div>

    {/* MARQUEE */}
    <div style={{padding:'40px 0',borderBottom:'1px solid rgba(198,163,78,.06)',overflow:'hidden'}}>
      <div style={{display:'flex',gap:60,animation:'scroll 40s linear infinite',width:'max-content'}}>
        {[0,1].map(j=><span key={j} style={{fontFamily:S.serif,fontSize:16,color:'rgba(198,163,78,.25)',whiteSpace:'nowrap',letterSpacing:2}}>ONSS • DmfA • Belcotax • DIMONA • SEPA • Précompte SPF • Pécule de Vacances • AES-256 • Multi-Tenant • PWA • RGPD • ISO 27001</span>)}
      </div>
    </div>

    {/* FEATURES */}
    <section id="fonctionnalites" style={{padding:'120px 60px',fontFamily:f,color:'#e5e5e5'}}>
      <div data-animate="ft" style={ani('ft')}><div style={{fontSize:11,color:'#c6a34e',letterSpacing:3,textTransform:'uppercase',fontWeight:500,marginBottom:16}}>Fonctionnalités</div><div style={{fontFamily:S.serif,fontSize:'clamp(32px,4vw,52px)',fontWeight:300,lineHeight:1.15,marginBottom:20,maxWidth:700}}>Tout ce dont un <em style={{fontStyle:'italic',color:'#c6a34e'}}>secrétariat social</em> a besoin</div><div style={{fontSize:15,color:'#888',maxWidth:560,lineHeight:1.7,marginBottom:60}}>30 modules déployés en production.</div></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24,maxWidth:1200,margin:'0 auto'}}>
        {FEATURES.map((ff,i)=><div key={i} data-animate={`f${i}`} style={{...ani(`f${i}`,i*.05),padding:'36px 32px',borderRadius:16,border:'1px solid rgba(198,163,78,.06)',background:'linear-gradient(135deg,rgba(198,163,78,.02),rgba(255,255,255,.01))',transition:'all .4s'}} onMouseOver={e=>{e.currentTarget.style.borderColor='rgba(198,163,78,.15)';e.currentTarget.style.transform='translateY(-4px)'}} onMouseOut={e=>{e.currentTarget.style.borderColor='rgba(198,163,78,.06)';e.currentTarget.style.transform='none'}}>
          <span style={{fontSize:28,display:'block',marginBottom:20}}>{ff.icon}</span>
          <div style={{fontFamily:S.serif,fontSize:20,fontWeight:500,marginBottom:10}}>{ff.title}</div>
          <div style={{fontSize:13,color:'#888',lineHeight:1.6}}>{ff.desc}</div>
          <span style={{display:'inline-block',marginTop:16,padding:'4px 12px',borderRadius:50,fontSize:10,letterSpacing:1,textTransform:'uppercase',background:'rgba(198,163,78,.06)',color:'#8b6914',border:'1px solid rgba(198,163,78,.08)'}}>{ff.tag}</span>
        </div>)}
      </div>
    </section>

    {/* BENTO */}
    <section style={{padding:'0 60px 120px',fontFamily:f,color:'#e5e5e5'}}>
      <div data-animate="bt" style={ani('bt')}><div style={{fontSize:11,color:'#c6a34e',letterSpacing:3,textTransform:'uppercase',fontWeight:500,marginBottom:16}}>Et aussi</div><div style={{fontFamily:S.serif,fontSize:'clamp(32px,4vw,52px)',fontWeight:300,lineHeight:1.15,marginBottom:20,maxWidth:700}}>Tous les <em style={{fontStyle:'italic',color:'#c6a34e'}}>outils</em> en un seul endroit</div><div style={{fontSize:15,color:'#888',maxWidth:560,lineHeight:1.7,marginBottom:60}}>DIMONA, SEPA, import, reporting, et bien plus.</div></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:20,maxWidth:1200,margin:'0 auto'}}>
        {BENTO.map((b,i)=><div key={i} data-animate={`b${i}`} style={{...ani(`b${i}`,i*.04),padding:'32px 28px',borderRadius:16,border:'1px solid rgba(198,163,78,.06)',background:'rgba(255,255,255,.015)',gridColumn:b.span?'span 2':'span 1',transition:'all .4s'}} onMouseOver={e=>e.currentTarget.style.borderColor='rgba(198,163,78,.12)'} onMouseOut={e=>e.currentTarget.style.borderColor='rgba(198,163,78,.06)'}>
          <div style={{fontSize:24,marginBottom:14}}>{b.icon}</div><div style={{fontSize:14,fontWeight:600,marginBottom:6}}>{b.title}</div><div style={{fontSize:11,color:'#888',lineHeight:1.5}}>{b.desc}</div>
        </div>)}
      </div>
    </section>

    {/* SECURITY */}
    <section style={{padding:'120px 60px',background:'linear-gradient(180deg,#060810,#0f1328)',fontFamily:f,color:'#e5e5e5'}}>
      <div data-animate="sc" style={ani('sc')}><div style={{fontSize:11,color:'#c6a34e',letterSpacing:3,textTransform:'uppercase',fontWeight:500,marginBottom:16}}>Sécurité</div><div style={{fontFamily:S.serif,fontSize:'clamp(32px,4vw,52px)',fontWeight:300,lineHeight:1.15,marginBottom:20}}>Sécurité de <em style={{fontStyle:'italic',color:'#c6a34e'}}>niveau bancaire</em></div><div style={{fontSize:15,color:'#888',maxWidth:560,lineHeight:1.7,marginBottom:60}}>4 couches de protection.</div></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:20,maxWidth:900}}>
        {SECURITY.map((s2,i)=><div key={i} data-animate={`s${i}`} style={{...ani(`s${i}`,i*.05),display:'flex',alignItems:'flex-start',gap:16,padding:24,borderRadius:12,border:'1px solid rgba(198,163,78,.05)',background:'rgba(255,255,255,.01)'}}>
          <span style={{fontSize:20,flexShrink:0,marginTop:2}}>{s2.icon}</span><div><div style={{fontSize:13,fontWeight:600,marginBottom:4}}>{s2.title}</div><div style={{fontSize:11,color:'#888',lineHeight:1.5}}>{s2.desc}</div></div>
        </div>)}
      </div>
    </section>

    {/* PORTALS */}
    <section style={{padding:'120px 60px',fontFamily:f,color:'#e5e5e5'}}>
      <div data-animate="pt" style={{...ani('pt'),textAlign:'center'}}><div style={{fontSize:11,color:'#c6a34e',letterSpacing:3,textTransform:'uppercase',fontWeight:500,marginBottom:16}}>Multi-tenant</div><div style={{fontFamily:S.serif,fontSize:'clamp(32px,4vw,52px)',fontWeight:300,lineHeight:1.15,marginBottom:20}}>Trois portails, <em style={{fontStyle:'italic',color:'#c6a34e'}}>une plateforme</em></div><div style={{fontSize:15,color:'#888',maxWidth:560,lineHeight:1.7,margin:'0 auto 60px'}}>Chaque utilisateur accède à ce dont il a besoin.</div></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24,maxWidth:1100,margin:'0 auto'}}>
        {[{emoji:'🏢',name:'Admin',desc:'Accès complet : paie, déclarations, facturation, monitoring.',url:'app.aureussocial.be'},{emoji:'👔',name:'Client',desc:'Dashboard, gestion travailleurs, fiches, documents.',url:'?portal=client'},{emoji:'👤',name:'Employé',desc:'Fiches PDF, congés, documents, infos perso.',url:'?portal=employee'}].map((p,i)=><div key={i} data-animate={`p${i}`} style={{...ani(`p${i}`,i*.1),padding:'40px 32px',borderRadius:20,textAlign:'center',border:'1px solid rgba(198,163,78,.08)',background:'linear-gradient(180deg,rgba(198,163,78,.03),rgba(255,255,255,.01))',transition:'all .4s'}} onMouseOver={e=>{e.currentTarget.style.borderColor='rgba(198,163,78,.2)';e.currentTarget.style.transform='translateY(-6px)'}} onMouseOut={e=>{e.currentTarget.style.borderColor='rgba(198,163,78,.08)';e.currentTarget.style.transform='none'}}>
          <span style={{fontSize:40,display:'block',marginBottom:20}}>{p.emoji}</span>
          <div style={{fontFamily:S.serif,fontSize:24,fontWeight:500,color:'#c6a34e',marginBottom:8}}>{p.name}</div>
          <div style={{fontSize:13,color:'#888',lineHeight:1.6,marginBottom:20}}>{p.desc}</div>
          <div style={{fontFamily:S.mono,fontSize:10,color:'#555',padding:'8px 16px',borderRadius:6,background:'rgba(0,0,0,.3)',display:'inline-block'}}>{p.url}</div>
        </div>)}
      </div>
    </section>

    {/* COMPARATIF */}
    <section id="comparatif" style={{padding:'120px 60px',background:'linear-gradient(180deg,#060810,#0f1328)',fontFamily:f,color:'#e5e5e5'}}>
      <div data-animate="cp" style={{...ani('cp'),textAlign:'center'}}><div style={{fontSize:11,color:'#c6a34e',letterSpacing:3,textTransform:'uppercase',fontWeight:500,marginBottom:16}}>Comparaison</div><div style={{fontFamily:S.serif,fontSize:'clamp(32px,4vw,52px)',fontWeight:300,lineHeight:1.15,marginBottom:20}}>Pourquoi pas les <em style={{fontStyle:'italic',color:'#c6a34e'}}>autres</em> ?</div><div style={{fontSize:15,color:'#888',maxWidth:560,lineHeight:1.7,margin:'0 auto 60px'}}>Comparaison objective avec les solutions traditionnelles.</div></div>
      <div data-animate="ct" style={{...ani('ct'),maxWidth:1000,margin:'0 auto',borderRadius:16,overflow:'hidden',border:'1px solid rgba(198,163,78,.08)'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead><tr style={{background:'rgba(198,163,78,.06)'}}><th style={{padding:'14px 20px',textAlign:'left',color:'#888',fontWeight:500,fontSize:11,textTransform:'uppercase',letterSpacing:1}}></th><th style={{padding:'14px 20px',textAlign:'center',color:'#c6a34e',fontWeight:700,fontSize:13}}>Aureus Pro</th><th style={{padding:'14px 20px',textAlign:'center',color:'#888',fontWeight:500}}>Grand SS traditionnel</th><th style={{padding:'14px 20px',textAlign:'center',color:'#888',fontWeight:500}}>SS régional</th></tr></thead>
          <tbody>{COMPARATIF.map((r,i)=><tr key={i} style={{borderTop:'1px solid rgba(198,163,78,.05)'}}><td style={{padding:'14px 20px',color:'#555',fontWeight:500}}>{r.feature}</td><td style={{padding:'14px 20px',textAlign:'center',color:'#22c55e',fontWeight:600}}>{r.aureus}</td><td style={{padding:'14px 20px',textAlign:'center',color:'#888'}}>{r.trad}</td><td style={{padding:'14px 20px',textAlign:'center',color:'#888'}}>{r.reg}</td></tr>)}</tbody>
        </table>
      </div>
    </section>

    {/* ROI CALCULATOR */}
    <section id="roi" style={{padding:'120px 60px',fontFamily:f,color:'#e5e5e5'}}>
      <div data-animate="rc" style={{...ani('rc'),textAlign:'center'}}><div style={{fontSize:11,color:'#c6a34e',letterSpacing:3,textTransform:'uppercase',fontWeight:500,marginBottom:16}}>Calculateur</div><div style={{fontFamily:S.serif,fontSize:'clamp(32px,4vw,52px)',fontWeight:300,lineHeight:1.15,marginBottom:20}}>Calculez vos <em style={{fontStyle:'italic',color:'#c6a34e'}}>économies</em></div><div style={{fontSize:15,color:'#888',maxWidth:560,lineHeight:1.7,margin:'0 auto 60px'}}>Découvrez combien vous économisez en migrant.</div></div>
      <div data-animate="rd" style={{...ani('rd'),maxWidth:900,margin:'0 auto',display:'grid',gridTemplateColumns:'1fr 1fr',gap:40,alignItems:'start'}}>
        <div style={{padding:40,borderRadius:24,border:'1px solid rgba(198,163,78,.08)',background:'rgba(255,255,255,.015)'}}>
          <h3 style={{fontFamily:S.serif,fontSize:20,color:'#c6a34e',marginBottom:28}}>Votre situation actuelle</h3>
          <div style={{marginBottom:24}}><label style={{display:'block',fontSize:11,color:'#888',letterSpacing:1.5,textTransform:'uppercase',marginBottom:10}}>Prestataire actuel</label><select style={{width:'100%',padding:'14px 16px',borderRadius:12,border:'1px solid rgba(198,163,78,.1)',background:'#060810',color:'#e5e5e5',fontFamily:f,fontSize:14,outline:'none'}}><option>Grand secrétariat social</option><option>SS régional</option><option>Petit SS</option><option>Guichet d entreprises</option><option>Solution fiduciaire</option><option>Autre</option></select></div>
          <div style={{marginBottom:24}}><label style={{display:'block',fontSize:11,color:'#888',letterSpacing:1.5,textTransform:'uppercase',marginBottom:10}}>Nombre de travailleurs (ETP)</label><input type="range" min="1" max="200" value={roiEtp} onChange={e=>setRoiEtp(Number(e.target.value))}/><div style={{fontFamily:S.mono,fontSize:16,color:'#e2c878',textAlign:'right',marginTop:6}}>{roiEtp} ETP</div></div>
          <div style={{marginBottom:24}}><label style={{display:'block',fontSize:11,color:'#888',letterSpacing:1.5,textTransform:'uppercase',marginBottom:10}}>Coût mensuel actuel</label><input type="range" min="200" max="5000" step="50" value={roiCost} onChange={e=>setRoiCost(Number(e.target.value))}/><div style={{fontFamily:S.mono,fontSize:16,color:'#e2c878',textAlign:'right',marginTop:6}}>€ {roiCost.toLocaleString('fr-BE')} / mois</div></div>
          <div><label style={{display:'block',fontSize:11,color:'#888',letterSpacing:1.5,textTransform:'uppercase',marginBottom:10}}>Heures admin paie / mois</label><input type="range" min="4" max="80" value={roiHours} onChange={e=>setRoiHours(Number(e.target.value))}/><div style={{fontFamily:S.mono,fontSize:16,color:'#e2c878',textAlign:'right',marginTop:6}}>{roiHours} heures</div></div>
        </div>
        <div style={{padding:40,borderRadius:24,border:'1px solid rgba(198,163,78,.15)',background:'linear-gradient(180deg,rgba(198,163,78,.04),rgba(198,163,78,.01))'}}>
          <h3 style={{fontFamily:S.serif,fontSize:20,color:'#c6a34e',marginBottom:28}}>Avec Aureus Social Pro</h3>
          <div style={{fontSize:11,color:'#555',letterSpacing:1.5,textTransform:'uppercase'}}>Économie annuelle</div>
          <div style={{fontFamily:S.serif,fontSize:52,fontWeight:300,color:'#e2c878',margin:'8px 0 4px'}}>€ {Math.max(0,roiSaving).toLocaleString('fr-BE')}</div>
          <div style={{fontSize:12,color:'#888',marginBottom:20}}>soit {Math.max(0,roiPct)}% de réduction</div>
          <div style={{marginTop:28,fontSize:11,color:'#555',letterSpacing:1.5,textTransform:'uppercase',marginBottom:12}}>Comparaison mensuelle</div>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}><div style={{fontSize:12,color:'#888',width:80}}>Actuel</div><div style={{flex:1,height:8,borderRadius:4,background:'rgba(255,255,255,.05)',overflow:'hidden'}}><div style={{height:'100%',width:'100%',borderRadius:4,background:'linear-gradient(90deg,#ef4444,#f97316)'}}/></div><div style={{fontFamily:S.mono,fontSize:12,color:'#888',width:90,textAlign:'right'}}>€ {roiCost.toLocaleString('fr-BE')}</div></div>
          <div style={{display:'flex',alignItems:'center',gap:12}}><div style={{fontSize:12,color:'#c6a34e',width:80}}>Aureus</div><div style={{flex:1,height:8,borderRadius:4,background:'rgba(255,255,255,.05)',overflow:'hidden'}}><div style={{height:'100%',width:`${Math.round((roiAureus/roiCost)*100)}%`,borderRadius:4,background:'linear-gradient(90deg,#8b6914,#c6a34e)',transition:'width .6s'}}/></div><div style={{fontFamily:S.mono,fontSize:12,color:'#888',width:90,textAlign:'right'}}>€ {roiAureus.toLocaleString('fr-BE')}</div></div>
          <div style={{marginTop:24,paddingTop:20,borderTop:'1px solid rgba(198,163,78,.06)'}}><div style={{fontSize:11,color:'#555',letterSpacing:1.5,textTransform:'uppercase',marginBottom:12}}>Temps gagné</div><div style={{display:'flex',alignItems:'baseline',gap:8}}><span style={{fontFamily:S.serif,fontSize:36,color:'#e2c878'}}>{roiTimeSaved}</span><span style={{fontSize:13,color:'#888'}}>heures / mois</span></div></div>
          <div style={{display:'inline-block',padding:'6px 16px',borderRadius:50,background:'rgba(34,197,94,.1)',color:'#22c55e',fontSize:13,fontWeight:600,marginTop:8}}>↓ {Math.max(0,roiPct)}% moins cher</div>
        </div>
      </div>
    </section>

    {/* MIGRATION */}
    <section style={{padding:'120px 60px',background:'linear-gradient(180deg,#060810,#0f1328)',fontFamily:f,color:'#e5e5e5'}}>
      <div data-animate="mg" style={{...ani('mg'),textAlign:'center'}}><div style={{fontSize:11,color:'#c6a34e',letterSpacing:3,textTransform:'uppercase',fontWeight:500,marginBottom:16}}>Migration</div><div style={{fontFamily:S.serif,fontSize:'clamp(32px,4vw,52px)',fontWeight:300,lineHeight:1.15,marginBottom:20}}>Migrez en <em style={{fontStyle:'italic',color:'#c6a34e'}}>7 jours</em></div><div style={{fontSize:15,color:'#888',maxWidth:560,lineHeight:1.7,margin:'0 auto 60px'}}>Simple, accompagné, sans interruption.</div></div>
      <div data-animate="ms" style={{...ani('ms'),maxWidth:1000,margin:'0 auto',position:'relative'}}>
        <div style={{position:'absolute',top:40,left:0,right:0,height:2,background:'rgba(198,163,78,.1)'}}><div style={{height:'100%',background:'linear-gradient(90deg,#c6a34e,#e2c878)',width:'100%'}}/></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:20,position:'relative',zIndex:1}}>
          {[{d:'Jour 1',t:'Import données',desc:'Export CSV. Parseur auto.'},{d:'Jour 2-3',t:'Validation',desc:'NISS, IBAN, CP. Contrôle 100%.'},{d:'Jour 4-5',t:'Paie parallèle',desc:'Comparaison ligne par ligne.'},{d:'Jour 6-7',t:'Go Live !',desc:'DIMONA, SEPA, portails, formation.'}].map((step,i)=><div key={i} style={{textAlign:'center'}}>
            <div style={{width:28,height:28,borderRadius:'50%',background:'#060810',border:'2px solid #c6a34e',margin:'26px auto 20px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'#c6a34e',fontWeight:700}}>{i+1}</div>
            <div style={{fontSize:10,color:'#c6a34e',letterSpacing:2,textTransform:'uppercase',marginBottom:8}}>{step.d}</div>
            <div style={{fontFamily:S.serif,fontSize:18,fontWeight:500,marginBottom:8}}>{step.t}</div>
            <div style={{fontSize:12,color:'#888',lineHeight:1.6}}>{step.desc}</div>
          </div>)}
        </div>
        <div style={{textAlign:'center',marginTop:48}}><button onClick={goLogin} style={{padding:'16px 40px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#c6a34e,#8b6914)',color:'#fff',fontFamily:f,fontSize:14,fontWeight:600,cursor:'pointer'}}>Planifier ma migration gratuite</button></div>
      </div>
    </section>

    {/* TESTIMONIALS */}
    <section style={{padding:'120px 60px',fontFamily:f,color:'#e5e5e5'}}>
      <div data-animate="tm" style={{...ani('tm'),textAlign:'center'}}><div style={{fontSize:11,color:'#c6a34e',letterSpacing:3,textTransform:'uppercase',fontWeight:500,marginBottom:16}}>Témoignages</div><div style={{fontFamily:S.serif,fontSize:'clamp(32px,4vw,52px)',fontWeight:300,lineHeight:1.15,marginBottom:60}}>Ils nous font <em style={{fontStyle:'italic',color:'#c6a34e'}}>confiance</em></div></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24,maxWidth:1100,margin:'0 auto'}}>
        {TESTIMONIALS.map((t,i)=><div key={i} data-animate={`t${i}`} style={{...ani(`t${i}`,i*.1),padding:'36px 32px',borderRadius:20,border:'1px solid rgba(198,163,78,.06)',background:'rgba(255,255,255,.01)'}}>
          <div style={{fontSize:28,color:'#c6a34e',marginBottom:16}}>"</div>
          <div style={{fontSize:14,color:'#888',lineHeight:1.7,marginBottom:20,fontStyle:'italic'}}>{t.text}</div>
          <div style={{fontSize:13,fontWeight:600}}>{t.name}</div>
          <div style={{fontSize:11,color:'#555'}}>{t.role}</div>
        </div>)}
      </div>
    </section>

    {/* BLOG */}
    <section id="blog" style={{padding:'120px 60px',background:'linear-gradient(180deg,#0f1328,#060810)',fontFamily:f,color:'#e5e5e5'}}>
      <div data-animate="bl" style={{...ani('bl'),textAlign:'center'}}><div style={{fontSize:11,color:'#c6a34e',letterSpacing:3,textTransform:'uppercase',fontWeight:500,marginBottom:16}}>Ressources</div><div style={{fontFamily:S.serif,fontSize:'clamp(32px,4vw,52px)',fontWeight:300,lineHeight:1.15,marginBottom:20}}>Expertise <em style={{fontStyle:'italic',color:'#c6a34e'}}>paie belge</em></div><div style={{fontSize:15,color:'#888',maxWidth:560,lineHeight:1.7,margin:'0 auto 60px'}}>Guides et conseils pour gestionnaires de paie.</div></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:24,maxWidth:1100,margin:'0 auto'}}>
        {ARTICLES.map((a,i)=><div key={i} data-animate={`a${i}`} onClick={()=>setArticleOpen(a.id)} style={{...ani(`a${i}`,i*.1),padding:'36px 32px',borderRadius:20,border:'1px solid rgba(198,163,78,.04)',background:'rgba(255,255,255,.01)',cursor:'pointer',transition:'all .5s'}} onMouseOver={e=>{e.currentTarget.style.borderColor='rgba(198,163,78,.12)';e.currentTarget.style.transform='translateY(-4px)'}} onMouseOut={e=>{e.currentTarget.style.borderColor='rgba(198,163,78,.04)';e.currentTarget.style.transform='none'}}>
          <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}><span style={{padding:'4px 12px',borderRadius:50,fontSize:9,letterSpacing:1,textTransform:'uppercase',fontWeight:600,background:'rgba(198,163,78,.06)',color:'#c6a34e'}}>{a.tag}</span><span style={{fontSize:10,color:'#555'}}>{a.date}</span><span style={{fontSize:10,color:'#555'}}>{a.read}</span></div>
          <div style={{fontFamily:S.serif,fontSize:22,fontWeight:500,marginBottom:12,lineHeight:1.3}}>{a.title}</div>
          <div style={{fontSize:13,color:'#888',lineHeight:1.7,marginBottom:20}}>{a.excerpt}</div>
          <div style={{fontSize:12,color:'#c6a34e',fontWeight:600}}>Lire l'article →</div>
        </div>)}
      </div>
    </section>

    {/* ARTICLE MODALS */}
    {ARTICLES.map(a=><div key={a.id} onClick={e=>{if(e.target===e.currentTarget)setArticleOpen(null)}} style={{position:'fixed',inset:0,zIndex:300,background:'rgba(0,0,0,.7)',backdropFilter:'blur(16px)',opacity:articleOpen===a.id?1:0,pointerEvents:articleOpen===a.id?'all':'none',transition:'opacity .5s',overflowY:'auto',fontFamily:f,color:'#e5e5e5'}}>
      <div style={{maxWidth:780,margin:'40px auto',padding:'56px 48px',borderRadius:24,background:'linear-gradient(180deg,#0c1020,#060810)',border:'1px solid rgba(198,163,78,.08)',position:'relative',transform:articleOpen===a.id?'translateY(0)':'translateY(30px)',opacity:articleOpen===a.id?1:0,transition:'all .5s'}}>
        <button onClick={()=>setArticleOpen(null)} style={{position:'absolute',top:20,right:20,width:44,height:44,borderRadius:'50%',border:'1px solid rgba(198,163,78,.1)',background:'transparent',color:'#888',fontSize:22,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
        <span style={{display:'inline-block',padding:'6px 16px',borderRadius:50,fontSize:10,letterSpacing:1.5,textTransform:'uppercase',fontWeight:600,background:'rgba(198,163,78,.08)',color:'#c6a34e',marginBottom:20}}>{a.tag}</span>
        <h2 style={{fontFamily:S.serif,fontSize:36,fontWeight:400,marginBottom:12,lineHeight:1.2}}>{a.title}</h2>
        <div style={{fontSize:12,color:'#555',marginBottom:32,paddingBottom:24,borderBottom:'1px solid rgba(198,163,78,.06)'}}>Publié le {a.date} • {a.read} de lecture</div>
        {a.sections.map((sec,j)=><div key={j}><h3 style={{fontFamily:S.serif,fontSize:22,fontWeight:500,color:'#e2c878',margin:'32px 0 12px'}}>{sec.h}</h3><p style={{fontSize:14,color:'#888',lineHeight:1.8,marginBottom:16}}>{sec.p}</p></div>)}
        <div style={{padding:24,borderRadius:16,background:'rgba(198,163,78,.04)',border:'1px solid rgba(198,163,78,.08)',margin:'24px 0'}}><div style={{fontSize:14,fontWeight:600,color:'#c6a34e',marginBottom:8}}>💡 Aureus Social Pro</div><p style={{fontSize:13,color:'#888',lineHeight:1.7,margin:0}}>{a.highlight}</p></div>
        <div style={{textAlign:'center',padding:32,borderRadius:16,background:'rgba(198,163,78,.03)',border:'1px solid rgba(198,163,78,.06)',marginTop:32}}><p style={{fontSize:16,marginBottom:16}}>Prêt à essayer ?</p><button onClick={()=>{setArticleOpen(null);goLogin()}} style={{padding:'14px 40px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#c6a34e,#8b6914)',color:'#fff',fontFamily:f,fontSize:14,fontWeight:600,cursor:'pointer'}}>Essayer gratuitement</button></div>
      </div>
    </div>)}

    {/* PRICING */}
    <section id="tarifs" style={{padding:'120px 60px',fontFamily:f,color:'#e5e5e5'}}>
      <div data-animate="pr" style={{...ani('pr'),textAlign:'center'}}><div style={{fontSize:11,color:'#c6a34e',letterSpacing:3,textTransform:'uppercase',fontWeight:500,marginBottom:16}}>Tarifs</div><div style={{fontFamily:S.serif,fontSize:'clamp(32px,4vw,52px)',fontWeight:300,lineHeight:1.15,marginBottom:20}}>Transparent et <em style={{fontStyle:'italic',color:'#c6a34e'}}>compétitif</em></div><div style={{fontSize:15,color:'#888',maxWidth:560,lineHeight:1.7,margin:'0 auto 60px'}}>Contactez-nous pour un devis personnalisé.</div></div>
      <div data-animate="pc" style={{...ani('pc'),display:'flex',gap:24,maxWidth:900,margin:'0 auto',justifyContent:'center'}}>
        {[{name:'Starter',desc:'Indépendants & TPE',features:["Jusqu'à 5 travailleurs","Calcul paie complet","DmfA + Belcotax XML","Portail employé","Support email"],featured:false},{name:'Pro',desc:'PME & Fiduciaires',features:["Tout Starter inclus","DIMONA + SEPA auto","Signature électronique","API REST + Webhooks","Reporting avancé","Support prioritaire"],featured:true}].map((plan,i)=><div key={i} style={{flex:1,maxWidth:400,padding:'44px 36px',borderRadius:20,border:plan.featured?'1px solid rgba(198,163,78,.25)':'1px solid rgba(198,163,78,.08)',background:plan.featured?'linear-gradient(180deg,rgba(198,163,78,.06),rgba(198,163,78,.01))':'linear-gradient(180deg,rgba(198,163,78,.02),transparent)',textAlign:'center'}}>
          <div style={{fontSize:12,color:'#c6a34e',letterSpacing:2,textTransform:'uppercase',marginBottom:12}}>{plan.name}</div>
          <div style={{fontFamily:S.serif,fontSize:32,fontWeight:300,color:'#e2c878',marginBottom:4}}>À consulter</div>
          <div style={{fontSize:12,color:'#555',marginBottom:24}}>{plan.desc}</div>
          <ul style={{listStyle:'none',textAlign:'left',marginBottom:32}}>{plan.features.map((ff,j)=><li key={j} style={{padding:'8px 0',fontSize:13,color:'#888',borderBottom:'1px solid rgba(255,255,255,.03)',display:'flex',alignItems:'center',gap:10}}><span style={{width:4,height:4,borderRadius:'50%',background:'#c6a34e',flexShrink:0}}/>{ff}</li>)}</ul>
          <button onClick={goLogin} style={{width:'100%',padding:16,borderRadius:10,border:plan.featured?'none':'1px solid rgba(198,163,78,.25)',background:plan.featured?'linear-gradient(135deg,#c6a34e,#8b6914)':'transparent',color:plan.featured?'#fff':'#c6a34e',fontFamily:f,fontSize:14,fontWeight:600,cursor:'pointer'}}>{plan.featured?'Demander un devis':'Nous contacter'}</button>
        </div>)}
      </div>
    </section>

    {/* FAQ */}
    <section id="faq" style={{padding:'120px 60px',background:'linear-gradient(180deg,#0f1328,#060810)',fontFamily:f,color:'#e5e5e5'}}>
      <div data-animate="fq" style={{...ani('fq'),textAlign:'center'}}><div style={{fontSize:11,color:'#c6a34e',letterSpacing:3,textTransform:'uppercase',fontWeight:500,marginBottom:16}}>FAQ</div><div style={{fontFamily:S.serif,fontSize:'clamp(32px,4vw,52px)',fontWeight:300,lineHeight:1.15,marginBottom:60}}>Questions <em style={{fontStyle:'italic',color:'#c6a34e'}}>fréquentes</em></div></div>
      <div style={{maxWidth:700,margin:'0 auto'}}>
        {FAQ_DATA.map((ff,i)=><div key={i} data-animate={`q${i}`} style={{...ani(`q${i}`,i*.05),borderBottom:'1px solid rgba(198,163,78,.06)'}}>
          <div onClick={()=>setFaqOpen(faqOpen===i?null:i)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 0',cursor:'pointer'}}>
            <span style={{fontSize:15,fontWeight:500,color:faqOpen===i?'#c6a34e':'#e5e5e5'}}>{ff.q}</span>
            <span style={{fontSize:20,color:'#c6a34e',transform:faqOpen===i?'rotate(45deg)':'none',transition:'transform .3s'}}>+</span>
          </div>
          <div style={{maxHeight:faqOpen===i?200:0,overflow:'hidden',transition:'max-height .4s ease'}}><p style={{fontSize:13,color:'#888',lineHeight:1.7,paddingBottom:20}}>{ff.a}</p></div>
        </div>)}
      </div>
    </section>

    {/* CTA */}
    <section style={{textAlign:'center',padding:'120px 40px',background:'linear-gradient(180deg,#060810,#0f1328,#060810)',position:'relative',fontFamily:f,color:'#e5e5e5'}}>
      <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:600,height:600,borderRadius:'50%',background:'radial-gradient(circle,rgba(198,163,78,.04) 0%,transparent 70%)',pointerEvents:'none'}}/>
      <div style={{position:'relative',zIndex:1}}><div style={{fontSize:11,color:'#c6a34e',letterSpacing:3,textTransform:'uppercase',fontWeight:500,marginBottom:16}}>Prêt à commencer ?</div><div style={{fontFamily:S.serif,fontSize:'clamp(32px,4vw,52px)',fontWeight:300,lineHeight:1.15,maxWidth:600,margin:'0 auto 24px'}}>Rejoignez la <em style={{fontStyle:'italic',color:'#c6a34e'}}>révolution</em> de la paie belge</div><p style={{fontSize:15,color:'#888',maxWidth:480,margin:'0 auto 40px',lineHeight:1.7}}>Dites adieu aux logiciels obsolètes. Aureus Social Pro modernise votre secrétariat social.</p>
        <div style={{display:'flex',gap:16,justifyContent:'center'}}><button onClick={goLogin} style={{padding:'16px 40px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#c6a34e,#8b6914)',color:'#fff',fontFamily:f,fontSize:14,fontWeight:600,cursor:'pointer'}}>Créer un compte</button><button onClick={()=>window.open('mailto:info@aureus-ia.com')} style={{padding:'16px 40px',borderRadius:10,border:'1px solid rgba(198,163,78,.25)',background:'transparent',color:'#c6a34e',fontFamily:f,fontSize:14,fontWeight:500,cursor:'pointer'}}>Nous contacter</button></div>
      </div>
    </section>

    {/* FOOTER */}
    <footer style={{padding:60,borderTop:'1px solid rgba(198,163,78,.06)',display:'flex',justifyContent:'space-between',alignItems:'center',fontFamily:f,color:'#e5e5e5'}}>
      <div style={{fontFamily:S.serif,fontSize:16,color:'#888'}}><span style={{color:'#c6a34e'}}>AUREUS</span> SOCIAL PRO © {new Date().getFullYear()}</div>
      <div style={{display:'flex',gap:24}}>{[['Contact','mailto:info@aureus-ia.com'],['Confidentialité','#'],['CGU','#']].map(([l,h])=><a key={l} href={h} style={{color:'#555',textDecoration:'none',fontSize:12}}>{l}</a>)}</div>
      <div style={{fontSize:11,color:'#555'}}>Aureus IA SPRL — BCE BE 1028.230.781 — Bruxelles</div>
    </footer>
  </>);
}
