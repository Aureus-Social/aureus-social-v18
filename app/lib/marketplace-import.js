// ═══════════════════════════════════════════════════════════
// Item #37 Phase 2 — MARKETPLACE IMPORT PARSERS
// Import employee data FROM accounting software
// BOB50, Winbooks, Exact Online, Horus, Octopus
// Also: Generic CSV, multi-format export
// ═══════════════════════════════════════════════════════════
"use client";

// ═══ NISS VALIDATION (Modulo 97) ═══
function validateNISS(niss) {
  if (!niss) return { valid: false, reason: 'Vide' };
  const clean = String(niss).replace(/[^0-9]/g, '');
  if (clean.length !== 11) return { valid: false, reason: 'Longueur incorrecte (' + clean.length + ')' };
  const base = parseInt(clean.substring(0, 9));
  const check = parseInt(clean.substring(9, 11));
  // Born before 2000
  if (97 - (base % 97) === check) return { valid: true, century: 19 };
  // Born after 2000
  const base2 = parseInt('2' + clean.substring(0, 9));
  if (97 - (base2 % 97) === check) return { valid: true, century: 20 };
  return { valid: false, reason: 'Checksum invalide' };
}

// ═══ IBAN VALIDATION ═══
function validateIBAN(iban) {
  if (!iban) return { valid: false };
  const clean = iban.replace(/\s/g, '').toUpperCase();
  if (clean.length < 15 || clean.length > 34) return { valid: false };
  if (clean.substring(0, 2) === 'BE' && clean.length !== 16) return { valid: false, reason: 'IBAN BE = 16 caractères' };
  // Move first 4 chars to end, convert letters to numbers
  const rearranged = clean.substring(4) + clean.substring(0, 4);
  const numStr = rearranged.split('').map(c => { const n = c.charCodeAt(0); return n >= 65 ? n - 55 : c; }).join('');
  // Modulo 97
  let remainder = 0;
  for (let i = 0; i < numStr.length; i++) {
    remainder = (remainder * 10 + parseInt(numStr[i])) % 97;
  }
  return { valid: remainder === 1 };
}

// ═══ NACE → CP MAPPING ═══
const NACE_CP_MAP = {
  '10': '118', '11': '118', '12': '133', '13': '120', '14': '109', '15': '128',
  '16': '125', '17': '129', '18': '130', '20': '116', '21': '116', '22': '116',
  '23': '113', '24': '104', '25': '111', '26': '149', '27': '149', '28': '111',
  '29': '112', '30': '111', '31': '126', '32': '149', '33': '149',
  '41': '124', '42': '124', '43': '124',
  '45': '112', '46': '200', '47': '201',
  '49': '140', '50': '139', '51': '315', '52': '226', '53': '140',
  '55': '302', '56': '302',
  '58': '200', '59': '227', '60': '227', '61': '200', '62': '200', '63': '200',
  '64': '310', '65': '306', '66': '307',
  '69': '200', '70': '200', '71': '200', '72': '200', '73': '200', '74': '200', '75': '200',
  '78': '322', '79': '200', '80': '317', '81': '121', '82': '200',
  '85': '152', '86': '330', '87': '330', '88': '319',
  '90': '304', '91': '329', '92': '217', '93': '223', '94': '329', '95': '149', '96': '314',
};

function detectCPFromNACE(nace) {
  if (!nace) return null;
  const code = String(nace).replace(/\./g, '').substring(0, 2);
  return NACE_CP_MAP[code] || '200'; // Default CP 200
}

