import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  : null;

// GET — Load custom timeline entries
export async function GET() {
  if (!supabase) {
    // Fallback: return empty if no Supabase
    return NextResponse.json({ entries: [], source: 'fallback' });
  }
  try {
    const { data, error } = await supabase
      .from('baremes_timeline')
      .select('*')
      .order('effective_date', { ascending: true });
    if (error) throw error;
    return NextResponse.json({ entries: data || [], source: 'supabase' });
  } catch (e) {
    // Table might not exist yet — return empty
    return NextResponse.json({ entries: [], source: 'fallback', error: e.message });
  }
}

// POST — Save a new timeline entry
export async function POST(req) {
  try {
    const body = await req.json();
    const { effective_date, source, values, created_by } = body;

    if (!effective_date || !values) {
      return NextResponse.json({ error: 'effective_date and values required' }, { status: 400 });
    }

    if (!supabase) {
      // No Supabase: store in memory / return success for UI
      return NextResponse.json({
        success: true,
        entry: { id: Date.now(), effective_date, source, values, created_by, created_at: new Date().toISOString() },
        source: 'memory'
      });
    }

    const { data, error } = await supabase
      .from('baremes_timeline')
      .upsert({
        effective_date,
        source: source || 'Admin manual',
        values: JSON.stringify(values),
        created_by: created_by || 'admin',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'effective_date' })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, entry: data, source: 'supabase' });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE — Remove a custom timeline entry
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    if (!supabase) {
      return NextResponse.json({ success: true, source: 'memory' });
    }

    const { error } = await supabase.from('baremes_timeline').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
