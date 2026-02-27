import { apiRateLimit, auditLog } from "../../../lib/api-security";
// Aureus Social Pro — API v1 Employees
// CRUD employees with tenant isolation via Supabase RLS
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getAuthToken(request) {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET(request) {
  try {
    const token = getAuthToken(request);
    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const status = searchParams.get('status') || 'active';
    const search = searchParams.get('search') || '';

    let query = supabase.from('employees').select('*', { count: 'exact' });

    if (status !== 'all') query = query.eq('status', status);
    if (search) query = query.or(`first.ilike.%${search}%,last.ilike.%${search}%,niss.ilike.%${search}%,email.ilike.%${search}%`);

    query = query.range((page - 1) * limit, page * limit - 1).order('last', { ascending: true });

    const { data, count, error } = await query;
    if (error) return Response.json({ error: error.message }, { status: 400, headers: corsHeaders() });

    return Response.json({ data, total: count, page, limit }, { headers: corsHeaders() });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders() });
  }
}

export async function POST(request) {
  try {
    const token = getAuthToken(request);
    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const body = await request.json();
    const required = ['first', 'last', 'niss'];
    for (const field of required) {
      if (!body[field]) return Response.json({ error: `Missing required field: ${field}` }, { status: 400, headers: corsHeaders() });
    }

    // Validate NISS (Belgian social security number — 11 digits, mod97 check)
    const niss = (body.niss || '').replace(/[^0-9]/g, '');
    if (niss.length !== 11) return Response.json({ error: 'NISS must be 11 digits' }, { status: 400, headers: corsHeaders() });
    const base = parseInt(niss.slice(0, 9));
    const check = parseInt(niss.slice(9, 11));
    const valid97 = 97 - (base % 97) === check || 97 - ((2000000000 + base) % 97) === check;
    if (!valid97) return Response.json({ error: 'Invalid NISS checksum' }, { status: 400, headers: corsHeaders() });

    const employee = {
      first: body.first,
      last: body.last,
      niss,
      email: body.email || null,
      iban: body.iban || null,
      monthly_salary: body.salary || body.monthlySalary || 0,
      contract_type: body.contractType || 'CDI',
      start_date: body.startDate || new Date().toISOString(),
      end_date: body.endDate || null,
      cp: body.cp || '200',
      status: 'active',
      wh_week: body.whWeek || 38,
      statut: body.statut || 'employe',
    };

    const { data, error } = await supabase.from('employees').insert(employee).select().single();
    if (error) return Response.json({ error: error.message }, { status: 400, headers: corsHeaders() });

    return Response.json({ data, id: data.id }, { status: 201, headers: corsHeaders() });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders() });
  }
}

export async function PUT(request) {
  try {
    const token = getAuthToken(request);
    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const body = await request.json();
    if (!body.id) return Response.json({ error: 'Missing employee id' }, { status: 400, headers: corsHeaders() });

    const { data, error } = await supabase.from('employees').update(body).eq('id', body.id).select().single();
    if (error) return Response.json({ error: error.message }, { status: 400, headers: corsHeaders() });

    return Response.json({ data }, { headers: corsHeaders() });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders() });
  }
}

export async function DELETE(request) {
  try {
    const token = getAuthToken(request);
    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'Missing id parameter' }, { status: 400, headers: corsHeaders() });

    // Soft delete
    const { error } = await supabase.from('employees').update({ status: 'inactive' }).eq('id', id);
    if (error) return Response.json({ error: error.message }, { status: 400, headers: corsHeaders() });

    return Response.json({ success: true }, { headers: corsHeaders() });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders() });
  }
}
