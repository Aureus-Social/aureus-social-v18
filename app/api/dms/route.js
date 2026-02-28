// ═══════════════════════════════════════════════════════════
// AUREUS SOCIAL PRO — Document Management System (Item 16)
// Upload, versioning, categorization via Supabase Storage
// ═══════════════════════════════════════════════════════════
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getAuthToken(request) {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

const ALLOWED_TYPES = [
  'application/pdf',
  'image/png', 'image/jpeg', 'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'text/csv', 'text/plain',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const CATEGORIES = [
  'contrat', 'avenant', 'fiche_paie', 'c4', 'dimona',
  'attestation', 'reglement_travail', 'convention', 'facture',
  'a1_detachement', 'medical', 'formation', 'autre',
];

// GET /api/dms?category=contrat&employeeId=xxx
export async function GET(request) {
  if (!supabaseUrl || !supabaseKey) {
    return Response.json({ ok: true, documents: [], source: 'fallback' });
  }

  const token = getAuthToken(request);
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const employeeId = searchParams.get('employeeId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    let query = supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (category) query = query.eq('category', category);
    if (employeeId) query = query.eq('employee_id', employeeId);

    const { data, error } = await query;
    if (error) throw error;

    return Response.json({ ok: true, documents: data, total: data.length });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// POST /api/dms — Upload document
export async function POST(request) {
  if (!supabaseUrl || !supabaseKey) {
    return Response.json({
      ok: true, mode: 'dev',
      message: 'DMS en mode développement (Supabase non configuré)',
    });
  }

  const token = getAuthToken(request);
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const formData = await request.formData();
    const file = formData.get('file');
    const category = formData.get('category') || 'autre';
    const employeeId = formData.get('employeeId') || null;
    const description = formData.get('description') || '';
    const clientId = formData.get('clientId') || null;

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json({
        error: `Type non autorisé: ${file.type}. Autorisés: PDF, images, DOCX, XLSX, CSV`,
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ error: 'Fichier trop volumineux (max 10 MB)' }, { status: 400 });
    }

    // Validate category
    if (!CATEGORIES.includes(category)) {
      return Response.json({ error: `Catégorie invalide. Autorisées: ${CATEGORIES.join(', ')}` }, { status: 400 });
    }

    // Generate unique path with versioning
    const ext = file.name.split('.').pop() || 'pdf';
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
    const storagePath = `${category}/${new Date().getFullYear()}/${timestamp}-${safeName}`;

    // Upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());

    // Ensure bucket exists
    try {
      await supabase.storage.createBucket('documents', { public: false });
    } catch { /* bucket may already exist */ }

    const { error: uploadErr } = await supabase.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadErr) throw uploadErr;

    // Check for existing versions
    let version = 1;
    if (employeeId) {
      const { data: existing } = await supabase
        .from('documents')
        .select('version')
        .eq('employee_id', employeeId)
        .eq('category', category)
        .ilike('original_name', file.name)
        .order('version', { ascending: false })
        .limit(1);
      if (existing?.length > 0) {
        version = (existing[0].version || 1) + 1;
      }
    }

    // Record in documents table
    const { data: doc, error: dbErr } = await supabase
      .from('documents')
      .insert({
        original_name: file.name,
        storage_path: storagePath,
        category,
        employee_id: employeeId,
        client_id: clientId,
        description,
        file_type: file.type,
        file_size: file.size,
        version,
      })
      .select()
      .single();

    if (dbErr) throw dbErr;

    return Response.json({
      ok: true,
      document: {
        id: doc.id,
        name: file.name,
        category,
        version,
        size: file.size,
        path: storagePath,
      },
    }, { status: 201 });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// DELETE /api/dms?id=xxx
export async function DELETE(request) {
  if (!supabaseUrl || !supabaseKey) {
    return Response.json({ error: 'Not configured' }, { status: 503 });
  }

  const token = getAuthToken(request);
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });

    // Get document record
    const { data: doc } = await supabase
      .from('documents')
      .select('storage_path')
      .eq('id', id)
      .single();

    if (doc?.storage_path) {
      await supabase.storage.from('documents').remove([doc.storage_path]);
    }

    // Soft delete
    await supabase.from('documents').update({ deleted: true }).eq('id', id);

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
