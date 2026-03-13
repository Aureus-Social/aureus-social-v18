'use client';
import { useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { RMMMG, TX_ONSS_E, TX_ONSS_W } from '@/app/lib/helpers';

const GOLD = '#c6a34e';
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
    { id: 'vérif_bce', text: 'Vérifier numéro BCE actif (CBE)', ref: 'Art. 2 Loi 16/01/2003', lien: 'kbopublic.economie.fgov.be', prio: 'high' },
    { id: 'onss_actif', text: 'Matricule ONSS employeur actif', ref: 'Art. 4 Loi 27/06/1969', lien: 'onss.be', prio: 'high' },
    { id: 'règlement_travail', text: 'Règlement de travail déposé au SPF ETCS', ref: 'Loi 08/04/1965', lien: 'emploi.belgique.be', prio: 'high' },
    { id: 'accident_assurance', text: 'Assurance accidents de travail souscrite', ref: 'Loi 10/04/1971', lien: 'fsma.be', prio: 'high' },
    { id: 'registre_personnel', text: 'Registre du personnel tenu à jour', ref: 'AR 08/08/1980', lien: 'emploi.belgique.be', prio: 'medium' },
    { id: 'cp_identifiee', text: 'Commission paritaire identifiée', ref: 'Loi 05/12/1968', lien: 'cnt-nar.be', prio: 'medium' },
    { id: 'medecine_travail', text: 'Affiliation au service de santé au travail (SEPP/SIDPPT)', ref: 'Loi 04/08/1996 BIEN-ÊTRE', lien: 'emploi.belgique.be', prio: 'high' },
    { id: 'activa_verifie', text: 'Vérifier éligibilité primes emploi (Activa, 1er employé, Impulsion)', ref: 'AR 03/05/1999', lien: 'actiris.brussels', prio: 'medium' },
  ],
  2: [
    { id: 'contrat_ecrit', text: 'Contrat écrit signé avant l\'entrée en service', ref: 'Loi 03/07/1978 art.3', lien: 'emploi.belgique.be', prio: 'high' },
    { id: 'contrat_type', text: 'Choisir type de contrat : CDI / CDD / Étudiant / Intérimaire', ref: 'Loi 03/07/1978', lien: null, prio: 'high' },
    { id: 'clause_essai', text: 'Période d\'essai éventuelle mentionnée (max 6 mois)', ref: 'Loi 26/12/2013 art.67', lien: null, prio: 'medium' },
    { id: 'clause_non_conc', text: 'Clause de non-concurrence si applicable', ref: 'Loi 03/07/1978 art.65', lien: null, prio: 'low' },
    { id: 'horaire_mentionne', text: 'Régime et horaire de travail mentionnés', ref: 'Art.10 Loi 1978', lien: null, prio: 'high' },
    { id: 'salaire_minimum', text: 'Salaire ≥ RMMMG (' + RMMMG.toLocaleString('fr-BE') + ' EUR/mois)', ref: 'CCT 43/2022', lien: 'cnt-nar.be', prio: 'high' },
    { id: 'langue_contrat', text: 'Contrat en langue de la région (NL/FR/DE)', ref: 'Décret sur l\'emploi des langues', lien: null, prio: 'medium' },
    { id: 'benefices_cctext', text: 'Mentionner CCT sectorielle et avantages applicables', ref: 'CCT sectorielle CP', lien: 'cnt-nar.be', prio: 'medium' },
  ],
  3: [
    { id: 'dimona_avant', text: 'Dimona IN soumise AVANT le 1er jour de travail', ref: 'Loi 27/06/1969 art.35bis', lien: 'socialsecurity.be', prio: 'high', urgent: true },
    { id: 'niss_verifie', text: 'NISS travailleur vérifié (mod97)', ref: 'NISS = Numéro de registre national', lien: 'ibz.be', prio: 'high' },
    { id: 'dimona_confirmation', text: 'Conserver la confirmation ONSS (référence Dimona)', ref: 'Conservation 5 ans', lien: null, prio: 'medium' },
    { id: 'student_600h', text: 'Si étudiant : vérifier quota 600h/an (Student@Work)', ref: 'Loi 03/07/1978 art.17bis', lien: 'studentatwork.be', prio: 'medium' },
  ],
  4: [
    { id: 'copie_id', text: 'Copie carte d\'identité / permis de séjour', ref: 'RGPD + droit du travail', lien: null, prio: 'high' },
    { id: 'fiche_fiscale', text: 'Fiche fiscale signée (choix tarif PP personnalisé)', ref: 'CIR art.57/66', lien: 'finances.belgium.be', prio: 'high' },
    { id: 'niss_doc', text: 'Document NISS ou attestation registre national', ref: 'Loi 08/08/1983', lien: null, prio: 'high' },
    { id: 'rib_iban', text: 'Coordonnées bancaires (IBAN) pour virement salaire', ref: 'CCT 43 — virement obligatoire', lien: null, prio: 'high' },
    { id: 'visite_medicale', text: 'Visite médicale préembauche si poste à risque', ref: 'AR 28/05/2003 BIEN-ÊTRE', lien: null, prio: 'medium' },
    { id: 'formations_secu', text: 'Formations sécurité obligatoires selon poste', ref: 'Loi BIEN-ÊTRE 04/08/1996', lien: null, prio: 'medium' },
    { id: 'règlement_remis', text: 'Règlement de travail remis au travailleur', ref: 'Art.12 Loi 08/04/1965', lien: null, prio: 'high' },
    { id: 'rgpd_info', text: 'Information RGPD remise (traitement données personnelles)', ref: 'RGPD Art.13', lien: null, prio: 'medium' },
  ],
  5: [
    { id: 'calcul_brut', text: 'Calcul du salaire brut selon CP et contrat', ref: 'Barèmes CP + RMMMG', lien: null, prio: 'high' },
    { id: 'onss_retenue', text: 'Retenue ONSS travailleur (' + (TX_ONSS_W * 100).toFixed(2) + \'%)', ref: 'Loi 27/06/1969', lien: null, prio: 'high' },
    { id: 'pp_calcule', text: 'Précompte professionnel calculé et retenu', ref: 'CIR art.86 + barèmes PP', lien: null, prio: 'high' },
    { id: 'net_virement', text: 'Virement salaire net avant fin du mois', ref: 'CCT 43 — délai paiement', lien: null, prio: 'high', urgent: true },
    { id: 'fiche_paie_remise', text: 'Fiche de paie remise au travailleur (papier ou électronique)', ref: 'AR 09/11/2011', lien: null, prio: 'high' },
    { id: 'bonus_emploi', text: 'Appliquer bonus emploi si applicable (bas salaires)', ref: 'AR 01/09/2004', lien: null, prio: 'medium' },
    { id: 'cheques_repas', text: 'Chèques-repas émis si prévu au contrat', ref: 'AR 12/10/2010', lien: null, prio: 'medium' },
  ],
  6: [
    { id: 'pp274', text: 'Déclaration PP 274 au SPF Finances (avant le 5 du mois)', ref: 'CIR art.88', lien: 'finances.belgium.be', prio: 'high', urgent: true },
    { id: 'dmfa_trim', text: 'DmfA trimestrielle ONSS (fin de trimestre)', ref: 'Loi 27/06/1969 art.22', lien: 'socialsecurity.be', prio: 'high', urgent: true },
    { id: 'onss_paiement', text: 'Paiement cotisations ONSS employeur (' + (TX_ONSS_E * 100).toFixed(2) + \'%)', ref: 'Loi 27/06/1969', lien: null, prio: 'high' },
    { id: 'fiche_281', text: 'Fiche fiscale 281.10 en janvier (via Belcotax)', ref: 'CIR art.57', lien: 'belcotax-on-web.be', prio: 'high' },
    { id: 'bilan_social', text: 'Bilan social BNB si 50+ travailleurs', ref: 'AR 04/08/1996', lien: 'bnb.be', prio: 'medium' },
    { id: 'activa_demande', text: 'Demander l\'allocation Activa si éligible (Actiris)', ref: 'AR 03/05/1999', lien: 'actiris.brussels', prio: 'medium' },
  ],
  7: [
    { id: 'periode_essai_eval', text: 'Évaluation en cours de période d\'essai', ref: 'Bonne pratique RH', lien: null, prio: 'medium' },
    { id: 'reg_personnel_update', text: 'Registre du personnel mis à jour', ref: 'AR 08/08/1980', lien: null, prio: 'high' },
    { id: 'registre_dimona', text: 'Historique Dimona conservé', ref: 'Conservation 5 ans', lien: null, prio: 'medium' },
    { id: 'formations_suivies', text: 'Formations légales suivies et documentées (min 5j/an)', ref: 'Loi Peeters 05/03/2017', lien: null, prio: 'medium' },
    { id: 'fin_cdd_dimona', text: 'Si CDD : Dimona OUT à la fin du contrat', ref: 'Loi 27/06/1969', lien: 'socialsecurity.be', prio: 'high' },
    { id: 'monbee_deadline', text: 'MonBEE : dépôt dossier prime avant délai', ref: 'MonBEE deadline 01/06/2026', lien: 'monbee.brussels', prio: 'high', urgent: true },
  ],
};

