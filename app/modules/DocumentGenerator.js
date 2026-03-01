'use client'

// ═══════════════════════════════════════════════════════
//  AUREUS SOCIAL PRO — Module: Générateur de Documents
//  Génération de contrats, attestations, C4, certificats
//  Templates conformes au droit du travail belge
// ═══════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from 'react'

const GOLD = '#c6a34e'
const DARK = '#0d1117'
const BORDER = '#1e2633'
const TEXT = '#e0e0e0'
const MUTED = '#8b95a5'

// ── Types de documents ──
const DOC_TYPES = {
  CONTRAT_CDI: {
    label: 'Contrat CDI',
    category: 'contrat',
    icon: '📄',
    description: 'Contrat à durée indéterminée — employé ou ouvrier',
    required: ['name', 'startDate', 'salary', 'function', 'cp'],
  },
  CONTRAT_CDD: {
    label: 'Contrat CDD',
    category: 'contrat',
    icon: '📄',
    description: 'Contrat à durée déterminée',
    required: ['name', 'startDate', 'endDate', 'salary', 'function', 'cp'],
  },
  CONTRAT_STUDENT: {
    label: 'Convention étudiant',
    category: 'contrat',
    icon: '🎓',
    description: 'Convention d\'occupation étudiant (max 650h/an)',
    required: ['name', 'startDate', 'endDate', 'salary'],
  },
  AVENANT: {
    label: 'Avenant au contrat',
    category: 'contrat',
    icon: '📝',
    description: 'Modification du contrat de travail existant',
    required: ['name', 'modification'],
  },
  ATTESTATION_EMPLOI: {
    label: 'Attestation d\'emploi',
    category: 'attestation',
    icon: '✅',
    description: 'Certificat confirmant l\'emploi actuel du travailleur',
    required: ['name', 'startDate', 'function'],
  },
  ATTESTATION_SALAIRE: {
    label: 'Attestation de salaire',
    category: 'attestation',
    icon: '💰',
    description: 'Attestation du montant du salaire (pour banque, propriétaire, etc.)',
    required: ['name', 'salary'],
  },
  C4: {
    label: 'Formulaire C4',
    category: 'sortie',
    icon: '🔴',
    description: 'Certificat de chômage — fin de contrat',
    required: ['name', 'startDate', 'endDate', 'motif'],
  },
  PREAVIS: {
    label: 'Lettre de préavis',
    category: 'sortie',
    icon: '⏳',
    description: 'Notification de préavis selon la loi belge',
    required: ['name', 'startDate', 'noticeWeeks'],
  },
  REGLEMENT_TRAVAIL: {
    label: 'Règlement de travail',
    category: 'reglementaire',
    icon: '📋',
    description: 'Règlement de travail conforme à la loi du 8 avril 1965',
    required: ['companyName'],
  },
  ATTESTATION_VACANCES: {
    label: 'Attestation de vacances',
    category: 'attestation',
    icon: '🏖',
    description: 'Attestation de vacances annuelles (pécule)',
    required: ['name', 'year'],
  },
}

const CATEGORIES = {
  contrat: { label: 'Contrats', icon: '📄', color: '#3b82f6' },
  attestation: { label: 'Attestations', icon: '✅', color: '#22c55e' },
  sortie: { label: 'Sortie / Fin contrat', icon: '🔴', color: '#ef4444' },
  reglementaire: { label: 'Réglementaire', icon: '📋', color: '#f59e0b' },
}

