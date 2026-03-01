'use client'

// ═══════════════════════════════════════════════════════
//  AUREUS SOCIAL PRO — Module: Export Système de Fichiers
//  File System Access API — sauvegarde vers USB/dossier
//  Fallback: téléchargement classique si API non supportée
// ═══════════════════════════════════════════════════════

import { useState, useCallback } from 'react'

const GOLD = '#c6a34e'
const DARK = '#0d1117'
const BORDER = '#1e2633'
const TEXT = '#e0e0e0'
const MUTED = '#8b95a5'

// ── Vérifier le support de l'API File System Access ──
function isFileSystemAccessSupported() {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

// ── Sauvegarder un fichier via File System Access ──
async function saveToDirectory(dirHandle, filename, content, type) {
  const fileHandle = await dirHandle.getFileHandle(filename, { create: true })
  const writable = await fileHandle.createWritable()
  const blob = typeof content === 'string'
    ? new Blob([content], { type: type || 'text/plain' })
    : content
  await writable.write(blob)
  await writable.close()
  return fileHandle
}

// ── Fallback: téléchargement classique ──
function downloadFile(filename, content, mimeType) {
  const blob = typeof content === 'string'
    ? new Blob([content], { type: mimeType || 'text/plain' })
    : content
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Hook: useFileSystemExport ──
export function useFileSystemExport() {
  const [dirHandle, setDirHandle] = useState(null)
  const [dirName, setDirName] = useState(null)
  const [saving, setSaving] = useState(false)
  const [lastSave, setLastSave] = useState(null)
  const supported = isFileSystemAccessSupported()

  const selectDirectory = useCallback(async () => {
    if (!supported) return null
    try {
      const handle = await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents',
      })
      setDirHandle(handle)
      setDirName(handle.name)
      return handle
    } catch (e) {
      if (e.name !== 'AbortError') console.warn('Erreur sélection dossier:', e)
      return null
    }
  }, [supported])

  const saveFile = useCallback(async (filename, content, mimeType) => {
    setSaving(true)
    try {
      if (dirHandle) {
        await saveToDirectory(dirHandle, filename, content, mimeType)
        setLastSave({ filename, time: new Date(), method: 'filesystem' })
      } else {
        downloadFile(filename, content, mimeType)
        setLastSave({ filename, time: new Date(), method: 'download' })
      }
    } catch (e) {
      // Si permission refusée, fallback au téléchargement
      if (e.name === 'NotAllowedError') {
        setDirHandle(null)
        setDirName(null)
        downloadFile(filename, content, mimeType)
        setLastSave({ filename, time: new Date(), method: 'download-fallback' })
      } else {
        throw e
      }
    } finally {
      setSaving(false)
    }
  }, [dirHandle])

  const saveMultiple = useCallback(async (files) => {
    setSaving(true)
    const results = []
    try {
      for (const { filename, content, mimeType } of files) {
        if (dirHandle) {
          await saveToDirectory(dirHandle, filename, content, mimeType)
          results.push({ filename, method: 'filesystem' })
        } else {
          downloadFile(filename, content, mimeType)
          results.push({ filename, method: 'download' })
        }
      }
      setLastSave({ count: files.length, time: new Date(), method: dirHandle ? 'filesystem' : 'download' })
    } finally {
      setSaving(false)
    }
    return results
  }, [dirHandle])

  return { supported, dirHandle, dirName, saving, lastSave, selectDirectory, saveFile, saveMultiple }
}

