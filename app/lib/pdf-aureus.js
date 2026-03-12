// ═══ AUREUS SOCIAL PRO — Générateur PDF Fiche de Paie ═══
// Utilise jsPDF (CDN) — RGPD compliant — Génération côté client

const GOLD = [198, 163, 78];
const DARK = [10, 9, 8];
const GREY = [94, 92, 86];
const LIGHT = [232, 230, 224];
const WHITE = [255, 255, 255];
const GREEN = [34, 197, 94];
const RED = [239, 68, 68];

async function loadJsPDF() {
  if (typeof window === 'undefined') return null;
  if (window.jspdf?.jsPDF) return window.jspdf.jsPDF;
  if (window.jsPDF) return window.jsPDF;
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload = () => resolve(window.jspdf?.jsPDF || window.jsPDF);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function fmtEur(n) {
  return new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

function f2(n) {
  return (Math.round((n || 0) * 100) / 100).toFixed(2);
}

// ─── Générateur principal fiche de paie ───
export async function generatePayslipPDF(emp, payslip, periode, co) {
  if (typeof window === 'undefined') return;

  const JsPDF = await loadJsPDF();
  if (!JsPDF) { alert('Erreur chargement jsPDF'); return; }

  const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, H = 297;
  const ml = 15, mr = 15, mt = 15;
  let y = mt;

  const addPage = () => { doc.addPage(); y = mt; };
  const checkY = (needed = 8) => { if (y + needed > H - 20) addPage(); };

  // ─── HEADER ───
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, 32, 'F');

  doc.setFillColor(...GOLD);
  doc.rect(0, 32, W, 1.5, 'F');

  doc.setTextColor(...GOLD);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('AUREUS SOCIAL PRO', ml, 14);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...LIGHT);
  doc.text('Secrétariat Social Digital — BCE BE 1028.230.781', ml, 21);
  doc.text('app.aureussocial.be', ml, 27);

  doc.setTextColor(...GOLD);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('FICHE DE PAIE', W - mr, 14, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...LIGHT);
  const mois = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const per = periode || new Date();
  const perLabel = typeof per === 'string' ? per : `${mois[new Date(per).getMonth()]} ${new Date(per).getFullYear()}`;
  doc.text(`Période: ${perLabel}`, W - mr, 21, { align: 'right' });
  doc.text(`Généré le: ${new Date().toLocaleDateString('fr-BE')}`, W - mr, 27, { align: 'right' });

  y = 42;

  // ─── BLOC EMPLOYEUR / EMPLOYÉ ───
  const colW = (W - ml - mr - 6) / 2;

  // Employeur
  doc.setFillColor(20, 18, 14);
  doc.roundedRect(ml, y, colW, 36, 2, 2, 'F');
  doc.setTextColor(...GOLD);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('EMPLOYEUR', ml + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...LIGHT);
  doc.setFontSize(9);
  doc.text(co?.name || co?.nom || 'Aureus IA SPRL', ml + 4, y + 13);
  doc.setFontSize(7);
  doc.setTextColor(...GREY);
  doc.text(`BCE: ${co?.vat || co?.bce || 'BE 1028.230.781'}`, ml + 4, y + 19);
  doc.text(co?.adresse || 'Place Marcel Broodthaers 8', ml + 4, y + 24);
  doc.text(`${co?.cp || '1060'} ${co?.ville || 'Saint-Gilles'}`, ml + 4, y + 29);
  if (co?.matricule_onss) doc.text(`ONSS: ${co.matricule_onss}`, ml + 4, y + 34);

  // Employé
  const ex = ml + colW + 6;
  doc.setFillColor(20, 18, 14);
  doc.roundedRect(ex, y, colW, 36, 2, 2, 'F');
  doc.setTextColor(...GOLD);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('TRAVAILLEUR', ex + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...LIGHT);
  doc.setFontSize(9);
  const empName = `${emp?.prenom || emp?.first || ''} ${emp?.nom || emp?.last || ''}`.trim();
  doc.text(empName || 'Travailleur', ex + 4, y + 13);
  doc.setFontSize(7);
  doc.setTextColor(...GREY);
  doc.text(`NISS: ${emp?.niss || '—'}`, ex + 4, y + 19);
  doc.text(`CP: ${emp?.commission_paritaire || emp?.cp || '200'}`, ex + 4, y + 24);
  doc.text(`Type: ${emp?.type_employe === 'ouvrier' ? 'Ouvrier' : 'Employé'}`, ex + 4, y + 29);
  if (emp?.date_entree) doc.text(`Entrée: ${emp.date_entree}`, ex + 4, y + 34);

  y += 44;

  // ─── Fonction ligne tableau ───
  const row = (label, value, opts = {}) => {
    checkY(7);
    if (opts.header) {
      doc.setFillColor(...GOLD);
      doc.rect(ml, y, W - ml - mr, 7, 'F');
      doc.setTextColor(...DARK);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(label, ml + 3, y + 5);
      y += 8;
      return;
    }
    if (opts.subheader) {
      doc.setFillColor(25, 22, 16);
      doc.rect(ml, y, W - ml - mr, 6, 'F');
      doc.setTextColor(...GOLD);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(label, ml + 3, y + 4.5);
      y += 7;
      return;
    }
    const bg = opts.alt ? [18, 16, 12] : [14, 13, 10];
    doc.setFillColor(...bg);
    doc.rect(ml, y, W - ml - mr, 6, 'F');
    doc.setTextColor(...(opts.highlight ? GOLD : LIGHT));
    doc.setFontSize(7.5);
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    doc.text(label, ml + 3, y + 4.5);
    if (value !== undefined) {
      doc.setTextColor(...(opts.valueColor || (opts.negative ? RED : opts.highlight ? GOLD : LIGHT)));
      doc.text(String(value), W - mr - 3, y + 4.5, { align: 'right' });
    }
    if (opts.sub) {
      doc.setTextColor(...GREY);
      doc.setFontSize(6.5);
      doc.text(opts.sub, ml + 3, y + 8);
    }
    y += opts.sub ? 9 : 7;
  };

  // ─── RÉMUNÉRATION BRUTE ───
  const brut = +(payslip?.gross || payslip?.brut || emp?.monthlySalary || emp?.salaire_brut || 0);
  const onssW = +(payslip?.onssNet || payslip?.onss_travailleur || Math.round(brut * 0.1307 * 100) / 100);
  const pp = +(payslip?.pp || payslip?.precompte || 0);
  const net = +(payslip?.net || (brut - onssW - pp));
  const onssE = +(payslip?.onssEmp || Math.round(brut * 0.2507 * 100) / 100);
  const coutTotal = brut + onssE;

  // Avantages
  const chequeRepas = +(emp?.cheque_repas || payslip?.chequeRepas || 0);
  const forfBureau = +(emp?.forf_bureau || payslip?.forfBureau || 0);
  const ecoVoucher = +(emp?.eco_voucher || 0);

  row('RÉMUNÉRATION', undefined, { header: true });
  row('Salaire mensuel brut', fmtEur(brut), { alt: false, bold: true, highlight: true });
  if (payslip?.heures || emp?.heures) row('Heures prestées', `${payslip?.heures || emp?.heures || 38}h/sem`, { alt: true });
  if (payslip?.joursPrestes) row('Jours prestés', `${payslip.joursPrestes} jours`, { alt: false });
  if (payslip?.primes && payslip.primes > 0) row('Primes & accessoires', fmtEur(payslip.primes), { alt: true });

  y += 2;
  row('COTISATIONS ONSS TRAVAILLEUR', undefined, { subheader: true });
  row(`ONSS salarié (13,07%)`, `-${fmtEur(onssW)}`, { alt: false, negative: true });
  const brutOnss = parseFloat((brut - onssW).toFixed(2));
  row('Brut imposable', fmtEur(brutOnss), { alt: true, bold: true });

  if (payslip?.bonusEmploi && payslip.bonusEmploi > 0) {
    y += 2;
    row('RÉDUCTIONS FISCALES', undefined, { subheader: true });
    row('Bonus emploi (art. 2759 CIR)', `-${fmtEur(payslip.bonusEmploi)}`, { alt: false, valueColor: GREEN });
  }

  y += 2;
  row('PRÉCOMPTE PROFESSIONNEL', undefined, { subheader: true });
  row('Précompte professionnel (PP)', `-${fmtEur(pp)}`, { alt: false, negative: true });

  // Avantages extralégaux
  if (chequeRepas > 0 || forfBureau > 0 || ecoVoucher > 0) {
    y += 2;
    row('AVANTAGES EXTRALÉGAUX', undefined, { subheader: true });
    if (chequeRepas > 0) row('Chèques-repas (hors PP)', fmtEur(chequeRepas), { alt: false, valueColor: GREEN });
    if (forfBureau > 0) row('Forfait bureau (hors SS)', fmtEur(forfBureau), { alt: true, valueColor: GREEN });
    if (ecoVoucher > 0) row('Eco-vouchers', fmtEur(ecoVoucher), { alt: false, valueColor: GREEN });
  }

  // ─── NET À PAYER ───
  y += 3;
  checkY(12);
  doc.setFillColor(...GOLD);
  doc.roundedRect(ml, y, W - ml - mr, 12, 2, 2, 'F');
  doc.setTextColor(...DARK);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('NET À PAYER', ml + 4, y + 8);
  doc.setFontSize(13);
  doc.text(fmtEur(net), W - mr - 4, y + 8, { align: 'right' });
  y += 16;

  if (emp?.iban) {
    doc.setTextColor(...GREY);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`Virement sur: ${emp.iban}`, ml, y);
    y += 6;
  }

  // ─── COÛT EMPLOYEUR ───
  y += 2;
  row('RÉCAPITULATIF COÛT EMPLOYEUR', undefined, { header: true });
  row('Salaire brut', fmtEur(brut), { alt: false });
  row('ONSS patronal (25,07%)', fmtEur(onssE), { alt: true });
  if (payslip?.cotisationSpeciale) row('Cotisation spéciale sécurité sociale', fmtEur(payslip.cotisationSpeciale), { alt: false });
  row('COÛT TOTAL EMPLOYEUR', fmtEur(coutTotal), { alt: true, bold: true, highlight: true });

  // Vacances pécule
  const pv = Math.round(brut * 0.1523 * 100) / 100;
  row(`Pécule vacances provisionné (15,23%)`, fmtEur(pv), { alt: false });

  // ─── DONNÉES LÉGALES ───
  y += 4;
  checkY(20);
  row('RÉFÉRENCES LÉGALES', undefined, { header: true });
  row('Loi du 03/07/1978 — Contrats de travail', '', { alt: false });
  row('Loi du 27/06/1969 — Sécurité sociale (ONSS)', '', { alt: true });
  row('CIR 1992 — Précompte professionnel', '', { alt: false });
  row(`CP ${emp?.commission_paritaire || emp?.cp || '200'} — Convention collective applicable`, '', { alt: true });

  // ─── FOOTER ───
  const footerY = H - 18;
  doc.setFillColor(...DARK);
  doc.rect(0, footerY, W, 18, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(0, footerY, W, 0.8, 'F');

  doc.setTextColor(...GREY);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Document confidentiel — Destiné exclusivement au travailleur mentionné ci-dessus.', ml, footerY + 5);
  doc.text('Aureus IA SPRL · BCE BE 1028.230.781 · Place Marcel Broodthaers 8, 1060 Saint-Gilles · info@aureus-ia.com', ml, footerY + 9);
  doc.text(`Généré par Aureus Social Pro · ${new Date().toLocaleDateString('fr-BE')} ${new Date().toLocaleTimeString('fr-BE')}`, ml, footerY + 13);

  doc.setTextColor(...GOLD);
  doc.text('app.aureussocial.be', W - mr, footerY + 9, { align: 'right' });

  // Numéro de page
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setTextColor(...GREY);
    doc.setFontSize(6);
    doc.text(`Page ${i}/${pageCount}`, W - mr, footerY + 13, { align: 'right' });
  }

  // ─── Téléchargement ───
  const fileName = `fiche-paie_${(emp?.nom || emp?.last || 'employe').toLowerCase()}_${perLabel.replace(' ', '-')}.pdf`;
  doc.save(fileName);
  return { success: true, fileName };
}

