'use client';
import { useState } from 'react';
import { supabase } from '@/app/lib/supabase';

const GOLD = '#c6a34e';
const RMMMG = 2070.48;
const TX_ONSS_W = 0.1307;
const TX_ONSS_E = 0.2507;

const STEPS = [
  { id: 1, label: '✅ Avant l\'embauche', icon: '📋' },
  { id: 2, label: '📝 Contrat de travail', icon: '📝' },
  { id: 3, label: '🔐 Dimona IN', icon: '🔐' },
  { id: 4, label: '📑 Documents obligatoires', icon: '📑' },
  { id: 5, label: '💰 Première paie', icon: '💰' },
  { id: 6, label: '🏛 Déclarations ONSS', icon: '🏛' },
  { id: 7, label: '✔ Suivi post-embauche', icon: '✔' },
];

const CHECKLIST = {
  1: [
    { id: 'verif_bce', text: 'Vérifier numéro BCE actif (CBE)', ref: 'Art. 2 Loi 16/01/2003', lien: 'kbopublic.economie.fgov.be', prio: 'high' },
    { id: 'onss_actif', text: 'Matricule ONSS employeur actif', ref: 'Art. 4 Loi 27/06/1969', lien: 'onss.be', prio: 'high' },
    { id: 'reglement_travail', text: 'Règlement de travail déposé au SPF ETCS', ref: 'Loi 08/04/1965', lien: 'emploi.belgique.be', prio: 'high' },
    { id: 'accident_assurance', text: 'Assurance accidents de travail souscrite', ref: 'Loi 10/04/1971', lien: 'fsma.be', prio: 'high' },
    { id: 'registre_personnel', text: 'Registre du personnel tenu à jour', ref: 'AR 08/08/1980', prio: 'medium' },
    { id: 'cp_identifiee', text: 'Commission paritaire identifiée', ref: 'Loi 05/12/1968', lien: 'cnt-nar.be', prio: 'medium' },
    { id: 'medecine_travail', text: 'Affiliation au service de santé au travail (SEPP/SIDPDT)', ref: 'Loi BIEN-ÊTRE 04/08/1996', prio: 'high' },
    { id: 'activa_verifie', text: 'Vérifier éligibilité primes emploi (Activa, 1er employé)', ref: 'AR 03/05/1999', lien: 'actiris.brussels', prio: 'medium' },
  ],
  2: [
    { id: 'contrat_ecrit', text: 'Contrat écrit signé avant l\'entrée en service', ref: 'Loi 03/07/1978 art.3', prio: 'high' },
    { id: 'contrat_type', text: 'Choisir type de contrat : CDI / CDD / Étudiant / Intérimaire', ref: 'Loi 03/07/1978', prio: 'high' },
    { id: 'clause_essai', text: 'Période d\'essai éventuelle mentionnée (max 6 mois)', ref: 'Loi 26/12/2013 art.67', prio: 'medium' },
    { id: 'salaire_minimum', text: 'Salaire ≥ RMMMG (2.070,48 EUR/mois)', ref: 'CCT 43/2022', prio: 'high' },
    { id: 'horaire_mentionne', text: 'Régime et horaire de travail mentionnés', ref: 'Art.10 Loi 1978', prio: 'high' },
    { id: 'langue_contrat', text: 'Contrat en langue de la région (NL/FR/DE)', ref: 'Décret emploi des langues', prio: 'medium' },
    { id: 'benefices_cct', text: 'CCT sectorielle et avantages mentionnés', ref: 'CCT sectorielle CP', lien: 'cnt-nar.be', prio: 'medium' },
    { id: 'clause_non_conc', text: 'Clause de non-concurrence si applicable', ref: 'Loi 03/07/1978 art.65', prio: 'low' },
  ],
  3: [
    { id: 'dimona_avant', text: 'Dimona IN soumise AVANT le 1er jour de travail', ref: 'Loi 27/06/1969 art.35bis', lien: 'socialsecurity.be', prio: 'high', urgent: true },
    { id: 'niss_verifie', text: 'NISS travailleur vérifié (mod97)', ref: 'NISS = Numéro de registre national', lien: 'ibz.be', prio: 'high' },
    { id: 'dimona_confirmation', text: 'Conserver la confirmation ONSS (référence Dimona)', ref: 'Conservation 5 ans', prio: 'medium' },
    { id: 'student_600h', text: 'Si étudiant : vérifier quota 600h/an (Student@Work)', ref: 'Loi 03/07/1978 art.17bis', lien: 'studentatwork.be', prio: 'medium' },
  ],
  4: [
    { id: 'copie_id', text: 'Copie carte d\'identité / permis de séjour', ref: 'RGPD + droit du travail', prio: 'high' },
    { id: 'fiche_fiscale', text: 'Fiche fiscale signée (choix tarif PP personnalisé)', ref: 'CIR art.57/66', lien: 'finances.belgium.be', prio: 'high' },
    { id: 'niss_doc', text: 'Document NISS ou attestation registre national', ref: 'Loi 08/08/1983', prio: 'high' },
    { id: 'rib_iban', text: 'Coordonnées bancaires (IBAN) pour virement salaire', ref: 'CCT 43 — virement obligatoire', prio: 'high' },
    { id: 'visite_medicale', text: 'Visite médicale préembauche si poste à risque', ref: 'AR 28/05/2003 BIEN-ÊTRE', prio: 'medium' },
    { id: 'reglement_remis', text: 'Règlement de travail remis au travailleur', ref: 'Art.12 Loi 08/04/1965', prio: 'high' },
    { id: 'rgpd_info', text: 'Information RGPD remise (traitement données personnelles)', ref: 'RGPD Art.13', prio: 'medium' },
  ],
  5: [
    { id: 'calcul_brut', text: 'Calcul du salaire brut selon CP et contrat', ref: 'Barèmes CP + RMMMG', prio: 'high' },
    { id: 'onss_retenue', text: 'Retenue ONSS travailleur (13,07%)', ref: 'Loi 27/06/1969', prio: 'high' },
    { id: 'pp_calcule', text: 'Précompte professionnel calculé et retenu', ref: 'CIR art.86 + barèmes PP', prio: 'high' },
    { id: 'net_virement', text: 'Virement salaire net avant fin du mois', ref: 'CCT 43 — délai paiement', prio: 'high', urgent: true },
    { id: 'fiche_paie_remise', text: 'Fiche de paie remise au travailleur', ref: 'AR 09/11/2011', prio: 'high' },
    { id: 'bonus_emploi', text: 'Appliquer bonus emploi si applicable (bas salaires)', ref: 'AR 01/09/2004', prio: 'medium' },
    { id: 'cheques_repas', text: 'Chèques-repas émis si prévu au contrat', ref: 'AR 12/10/2010', prio: 'medium' },
  ],
  6: [
    { id: 'pp274', text: 'Déclaration PP 274 au SPF Finances (avant le 5 du mois)', ref: 'CIR art.88', lien: 'finances.belgium.be', prio: 'high', urgent: true },
    { id: 'dmfa_trim', text: 'DmfA trimestrielle ONSS (fin de trimestre)', ref: 'Loi 27/06/1969 art.22', lien: 'socialsecurity.be', prio: 'high', urgent: true },
    { id: 'onss_paiement', text: 'Paiement cotisations ONSS employeur (25,07%)', ref: 'Loi 27/06/1969', prio: 'high' },
    { id: 'fiche_281', text: 'Fiche fiscale 281.10 en janvier (via Belcotax)', ref: 'CIR art.57', lien: 'belcotax-on-web.be', prio: 'high' },
    { id: 'activa_demande', text: 'Demander l\'allocation Activa si éligible (Actiris)', ref: 'AR 03/05/1999', lien: 'actiris.brussels', prio: 'medium' },
    { id: 'bilan_social', text: 'Bilan social BNB si 50+ travailleurs', ref: 'AR 04/08/1996', lien: 'bnb.be', prio: 'medium' },
  ],
  7: [
    { id: 'periode_essai_eval', text: 'Évaluation en cours de période d\'essai', ref: 'Bonne pratique RH', prio: 'medium' },
    { id: 'reg_personnel_update', text: 'Registre du personnel mis à jour', ref: 'AR 08/08/1980', prio: 'high' },
    { id: 'formations_suivies', text: 'Formations légales suivies (min 5j/an)', ref: 'Loi Peeters 05/03/2017', prio: 'medium' },
    { id: 'fin_cdd_dimona', text: 'Si CDD : Dimona OUT à la fin du contrat', ref: 'Loi 27/06/1969', lien: 'socialsecurity.be', prio: 'high' },
    { id: 'monbee_deadline', text: 'MonBEE : dépôt dossier prime avant délai (01/06/2026)', ref: 'MonBEE Brussels', lien: 'monbee.brussels', prio: 'high', urgent: true },
    { id: 'registre_dimona', text: 'Historique Dimona conservé (5 ans)', ref: 'Conservation légale', prio: 'medium' },
  ],
};

