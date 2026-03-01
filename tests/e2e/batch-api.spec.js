// ═══════════════════════════════════════════════════════
//  AUREUS SOCIAL PRO — Tests E2E : API Batch & Cron
//  Vérifie les nouvelles routes API v1/batch et cron/deadlines
// ═══════════════════════════════════════════════════════

const { test, expect } = require('@playwright/test');

test.describe('API Batch v1', () => {

  test('GET /api/v1/batch retourne la doc des opérations', async ({ request }) => {
    const resp = await request.get('/api/v1/batch');
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.service).toContain('Batch');
    expect(data.operations).toBeDefined();
    expect(data.operations.calculateAll).toBeDefined();
    expect(data.operations.indexAll).toBeDefined();
    expect(data.operations.dimonaAll).toBeDefined();
    expect(data.operations.exportAll).toBeDefined();
    expect(data.operations.validateAll).toBeDefined();
  });

  test('POST /api/v1/batch sans auth retourne 401', async ({ request }) => {
    const resp = await request.post('/api/v1/batch', {
      data: { action: 'calculateAll' },
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await resp.json();
    expect(data.success).toBe(false);
    expect(resp.status()).toBe(401);
  });

  test('POST /api/v1/batch sans action retourne 400 ou 401', async ({ request }) => {
    const resp = await request.post('/api/v1/batch', {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await resp.json();
    expect(data.success).toBe(false);
    // 401 car pas de token, ou 400 si le token est optionnel
    expect([400, 401]).toContain(resp.status());
  });
});

test.describe('API Cron Deadlines', () => {

  test('GET /api/cron/deadlines retourne les échéances', async ({ request }) => {
    const resp = await request.get('/api/cron/deadlines');
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.success).toBe(true);
    expect(data.summary).toBeDefined();
    expect(typeof data.summary.overdue).toBe('number');
    expect(typeof data.summary.upcoming).toBe('number');
    expect(data.alerts).toBeInstanceOf(Array);
  });

  test('GET /api/cron/deadlines?days=30 retourne plus d\'échéances', async ({ request }) => {
    const resp7 = await request.get('/api/cron/deadlines?days=7');
    const resp30 = await request.get('/api/cron/deadlines?days=30');
    expect(resp7.ok()).toBeTruthy();
    expect(resp30.ok()).toBeTruthy();

    const data7 = await resp7.json();
    const data30 = await resp30.json();

    // Plus de jours devant = plus (ou autant) d'échéances
    expect(data30.summary.upcoming).toBeGreaterThanOrEqual(data7.summary.upcoming);
  });

  test('chaque alerte a les champs requis', async ({ request }) => {
    const resp = await request.get('/api/cron/deadlines?days=60');
    const data = await resp.json();

    if (data.alerts.length > 0) {
      const alert = data.alerts[0];
      expect(alert.label).toBeTruthy();
      expect(alert.date).toBeTruthy();
      expect(alert.type).toBeTruthy();
      expect(alert.priority).toBeTruthy();
      expect(alert.status).toBeTruthy();
      expect(typeof alert.daysUntil).toBe('number');
    }
  });

  test('POST /api/cron/deadlines déclenche la vérification', async ({ request }) => {
    const resp = await request.post('/api/cron/deadlines', {
      data: { sendEmails: false, daysAhead: 14 },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.success).toBe(true);
  });
});

test.describe('API ONSS DmfA', () => {

  test('GET /api/onss/dmfa retourne les infos du service', async ({ request }) => {
    const resp = await request.get('/api/onss/dmfa');
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    // Soit configured=true, soit ONSS_NOT_CONFIGURED (pas d'env vars en test)
    expect(data.service || data.error).toBeTruthy();
  });

  test('POST /api/onss/dmfa sans XML retourne une erreur', async ({ request }) => {
    const resp = await request.post('/api/onss/dmfa', {
      data: { xml: '' },
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await resp.json();
    // ONSS_NOT_CONFIGURED en mode test, ou MISSING_XML
    expect(data.success === false || data.error).toBeTruthy();
  });
});

test.describe('API Belcotax', () => {

  test('GET /api/onss/belcotax retourne les infos', async ({ request }) => {
    const resp = await request.get('/api/onss/belcotax');
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.service).toContain('Belcotax');
    // En test, le certificat n'est pas configuré
    expect(data.configured === true || data.configured === false).toBeTruthy();
  });

  test('POST /api/onss/belcotax sans XML retourne une erreur', async ({ request }) => {
    const resp = await request.post('/api/onss/belcotax', {
      data: { xml: '' },
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await resp.json();
    expect(data.success === false || data.error).toBeTruthy();
  });
});
