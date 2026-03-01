// ═══════════════════════════════════════════════════════
//  AUREUS SOCIAL PRO — API /api/v1/batch
//  Opérations batch: paie en masse, mises à jour groupées
//  Supporte: calculateAll, updateAll, exportAll, dimonaAll
// ═══════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

function cors() {
  return {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors() })
}

// ── Authentification ──
async function authenticateRequest(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Token manquant', status: 401 }
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return { error: 'Supabase non configuré', status: 500 }
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

  if (error || !user) {
    return { error: 'Token invalide', status: 401 }
  }

  return { user, supabase }
}

// GET — Info sur les opérations batch disponibles
export async function GET() {
  return Response.json({
    service: 'Aureus Social Pro — API Batch v1',
    operations: {
      calculateAll: {
        method: 'POST',
        description: 'Calculer la paie de tous les employés actifs',
        body: '{ "action": "calculateAll", "month": 3, "year": 2026 }',
      },
      indexAll: {
        method: 'POST',
        description: 'Appliquer l\'indexation salariale à tous les employés',
        body: '{ "action": "indexAll", "indexRate": 2.0, "effectiveDate": "2026-01-01" }',
      },
      dimonaAll: {
        method: 'POST',
        description: 'Générer toutes les déclarations Dimona manquantes',
        body: '{ "action": "dimonaAll" }',
      },
      exportAll: {
        method: 'POST',
        description: 'Export complet (employés + paie + déclarations)',
        body: '{ "action": "exportAll", "format": "json|csv" }',
      },
      validateAll: {
        method: 'POST',
        description: 'Valider toutes les données employés (NISS, IBAN, etc.)',
        body: '{ "action": "validateAll" }',
      },
    },
    authentication: 'Bearer token Supabase requis',
  }, { headers: cors() })
}

// POST — Exécuter une opération batch
export async function POST(request) {
  try {
    const auth = await authenticateRequest(request)
    if (auth.error) {
      return Response.json({ success: false, error: auth.error }, { status: auth.status, headers: cors() })
    }

    const body = await request.json()
    const { action } = body

    if (!action) {
      return Response.json({
        success: false,
        error: 'MISSING_ACTION',
        message: 'Le champ "action" est requis',
        validActions: ['calculateAll', 'indexAll', 'dimonaAll', 'exportAll', 'validateAll'],
      }, { status: 400, headers: cors() })
    }

    // Audit log
    console.log('[BATCH]', JSON.stringify({
      timestamp: new Date().toISOString(),
      action,
      userId: auth.user.id,
      email: auth.user.email,
    }))

    switch (action) {
      case 'calculateAll':
        return handleCalculateAll(body, auth)
      case 'indexAll':
        return handleIndexAll(body, auth)
      case 'dimonaAll':
        return handleDimonaAll(body, auth)
      case 'exportAll':
        return handleExportAll(body, auth)
      case 'validateAll':
        return handleValidateAll(body, auth)
      default:
        return Response.json({
          success: false,
          error: 'UNKNOWN_ACTION',
          message: `Action "${action}" non reconnue`,
          validActions: ['calculateAll', 'indexAll', 'dimonaAll', 'exportAll', 'validateAll'],
        }, { status: 400, headers: cors() })
    }
  } catch (err) {
    console.error('[BATCH-ERROR]', err)
    return Response.json({
      success: false,
      error: err.message,
      timestamp: new Date().toISOString(),
    }, { status: 500, headers: cors() })
  }
}