export default function EmbaucheAZ({ s, d }) {
  const [activeStep, setActiveStep] = useState(1);
  const [checked, setChecked] = useState({});
  const [expanded, setExpanded] = useState({});

  const items = CHECKLIST[activeStep] || [];
  const total = items.length;
  const done = items.filter(i => checked[i.id]).length;
  const pct = total ? Math.round(done / total * 100) : 0;

  const globalTotal = Object.values(CHECKLIST).flat().length;
  const globalDone = Object.values(CHECKLIST).flat().filter(i => checked[i.id]).length;
  const globalPct = Math.round(globalDone / globalTotal * 100);

  const toggle = (id) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const prioColor = { high: '#ef4444', medium: '#fb923c', low: '#22c55e' };
  const prioLabel = { high: 'Obligatoire', medium: 'Important', low: 'Recommandé' };

  return (
    <div style={{ fontFamily: 'inherit', color: '#e8e6e0' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: GOLD }}>📋 Embauche A→Z</h2>
        <p style={{ margin: '4px 0 12px', color: '#9e9b93', fontSize: 13 }}>
          Checklist complète des obligations légales belges — {globalDone}/{globalTotal} étapes
        </p>
        <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 8, height: 8, marginBottom: 4 }}>
          <div style={{ width: `${globalPct}%`, height: '100%', background: globalPct === 100 ? '#22c55e' : GOLD, borderRadius: 8, transition: 'width .3s' }} />
        </div>
        <div style={{ fontSize: 11, color: '#9e9b93' }}>{globalPct}% complété — {globalTotal - globalDone} action(s) restante(s)</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
        {/* Sidebar */}
        <div>
          {STEPS.map(step => {
            const stepItems = CHECKLIST[step.id] || [];
            const stepDone = stepItems.filter(i => checked[i.id]).length;
            const stepPct = stepItems.length ? Math.round(stepDone / stepItems.length * 100) : 0;
            const isActive = activeStep === step.id;
            return (
              <div key={step.id} onClick={() => setActiveStep(step.id)} style={{
                padding: '10px 14px', borderRadius: 10, marginBottom: 6, cursor: 'pointer',
                background: isActive ? 'rgba(198,163,78,.12)' : 'rgba(255,255,255,.02)',
                border: `1px solid ${isActive ? GOLD + '40' : 'rgba(255,255,255,.04)'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 400, color: isActive ? GOLD : '#e8e6e0' }}>{step.label}</span>
                  <span style={{ fontSize: 11, color: stepPct === 100 ? '#22c55e' : '#9e9b93' }}>{stepDone}/{stepItems.length}</span>
                </div>
                <div style={{ marginTop: 4, height: 3, background: 'rgba(255,255,255,.06)', borderRadius: 3 }}>
                  <div style={{ width: `${stepPct}%`, height: '100%', background: stepPct === 100 ? '#22c55e' : GOLD, borderRadius: 3, transition: 'width .3s' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Contenu */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, color: GOLD }}>{STEPS.find(s2 => s2.id === activeStep)?.label}</h3>
            <span style={{ fontSize: 12, color: pct === 100 ? '#22c55e' : '#9e9b93' }}>{done}/{total} — {pct}%</span>
          </div>

          {items.map(item => {
            const isDone = !!checked[item.id];
            const isExp = !!expanded[item.id];
            return (
              <div key={item.id} style={{
                marginBottom: 8, borderRadius: 10, overflow: 'hidden',
                border: `1px solid ${isDone ? 'rgba(34,197,94,.2)' : 'rgba(255,255,255,.06)'}`,
                background: isDone ? 'rgba(34,197,94,.04)' : 'rgba(255,255,255,.02)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer' }}
                  onClick={() => toggle(item.id)}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    border: `2px solid ${isDone ? '#22c55e' : 'rgba(255,255,255,.2)'}`,
                    background: isDone ? '#22c55e' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isDone && <span style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: isDone ? 400 : 600,
                      color: isDone ? '#5e5c56' : '#e8e6e0', textDecoration: isDone ? 'line-through' : 'none' }}>
                      {item.urgent && <span style={{ color: '#ef4444', marginRight: 6 }}>⚡</span>}
                      {item.text}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 8,
                      background: prioColor[item.prio] + '18', color: prioColor[item.prio] }}>
                      {prioLabel[item.prio]}
                    </span>
                    <span onClick={e => { e.stopPropagation(); toggleExpand(item.id); }}
                      style={{ fontSize: 11, color: '#5e5c56', cursor: 'pointer', padding: '2px 6px' }}>
                      {isExp ? '▲' : '▼'}
                    </span>
                  </div>
                </div>
                {isExp && (
                  <div style={{ padding: '0 14px 12px 48px', borderTop: '1px solid rgba(255,255,255,.04)' }}>
                    <div style={{ fontSize: 11, color: '#9e9b93', marginTop: 8 }}>
                      <span style={{ color: GOLD, fontWeight: 600 }}>Base légale :</span> {item.ref}
                    </div>
                    {item.lien && (
                      <div style={{ fontSize: 11, marginTop: 4 }}>
                        <span style={{ color: '#5e5c56' }}>Lien : </span>
                        <span style={{ color: '#60a5fa' }}>🔗 {item.lien}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
            <button onClick={() => setActiveStep(s2 => Math.max(1, s2 - 1))}
              disabled={activeStep === 1}
              style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${GOLD}50`,
                background: 'transparent', color: activeStep === 1 ? '#5e5c56' : GOLD,
                cursor: activeStep === 1 ? 'not-allowed' : 'pointer', fontSize: 13 }}>
              ← Étape précédente
            </button>
            {activeStep < STEPS.length && (
              <button onClick={() => setActiveStep(s2 => Math.min(STEPS.length, s2 + 1))}
                style={{ padding: '10px 20px', borderRadius: 8, border: 'none',
                  background: 'rgba(198,163,78,.15)', color: GOLD,
                  cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                Étape suivante →
              </button>
            )}
            {activeStep === STEPS.length && globalPct === 100 && (
              <div style={{ padding: '10px 20px', borderRadius: 8,
                background: 'rgba(34,197,94,.1)', color: '#22c55e', fontSize: 13, fontWeight: 700 }}>
                ✅ Processus d\'embauche complété !
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
