import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const dynamic = 'force-dynamic';

function sb() {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL, k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return (u && k) ? createClient(u, k) : null;
}

// Vérification JWT — extrait et vérifie le token Bearer
// Retourne le user Supabase réel ou null
async function verifyUser(request, supabase) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user; // user.id est garanti authentique
}

export async function GET(request) {
  const s = sb();
  if (!s) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  const user = await verifyUser(request, s);
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  let q = s.from('employes').select('*').eq('user_id', user.id)
    .order('created_at', { ascending: false });
  // Filtres optionnels
  const empId = searchParams.get('empId');
  const year = searchParams.get('year');
  const month = searchParams.get('month');
  if (empId) q = q.eq('emp_id', empId);
  if (year) q = q.eq('year', parseInt(year));
  if (month) q = q.eq('month', parseInt(month));
  const { data, error } = await q.limit(500);
  if (error) return NextResponse.json({ error: 'Erreur lecture' }, { status: 500 });
  return NextResponse.json({ data: data || [] });
}

export async function POST(request) {
  const s = sb();
  if (!s) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  const user = await verifyUser(request, s);
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
  const body = await request.json();
  const records = Array.isArray(body) ? body : [body];
  // Forcer user_id depuis le token — jamais depuis le body
  const secured = records.map(r => { delete r.user_id; return { ...r, user_id: user.id }; });
  const { data, error } = await s.from('employes').insert(secured).select();
  if (error) return NextResponse.json({ error: 'Erreur creation' }, { status: 500 });
  return NextResponse.json({ data });
}
export async function PUT(request) {
  const s = sb();
  if (!s) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  const user = await verifyUser(request, s);
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
  const { id, ...updates } = await request.json();
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });
  delete updates.user_id; // Jamais override user_id
  const { data, error } = await s.from('employes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id).eq('user_id', user.id) // Double vérif : id + user_id
    .select().single();
  if (error) return NextResponse.json({ error: 'Erreur mise a jour' }, { status: 500 });
  return NextResponse.json({ data });
}
export async function DELETE(request) {
  const s = sb();
  if (!s) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  const user = await verifyUser(request, s);
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });
  const { error } = await s.from('employes').delete()
    .eq('id', id).eq('user_id', user.id); // Double vérif
  if (error) return NextResponse.json({ error: 'Erreur suppression' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
