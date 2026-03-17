import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const dynamic = 'force-dynamic';

function sb() {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL, k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return (u && k) ? createClient(u, k) : null;
}

async function verifyUser(request, supabase) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function GET(request) {
  const s = sb();
  if (!s) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  const user = await verifyUser(request, s);
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
  const { data, error } = await s.from('entreprises').select('*').eq('user_id', user.id).limit(1);
  if (error) return NextResponse.json({ error: 'Erreur lecture' }, { status: 500 });
  return NextResponse.json({ data: data?.[0] || null });
}

export async function POST(request) {
  const s = sb();
  if (!s) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  const user = await verifyUser(request, s);
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
  const body = await request.json();
  delete body.user_id; // Toujours depuis le token
  const { data, error } = await s.from('entreprises')
    .upsert([{ ...body, user_id: user.id }], { onConflict: 'user_id' })
    .select().single();
  if (error) return NextResponse.json({ error: 'Erreur sauvegarde' }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PUT(request) {
  const s = sb();
  if (!s) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  const user = await verifyUser(request, s);
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
  const body = await request.json();
  delete body.user_id; // Jamais override
  const { data, error } = await s.from('entreprises')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .select().single();
  if (error) return NextResponse.json({ error: 'Erreur mise a jour' }, { status: 500 });
  return NextResponse.json({ data });
}