// ── Calcul préavis belge (loi du 26 décembre 2013) ──
function calculateNotice(startDate, isEmployer, statut) {
  if (!startDate) return 0
  const start = new Date(startDate)
  const now = new Date()
  const ancMonths = Math.floor((now - start) / (1000 * 60 * 60 * 24 * 30.44))
  const ancYears = ancMonths / 12

  // Barème employeur (en semaines)
  if (isEmployer) {
    if (ancMonths < 3) return 1
    if (ancMonths < 6) return 3
    if (ancMonths < 9) return 4
    if (ancMonths < 12) return 5
    if (ancMonths < 15) return 6
    if (ancMonths < 18) return 7
    if (ancMonths < 21) return 8
    if (ancMonths < 24) return 9
    if (ancYears < 3) return 12
    if (ancYears < 4) return 13
    if (ancYears < 5) return 15
    // +3 semaines par année commencée au-delà de 5 ans
    return 15 + Math.ceil(ancYears - 5) * 3
  }

  // Barème travailleur (en semaines)
  if (ancMonths < 3) return 1
  if (ancMonths < 6) return 2
  if (ancMonths < 12) return 3
  if (ancYears < 2) return 4
  if (ancYears < 4) return 5
  if (ancYears < 5) return 6
  if (ancYears < 8) return 9
  return 13 // max 13 semaines
}