// ─── PDF générique (titres + sections) ───
export async function aureuspdf(title, sections, opts = {}) {
  if (typeof window === 'undefined') return;
  const JsPDF = await loadJsPDF();
  if (!JsPDF) { alert('Erreur chargement jsPDF'); return; }

  const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, ml = 15, mr = 15;
  let y = 15;

  // Header
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, 28, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(0, 28, W, 1, 'F');
  doc.setTextColor(...GOLD);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('AUREUS SOCIAL PRO', ml, 12);
  doc.setFontSize(10);
  doc.setTextColor(...LIGHT);
  doc.text(title, ml, 22);
  y = 38;

  sections?.forEach(sec => {
    doc.setFillColor(...GOLD);
    doc.rect(ml, y, W - ml - mr, 7, 'F');
    doc.setTextColor(...DARK);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(sec.title || '', ml + 3, y + 5);
    y += 10;

    sec.items?.forEach((item, i) => {
      doc.setFillColor(i % 2 === 0 ? 14 : 20, i % 2 === 0 ? 13 : 18, i % 2 === 0 ? 10 : 14);
      doc.rect(ml, y, W - ml - mr, 6, 'F');
      doc.setTextColor(...LIGHT);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text(String(item.label || ''), ml + 3, y + 4.5);
      doc.text(String(item.value || ''), W - mr - 3, y + 4.5, { align: 'right' });
      y += 7;
    });
    y += 4;
  });

  doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

export function generateSEPAXML(payments, co) {
  const now = new Date();
  const msgId = `AUREUS-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${Math.random().toString(36).substr(2,6).toUpperCase()}`;
  const total = payments.reduce((a, p) => a + (p.amount || 0), 0);

  const txs = payments.map(p => `
    <CdtTrfTxInf>
      <PmtId><EndToEndId>${p.id || msgId}</EndToEndId></PmtId>
      <Amt><InstdAmt Ccy="EUR">${p.amount.toFixed(2)}</InstdAmt></Amt>
      <Cdtr><Nm>${p.name}</Nm></Cdtr>
      <CdtrAcct><Id><IBAN>${p.iban}</IBAN></Id></CdtrAcct>
      <RmtInf><Ustrd>Salaire ${p.periode || now.toISOString().slice(0,7)}</Ustrd></RmtInf>
    </CdtTrfTxInf>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${msgId}</MsgId>
      <CreDtTm>${now.toISOString()}</CreDtTm>
      <NbOfTxs>${payments.length}</NbOfTxs>
      <CtrlSum>${total.toFixed(2)}</CtrlSum>
      <InitgPty><Nm>${co?.name || 'Aureus IA SPRL'}</Nm></InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${msgId}-1</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <PmtTpInf><SvcLvl><Cd>SEPA</Cd></SvcLvl></PmtTpInf>
      <ReqdExctnDt>${now.toISOString().slice(0,10)}</ReqdExctnDt>
      <Dbtr><Nm>${co?.name || 'Aureus IA SPRL'}</Nm></Dbtr>
      <DbtrAcct><Id><IBAN>${co?.iban || 'BE00000000000000'}</IBAN></Id></DbtrAcct>
      ${txs}
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;
}

export function previewHTML(html, title) {
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); }
}
