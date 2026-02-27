// Aureus Social Pro — API Documentation Page
// Swagger-style REST API reference

export const metadata = {
  title: 'API Documentation — Aureus Social Pro',
  description: 'REST API documentation for payroll, employees, declarations',
};

export default function ApiDocsPage() {
  const endpoints = [
    {
      method: 'GET', path: '/api/v1/employees', auth: 'Bearer token',
      desc: 'Liste des employés du tenant courant',
      params: [
        { name: 'client_id', type: 'string', desc: 'Filtrer par client (optionnel)' },
        { name: 'status', type: 'string', desc: 'actif | inactif | tous (défaut: actif)' },
        { name: 'limit', type: 'number', desc: 'Nombre max de résultats (défaut: 100)' },
      ],
      response: `{
  "success": true,
  "data": [{
    "id": "uuid",
    "first": "Marie",
    "last": "Dupont",
    "niss": "85.01.15-123.45",
    "contractType": "CDI",
    "monthlySalary": 3500.00,
    "cp": "200",
    "startDate": "2023-03-01"
  }],
  "total": 45
}`,
    },
    {
      method: 'POST', path: '/api/v1/employees', auth: 'Bearer token',
      desc: 'Créer un nouvel employé',
      body: `{
  "client_id": "uuid",
  "first": "Pierre",
  "last": "Martin",
  "niss": "90.05.20-234.56",
  "contractType": "CDI",
  "monthlySalary": 4200.00,
  "cp": "200",
  "startDate": "2026-03-01",
  "whWeek": 38
}`,
      response: `{ "success": true, "id": "uuid", "message": "Employé créé" }`,
    },
    {
      method: 'GET', path: '/api/v1/payroll', auth: 'Bearer token',
      desc: 'Calcul de paie pour un employé',
      params: [
        { name: 'employee_id', type: 'string', desc: 'ID employé (requis)' },
        { name: 'month', type: 'number', desc: 'Mois (1-12, défaut: mois courant)' },
        { name: 'year', type: 'number', desc: 'Année (défaut: année courante)' },
      ],
      response: `{
  "success": true,
  "data": {
    "employee_id": "uuid",
    "period": "2026-02",
    "brut": 3500.00,
    "onss_worker": 457.45,
    "taxable": 3042.55,
    "precompte": 586.23,
    "bonus_emploi": 0.00,
    "net": 2456.32,
    "onss_employer": 877.50,
    "cost_total": 4377.50
  }
}`,
    },
    {
      method: 'POST', path: '/api/v1/payroll', auth: 'Bearer token',
      desc: 'Sauvegarder un calcul de paie en historique',
      body: `{
  "employee_id": "uuid",
  "month": 2,
  "year": 2026,
  "data": { "brut": 3500, "net": 2456.32 }
}`,
      response: `{ "success": true, "message": "Paie sauvegardée" }`,
    },
    {
      method: 'GET', path: '/api/v1/declarations', auth: 'Bearer token',
      desc: 'Générer une déclaration (DmfA, Dimona, Belcotax)',
      params: [
        { name: 'type', type: 'string', desc: 'dmfa | dimona | belcotax (requis)' },
        { name: 'quarter', type: 'number', desc: 'Trimestre 1-4 (pour DmfA)' },
        { name: 'year', type: 'number', desc: 'Année fiscale' },
        { name: 'client_id', type: 'string', desc: 'ID client (requis)' },
      ],
      response: `{
  "success": true,
  "type": "dmfa",
  "quarter": 1,
  "year": 2026,
  "xml": "<?xml version=\\"1.0\\"?>...",
  "employees_count": 15,
  "total_onss": 45230.50
}`,
    },
    {
      method: 'POST', path: '/api/v1/declarations', auth: 'Bearer token',
      desc: 'Soumettre une déclaration à l\'ONSS/SPF',
      body: `{
  "type": "dmfa",
  "quarter": 1,
  "year": 2026,
  "client_id": "uuid",
  "submit": true
}`,
      response: `{ "success": true, "reference": "DMFA-2026-Q1-001", "status": "submitted" }`,
    },
    {
      method: 'GET', path: '/api/v1/docs', auth: 'Bearer token',
      desc: 'Liste des documents (contrats, fiches, attestations)',
      params: [
        { name: 'category', type: 'string', desc: 'contrat | fiche_paie | attestation | c4 | dimona' },
        { name: 'employee_id', type: 'string', desc: 'Filtrer par employé' },
        { name: 'client_id', type: 'string', desc: 'Filtrer par client' },
      ],
      response: `{
  "success": true,
  "data": [{
    "id": "uuid",
    "name": "Contrat CDI — Dupont Marie",
    "category": "contrat",
    "mime": "application/pdf",
    "size": 245000,
    "created_at": "2026-01-15T10:30:00Z"
  }]
}`,
    },
    {
      method: 'POST', path: '/api/v1/docs', auth: 'Bearer token',
      desc: 'Upload un document',
      body: 'multipart/form-data: file, category, employee_id, client_id',
      response: `{ "success": true, "id": "uuid", "url": "/storage/documents/..." }`,
    },
    {
      method: 'POST', path: '/api/webhooks', auth: 'X-Aureus-Signature HMAC',
      desc: 'Envoyer un événement webhook vers un système externe',
      body: `{
  "event": "payroll.calculated",
  "webhookUrl": "https://hooks.slack.com/...",
  "secret": "your-webhook-secret",
  "data": { "employee": "Dupont", "net": 2456.32 }
}`,
      response: `{ "success": true, "status": 200 }`,
    },
    {
      method: 'POST', path: '/api/invite', auth: 'Session cookie',
      desc: 'Inviter un utilisateur (client ou employé)',
      body: `{
  "email": "client@entreprise.be",
  "role": "client",
  "tenant_id": "uuid"
}`,
      response: `{
  "success": true,
  "invite_id": "uuid",
  "invite_url": "https://app.aureussocial.be?portal=client&invite=token"
}`,
    },
  ];

  const eventTypes = [
    { event: 'payroll.calculated', desc: 'Fiche de paie calculée' },
    { event: 'payroll.approved', desc: 'Paie validée par le gestionnaire' },
    { event: 'employee.created', desc: 'Nouvel employé ajouté' },
    { event: 'employee.terminated', desc: 'Employé sorti (C4)' },
    { event: 'declaration.generated', desc: 'DmfA/Dimona/Belcotax généré' },
    { event: 'declaration.submitted', desc: 'Déclaration soumise à l\'ONSS' },
    { event: 'document.uploaded', desc: 'Document uploadé' },
    { event: 'document.signed', desc: 'Document signé (e-signature)' },
    { event: 'leave.requested', desc: 'Demande de congé soumise' },
    { event: 'leave.approved', desc: 'Congé approuvé' },
    { event: 'invoice.created', desc: 'Facture générée' },
    { event: 'alert.security', desc: 'Alerte sécurité (intrusion, brute force)' },
  ];

  const methodColor = { GET: '#22c55e', POST: '#3b82f6', PUT: '#eab308', DELETE: '#ef4444' };

  return (
    <html lang="fr">
      <head>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #060810; color: #e5e5e5; }
          .container { max-width: 1000px; margin: 0 auto; padding: 40px 24px; }
          .header { text-align: center; margin-bottom: 40px; }
          .logo { font-size: 28px; font-weight: 800; color: #c6a34e; font-family: Georgia, serif; }
          .subtitle { font-size: 14px; color: #888; margin-top: 8px; }
          .base-url { font-family: monospace; font-size: 13px; color: #c6a34e; background: rgba(198,163,78,.08); padding: 12px 20px; border-radius: 8px; border: 1px solid rgba(198,163,78,.15); margin: 20px 0; display: inline-block; }
          .section { margin-bottom: 32px; }
          .section-title { font-size: 18px; font-weight: 700; color: #c6a34e; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid rgba(198,163,78,.1); }
          .endpoint { background: #0d1117; border: 1px solid rgba(198,163,78,.08); border-radius: 12px; margin-bottom: 12px; overflow: hidden; }
          .endpoint-header { display: flex; align-items: center; gap: 12px; padding: 14px 18px; cursor: pointer; }
          .method { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 5px; font-family: monospace; }
          .path { font-family: monospace; font-size: 13px; color: #e5e5e5; }
          .desc { font-size: 12px; color: #888; margin-left: auto; }
          .endpoint-body { padding: 0 18px 18px; border-top: 1px solid rgba(255,255,255,.03); }
          .params { margin-top: 12px; }
          .param { display: grid; grid-template-columns: 120px 80px 1fr; gap: 8px; padding: 4px 0; font-size: 11px; border-bottom: 1px solid rgba(255,255,255,.02); }
          .param-name { color: #c6a34e; font-family: monospace; }
          .param-type { color: #60a5fa; font-size: 10px; }
          pre { background: rgba(0,0,0,.3); padding: 14px; border-radius: 8px; font-size: 11px; overflow-x: auto; color: #9e9b93; margin-top: 8px; line-height: 1.5; }
          .auth-badge { font-size: 10px; color: #a78bfa; background: rgba(167,139,250,.1); padding: 3px 8px; border-radius: 4px; }
          .event-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          .event { padding: 10px 14px; background: rgba(198,163,78,.03); border: 1px solid rgba(198,163,78,.06); border-radius: 8px; }
          .event-name { font-family: monospace; font-size: 11px; color: #c6a34e; }
          .event-desc { font-size: 10px; color: #888; margin-top: 2px; }
          .note { padding: 14px; background: rgba(234,179,8,.04); border: 1px solid rgba(234,179,8,.1); border-radius: 8px; font-size: 11px; color: #eab308; margin: 16px 0; }
          .label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <div className="logo">AUREUS SOCIAL PRO</div>
            <div className="subtitle">REST API Documentation — v1.0</div>
            <div className="base-url">Base URL: https://app.aureussocial.be/api/v1</div>
          </div>

          <div className="note">
            <strong>🔐 Authentification:</strong> Toutes les requêtes nécessitent un header <code>Authorization: Bearer YOUR_TOKEN</code>. 
            Obtenez un token via Supabase Auth (<code>supabase.auth.signIn()</code>). 
            Les données retournées sont automatiquement filtrées par tenant (RLS).
          </div>

          <div className="section">
            <div className="section-title">📡 Endpoints</div>
            {endpoints.map((ep, i) => (
              <details key={i} className="endpoint">
                <summary className="endpoint-header">
                  <span className="method" style={{ background: methodColor[ep.method] + '15', color: methodColor[ep.method] }}>{ep.method}</span>
                  <span className="path">{ep.path}</span>
                  <span className="desc">{ep.desc}</span>
                  <span className="auth-badge">🔒 {ep.auth}</span>
                </summary>
                <div className="endpoint-body">
                  {ep.params && (
                    <div className="params">
                      <div className="label">Paramètres</div>
                      {ep.params.map((p, j) => (
                        <div key={j} className="param">
                          <span className="param-name">{p.name}</span>
                          <span className="param-type">{p.type}</span>
                          <span style={{ color: '#9e9b93' }}>{p.desc}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {ep.body && (
                    <div>
                      <div className="label" style={{ marginTop: 12 }}>Body</div>
                      <pre>{ep.body}</pre>
                    </div>
                  )}
                  <div className="label" style={{ marginTop: 12 }}>Réponse</div>
                  <pre>{ep.response}</pre>
                </div>
              </details>
            ))}
          </div>

          <div className="section">
            <div className="section-title">🔔 Événements Webhook</div>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>
              Configurez un webhook dans Monitoring → Webhooks pour recevoir ces événements en temps réel.
            </p>
            <div className="event-grid">
              {eventTypes.map((ev, i) => (
                <div key={i} className="event">
                  <div className="event-name">{ev.event}</div>
                  <div className="event-desc">{ev.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="section">
            <div className="section-title">📋 Codes de statut</div>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '4px 16px', fontSize: 12 }}>
              <span style={{ color: '#22c55e', fontFamily: 'monospace' }}>200</span><span style={{ color: '#9e9b93' }}>Succès</span>
              <span style={{ color: '#22c55e', fontFamily: 'monospace' }}>201</span><span style={{ color: '#9e9b93' }}>Créé avec succès</span>
              <span style={{ color: '#eab308', fontFamily: 'monospace' }}>400</span><span style={{ color: '#9e9b93' }}>Requête invalide (paramètres manquants)</span>
              <span style={{ color: '#ef4444', fontFamily: 'monospace' }}>401</span><span style={{ color: '#9e9b93' }}>Non authentifié (token manquant/invalide)</span>
              <span style={{ color: '#ef4444', fontFamily: 'monospace' }}>403</span><span style={{ color: '#9e9b93' }}>Interdit (rôle insuffisant)</span>
              <span style={{ color: '#ef4444', fontFamily: 'monospace' }}>404</span><span style={{ color: '#9e9b93' }}>Ressource non trouvée</span>
              <span style={{ color: '#ef4444', fontFamily: 'monospace' }}>429</span><span style={{ color: '#9e9b93' }}>Rate limit (60 req/min)</span>
              <span style={{ color: '#ef4444', fontFamily: 'monospace' }}>500</span><span style={{ color: '#9e9b93' }}>Erreur serveur</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: 24, color: '#888', fontSize: 11, borderTop: '1px solid rgba(198,163,78,.06)', marginTop: 40 }}>
            Aureus Social Pro — Aureus IA SPRL — BCE BE 1028.230.781<br />
            API Rate Limit: 60 requêtes/minute — Données isolées par tenant (RLS)
          </div>
        </div>
      </body>
    </html>
  );
}