// ── Composant: Sélecteur de dossier USB ──
export function DirectorySelector({ onSelect }) {
  const { supported, dirName, selectDirectory } = useFileSystemExport()

  if (!supported) {
    return (
      <div style={{ padding: 12, background: DARK, borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 13, color: MUTED }}>
        Votre navigateur ne supporte pas la sauvegarde directe vers un dossier.
        Les fichiers seront téléchargés normalement.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: DARK, borderRadius: 8, border: `1px solid ${BORDER}` }}>
      <button
        onClick={async () => {
          const handle = await selectDirectory()
          if (handle && onSelect) onSelect(handle)
        }}
        style={{
          padding: '8px 16px', background: dirName ? '#22c55e22' : `${GOLD}22`,
          border: `1px solid ${dirName ? '#22c55e' : GOLD}`, borderRadius: 6,
          color: dirName ? '#22c55e' : GOLD, cursor: 'pointer', fontSize: 13, fontWeight: 600,
        }}
      >
        {dirName ? 'Changer de dossier' : 'Choisir un dossier / USB'}
      </button>
      {dirName && (
        <span style={{ fontSize: 13, color: '#22c55e' }}>
          {dirName}
        </span>
      )}
      {!dirName && (
        <span style={{ fontSize: 12, color: MUTED }}>
          Sélectionnez un dossier ou une clé USB pour y sauvegarder directement
        </span>
      )}
    </div>
  )
}

