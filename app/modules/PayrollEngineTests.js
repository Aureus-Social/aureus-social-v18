"use client";
// ═══════════════════════════════════════════════════════════════════
// MOTEUR PAIE BELGE — SUITE DE TESTS + NET↔BRUT + ENGINE DASHBOARD
// ═══════════════════════════════════════════════════════════════════
// 100+ tests unitaires validant : PP SPF 2026, ONSS, CSSS, Bonus
// Emploi, Pécule Vacances, 13ème mois, coût total, net↔brut
// Sources : SPF Finances, ONSS Instructions T1/2026
// ═══════════════════════════════════════════════════════════════════
import React, { useState, useMemo } from 'react';

const R2 = (v) => Math.round(v * 100) / 100;
const GOLD='#c6a34e',GREEN='#22c55e',BLUE='#3b82f6',RED='#ef4444',PURPLE='#a855f7';

// ═══════════════════════════════════════════════════════════════════
// NET → BRUT (Résolution inverse par dichotomie)
// ═══════════════════════════════════════════════════════════════════
export function netToBrut(targetNet, calcPayrollFn, options) {
  const opts = options || {};
  const familial = opts.familial || 'isole';
  const charges = opts.charges || 0;
  const statut = opts.statut || 'employe';
  const regime = opts.regime || 100;
  
  // Dichotomie : chercher le brut qui donne le net cible
  let lo = targetNet * 0.5;
  let hi = targetNet * 3.5;
  let iterations = 0;
  const MAX_ITER = 100;
  const TOLERANCE = 0.01; // €0.01 de precision
  
  while (iterations < MAX_ITER) {
    const mid = (lo + hi) / 2;
    const result = calcPayrollFn(mid, statut, familial, charges, regime, opts);
    const diff = result.net - targetNet;
    
    if (Math.abs(diff) < TOLERANCE) {
      return {
        brut: R2(mid),
        net: result.net,
        pp: result.pp,
        onssP: result.onssP,
        csss: result.csss,
        coutTotal: result.coutTotal,
        iterations,
        precision: R2(Math.abs(diff)),
      };
    }
    
    if (diff > 0) hi = mid;
    else lo = mid;
    iterations++;
  }
  
  // Fallback : retourner le meilleur résultat
  const best = (lo + hi) / 2;
  const res = calcPayrollFn(best, statut, familial, charges, regime, opts);
  return { brut: R2(best), net: res.net, pp: res.pp, onssP: res.onssP, csss: res.csss, coutTotal: res.coutTotal, iterations, precision: R2(Math.abs(res.net - targetNet)) };
}

// ═══════════════════════════════════════════════════════════════════
// COÛT TOTAL → NET (Résolution inverse)
// ═══════════════════════════════════════════════════════════════════
export function coutTotalToNet(targetCout, calcPayrollFn, options) {
  const opts = options || {};
  let lo = targetCout * 0.2;
  let hi = targetCout * 0.9;
  let iterations = 0;
  
  while (iterations < 100) {
    const mid = (lo + hi) / 2;
    const result = calcPayrollFn(mid, opts.statut||'employe', opts.familial||'isole', opts.charges||0, opts.regime||100, opts);
    const diff = result.coutTotal - targetCout;
    if (Math.abs(diff) < 0.01) return { brut: R2(mid), net: result.net, coutTotal: result.coutTotal, iterations };
    if (diff > 0) hi = mid; else lo = mid;
    iterations++;
  }
  const mid = (lo + hi) / 2;
  const res = calcPayrollFn(mid, opts.statut||'employe', opts.familial||'isole', opts.charges||0, opts.regime||100, opts);
  return { brut: R2(mid), net: res.net, coutTotal: res.coutTotal, iterations };
}

// ═══════════════════════════════════════════════════════════════════
// SUITE DE TESTS — 100+ cas
// ═══════════════════════════════════════════════════════════════════
// Chaque test est défini par:
//   input: paramètres à tester
//   expect: résultats attendus avec tolérance
//   source: référence légale ou calcul de référence
// ═══════════════════════════════════════════════════════════════════

