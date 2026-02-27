// ═══════════════════════════════════════════════════════════
// AUREUS SOCIAL PRO — UX UTILITIES
// Toast, Command Palette, Debounce, Skeleton, Pagination,
// Theme, Onboarding, Changelog, Error Boundary
// ═══════════════════════════════════════════════════════════
"use client";
import React, { useState, useEffect, useCallback, useRef, createContext, useContext, Component } from 'react';

// ═══ #10 TOAST SYSTEM ═══
const ToastContext = createContext(null);
let _toastId = 0;
const ICONS = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((type, title, message, duration = 4000) => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, type, title, message, duration }]);
    if (duration > 0) setTimeout(() => removeToast(id), duration);
    return id;
  }, []);
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, removing: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
  }, []);
  const toast = useCallback({
    success: (title, msg, dur) => addToast('success', title, msg, dur),
    error: (title, msg, dur) => addToast('error', title, msg, dur || 6000),
    warning: (title, msg, dur) => addToast('warning', title, msg, dur),
    info: (title, msg, dur) => addToast('info', title, msg, dur),
  }, [addToast]);

  return React.createElement(ToastContext.Provider, { value: toast },
    children,
    React.createElement('div', { className: 'toast-stack', 'aria-live': 'polite' },
      toasts.map(t => React.createElement('div', {
        key: t.id, className: `toast ${t.type} ${t.removing ? 'out' : ''}`, role: 'alert'
      },
        React.createElement('span', { className: 'toast-icon' }, ICONS[t.type]),
        React.createElement('div', { className: 'toast-body' },
          React.createElement('div', { className: 'toast-title' }, t.title),
          t.message && React.createElement('div', { className: 'toast-msg' }, t.message)
        ),
        React.createElement('button', { className: 'toast-x', onClick: () => removeToast(t.id), 'aria-label': 'Fermer' }, '×'),
        t.duration > 0 && React.createElement('div', {
          className: 'toast-bar',
          style: { animation: `tOut ${t.duration}ms linear forwards`, width: '100%' }
        })
      ))
    )
  );
}
export const useToast = () => useContext(ToastContext);

// ═══ #12 DEBOUNCE ═══
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
export function debounce(fn, delay = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

// ═══ #11 UNDO/REDO ═══
export function useUndoRedo(initial) {
  const [history, setHistory] = useState([initial]);
  const [index, setIndex] = useState(0);
  const current = history[index];
  const set = useCallback((val) => {
    const next = typeof val === 'function' ? val(history[index]) : val;
    const newHistory = history.slice(0, index + 1);
    newHistory.push(next);
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setIndex(newHistory.length - 1);
  }, [history, index]);
  const undo = useCallback(() => { if (index > 0) setIndex(index - 1); }, [index]);
  const redo = useCallback(() => { if (index < history.length - 1) setIndex(index + 1); }, [index, history]);
  return { current, set, undo, redo, canUndo: index > 0, canRedo: index < history.length - 1 };
}

// ═══ #5 PAGINATION HOOK ═══
export function usePagination(items, perPage = 20) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil((items?.length || 0) / perPage);
  const paginated = (items || []).slice((page - 1) * perPage, page * perPage);
  const goTo = (p) => setPage(Math.max(1, Math.min(p, totalPages)));
  return { page, totalPages, paginated, goTo, setPage, hasNext: page < totalPages, hasPrev: page > 1, total: items?.length || 0 };
}

// Pagination Component
export function Pagination({ page, totalPages, goTo, total }) {
  if (totalPages <= 1) return null;
  const pages = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) pages.push(i);
  return React.createElement('div', { className: 'pagination', role: 'navigation', 'aria-label': 'Pagination' },
    React.createElement('button', { className: 'pg-btn', onClick: () => goTo(page - 1), disabled: page <= 1, 'aria-label': 'Précédent' }, '‹'),
    pages.map(p => React.createElement('button', { key: p, className: `pg-btn ${p === page ? 'active' : ''}`, onClick: () => goTo(p), 'aria-current': p === page ? 'page' : undefined }, p)),
    React.createElement('button', { className: 'pg-btn', onClick: () => goTo(page + 1), disabled: page >= totalPages, 'aria-label': 'Suivant' }, '›'),
    React.createElement('span', { className: 'pg-info' }, `${total} résultats`)
  );
}

