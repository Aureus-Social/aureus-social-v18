// ═══ AUREUS SOCIAL PRO — Generateur PDF Brande ═══
// Extrait du monolithe pour reutilisation dans les modules
"use client";

const _jsPDFLoaded = { v: false, p: null };

export function loadJsPDF() {
  if (_jsPDFLoaded.v) return Promise.resolve();
  if (_jsPDFLoaded.p) return _jsPDFLoaded.p;
  _jsPDFLoaded.p = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload = () => { _jsPDFLoaded.v = true; res(); };
    s.onerror = () => rej(new Error('jsPDF load failed'));
    document.head.appendChild(s);
  });
  return _jsPDFLoaded.p;
}

export async function aureuspdf(title, sections, options) {
  options = options || {};
  await loadJsPDF();
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, H = 297, ML = 20, MR = 20, MT = 20, MB = 20;
  const pw = W - ML - MR;
  let y = MT;

  const addHeader = () => {
    pdf.setFillColor(6, 8, 16); pdf.rect(0, 0, W, 45, 'F');
    pdf.setFillColor(198, 163, 78); pdf.rect(0, 44, W, 1.5, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(22); pdf.setTextColor(198, 163, 78); pdf.text('AUREUS', ML, 20);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(158, 155, 147); pdf.text('SOCIAL PRO', ML + 38, 20);
    pdf.setFontSize(9); pdf.setTextColor(232, 230, 224); pdf.text(title, ML, 30);
    pdf.setFontSize(7); pdf.setTextColor(158, 155, 147);
    var now = new Date();
    pdf.text('Date: ' + now.toLocaleDateString('fr-BE') + ' | Ref: ASP-' + now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(Math.floor(Math.random() * 9000 + 1000)), ML, 37);
    if (options.enterprise) { pdf.text(String(options.enterprise), W - MR - pdf.getTextWidth(String(options.enterprise)), 37); }
    y = 55;
  };

  var addFooter = function (pn, tp) {
    pdf.setFillColor(198, 163, 78); pdf.rect(0, H - 12, W, 0.5, 'F');
    pdf.setFontSize(7); pdf.setTextColor(158, 155, 147);
    pdf.text('Aureus Social Pro | Aureus IA SPRL (BCE BE 1028.230.781)', ML, H - 6);
    pdf.text('Page ' + pn + '/' + tp, W - MR - 15, H - 6);
  };

  var checkPage = function (needed) {
    if (y + needed > H - MB - 15) { pdf.addPage(); addHeader(); return true; }
    return false;
  };

  addHeader();

  (sections || []).forEach(function (sec) {
    if (sec.type === 'title') {
      checkPage(12); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(14); pdf.setTextColor(198, 163, 78); pdf.text(sec.text || '', ML, y); y += 8;
    } else if (sec.type === 'subtitle') {
      checkPage(10); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(232, 230, 224); pdf.text(sec.text || '', ML, y); y += 6;
    } else if (sec.type === 'text') {
      var lines = pdf.splitTextToSize(sec.text || '', pw);
      lines.forEach(function (line) {
        checkPage(5); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(sec.size || 9);
        if (sec.color) { pdf.setTextColor(sec.color[0], sec.color[1], sec.color[2]); } else { pdf.setTextColor(232, 230, 224); }
        pdf.text(line, ML, y); y += 4.5;
      });
    } else if (sec.type === 'line') {
      checkPage(4); pdf.setDrawColor(198, 163, 78); pdf.setLineWidth(0.3); pdf.line(ML, y, W - MR, y); y += 4;
    } else if (sec.type === 'space') {
      y += (sec.h || 6);
    } else if (sec.type === 'kv') {
      checkPage(6); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(158, 155, 147); pdf.text((sec.k || '') + ':', ML, y);
      pdf.setFont('helvetica', 'normal'); pdf.setTextColor(232, 230, 224); pdf.text(String(sec.v || ''), ML + 50, y); y += 5;
    } else if (sec.type === 'article') {
      checkPage(8); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(198, 163, 78); pdf.text(sec.num || '', ML, y);
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(232, 230, 224);
      var artLines = pdf.splitTextToSize(sec.text || '', pw - 5);
      artLines.forEach(function (line, i) { if (i > 0) checkPage(4.5); pdf.text(line, ML + 5, y); y += 4.5; });
      y += 2;
    } else if (sec.type === 'table') {
      checkPage(12);
      var cols = sec.cols || [], rows = sec.rows || [];
      var colW = pw / Math.max(cols.length, 1);
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(198, 163, 78);
      cols.forEach(function (c, ci) { pdf.text(c, ML + ci * colW, y); });
      y += 5; pdf.setDrawColor(198, 163, 78); pdf.setLineWidth(0.2); pdf.line(ML, y, W - MR, y); y += 3;
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(232, 230, 224);
      rows.forEach(function (row) {
        checkPage(5);
        (row || []).forEach(function (cell, ci) { pdf.text(String(cell || ''), ML + ci * colW, y); });
        y += 4;
      });
      y += 2;
    } else if (sec.type === 'signature') {
      checkPage(25); y += 10;
      pdf.setDrawColor(158, 155, 147);
      pdf.line(ML, y, ML + 60, y); pdf.line(W - MR - 60, y, W - MR, y);
      pdf.setFontSize(8); pdf.setTextColor(158, 155, 147);
      pdf.text("L'Employeur", ML, y + 5); pdf.text("Le Travailleur", W - MR - 60, y + 5);
      y += 15;
    }
  });

  var totalPages = pdf.internal.getNumberOfPages();
  for (var i = 1; i <= totalPages; i++) { pdf.setPage(i); addFooter(i, totalPages); }
  var filename = (options.filename || title.replace(/[^a-zA-Z0-9]/g, '_')) + '.pdf';
  pdf.save(filename);
  return filename;
}
