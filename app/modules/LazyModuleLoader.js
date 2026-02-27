"use client";
// ═══════════════════════════════════════════════════════════
// Item #36 — ARCHITECTURE MICROSERVICES
// Lazy Module Loader — Code splitting for the 32K line monolith
// Loads modules on-demand instead of all at once
// ═══════════════════════════════════════════════════════════
import React, { Suspense, lazy, useState, useEffect, useCallback } from 'react';

// ═══ SKELETON FALLBACK ═══
function ModuleLoader({ name }) {
  return React.createElement('div', {
    style: { padding: '40px', textAlign: 'center' }
  },
    React.createElement('div', {
      style: {
        width: '100%', maxWidth: 600, margin: '0 auto',
        display: 'flex', flexDirection: 'column', gap: '12px'
      }
    },
      React.createElement('div', { className: 'skeleton', style: { height: 24, width: '40%', borderRadius: 6 } }),
      React.createElement('div', { className: 'skeleton', style: { height: 120, borderRadius: 16 } }),
      React.createElement('div', { className: 'skeleton', style: { height: 16, width: '80%', borderRadius: 4 } }),
      React.createElement('div', { className: 'skeleton', style: { height: 16, width: '60%', borderRadius: 4 } }),
      React.createElement('div', {
        style: { marginTop: 16, fontSize: 12, color: '#555' }
      }, `Chargement ${name || 'du module'}...`)
    )
  );
}

// ═══ LAZY MODULE REGISTRY ═══
// Each module is loaded only when navigated to
const MODULE_MAP = {
  // ── Employee Hub ──
  'dashboard-rh':      () => import('./EmployeeHub').then(m => m.DashboardRHV2),
  'registre':          () => import('./EmployeeHub').then(m => m.RegistrePersonnelV2),
  'portail-employe':   () => import('./EmployeeHub').then(m => m.PortailEmployeV2),
  'interimaires':      () => import('./EmployeeHub').then(m => m.GestionInterimairesV2),
  
  // ── Payroll Hub ──
  'validation-paie':   () => import('./PayrollHub').then(m => m.ValidationPrePaieV2),
  'timeline-paie':     () => import('./PayrollHub').then(m => m.TimelinePaieV2),
  'solde-tout-compte': () => import('./PayrollHub').then(m => m.SoldeToutCompteV2),
  'couts-annuels':     () => import('./PayrollHub').then(m => m.CoutsAnnuelsV2),
  'simu-licenciement': () => import('./PayrollHub').then(m => m.SimuLicenciementV2),
  'simu-pension':      () => import('./PayrollHub').then(m => m.SimuPensionV2),
  'simu-temps-partiel':() => import('./PayrollHub').then(m => m.SimuTempsPartielV2),
  
  // ── Primes & Avantages ──
  'primes':            () => import('./PrimesAvantagesV2').then(m => m.PrimeCalculatorV2),
  'opti-fiscale':      () => import('./PrimesAvantagesV2').then(m => m.OptiFiscaleV2),
  'vehicules-atn':     () => import('./PrimesAvantagesV2').then(m => m.VehiculesATNV2),
  'flexi-jobs':        () => import('./PrimesAvantagesV2').then(m => m.FlexiJobsV2),
  'treizieme-mois':    () => import('./PrimesAvantagesV2').then(m => m.TreiziemeMoisV2),
  'eco-cheques':       () => import('./PrimesAvantagesV2').then(m => m.EcoChequesV2),
  'cafeteria':         () => import('./PrimesAvantagesV2').then(m => m.PlanCafeteriaV2),
  'cct90-bonus':       () => import('./PrimesAvantagesV2').then(m => m.CCT90BonusV2),
  'notes-frais':       () => import('./PrimesAvantagesV2').then(m => m.NoteFraisV2),
  'cheq-repas':        () => import('./PrimesAvantagesV2').then(m => m.CheqRepasV2),
  
  // ── Declarations ──
  'charges-onss':      () => import('./DeclarationsFiscalV2').then(m => m.ChargesONSSV2),
  'chomage-temp':      () => import('./DeclarationsFiscalV2').then(m => m.ChomageTemporaireV2),
  'export-compta':     () => import('./DeclarationsFiscalV2').then(m => m.ExportComptaProV2),
  'budget-previsionnel': () => import('./DeclarationsFiscalV2').then(m => m.BudgetPrevisionnelV2),
  
  // ── Absences & Contrats ──
  'conges':            () => import('./AbsencesContratsV3').then(m => m.PlanningCongesV3),
  'bilan-social':      () => import('./AbsencesContratsV3').then(m => m.BilanSocialV3),
  'analytics':         () => import('./AbsencesContratsV3').then(m => m.AnalyticsV3),
  'import-csv':        () => import('./AbsencesContratsV3').then(m => m.ImportCSVV3),
  'contrats':          () => import('./AbsencesContratsV3').then(m => m.ContratsLegauxV3),
  
  // ── Admin ──
  'rbac':              () => import('./AutoAdminV3').then(m => m.RBACAdminV2),
  'pointage':          () => import('./AutoAdminV3').then(m => m.PointageV2),
  'evaluations':       () => import('./AutoAdminV3').then(m => m.EvaluationsV2),
  'formations':        () => import('./AutoAdminV3').then(m => m.FormationsV2),
  'hub-fiduciaire':    () => import('./AutoAdminV3').then(m => m.HubFiduciaireV2),
  'security':          () => import('./SecurityDashboard').then(m => m.SecurityDashboard),
  
  // ── New v20.3 modules ──
  'dashboard-charts':  () => import('./DashboardCharts').then(m => m.DashboardChartsV2),
  'simulateur-net':    () => import('./SimulateurNetBrut').then(m => m.default),
  'calendrier-social': () => import('./CalendrierSocial').then(m => m.default),
  'comparaison':       () => import('./ComparaisonPeriodes').then(m => m.default),
  'attestations':      () => import('./AttestationsLegales').then(m => m.default),
  'formation-suivi':   () => import('./FormationSuivi').then(m => m.default),
  'dpo-dashboard':     () => import('./DPODashboard').then(m => m.default),
  
  // ── Barèmes ──
  'baremes-cp':        () => import('./BaremesCP').then(m => m.BaremesCPV2),
  
  // ── Legal Agent ──
  'legal-agent':       () => import('./FloatingLegalAgent').then(m => m.default),

  // ── Marketplace connectors ──
  'marketplace':       () => import('./MarketplaceConnectors').then(m => m.default),
};

