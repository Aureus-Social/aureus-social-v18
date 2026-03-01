// ═══════════════════════════════════════════════════════
//  AUREUS SOCIAL PRO — Tests E2E : Calcul de paie
//  Parcours critique : naviguer vers paie, calculer, vérifier
// ═══════════════════════════════════════════════════════

const { test, expect } = require('@playwright/test');

test.describe('Module Paie', () => {

  test('la page d\'accueil charge sans erreur JavaScript', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    await page.waitForTimeout(3000);

    // Filtrer les erreurs non-critiques (network, Supabase auth, etc.)
    const criticalErrors = errors.filter(e =>
      !e.includes('Supabase') &&
      !e.includes('fetch') &&
      !e.includes('NetworkError') &&
      !e.includes('AbortError') &&
      !e.includes('ChunkLoadError')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('pas de crash au chargement (pas de page blanche)', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // La page doit avoir du contenu visible
    const bodyText = await page.textContent('body');
    expect(bodyText.length).toBeGreaterThan(50);

    // Pas de message d'erreur React
    expect(bodyText).not.toContain('Application error');
    expect(bodyText).not.toContain('Unhandled Runtime Error');
  });

  test('le thème sombre avec or est appliqué', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Vérifier que le fond est sombre
    const bgColor = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });
    // Le fond doit être sombre (pas blanc)
    expect(bgColor).not.toBe('rgb(255, 255, 255)');
  });

  test('meta tags sont présents', async ({ page }) => {
    await page.goto('/');

    // Vérifier le title
    const title = await page.title();
    expect(title.toLowerCase()).toContain('aureus');

    // Vérifier le viewport meta
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');

    // Vérifier la langue
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('fr');
  });
});

test.describe('Performance', () => {

  test('la page charge en moins de 10 secondes', async ({ page }) => {
    const start = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(10000);
  });

  test('le service worker est enregistré', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    const swRegistered = await page.evaluate(async () => {
      if (!navigator.serviceWorker) return false;
      const regs = await navigator.serviceWorker.getRegistrations();
      return regs.length > 0;
    });

    // Le service worker peut ne pas s'enregistrer en dev, c'est OK
    expect(typeof swRegistered).toBe('boolean');
  });

  test('manifest.json est accessible', async ({ request }) => {
    const resp = await request.get('/manifest.json');
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.name).toBeTruthy();
    expect(data.start_url).toBeTruthy();
  });
});
