import { test, expect } from '@playwright/test';
test('Google-only login explains an unauthorized account and missing setup honestly', async ({
  page,
}) => {
  await page.goto('/login?error=AccessDenied');
  await expect(
    page.getByText('This Google account is not an active committee member.', { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
});
