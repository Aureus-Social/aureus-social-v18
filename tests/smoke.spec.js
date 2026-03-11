/**
 * AUREUS SOCIAL PRO — Smoke Tests (Playwright)
 * Tests critiques à lancer avant chaque déploiement en prod
 * 
 * INSTALLATION:
 *   npm install -D @playwright/test
 *   npx playwright install chromium
 * 
 * LANCEMENT:
 *   npx playwright test                         # tous les tests
 *   npx playwright test --headed                # avec navigateur visible
 *   npx playwright test tests/smoke.spec.js     # ce fichier uniquement
 * 
 * CI/CD (GitHub Actions — voir workflow ci-tests.yml)
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_URL || 'https://app.aureussocial.be';
const TEST_EMAIL = process.env.TEST_EMAIL || 'demo@aureus-ia.com';
const TEST_PASS  = process.env.TEST_PASS  || process.env.AUREUS_TEST_PASS;

// ─── GROUPE 1 : Pages publiques
test.describe('Pages publiques', () => {

  test('Landing page se charge', async ({ page }) => {
    const res = await page.goto(BASE_URL);
    expect(res.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/Aureus/i);
  });

  test('Politique de confidentialité accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/privacy`);
    await expect(page.locator('body')).toContainText(/RGPD|confidentialité/i);
  });

});

// ─── GROUPE 2 : Authentification
test.describe('Authentification', () => {

  test('Page de connexion se charge', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('Connexion avec compte démo', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASS);
    await page.click('button[type="submit"]');
    
    // Attendre la redirection vers le dashboard
    await page.waitForURL(/dashboard|app/, { timeout: 10_000 });
    await expect(page.locator('body')).not.toContainText(/erreur|error|401|403/i);
  });

});

// ─── GROUPE 3 : Dashboard (nécessite connexion)
test.describe('Dashboard', () => {
  
  // Se connecter avant chaque test de ce groupe
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|app/, { timeout: 10_000 });
  });

  test('Dashboard charge sans erreur JS', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(2000);
    expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0);
  });

  test('Navigation vers Employés', async ({ page }) => {
    await page.click('[data-nav="employees"], a[href*="employees"]');
    await expect(page.locator('body')).toContainText(/employé|werknemer/i);
  });

  test('Navigation vers Fiches de paie', async ({ page }) => {
    await page.click('[data-nav="payslip"], a[href*="payslip"]');
    await expect(page.locator('body')).toContainText(/fiche de paie|paie|loonbrief/i);
  });

  test('Navigation vers Déclarations', async ({ page }) => {
    await page.click('[data-nav="declarations"], a[href*="decl"]');
    await expect(page.locator('body')).toContainText(/déclaration|dimona|ONSS/i);
  });

});

// ─── GROUPE 4 : API routes critiques
test.describe('API routes', () => {

  test('GET /api/health retourne 200', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/health`);
    expect(res.status()).toBe(200);
  });

  test('POST /api/agent retourne 200 (pas 405)', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/agent`, {
      data: { message: 'test', context: 'smoke-test' },
      headers: { 'Content-Type': 'application/json' },
    });
    // Accepter 200 ou 401 (pas 405 Method Not Allowed)
    expect([200, 401, 403]).toContain(res.status());
  });

  test('API BCE accessible', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/bce?vat=1028230781`);
    expect(res.status()).toBeLessThan(500);
  });

});

// ─── GROUPE 5 : Sécurité headers
test.describe('Headers de sécurité', () => {

  test('Content-Security-Policy présent', async ({ request }) => {
    const res = await request.get(BASE_URL);
    const csp = res.headers()['content-security-policy'];
    expect(csp).toBeTruthy();
  });

  test('X-Frame-Options présent (anti-clickjacking)', async ({ request }) => {
    const res = await request.get(BASE_URL);
    const xfo = res.headers()['x-frame-options'];
    expect(xfo).toMatch(/DENY|SAMEORIGIN/i);
  });

  test('Pas de credentials en clair dans les réponses', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/health`);
    const body = await res.text();
    expect(body).not.toMatch(/password|secret|key.*:/i);
  });

});
