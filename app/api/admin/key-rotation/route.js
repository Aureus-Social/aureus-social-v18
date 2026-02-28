// ═══════════════════════════════════════════════════════════
// AUREUS SOCIAL PRO — Encryption Key Rotation (Item 28)
// POST /api/admin/key-rotation
// Re-encrypts all sensitive data with a new key version
// Requires CRON_SECRET or admin auth
// ═══════════════════════════════════════════════════════════
import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'crypto';

export const dynamic = 'force-dynamic';

function safeCompare(a, b) {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// AES-256-GCM encrypt/decrypt for Node.js (server-side)
const crypto = await import('crypto');

function serverEncrypt(plaintext, keyHex) {
  const key = Buffer.from(keyHex, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return iv.toString('hex') + ':' + encrypted + ':' + tag;
}

function serverDecrypt(encryptedStr, keyHex) {
  const parts = encryptedStr.split(':');
  if (parts.length !== 3) return null;
  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const tag = Buffer.from(parts[2], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const SENSITIVE_COLS = ['niss_encrypted', 'iban_encrypted'];

export async function POST(request) {
  // Auth check
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization') || '';
  const provided = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!cronSecret || !safeCompare(provided, cronSecret)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const oldKey = process.env.ENCRYPTION_KEY;
  const newKey = process.env.ENCRYPTION_KEY_NEW;
  if (!oldKey || !newKey) {
    return Response.json({
      error: 'Set ENCRYPTION_KEY (current) and ENCRYPTION_KEY_NEW (target) env vars',
      instructions: 'Generate new key: openssl rand -hex 32',
    }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return Response.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const results = { rotated: 0, errors: 0, details: [] };

  try {
    // 1. Fetch all employees with encrypted fields
    const { data: employees, error } = await supabase
      .from('employees')
      .select('id, niss_encrypted, iban_encrypted')
      .not('niss_encrypted', 'is', null);

    if (error) throw error;

    // 2. Re-encrypt each record
    for (const emp of (employees || [])) {
      try {
        const updates = {};
        for (const col of SENSITIVE_COLS) {
          if (emp[col]) {
            const plaintext = serverDecrypt(emp[col], oldKey);
            if (plaintext) {
              updates[col] = serverEncrypt(plaintext, newKey);
            }
          }
        }
        if (Object.keys(updates).length > 0) {
          const { error: upErr } = await supabase
            .from('employees')
            .update(updates)
            .eq('id', emp.id);
          if (upErr) throw upErr;
          results.rotated++;
        }
      } catch (e) {
        results.errors++;
        results.details.push({ id: emp.id, error: e.message });
      }
    }

    // 3. Log rotation event
    await supabase.from('audit_log').insert({
      action: 'KEY_ROTATION',
      details: {
        rotated: results.rotated,
        errors: results.errors,
        message: `Rotation clés: ${results.rotated} enregistrements re-chiffrés`,
      },
      timestamp: new Date().toISOString(),
    });

    return Response.json({
      ok: true,
      ...results,
      instruction: results.errors === 0
        ? 'Rotation réussie. Mettez à jour ENCRYPTION_KEY avec la valeur de ENCRYPTION_KEY_NEW, puis supprimez ENCRYPTION_KEY_NEW.'
        : 'Rotation partielle — vérifiez les erreurs avant de mettre à jour la clé.',
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({
    service: 'Aureus Social Pro — Key Rotation',
    method: 'POST with Bearer CRON_SECRET',
    envRequired: ['ENCRYPTION_KEY', 'ENCRYPTION_KEY_NEW', 'CRON_SECRET'],
    instructions: [
      '1. Generate new key: openssl rand -hex 32',
      '2. Set ENCRYPTION_KEY_NEW in Vercel env',
      '3. POST /api/admin/key-rotation with Bearer token',
      '4. On success: copy ENCRYPTION_KEY_NEW → ENCRYPTION_KEY, delete ENCRYPTION_KEY_NEW',
    ],
  });
}
