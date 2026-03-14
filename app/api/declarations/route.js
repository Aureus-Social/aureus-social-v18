import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const dynamic = 'force-dynamic';
function sb() {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL, k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return (u && k) ? createClient(u, k) : null;
}
export async function GET(request) {
  const s = sb(); if (!s) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId'), type = searchParams.get('type');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
  let q = s.from('declarations').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (type && type !== 'all') q = q.eq('type', type);
  const { data, error } = await q.limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data || [] });
}
export async function POST(request) {
  const s = sb(); if (!s) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  const body = await request.json();
  const { data, error } = await s.from('declarations').insert([{ ...body, created_at: new Date().toISOString(), status: body.status || 'submitted' }]).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
