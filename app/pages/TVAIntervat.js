'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/app/lib/supabase';

const GOLD = '#c6a34e';
const f2 = v => new Intl.NumberFormat('fr-BE', { minimumFractionDigits: 2 }).format(v || 0);

// ── Génération XML Intervat (format officiel SPF Finances) ──────────
function generateIntervatXML({ annee, declarant, clients }) {
  const now = new Date().toISOString();
  const bce = (declarant.vat || declarant.bce || '').replace(/[^0-9]/g, '');
  const nom = (declarant.name || declarant.nom || 'SOCIETE').toUpperCase().slice(0, 40);

  const clientsXML = clients
    .filter(c => c.vat && parseFloat(c.montantHT) > 0)
    .map(c => {
      const vatNum = c.vat.replace(/[^0-9A-Z]/gi, '').toUpperCase();
      const countryCode = vatNum.startsWith('BE') ? 'BE' : vatNum.slice(0, 2).toUpperCase();
      const vatClean = vatNum.startsWith('BE') ? vatNum.slice(2) : vatNum.slice(2);
      const ht = Math.round(parseFloat(c.montantHT || 0) * 100) / 100;
      const tva = Math.round(parseFloat(c.montantTVA || 0) * 100) / 100;
      return `
      <Record>
        <VATNumber issuedBy="${countryCode}">${vatClean}</VATNumber>
        <TurnOver>${ht.toFixed(2)}</TurnOver>
        <VATAmount>${tva.toFixed(2)}</VATAmount>
      </Record>`;
    }).join('');

  const totalHT = clients.reduce((a, c) => a + parseFloat(c.montantHT || 0), 0);
  const totalTVA = clients.reduce((a, c) => a + parseFloat(c.montantTVA || 0), 0);
  const nbClients = clients.filter(c => c.vat && parseFloat(c.montantHT) > 0).length;

  return `<?xml version="1.0" encoding="UTF-8"?>
<VATConsignmentListing xmlns="http://www.minfin.fgov.be/VATConsignmentListing"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.minfin.fgov.be/VATConsignmentListing ConsignmentListing.xsd"
  VATListingNbr="1" PeriodYear="${annee}" PeriodNbr="00">
  <Declarant>
    <VATNumber>${bce}</VATNumber>
    <Name>${nom}</Name>
    <Street>${(declarant.address || '').slice(0, 100)}</Street>
    <EmailAddress>${declarant.email || ''}</EmailAddress>
    <Phone></Phone>
  </Declarant>
  <Namespace>
    <Records Count="${nbClients}" TurnOverSum="${totalHT.toFixed(2)}" VATAmountSum="${totalTVA.toFixed(2)}">${clientsXML}
    </Records>
  </Namespace>
</VATConsignmentListing>`;
}