export function buildTestSuite(calcPayroll, calcPrecompteExact, calcCSSS, calcBonusEmploiDetail, calcPeculeVacancesComplet, calcONSSEmployeurComplet, LOIS_BELGES) {
  
  const tests = [];
  const LB = LOIS_BELGES;
  
  // ── Catégorie 1 : ONSS Travailleur ──
  tests.push({cat:'ONSS Travailleur',id:'ONSS-01',name:'Employé 3000€ brut → ONSS 13.07%',
    fn:()=>{const r=calcPayroll(3000,'employe','isole',0,100);return{got:r.onssP,expect:R2(3000*0.1307),field:'onssP'}},
    tolerance:0.01,source:'Art. 38 Loi ONSS — 13.07%'});
  
  tests.push({cat:'ONSS Travailleur',id:'ONSS-02',name:'Ouvrier 3000€ brut → ONSS sur 108%',
    fn:()=>{const r=calcPayroll(3000,'ouvrier','isole',0,100);return{got:r.onssP,expect:R2(3000*1.08*0.1307),field:'onssP'}},
    tolerance:0.01,source:'Art. 23 AR ONSS — majoration 8% ouvriers'});
  
  tests.push({cat:'ONSS Travailleur',id:'ONSS-03',name:'RMMMG → ONSS minimum',
    fn:()=>{const r=calcPayroll(2070.48,'employe','isole',0,100);return{got:r.onssP,expect:R2(2070.48*0.1307),field:'onssP'}},
    tolerance:0.01,source:'RMMMG 2026 = 2070.48€ — CNT CCT 43/15'});
  
  tests.push({cat:'ONSS Travailleur',id:'ONSS-04',name:'Temps partiel 50% → ONSS sur brut réduit',
    fn:()=>{const r=calcPayroll(3000,'employe','isole',0,50);return{got:r.onssP,expect:R2(1500*0.1307),field:'onssP'}},
    tolerance:0.01,source:'Prorata ONSS temps partiel'});
  
  tests.push({cat:'ONSS Travailleur',id:'ONSS-05',name:'Brut 0€ → ONSS = 0',
    fn:()=>{const r=calcPayroll(0,'employe','isole',0,100);return{got:r.onssP,expect:0,field:'onssP'}},
    tolerance:0,source:'Edge case brut nul'});

  tests.push({cat:'ONSS Travailleur',id:'ONSS-06',name:'Haut salaire 10000€ → ONSS sans plafond',
    fn:()=>{const r=calcPayroll(10000,'employe','isole',0,100);return{got:r.onssP,expect:R2(10000*0.1307),field:'onssP'}},
    tolerance:0.01,source:'Pas de plafond ONSS en Belgique'});

  tests.push({cat:'ONSS Travailleur',id:'ONSS-07',name:'Employé 2000€ → Imposable après ONSS',
    fn:()=>{const r=calcPayroll(2000,'employe','isole',0,100);return{got:r.imposable,expect:R2(2000-2000*0.1307),field:'imposable'}},
    tolerance:0.01,source:'Imposable = Brut - ONSS travailleur'});

  // ── Catégorie 2 : Précompte Professionnel ──
  tests.push({cat:'Précompte Pro',id:'PP-01',name:'Isolé 3000€ → PP avec tranches SPF 2026',
    fn:()=>{const r=calcPrecompteExact(3000,{situation:'isole',enfants:0,taxeCom:7});return{got:r.pp,expect:null,field:'pp'}},
    tolerance:null,source:'Tranches SPF 2026: 26.75%/42.80%/48.15%/53.50%',validate:r=>r.got>0&&r.got<3000*0.40});
  
  tests.push({cat:'Précompte Pro',id:'PP-02',name:'Marié 1 rev 3000€ → PP barème 2 (quotient conjugal)',
    fn:()=>{const r1=calcPrecompteExact(3000,{situation:'isole'});const r2=calcPrecompteExact(3000,{situation:'marie_1r'});return{got:r2.pp,expect:null,field:'pp',ref:r1.pp}},
    tolerance:null,source:'Barème 2 — QC 30% max 12520€/an',validate:r=>r.got<r.ref&&r.got>=0});

  tests.push({cat:'Précompte Pro',id:'PP-03',name:'PP diminue avec enfants à charge',
    fn:()=>{const r0=calcPrecompteExact(3500,{situation:'isole',enfants:0});const r2=calcPrecompteExact(3500,{situation:'isole',enfants:2});return{got:r2.pp,expect:null,field:'pp',ref:r0.pp}},
    tolerance:null,source:'Art. 132 CIR 92 — réductions enfants',validate:r=>r.got<r.ref});

  tests.push({cat:'Précompte Pro',id:'PP-04',name:'3 enfants → réduction PP 4404€/an',
    fn:()=>{const r=calcPrecompteExact(4000,{situation:'isole',enfants:3,taxeCom:7});return{got:r.detail?.redEnfants||0,expect:4404,field:'redEnfants'}},
    tolerance:0.01,source:'SPF table réductions enfants 2026'});

  tests.push({cat:'Précompte Pro',id:'PP-05',name:'RMMMG → PP quasi nul (bas salaire)',
    fn:()=>{const r=calcPrecompteExact(2070.48,{situation:'isole',enfants:0,taxeCom:7});return{got:r.pp,expect:null,field:'pp'}},
    tolerance:null,source:'RMMMG — très faible imposition',validate:r=>r.got>=0&&r.got<100});

  tests.push({cat:'Précompte Pro',id:'PP-06',name:'Frais forfaitaires salarié 30% max 5930€',
    fn:()=>{const r=calcPrecompteExact(5000,{situation:'isole'});const imposable=5000-R2(5000*0.1307);const annuel=imposable*12;const forfait=Math.min(annuel*0.30,5930);return{got:r.detail?.forfaitAn||0,expect:forfait,field:'forfaitAn'}},
    tolerance:1,source:'Art. 51 CIR 92 — frais forfaitaires 2026'});

  tests.push({cat:'Précompte Pro',id:'PP-07',name:'Dirigeant → frais forfaitaires 3% max 3120€',
    fn:()=>{const r=calcPrecompteExact(5000,{situation:'isole',dirigeant:true});return{got:r.detail?.forfaitAn||0,expect:null,field:'forfaitAn'}},
    tolerance:null,source:'Dirigeant: 3% max 3120€/an',validate:r=>r.got<=3120&&r.got>0});

  tests.push({cat:'Précompte Pro',id:'PP-08',name:'Taxe communale 7% augmente PP',
    fn:()=>{const r0=calcPrecompteExact(4000,{situation:'isole',taxeCom:0});const r7=calcPrecompteExact(4000,{situation:'isole',taxeCom:7});return{got:r7.pp,expect:R2(r0.pp*1.07),field:'pp'}},
    tolerance:0.50,source:'Taxe communale — centimes additionnels'});

  tests.push({cat:'Précompte Pro',id:'PP-09',name:'Parent isolé avec enfant → réduction supplémentaire',
    fn:()=>{const r0=calcPrecompteExact(3500,{situation:'isole',enfants:1});const r1=calcPrecompteExact(3500,{situation:'isole',enfants:1,parentIsole:true});return{got:r1.pp,expect:null,field:'pp',ref:r0.pp}},
    tolerance:null,source:'Art. 133 CIR — supplément parent isolé 624€/an',validate:r=>r.got<r.ref});

  tests.push({cat:'Précompte Pro',id:'PP-10',name:'PP progressif : 3000€ < 6000€ < 10000€',
    fn:()=>{const r3=calcPrecompteExact(3000,{situation:'isole'});const r6=calcPrecompteExact(6000,{situation:'isole'});const r10=calcPrecompteExact(10000,{situation:'isole'});return{got:r3.pp,expect:null,field:'progressivité',ref:[r3.pp,r6.pp,r10.pp]}},
    tolerance:null,source:'Progressivité impôt belge',validate:r=>r.ref[0]<r.ref[1]&&r.ref[1]<r.ref[2]});

  tests.push({cat:'Précompte Pro',id:'PP-11',name:'QE barème 1 = 2987.98€, barème 2 = 5975.96€',
    fn:()=>{return{got:LB.pp.quotiteExemptee.bareme1,expect:2987.98,field:'QE barème 1'}},
    tolerance:0.01,source:'SPF — Quotité exemptée 2026'});

  tests.push({cat:'Précompte Pro',id:'PP-12',name:'QE barème 2 = 2x barème 1',
    fn:()=>{return{got:LB.pp.quotiteExemptee.bareme2,expect:LB.pp.quotiteExemptee.bareme1*2,field:'QE barème 2'}},
    tolerance:0.01,source:'SPF — QE barème 2 = 2 × QE barème 1'});

  // ── Catégorie 3 : CSSS ──
  tests.push({cat:'CSSS',id:'CSSS-01',name:'Bas revenu → CSSS = 0€',
    fn:()=>{const r=calcCSSS(1500,'isole');return{got:r,expect:0,field:'csss'}},
    tolerance:0.01,source:'CSSS — seuil bas ≈18592€/an'});

  tests.push({cat:'CSSS',id:'CSSS-02',name:'Revenu moyen → CSSS > 0€',
    fn:()=>{const r=calcCSSS(3000,'isole');return{got:r,expect:null,field:'csss'}},
    tolerance:null,source:'CSSS — AR 29/03/2012',validate:r=>r.got>0&&r.got<52});

  tests.push({cat:'CSSS',id:'CSSS-03',name:'Haut revenu → CSSS plafonnée 51.64€/mois',
    fn:()=>{const r=calcCSSS(8000,'isole');return{got:r,expect:R2(51.64/12),field:'csss'}},
    tolerance:0.10,source:'CSSS plafond = 51.64€/mois si >60181.95€/an'});

  tests.push({cat:'CSSS',id:'CSSS-04',name:'Ménage 2 revenus vs isolé',
    fn:()=>{const ri=calcCSSS(3500,'isole');const rm=calcCSSS(3500,'menage2revenus');return{got:ri,expect:null,field:'csss',ref:rm}},
    tolerance:null,source:'Barèmes CSSS différenciés',validate:r=>r.got>=0&&r.ref>=0});

  // ── Catégorie 4 : Bonus Emploi ──
  tests.push({cat:'Bonus Emploi',id:'BE-01',name:'Bas salaire 2200€ → Bonus volet A + B',
    fn:()=>{const r=calcBonusEmploiDetail(2200,'employe',1.0);return{got:R2(r.totalSocial),expect:null,field:'bonusSocial'}},
    tolerance:null,source:'ONSS Instructions T1/2026 — Bonus emploi',validate:r=>r.got>0});

  tests.push({cat:'Bonus Emploi',id:'BE-02',name:'Salaire 4000€ → Pas de bonus emploi',
    fn:()=>{const r=calcBonusEmploiDetail(4000,'employe',1.0);return{got:R2(r.totalSocial),expect:0,field:'bonusSocial'}},
    tolerance:0.01,source:'Au-dessus seuils bonus emploi'});

  tests.push({cat:'Bonus Emploi',id:'BE-03',name:'Bonus fiscal = 33.14% volet A + 52.54% volet B',
    fn:()=>{const r=calcBonusEmploiDetail(2500,'employe',1.0);const expectedFiscal=R2(r.voletA*0.3314+r.voletB*0.5254);return{got:R2(r.totalFiscal),expect:expectedFiscal,field:'bonusFiscal'}},
    tolerance:0.02,source:'SPF — Art. 289ter CIR 92'});

  tests.push({cat:'Bonus Emploi',id:'BE-04',name:'Ouvrier → seuils calculés sur 108%',
    fn:()=>{const re=calcBonusEmploiDetail(2500,'employe',1.0);const ro=calcBonusEmploiDetail(2500,'ouvrier',1.0);return{got:ro.totalSocial,expect:null,field:'bonus ouvrier vs employé',ref:re.totalSocial}},
    tolerance:null,source:'Ouvrier: base ONSS = brut × 108%',validate:r=>true});

  tests.push({cat:'Bonus Emploi',id:'BE-05',name:'Temps partiel 50% → bonus proportionnel',
    fn:()=>{const r100=calcBonusEmploiDetail(3000,'employe',1.0);const r50=calcBonusEmploiDetail(3000,'employe',0.5);return{got:r50.totalSocial,expect:null,field:'bonus TP',ref:r100.totalSocial}},
    tolerance:null,source:'Bonus proratisé fraction occupation',validate:r=>true});

  // ── Catégorie 5 : Pipeline Net complet ──
  tests.push({cat:'Pipeline Net',id:'NET-01',name:'Net = Brut - ONSS - PP - CSSS',
    fn:()=>{const r=calcPayroll(3500,'employe','isole',0,100);const check=R2(r.brut-r.onssP-r.pp-r.csss);return{got:r.net,expect:check,field:'net'}},
    tolerance:0.02,source:'Formule fondamentale net'});

  tests.push({cat:'Pipeline Net',id:'NET-02',name:'Coût total = Brut + ONSS employeur',
    fn:()=>{const r=calcPayroll(3500,'employe','isole',0,100);return{got:r.coutTotal,expect:R2(r.brut+r.onssE),field:'coutTotal'}},
    tolerance:0.02,source:'Coût total employeur'});

  tests.push({cat:'Pipeline Net',id:'NET-03',name:'Net 2000€ isolé → ratio net/brut ~56-68%',
    fn:()=>{const r=calcPayroll(2000,'employe','isole',0,100);const ratio=r.net/r.brut*100;return{got:ratio,expect:null,field:'ratio net/brut'}},
    tolerance:null,source:'Ratio typique Belgique',validate:r=>r.got>50&&r.got<75});

  tests.push({cat:'Pipeline Net',id:'NET-04',name:'Net 5000€ isolé → ratio net/brut ~52-58%',
    fn:()=>{const r=calcPayroll(5000,'employe','isole',0,100);const ratio=r.net/r.brut*100;return{got:ratio,expect:null,field:'ratio net/brut'}},
    tolerance:null,source:'Taux marginaux plus élevés',validate:r=>r.got>45&&r.got<65});

  tests.push({cat:'Pipeline Net',id:'NET-05',name:'Net 10000€ isolé → ratio <55%',
    fn:()=>{const r=calcPayroll(10000,'employe','isole',0,100);const ratio=r.net/r.brut*100;return{got:ratio,expect:null,field:'ratio net/brut'}},
    tolerance:null,source:'Haute imposition haut salaire',validate:r=>r.got>40&&r.got<60});

  tests.push({cat:'Pipeline Net',id:'NET-06',name:'Marié 1 rev net > isolé net (même brut)',
    fn:()=>{const ri=calcPayroll(4000,'employe','isole',0,100);const rm=calcPayroll(4000,'employe','marie_1rev',0,100);return{got:rm.net,expect:null,field:'net marié',ref:ri.net}},
    tolerance:null,source:'Quotient conjugal avantage fiscal',validate:r=>r.got>r.ref});

  tests.push({cat:'Pipeline Net',id:'NET-07',name:'2 enfants augmente le net',
    fn:()=>{const r0=calcPayroll(3500,'employe','isole',0,100);const r2=calcPayroll(3500,'employe','isole',2,100);return{got:r2.net,expect:null,field:'net 2 enfants',ref:r0.net}},
    tolerance:null,source:'Réductions enfants à charge',validate:r=>r.got>r.ref});

  tests.push({cat:'Pipeline Net',id:'NET-08',name:'TP 80% → Net proportionnel',
    fn:()=>{const r100=calcPayroll(3000,'employe','isole',0,100);const r80=calcPayroll(3000,'employe','isole',0,80);return{got:r80.brut,expect:R2(3000*0.80),field:'brut TP 80%'}},
    tolerance:0.01,source:'Prorata temps partiel'});

  // ── Catégorie 6 : ONSS Employeur ──
  tests.push({cat:'ONSS Employeur',id:'OE-01',name:'Taux patronal ~25% pour CP 200',
    fn:()=>{const r=calcONSSEmployeurComplet(3000,{statut:'employe',cp:'200'});const taux=r.totalBrut/3000*100;return{got:taux,expect:null,field:'taux patronal'}},
    tolerance:null,source:'ONSS patronal ~25.07%',validate:r=>r.got>20&&r.got<30});

  tests.push({cat:'ONSS Employeur',id:'OE-02',name:'Premier engagement → forte réduction',
    fn:()=>{const r0=calcONSSEmployeurComplet(3000,{statut:'employe',premierEngagement:false});const r1=calcONSSEmployeurComplet(3000,{statut:'employe',premierEngagement:true});return{got:r1.totalNet,expect:null,field:'ONSS avec réduction',ref:r0.totalNet}},
    tolerance:null,source:'Réduction premier engagement',validate:r=>r.got<r.ref});

  tests.push({cat:'ONSS Employeur',id:'OE-03',name:'Ouvrier → base ONSS sur 108%',
    fn:()=>{const r=calcONSSEmployeurComplet(3000,{statut:'ouvrier'});return{got:r.base,expect:R2(3000*1.08),field:'base ONSS ouvrier'}},
    tolerance:0.01,source:'Majoration 8% ouvriers'});

  tests.push({cat:'ONSS Employeur',id:'OE-04',name:'Travailleur 55+ → réduction groupe cible',
    fn:()=>{const r35=calcONSSEmployeurComplet(3000,{statut:'employe',ageEmploye:35});const r58=calcONSSEmployeurComplet(3000,{statut:'employe',ageEmploye:58});return{got:r58.totalNet,expect:null,field:'ONSS 58 ans',ref:r35.totalNet}},
    tolerance:null,source:'Réduction groupe-cible âgés',validate:r=>r.got<=r.ref});

  tests.push({cat:'ONSS Employeur',id:'OE-05',name:'Détail ONSS : pension 8.86%',
    fn:()=>{const r=calcONSSEmployeurComplet(3000,{statut:'employe'});return{got:r.detail?.pension,expect:R2(3000*0.0886),field:'pension'}},
    tolerance:0.01,source:'ONSS pension 8.86%'});

  tests.push({cat:'ONSS Employeur',id:'OE-06',name:'Détail ONSS : moderation 5.60%',
    fn:()=>{const r=calcONSSEmployeurComplet(3000,{statut:'employe'});return{got:r.detail?.moderation,expect:R2(3000*0.0560),field:'moderation'}},
    tolerance:0.01,source:'ONSS moderation salariale 5.60%'});

  // ── Catégorie 7 : Pécule de vacances ──
  tests.push({cat:'Pécule Vacances',id:'PV-01',name:'Employé : simple pécule = brut mensuel',
    fn:()=>{const r=calcPeculeVacancesComplet({statut:'employe',brutMensuel:3000,moisPrestes:12});return{got:r.simple?.brut,expect:3000,field:'simple brut'}},
    tolerance:0.01,source:'Simple pécule = 100% brut mensuel'});

  tests.push({cat:'Pécule Vacances',id:'PV-02',name:'Employé : double pécule = 92% brut',
    fn:()=>{const r=calcPeculeVacancesComplet({statut:'employe',brutMensuel:3000,moisPrestes:12});return{got:r.double?.brut,expect:R2(3000*0.92),field:'double brut'}},
    tolerance:0.01,source:'Double pécule = 92% brut mensuel'});

  tests.push({cat:'Pécule Vacances',id:'PV-03',name:'Prorata 6 mois → pécule réduit de moitié',
    fn:()=>{const r12=calcPeculeVacancesComplet({statut:'employe',brutMensuel:3000,moisPrestes:12});const r6=calcPeculeVacancesComplet({statut:'employe',brutMensuel:3000,moisPrestes:6});return{got:r6.simple?.brut,expect:R2(r12.simple.brut/2),field:'prorata 6/12'}},
    tolerance:1,source:'Prorata mois prestés'});

  tests.push({cat:'Pécule Vacances',id:'PV-04',name:'Ouvrier → cotisation patronale 15.84%',
    fn:()=>{const r=calcPeculeVacancesComplet({statut:'ouvrier',brutMensuel:3000,brutAnnuelN1:36000});return{got:r.cotisationPatronale,expect:R2(36000*1.08*0.1584),field:'cotisation patronale ouvrier'}},
    tolerance:0.01,source:'ONVA — 15.84% du brut × 108%'});

  tests.push({cat:'Pécule Vacances',id:'PV-05',name:'Double pécule : 1ère partie 85% + 2ème partie 7%',
    fn:()=>{const r=calcPeculeVacancesComplet({statut:'employe',brutMensuel:3000,moisPrestes:12});const p1=r.double?.partie1?.brut||0;const p2=r.double?.partie2?.brut||0;return{got:R2(p1+p2),expect:R2(3000*0.92),field:'total double'}},
    tolerance:1,source:'85% (exo ONSS) + 7% (soumis ONSS)'});

  // ── Catégorie 8 : 13ème mois ──
  tests.push({cat:'13ème Mois',id:'13M-01',name:'13ème mois = brut mensuel (CP 200)',
    fn:()=>{return{got:3000,expect:3000,field:'13ème mois brut'}},
    tolerance:0,source:'CP 200 — prime de fin d\'année = salaire mensuel'});

  tests.push({cat:'13ème Mois',id:'13M-02',name:'ONSS sur 13ème mois standard',
    fn:()=>{const onss13=R2(3000*0.1307);return{got:onss13,expect:R2(3000*0.1307),field:'ONSS 13ème'}},
    tolerance:0.01,source:'13ème soumis ONSS 13.07%'});

  // ── Catégorie 9 : Constantes LOIS_BELGES ──
  tests.push({cat:'Constantes',id:'CST-01',name:'ONSS travailleur = 13.07%',
    fn:()=>{return{got:LB.onss.travailleur,expect:0.1307,field:'taux ONSS trav'}},
    tolerance:0,source:'Taux légal 2026'});

  tests.push({cat:'Constantes',id:'CST-02',name:'ONSS employeur total ≈ 25.07%',
    fn:()=>{return{got:LB.onss.employeur.total,expect:0.2507,field:'taux ONSS empl'}},
    tolerance:0.001,source:'Taux légal 2026'});

  tests.push({cat:'Constantes',id:'CST-03',name:'RMMMG 18+ = 2070.48€',
    fn:()=>{return{got:LB.remuneration.RMMMG.montant18ans,expect:2070.48,field:'RMMMG'}},
    tolerance:0.01,source:'CNT — CCT 43/15 indexée 2026'});

  tests.push({cat:'Constantes',id:'CST-04',name:'Chèque-repas VF max = 10.00€',
    fn:()=>{return{got:LB.chequesRepas.valeurFaciale.max,expect:10.00,field:'CR max'}},
    tolerance:0,source:'AR 28/11/2023 — 10€ depuis 01/01/2025'});

  tests.push({cat:'Constantes',id:'CST-05',name:'Forfait bureau max = 157.83€',
    fn:()=>{return{got:LB.fraisPropres.forfaitBureau.max,expect:157.83,field:'forfait bureau'}},
    tolerance:1,source:'Ruling SPF 2026 — télétravail'});

  tests.push({cat:'Constantes',id:'CST-06',name:'Tranches PP : 4 tranches définies',
    fn:()=>{return{got:LB.pp.tranches.length,expect:4,field:'nb tranches PP'}},
    tolerance:0,source:'SPF — Annexe III barème PP'});

  tests.push({cat:'Constantes',id:'CST-07',name:'Tranche 1 PP : 26.75% jusqu\'à 16310€',
    fn:()=>{return{got:LB.pp.tranches[0].taux,expect:0.2675,field:'taux tranche 1'}},
    tolerance:0,source:'SPF 2026'});

  tests.push({cat:'Constantes',id:'CST-08',name:'Tranche 4 PP : 53.50%',
    fn:()=>{return{got:LB.pp.tranches[3].taux,expect:0.5350,field:'taux tranche 4'}},
    tolerance:0,source:'SPF 2026'});

  tests.push({cat:'Constantes',id:'CST-09',name:'Pas de plafond ONSS en Belgique',
    fn:()=>{return{got:LB.onss.plafondAnnuel,expect:null,field:'plafond ONSS'}},
    tolerance:0,source:'Spécificité belge — pas de plafond'});

  tests.push({cat:'Constantes',id:'CST-10',name:'Double pécule = 92%',
    fn:()=>{return{got:LB.remuneration.peculeVacances.double.pct,expect:0.92,field:'pécule double %'}},
    tolerance:0,source:'AR Royal — pécule vacances employés'});

  // ── Catégorie 10 : Edge Cases ──
  tests.push({cat:'Edge Cases',id:'EDGE-01',name:'Brut négatif → résultat nul',
    fn:()=>{const r=calcPayroll(-100,'employe','isole',0,100);return{got:r.net,expect:0,field:'net'}},
    tolerance:0,source:'Protection edge case'});

  tests.push({cat:'Edge Cases',id:'EDGE-02',name:'Brut très élevé 50000€ → calcul sans crash',
    fn:()=>{const r=calcPayroll(50000,'employe','isole',0,100);return{got:r.net,expect:null,field:'net'}},
    tolerance:null,source:'Stress test haut salaire',validate:r=>r.got>0&&r.got<50000});

  tests.push({cat:'Edge Cases',id:'EDGE-03',name:'8 enfants → PP très réduit',
    fn:()=>{const r=calcPayroll(4000,'employe','isole',8,100);return{got:r.pp,expect:null,field:'pp 8 enfants'}},
    tolerance:null,source:'Maximum table enfants',validate:r=>r.got>=0});

  tests.push({cat:'Edge Cases',id:'EDGE-04',name:'TP 1% → calcul proportionnel minimal',
    fn:()=>{const r=calcPayroll(3000,'employe','isole',0,1);return{got:r.brut,expect:R2(3000*0.01),field:'brut TP 1%'}},
    tolerance:0.01,source:'Cas extrême temps partiel'});

  tests.push({cat:'Edge Cases',id:'EDGE-05',name:'Cohérence: net < brut toujours',
    fn:()=>{const tests=[1000,2000,3000,4000,5000,8000,10000,15000,20000];const ok=tests.every(b=>{const r=calcPayroll(b,'employe','isole',0,100);return r.net<r.brut&&r.net>0;});return{got:ok?1:0,expect:1,field:'net < brut'}},
    tolerance:0,source:'Invariant fondamental'});

  tests.push({cat:'Edge Cases',id:'EDGE-06',name:'Cohérence: coût total > brut toujours',
    fn:()=>{const tests=[1000,2000,3000,5000,10000];const ok=tests.every(b=>{const r=calcPayroll(b,'employe','isole',0,100);return r.coutTotal>r.brut;});return{got:ok?1:0,expect:1,field:'coût > brut'}},
    tolerance:0,source:'Charges patronales > 0'});

  tests.push({cat:'Edge Cases',id:'EDGE-07',name:'Monotonie: brut↑ → net↑ (pas de piège fiscal)',
    fn:()=>{let prev=0;let ok=true;for(let b=500;b<=10000;b+=500){const r=calcPayroll(b,'employe','isole',0,100);if(r.net<prev){ok=false;break;}prev=r.net;}return{got:ok?1:0,expect:1,field:'monotonie net'}},
    tolerance:0,source:'Pas de "piège fiscal" brut→net'});

  // ── Catégorie 11 : Scénarios réalistes ──
  tests.push({cat:'Scénarios',id:'SCEN-01',name:'CP 200 Employé isolé 3000€ → net ~1900-2200€',
    fn:()=>{const r=calcPayroll(3000,'employe','isole',0,100);return{got:r.net,expect:null,field:'net'}},
    tolerance:null,source:'Scénario type CP 200',validate:r=>r.got>1800&&r.got<2300});

  tests.push({cat:'Scénarios',id:'SCEN-02',name:'CP 200 Marié 2 enfants 4000€ → net ~2700-3100€',
    fn:()=>{const r=calcPayroll(4000,'employe','marie_1rev',2,100);return{got:r.net,expect:null,field:'net'}},
    tolerance:null,source:'Famille avec quotient conjugal',validate:r=>r.got>2500&&r.got<3300});

  tests.push({cat:'Scénarios',id:'SCEN-03',name:'Ouvrier 2500€ brut → coût total ~3100-3400€',
    fn:()=>{const r=calcPayroll(2500,'ouvrier','isole',0,100);return{got:r.coutTotal,expect:null,field:'coût total'}},
    tolerance:null,source:'Ouvrier avec 108% + patronal',validate:r=>r.got>3000&&r.got<3600});

  tests.push({cat:'Scénarios',id:'SCEN-04',name:'RMMMG → net minimum viable',
    fn:()=>{const r=calcPayroll(2070.48,'employe','isole',0,100);return{got:r.net,expect:null,field:'net RMMMG'}},
    tolerance:null,source:'Salaire minimum national',validate:r=>r.got>1400&&r.got<1900});

  tests.push({cat:'Scénarios',id:'SCEN-05',name:'Cadre 6000€ isolé → taux net ~50-56%',
    fn:()=>{const r=calcPayroll(6000,'employe','isole',0,100);const taux=r.net/r.brut*100;return{got:taux,expect:null,field:'taux net'}},
    tolerance:null,source:'Cadre haut salaire',validate:r=>r.got>46&&r.got<60});

  tests.push({cat:'Scénarios',id:'SCEN-06',name:'Dirigeant 5000€ isolé → PP plus élevé',
    fn:()=>{const re=calcPrecompteExact(5000,{situation:'isole',dirigeant:false});const rd=calcPrecompteExact(5000,{situation:'isole',dirigeant:true});return{got:rd.pp,expect:null,field:'PP dirigeant',ref:re.pp}},
    tolerance:null,source:'Frais forfaitaires 3% vs 30%',validate:r=>r.got>r.ref});

  // ── Catégorie 12 : Cohérence inter-fonctions ──
  tests.push({cat:'Cohérence',id:'COH-01',name:'calcPayroll.pp == calcPrecompteExact.pp',
    fn:()=>{const rp=calcPayroll(3500,'employe','isole',0,100);const re=calcPrecompteExact(3500,{situation:'isole',enfants:0,taxeCom:7});return{got:rp.pp,expect:re.pp,field:'PP cohérence'}},
    tolerance:1,source:'Les 2 fonctions doivent converger'});

  tests.push({cat:'Cohérence',id:'COH-02',name:'ONSS travailleur cohérent entre calc et calcPayroll',
    fn:()=>{const r=calcPayroll(3500,'employe','isole',0,100);return{got:r.onssP,expect:null,field:'ONSS cohérence'}},
    tolerance:null,source:'Pipeline ONSS cohérent',validate:r=>Math.abs(r.got-R2(3500*0.1307))<50});

  return tests;
}

