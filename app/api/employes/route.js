import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { encryptField, decryptField } from '@/app/lib/crypto-fields';
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

// Chiffrer les champs sensibles avant insertion
function encryptEmployee(emp) {
  const secured = { ...emp };
  if (secured.niss) secured.niss = encryptField(secured.niss);
  if (secured.iban) secured.iban = encryptField(secured.iban);
  return secured;
}

// Déchiffrer pour retour client
function decryptEmployee(emp) {
  const clear = { ...emp };
  if (clear.niss) clear.niss = decryptField(clear.niss);
  if (clear.iban) clear.iban = decryptField(clear.iban);
  return clear;
}

export async function GET(request) {
  const s = sb();
  if (!s) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  const user = await verifyUser(request, s);
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
  const { data, error } = await s.from('employes')
    .select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Erreur lecture' }, { status: 500 });
  // Déchiffrer NISS/IBAN pour le client authentifié
  return NextResponse.json({ data: (data || []).map(decryptEmployee) });
}

export async function POST(request) {
  const s = sb();
  if (!s) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  const user = await verifyUser(request, s);
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
  const body = await request.json();
  const records = Array.isArray(body) ? body : [body];
  const secured = records.map(r => {
    delete r.user_id;
    return encryptEmployee({ ...r, user_id: user.id });
  });
  const { data, error } = await s.from('employes').insert(secured).select();
  if (error) return NextResponse.json({ error: 'Erreur creation' }, { status: 500 });
  return NextResponse.json({ data: (data || []).map(decryptEmployee) });
}

export async function PUT(request) {
  const s = sb();
  if (!s) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  const user = await verifyUser(request, s);
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
  const { id, ...updates } = await request.json();
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });
  delete updates.user_id;
  const encrypted = encryptEmployee({ ...updates, updated_at: new Date().toISOString() });
  const { data, error } = await s.from('employes')
    .update(encrypted).eq('id', id).eq('user_id', user.id).select().single();
  if (error) return NextResponse.json({ error: 'Erreur mise a jour' }, { status: 500 });
  return NextResponse.json({ data: decryptEmployee(data) });
}

export async function DELETE(request) {
  const s = sb();
  if (!s) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  const user = await verifyUser(request, s);
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });
  const { error } = await s.from('employes').delete().eq('id', id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: 'Erreur suppression' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
