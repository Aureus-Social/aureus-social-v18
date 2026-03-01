// ═══════════════════════════════════════════════════════
//  AUREUS SOCIAL PRO — CRON /api/cron/deadlines
//  Vérification automatique des échéances légales belges
//  Envoi de rappels par email (Resend) pour les échéances proches
//  Déclenché par Vercel Cron ou appel externe
// ═══════════════════════════════════════════════════════

import { templateReminder, templateAlert } from '../../../lib/email-templates.js'

// ── Échéances légales permanentes ──
function getDeadlines(year) {
  return [
    // Précompte professionnel — mensuel, 15 du mois suivant
    ...Array.from({ length: 12 }, (_, i) => ({
      date: new Date(year, (i + 1) % 12, 15),
      label: `PP ${['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'][i]} ${year}`,
      type: 'fiscal',
      priority: 'high',
    })),
    // ONSS trimestriel
    { date: new Date(year, 0, 31), label: `DmfA T4/${year - 1} — soumission`, type: 'onss', priority: 'high' },
    { date: new Date(year, 3, 30), label: `DmfA T1/${year} — soumission`, type: 'onss', priority: 'high' },
    { date: new Date(year, 6, 31), label: `DmfA T2/${year} — soumission`, type: 'onss', priority: 'high' },
    { date: new Date(year, 9, 31), label: `DmfA T3/${year} — soumission`, type: 'onss', priority: 'high' },
    // Belcotax
    { date: new Date(year, 2, 1), label: `Belcotax fiches 281 — année ${year - 1}`, type: 'fiscal', priority: 'high' },
    // Pécule de vacances
    { date: new Date(year, 5, 30), label: 'Pécule de vacances employés', type: 'payroll', priority: 'high' },
    // 13ème mois
    { date: new Date(year, 11, 20), label: '13ème mois — calcul et paiement', type: 'payroll', priority: 'high' },
    // Bilan social
    { date: new Date(year, 4, 31), label: 'Bilan social — dépôt BNB', type: 'legal', priority: 'medium' },
    // Clôture annuelle
    { date: new Date(year, 11, 31), label: 'Clôture annuelle paie', type: 'payroll', priority: 'high' },
    // Plan de formation
    { date: new Date(year, 2, 31), label: 'Plan de formation — dépôt SPF', type: 'legal', priority: 'medium' },
    // Indexation (variable, mais souvent en janvier)
    { date: new Date(year, 0, 1), label: 'Indexation salariale — vérifier barèmes CP', type: 'payroll', priority: 'medium' },
  ]
}

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

// GET — Vérifier les échéances et retourner les alertes
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const daysAhead = parseInt(searchParams.get('days') || '14')
    const sendEmails = searchParams.get('send') === 'true'
    const year = parseInt(searchParams.get('year') || new Date().getFullYear())

    const now = new Date()
    const deadlines = getDeadlines(year)
    const upcoming = []
    const overdue = []

    deadlines.forEach(dl => {
      const daysUntil = Math.ceil((dl.date - now) / (1000 * 60 * 60 * 24))

      if (daysUntil < 0 && daysUntil >= -7) {
        overdue.push({ ...dl, daysUntil, status: 'overdue' })
      } else if (daysUntil >= 0 && daysUntil <= daysAhead) {
        upcoming.push({ ...dl, daysUntil, status: daysUntil === 0 ? 'today' : 'upcoming' })
      }
    })

    // Trier par urgence
    const alerts = [...overdue, ...upcoming].sort((a, b) => a.daysUntil - b.daysUntil)

    // Envoi d'emails si demandé et configuré
    let emailsSent = 0
    if (sendEmails && process.env.RESEND_API_KEY && alerts.length > 0) {
      try {
        const urgentAlerts = alerts.filter(a => a.priority === 'high' && a.daysUntil <= 3)

        for (const alert of urgentAlerts) {
          const html = templateAlert({
            type: alert.type === 'onss' ? 'ONSS' : alert.type === 'fiscal' ? 'Fiscal' : 'Paie',
            title: alert.label,
            description: alert.daysUntil < 0
              ? `Cette échéance est en retard de ${Math.abs(alert.daysUntil)} jour(s) ! Action immédiate requise.`
              : alert.daysUntil === 0
              ? 'Cette échéance est pour aujourd\'hui. Vérifiez que tout est en ordre.'
              : `Échéance dans ${alert.daysUntil} jour(s). Préparez les documents nécessaires.`,
            deadline: alert.date.toLocaleDateString('fr-BE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            severity: alert.daysUntil < 0 ? 'urgent' : alert.daysUntil <= 3 ? 'warning' : 'info',
            actions: [{ label: 'Ouvrir Aureus Social', url: process.env.ALLOWED_ORIGIN || 'https://app.aureussocial.be' }],
          })

          const recipientEmail = process.env.ADMIN_EMAIL || process.env.NOTIFICATION_EMAIL
          if (recipientEmail) {
            const resp = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'Aureus Social <noreply@aureussocial.be>',
                to: [recipientEmail],
                subject: `${alert.daysUntil < 0 ? '⚠️ RETARD' : '⏰ Rappel'} — ${alert.label}`,
                html,
              }),
            })
            if (resp.ok) emailsSent++
          }
        }
      } catch (emailErr) {
        console.error('[CRON-DEADLINES-EMAIL-ERROR]', emailErr)
      }
    }

    // Audit log
    console.log('[CRON-DEADLINES]', JSON.stringify({
      timestamp: now.toISOString(),
      upcomingCount: upcoming.length,
      overdueCount: overdue.length,
      emailsSent,
      daysAhead,
    }))

    return Response.json({
      success: true,
      checked: now.toISOString(),
      daysAhead,
      summary: {
        overdue: overdue.length,
        upcoming: upcoming.length,
        total: alerts.length,
        emailsSent,
      },
      alerts: alerts.map(a => ({
        label: a.label,
        date: a.date.toISOString().slice(0, 10),
        displayDate: a.date.toLocaleDateString('fr-BE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }),
        type: a.type,
        priority: a.priority,
        status: a.status,
        daysUntil: a.daysUntil,
      })),
      nextCheck: {
        recommended: 'Exécuter ce cron quotidiennement à 8h00 CET',
        vercelCron: '0 7 * * *',
      },
    }, { headers: cors() })

  } catch (err) {
    console.error('[CRON-DEADLINES-ERROR]', err)
    return Response.json({
      success: false,
      error: err.message,
      timestamp: new Date().toISOString(),
    }, { status: 500, headers: cors() })
  }
}

// POST — Déclencher manuellement la vérification + envoi
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const url = new URL(request.url)
    url.searchParams.set('send', body.sendEmails ? 'true' : 'false')
    if (body.daysAhead) url.searchParams.set('days', String(body.daysAhead))

    // Réutiliser le handler GET
    return GET(new Request(url.toString(), { headers: request.headers }))
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500, headers: cors() })
  }
}