// ── calculateAll: Calcul paie en masse ──
async function handleCalculateAll(body, auth) {
  const { month, year } = body
  const currentDate = new Date()
  const calcMonth = month || (currentDate.getMonth() + 1)
  const calcYear = year || currentDate.getFullYear()

  // Récupérer les employés actifs
  const { data: employees, error } = await auth.supabase
    .from('employees')
    .select('*')
    .is('end_date', null)

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500, headers: cors() })
  }

  const results = []
  const errors = []

  for (const emp of (employees || [])) {
    try {
      const gross = emp.monthly_salary || emp.gross || 0
      // Calculs simplifiés — le vrai calcul se fait côté client via calc-paie.js
      const onssWorker = Math.round(gross * 0.1307 * 100) / 100
      const taxableBase = gross - onssWorker
      const pp = Math.round(taxableBase * 0.2536 * 100) / 100 // estimation barème moyen
      const net = Math.round((taxableBase - pp) * 100) / 100
      const onssEmployer = Math.round(gross * 0.2738 * 100) / 100
      const employerCost = Math.round((gross + onssEmployer) * 100) / 100

      results.push({
        employeeId: emp.id,
        name: `${emp.first_name || ''} ${emp.last_name || ''}`,
        gross,
        onssWorker,
        pp,
        net,
        onssEmployer,
        employerCost,
        period: `${calcMonth}/${calcYear}`,
      })
    } catch (e) {
      errors.push({ employeeId: emp.id, error: e.message })
    }
  }

  const totalNet = results.reduce((s, r) => s + r.net, 0)
  const totalCost = results.reduce((s, r) => s + r.employerCost, 0)

  return Response.json({
    success: true,
    action: 'calculateAll',
    period: `${calcMonth}/${calcYear}`,
    summary: {
      employeesProcessed: results.length,
      errors: errors.length,
      totalNet: Math.round(totalNet * 100) / 100,
      totalEmployerCost: Math.round(totalCost * 100) / 100,
    },
    results,
    errors: errors.length > 0 ? errors : undefined,
    note: 'Calcul indicatif. Pour un calcul précis, utiliser le moteur de paie complet (calc-paie.js)',
  }, { status: 200, headers: cors() })
}

// ── indexAll: Indexation en masse ──
async function handleIndexAll(body, auth) {
  const { indexRate, effectiveDate } = body

  if (!indexRate) {
    return Response.json({
      success: false,
      error: 'MISSING_INDEX_RATE',
      message: 'Le taux d\'indexation (indexRate) est requis (ex: 2.0 pour +2%)',
    }, { status: 400, headers: cors() })
  }

  const { data: employees, error } = await auth.supabase
    .from('employees')
    .select('id, first_name, last_name, monthly_salary')
    .is('end_date', null)

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500, headers: cors() })
  }

  const multiplier = 1 + (indexRate / 100)
  const updates = (employees || []).map(emp => ({
    id: emp.id,
    name: `${emp.first_name || ''} ${emp.last_name || ''}`,
    oldSalary: emp.monthly_salary,
    newSalary: Math.round((emp.monthly_salary || 0) * multiplier * 100) / 100,
    increase: Math.round(((emp.monthly_salary || 0) * multiplier - (emp.monthly_salary || 0)) * 100) / 100,
  }))

  // Note: on ne sauvegarde pas automatiquement — l'utilisateur doit confirmer
  return Response.json({
    success: true,
    action: 'indexAll',
    indexRate: `${indexRate}%`,
    effectiveDate: effectiveDate || 'À confirmer',
    preview: true,
    message: 'Aperçu de l\'indexation. Confirmez pour appliquer.',
    summary: {
      employeesAffected: updates.length,
      totalOldMass: Math.round(updates.reduce((s, u) => s + (u.oldSalary || 0), 0) * 100) / 100,
      totalNewMass: Math.round(updates.reduce((s, u) => s + u.newSalary, 0) * 100) / 100,
      totalIncrease: Math.round(updates.reduce((s, u) => s + u.increase, 0) * 100) / 100,
    },
    updates,
  }, { status: 200, headers: cors() })
}

// ── dimonaAll: Vérification Dimona ──
async function handleDimonaAll(body, auth) {
  const { data: employees, error } = await auth.supabase
    .from('employees')
    .select('*')
    .is('end_date', null)

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500, headers: cors() })
  }

  const missingDimonaIn = []
  const missingDimonaOut = []

  for (const emp of (employees || [])) {
    if (!emp.dimona_in && !emp.dimona_in_date) {
      missingDimonaIn.push({
        employeeId: emp.id,
        name: `${emp.first_name || ''} ${emp.last_name || ''}`,
        niss: emp.niss ? `${emp.niss.slice(0, 6)}****` : 'N/A',
        startDate: emp.start_date,
        workerType: emp.statut === 'ouvrier' ? 'OTH' : 'BCW',
      })
    }
  }

  // Employés sortis sans Dimona OUT
  const { data: exitedEmps } = await auth.supabase
    .from('employees')
    .select('*')
    .not('end_date', 'is', null)

  for (const emp of (exitedEmps || [])) {
    if (!emp.dimona_out && !emp.dimona_out_date) {
      missingDimonaOut.push({
        employeeId: emp.id,
        name: `${emp.first_name || ''} ${emp.last_name || ''}`,
        endDate: emp.end_date,
      })
    }
  }

  return Response.json({
    success: true,
    action: 'dimonaAll',
    summary: {
      missingIn: missingDimonaIn.length,
      missingOut: missingDimonaOut.length,
      total: missingDimonaIn.length + missingDimonaOut.length,
    },
    missingDimonaIn,
    missingDimonaOut,
    note: 'La déclaration Dimona doit être faite AVANT l\'entrée en service (IN) ou le jour de la sortie (OUT)',
  }, { status: 200, headers: cors() })
}

