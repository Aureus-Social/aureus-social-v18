// ═══════════════════════════════════════════════════════════
// AUREUS SOCIAL PRO — Multi-Devise & Expats (Item 26)
// Currency conversion + A1 form (détachement) management
// ═══════════════════════════════════════════════════════════

// Supported currencies (ECB-based, updated quarterly)
export const CURRENCIES = {
  EUR: { symbol: '€', name: 'Euro', rate: 1.0 },
  USD: { symbol: '$', name: 'US Dollar', rate: 1.08 },
  GBP: { symbol: '£', name: 'British Pound', rate: 0.86 },
  CHF: { symbol: 'CHF', name: 'Swiss Franc', rate: 0.94 },
  SEK: { symbol: 'kr', name: 'Swedish Krona', rate: 11.20 },
  DKK: { symbol: 'kr', name: 'Danish Krone', rate: 7.46 },
  NOK: { symbol: 'kr', name: 'Norwegian Krone', rate: 11.55 },
  PLN: { symbol: 'zł', name: 'Polish Zloty', rate: 4.32 },
  CZK: { symbol: 'Kč', name: 'Czech Koruna', rate: 25.10 },
  RON: { symbol: 'lei', name: 'Romanian Leu', rate: 4.97 },
  MAD: { symbol: 'MAD', name: 'Moroccan Dirham', rate: 10.75 },
};

/**
 * Convert amount between currencies
 * @param {number} amount - Amount to convert
 * @param {string} from - Source currency code (e.g. 'EUR')
 * @param {string} to - Target currency code (e.g. 'USD')
 * @param {object} customRates - Optional custom rates override
 * @returns {{ amount: number, rate: number, from: string, to: string, date: string }}
 */
export function convertCurrency(amount, from = 'EUR', to = 'EUR', customRates = null) {
  const rates = customRates || CURRENCIES;
  const fromRate = rates[from]?.rate ?? 1;
  const toRate = rates[to]?.rate ?? 1;
  const amountInEUR = amount / fromRate;
  const converted = Math.round(amountInEUR * toRate * 100) / 100;
  return {
    amount: converted,
    rate: Math.round((toRate / fromRate) * 10000) / 10000,
    from,
    to,
    original: amount,
    date: new Date().toISOString().slice(0, 10),
  };
}

/**
 * Format amount in given currency
 */
export function formatCurrency(amount, currency = 'EUR') {
  try {
    return new Intl.NumberFormat('fr-BE', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    const sym = CURRENCIES[currency]?.symbol || currency;
    return `${amount.toFixed(2)} ${sym}`;
  }
}

// ═══ FORMULAIRE A1 — Détachement de travailleurs ═══
// Règlement CE 883/2004 & 987/2009

export const A1_COUNTRIES = [
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE',
  'IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE',
  'IS','LI','NO','CH','UK',
];

/**
 * Generate A1 form data for a detached worker
 * @param {object} params
 * @returns {object} A1 form data ready for PDF generation
 */
export function generateA1FormData({
  worker,
  employer,
  hostCountry,
  startDate,
  endDate,
  jobDescription,
  hostCompany,
}) {
  const durationMonths = Math.ceil(
    (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24 * 30)
  );

  return {
    formType: 'A1',
    reference: `A1-${employer.onss || 'XXXX'}-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`,
    section1_worker: {
      lastName: worker.last || worker.nom,
      firstName: worker.first || worker.prenom,
      niss: worker.niss,
      dateOfBirth: worker.dateNaissance,
      nationality: worker.nationalite || 'BE',
      homeAddress: worker.adresse,
    },
    section2_employer: {
      name: employer.name,
      onssNumber: employer.onss,
      vatNumber: employer.vat,
      address: employer.adresse,
      country: 'BE',
    },
    section3_detachment: {
      hostCountry,
      hostCompany: hostCompany || null,
      startDate,
      endDate,
      durationMonths,
      jobDescription,
      appliedLegislation: 'BE', // Belgian social security continues to apply
      legalBasis: durationMonths <= 24
        ? 'Art. 12 Règlement CE 883/2004 (détachement ≤ 24 mois)'
        : 'Art. 16 Règlement CE 883/2004 (accord dérogatoire requis)',
    },
    section4_socialSecurity: {
      competentInstitution: 'ONSS — Office National de Sécurité Sociale',
      institutionAddress: 'Place Victor Horta 11, 1060 Bruxelles',
      registrationNumber: employer.onss,
      coveragePeriod: { from: startDate, to: endDate },
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      generatedBy: 'Aureus Social Pro',
      maxDuration24Months: durationMonths <= 24,
      requiresDerogation: durationMonths > 24,
    },
    warnings: [
      ...(durationMonths > 24 ? ['Détachement > 24 mois: accord dérogatoire Art. 16 requis via SPF Sécurité Sociale'] : []),
      ...(!A1_COUNTRIES.includes(hostCountry) ? [`Pays ${hostCountry} non couvert par le règlement CE 883/2004`] : []),
    ],
  };
}

export default { convertCurrency, formatCurrency, CURRENCIES, generateA1FormData, A1_COUNTRIES };
