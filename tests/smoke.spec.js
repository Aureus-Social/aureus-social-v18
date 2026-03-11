// ═══════════════════════════════════════════════════════
// AUREUS SOCIAL PRO — Smoke Tests Playwright
// ═══════════════════════════════════════════════════════

import { test, expect } from '@playwright/test';

const BASE = process.env.TEST_URL || 'https://app.aureussocial.be';
const EMAIL = process.env.TEST_EMAIL || '';
const PASS  = process.env.AUREUS_TEST_PASS || '';

// ─── Helpers
async function login(page) {
  await page.goto(BASE + '/login');
  await page.waitForLoadState('networkidle');
  if (EMAIL && PASS) {
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|app/, { timeout: 15000 });
  }
}

// ─── 1. Pages publiques accessibles
test.describe('Pages publiques', () => {
  test('Landing page répond 200', async ({ page }) => {
    const res = await page.goto(BASE);
    expect(res?.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/Aureus/i);
  });

  test('Login page accessible', async ({ page }) => {
    const res = await page.goto(BASE + '/login');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('Privacy policy accessible', async ({ page }) => {
    const res = await page.goto(BASE + '/privacy');
    expect(res?.status()).toBeLessThan(400);
  });
});

// ─── 2. API Health check
test.describe('API Routes', () => {
  test('/api/health répond OK', async ({ request }) => {
    const res = await request.get(BASE + '/api/health');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('status');
  });

  test('/api/health retourne le statut Supabase', async ({ request }) => {
    const res = await request.get(BASE + '/api/health');
    const body = await res.json();
    expect(body.checks).toBeDefined();
  });

  test('/api/agent refuse GET (méthode incorrecte)', async ({ request }) => {
    const res = await request.get(BASE + '/api/agent');
    expect(res.status()).toBe(405);
  });

  test('Route inexistante retourne 404', async ({ request }) => {
    const res = await request.get(BASE + '/api/nonexistent-route-xyz');
    expect(res.status()).toBe(404);
  });
});

// ─── 3. Security Headers
test.describe('Security Headers', () => {
  test('X-Frame-Options présent', async ({ request }) => {
    const res = await request.get(BASE);
    const header = res.headers()['x-frame-options'];
    expect(header).toBeTruthy();
  });

  test('X-Content-Type-Options présent', async ({ request }) => {
    const res = await request.get(BASE);
    expect(res.headers()['x-content-type-options']).toBe('nosniff');
  });

  test('Strict-Transport-Security présent', async ({ request }) => {
    const res = await request.get(BASE);
    expect(res.headers()['strict-transport-security']).toBeTruthy();
  });

  test('Referrer-Policy présent', async ({ request }) => {
    const res = await request.get(BASE);
    expect(res.headers()['referrer-policy']).toBeTruthy();
  });
});

// ─── 4. Auth redirect (pages protégées)
test.describe('Authentification', () => {
  test('Dashboard redirige vers login si non connecté', async ({ page }) => {
    await page.goto(BASE + '/dashboard');
    await page.waitForURL(/login/, { timeout: 10000 });
    expect(page.url()).toContain('login');
  });

  test('Page admin redirige vers login si non connecté', async ({ page }) => {
    await page.goto(BASE + '/admin');
    await page.waitForURL(/login/, { timeout: 10000 });
    expect(page.url()).toContain('login');
  });
});

// ─── 5. Tests avec auth (si credentials dispo)
test.describe('Dashboard (auth requis)', () => {
  test.skip(!EMAIL || !PASS, 'Skipped: TEST_EMAIL et AUREUS_TEST_PASS non configurés');

  test('Login réussi', async ({ page }) => {
    await login(page);
    expect(page.url()).toMatch(/dashboard|app/);
  });

  test('Dashboard contient navigation', async ({ page }) => {
    await login(page);
    await expect(page.locator('nav, [role="navigation"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('Dashboard affiche le nom de la société', async ({ page }) => {
    await login(page);
    await expect(page.locator('text=Aureus')).toBeVisible({ timeout: 10000 });
  });

  test('Logout fonctionne', async ({ page }) => {
    await login(page);
    const logoutBtn = page.locator('button:has-text("Déconnexion"), button:has-text("Logout")');
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForURL(/login/, { timeout: 10000 });
    }
  });
});

// ─── 6. Performance de base
test.describe('Performance', () => {
  test('Landing page charge en moins de 10 secondes', async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(10000);
  });

  test('Login page charge en moins de 5 secondes', async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 10000 });
    expect(Date.now() - start).toBeLessThan(5000);
  });
});

// ─── 7. Accessibilité de base
test.describe('Accessibilité', () => {
  test('Login a des labels sur les champs', async ({ page }) => {
    await page.goto(BASE + '/login');
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    // Vérifie label ou aria-label
    const label = await emailInput.getAttribute('aria-label') ||
                  await emailInput.getAttribute('placeholder') ||
                  await page.locator('label[for]').count();
    expect(label).toBeTruthy();
  });

  test('Page a un titre HTML', async ({ page }) => {
    await page.goto(BASE);
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('Images ont des attributs alt', async ({ page }) => {
    await page.goto(BASE);
    const imgs = await page.locator('img:not([alt])').count();
    expect(imgs).toBe(0);
  });
});
