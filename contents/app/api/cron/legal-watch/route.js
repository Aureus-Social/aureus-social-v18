// ═══ AUREUS SOCIAL PRO — CRON LEGAL WATCH ═══
// Vercel Cron : chaque jour à 6h30 CET
// Vérifie sources légales belges + envoie alertes si changement détecté
// Sources : Moniteur Belge · SPF Finances · ONSS · CNT · SPF ETCS

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SOURCES = [
  { name: 'SPF Finances', url: 'https://finances.belgium.be/fr/actualites' },
  { name: 'ONSS — Cotisations', url: 'https://www.socialsecurity.be/employer/instructions/dmfa/fr/latest/instructions/special_contributions/overview.html' },
  { name: 'CNT', url: 'https://www.cnt-nar.be/AVIS/avis-liste.aspx' },
  { name: 'SPF ETCS — Emploi', url: 'https://emploi.belgique.be/fr' },
  { name: 'Moniteur Belge', url: 'https://www.ejustice.just.fgov.be/cgi_loi/change_lg.pl?language=fr&la=F&cn=1978030302&table_name=loi' },
];

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function checkSource(src) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(src.url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'AureusLegalBot/1.0' },
    });
    clearTimeout(t);
    // Lire un extrait du contenu pour détecter des changements
    const text = await res.text();
    const excerpt = text.slice(0, 2000).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return { name: src.name, url: src.url, status: res.ok ? 'ok' : 'error', httpStatus: res.status, excerpt: excerpt.slice(0, 500) };
  } catch (e) {
    return { name: src.name, url: src.url, status: 'error', error: e.message?.slice(0, 100) };
  }
}

async function sendAlertEmail(to, subject, html) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Aureus Legal Watch <legal@aureussocial.be>',
        to: [to],
        subject,
        html,
      }),
    });
    return res.ok;
  } catch { return false; }
}

export async function GET(request) {
  // Auth cron Vercel
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();
  const checkedAt = new Date().toISOString();
  const results = await Promise.allSettled(SOURCES.map(checkSource));
  const sources = results.map(r => r.status === 'fulfilled' ? r.value : { status: 'error', error: r.reason?.message });

  const errors = sources.filter(s => s.status === 'error');
  const ok = sources.filter(s => s.status === 'ok');

  // Calculer échéances du jour
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const quarter = Math.ceil(month / 3);

  const calendarAlerts = [];

  // PP — 5 du mois
  const daysToFive = 5 - day;
  if (daysToFive >= 0 && daysToFive <= 5) {
    calendarAlerts.push({ level: daysToFive === 0 ? 'critical' : 'warning', type: 'PP274', msg: `Précompte professionnel dû le 5/${month < 10 ? '0' + month : month}/${now.getFullYear()} (J-${daysToFive})` });
  }

  // DmfA — fin de trimestre
  const qEnd = new Date(now.getFullYear(), quarter * 3, 0);
  const daysDmfa = Math.ceil((qEnd - now) / 86400000);
  if (daysDmfa <= 14) {
    calendarAlerts.push({ level: daysDmfa <= 3 ? 'critical' : 'warning', type: 'DmfA', msg: `DmfA T${quarter} à déposer dans ${daysDmfa} jours (${qEnd.toLocaleDateString('fr-BE')})` });
  }

  // Belcotax — janvier/février
  if (month <= 2) {
    const belco = new Date(now.getFullYear(), 2, 1);
    const db = Math.ceil((belco - now) / 86400000);
    if (db <= 21) calendarAlerts.push({ level: db <= 7 ? 'critical' : 'warning', type: 'Belcotax', msg: `Belcotax 281.xx à envoyer dans ${db} jours` });
  }

  // Persister résultat dans Supabase
  if (supabase) {
    await supabase.from('legal_watch_log').insert([{
      checked_at: checkedAt,
      sources_ok: ok.length,
      sources_error: errors.length,
      calendar_alerts: calendarAlerts.length,
      sources_data: JSON.stringify(sources),
      alerts_data: JSON.stringify(calendarAlerts),
    }]).then(({ error }) => { if (error) console.warn('legal_watch_log insert:', error.message); });
  }

  // Envoyer email si alertes critiques ou erreurs sources
  const criticals = calendarAlerts.filter(a => a.level === 'critical');
  const adminEmail = process.env.ADMIN_EMAIL || 'moussati.nourdin@gmail.com';

  if ((criticals.length > 0 || errors.length > 0) && adminEmail) {
    const subject = `🔴 Aureus Legal Watch — ${criticals.length} alerte(s) critique(s) — ${new Date().toLocaleDateString('fr-BE')}`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0e0d0b;color:#e8e6e0;padding:24px;border-radius:12px;border:1px solid #c6a34e40;">
        <h2 style="color:#c6a34e;margin:0 0 16px">🔴 Aureus Legal Watch</h2>
        <p style="color:#9e9b93;margin:0 0 20px">Rapport automatique du ${new Date().toLocaleDateString('fr-BE')}</p>

        ${criticals.length > 0 ? `
        <div style="background:#f8717118;border:1px solid #f8717140;border-radius:8px;padding:14px;margin-bottom:16px;">
          <h3 style="color:#f87171;margin:0 0 10px">Échéances critiques (${criticals.length})</h3>
          ${criticals.map(a => `<div style="padding:6px 0;border-bottom:1px solid #f8717120;font-size:13px;">${a.msg}</div>`).join('')}
        </div>` : ''}

        ${calendarAlerts.filter(a => a.level === 'warning').length > 0 ? `
        <div style="background:#fb923c18;border:1px solid #fb923c40;border-radius:8px;padding:14px;margin-bottom:16px;">
          <h3 style="color:#fb923c;margin:0 0 10px">Alertes à surveiller</h3>
          ${calendarAlerts.filter(a => a.level === 'warning').map(a => `<div style="padding:6px 0;font-size:13px;">${a.msg}</div>`).join('')}
        </div>` : ''}

        ${errors.length > 0 ? `
        <div style="background:#60a5fa18;border:1px solid #60a5fa40;border-radius:8px;padding:14px;margin-bottom:16px;">
          <h3 style="color:#60a5fa;margin:0 0 10px">Sources inaccessibles (${errors.length}/${SOURCES.length})</h3>
          ${errors.map(e => `<div style="font-size:12px;color:#9e9b93;">${e.name}: ${e.error || 'HTTP ' + e.httpStatus}</div>`).join('')}
        </div>` : ''}

        <div style="border-top:1px solid #c6a34e30;padding-top:14px;font-size:11px;color:#5e5c56;">
          Aureus Social Pro — Veille légale automatique · <a href="https://app.aureussocial.be" style="color:#c6a34e;">app.aureussocial.be</a>
        </div>
      </div>
    `;
    await sendAlertEmail(adminEmail, subject, html);
  }

  return NextResponse.json({
    ok: true,
    checkedAt,
    sourcesOk: ok.length,
    sourcesError: errors.length,
    calendarAlerts,
    emailSent: (criticals.length > 0 || errors.length > 0),
  });
}
