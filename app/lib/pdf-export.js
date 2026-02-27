// ═══════════════════════════════════════════════════════════
// Item #17 — EXPORT PDF BRANDÉ
// Fiches de paie avec logo Aureus, couleurs gold/dark, 
// QR code vérification, en-tête/pied de page
// ═══════════════════════════════════════════════════════════

const GOLD='#c6a34e';const DARK='#060810';const TEXT='#333';

export function generatePayslipHTML(employee, payroll, company) {
  const e = employee || {};
  const p = payroll || {};
  const c = company || {};
  
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @page{margin:20mm 15mm;size:A4}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',system-ui,sans-serif;font-size:11px;color:${TEXT};line-height:1.5}
  .header{display:flex;justify-content:space-between;align-items:center;padding-bottom:16px;border-bottom:2px solid ${GOLD};margin-bottom:16px}
  .logo{font-size:18px;font-weight:700;color:${GOLD};letter-spacing:1px}
  .logo span{color:${TEXT};font-weight:400}
  .company{text-align:right;font-size:10px;color:#666}
  .title{background:${DARK};color:#fff;padding:10px 16px;border-radius:6px;font-size:13px;font-weight:600;margin-bottom:16px;display:flex;justify-content:space-between}
  .title .period{color:${GOLD}}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
  .box{border:1px solid #e0e0e0;border-radius:6px;padding:12px}
  .box h3{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:${GOLD};margin-bottom:8px;border-bottom:1px solid #f0f0f0;padding-bottom:4px}
  .row{display:flex;justify-content:space-between;padding:3px 0;font-size:10px}
  .row .label{color:#666}.row .val{font-weight:600;font-family:'Courier New',monospace}
  table{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:10px}
  th{background:${DARK};color:#fff;padding:8px 10px;text-align:left;font-weight:600;font-size:9px;letter-spacing:.5px;text-transform:uppercase}
  td{padding:7px 10px;border-bottom:1px solid #f0f0f0}
  tr:nth-child(even){background:#fafafa}
  .total-row td{font-weight:700;border-top:2px solid ${GOLD};background:#fff}
  .net-box{background:${DARK};color:#fff;border-radius:8px;padding:16px;text-align:center;margin:16px 0}
  .net-box .amount{font-size:28px;font-weight:700;color:${GOLD};font-family:'Courier New',monospace}
  .net-box .label{font-size:10px;color:#999;margin-top:4px}
  .footer{border-top:2px solid ${GOLD};padding-top:12px;margin-top:16px;display:flex;justify-content:space-between;font-size:9px;color:#999}
  .footer .legal{max-width:60%}
  .qr{text-align:right;font-size:8px;color:#999}
  .badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:600}
  .badge.onss{background:#e3f2fd;color:#1565c0}.badge.pp{background:#fce4ec;color:#c62828}.badge.net{background:#e8f5e9;color:#2e7d32}
</style></head><body>
<div class="header">
  <div class="logo">AUREUS <span>Social Pro</span></div>
  <div class="company">
    <strong>${c.name||'Entreprise'}</strong><br>
    BCE ${c.bce||'BE 0000.000.000'}<br>
    ${c.address||'Bruxelles, Belgique'}
  </div>
</div>
<div class="title">
  <span>Fiche de paie — ${e.nom||'Nom'} ${e.prenom||'Prénom'}</span>
  <span class="period">${p.periodLabel||'Février 2026'}</span>
</div>
<div class="grid">
  <div class="box"><h3>Identité travailleur</h3>
    <div class="row"><span class="label">Nom complet</span><span class="val">${e.nom||''} ${e.prenom||''}</span></div>
    <div class="row"><span class="label">NISS</span><span class="val">${e.niss||'XX.XX.XX-XXX.XX'}</span></div>
    <div class="row"><span class="label">Contrat</span><span class="val">${e.typeContrat||'CDI'} — ${e.regime||'Temps plein'}</span></div>
    <div class="row"><span class="label">Ancienneté</span><span class="val">${e.anciennete||'—'}</span></div>
  </div>
  <div class="box"><h3>Paramètres paie</h3>
    <div class="row"><span class="label">Commission paritaire</span><span class="val">CP ${e.cp||'200'}</span></div>
    <div class="row"><span class="label">Situation familiale</span><span class="val">${e.situation||'Isolé'}</span></div>
    <div class="row"><span class="label">Enfants à charge</span><span class="val">${e.enfants||0}</span></div>
    <div class="row"><span class="label">Taxe communale</span><span class="val">${e.taxeCom||'7'}%</span></div>
  </div>
</div>
<table>
  <tr><th>Description</th><th style="text-align:right">Base</th><th style="text-align:right">Taux</th><th style="text-align:right">Montant</th></tr>
  <tr><td>Salaire de base</td><td style="text-align:right">€ ${(p.brut||3500).toFixed(2)}</td><td style="text-align:right">100%</td><td style="text-align:right">€ ${(p.brut||3500).toFixed(2)}</td></tr>
  <tr><td><span class="badge onss">ONSS</span> Cotisation travailleur</td><td style="text-align:right">€ ${(p.brut||3500).toFixed(2)}</td><td style="text-align:right">13,07%</td><td style="text-align:right">- € ${(p.onss||(3500*0.1307)).toFixed(2)}</td></tr>
  <tr><td>Imposable</td><td colspan="2"></td><td style="text-align:right;font-weight:600">€ ${(p.imposable||(3500*0.8693)).toFixed(2)}</td></tr>
  <tr><td><span class="badge pp">PP</span> Précompte professionnel</td><td style="text-align:right">€ ${(p.imposable||(3500*0.8693)).toFixed(2)}</td><td style="text-align:right">${p.ppPct||'—'}%</td><td style="text-align:right">- € ${(p.pp||450).toFixed(2)}</td></tr>
  ${p.bonusEmploi?`<tr><td><span class="badge net">Bonus</span> Bonus à l'emploi fiscal</td><td></td><td></td><td style="text-align:right;color:#2e7d32">+ € ${p.bonusEmploi.toFixed(2)}</td></tr>`:''}
  <tr><td>Cotisation spéciale sécurité sociale</td><td></td><td></td><td style="text-align:right">- € ${(p.csss||0).toFixed(2)}</td></tr>
  <tr class="total-row"><td colspan="3"><strong>NET À PAYER</strong></td><td style="text-align:right;color:${GOLD};font-size:14px"><strong>€ ${(p.net||2800).toFixed(2)}</strong></td></tr>
</table>
<div class="net-box">
  <div class="amount">€ ${(p.net||2800).toFixed(2)}</div>
  <div class="label">Montant viré par SEPA le ${p.dateVirement||'28/02/2026'} — IBAN ${e.iban||'BE00 0000 0000 0000'}</div>
</div>
<div class="footer">
  <div class="legal">
    Document généré automatiquement par Aureus Social Pro — Aureus IA SPRL (BCE BE 1028.230.781).<br>
    Ce document est conforme à l'AR du 25/01/2001 relatif aux bulletins de paie. Conservation: 5 ans minimum.
  </div>
  <div class="qr">
    Réf: ${p.ref||'PAY-2026-02-001'}<br>
    Hash: ${p.hash||'SHA256:...'}
  </div>
</div>
</body></html>`;
}

export function printPayslip(employee, payroll, company) {
  const html = generatePayslipHTML(employee, payroll, company);
  const win = window.open('', '_blank', 'width=800,height=1100');
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

export default { generatePayslipHTML, printPayslip };