// ═══ GENERIC CSV PARSER ═══
function parseCSV(text, separator = null) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [], error: 'Fichier vide ou incomplet' };
  
  // Auto-detect separator
  if (!separator) {
    const firstLine = lines[0];
    const counts = { ';': (firstLine.match(/;/g) || []).length, ',': (firstLine.match(/,/g) || []).length, '\t': (firstLine.match(/\t/g) || []).length };
    separator = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }
  
  const headers = lines[0].split(separator).map(h => h.replace(/^["']|["']$/g, '').trim());
  const rows = lines.slice(1).map(line => {
    const values = line.split(separator).map(v => v.replace(/^["']|["']$/g, '').trim());
    const obj = {};
    headers.forEach((h, i) => obj[h] = values[i] || '');
    return obj;
  });
  
  return { headers, rows, separator, count: rows.length };
}

// ═══ COLUMN MAPPING (intelligent) ═══
const FIELD_ALIASES = {
  nom: ['nom', 'name', 'lastname', 'last_name', 'family_name', 'nom_famille', 'achternaam'],
  prenom: ['prenom', 'prénom', 'firstname', 'first_name', 'given_name', 'voornaam'],
  niss: ['niss', 'nrn', 'rijksregisternummer', 'numero_national', 'national_number', 'insz', 'nn'],
  dateNaissance: ['date_naissance', 'birthdate', 'birth_date', 'dob', 'geboortedatum', 'naissance'],
  iban: ['iban', 'compte', 'bankrekening', 'bank_account', 'compte_bancaire'],
  brut: ['brut', 'gross', 'salaire_brut', 'bruto', 'brutoloon', 'salary', 'salaire'],
  cp: ['cp', 'commission_paritaire', 'paritair_comite', 'joint_committee', 'pc'],
  contrat: ['contrat', 'type_contrat', 'contract', 'contract_type', 'overeenkomst'],
  email: ['email', 'mail', 'e-mail', 'courriel'],
  telephone: ['telephone', 'tel', 'phone', 'gsm', 'mobile', 'telefoon'],
  adresse: ['adresse', 'address', 'rue', 'straat', 'adres'],
  codePostal: ['code_postal', 'cp_adresse', 'zip', 'postcode', 'postal'],
  ville: ['ville', 'city', 'gemeente', 'localite', 'stad'],
  dateEntree: ['date_entree', 'start_date', 'hire_date', 'startdatum', 'entree', 'indiensttreding'],
  dateSortie: ['date_sortie', 'end_date', 'exit_date', 'einddatum', 'sortie', 'uitdiensttreding'],
  situation: ['situation', 'etat_civil', 'marital', 'burgerlijke_stand', 'familiale'],
  enfants: ['enfants', 'children', 'kinderen', 'enfants_charge', 'personnes_charge'],
  nace: ['nace', 'code_nace', 'activite'],
  regime: ['regime', 'temps', 'fraction', 'regime_travail', 'arbeidsregime'],
};

function autoMapColumns(headers) {
  const mapping = {};
  const normalized = headers.map(h => h.toLowerCase().replace(/[\s\-_\.]/g, '_').replace(/[àáâã]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[ç]/g, 'c'));
  
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    for (let i = 0; i < normalized.length; i++) {
      if (aliases.some(a => normalized[i].includes(a))) {
        mapping[field] = headers[i];
        break;
      }
    }
  }
  return mapping;
}

// ═══ FORMAT-SPECIFIC PARSERS ═══

// BOB50 employee export
function parseBOB50(text) {
  const parsed = parseCSV(text, '\t');
  const mapping = autoMapColumns(parsed.headers);
  return {
    ...parsed,
    format: 'BOB50',
    mapping,
    employees: parsed.rows.map(r => mapEmployee(r, mapping)),
  };
}

// Winbooks employee export
function parseWinbooks(text) {
  const parsed = parseCSV(text);
  const mapping = autoMapColumns(parsed.headers);
  return {
    ...parsed,
    format: 'Winbooks',
    mapping,
    employees: parsed.rows.map(r => mapEmployee(r, mapping)),
  };
}

// Exact Online export
function parseExactOnline(text) {
  const parsed = parseCSV(text, ',');
  const mapping = autoMapColumns(parsed.headers);
  return {
    ...parsed,
    format: 'Exact Online',
    mapping,
    employees: parsed.rows.map(r => mapEmployee(r, mapping)),
  };
}

// Horus export (semicolon separated, Belgian decimals)
function parseHorus(text) {
  // Convert Belgian decimals (1.234,56 → 1234.56) before parsing
  const converted = text.replace(/(\d+)\.(\d{3}),(\d{2})/g, '$1$2.$3');
  const parsed = parseCSV(converted, ';');
  const mapping = autoMapColumns(parsed.headers);
  return {
    ...parsed,
    format: 'Horus',
    mapping,
    employees: parsed.rows.map(r => mapEmployee(r, mapping)),
  };
}

// Octopus export
function parseOctopus(text) {
  const parsed = parseCSV(text, ',');
  const mapping = autoMapColumns(parsed.headers);
  return {
    ...parsed,
    format: 'Octopus',
    mapping,
    employees: parsed.rows.map(r => mapEmployee(r, mapping)),
  };
}

// Generic / Auto-detect
function parseGeneric(text) {
  const parsed = parseCSV(text);
  const mapping = autoMapColumns(parsed.headers);
  return {
    ...parsed,
    format: 'Générique',
    mapping,
    employees: parsed.rows.map(r => mapEmployee(r, mapping)),
  };
}

// Map raw row to employee object
function mapEmployee(row, mapping) {
  const get = (field) => {
    const col = mapping[field];
    return col ? (row[col] || '').trim() : '';
  };
  
  const niss = get('niss').replace(/[^0-9]/g, '');
  const nissValid = validateNISS(niss);
  const iban = get('iban').replace(/\s/g, '').toUpperCase();
  const ibanValid = validateIBAN(iban);
  const brut = parseFloat(get('brut').replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
  const nace = get('nace');
  
  return {
    nom: get('nom'),
    prenom: get('prenom'),
    niss: niss,
    nissValid: nissValid.valid,
    dateNaissance: get('dateNaissance'),
    iban: iban,
    ibanValid: ibanValid.valid,
    brut: brut,
    cp: get('cp') || detectCPFromNACE(nace),
    contrat: get('contrat') || 'CDI',
    email: get('email'),
    telephone: get('telephone'),
    adresse: get('adresse'),
    codePostal: get('codePostal'),
    ville: get('ville'),
    dateEntree: get('dateEntree'),
    dateSortie: get('dateSortie'),
    situation: get('situation') || 'isole',
    enfants: parseInt(get('enfants')) || 0,
    nace: nace,
    regime: get('regime') || 'temps_plein',
    _raw: row,
    _validation: {
      niss: nissValid,
      iban: ibanValid,
      brutOk: brut > 0,
      nomOk: get('nom').length > 0,
    }
  };
}

// ═══ MASTER IMPORT FUNCTION ═══
export function importFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const filename = (file.name || '').toLowerCase();
        
        let result;
        if (filename.includes('bob')) result = parseBOB50(text);
        else if (filename.includes('winbooks') || filename.includes('wb')) result = parseWinbooks(text);
        else if (filename.includes('exact')) result = parseExactOnline(text);
        else if (filename.includes('horus')) result = parseHorus(text);
        else if (filename.includes('octopus')) result = parseOctopus(text);
        else result = parseGeneric(text);
        
        // Validation summary
        const valid = result.employees.filter(e => e._validation.niss.valid && e._validation.nomOk);
        const warnings = result.employees.filter(e => !e._validation.niss.valid || !e._validation.ibanValid);
        
        resolve({
          ...result,
          filename: file.name,
          size: file.size,
          validCount: valid.length,
          warningCount: warnings.length,
          totalCount: result.employees.length,
          validationSummary: {
            nissInvalid: result.employees.filter(e => !e._validation.niss.valid).length,
            ibanInvalid: result.employees.filter(e => !e._validation.iban.valid).length,
            missingNom: result.employees.filter(e => !e._validation.nomOk).length,
            missingBrut: result.employees.filter(e => !e._validation.brutOk).length,
          }
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Erreur lecture fichier'));
    reader.readAsText(file, 'UTF-8');
  });
}

export { validateNISS, validateIBAN, detectCPFromNACE, parseCSV, autoMapColumns };
export default importFromFile;
