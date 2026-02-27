export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export async function GET(request) {
  const auth = request.headers.get('authorization');
  if (auth !== 'Bearer ' + (process.env.CRON_SECRET || '')) { return Response.json({ error: 'Unauthorized' }, { status: 401 }); }
  const now = new Date();
  const tasks = [{ task: 'dimona_check', run: true }];
  if (now.getDate() === 1) { tasks.push({ task: 'cloture_reminder' }); }
  if (now.getDay() === 1) { tasks.push({ task: 'weekly_report' }); }
  return Response.json({ cron: 'ok', executed: tasks.length, tasks });
}
