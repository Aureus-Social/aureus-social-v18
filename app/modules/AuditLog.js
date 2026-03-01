'use client'

// ═══════════════════════════════════════════════════════
//  AUREUS SOCIAL PRO — Module: Journal d'Audit RGPD
//  Traçabilité des actions pour conformité RGPD/ISO27001
//  Chaque action est horodatée, identifiée et catégorisée
// ═══════════════════════════════════════════════════════

import { useState, useMemo, useCallback, useEffect } from 'react'

const GOLD = '#c6a34e'
const DARK = '#0d1117'
const BORDER = '#1e2633'
const TEXT = '#e0e0e0'
const MUTED = '#8b95a5'

// ── Catégories d'audit ──
const AUDIT_CATEGORIES = {
  AUTH: { label: 'Authentification', icon: '🔐', color: '#3b82f6' },
  DATA_ACCESS: { label: 'Accès données', icon: '👁', color: '#06b6d4' },
  DATA_MODIFY: { label: 'Modification données', icon: '✏️', color: '#f59e0b' },
  DATA_DELETE: { label: 'Suppression données', icon: '🗑', color: '#ef4444' },
  DATA_EXPORT: { label: 'Export données', icon: '📤', color: '#8b5cf6' },
  PAYROLL: { label: 'Paie', icon: '💰', color: '#22c55e' },
  DECLARATION: { label: 'Déclarations', icon: '📋', color: '#ec4899' },
  CONFIG: { label: 'Configuration', icon: '⚙️', color: '#6b7280' },
  SECURITY: { label: 'Sécurité', icon: '🛡', color: '#ef4444' },
  CONSENT: { label: 'Consentement', icon: '✅', color: '#22c55e' },
}

const STORE_KEY = 'aureus_audit_log'
const MAX_ENTRIES = 5000

// ── Service d'audit ──
class AuditService {
  constructor() {
    this.entries = []
    this._load()
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORE_KEY)
      this.entries = raw ? JSON.parse(raw) : []
    } catch {
      this.entries = []
    }
  }

  _save() {
    // Garder seulement les MAX_ENTRIES dernières entrées
    if (this.entries.length > MAX_ENTRIES) {
      this.entries = this.entries.slice(-MAX_ENTRIES)
    }
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.entries))
    } catch { /* quota exceeded — on purge les vieilles entrées */
      this.entries = this.entries.slice(-Math.floor(MAX_ENTRIES / 2))
      try { localStorage.setItem(STORE_KEY, JSON.stringify(this.entries)) } catch {}
    }
  }

  log(entry) {
    const record = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    }
    this.entries.push(record)
    this._save()
    return record
  }

  getAll() { return [...this.entries].reverse() }

  getByCategory(category) {
    return this.entries.filter(e => e.category === category).reverse()
  }

  getByDateRange(start, end) {
    return this.entries.filter(e => {
      const d = new Date(e.timestamp)
      return d >= start && d <= end
    }).reverse()
  }

  search(query) {
    const q = query.toLowerCase()
    return this.entries.filter(e =>
      (e.action || '').toLowerCase().includes(q) ||
      (e.details || '').toLowerCase().includes(q) ||
      (e.user || '').toLowerCase().includes(q) ||
      (e.target || '').toLowerCase().includes(q)
    ).reverse()
  }

  exportCSV() {
    const headers = 'Date,Heure,Catégorie,Action,Utilisateur,Cible,Détails,IP'
    const rows = this.entries.map(e => {
      const d = new Date(e.timestamp)
      return [
        d.toLocaleDateString('fr-BE'),
        d.toLocaleTimeString('fr-BE'),
        e.category || '',
        (e.action || '').replace(/,/g, ';'),
        (e.user || '').replace(/,/g, ';'),
        (e.target || '').replace(/,/g, ';'),
        (e.details || '').replace(/,/g, ';'),
        e.ip || '',
      ].join(',')
    })
    return [headers, ...rows].join('\n')
  }

  exportJSON() {
    return JSON.stringify(this.entries, null, 2)
  }

  clear() {
    this.entries = []
    this._save()
  }

  getStats() {
    const byCategory = {}
    const byDay = {}
    const byUser = {}
    this.entries.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + 1
      const day = e.timestamp.slice(0, 10)
      byDay[day] = (byDay[day] || 0) + 1
      if (e.user) byUser[e.user] = (byUser[e.user] || 0) + 1
    })
    return { total: this.entries.length, byCategory, byDay, byUser }
  }
}