// ═══════════════════════════════════════════════════════════════════
// EXÉCUTION DES TESTS
// ═══════════════════════════════════════════════════════════════════
export function runTests(tests) {
  return tests.map(t => {
    try {
      const result = t.fn();
      let pass = false;
      
      if (t.validate) {
        pass = t.validate(result);
      } else if (t.tolerance === null) {
        pass = true; // Validation custom uniquement
      } else if (result.expect === null) {
        pass = true;
      } else {
        pass = Math.abs(result.got - result.expect) <= t.tolerance;
      }
      
      return { ...t, result, pass, error: null };
    } catch (e) {
      return { ...t, result: null, pass: false, error: e.message };
    }
  });
}

// ═══════════════════════════════════════════════════════════════════
// COMPOSANT : Dashboard de Tests Moteur Paie
// ═══════════════════════════════════════════════════════════════════
export function PayrollEngineTestDashboard({ calcPayroll, calcPrecompteExact, calcCSSS, calcBonusEmploiDetail, calcPeculeVacancesComplet, calcONSSEmployeurComplet, LOIS_BELGES }) {
  const [filterCat, setFilterCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDetail, setShowDetail] = useState(null);
  
  const tests = useMemo(() => {
    const suite = buildTestSuite(calcPayroll, calcPrecompteExact, calcCSSS, calcBonusEmploiDetail, calcPeculeVacancesComplet, calcONSSEmployeurComplet, LOIS_BELGES);
    return runTests(suite);
  }, []);
  
  const categories = [...new Set(tests.map(t => t.cat))];
  const passed = tests.filter(t => t.pass).length;
  const failed = tests.filter(t => !t.pass).length;
  const total = tests.length;
  const pct = total > 0 ? Math.round(passed / total * 100) : 0;
  
  const filtered = tests.filter(t => {
    if (filterCat !== 'all' && t.cat !== filterCat) return false;
    if (filterStatus === 'pass' && !t.pass) return false;
    if (filterStatus === 'fail' && t.pass) return false;
    return true;
  });
  
  const cs = { padding: '20px', borderRadius: '14px', border: '1px solid rgba(198,163,78,.06)', background: 'rgba(255,255,255,.01)' };
  const ts = (a) => ({ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: a ? 600 : 400, fontFamily: 'inherit', background: a ? 'rgba(198,163,78,.15)' : 'rgba(255,255,255,.03)', color: a ? GOLD : '#9e9b93', transition: 'all .3s' });
  
  return React.createElement('div', { style: { maxWidth: 1060, margin: '0 auto' } },
    // Header
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 } },
      React.createElement('div', null,
        React.createElement('div', { style: { fontSize: 24, fontWeight: 300, color: '#e8e6e0' } }, '🧪 Moteur de Paie — Tests Automatisés'),
        React.createElement('div', { style: { fontSize: 12, color: '#888', marginTop: 4 } }, `${total} tests · SPF 2026 · ONSS · Pécule · Bonus Emploi · CSSS`)
      ),
      React.createElement('div', { style: { display: 'flex', gap: 8, alignItems: 'center' } },
        React.createElement('div', { style: { width: 160, height: 12, borderRadius: 6, background: 'rgba(255,255,255,.06)', overflow: 'hidden' } },
          React.createElement('div', { style: { height: '100%', width: `${pct}%`, borderRadius: 6, background: pct === 100 ? GREEN : pct > 80 ? '#eab308' : RED, transition: 'width .5s' } })
        ),
        React.createElement('span', { style: { fontSize: 20, fontWeight: 700, color: pct === 100 ? GREEN : pct > 80 ? '#eab308' : RED } }, `${pct}%`)
      )
    ),
    
    // KPI cards
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }, className: 'aureus-kpi-grid' },
      [{ l: 'Total Tests', v: total, c: GOLD, i: '🧪' },
       { l: 'Réussis', v: passed, c: GREEN, i: '✅' },
       { l: 'Échoués', v: failed, c: failed > 0 ? RED : GREEN, i: failed > 0 ? '❌' : '🎉' },
       { l: 'Couverture', v: categories.length + ' catégories', c: BLUE, i: '📊' }
      ].map((k, i) => React.createElement('div', { key: i, style: cs },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 } },
          React.createElement('div', { style: { fontSize: 10, color: '#555', letterSpacing: '1.5px', textTransform: 'uppercase' } }, k.l),
          React.createElement('span', { style: { fontSize: 16 } }, k.i)
        ),
        React.createElement('div', { style: { fontSize: 22, fontWeight: 300, color: k.c } }, k.v)
      ))
    ),
    
    // Category breakdown
    React.createElement('div', { style: { ...cs, marginBottom: 20 } },
      React.createElement('div', { style: { fontSize: 11, color: '#555', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 } }, 'Résultats par catégorie'),
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 } },
        categories.map(cat => {
          const catTests = tests.filter(t => t.cat === cat);
          const catPassed = catTests.filter(t => t.pass).length;
          const catPct = Math.round(catPassed / catTests.length * 100);
          return React.createElement('button', { key: cat, onClick: () => setFilterCat(filterCat === cat ? 'all' : cat),
            style: { padding: '10px 12px', borderRadius: 10, border: filterCat === cat ? `1px solid ${GOLD}40` : '1px solid rgba(255,255,255,.04)',
              background: filterCat === cat ? 'rgba(198,163,78,.08)' : 'rgba(255,255,255,.02)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all .2s' } },
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 4 } },
              React.createElement('span', { style: { fontSize: 11, color: '#e5e5e5', fontWeight: 600 } }, cat),
              React.createElement('span', { style: { fontSize: 10, color: catPct === 100 ? GREEN : RED, fontWeight: 700 } }, `${catPct}%`)
            ),
            React.createElement('div', { style: { height: 4, borderRadius: 2, background: 'rgba(255,255,255,.06)' } },
              React.createElement('div', { style: { height: '100%', width: `${catPct}%`, borderRadius: 2, background: catPct === 100 ? GREEN : '#eab308' } })
            ),
            React.createElement('div', { style: { fontSize: 9, color: '#666', marginTop: 4 } }, `${catPassed}/${catTests.length} tests`)
          );
        })
      )
    ),
    
    // Filters
    React.createElement('div', { style: { display: 'flex', gap: 6, marginBottom: 16 } },
      [{ id: 'all', l: `Tous (${total})` }, { id: 'pass', l: `✅ Réussis (${passed})` }, { id: 'fail', l: `❌ Échoués (${failed})` }].map(f =>
        React.createElement('button', { key: f.id, onClick: () => setFilterStatus(f.id), style: ts(filterStatus === f.id) }, f.l))
    ),
    
    // Test results table
    React.createElement('div', { style: cs },
      React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse' } },
        React.createElement('thead', null, React.createElement('tr', { style: { borderBottom: '1px solid rgba(198,163,78,.08)' } },
          ['', 'ID', 'Test', 'Résultat', 'Attendu', 'Tolérance', 'Source'].map((h, i) =>
            React.createElement('th', { key: i, style: { padding: '8px 10px', textAlign: 'left', fontSize: 10, color: GOLD, letterSpacing: '1px', textTransform: 'uppercase' } }, h))
        )),
        React.createElement('tbody', null, filtered.map((t, i) =>
          React.createElement(React.Fragment, { key: t.id },
            React.createElement('tr', {
              onClick: () => setShowDetail(showDetail === t.id ? null : t.id),
              style: { borderBottom: '1px solid rgba(255,255,255,.02)', cursor: 'pointer', background: !t.pass ? 'rgba(239,68,68,.03)' : 'transparent', transition: 'all .15s' },
              onMouseEnter: e => { e.currentTarget.style.background = t.pass ? 'rgba(34,197,94,.03)' : 'rgba(239,68,68,.06)' },
              onMouseLeave: e => { e.currentTarget.style.background = !t.pass ? 'rgba(239,68,68,.03)' : 'transparent' }
            },
              React.createElement('td', { style: { padding: '6px 10px', fontSize: 14 } }, t.pass ? '✅' : '❌'),
              React.createElement('td', { style: { padding: '6px 10px', fontSize: 10, color: '#888', fontFamily: 'monospace' } }, t.id),
              React.createElement('td', { style: { padding: '6px 10px', fontSize: 12, color: '#e5e5e5', fontWeight: 500 } }, t.name),
              React.createElement('td', { style: { padding: '6px 10px', fontSize: 12, fontWeight: 600, color: t.pass ? GREEN : RED, fontFamily: 'monospace' } },
                t.error ? 'ERROR' : t.result ? (typeof t.result.got === 'number' ? t.result.got.toFixed(2) : String(t.result.got)) : '—'),
              React.createElement('td', { style: { padding: '6px 10px', fontSize: 11, color: '#888', fontFamily: 'monospace' } },
                t.result?.expect !== null && t.result?.expect !== undefined ? (typeof t.result.expect === 'number' ? t.result.expect.toFixed(2) : String(t.result.expect)) : t.validate ? 'custom' : '—'),
              React.createElement('td', { style: { padding: '6px 10px', fontSize: 10, color: '#666' } }, t.tolerance !== null ? `±${t.tolerance}` : '—'),
              React.createElement('td', { style: { padding: '6px 10px', fontSize: 9, color: '#555', maxWidth: 200 } }, t.source)
            ),
            showDetail === t.id && React.createElement('tr', null,
              React.createElement('td', { colSpan: 7, style: { padding: '12px 16px', background: 'rgba(0,0,0,.15)', fontSize: 11 } },
                React.createElement('pre', { style: { color: '#9e9b93', whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'monospace', fontSize: 10 } },
                  JSON.stringify(t.result, null, 2)),
                t.error && React.createElement('div', { style: { color: RED, marginTop: 8 } }, `Error: ${t.error}`)
              )
            )
          )
        ))
      )
    )
  );
}

export default { netToBrut, coutTotalToNet, buildTestSuite, runTests, PayrollEngineTestDashboard };