// ═══ #2 SKELETON COMPONENTS ═══
export function SkeletonText({ width = '80%', lines = 1 }) {
  return React.createElement('div', null,
    Array.from({ length: lines }, (_, i) =>
      React.createElement('div', { key: i, className: `skeleton skeleton-text`, style: { width: i === lines - 1 ? '60%' : width } })
    )
  );
}
export function SkeletonCard({ height = 120 }) {
  return React.createElement('div', { className: 'skeleton skeleton-card', style: { height } });
}
export function SkeletonKPI({ count = 3 }) {
  return React.createElement('div', { className: 'skeleton-grid c3' },
    Array.from({ length: count }, (_, i) =>
      React.createElement('div', { key: i, className: 'skeleton skeleton-kpi' })
    )
  );
}
export function SkeletonTable({ rows = 5 }) {
  return React.createElement('div', null,
    Array.from({ length: rows }, (_, i) =>
      React.createElement('div', { key: i, className: 'skeleton skeleton-row', style: { animationDelay: `${i * 0.05}s` } })
    )
  );
}

// ═══ #3 THEME TOGGLE ═══
export function useTheme() {
  const [theme, setTheme] = useState('dark');
  useEffect(() => {
    const saved = localStorage.getItem('aureus-theme');
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);
  const toggle = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('aureus-theme', next);
  }, [theme]);
  return { theme, toggle };
}
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return React.createElement('button', {
    className: 'theme-toggle-app', onClick: toggle, 'aria-label': `Passer en mode ${theme === 'dark' ? 'clair' : 'sombre'}`, title: theme === 'dark' ? 'Mode clair' : 'Mode sombre'
  }, theme === 'dark' ? '☀️' : '🌙');
}

// ═══ #7 COMMAND PALETTE ═══
export function CommandPalette({ commands = [], isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (isOpen) { setQuery(''); setActive(0); setTimeout(() => inputRef.current?.focus(), 100); }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); onClose?.(!isOpen); }
      if (e.key === 'Escape' && isOpen) onClose?.(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const filtered = commands.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    (c.keywords || '').toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    if (e.key === 'Enter' && filtered[active]) { filtered[active].action?.(); onClose?.(false); }
  };

  if (!isOpen) return null;
  return React.createElement('div', { className: 'cmd-overlay open', onClick: (e) => { if (e.target === e.currentTarget) onClose?.(false); } },
    React.createElement('div', { className: 'cmd-box' },
      React.createElement('input', {
        ref: inputRef, className: 'cmd-input', placeholder: 'Rechercher une action...',
        value: query, onChange: e => { setQuery(e.target.value); setActive(0); }, onKeyDown: handleKeyDown,
        'aria-label': 'Rechercher', role: 'combobox'
      }),
      React.createElement('div', { className: 'cmd-results', role: 'listbox' },
        filtered.length === 0 ?
          React.createElement('div', { style: { padding: '20px', textAlign: 'center', color: '#555', fontSize: '13px' } }, 'Aucun résultat') :
          filtered.map((c, i) => React.createElement('div', {
            key: i, className: `cmd-item ${i === active ? 'active' : ''}`, onClick: () => { c.action?.(); onClose?.(false); },
            role: 'option', 'aria-selected': i === active
          },
            React.createElement('span', { className: 'icon' }, c.icon || '→'),
            React.createElement('span', { className: 'label' }, c.label),
            c.shortcut && React.createElement('span', { className: 'shortcut' }, c.shortcut)
          ))
      )
    )
  );
}

// ═══ #8 ONBOARDING WIZARD ═══
const ONBOARDING_STEPS = [
  { icon: '👋', title: 'Bienvenue sur Aureus Social Pro', desc: 'Votre nouveau secrétariat social intelligent. Suivez ces étapes pour démarrer.' },
  { icon: '🏢', title: 'Créez votre entreprise', desc: 'Renseignez le nom, le numéro BCE, et la commission paritaire de votre première entreprise.' },
  { icon: '👤', title: 'Ajoutez un travailleur', desc: 'Encodez les données d\'identité, contrat, et situation familiale de votre premier travailleur.' },
  { icon: '🧮', title: 'Calculez votre première paie', desc: 'Le moteur calcule automatiquement : ONSS, précompte professionnel, bonus emploi, net à payer.' },
  { icon: '📋', title: 'Générez une déclaration', desc: 'DmfA XML, DIMONA, ou Belcotax 281.10 — en un clic, conforme ONSS et SPF.' },
];

