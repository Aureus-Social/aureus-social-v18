import { timingSafeEqual } from 'crypto';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function safeCompare(a, b) {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// ── Supabase backup helper ──
async function runBackup(supabase) {
  const results = { tables: {}, errors: [], timestamp: new Date().toISOString() };

  const tables = ['employees', 'payslips', 'clients', 'app_state', 'audit_log'];
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(10000);
      if (error) { results.errors.push(`${table}: ${error.message}`); continue; }
      results.tables[table] = { count: data.length, data };
    } catch (e) {
      results.errors.push(`${table}: ${e.message}`);
    }
  }

  // Upload to Supabase Storage
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `backup-${dateStr}.json`;
  const payload = JSON.stringify(results, null, 2);

  try {
    // Ensure bucket exists (ignore error if already exists)
    await supabase.storage.createBucket('backups', { public: false });
  } catch { /* bucket may already exist */ }

  const { error: uploadErr } = await supabase.storage
    .from('backups')
    .upload(fileName, payload, {
      contentType: 'application/json',
      upsert: false,
    });

  if (uploadErr) {
    results.errors.push(`upload: ${uploadErr.message}`);
    results.storageFile = null;
  } else {
    results.storageFile = fileName;
  }

  // Cleanup old backups (keep last 30)
  try {
    const { data: files } = await supabase.storage.from('backups').list('', {
      limit: 100, sortBy: { column: 'created_at', order: 'asc' },
    });
    if (files && files.length > 30) {
      const toDelete = files.slice(0, files.length - 30).map(f => f.name);
      await supabase.storage.from('backups').remove(toDelete);
      results.cleaned = toDelete.length;
    }
  } catch { /* cleanup is best-effort */ }

  return results;
}

export async function GET(request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return Response.json({ error: 'Cron not configured' }, { status: 503 });
  }

  const auth = request.headers.get('authorization') || '';
  const provided = auth.startsWith('Bearer ') ? auth.slice(7) : '';

  if (!safeCompare(provided, cronSecret)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const tasks = [{ task: 'dimona_check', run: true }];
  if (now.getDate() === 1) { tasks.push({ task: 'cloture_reminder' }); }
  if (now.getDay() === 1) { tasks.push({ task: 'weekly_report' }); }

  // Daily backup to Supabase Storage
  let backupResult = null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      backupResult = await runBackup(supabase);
      tasks.push({
        task: 'daily_backup',
        file: backupResult.storageFile,
        tables: Object.keys(backupResult.tables).length,
        errors: backupResult.errors.length,
      });
    } catch (e) {
      tasks.push({ task: 'daily_backup', error: e.message });
    }
  }

  return Response.json({ cron: 'ok', executed: tasks.length, tasks });
}
