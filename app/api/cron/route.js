import { timingSafeEqual } from 'crypto';

export const dynamic = 'force-dynamic';

function safeCompare(a, b) {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
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
  return Response.json({ cron: 'ok', executed: tasks.length, tasks });
}
