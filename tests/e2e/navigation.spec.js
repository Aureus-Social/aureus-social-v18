// ═══════════════════════════════════════════════════════
//  AUREUS SOCIAL PRO — Tests E2E : Navigation & UI
//  Vérifie la navigation, les modules, et l'accessibilité
// ═══════════════════════════════════════════════════════

const { test, expect } = require('@playwright/test');

test.describe('Navigation & UI', () => {

  test('la page charge et affiche du contenu', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    const body = await page.textContent('body');
    expect(body.length).toBeGreaterThan(100);
  });

  test('aucune erreur console critique', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    await page.waitForTimeout(5000);

    const critical = errors.filter(e =>
      !e.includes('Supabase') &&
      !e.includes('fetch') &&
      !e.includes('NetworkError') &&
      !e.includes('AbortError') &&
      !e.includes('ChunkLoadError') &&
      !e.includes('ResizeObserver') &&
      !e.includes('Non-Error')
    );

    expect(critical).toHaveLength(0);
  });

  test('les fichiers statiques sont accessibles', async ({ request }) => {
    const files = ['/manifest.json', '/sw.js'];
    for (const file of files) {
      const resp = await request.get(file);
      expect(resp.ok()).toBeTruthy();
    }
  });

  test('la landing page est accessible', async ({ request }) => {
    const resp = await request.get('/landing.html');
    expect(resp.ok()).toBeTruthy();
    const text = await resp.text();
    expect(text.toLowerCase()).toContain('aureus');
  });

  test('la page de conformité est accessible', async ({ request }) => {
    const resp = await request.get('/compliance.html');
    expect(resp.ok()).toBeTruthy();
    const text = await resp.text();
    expect(text.toLowerCase()).toContain('rgpd');
  });
});

test.describe('Responsive Design', () => {

  test('mobile 375px — pas de scroll horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForTimeout(3000);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20);
  });

  test('tablette 768px — pas de scroll horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForTimeout(3000);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20);
  });

  test('desktop 1920px — chargement OK', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForTimeout(3000);

    const body = await page.textContent('body');
    expect(body.length).toBeGreaterThan(100);
  });
});

test.describe('Accessibilité basique', () => {

  test('la page a un attribut lang="fr"', async ({ page }) => {
    await page.goto('/');
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('fr');
  });

  test('la page a un titre significatif', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title.length).toBeGreaterThan(3);
    expect(title.toLowerCase()).toContain('aureus');
  });

  test('la page contient des boutons ou liens cliquables', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    const buttonCount = await page.locator('button').count();
    const linkCount = await page.locator('a').count();
    expect(buttonCount + linkCount).toBeGreaterThan(0);
  });

  test('les images ont un attribut alt', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      // Chaque image devrait avoir un alt (même vide pour les décoratives)
      expect(alt).not.toBeNull();
    }
  });
});

test.describe('PWA', () => {

  test('manifest.json contient les champs requis', async ({ request }) => {
    const resp = await request.get('/manifest.json');
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();

    expect(data.name).toBeTruthy();
    expect(data.short_name).toBeTruthy();
    expect(data.start_url).toBeTruthy();
    expect(data.display).toBeTruthy();
    expect(data.icons).toBeInstanceOf(Array);
    expect(data.icons.length).toBeGreaterThan(0);
  });

  test('service worker est un fichier JS valide', async ({ request }) => {
    const resp = await request.get('/sw.js');
    expect(resp.ok()).toBeTruthy();
    const text = await resp.text();
    expect(text.length).toBeGreaterThan(100);
    // Doit contenir des mots-clés de service worker
    expect(text).toContain('cache');
  });
});