export function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(0);
  const s = ONBOARDING_STEPS[step];
  return React.createElement('div', { className: 'onboard-overlay' },
    React.createElement('div', { className: 'onboard-card' },
      React.createElement('div', { className: 'onboard-dots' },
        ONBOARDING_STEPS.map((_, i) => React.createElement('div', { key: i, className: `onboard-dot ${i === step ? 'active' : i < step ? 'done' : ''}` }))
      ),
      React.createElement('div', { className: 'onboard-icon' }, s.icon),
      React.createElement('div', { className: 'onboard-title' }, s.title),
      React.createElement('div', { className: 'onboard-desc' }, s.desc),
      React.createElement('div', { className: 'onboard-actions' },
        step > 0 && React.createElement('button', {
          style: { padding: '12px 24px', borderRadius: 10, border: '1px solid rgba(198,163,78,.2)', background: 'transparent', color: '#c6a34e', cursor: 'pointer', fontSize: 13 },
          onClick: () => setStep(step - 1)
        }, '← Précédent'),
        React.createElement('button', {
          style: { padding: '12px 32px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#c6a34e,#8b6914)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 },
          onClick: () => step < ONBOARDING_STEPS.length - 1 ? setStep(step + 1) : onComplete?.()
        }, step < ONBOARDING_STEPS.length - 1 ? 'Suivant →' : 'Commencer !')
      )
    )
  );
}

// ═══ #40 ERROR BOUNDARY ═══
export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
    // Log to Supabase if available
    try {
      if (typeof window !== 'undefined' && window._supabaseRef) {
        window._supabaseRef.from('error_log').insert({
          error_message: error.message, stack: error.stack?.substring(0, 2000),
          component: info?.componentStack?.substring(0, 500), timestamp: new Date().toISOString()
        }).then(() => {});
      }
    } catch (e) {}
  }
  render() {
    if (this.state.hasError) {
      return React.createElement('div', { className: 'error-boundary' },
        React.createElement('div', { className: 'error-boundary-icon' }, '⚠️'),
        React.createElement('div', { className: 'error-boundary-title' }, 'Une erreur est survenue'),
        React.createElement('div', { className: 'error-boundary-msg' }, this.state.error?.message || 'Erreur inattendue. Veuillez rafraîchir la page.'),
        React.createElement('button', {
          className: 'error-boundary-btn',
          onClick: () => { this.setState({ hasError: false, error: null }); window.location.reload(); }
        }, 'Rafraîchir la page')
      );
    }
    return this.props.children;
  }
}

// ═══ #30 CHANGELOG ═══
const CHANGELOG = [
  { type: 'new', text: 'Calculateur ROI interactif sur la landing page' },
  { type: 'new', text: 'Timeline migration 7 jours avec 4 étapes' },
  { type: 'new', text: '4 articles blog : erreurs paie, comparatif, PP 2026, migration' },
  { type: 'new', text: 'Live ticker temps réel (fiches, entreprises, déclarations)' },
  { type: 'imp', text: 'CSS Responsive complet mobile/tablet/desktop' },
  { type: 'imp', text: 'Skeleton loading sur tous les chargements' },
  { type: 'imp', text: 'Système de pagination pour les tables' },
  { type: 'imp', text: 'Accessibilité WCAG (aria, focus, skip-link)' },
  { type: 'fix', text: 'Correction calcul PP bonus emploi volet B' },
  { type: 'fix', text: 'Fix DmfA XML balise réduction structurelle' },
];

export function ChangelogModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return React.createElement('div', { className: 'changelog-overlay', onClick: (e) => e.target === e.currentTarget && onClose?.() },
    React.createElement('div', { className: 'changelog-panel' },
      React.createElement('div', { className: 'changelog-head' },
        React.createElement('h3', null, '🎉 Nouveautés v20.2'),
        React.createElement('p', { style: { fontSize: 12, color: '#666' } }, 'Février 2026')
      ),
      React.createElement('div', { className: 'changelog-body' },
        CHANGELOG.map((item, i) => React.createElement('div', { key: i, className: 'changelog-item' },
          React.createElement('span', { className: `changelog-tag ${item.type}` },
            item.type === 'new' ? 'Nouveau' : item.type === 'fix' ? 'Fix' : 'Amélioré'),
          React.createElement('span', { style: { fontSize: 13, color: '#999', lineHeight: 1.5 } }, item.text)
        ))
      ),
      React.createElement('div', { style: { padding: '16px 28px', borderTop: '1px solid rgba(198,163,78,.06)', textAlign: 'center' } },
        React.createElement('button', {
          style: { padding: '10px 28px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#c6a34e,#8b6914)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 },
          onClick: onClose
        }, 'Compris !')
      )
    )
  );
}

// ═══ #32 CACHE UTILITY ═══
const _cache = new Map();
export function memoize(key, fn, ttl = 300000) {
  const cached = _cache.get(key);
  if (cached && Date.now() - cached.time < ttl) return cached.value;
  const value = fn();
  _cache.set(key, { value, time: Date.now() });
  if (_cache.size > 200) {
    const first = _cache.keys().next().value;
    _cache.delete(first);
  }
  return value;
}
export function clearCache(prefix) {
  if (!prefix) { _cache.clear(); return; }
  for (const k of _cache.keys()) { if (k.startsWith(prefix)) _cache.delete(k); }
}