// ── Générateur de contenu document ──
function generateDocument(type, data) {
  const company = data.company || {}
  const now = new Date()
  const dateStr = now.toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })

  const header = `
${company.name || 'ENTREPRISE'}
${company.address || ''}
BCE : ${company.bce || 'N/A'} — ONSS : ${company.onss || 'N/A'}
CP : ${data.cp || company.cp || '200'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`

  switch (type) {
    case 'CONTRAT_CDI':
      return `${header}
CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE
(Article 7 de la loi du 3 juillet 1978)

Entre :
  L'employeur : ${company.name || '___'}, dont le siège social est situé
  ${company.address || '___'}, inscrit à la BCE sous le n° ${company.bce || '___'}

Et :
  Le travailleur : ${data.name || '___'}
  Domicilié(e) à : ${data.address || '___'}
  NISS : ${data.niss || '___'}
  Né(e) le : ${data.birthDate || '___'}

Il est convenu ce qui suit :

Article 1 — Objet
Le travailleur est engagé en qualité de ${data.function || '___'} dans le cadre d'un contrat
de travail à durée indéterminée, à temps ${data.regime || 'plein'}.

Article 2 — Date d'entrée en service
Le présent contrat prend effet le ${data.startDate || '___'}.

Article 3 — Fonction et lieu de travail
Le travailleur exercera la fonction de ${data.function || '___'}.
Le lieu de travail principal est : ${data.workplace || company.address || '___'}.

Article 4 — Rémunération
Le salaire mensuel brut est fixé à ${data.salary || '___'} EUR pour un régime de travail
de ${data.hoursPerWeek || '38'} heures par semaine.
${data.mealVouchers ? `Le travailleur bénéficie de chèques-repas d'une valeur de ${data.mealVouchers} EUR/jour.` : ''}

Article 5 — Horaire de travail
L'horaire de travail est conforme au règlement de travail.
Régime : ${data.hoursPerWeek || '38'} heures/semaine.

Article 6 — Commission paritaire
Le présent contrat est régi par la commission paritaire n° ${data.cp || '200'}.

Article 7 — Période d'essai
Conformément à la loi du 26 décembre 2013, il n'y a plus de clause d'essai
pour les contrats conclus après le 1er janvier 2014.

Article 8 — Préavis
Les délais de préavis sont ceux prévus par la loi du 26 décembre 2013
relative à l'introduction d'un statut unique.

Article 9 — Clauses diverses
- Le travailleur s'engage à respecter le règlement de travail.
- Le travailleur est tenu au secret professionnel.
${data.nonCompete ? '- Une clause de non-concurrence est applicable (voir annexe).' : ''}
${data.carPolicy ? '- Le travailleur bénéficie d\'un véhicule de société (voir car policy).' : ''}

Fait en double exemplaire à ${company.city || '___'}, le ${dateStr}.

L'employeur                          Le travailleur
${company.name || '___'}             ${data.name || '___'}
(signature)                          (signature)
Chaque partie reconnaît avoir reçu un exemplaire du présent contrat.
`

    case 'CONTRAT_CDD':
      return `${header}
CONTRAT DE TRAVAIL À DURÉE DÉTERMINÉE
(Article 7 de la loi du 3 juillet 1978)

Entre :
  L'employeur : ${company.name || '___'}
  ${company.address || '___'} — BCE : ${company.bce || '___'}

Et :
  Le travailleur : ${data.name || '___'}
  NISS : ${data.niss || '___'}

Il est convenu ce qui suit :

Article 1 — Le travailleur est engagé en qualité de ${data.function || '___'}
dans le cadre d'un CDD du ${data.startDate || '___'} au ${data.endDate || '___'}.

Article 2 — Rémunération : ${data.salary || '___'} EUR brut/mois.
Régime : ${data.hoursPerWeek || '38'}h/semaine. CP n° ${data.cp || '200'}.

Article 3 — Le contrat prend fin de plein droit à la date d'échéance.
Il ne peut être résilié anticipativement que pour motif grave ou moyennant
une indemnité compensatoire (double du solde restant, plafonné au préavis CDI).

${data.reason ? `Article 4 — Motif du recours au CDD : ${data.reason}` : ''}

Fait en double exemplaire à ${company.city || '___'}, le ${dateStr}.

L'employeur                          Le travailleur
`

    case 'CONTRAT_STUDENT':
      return `${header}
CONVENTION D'OCCUPATION ÉTUDIANT
(Titre VII de la loi du 3 juillet 1978)

Entre :
  L'employeur : ${company.name || '___'} — BCE : ${company.bce || '___'}
Et :
  L'étudiant(e) : ${data.name || '___'} — NISS : ${data.niss || '___'}

Période : du ${data.startDate || '___'} au ${data.endDate || '___'}
Fonction : ${data.function || '___'}
Rémunération : ${data.salary || '___'} EUR brut/heure
Horaire : ${data.hoursPerWeek || '20'}h/semaine

MENTIONS OBLIGATOIRES (AR du 8 mars 2023) :
- Date de début et de fin du contrat
- Lieu de travail : ${data.workplace || company.address || '___'}
- Fonction : ${data.function || '___'}
- Rémunération et mode de paiement
- Horaire de travail
- Durée du préavis : ${data.noticeDays || 3} jours (premiers 7 jours) / 7 jours (après)

COTISATIONS SOCIALES RÉDUITES :
L'étudiant bénéficie du régime de cotisations réduites (2,71% + 5,42%)
dans la limite de 650 heures par année civile (contingent).

Fait en double exemplaire à ${company.city || '___'}, le ${dateStr}.
`

    case 'C4': {
      const noticeWeeks = calculateNotice(data.startDate, true)
      return `${header}
FORMULAIRE C4 — CERTIFICAT DE CHÔMAGE
(Arrêté royal du 25 novembre 1991)

EMPLOYEUR :
  ${company.name || '___'} — ONSS n° ${company.onss || '___'}
  ${company.address || '___'}

TRAVAILLEUR :
  Nom et prénom : ${data.name || '___'}
  NISS : ${data.niss || '___'}
  Domicile : ${data.address || '___'}

OCCUPATION :
  Du : ${data.startDate || '___'}
  Au : ${data.endDate || '___'}
  Statut : ${data.statut || 'Employé'}
  Régime : ${data.regime || 'Temps plein'} — ${data.hoursPerWeek || '38'}h/semaine
  CP n° ${data.cp || '200'}

MOTIF DE FIN DE CONTRAT :
  ☐ Licenciement (motif : ${data.motif || '___'})
  ☐ Fin de CDD
  ☐ Démission
  ☐ Rupture d'un commun accord
  ☐ Force majeure
  ☐ Motif grave

PRÉAVIS :
  Délai légal : ${noticeWeeks} semaines
  ${data.indemnityPaid ? 'Indemnité compensatoire de préavis versée' : 'Préavis presté'}

RÉMUNÉRATION :
  Dernier salaire brut : ${data.salary || '___'} EUR/mois

Ce certificat est délivré conformément à l'article 137 de l'AR du 25/11/1991.

Date : ${dateStr}
Signature de l'employeur : ___
Cachet de l'entreprise : ___
`
    }

    case 'PREAVIS': {
      const weeks = data.noticeWeeks || calculateNotice(data.startDate, true)
      const startNotice = new Date()
      // Le préavis commence le lundi suivant
      const dayOfWeek = startNotice.getDay()
      const nextMonday = new Date(startNotice)
      nextMonday.setDate(startNotice.getDate() + ((8 - dayOfWeek) % 7 || 7))
      const endNotice = new Date(nextMonday)
      endNotice.setDate(nextMonday.getDate() + weeks * 7)

      return `${header}
NOTIFICATION DE PRÉAVIS
(Loi du 26 décembre 2013 — statut unique)

${company.name || '___'}
${company.address || '___'}

À l'attention de : ${data.name || '___'}

${company.city || '___'}, le ${dateStr}

Madame, Monsieur,

Par la présente, nous vous notifions notre décision de mettre fin au contrat de
travail qui nous lie, moyennant un préavis de ${weeks} semaines.

Ce préavis prendra cours le ${nextMonday.toLocaleDateString('fr-BE')}
et prendra fin le ${endNotice.toLocaleDateString('fr-BE')}.

Date d'entrée en service : ${data.startDate || '___'}
Ancienneté : à calculer au début du préavis
Délai de préavis : ${weeks} semaines (conformément à la loi du 26/12/2013)

${data.reason ? `Motif : ${data.reason}` : ''}

Durant le préavis, vous êtes autorisé(e) à vous absenter du travail avec
maintien de votre rémunération afin de rechercher un nouvel emploi (jour de
sollicitation — 1 jour ou 2 demi-jours par semaine).

Veuillez agréer, Madame, Monsieur, l'expression de nos salutations distinguées.

${company.name || '___'}
(signature)
`
    }

    case 'ATTESTATION_EMPLOI':
      return `${header}
ATTESTATION D'EMPLOI

Je soussigné(e), ${data.signatoryName || '___'}, agissant en qualité de
${data.signatoryTitle || 'gérant(e)'} de la société ${company.name || '___'},

ATTESTE QUE :

Madame/Monsieur ${data.name || '___'}, domicilié(e) à ${data.address || '___'},
est employé(e) au sein de notre entreprise depuis le ${data.startDate || '___'},
en qualité de ${data.function || '___'}, sous contrat à durée ${data.contractType || 'indéterminée'},
à temps ${data.regime || 'plein'}.

La présente attestation est délivrée à la demande de l'intéressé(e) pour
servir et valoir ce que de droit.

Fait à ${company.city || '___'}, le ${dateStr}.

${data.signatoryName || '___'}
${data.signatoryTitle || 'Gérant(e)'}
${company.name || '___'}

(signature et cachet)
`

    case 'ATTESTATION_SALAIRE':
      return `${header}
ATTESTATION DE RÉMUNÉRATION

Je soussigné(e), ${data.signatoryName || '___'}, agissant en qualité de
${data.signatoryTitle || 'gérant(e)'} de la société ${company.name || '___'},

ATTESTE QUE :

Madame/Monsieur ${data.name || '___'} perçoit une rémunération mensuelle
brute de ${data.salary || '___'} EUR, soit un salaire net mensuel estimé
à ${data.netSalary || '___'} EUR.

Contrat : ${data.contractType || 'CDI'} depuis le ${data.startDate || '___'}.
Fonction : ${data.function || '___'}.
Régime : temps ${data.regime || 'plein'} (${data.hoursPerWeek || '38'}h/semaine).
${data.additionalBenefits ? `Avantages extra-légaux : ${data.additionalBenefits}` : ''}

La présente attestation est délivrée à la demande de l'intéressé(e).

Fait à ${company.city || '___'}, le ${dateStr}.

(signature et cachet)
`

    default:
      return `Document de type ${type} — génération non implémentée.`
  }
}

// ── Composant principal ──
export default function DocumentGenerator({ state }) {
  const [selectedType, setSelectedType] = useState(null)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [formData, setFormData] = useState({})
  const [generated, setGenerated] = useState(null)
  const [filterCat, setFilterCat] = useState('all')

  const employees = state?.employees || []
  const company = state?.co || state?.company || {}

  const filteredTypes = useMemo(() => {
    return Object.entries(DOC_TYPES).filter(([, val]) =>
      filterCat === 'all' || val.category === filterCat
    )
  }, [filterCat])

  const handleGenerate = useCallback(() => {
    if (!selectedType) return

    const emp = selectedEmployee ? employees.find(e =>
      (e.id || e.niss) === selectedEmployee
    ) : {}

    const data = {
      ...formData,
      name: emp ? `${emp.first || ''} ${emp.last || ''}`.trim() : formData.name || '',
      niss: emp?.niss || formData.niss || '',
      address: emp?.address || formData.address || '',
      startDate: emp?.startD || emp?.startDate || formData.startDate || '',
      endDate: emp?.endD || emp?.endDate || formData.endDate || '',
      salary: emp?.monthlySalary || emp?.gross || emp?.brut || formData.salary || '',
      function: emp?.fn || emp?.function || formData.function || '',
      statut: emp?.statut || formData.statut || 'employe',
      cp: emp?.cp || company?.cp || formData.cp || '200',
      company,
    }

    const content = generateDocument(selectedType, data)
    setGenerated({ type: selectedType, content, data })
  }, [selectedType, selectedEmployee, formData, employees, company])

  const handleDownload = useCallback(() => {
    if (!generated) return
    const blob = new Blob([generated.content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const typeName = DOC_TYPES[generated.type]?.label || generated.type
    a.download = `${typeName.replace(/\s+/g, '_')}_${(generated.data.name || 'doc').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [generated])

  const handlePrint = useCallback(() => {
    if (!generated) return
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`<pre style="font-family:monospace;font-size:12px;white-space:pre-wrap;max-width:800px;margin:40px auto;">${generated.content}</pre>`)
    printWindow.document.close()
    printWindow.print()
  }, [generated])

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: GOLD, margin: '0 0 4px 0', fontSize: 20 }}>Générateur de documents</h2>
      <p style={{ color: MUTED, margin: '0 0 20px 0', fontSize: 13 }}>
        Contrats, attestations, C4, préavis — conformes au droit du travail belge
      </p>

      {/* Filtres catégorie */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        <button
          onClick={() => setFilterCat('all')}
          style={{
            padding: '5px 14px', borderRadius: 16,
            border: `1px solid ${filterCat === 'all' ? GOLD : BORDER}`,
            background: filterCat === 'all' ? `${GOLD}22` : 'transparent',
            color: filterCat === 'all' ? GOLD : MUTED, cursor: 'pointer', fontSize: 12,
          }}
        >
          Tout
        </button>
        {Object.entries(CATEGORIES).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setFilterCat(key)}
            style={{
              padding: '5px 14px', borderRadius: 16,
              border: `1px solid ${filterCat === key ? val.color : BORDER}`,
              background: filterCat === key ? val.color + '22' : 'transparent',
              color: filterCat === key ? val.color : MUTED, cursor: 'pointer', fontSize: 12,
            }}
          >
            {val.icon} {val.label}
          </button>
        ))}
      </div>

      {/* Sélection du type de document */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10, marginBottom: 24 }}>
        {filteredTypes.map(([key, val]) => (
          <button
            key={key}
            onClick={() => { setSelectedType(key); setGenerated(null) }}
            style={{
              padding: 14, background: selectedType === key ? `${GOLD}22` : DARK,
              border: `1px solid ${selectedType === key ? GOLD : BORDER}`,
              borderRadius: 8, cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.2s',
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 6 }}>{val.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: selectedType === key ? GOLD : TEXT }}>{val.label}</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{val.description}</div>
          </button>
        ))}
      </div>

      {/* Formulaire */}
      {selectedType && (
        <div style={{
          padding: 20, background: DARK, borderRadius: 8, border: `1px solid ${BORDER}`,
          marginBottom: 20,
        }}>
          <h3 style={{ color: GOLD, margin: '0 0 16px 0', fontSize: 15 }}>
            {DOC_TYPES[selectedType].icon} {DOC_TYPES[selectedType].label}
          </h3>

          {/* Sélection employé */}
          {employees.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: MUTED, display: 'block', marginBottom: 4 }}>Travailleur</label>
              <select
                value={selectedEmployee || ''}
                onChange={e => setSelectedEmployee(e.target.value || null)}
                style={{
                  width: '100%', padding: '8px 12px', background: '#111827',
                  border: `1px solid ${BORDER}`, borderRadius: 6, color: TEXT, fontSize: 13,
                }}
              >
                <option value="">— Sélectionner ou saisir manuellement —</option>
                {employees.filter(e => !e.inactive).map((e, i) => (
                  <option key={e.id || e.niss || i} value={e.id || e.niss}>
                    {e.first || ''} {e.last || ''} {e.niss ? `(${e.niss.slice(0, 6)}...)` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Champs dynamiques selon le type */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {!selectedEmployee && (
              <Field label="Nom complet" value={formData.name} onChange={v => setFormData(p => ({ ...p, name: v }))} />
            )}
            {DOC_TYPES[selectedType].required.includes('startDate') && !selectedEmployee && (
              <Field label="Date d'entrée" type="date" value={formData.startDate} onChange={v => setFormData(p => ({ ...p, startDate: v }))} />
            )}
            {DOC_TYPES[selectedType].required.includes('endDate') && (
              <Field label="Date de fin" type="date" value={formData.endDate} onChange={v => setFormData(p => ({ ...p, endDate: v }))} />
            )}
            {DOC_TYPES[selectedType].required.includes('salary') && !selectedEmployee && (
              <Field label="Salaire brut/mois (EUR)" value={formData.salary} onChange={v => setFormData(p => ({ ...p, salary: v }))} />
            )}
            {DOC_TYPES[selectedType].required.includes('function') && !selectedEmployee && (
              <Field label="Fonction" value={formData.function} onChange={v => setFormData(p => ({ ...p, function: v }))} />
            )}
            {DOC_TYPES[selectedType].required.includes('motif') && (
              <Field label="Motif" value={formData.motif} onChange={v => setFormData(p => ({ ...p, motif: v }))} />
            )}
            {DOC_TYPES[selectedType].required.includes('modification') && (
              <Field label="Modification" value={formData.modification} onChange={v => setFormData(p => ({ ...p, modification: v }))} />
            )}
            {DOC_TYPES[selectedType].required.includes('noticeWeeks') && (
              <Field label="Semaines de préavis" value={formData.noticeWeeks} onChange={v => setFormData(p => ({ ...p, noticeWeeks: v }))} placeholder="Auto-calculé si vide" />
            )}
          </div>

          <button
            onClick={handleGenerate}
            style={{
              marginTop: 16, padding: '10px 24px', background: GOLD,
              border: 'none', borderRadius: 6, color: DARK, fontSize: 14,
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            Générer le document
          </button>
        </div>
      )}

      {/* Résultat */}
      {generated && (
        <div style={{
          padding: 20, background: DARK, borderRadius: 8, border: `1px solid ${BORDER}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ color: GOLD, margin: 0, fontSize: 15 }}>
              {DOC_TYPES[generated.type]?.label}
            </h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handlePrint} style={btnStyle}>Imprimer</button>
              <button onClick={handleDownload} style={btnStyle}>Télécharger</button>
              <button
                onClick={() => { navigator.clipboard?.writeText(generated.content) }}
                style={btnStyle}
              >
                Copier
              </button>
            </div>
          </div>
          <pre style={{
            whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 12, color: TEXT,
            lineHeight: 1.5, maxHeight: 600, overflowY: 'auto', padding: 16,
            background: '#060810', borderRadius: 6, border: `1px solid ${BORDER}`,
          }}>
            {generated.content}
          </pre>
        </div>
      )}
    </div>
  )
}

const btnStyle = {
  padding: '6px 14px', background: 'transparent', border: `1px solid ${BORDER}`,
  borderRadius: 6, color: MUTED, cursor: 'pointer', fontSize: 12,
}

function Field({ label, value, onChange, type, placeholder }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: MUTED, display: 'block', marginBottom: 4 }}>{label}</label>
      <input
        type={type || 'text'}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '8px 12px', background: '#111827',
          border: `1px solid ${BORDER}`, borderRadius: 6, color: TEXT, fontSize: 13,
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

export { DOC_TYPES, CATEGORIES, calculateNotice, generateDocument }
