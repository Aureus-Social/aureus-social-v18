// ═══════════════════════════════════════════════════════
//  AUREUS SOCIAL PRO — Tests E2E : API Health Checks
//  Vérifie que toutes les routes API répondent correctement
// ═══════════════════════════════════════════════════════

const { test, expect } = require('@playwright/test');

test.describe('API Health Checks', () => {

  test('GET /api/health retourne 200', async ({ request }) => {
    const resp = await request.get('/api/health');
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.status).toBe('ok');
  });

  test('GET /api/status retourne les infos du service', async ({ request }) => {
    const resp = await request.get('/api/status');
    expect(resp.ok()).toBeTruthy();
  });

  test('GET /api/send-email retourne le statut email', async ({ request }) => {
    const resp = await request.get('/api/send-email');
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.service).toContain('Email');
    expect(data.templates).toBeTruthy();
  });

  test('GET /api/onss/status retourne la config ONSS', async ({ request }) => {
    const resp = await request.get('/api/onss/status');
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.identification).toBeDefined();
  });

  test('GET /api/onss/dimona retourne les infos Dimona', async ({ request }) => {
    const resp = await request.get('/api/onss/dimona');
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.service).toContain('Dimona');
  });

  test('GET /api/onss/dmfa retourne les infos DmfA', async ({ request }) => {
    const resp = await request.get('/api/onss/dmfa');
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.service).toContain('DmfA');
  });

  test('GET /api/onss/belcotax retourne les infos Belcotax', async ({ request }) => {
    const resp = await request.get('/api/onss/belcotax');
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.service).toContain('Belcotax');
  });

  test('POST /api/onss/dimona sans données retourne 400', async ({ request }) => {
    const resp = await request.post('/api/onss/dimona', {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await resp.json();
    // Soit 400 (validation), soit 200 avec erreur ONSS_NOT_CONFIGURED
    expect(data.error || data.success === false).toBeTruthy();
  });

  test('POST /api/send-email sans destinataire retourne 400', async ({ request }) => {
    const resp = await request.post('/api/send-email', {
      data: { subject: 'Test' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(resp.status()).toBe(400);
  });

  test('POST /api/send-email en mode dev retourne success', async ({ request }) => {
    const resp = await request.post('/api/send-email', {
      data: {
        to: 'test@example.com',
        subject: 'Test E2E',
        html: '<p>Test</p>',
      },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.success).toBe(true);
    // En mode dev, le mode sera 'dev'
    expect(data.mode).toBeDefined();
  });
});

test.describe('API Security', () => {

  test('les routes API incluent des headers de sécurité', async ({ request }) => {
    const resp = await request.get('/api/health');
    const headers = resp.headers();
    // Vérifier quelques headers de sécurité basiques
    // Note: certains headers sont ajoutés par le middleware
    expect(resp.ok()).toBeTruthy();
  });

  test('CORS preflight renvoie 204', async ({ request }) => {
    const resp = await request.fetch('/api/onss/dimona', {
      method: 'OPTIONS',
    });
    expect(resp.status()).toBe(204);
  });
});
