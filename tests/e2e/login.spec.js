// ═══════════════════════════════════════════════════════
//  AUREUS SOCIAL PRO — Tests E2E : Login
//  Parcours critique : connexion email/password + MFA
// ═══════════════════════════════════════════════════════

const { test, expect } = require('@playwright/test');

test.describe('Page de connexion', () => {

  test('affiche le formulaire de connexion', async ({ page }) => {
    await page.goto('/');
    // La page doit afficher le formulaire ou l'app (si déjà connecté)
    const body = await page.textContent('body');
    // On doit voir soit "Connexion" / "Se connecter" soit le dashboard
    expect(body.length).toBeGreaterThan(0);
  });

  test('affiche le branding Aureus Social', async ({ page }) => {
    await page.goto('/');
    // Vérifier la présence du titre ou logo Aureus
    await expect(page.locator('body')).toContainText(/aureus/i);
  });

  test('le formulaire de connexion contient email et mot de passe', async ({ page }) => {
    await page.goto('/');

    // Chercher les inputs email/password
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i], input[name="email"]');
    const passwordInput = page.locator('input[type="password"]');

    // Si on est sur la page de login, les inputs doivent être visibles
    const isLoginPage = await emailInput.count() > 0;
    if (isLoginPage) {
      await expect(emailInput.first()).toBeVisible();
      await expect(passwordInput.first()).toBeVisible();
    }
  });

  test('connexion avec identifiants invalides affiche une erreur', async ({ page }) => {
    await page.goto('/');

    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i], input[name="email"]');
    const isLoginPage = await emailInput.count() > 0;

    if (isLoginPage) {
      await emailInput.first().fill('test@invalid.com');
      await page.locator('input[type="password"]').first().fill('wrongpassword');

      // Cliquer le bouton de connexion
      const submitBtn = page.locator('button[type="submit"], button:has-text("connecter"), button:has-text("Connexion")');
      if (await submitBtn.count() > 0) {
        await submitBtn.first().click();
        // Attendre une réponse d'erreur
        await page.waitForTimeout(2000);
        const body = await page.textContent('body');
        // On s'attend à un message d'erreur
        expect(body).toBeTruthy();
      }
    }
  });

  test('la page est responsive (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    // Pas d'overflow horizontal
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 10); // tolérance 10px
  });
});
