import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/wwc');
  await expect(page.getByText('Demo workspace', { exact: false }).first()).toBeVisible();
});

test('WWC adds candidates and questions, saves answers, and preserves answers after bank changes', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.getByRole('tab', { name: /Bank pertanyaan/ }).click();
  await page.getByRole('button', { name: 'Tambah pertanyaan', exact: true }).click();
  await page
    .getByLabel('Pertanyaan', { exact: true })
    .fill('Apa kontribusi utama yang ingin kamu berikan?');
  await page.getByLabel('Kategori pertanyaan').fill('Kontribusi');
  await page.getByRole('button', { name: 'Simpan pertanyaan' }).click();
  await expect(
    page.getByRole('heading', { name: 'Apa kontribusi utama yang ingin kamu berikan?' }),
  ).toBeVisible();
  await page.getByRole('tab', { name: /Peserta WWC/ }).click();
  await page.getByRole('button', { name: 'Tambah peserta', exact: true }).click();
  await page.getByLabel('Nama peserta').fill('Kandidat Uji WWC');
  await page.getByLabel('Email peserta').fill('kandidat@example.invalid');
  await page.getByLabel('Divisi pilihan').fill('Web Development');
  await page
    .getByLabel(/Apa kontribusi utama yang ingin kamu berikan/)
    .fill('Membangun website yang mudah digunakan.');
  await page.getByLabel('Catatan pewawancara').fill('Komunikasi jelas dan terstruktur.');
  await page.getByLabel('Status wawancara').selectOption('Sudah diwawancarai');
  await page.getByRole('button', { name: 'Simpan peserta' }).click();
  await expect(page.getByRole('heading', { name: 'Kandidat Uji WWC' })).toBeVisible();
  await page.getByRole('button', { name: 'Detail & jawaban' }).click();
  await expect(page.getByLabel(/Apa kontribusi utama yang ingin kamu berikan/)).toHaveValue(
    'Membangun website yang mudah digunakan.',
  );
  await expect(page.getByLabel('Status wawancara')).toHaveValue('Sudah diwawancarai');
  await expect(page.getByLabel('Catatan pewawancara')).toHaveValue(
    'Komunikasi jelas dan terstruktur.',
  );
  await page.getByRole('button', { name: 'Tutup', exact: true }).click();
  await page.getByRole('tab', { name: /Bank pertanyaan/ }).click();
  const card = page
    .locator('.wwc-card')
    .filter({ hasText: 'Apa kontribusi utama yang ingin kamu berikan?' });
  await card.getByRole('button', { name: 'Edit pertanyaan' }).click();
  await page.getByLabel('Pertanyaan', { exact: true }).fill('Pertanyaan bank yang sudah diubah');
  await page.getByRole('button', { name: 'Simpan pertanyaan' }).click();
  await page
    .locator('.wwc-card')
    .filter({ hasText: 'Pertanyaan bank yang sudah diubah' })
    .getByRole('button', { name: 'Edit pertanyaan' })
    .click();
  await page.getByRole('button', { name: 'Hapus pertanyaan', exact: true }).click();
  await page.getByRole('button', { name: 'Delete permanently' }).click();
  await expect(
    page.getByRole('heading', { name: 'Pertanyaan bank yang sudah diubah' }),
  ).toHaveCount(0);
  await page.getByRole('tab', { name: /Peserta WWC/ }).click();
  await page.getByRole('button', { name: 'Detail & jawaban' }).click();
  await expect(page.getByLabel(/Apa kontribusi utama yang ingin kamu berikan/)).toHaveValue(
    'Membangun website yang mudah digunakan.',
  );
  await page.getByRole('button', { name: 'Hapus peserta', exact: true }).click();
  await page.getByRole('button', { name: 'Delete permanently' }).click();
  await expect(page.getByRole('heading', { name: 'Kandidat Uji WWC' })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('WWC restores missing starter questions without duplicating the bank and fits mobile', async ({
  page,
}) => {
  await page.getByRole('tab', { name: /Bank pertanyaan/ }).click();
  await expect(page.locator('.wwc-card')).toHaveCount(6);
  await page.getByRole('button', { name: 'Edit pertanyaan' }).first().click();
  await page.getByRole('button', { name: 'Hapus pertanyaan', exact: true }).click();
  await page.getByRole('button', { name: 'Delete permanently' }).click();
  await expect(page.locator('.wwc-card')).toHaveCount(5);
  await page.getByRole('button', { name: 'Tambahkan pertanyaan awal' }).click();
  await expect(page.locator('.wwc-card')).toHaveCount(6);
  await expect(page.getByRole('button', { name: 'Tambahkan pertanyaan awal' })).toHaveCount(0);
  await page.screenshot({ path: 'test-results/wwc-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole('heading', { name: 'Kenali kandidat, mulai percakapan.' }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Tambah pertanyaan', exact: true }).click();
  await expect(page.getByLabel('Pertanyaan', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'test-results/wwc-mobile.png', fullPage: true });
});