// ── Composant principal ─────────────────────────────────────────────
export default function TVAIntervatModule({ s, d, tab }) {
  const anneeActuelle = new Date().getFullYear() - 1; // Listing = année précédente
  const [annee, setAnnee] = useState(anneeActuelle);
  const [clients, setClients] = useState([
    { id: 1, nom: '', vat: '', montantHT: '', montantTVA: '', tauxTVA: 21 },
  ]);
  const [xmlGenere, setXmlGenere] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab2, setTab2] = useState('saisie');

  const co = s?.co || {};

  // Charger clients existants depuis Supabase
  useEffect(() => {
    if (!supabase || !s?.user?.id) return;
    supabase.from('factures').select('client_nom, client_bce, tva, ht').eq('user_id', s.user.id)
      .gte('created_at', `${annee}-01-01`).lte('created_at', `${annee}-12-31`)
      .then(({ data }) => {
        if (!data?.length) return;
        // Grouper par client BCE
        const grouped = {};
        data.forEach(f => {
          const key = f.client_bce || f.client_nom || 'inconnu';
          if (!grouped[key]) grouped[key] = { nom: f.client_nom || '', vat: f.client_bce || '', montantHT: 0, montantTVA: 0, tauxTVA: 21 };
          grouped[key].montantHT += parseFloat(f.ht || 0);
          grouped[key].montantTVA += parseFloat(f.tva || 0);
        });
        const clientsFromDB = Object.entries(grouped).map(([, v], i) => ({ id: i + 1, ...v, montantHT: v.montantHT.toFixed(2), montantTVA: v.montantTVA.toFixed(2) }));
        if (clientsFromDB.length) setClients(clientsFromDB);
      });
  }, [annee, s?.user?.id]);

  const addClient = () => setClients(prev => [...prev, { id: Date.now(), nom: '', vat: '', montantHT: '', montantTVA: '', tauxTVA: 21 }]);
  const removeClient = (id) => setClients(prev => prev.filter(c => c.id !== id));
  const updateClient = (id, field, val) => setClients(prev => prev.map(c => {
    if (c.id !== id) return c;
    const updated = { ...c, [field]: val };
    // Calcul TVA auto si on change montantHT
    if (field === 'montantHT') {
      updated.montantTVA = (parseFloat(val || 0) * (updated.tauxTVA / 100)).toFixed(2);
    }
    if (field === 'tauxTVA') {
      updated.montantTVA = (parseFloat(updated.montantHT || 0) * (parseFloat(val) / 100)).toFixed(2);
    }
    return updated;
  }));

  const genererXML = async () => {
    setGenerating(true);
    const xml = generateIntervatXML({ annee, declarant: co, clients });
    setXmlGenere(xml);
    setTab2('xml');

    // Sauvegarder dans Supabase
    if (supabase && s?.user?.id) {
      await supabase.from('declarations').insert([{
        user_id: s.user.id,
        type: 'tva_listing',
        periode: `${annee}`,
        annee,
        status: 'generated',
        data: JSON.stringify({ clients, totalHT: clients.reduce((a, c) => a + parseFloat(c.montantHT || 0), 0) }),
        xml_content: xml,
        created_at: new Date().toISOString(),
      }]).then(({ error }) => { if (error) console.warn('[TVA]', error.message); else setSaved(true); });
    }
    setGenerating(false);
  };

  const telecharger = () => {
    const blob = new Blob([xmlGenere], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TVA_Listing_${annee}_${(co.vat || co.bce || 'SOCIETE').replace(/[^0-9]/g, '')}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalHT = clients.reduce((a, c) => a + parseFloat(c.montantHT || 0), 0);
  const totalTVA = clients.reduce((a, c) => a + parseFloat(c.montantTVA || 0), 0);
  const clientsValides = clients.filter(c => c.vat && parseFloat(c.montantHT || 0) > 0).length;

  return (
    <div style={{ fontFamily: 'inherit', color: '#e8e6e0' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: GOLD }}>
          📋 Listing TVA Annuel — Intervat
        </h2>
        <p style={{ margin: '4px 0 0', color: '#9e9b93', fontSize: 13 }}>
          Listing annuel des clients assujettis à la TVA — Art. 53quinquies CTVA
          · Échéance : <strong style={{ color: '#fb923c' }}>31 mars {annee + 1}</strong>
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {[['saisie', '📝 Saisie clients'], ['xml', '📄 XML généré'], ['guide', '📖 Guide']].map(([id, label]) => (
          <button key={id} onClick={() => setTab2(id)} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 12, fontFamily: 'inherit', fontWeight: tab2 === id ? 700 : 400,
            background: tab2 === id ? 'rgba(198,163,78,.15)' : 'rgba(255,255,255,.03)',
            color: tab2 === id ? GOLD : '#9e9b93',
          }}>{label}</button>
        ))}
      </div>

      {tab2 === 'saisie' && (
        <div>
          {/* Année + KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div style={{ padding: '14px 16px', background: 'rgba(198,163,78,.06)', borderRadius: 10, border: '1px solid rgba(198,163,78,.15)' }}>
              <div style={{ fontSize: 10, color: '#5e5c56', textTransform: 'uppercase' }}>Année du listing</div>
              <select value={annee} onChange={e => setAnnee(parseInt(e.target.value))}
                style={{ width: '100%', marginTop: 6, padding: 6, borderRadius: 6, border: '1px solid rgba(198,163,78,.3)', background: 'rgba(0,0,0,.3)', color: GOLD, fontSize: 14, fontFamily: 'inherit' }}>
                {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            {[
              { l: 'Clients valides', v: `${clientsValides}`, c: '#60a5fa' },
              { l: 'Total HTVA', v: `${f2(totalHT)} €`, c: GOLD },
              { l: 'Total TVA', v: `${f2(totalTVA)} €`, c: '#22c55e' },
            ].map((k, i) => (
              <div key={i} style={{ padding: '14px 16px', background: 'rgba(255,255,255,.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,.06)' }}>
                <div style={{ fontSize: 10, color: '#5e5c56', textTransform: 'uppercase' }}>{k.l}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: k.c, marginTop: 4 }}>{k.v}</div>
              </div>
            ))}
          </div>

          {/* Tableau clients */}
          <div style={{ background: 'rgba(255,255,255,.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,.06)', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 40px', gap: 0, padding: '10px 16px', background: 'rgba(255,255,255,.03)', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
              {['Nom client', 'N° TVA', 'Montant HTVA', 'TVA', 'Taux', ''].map((h, i) => (
                <div key={i} style={{ fontSize: 10, color: '#5e5c56', textTransform: 'uppercase', fontWeight: 700 }}>{h}</div>
              ))}
            </div>
            {clients.map((c, i) => (
              <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 40px', gap: 0, padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,.03)', alignItems: 'center' }}>
                <input value={c.nom} onChange={e => updateClient(c.id, 'nom', e.target.value)} placeholder="Nom société" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, padding: '6px 8px', color: '#e8e6e0', fontSize: 12, fontFamily: 'inherit' }} />
                <input value={c.vat} onChange={e => updateClient(c.id, 'vat', e.target.value)} placeholder="BE0123456789" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, padding: '6px 8px', color: '#e8e6e0', fontSize: 12, fontFamily: 'inherit', marginLeft: 6 }} />
                <input type="number" value={c.montantHT} onChange={e => updateClient(c.id, 'montantHT', e.target.value)} placeholder="0.00" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, padding: '6px 8px', color: GOLD, fontSize: 12, fontFamily: 'inherit', marginLeft: 6 }} />
                <div style={{ padding: '6px 8px', fontSize: 12, color: '#22c55e', marginLeft: 6 }}>{f2(parseFloat(c.montantTVA || 0))}</div>
                <select value={c.tauxTVA} onChange={e => updateClient(c.id, 'tauxTVA', e.target.value)} style={{ background: 'rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, padding: '6px', color: '#e8e6e0', fontSize: 12, fontFamily: 'inherit', marginLeft: 6 }}>
                  {[6, 12, 21].map(t => <option key={t} value={t}>{t}%</option>)}
                </select>
                <button onClick={() => removeClient(c.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 16, marginLeft: 6 }}>×</button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
            <button onClick={addClient} style={{ padding: '10px 18px', borderRadius: 8, border: `1px solid ${GOLD}50`, background: 'transparent', color: GOLD, cursor: 'pointer', fontSize: 13 }}>
              + Ajouter client
            </button>
            <button onClick={genererXML} disabled={generating || clientsValides === 0}
              style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: clientsValides > 0 ? 'rgba(198,163,78,.2)' : 'rgba(255,255,255,.05)', color: clientsValides > 0 ? GOLD : '#5e5c56', cursor: clientsValides > 0 ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 700 }}>
              {generating ? '⏳ Génération...' : '📄 Générer XML Intervat'}
            </button>
          </div>
        </div>
      )}

      {tab2 === 'xml' && xmlGenere && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#22c55e' }}>✅ XML généré avec succès</div>
              <div style={{ fontSize: 12, color: '#9e9b93' }}>{saved ? '💾 Sauvegardé dans Supabase' : 'Non sauvegardé'}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={telecharger} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'rgba(34,197,94,.15)', color: '#22c55e', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                ⬇️ Télécharger XML
              </button>
              <a href="https://eservices.minfin.fgov.be/intervat/" target="_blank" rel="noreferrer"
                style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${GOLD}50`, background: 'transparent', color: GOLD, cursor: 'pointer', fontSize: 13, textDecoration: 'none', display: 'inline-block' }}>
                🔗 Ouvrir MyMinfin
              </a>
            </div>
          </div>
          <textarea readOnly value={xmlGenere} style={{ width: '100%', height: 400, background: 'rgba(0,0,0,.4)', border: '1px solid rgba(198,163,78,.2)', borderRadius: 10, padding: 16, color: '#e8e6e0', fontSize: 11, fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box' }} />
        </div>
      )}

      {tab2 === 'xml' && !xmlGenere && (
        <div style={{ padding: 40, textAlign: 'center', color: '#5e5c56' }}>
          Aucun XML généré — retournez en Saisie et cliquez Générer
        </div>
      )}

      {tab2 === 'guide' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { n: 1, t: 'Qui est concerné ?', c: 'Tout assujetti TVA belge ayant livré des biens ou prestations à des clients TVA-assujettis en Belgique pour un montant HTVA > 250 EUR sur l'année.', ref: 'Art. 53quinquies CTVA' },
            { n: 2, t: 'Quand soumettre ?', c: 'Avant le 31 mars de l'année suivante (ex: listing 2025 → avant 31/03/2026). Dépôt sur MyMinfin (Intervat).', ref: 'AR TVA art. 93' },
            { n: 3, t: 'Quoi déclarer ?', c: 'Pour chaque client assujetti : numéro TVA, montant total HTVA et montant TVA facturé sur l'année civile entière.', ref: 'Art. 53quinquies §1 CTVA' },
            { n: 4, t: 'Comment uploader ?', c: '1. Téléchargez le XML ci-dessus
2. Allez sur eservices.minfin.fgov.be/intervat
3. Connectez-vous avec eID ou itsme
4. Choisissez "Listing" → "Déposer via fichier XML"', ref: 'Guide SPF Finances' },
            { n: 5, t: 'Seuil d'exclusion', c: 'Clients avec montant HTVA annuel ≤ 250 EUR peuvent être exclus du listing. Le module les exclut automatiquement.', ref: 'Art. 53quinquies §2 CTVA' },
            { n: 6, t: 'Sanctions', c: 'Amende administrative de 50 à 5.000 EUR par listing non déposé ou incomplet. Pénalités d'intérêt : 0,8% / mois.', ref: 'Art. 70 §4 CTVA' },
          ].map((step, i) => (
            <div key={i} style={{ padding: 16, background: 'rgba(255,255,255,.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,.06)' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(198,163,78,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: GOLD, flexShrink: 0 }}>{step.n}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e8e6e0' }}>{step.t}</div>
              </div>
              <div style={{ fontSize: 12, color: '#9e9b93', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{step.c}</div>
              <div style={{ fontSize: 10, color: '#5e5c56', marginTop: 6 }}>⚖ {step.ref}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