// ── exportAll: Export complet ──
async function handleExportAll(body, auth) {
  const format = body.format || 'json'

  const { data: employees, error } = await auth.supabase
    .from('employees')
    .select('*')

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500, headers: cors() })
  }

  // Masquer les données sensibles
  const safeEmployees = (employees || []).map(emp => {
    const safe = { ...emp }
    if (safe.niss) safe.niss = safe.niss.slice(0, 6) + '****'
    if (safe.iban) safe.iban = safe.iban.slice(0, 8) + '****'
    delete safe.password_hash
    return safe
  })

  if (format === 'csv') {
    const headers = Object.keys(safeEmployees[0] || {}).join(',')
    const rows = safeEmployees.map(e => Object.values(e).map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','))
    const csv = [headers, ...rows].join('\n')

    return new Response(csv, {
      status: 200,
      headers: {
        ...cors(),
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=export_${new Date().toISOString().slice(0, 10)}.csv`,
      },
    })
  }

  return Response.json({
    success: true,
    action: 'exportAll',
    exportDate: new Date().toISOString(),
    format,
    count: safeEmployees.length,
    data: safeEmployees,
  }, { status: 200, headers: cors() })
}

// ── validateAll: Validation des données ──
async function handleValidateAll(body, auth) {
  const { data: employees, error } = await auth.supabase
    .from('employees')
    .select('*')
    .is('end_date', null)

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500, headers: cors() })
  }

  const issues = []

  for (const emp of (employees || [])) {
    const empIssues = []
    const name = `${emp.first_name || ''} ${emp.last_name || ''}`

    // Validation NISS belge (11 chiffres, modulo 97)
    if (!emp.niss) {
      empIssues.push({ field: 'niss', severity: 'error', message: 'NISS manquant' })
    } else {
      const cleanNiss = emp.niss.replace(/[^0-9]/g, '')
      if (cleanNiss.length !== 11) {
        empIssues.push({ field: 'niss', severity: 'error', message: 'NISS invalide (doit contenir 11 chiffres)' })
      } else {
        const base = parseInt(cleanNiss.slice(0, 9))
        const check = parseInt(cleanNiss.slice(9, 11))
        const mod97 = 97 - (base % 97)
        const mod97_2000 = 97 - ((2000000000 + base) % 97)
        if (check !== mod97 && check !== mod97_2000) {
          empIssues.push({ field: 'niss', severity: 'warning', message: 'NISS potentiellement invalide (modulo 97)' })
        }
      }
    }

    // Validation IBAN belge
    if (emp.iban) {
      const cleanIban = emp.iban.replace(/\s/g, '').toUpperCase()
      if (!cleanIban.startsWith('BE') || cleanIban.length !== 16) {
        empIssues.push({ field: 'iban', severity: 'warning', message: 'IBAN belge invalide (doit commencer par BE + 14 chiffres)' })
      }
    } else {
      empIssues.push({ field: 'iban', severity: 'warning', message: 'IBAN manquant' })
    }

    // Salaire
    if (!emp.monthly_salary && !emp.gross) {
      empIssues.push({ field: 'salary', severity: 'error', message: 'Salaire mensuel brut non renseigné' })
    }

    // Date d'entrée
    if (!emp.start_date) {
      empIssues.push({ field: 'start_date', severity: 'error', message: 'Date d\'entrée en service manquante' })
    }

    // Commission paritaire
    if (!emp.cp) {
      empIssues.push({ field: 'cp', severity: 'warning', message: 'Commission paritaire non renseignée (défaut: 200)' })
    }

    if (empIssues.length > 0) {
      issues.push({ employeeId: emp.id, name, issues: empIssues })
    }
  }

  const errorCount = issues.reduce((s, i) => s + i.issues.filter(x => x.severity === 'error').length, 0)
  const warningCount = issues.reduce((s, i) => s + i.issues.filter(x => x.severity === 'warning').length, 0)

  return Response.json({
    success: true,
    action: 'validateAll',
    summary: {
      employeesChecked: (employees || []).length,
      employeesWithIssues: issues.length,
      errors: errorCount,
      warnings: warningCount,
      valid: (employees || []).length - issues.length,
    },
    issues,
  }, { status: 200, headers: cors() })
}
