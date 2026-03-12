// app/api/onss/dimona/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function genDimonaXML({ action, wtype, start, end, hours, first, last, niss, birth, cp, onss, vat, dimonaP, reason }) {
  const now = new Date().toISOString();
  const msgId = `DIM-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<ns2:Dimona xmlns:ns2="http://www.socialsecurity.be/xsd/employer/dimona/2017/1">
  <ns2:Header>
    <ns2:MessageId>${msgId}</ns2:MessageId>
    <ns2:Timestamp>${now}</ns2:Timestamp>
    <ns2:SenderIdentification>${vat || 'BE1028230781'}</ns2:SenderIdentification>
  </ns2:Header>
  <ns2:Employer>
    <ns2:EnterpriseNumber>${(vat || '').replace(/[^0-9]/g, '')}</ns2:EnterpriseNumber>
    ${onss ? `<ns2:OnssNumber>${onss}</ns2:OnssNumber>` : ''}
  </ns2:Employer>
  <ns2:Worker>
    <ns2:NISS>${niss || ''}</ns2:NISS>
    <ns2:LastName>${last || ''}</ns2:LastName>
    <ns2:FirstName>${first || ''}</ns2:FirstName>
    ${birth ? `<ns2:BirthDate>${birth}</ns2:BirthDate>` : ''}
  </ns2:Worker>
  <ns2:Declaration>
    <ns2:Type>${action}</ns2:Type>
    <ns2:WorkerType>${wtype || 'OTH'}</ns2:WorkerType>
    <ns2:JointCommittee>${cp || '200'}</ns2:JointCommittee>
    <ns2:StartDate>${start}</ns2:StartDate>
    ${end ? `<ns2:EndDate>${end}</ns2:EndDate>` : ''}
    ${hours ? `<ns2:PlannedHoursPerWeek>${hours}</ns2:PlannedHoursPerWeek>` : ''}
    ${dimonaP ? `<ns2:DimonaP>${dimonaP}</ns2:DimonaP>` : ''}
    ${reason ? `<ns2:Reason>${reason}</ns2:Reason>` : ''}
  </ns2:Declaration>
</ns2:Dimona>`;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, emp, co, wtype, start, end, hours, dimonaP, reason, userId } = body;

    if (!emp?.niss) {
      return NextResponse.json({ ok: false, error: 'NISS travailleur manquant' }, { status: 400 });
    }
    if (!start) {
      return NextResponse.json({ ok: false, error: 'Date de début requise' }, { status: 400 });
    }
    if (action === 'OUT' && !end) {
      return NextResponse.json({ ok: false, error: 'Date de fin requise pour Dimona OUT' }, { status: 400 });
    }

    const xml = genDimonaXML({
      action, wtype, start, end, hours,
      first: emp.first || emp.prenom,
      last: emp.last || emp.nom,
      niss: emp.niss,
      birth: emp.birth || emp.date_naissance,
      cp: emp.cp || emp.commission_paritaire || '200',
      onss: co?.matricule_onss || co?.onss,
      vat: co?.vat || co?.bce,
      dimonaP, reason,
    });

    const dimonaRef = `DIM-${Date.now()}`;
    let onssResult = null;
    let mode = 'simulation';

    // Soumission réelle si API ONSS configurée
    if (process.env.ONSS_API_KEY && process.env.ONSS_API_URL) {
      try {
        const resp = await fetch(`${process.env.ONSS_API_URL}/dimona`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.ONSS_API_KEY}`,
            'Content-Type': 'application/xml',
          },
          body: xml,
          signal: AbortSignal.timeout(10000),
        });
        onssResult = await resp.text();
        mode = resp.ok ? 'production_ok' : 'production_error';
      } catch (e) {
        mode = 'production_error';
        onssResult = e.message;
      }
    }

    // Sauvegarder dans Supabase
    const record = {
      user_id: userId,
      employe_id: emp.id,
      employe_niss: emp.niss,
      employe_nom: `${emp.first || emp.prenom || ''} ${emp.last || emp.nom || ''}`.trim(),
      action,
      wtype: wtype || 'OTH',
      start_date: start,
      end_date: end || null,
      hours: hours ? parseFloat(hours) : null,
      cp: emp.cp || emp.commission_paritaire || '200',
      dimona_ref: dimonaRef,
      mode,
      xml_content: xml,
      onss_response: onssResult,
      status: mode === 'production_ok' ? 'submitted' : mode === 'simulation' ? 'simulated' : 'error',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('dimona_declarations')
      .insert(record)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      // On continue même si la sauvegarde échoue
    }

    return NextResponse.json({
      ok: true,
      mode,
      dimonaRef,
      action,
      employe: record.employe_nom,
      startDate: start,
      endDate: end || null,
      status: record.status,
      message: mode === 'simulation'
        ? `✅ Dimona ${action} simulée — Référence: ${dimonaRef}`
        : mode === 'production_ok'
        ? `✅ Dimona ${action} soumise à l'ONSS — Référence: ${dimonaRef}`
        : `⚠️ Dimona ${action} générée mais erreur ONSS — Référence: ${dimonaRef}`,
      xml,
      dbRecord: data || record,
    });

  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

// Récupérer l'historique Dimona
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabaseAdmin
      .from('dimona_declarations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) query = query.eq('user_id', userId);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ ok: true, declarations: data || [] });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