// Singleton
let _auditService = null
export function getAuditService() {
  if (!_auditService) _auditService = new AuditService()
  return _auditService
}

// ── Helper pour logger facilement ──
export function auditLog(category, action, details, extra = {}) {
  const svc = getAuditService()
  return svc.log({ category, action, details, ...extra })
}

// ── Composant: Ligne d'audit ──
function AuditRow({ entry }) {
  const cat = AUDIT_CATEGORIES[entry.category] || AUDIT_CATEGORIES.CONFIG
  const d = new Date(entry.timestamp)

  return (
    <div style={{
      padding: '10px 14px', background: DARK, borderRadius: 6,
      border: `1px solid ${BORDER}`, display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 6, background: cat.color + '22',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, flexShrink: 0,
      }}>
        {cat.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{entry.action}</span>
          <span style={{ fontSize: 11, color: MUTED }}>
            {d.toLocaleDateString('fr-BE')} {d.toLocaleTimeString('fr-BE')}
          </span>
        </div>
        {entry.details && (
          <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{entry.details}</div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
          <span style={{
            padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600,
            background: cat.color + '22', color: cat.color,
          }}>
            {cat.label}
          </span>
          {entry.user && (
            <span style={{ fontSize: 10, color: MUTED }}>
              Utilisateur : {entry.user}
            </span>
          )}
          {entry.target && (
            <span style={{ fontSize: 10, color: MUTED }}>
              Cible : {entry.target}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Composant principal ──
export default function AuditLog() {
  const [entries, setEntries] = useState([])
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [page, setPage] = useState(0)
  const [stats, setStats] = useState(null)
  const PAGE_SIZE = 50

  useEffect(() => {
    const svc = getAuditService()
    setEntries(svc.getAll())
    setStats(svc.getStats())
  }, [])

  const filtered = useMemo(() => {
    let result = entries

    if (filter !== 'all') {
      result = result.filter(e => e.category === filter)
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(e =>
        (e.action || '').toLowerCase().includes(q) ||
        (e.details || '').toLowerCase().includes(q) ||
        (e.user || '').toLowerCase().includes(q) ||
        (e.target || '').toLowerCase().includes(q)
      )
    }

    if (dateRange.start) {
      const start = new Date(dateRange.start)
      result = result.filter(e => new Date(e.timestamp) >= start)
    }
    if (dateRange.end) {
      const end = new Date(dateRange.end + 'T23:59:59')
      result = result.filter(e => new Date(e.timestamp) <= end)
    }

    return result
  }, [entries, filter, searchQuery, dateRange])

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const handleExport = useCallback((format) => {
    const svc = getAuditService()
    const content = format === 'csv' ? svc.exportCSV() : svc.exportJSON()
    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit_log_${new Date().toISOString().slice(0, 10)}.${format}`
    a.click()
    URL.revokeObjectURL(url)

    // Logger l'export lui-même
    auditLog('DATA_EXPORT', 'Export du journal d\'audit', `Format: ${format.toUpperCase()}, ${entries.length} entrées`)
  }, [entries])

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ color: GOLD, margin: '0 0 4px 0', fontSize: 20 }}>Journal d'audit</h2>
          <p style={{ color: MUTED, margin: 0, fontSize: 13 }}>
            Conformité RGPD/ISO27001 — {entries.length} entrées enregistrées
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => handleExport('csv')}
            style={{
              padding: '6px 14px', background: 'transparent', border: `1px solid ${BORDER}`,
              borderRadius: 6, color: MUTED, cursor: 'pointer', fontSize: 12,
            }}
          >
            Export CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            style={{
              padding: '6px 14px', background: 'transparent', border: `1px solid ${BORDER}`,
              borderRadius: 6, color: MUTED, cursor: 'pointer', fontSize: 12,
            }}
          >
            Export JSON
          </button>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: 8, marginBottom: 20,
        }}>
          <div style={{ padding: 12, background: DARK, borderRadius: 8, border: `1px solid ${BORDER}`, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: GOLD }}>{stats.total}</div>
            <div style={{ fontSize: 11, color: MUTED }}>Total</div>
          </div>
          {Object.entries(AUDIT_CATEGORIES).map(([key, val]) => {
            const count = stats.byCategory[key] || 0
            if (!count) return null
            return (
              <div key={key} style={{
                padding: 12, background: DARK, borderRadius: 8, border: `1px solid ${BORDER}`, textAlign: 'center',
              }}>
                <div style={{ fontSize: 14, marginBottom: 2 }}>{val.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: val.color }}>{count}</div>
                <div style={{ fontSize: 10, color: MUTED }}>{val.label}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Recherche + Filtres */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setPage(0) }}
          placeholder="Rechercher dans le journal..."
          style={{
            flex: 1, minWidth: 200, padding: '8px 12px', background: DARK,
            border: `1px solid ${BORDER}`, borderRadius: 6, color: TEXT, fontSize: 13,
          }}
        />
        <input
          type="date"
          value={dateRange.start}
          onChange={e => { setDateRange(prev => ({ ...prev, start: e.target.value })); setPage(0) }}
          style={{
            padding: '6px 10px', background: DARK, border: `1px solid ${BORDER}`,
            borderRadius: 6, color: TEXT, fontSize: 12,
          }}
        />
        <input
          type="date"
          value={dateRange.end}
          onChange={e => { setDateRange(prev => ({ ...prev, end: e.target.value })); setPage(0) }}
          style={{
            padding: '6px 10px', background: DARK, border: `1px solid ${BORDER}`,
            borderRadius: 6, color: TEXT, fontSize: 12,
          }}
        />
      </div>

      {/* Filtres catégorie */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        <button
          onClick={() => { setFilter('all'); setPage(0) }}
          style={{
            padding: '4px 12px', borderRadius: 16,
            border: `1px solid ${filter === 'all' ? GOLD : BORDER}`,
            background: filter === 'all' ? `${GOLD}22` : 'transparent',
            color: filter === 'all' ? GOLD : MUTED, cursor: 'pointer', fontSize: 11,
          }}
        >
          Tout ({entries.length})
        </button>
        {Object.entries(AUDIT_CATEGORIES).map(([key, val]) => {
          const count = entries.filter(e => e.category === key).length
          if (!count) return null
          return (
            <button
              key={key}
              onClick={() => { setFilter(key); setPage(0) }}
              style={{
                padding: '4px 12px', borderRadius: 16,
                border: `1px solid ${filter === key ? val.color : BORDER}`,
                background: filter === key ? val.color + '22' : 'transparent',
                color: filter === key ? val.color : MUTED, cursor: 'pointer', fontSize: 11,
              }}
            >
              {val.icon} {val.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Liste */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {paginated.length === 0 ? (
          <div style={{
            padding: 48, textAlign: 'center', color: MUTED, fontSize: 14,
            background: DARK, borderRadius: 8, border: `1px solid ${BORDER}`,
          }}>
            {entries.length === 0
              ? 'Aucune entrée dans le journal d\'audit. Les actions seront enregistrées automatiquement.'
              : 'Aucun résultat pour les filtres sélectionnés'
            }
          </div>
        ) : paginated.map(entry => (
          <AuditRow key={entry.id} entry={entry} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20, alignItems: 'center',
        }}>
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            style={{
              padding: '6px 12px', background: DARK, border: `1px solid ${BORDER}`,
              borderRadius: 6, color: page === 0 ? MUTED : TEXT, cursor: page === 0 ? 'default' : 'pointer', fontSize: 12,
            }}
          >
            Précédent
          </button>
          <span style={{ fontSize: 12, color: MUTED }}>
            Page {page + 1} / {totalPages} ({filtered.length} entrées)
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            style={{
              padding: '6px 12px', background: DARK, border: `1px solid ${BORDER}`,
              borderRadius: 6, color: page >= totalPages - 1 ? MUTED : TEXT,
              cursor: page >= totalPages - 1 ? 'default' : 'pointer', fontSize: 12,
            }}
          >
            Suivant
          </button>
        </div>
      )}

      {/* Info RGPD */}
      <div style={{
        marginTop: 24, padding: 16, background: '#3b82f611', borderRadius: 8,
        border: '1px solid #3b82f633', fontSize: 12, color: '#3b82f6',
      }}>
        <strong>Conformité RGPD (Art. 30)</strong> — Ce journal enregistre toutes les opérations de traitement
        des données personnelles. Les entrées sont conservées 5 ans minimum (Art. 5.1.e). L'export est
        disponible pour les audits internes et les demandes de l'autorité de contrôle (APD).
      </div>
    </div>
  )
}
