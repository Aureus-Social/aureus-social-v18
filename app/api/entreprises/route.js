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
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
  const { data, error } = await s.from('entreprises').select('*').eq('user_id', userId).limit(1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data?.[0] || null });
}
export async function POST(request) {
  const s = sb(); if (!s) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  const body = await request.json();
  const { data, error } = await s.from('entreprises').upsert([body], { onConflict: 'user_id' }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
export async function PUT(request) {
  const s = sb(); if (!s) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  const { user_id, ...updates } = await request.json();
  const { data, error } = await s.from('entreprises').update(updates).eq('user_id', user_id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
