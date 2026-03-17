import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

// Cette route exécute du SQL via pg directement
// Protégée par CRON_SECRET
export async function POST(request) {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
  }

  const { sql } = await request.json();
  if (!sql) return NextResponse.json({ error: 'sql requis' }, { status: 400 });

  // Utiliser l'API Supabase Management
  const projectRef = 'jwjtlpewwdjxdboxtbdf';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });
    
    const data = await res.json();
    return NextResponse.json({ ok: res.ok, status: res.status, data });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
