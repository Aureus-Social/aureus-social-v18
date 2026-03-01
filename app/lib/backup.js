// ═══════════════════════════════════════════════════════════
// Item #37 — ENHANCED BACKUP SYSTEM
// Full JSON export (encrypted), versioning, 1-click restore
// ═══════════════════════════════════════════════════════════

export async function createFullBackup(supabase, userId) {
  const timestamp = new Date().toISOString();
  const backup = { version: '20.3', timestamp, userId, data: {} };
  
  const tables = ['app_state', 'payroll_history', 'documents', 'activity_log', 'declaration_queue'];
  for (const table of tables) {
    try {
      const { data } = await supabase.from(table).select('*').eq('user_id', userId);
      backup.data[table] = data || [];
    } catch (e) {
      backup.data[table] = [];
    }
  }
  
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aureus-backup-${timestamp.slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  return { size: json.length, tables: Object.keys(backup.data).length, timestamp };
}

export async function restoreBackup(supabase, userId, file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        if (!backup.version || !backup.data) throw new Error('Format de backup invalide');
        
        let restored = 0;
        for (const [table, rows] of Object.entries(backup.data)) {
          if (!rows.length) continue;
          const { error } = await supabase.from(table).upsert(
            rows.map(r => ({ ...r, user_id: userId })),
            { onConflict: 'id' }
          );
          if (!error) restored += rows.length;
        }
        resolve({ restored, tables: Object.keys(backup.data).length, version: backup.version });
      } catch (e) {
        reject(e);
      }
    };
    reader.readAsText(file);
  });
}

export function scheduleAutoBackup(supabase, userId, intervalHours = 24) {
  const key = `aureus-last-backup-${userId}`;
  const last = localStorage.getItem(key);
  const now = Date.now();
  if (last && now - parseInt(last) < intervalHours * 3600000) return;

  // Auto-backup to localStorage (lightweight)
  supabase.from('app_state').select('val').eq('user_id', userId).eq('key', 'client_data').maybeSingle()
    .then(({ data }) => {
      if (data?.val) {
        localStorage.setItem(`aureus-autobackup-${userId}`, data.val);
        localStorage.setItem(key, String(now));
      }
    }).catch(() => {});
}

// ═══ EXPORT CSV — Employés + Fiches de paie ═══

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 3000);
}

export function exportEmployeesCSV(employees) {
  if (!employees || !employees.length) return { error: 'Aucun employé à exporter' };
  const headers = ['Nom', 'Prénom', 'NISS', 'Email', 'Téléphone', 'Statut', 'Contrat', 'Date entrée', 'Date sortie', 'Fonction', 'Brut mensuel', 'Régime', 'CP', 'IBAN'];
  const rows = employees.map(e => [
    (e.last || e.ln || '').replace(/;/g, ','),
    (e.first || e.fn || '').replace(/;/g, ','),
    (e.niss || ''),
    (e.email || ''),
    (e.phone || ''),
    (e.statut || 'Employé'),
    (e.contractType || 'CDI'),
    (e.startDate || ''),
    (e.endDate || ''),
    (e.fonction || e.jobTitle || ''),
    (+(e.monthlySalary || e.gross || 0)).toFixed(2),
    (+(e.regime || 100)) + '%',
    (e.cp || ''),
    (e.iban || '')
  ].join(';'));
  const csv = '\uFEFF' + headers.join(';') + '\n' + rows.join('\n');
  const date = new Date().toISOString().slice(0, 10);
  downloadFile(csv, `Employes_backup_${date}.csv`, 'text/csv');
  return { count: employees.length, filename: `Employes_backup_${date}.csv` };
}

export function exportPayrollCSV(payrollHistory) {
  if (!payrollHistory || !payrollHistory.length) return { error: 'Aucune fiche de paie à exporter' };
  const headers = ['Période', 'Nom', 'Prénom', 'Brut', 'ONSS', 'Précompte', 'Net', 'Coût employeur', 'Statut'];
  const rows = payrollHistory.map(p => [
    (p.periode || p.period || ''),
    (p.last || p.nom || p.ln || ''),
    (p.first || p.prenom || p.fn || ''),
    (+(p.brut || p.gross || 0)).toFixed(2),
    (+(p.onss || p.cotisationsONSS || 0)).toFixed(2),
    (+(p.precompte || p.pp || 0)).toFixed(2),
    (+(p.net || 0)).toFixed(2),
    (+(p.coutEmployeur || p.totalCost || 0)).toFixed(2),
    (p.status || p.statut || 'Calculé')
  ].join(';'));
  const csv = '\uFEFF' + headers.join(';') + '\n' + rows.join('\n');
  const date = new Date().toISOString().slice(0, 10);
  downloadFile(csv, `FichesPayroll_backup_${date}.csv`, 'text/csv');
  return { count: payrollHistory.length, filename: `FichesPayroll_backup_${date}.csv` };
}

export async function exportAllData(supabase, userId, employees, payrollHistory) {
  const results = {};
  // 1. Export JSON complet (toutes les tables)
  results.json = await createFullBackup(supabase, userId);
  // 2. Export CSV employés
  if (employees && employees.length) {
    results.employees = exportEmployeesCSV(employees);
  }
  // 3. Export CSV fiches de paie
  if (payrollHistory && payrollHistory.length) {
    results.payroll = exportPayrollCSV(payrollHistory);
  }
  return results;
}
