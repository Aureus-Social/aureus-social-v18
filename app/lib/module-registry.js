// ═══════════════════════════════════════════════════════════
// Item #36 — ARCHITECTURE MICROSERVICES
// Module registry, dynamic loader, lazy imports
// Étape 1/5 : Registre centralisé + lazy loading
// ═══════════════════════════════════════════════════════════
"use client";
import React, { Suspense, lazy, useState, useEffect } from 'react';

// ═══ MODULE MANIFEST ═══
// Each module can be loaded independently via dynamic import
const MODULE_MANIFEST = {
  // ── CORE (always loaded) ──
  'dashboard': { path: './modules/DashboardCharts', weight: 'core', label: 'Dashboard' },
  
  // ── PAYROLL (load on demand) ──
  'payroll.calc': { path: './modules/PayrollHub', export: 'ValidationPrePaieV2', weight: 'heavy', label: 'Calcul de paie' },
  'payroll.timeline': { path: './modules/PayrollHub', export: 'TimelinePaieV2', weight: 'medium', label: 'Timeline paie' },
  'payroll.solde': { path: './modules/PayrollHub', export: 'SoldeToutCompteV2', weight: 'medium', label: 'Solde tout compte' },
  'payroll.simulator': { path: './modules/SimulateurNetBrut', weight: 'light', label: 'Simulateur Net/Brut' },
  'payroll.compare': { path: './modules/ComparaisonPeriodes', weight: 'light', label: 'Comparaison périodes' },
  
  // ── EMPLOYEES (load on demand) ──
  'employees.list': { path: './modules/EmployeeHub', export: 'DashboardRHV2', weight: 'heavy', label: 'Liste travailleurs' },
  'employees.registre': { path: './modules/EmployeeHub', export: 'RegistrePersonnelV2', weight: 'medium', label: 'Registre personnel' },
  'employees.portal': { path: './modules/EmployeeHub', export: 'PortailEmployeV2', weight: 'medium', label: 'Portail employé' },
  
  // ── DECLARATIONS (load on demand) ──
  'declarations.onss': { path: './modules/DeclarationsFiscalV2', export: 'ChargesONSSV2', weight: 'heavy', label: 'ONSS' },
  'declarations.compta': { path: './modules/DeclarationsFiscalV2', export: 'ExportComptaProV2', weight: 'medium', label: 'Export compta' },
  'declarations.budget': { path: './modules/DeclarationsFiscalV2', export: 'BudgetPrevisionnelV2', weight: 'medium', label: 'Budget prévisionnel' },
  
  // ── PRIMES & AVANTAGES ──
  'primes.calculator': { path: './modules/PrimesAvantagesV2', export: 'PrimeCalculatorV2', weight: 'medium', label: 'Calculateur primes' },
  'primes.atn': { path: './modules/PrimesAvantagesV2', export: 'VehiculesATNV2', weight: 'light', label: 'ATN Véhicules' },
  'primes.cafeteria': { path: './modules/PrimesAvantagesV2', export: 'PlanCafeteriaV2', weight: 'light', label: 'Plan cafétéria' },
  
  // ── COMPLIANCE ──
  'compliance.dpo': { path: './modules/DPODashboard', weight: 'light', label: 'RGPD / DPO' },
  'compliance.attestations': { path: './modules/AttestationsLegales', weight: 'light', label: 'Attestations légales' },
  'compliance.formations': { path: './modules/FormationSuivi', weight: 'light', label: 'Formations' },
  
  // ── PLANNING ──
  'planning.conges': { path: './modules/AbsencesContratsV3', export: 'PlanningCongesV3', weight: 'medium', label: 'Planning congés' },
  'planning.calendar': { path: './modules/CalendrierSocial', weight: 'light', label: 'Calendrier social' },
  'planning.contrats': { path: './modules/AbsencesContratsV3', export: 'ContratsLegauxV3', weight: 'medium', label: 'Contrats' },
  
  // ── ADMIN ──
  'admin.rbac': { path: './modules/AutoAdminV3', export: 'RBACAdminV2', weight: 'medium', label: 'Gestion rôles' },
  'admin.baremes': { path: './modules/AdminBaremes', weight: 'heavy', label: 'Admin barèmes' },
  'admin.security': { path: './modules/SecurityDashboard', export: 'SecurityDashboard', weight: 'medium', label: 'Sécurité' },
  
  // ── MARKETPLACE ──
  'marketplace.bob': { path: './modules/MarketplaceConnectors', export: 'BOBConnector', weight: 'light', label: 'BOB50' },
  'marketplace.winbooks': { path: './modules/MarketplaceConnectors', export: 'WinbooksConnector', weight: 'light', label: 'Winbooks' },
  'marketplace.exact': { path: './modules/MarketplaceConnectors', export: 'ExactConnector', weight: 'light', label: 'Exact Online' },
};

