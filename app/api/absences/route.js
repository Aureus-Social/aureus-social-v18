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
  const userId = searchParams.get('userId'), empId = searchParams.get('empId'), year = searchParams.get('year');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
  let q = s.from('absences').select('*').eq('user_id', userId).order('date_debut', { ascending: false });
  if (empId) q = q.eq('emp_id', empId);
  if (year) q = q.gte('date_debut', `${year}-01-01`).lte('date_debut', `${year}-12-31`);
  const { data, error } = await q.limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
export async function POST(request) {
  const s = sb(); if (!s) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  const body = await request.json();
  const { data, error } = await s.from('absences').insert([body]).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
export async function PUT(request) {
  const s = sb(); if (!s) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  const { id, user_id, ...updates } = await request.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const { data, error } = await s.from('absences').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user_id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
export async function DELETE(request) {
  const s = sb(); if (!s) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id'), userId = searchParams.get('userId');
  if (!id || !userId) return NextResponse.json({ error: 'params required' }, { status: 400 });
  const { error } = await s.from('absences').delete().eq('id', id).eq('user_id', userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
