// ═══════════════════════════════════════════════════════════
// AUREUS SOCIAL PRO — CSV Parsers (Item 23)
// Specific column mappings for competitor payroll software
// GapPaie, Partena Professional, Securex, SD Worx, Liantis
// ═══════════════════════════════════════════════════════════

/**
 * Each parser profile defines:
 * - name: Display name
 * - separator: Expected CSV separator
 * - encoding: Expected encoding
 * - columnMap: Maps competitor column names → Aureus field names
 * - transform: Optional value transformations
 */

export const CSV_PROFILES = {

  // ── GapPaie (anciennement Gap Informatique) ──
  gappaie: {
    name: 'GapPaie',
    description: 'Export personnel GapPaie (.csv)',
    separator: ';',
    encoding: 'windows-1252',
    columnMap: {
      'Matricule': '_externalId',
      'Nom': 'last',
      'Prenom': 'first',
      'Prénom': 'first',
      'N° Registre National': 'niss',
      'NRN': 'niss',
      'Registre National': 'niss',
      'Date naissance': 'dateNaissance',
      'Date de naissance': 'dateNaissance',
      'Adresse': 'address',
      'Email': 'email',
      'E-mail': 'email',
      'Telephone': 'phone',
      'GSM': 'phone',
      'IBAN': 'iban',
      'Compte bancaire': 'iban',
      'Salaire brut': 'monthlySalary',
      'Salaire mensuel': 'monthlySalary',
      'Brut mensuel': 'monthlySalary',
      'Date entree': 'startDate',
      'Date entrée': 'startDate',
      'Date d\'entrée': 'startDate',
      'Date debut': 'startDate',
      'Date sortie': 'endDate',
      'Date fin': 'endDate',
      'Type contrat': 'contractType',
      'Contrat': 'contractType',
      'Fonction': 'function',
      'Categorie': 'statut',
      'Catégorie': 'statut',
      'Statut': 'statut',
      'Regime': 'whWeek',
      'Régime': 'whWeek',
      'Heures/semaine': 'whWeek',
      'Commission paritaire': 'cp',
      'CP': 'cp',
      'Situation familiale': 'civil',
      'Etat civil': 'civil',
      'Enfants a charge': 'depChildren',
      'Enfants': 'depChildren',
      'Nationalite': 'nationalite',
      'Nationalité': 'nationalite',
    },
    transform: {
      statut: v => {
        const vl = (v || '').toLowerCase();
        if (vl.includes('ouvr')) return 'ouvrier';
        if (vl.includes('empl')) return 'employe';
        if (vl.includes('cadre')) return 'employe';
        return 'employe';
      },
      contractType: v => {
        const vl = (v || '').toUpperCase();
        if (vl.includes('CDD')) return 'CDD';
        if (vl.includes('INTER')) return 'Intérimaire';
        if (vl.includes('ETUD')) return 'Étudiant';
        return 'CDI';
      },
      civil: v => {
        const vl = (v || '').toLowerCase();
        if (vl.includes('marié') || vl.includes('marie')) return 'married_1';
        if (vl.includes('cohab')) return 'cohabitant';
        return 'isole';
      },
      monthlySalary: v => parseFloat(('' + v).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0,
      whWeek: v => parseFloat(('' + v).replace(',', '.')) || 38,
      depChildren: v => parseInt(v) || 0,
    },
  },

  // ── Partena Professional ──
  partena: {
    name: 'Partena Professional',
    description: 'Export signalétique Partena (.csv/.xlsx)',
    separator: ';',
    encoding: 'utf-8',
    columnMap: {
      'N° travailleur': '_externalId',
      'Numéro travailleur': '_externalId',
      'Nom de famille': 'last',
      'Nom': 'last',
      'Prénom': 'first',
      'Prenom': 'first',
      'NISS': 'niss',
      'Numéro national': 'niss',
      'N° national': 'niss',
      'Date de naissance': 'dateNaissance',
      'Adresse complète': 'address',
      'Rue et numéro': 'address',
      'E-mail privé': 'email',
      'Email': 'email',
      'Tél. privé': 'phone',
      'GSM': 'phone',
      'N° de compte': 'iban',
      'IBAN': 'iban',
      'Salaire mensuel brut': 'monthlySalary',
      'Rémunération mensuelle': 'monthlySalary',
      'Salaire de base': 'monthlySalary',
      'Date entrée en service': 'startDate',
      'Date d\'entrée': 'startDate',
      'Date début contrat': 'startDate',
      'Date sortie de service': 'endDate',
      'Date de fin': 'endDate',
      'Nature du contrat': 'contractType',
      'Type de contrat': 'contractType',
      'Fonction': 'function',
      'Description fonction': 'function',
      'Catégorie': 'statut',
      'Type travailleur': 'statut',
      'Ouvrier/Employé': 'statut',
      'Régime de travail': 'whWeek',
      'Durée hebdomadaire': 'whWeek',
      'Commission paritaire': 'cp',
      'N° CP': 'cp',
      'CP': 'cp',
      'Situation familiale': 'civil',
      'État civil': 'civil',
      'Personnes à charge': 'depChildren',
      'Enfants à charge': 'depChildren',
      'Nationalité': 'nationalite',
    },
    transform: {
      statut: v => {
        const vl = (v || '').toLowerCase();
        if (vl.includes('ouvr')) return 'ouvrier';
        return 'employe';
      },
      contractType: v => {
        const vl = (v || '').toUpperCase();
        if (vl.includes('DURÉE DÉTERMINÉE') || vl.includes('CDD')) return 'CDD';
        if (vl.includes('REMPLACEMENT')) return 'CDD';
        if (vl.includes('ÉTUDIANT') || vl.includes('STUDENT')) return 'Étudiant';
        return 'CDI';
      },
      civil: v => {
        const vl = (v || '').toLowerCase();
        if (vl.includes('marié') || vl.includes('marie')) return 'married_1';
        if (vl.includes('cohab') || vl.includes('légal')) return 'cohabitant';
        if (vl.includes('divorcé') || vl.includes('divorce')) return 'isole';
        if (vl.includes('veuf') || vl.includes('veuve')) return 'isole';
        return 'isole';
      },
      monthlySalary: v => parseFloat(('' + v).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0,
      whWeek: v => parseFloat(('' + v).replace(',', '.')) || 38,
      depChildren: v => parseInt(v) || 0,
      cp: v => ('' + v).replace(/[^0-9.]/g, ''),
    },
  },

  // ── Securex ──
  securex: {
    name: 'Securex',
    description: 'Export personnel Securex My HR (.csv)',
    separator: ';',
    encoding: 'utf-8',
    columnMap: {
      'Personeelsnummer': '_externalId',
      'N° personnel': '_externalId',
      'Matricule': '_externalId',
      'Familienaam': 'last',
      'Nom': 'last',
      'Voornaam': 'first',
      'Prénom': 'first',
      'Rijksregisternummer': 'niss',
      'NISS': 'niss',
      'N° registre national': 'niss',
      'Geboortedatum': 'dateNaissance',
      'Date de naissance': 'dateNaissance',
      'Adres': 'address',
      'Adresse': 'address',
      'E-mail': 'email',
      'Email': 'email',
      'Telefoon': 'phone',
      'Téléphone': 'phone',
      'GSM': 'phone',
      'Rekeningnummer': 'iban',
      'IBAN': 'iban',
      'Compte bancaire': 'iban',
      'Brutoloon': 'monthlySalary',
      'Salaire brut': 'monthlySalary',
      'Brut mensuel': 'monthlySalary',
      'Maandloon': 'monthlySalary',
      'Datum indiensttreding': 'startDate',
      'Date entrée': 'startDate',
      'Date d\'entrée en service': 'startDate',
      'Datum uitdiensttreding': 'endDate',
      'Date sortie': 'endDate',
      'Contracttype': 'contractType',
      'Type contrat': 'contractType',
      'Functie': 'function',
      'Fonction': 'function',
      'Categorie': 'statut',
      'Catégorie': 'statut',
      'Statuut': 'statut',
      'Arbeidsregime': 'whWeek',
      'Régime': 'whWeek',
      'Heures/semaine': 'whWeek',
      'Paritair comité': 'cp',
      'Commission paritaire': 'cp',
      'PC': 'cp',
      'CP': 'cp',
      'Burgerlijke staat': 'civil',
      'Situation familiale': 'civil',
      'Kinderen ten laste': 'depChildren',
      'Enfants à charge': 'depChildren',
      'Nationaliteit': 'nationalite',
      'Nationalité': 'nationalite',
    },
    transform: {
      statut: v => {
        const vl = (v || '').toLowerCase();
        if (vl.includes('ouvr') || vl.includes('arbeider')) return 'ouvrier';
        return 'employe';
      },
      contractType: v => {
        const vl = (v || '').toUpperCase();
        if (vl.includes('CDD') || vl.includes('BEPAALDE')) return 'CDD';
        if (vl.includes('ÉTUDIANT') || vl.includes('STUDENT')) return 'Étudiant';
        if (vl.includes('FLEXI')) return 'Flexi-job';
        return 'CDI';
      },
      civil: v => {
        const vl = (v || '').toLowerCase();
        if (vl.includes('marié') || vl.includes('gehuwd') || vl.includes('marie')) return 'married_1';
        if (vl.includes('cohab') || vl.includes('samenwon')) return 'cohabitant';
        return 'isole';
      },
      monthlySalary: v => parseFloat(('' + v).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0,
      whWeek: v => parseFloat(('' + v).replace(',', '.')) || 38,
      depChildren: v => parseInt(v) || 0,
      cp: v => ('' + v).replace(/[^0-9.]/g, ''),
    },
  },

  // ── SD Worx ──
  sdworx: {
    name: 'SD Worx',
    description: 'Export signalétique SD Worx / Blox (.csv)',
    separator: ';',
    encoding: 'utf-8',
    columnMap: {
      'WorkerNumber': '_externalId',
      'N° travailleur': '_externalId',
      'LastName': 'last',
      'Nom': 'last',
      'FirstName': 'first',
      'Prénom': 'first',
      'NationalNumber': 'niss',
      'NISS': 'niss',
      'BirthDate': 'dateNaissance',
      'Email': 'email',
      'Phone': 'phone',
      'BankAccount': 'iban',
      'IBAN': 'iban',
      'GrossSalary': 'monthlySalary',
      'Salaire brut': 'monthlySalary',
      'StartDate': 'startDate',
      'EndDate': 'endDate',
      'ContractType': 'contractType',
      'JobTitle': 'function',
      'Fonction': 'function',
      'WorkerCategory': 'statut',
      'WeeklyHours': 'whWeek',
      'JointCommittee': 'cp',
      'CP': 'cp',
      'MaritalStatus': 'civil',
      'DependentChildren': 'depChildren',
      'Nationality': 'nationalite',
    },
    transform: {
      statut: v => (v || '').toLowerCase().includes('blue') || (v || '').toLowerCase().includes('ouvr') ? 'ouvrier' : 'employe',
      contractType: v => (v || '').toUpperCase().includes('FIXED') || (v || '').toUpperCase().includes('CDD') ? 'CDD' : 'CDI',
      civil: v => (v || '').toLowerCase().includes('married') || (v || '').toLowerCase().includes('marié') ? 'married_1' : 'isole',
      monthlySalary: v => parseFloat(('' + v).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0,
      whWeek: v => parseFloat(('' + v).replace(',', '.')) || 38,
      depChildren: v => parseInt(v) || 0,
    },
  },

  // ── Liantis ──
  liantis: {
    name: 'Liantis',
    description: 'Export personnel Liantis (.csv)',
    separator: ';',
    encoding: 'utf-8',
    columnMap: {
      'Werknemersnummer': '_externalId',
      'Naam': 'last',
      'Nom': 'last',
      'Voornaam': 'first',
      'Prénom': 'first',
      'Rijksregisternr': 'niss',
      'NISS': 'niss',
      'E-mail': 'email',
      'Telefoon': 'phone',
      'IBAN': 'iban',
      'Brutoloon': 'monthlySalary',
      'Salaire brut': 'monthlySalary',
      'Indienstdatum': 'startDate',
      'Uitdienstdatum': 'endDate',
      'Contracttype': 'contractType',
      'Functie': 'function',
      'Fonction': 'function',
      'Statuut': 'statut',
      'Arbeidsregime': 'whWeek',
      'Paritair comité': 'cp',
      'CP': 'cp',
    },
    transform: {
      statut: v => (v || '').toLowerCase().includes('arbeider') || (v || '').toLowerCase().includes('ouvr') ? 'ouvrier' : 'employe',
      contractType: v => (v || '').toUpperCase().includes('BEPAALD') || (v || '').toUpperCase().includes('CDD') ? 'CDD' : 'CDI',
      monthlySalary: v => parseFloat(('' + v).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0,
      whWeek: v => parseFloat(('' + v).replace(',', '.')) || 38,
      depChildren: v => parseInt(v) || 0,
    },
  },
};

/**
 * Detect which parser profile best matches the CSV headers
 * @param {string[]} headers - CSV column headers
 * @returns {{ profile: string, score: number, name: string }[]}
 */
export function detectProfile(headers) {
  const headerSet = new Set(headers.map(h => h.trim()));
  const results = [];

  for (const [key, profile] of Object.entries(CSV_PROFILES)) {
    const mappableColumns = Object.keys(profile.columnMap);
    const matched = mappableColumns.filter(col => headerSet.has(col));
    const score = matched.length / Math.max(headers.length, 1);
    if (matched.length >= 2) {
      results.push({ profile: key, name: profile.name, score: Math.round(score * 100), matched: matched.length });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

/**
 * Apply a parser profile to map CSV columns to Aureus fields
 * @param {object[]} rows - Parsed CSV rows (array of objects keyed by header)
 * @param {string} profileKey - Profile key (e.g. 'partena')
 * @returns {object[]} Mapped employee objects
 */
export function applyProfile(rows, profileKey) {
  const profile = CSV_PROFILES[profileKey];
  if (!profile) return rows;

  return rows.map((row, idx) => {
    const emp = { id: 'IMP-' + Date.now() + '-' + idx };

    for (const [csvCol, field] of Object.entries(profile.columnMap)) {
      if (row[csvCol] !== undefined && row[csvCol] !== '') {
        let value = row[csvCol];
        if (profile.transform?.[field]) {
          value = profile.transform[field](value);
        }
        emp[field] = value;
      }
    }

    // Defaults
    if (!emp.contractType) emp.contractType = 'CDI';
    if (!emp.statut) emp.statut = 'employe';
    if (!emp.whWeek) emp.whWeek = 38;
    if (!emp.depChildren) emp.depChildren = 0;

    return emp;
  });
}

export default { CSV_PROFILES, detectProfile, applyProfile };
