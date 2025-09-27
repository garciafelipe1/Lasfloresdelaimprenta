import { expect, test } from '@playwright/test';

test('Get a subscription', async ({ page }) => {
  await page.goto('/membership');

  const premiumTab = page.getByTestId('membership-premium');
  await expect(premiumTab).toBeVisible();

  await premiumTab.click();

  const subscribeForm = page.getByRole('form');
  await expect(subscribeForm).toBeVisible();

  const input = page.locator("form [name='email']");
  await expect(subscribeForm).toBeVisible();

  await input.fill('test_user_958223169@testuser.com');

  await subscribeForm.press('Enter');
});