// ═══ LAZY COMPONENT WRAPPER ═══
const moduleCache = new Map();

export function LazyModule({ moduleId, fallbackName, ...props }) {
  const [Component, setComponent] = useState(() => moduleCache.get(moduleId) || null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (Component) return;
    const loader = MODULE_MAP[moduleId];
    if (!loader) {
      setError(`Module "${moduleId}" non trouvé`);
      return;
    }
    loader()
      .then(Comp => {
        moduleCache.set(moduleId, Comp);
        setComponent(() => Comp);
      })
      .catch(err => {
        console.error(`[LazyModule] Failed to load ${moduleId}:`, err);
        setError(err.message);
      });
  }, [moduleId, Component]);

  if (error) {
    return React.createElement('div', { className: 'error-boundary' },
      React.createElement('div', { className: 'error-boundary-icon' }, '⚠️'),
      React.createElement('div', { className: 'error-boundary-title' }, 'Module non disponible'),
      React.createElement('div', { className: 'error-boundary-msg' }, error)
    );
  }

  if (!Component) {
    return React.createElement(ModuleLoader, { name: fallbackName || moduleId });
  }

  return React.createElement(Component, props);
}

// ═══ PRELOAD HINT ═══
// Call this on hover/focus to preload a module before navigation
export function preloadModule(moduleId) {
  if (moduleCache.has(moduleId)) return;
  const loader = MODULE_MAP[moduleId];
  if (loader) loader().then(Comp => moduleCache.set(moduleId, Comp)).catch(() => {});
}

// ═══ MODULE INVENTORY ═══
export function getModuleList() {
  return Object.keys(MODULE_MAP).map(id => ({
    id,
    loaded: moduleCache.has(id),
  }));
}

export function getLoadedCount() {
  return moduleCache.size;
}

export function getTotalCount() {
  return Object.keys(MODULE_MAP).length;
}

export default { LazyModule, preloadModule, getModuleList, MODULE_MAP };