// ═══ LAZY LOADER ═══
const _loadedModules = new Map();

export function getModuleInfo(moduleId) {
  return MODULE_MANIFEST[moduleId] || null;
}

export function listModules(filter) {
  return Object.entries(MODULE_MANIFEST)
    .filter(([id, m]) => !filter || m.weight === filter || id.startsWith(filter))
    .map(([id, m]) => ({ id, ...m }));
}

// Load a module dynamically
export async function loadModule(moduleId) {
  if (_loadedModules.has(moduleId)) return _loadedModules.get(moduleId);
  
  const manifest = MODULE_MANIFEST[moduleId];
  if (!manifest) throw new Error(`Module '${moduleId}' not found in registry`);
  
  try {
    const mod = await import(/* webpackChunkName: "[request]" */ `${manifest.path}`);
    const component = manifest.export ? mod[manifest.export] : mod.default;
    _loadedModules.set(moduleId, component);
    return component;
  } catch (e) {
    console.error(`[ModuleRegistry] Failed to load '${moduleId}':`, e);
    throw e;
  }
}

// Preload modules in background
export function preloadModules(moduleIds) {
  return Promise.allSettled(moduleIds.map(id => loadModule(id)));
}

// Get loading stats
export function getModuleStats() {
  const all = Object.entries(MODULE_MANIFEST);
  return {
    total: all.length,
    loaded: _loadedModules.size,
    byWeight: {
      core: all.filter(([, m]) => m.weight === 'core').length,
      heavy: all.filter(([, m]) => m.weight === 'heavy').length,
      medium: all.filter(([, m]) => m.weight === 'medium').length,
      light: all.filter(([, m]) => m.weight === 'light').length,
    },
    loadedIds: [..._loadedModules.keys()],
  };
}

// ═══ DECOMPOSITION BLUEPRINT ═══
/*
Phase 1 (DONE): Module registry + lazy loading
Phase 2: Extract calcPaie() engine into standalone worker (Web Worker)
Phase 3: Extract declarations (DmfA, DIMONA, Belcotax) into API routes
Phase 4: Extract baremes/scales into cacheable API endpoint
Phase 5: Full module isolation with independent state management

Target architecture:
┌─────────────────────────────────────────────┐
│                 App Shell                     │
│  ┌─────────┐ ┌──────────┐ ┌───────────────┐ │
│  │ Router  │ │ Auth/RBAC│ │ Module Loader │ │
│  └────┬────┘ └────┬─────┘ └───────┬───────┘ │
│       │           │               │          │
│  ┌────▼───────────▼───────────────▼────────┐ │
│  │           Module Registry                │ │
│  ├─────────┬──────────┬──────────┬─────────┤ │
│  │ Payroll │ Employees│ Declar.  │ Admin   │ │
│  │ Engine  │ Manager  │ Engine   │ Panel   │ │
│  │ (Worker)│          │ (API)    │         │ │
│  └─────────┴──────────┴──────────┴─────────┘ │
│                     │                         │
│  ┌──────────────────▼───────────────────────┐│
│  │         Supabase (Primary EU-West)        ││
│  │         + Read Replica (EU-Central)       ││
│  └───────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
*/

export default { MODULE_MANIFEST, loadModule, preloadModules, listModules, getModuleStats };