// ── Composant principal: Page d'export ──
export default function FileSystemExport({ state, dispatch }) {
  const { supported, dirHandle, dirName, saving, lastSave, selectDirectory, saveFile, saveMultiple } = useFileSystemExport()
  const [exportStatus, setExportStatus] = useState(null)

  const employees = state?.employees || []
  const company = state?.co || state?.company || {}

  const exportTypes = [
    {
      id: 'employees-csv',
      label: 'Employés (CSV)',
      icon: '👥',
      description: 'Liste complète des travailleurs',
      generate: () => {
        const headers = 'Nom,Prénom,NISS,Statut,Brut,Fonction,CP,Date entrée'
        const rows = employees.map(e =>
          [e.last, e.first, e.niss, e.statut, e.monthlySalary || e.gross || e.brut, e.fn || e.function, e.cp, e.startD || e.startDate].join(',')
        )
        return { content: [headers, ...rows].join('\n'), filename: `employes_${fmtDate()}.csv`, type: 'text/csv' }
      },
    },
    {
      id: 'payroll-csv',
      label: 'Paie du mois (CSV)',
      icon: '💰',
      description: 'Résultats de paie du mois en cours',
      generate: () => {
        const headers = 'Nom,Prénom,Brut,ONSS,PP,Net,Coût employeur'
        const rows = employees.map(e => {
          const p = e._lastCalc || {}
          return [e.last, e.first, p.gross || e.monthlySalary || '', p.onss || '', p.pp || '', p.net || '', p.employerCost || ''].join(',')
        })
        return { content: [headers, ...rows].join('\n'), filename: `paie_${fmtDate()}.csv`, type: 'text/csv' }
      },
    },
    {
      id: 'company-json',
      label: 'Données société (JSON)',
      icon: '🏢',
      description: 'Configuration complète de la société',
      generate: () => {
        const safeCompany = { ...company }
        // Ne pas exporter les données sensibles en clair
        if (safeCompany.iban) safeCompany.iban = safeCompany.iban.slice(0, 8) + '****'
        return { content: JSON.stringify(safeCompany, null, 2), filename: `societe_${fmtDate()}.json`, type: 'application/json' }
      },
    },
    {
      id: 'backup-json',
      label: 'Backup complet (JSON)',
      icon: '💾',
      description: 'Sauvegarde complète du dossier',
      generate: () => {
        const backup = {
          version: '2026.4',
          exportDate: new Date().toISOString(),
          company: { ...company },
          employees: employees.map(e => {
            const safe = { ...e }
            // Masquer partiellement les NISS dans le backup
            if (safe.niss) safe.niss = safe.niss.slice(0, 6) + '****' + safe.niss.slice(-2)
            return safe
          }),
        }
        return { content: JSON.stringify(backup, null, 2), filename: `backup_aureus_${fmtDate()}.json`, type: 'application/json' }
      },
    },
  ]

  async function handleExport(exportType) {
    try {
      setExportStatus({ id: exportType.id, status: 'generating' })
      const { content, filename, type } = exportType.generate()
      await saveFile(filename, content, type)
      setExportStatus({ id: exportType.id, status: 'success', filename })
      setTimeout(() => setExportStatus(null), 3000)
    } catch (e) {
      setExportStatus({ id: exportType.id, status: 'error', message: e.message })
    }
  }

  async function handleExportAll() {
    try {
      setExportStatus({ id: 'all', status: 'generating' })
      const files = exportTypes.map(et => {
        const { content, filename, type } = et.generate()
        return { filename, content, mimeType: type }
      })
      await saveMultiple(files)
      setExportStatus({ id: 'all', status: 'success', count: files.length })
      setTimeout(() => setExportStatus(null), 3000)
    } catch (e) {
      setExportStatus({ id: 'all', status: 'error', message: e.message })
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: GOLD, margin: '0 0 4px 0', fontSize: 20 }}>Export & Sauvegarde</h2>
      <p style={{ color: MUTED, margin: '0 0 24px 0', fontSize: 13 }}>
        Exportez vos données vers une clé USB, un dossier local, ou téléchargez-les
      </p>

      {/* Sélecteur de dossier */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: DARK, borderRadius: 8, border: `1px solid ${BORDER}` }}>
          {supported ? (
            <>
              <button
                onClick={selectDirectory}
                style={{
                  padding: '10px 20px', background: dirName ? '#22c55e22' : `${GOLD}22`,
                  border: `1px solid ${dirName ? '#22c55e' : GOLD}`, borderRadius: 6,
                  color: dirName ? '#22c55e' : GOLD, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                }}
              >
                {dirName ? `📁 ${dirName}` : '📁 Choisir un dossier / USB'}
              </button>
              {!dirName && <span style={{ fontSize: 12, color: MUTED }}>Les fichiers seront sauvegardés directement dans le dossier choisi</span>}
              {dirName && <span style={{ fontSize: 12, color: '#22c55e' }}>Les exports iront dans ce dossier</span>}
            </>
          ) : (
            <span style={{ fontSize: 13, color: MUTED }}>
              💡 Utilisez Chrome ou Edge pour sauvegarder directement vers une clé USB. En attendant, les fichiers seront téléchargés.
            </span>
          )}
        </div>
      </div>

      {/* Boutons d'export */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginBottom: 24 }}>
        {exportTypes.map(et => (
          <button
            key={et.id}
            onClick={() => handleExport(et)}
            disabled={saving}
            style={{
              padding: 16, background: DARK, border: `1px solid ${BORDER}`, borderRadius: 8,
              cursor: saving ? 'wait' : 'pointer', textAlign: 'left', transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = GOLD}
            onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>{et.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 4 }}>{et.label}</div>
            <div style={{ fontSize: 12, color: MUTED }}>{et.description}</div>
            {exportStatus?.id === et.id && (
              <div style={{ marginTop: 8, fontSize: 12, color: exportStatus.status === 'success' ? '#22c55e' : exportStatus.status === 'error' ? '#ef4444' : GOLD }}>
                {exportStatus.status === 'success' ? `Exporté : ${exportStatus.filename}` : exportStatus.status === 'error' ? exportStatus.message : 'Génération...'}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Tout exporter */}
      <button
        onClick={handleExportAll}
        disabled={saving}
        style={{
          width: '100%', padding: '14px 24px', background: `${GOLD}22`, border: `1px solid ${GOLD}`,
          borderRadius: 8, color: GOLD, fontSize: 15, fontWeight: 600, cursor: saving ? 'wait' : 'pointer',
        }}
      >
        {saving ? 'Export en cours...' : `📦 Tout exporter${dirName ? ` vers ${dirName}` : ''}`}
      </button>

      {exportStatus?.id === 'all' && exportStatus.status === 'success' && (
        <div style={{ marginTop: 12, padding: 12, background: '#22c55e22', border: '1px solid #22c55e', borderRadius: 8, fontSize: 13, color: '#22c55e', textAlign: 'center' }}>
          {exportStatus.count} fichiers exportés avec succès
        </div>
      )}

      {/* Dernière sauvegarde */}
      {lastSave && (
        <div style={{ marginTop: 16, fontSize: 12, color: MUTED, textAlign: 'center' }}>
          Dernière sauvegarde : {lastSave.filename || `${lastSave.count} fichiers`} — {lastSave.time.toLocaleTimeString('fr-BE')}
          {lastSave.method === 'filesystem' && ' (dossier local)'}
          {lastSave.method === 'download' && ' (téléchargement)'}
        </div>
      )}
    </div>
  )
}

function fmtDate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