export default function EmbaucheAZ({ s, d }) {
  const [activeStep, setActiveStep] = useState(1);
  const [checked, setChecked] = useState({});
  const [expanded, setExpanded] = useState({});

  const emps = s?.emps || [];
  const co = s?.co || {};

  const items = CHECKLIST[activeStep] || [];
  const total = items.length;
  const done = items.filter(i => checked[i.id]).length;
  const pct = total ? Math.round(done / total * 100) : 0;

  const globalTotal = Object.values(CHECKLIST).flat().length;
  const globalDone = Object.values(CHECKLIST).flat().filter(i => checked[i.id]).length;
  const globalPct = Math.round(globalDone / globalTotal * 100);

  const toggle = (id) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const prio_color = { high: '#ef4444', medium: '#fb923c', low: '#22c55e' };
  const prio_label = { high: 'Obligatoire', medium: 'Important', low: 'Recommandé' };

  return (
    <div style={{ fontFamily: 'inherit', color: '#e8e6e0' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: GOLD }}>📋 Embauche A→Z</h2>
        <p style={{ margin: '4px 0 16px', color: '#9e9b93', fontSize: 13 }}>Checklist complète des obligations légales belges — {globalDone}/{globalTotal} étapes complétées</p>
        {/* Barre progression globale */}
        <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 8, overflow: 'hidden', height: 8, marginBottom: 8 }}>
          <div style={{ width: `${globalPct}%`, height: '100%', background: globalPct === 100 ? '#22c55e' : GOLD, transition: 'width .3s' }} />
        </div>
        <div style={{ fontSize: 11, color: '#9e9b93' }}>{globalPct}% complété — {globalTotal - globalDone} action(s) restante(s)</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
        {/* Sidebar étapes */}
        <div>
          {STEPS.map(step => {
            const stepItems = CHECKLIST[step.id] || [];
            const stepDone = stepItems.filter(i => checked[i.id]).length;
            const stepPct = stepItems.length ? Math.round(stepDone / stepItems.length * 100) : 0;
            const isActive = activeStep === step.id;
            return (
              <div key={step.id} onClick={() => setActiveStep(step.id)}
                style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 6, cursor: 'pointer',
                  background: isActive ? 'rgba(198,163,78,.12)' : 'rgba(255,255,255,.02)',
                  border: `1px solid ${isActive ? GOLD + '40' : 'rgba(255,255,255,.04)'}`,
                  transition: 'all .15s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

        {/* Contenu étape active */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, color: GOLD }}>{STEPS.find(s => s.id === activeStep)?.label}</h3>
            <span style={{ fontSize: 12, color: pct === 100 ? '#22c55e' : '#9e9b93' }}>{done}/{total} — {pct}%</span>
          </div>

          {items.map(item => {
            const isDone = !!checked[item.id];
            const isExp = !!expanded[item.id];
            return (
              <div key={item.id} style={{
                marginBottom: 8, borderRadius: 10, border: `1px solid ${isDone ? 'rgba(34,197,94,.2)' : 'rgba(255,255,255,.06)'}`,
                background: isDone ? 'rgba(34,197,94,.04)' : 'rgba(255,255,255,.02)',
                transition: 'all .2s', overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer' }}
                  onClick={() => toggle(item.id)}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6, border: `2px solid ${isDone ? '#22c55e' : 'rgba(255,255,255,.2)'}`,
                    background: isDone ? '#22c55e' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all .2s'
                  }}>
                    {isDone && <span style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: isDone ? 400 : 600, color: isDone ? '#5e5c56' : '#e8e6e0',
                      textDecoration: isDone ? 'line-through' : 'none' }}>
                      {item.urgent && <span style={{ color: '#ef4444', marginRight: 6 }}>⚡</span>}
                      {item.text}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 8,
                      background: prio_color[item.prio] + '18', color: prio_color[item.prio] }}>
                      {prio_label[item.prio]}
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
                      <span style={{ color: '#c6a34e', fontWeight: 600 }}>Base légale :</span> {item.ref}
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

          {/* Boutons navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
            <button onClick={() => setActiveStep(s => Math.max(1, s - 1))}
              disabled={activeStep === 1}
              style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(198,163,78,.3)',
                background: 'transparent', color: activeStep === 1 ? '#5e5c56' : GOLD,
                cursor: activeStep === 1 ? 'not-allowed' : 'pointer', fontSize: 13 }}>
              ← Étape précédente
            </button>
            {activeStep < STEPS.length && (
              <button onClick={() => setActiveStep(s => Math.min(STEPS.length, s + 1))}
                style={{ padding: '10px 20px', borderRadius: 8, border: 'none',
                  background: 'rgba(198,163,78,.15)', color: GOLD,
                  cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                Étape suivante →
              </button>
            )}
            {activeStep === STEPS.length && (
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
