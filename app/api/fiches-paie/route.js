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
  const userId = searchParams.get('userId'), empId = searchParams.get('empId');
  const year = searchParams.get('year'), month = searchParams.get('month');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
  let q = s.from('fiches_paie').select('*').eq('user_id', userId)
    .order('year', { ascending: false }).order('month', { ascending: false });
  if (empId) q = q.eq('emp_id', empId);
  if (year) q = q.eq('year', parseInt(year));
  if (month) q = q.eq('month', parseInt(month));
  const { data, error } = await q.limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
export async function POST(request) {
  const s = sb(); if (!s) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  const body = await request.json();
  const { data, error } = await s.from('fiches_paie')
    .upsert(Array.isArray(body) ? body : [body], { onConflict: 'user_id,emp_id,month,year', ignoreDuplicates: false }).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
export async function DELETE(request) {
  const s = sb(); if (!s) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id'), userId = searchParams.get('userId');
  if (!id || !userId) return NextResponse.json({ error: 'params required' }, { status: 400 });
  const { error } = await s.from('fiches_paie').delete().eq('id', id).eq('user_id', userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
