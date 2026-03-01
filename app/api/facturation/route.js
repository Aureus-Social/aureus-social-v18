// Aureus Social Pro — API Facturation Cabinet
// POST /api/facturation — Generer/lister/mettre a jour les factures fiduciaire > client
// GET  /api/facturation — Lister les factures

import { NextResponse } from 'next/server';

function getAuthToken(request) {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const { createClient } = require('@supabase/supabase-js');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// ═══ GRILLE TARIFAIRE PAR DEFAUT ═══
const GRILLE_DEFAUT = {
  forfait_base: 150,        // EUR/mois par client
  cout_par_fiche: 12,       // EUR/fiche de paie
  cout_dimona: 5,            // EUR/declaration Dimona
  cout_dmfa: 25,             // EUR/declaration DmfA trimestrielle
  cout_belcotax: 15,         // EUR/fiche Belcotax annuelle
  cout_sepa: 3,              // EUR/fichier SEPA
  cout_contrat: 20,          // EUR/contrat genere
  cout_solde_tout_compte: 35,// EUR/solde de tout compte
  remise_volume_seuil: 50,   // Nb employes pour remise
  remise_volume_pct: 10,     // % de remise au-dela du seuil
};

function genererNumeroFacture(prefix, date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `${prefix || 'ASP'}-${y}${m}-${seq}`;
}

function calculerFacture(client, period, grille) {
  const g = { ...GRILLE_DEFAUT, ...grille };
  const emps = client.emps || [];
  const nbFiches = emps.length;
  const nbDimona = client.dimonas || 0;
  const nbDmfa = period.trimestre ? 1 : 0;
  const nbBelcotax = period.annuel ? emps.length : 0;
  const nbSepa = period.sepa || 0;
  const nbContrats = client.contrats || 0;
  const nbSTC = client.stc || 0;

  const lignes = [];

  // Forfait mensuel
  lignes.push({
    description: 'Forfait gestion mensuelle',
    quantite: 1,
    prix_unitaire: g.forfait_base,
    montant: g.forfait_base,
  });

  // Fiches de paie
  if (nbFiches > 0) {
    lignes.push({
      description: `Fiches de paie (${nbFiches} employes)`,
      quantite: nbFiches,
      prix_unitaire: g.cout_par_fiche,
      montant: nbFiches * g.cout_par_fiche,
    });
  }

  // Dimona
  if (nbDimona > 0) {
    lignes.push({
      description: `Declarations Dimona`,
      quantite: nbDimona,
      prix_unitaire: g.cout_dimona,
      montant: nbDimona * g.cout_dimona,
    });
  }

  // DmfA trimestrielle
  if (nbDmfa > 0) {
    lignes.push({
      description: `Declaration DmfA trimestrielle`,
      quantite: nbDmfa,
      prix_unitaire: g.cout_dmfa,
      montant: nbDmfa * g.cout_dmfa,
    });
  }

  // Belcotax annuel
  if (nbBelcotax > 0) {
    lignes.push({
      description: `Fiches Belcotax 281.10 annuelles`,
      quantite: nbBelcotax,
      prix_unitaire: g.cout_belcotax,
      montant: nbBelcotax * g.cout_belcotax,
    });
  }

  // SEPA
  if (nbSepa > 0) {
    lignes.push({
      description: `Fichiers SEPA pain.001`,
      quantite: nbSepa,
      prix_unitaire: g.cout_sepa,
      montant: nbSepa * g.cout_sepa,
    });
  }

  // Contrats
  if (nbContrats > 0) {
    lignes.push({
      description: `Contrats de travail generes`,
      quantite: nbContrats,
      prix_unitaire: g.cout_contrat,
      montant: nbContrats * g.cout_contrat,
    });
  }

  // Solde de tout compte
  if (nbSTC > 0) {
    lignes.push({
      description: `Soldes de tout compte`,
      quantite: nbSTC,
      prix_unitaire: g.cout_solde_tout_compte,
      montant: nbSTC * g.cout_solde_tout_compte,
    });
  }

  let sousTotal = lignes.reduce((s, l) => s + l.montant, 0);

  // Remise volume
  let remise = 0;
  if (nbFiches >= g.remise_volume_seuil) {
    remise = Math.round(sousTotal * g.remise_volume_pct / 100 * 100) / 100;
    lignes.push({
      description: `Remise volume (${g.remise_volume_pct}% — ${nbFiches} employes)`,
      quantite: 1,
      prix_unitaire: -remise,
      montant: -remise,
    });
    sousTotal -= remise;
  }

  const tva = Math.round(sousTotal * 0.21 * 100) / 100;
  const total = Math.round((sousTotal + tva) * 100) / 100;

  return {
    lignes,
    sous_total: sousTotal,
    tva_pct: 21,
    tva_montant: tva,
    total_ttc: total,
    remise,
    nb_employes: nbFiches,
  };
}

export async function POST(request) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action = 'generate', client, period, grille, invoice_id } = body;

    if (action === 'generate') {
      // Generer une facture
      if (!client || !period) {
        return NextResponse.json({ error: 'Client et periode requis' }, { status: 400 });
      }

      const now = new Date();
      const numero = genererNumeroFacture('ASP', now);
      const calcul = calculerFacture(client, period, grille);

      const facture = {
        numero,
        date_emission: now.toISOString().split('T')[0],
        date_echeance: new Date(now.setDate(now.getDate() + 30)).toISOString().split('T')[0],
        client_id: client.id || null,
        client_nom: client.company?.name || client.name || '',
        client_vat: client.company?.vat || client.vat || '',
        client_addr: client.company?.addr || client.addr || '',
        periode: `${period.month || ''}/${period.year || ''}`,
        ...calcul,
        statut: 'emise',
        emetteur: {
          nom: 'Aureus IA SPRL',
          vat: 'BE 1028.230.781',
          addr: 'Saint-Gilles, Bruxelles',
          iban: process.env.AUREUS_IBAN || '',
          bic: process.env.AUREUS_BIC || '',
        },
        communication: `+++${numero.replace(/[^0-9]/g, '').slice(0, 10).padEnd(10, '0')}+++`,
      };

      // Sauvegarder en BDD si Supabase disponible
      const sb = getSupabase();
      if (sb) {
        await sb.from('invoices').insert({
          numero: facture.numero,
          client_id: facture.client_id,
          client_nom: facture.client_nom,
          date_emission: facture.date_emission,
          date_echeance: facture.date_echeance,
          sous_total: facture.sous_total,
          tva_montant: facture.tva_montant,
          total_ttc: facture.total_ttc,
          statut: facture.statut,
          periode: facture.periode,
          lignes: facture.lignes,
          created_at: new Date().toISOString(),
        });
      }

      return NextResponse.json({ success: true, facture });
    }

    if (action === 'list') {
      // Lister les factures
      const sb = getSupabase();
      if (!sb) {
        return NextResponse.json({ error: 'Base de donnees non configuree' }, { status: 503 });
      }

      let query = sb.from('invoices').select('*').order('created_at', { ascending: false });
      if (body.client_id) query = query.eq('client_id', body.client_id);
      if (body.statut) query = query.eq('statut', body.statut);
      if (body.limit) query = query.limit(body.limit);

      const { data, error } = await query;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      return NextResponse.json({ success: true, factures: data || [] });
    }

    if (action === 'update_status') {
      // Mettre a jour le statut d'une facture (emise > envoyee > payee > annulee)
      if (!invoice_id || !body.statut) {
        return NextResponse.json({ error: 'invoice_id et statut requis' }, { status: 400 });
      }
      const validStatuts = ['emise', 'envoyee', 'payee', 'annulee', 'en_retard'];
      if (!validStatuts.includes(body.statut)) {
        return NextResponse.json({ error: `Statut invalide. Valeurs: ${validStatuts.join(', ')}` }, { status: 400 });
      }

      const sb = getSupabase();
      if (!sb) {
        return NextResponse.json({ error: 'Base de donnees non configuree' }, { status: 503 });
      }

      const updates = { statut: body.statut, updated_at: new Date().toISOString() };
      if (body.statut === 'payee') updates.date_paiement = body.date_paiement || new Date().toISOString().split('T')[0];

      const { error } = await sb.from('invoices').update(updates).eq('numero', invoice_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      return NextResponse.json({ success: true, numero: invoice_id, statut: body.statut });
    }

    if (action === 'grille') {
      // Retourner la grille tarifaire (pour affichage dans l'UI)
      return NextResponse.json({ success: true, grille: { ...GRILLE_DEFAUT, ...grille } });
    }

    return NextResponse.json({ error: 'Action inconnue. Utilisez: generate, list, update_status, grille' }, { status: 400 });

  } catch (error) {
    console.error('[FACTURATION-ERROR]', error.message);
    return NextResponse.json({ error: 'Erreur interne facturation' }, { status: 500 });
  }
}

export async function GET(request) {
  const token = getAuthToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Retourner la grille tarifaire et les stats
  const sb = getSupabase();
  let stats = { total_factures: 0, total_emises: 0, total_payees: 0, ca_total: 0 };

  if (sb) {
    const { data } = await sb.from('invoices').select('statut, total_ttc');
    if (data) {
      stats.total_factures = data.length;
      stats.total_emises = data.filter(f => f.statut === 'emise' || f.statut === 'envoyee').length;
      stats.total_payees = data.filter(f => f.statut === 'payee').length;
      stats.ca_total = data.filter(f => f.statut === 'payee').reduce((s, f) => s + (f.total_ttc || 0), 0);
    }
  }

  return NextResponse.json({
    grille: GRILLE_DEFAUT,
    stats,
    actions: ['generate', 'list', 'update_status', 'grille'],
  });
}
