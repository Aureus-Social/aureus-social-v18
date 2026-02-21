// ═══ AUREUS SOCIAL PRO — Modules Index ═══
// Import centralisé de tous les modules extractés

export * from './lois-belges.js';
export * from './crypto.js';
export * from './calc-pp.js';
export * from './calc-independant.js';
export * from './persistence.js';

// calc-paie et xml-generators utilisent dependency injection
// Importer séparément: import { initCalcEngine, calc } from './lib/calc-paie.js';
// Importer séparément: import { initXML } from './lib/xml-generators.js';
