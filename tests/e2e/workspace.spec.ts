import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByText('Demo workspace', { exact: false }).first()).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
test('overview has real sample metrics, renders without runtime errors, and adapts to mobile', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await expect(
    page.getByRole('heading', { name: 'A little progress. A bigger picture.' }),
  ).toBeVisible();
  await expect(page.locator('.progress-chart svg path').first()).toBeVisible();
  await page.screenshot({ path: 'test-results/overview-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible();
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: /Task Manager/ })
    .click();
  await expect(page.getByRole('heading', { name: 'Make room for good work.' })).toBeVisible();
  await expect
    .poll(() => page.locator('.sidebar').evaluate((e) => e.getBoundingClientRect().right))
    .toBeLessThanOrEqual(0);
  await page.screenshot({
    path: 'test-results/tasks-mobile.png',
    fullPage: true,
    animations: 'disabled',
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(errors).toEqual([]);
});
test('task creation, status updates, and deletion update the in-memory demo', async ({ page }) => {
  await page.goto('/tasks');
  await page.getByRole('button', { name: 'Create task', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Task title', exact: true })
    .fill('End-to-end sample task');
  await page.getByRole('button', { name: 'Create task', exact: true }).last().click();
  await expect(
    page.getByRole('button', { name: 'End-to-end sample task', exact: true }),
  ).toBeVisible();
  await page.getByLabel('Change status for End-to-end sample task').selectOption('In Progress');
  await page.getByRole('button', { name: 'End-to-end sample task', exact: true }).click();
  await expect(page.getByLabel('Status', { exact: true })).toHaveValue('In Progress');
  await page.getByRole('button', { name: 'Delete task', exact: true }).click();
  await page.getByRole('button', { name: 'Delete permanently' }).click();
  await expect(
    page.getByRole('button', { name: 'End-to-end sample task', exact: true }),
  ).toHaveCount(0);
});
test('feedback preserves per-type drafts, validates fields, and never fakes a demo submission', async ({
  page,
}) => {
  await page.goto('/feedback');
  await page.getByRole('tab', { name: /Feature Request/ }).click();
  await page.getByLabel('Requester name').fill('Sample reviewer');
  await page.getByLabel('Committee role / division').fill('Web Development');
  await page.getByLabel('Feature title').fill('End-to-end feature idea');
  await page
    .getByLabel('What problem should we solve?')
    .fill('Participants need clearer guidance.');
  await page.getByLabel('Describe your idea').fill('Show helpful registration guidance.');
  await page.getByRole('tab', { name: /Page Request/ }).click();
  await page.getByLabel('Proposed page title').fill('A sample page');
  await page.getByRole('tab', { name: /Feature Request/ }).click();
  await expect(page.getByLabel('Feature title')).toHaveValue('End-to-end feature idea');
  await page.getByRole('button', { name: 'Review submission' }).click();
  await expect(page.getByRole('heading', { name: 'A quick look before you share.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirm & submit' })).toBeDisabled();
  await page.getByRole('button', { name: 'Back to editing' }).click();
  await page.reload();
  await page.getByRole('tab', { name: /Feature Request/ }).click();
  await expect(page.getByLabel('Feature title')).toHaveValue('End-to-end feature idea');
});
test('calendar creates an event, switches views, and explains subscription versus download', async ({
  page,
}) => {
  await page.goto('/calendar');
  await page.getByRole('button', { name: 'Create event', exact: true }).click();
  await page.getByLabel('Event title').fill('A sample calendar event');
  await page.getByRole('button', { name: 'Create event', exact: true }).last().click();
  await page.getByRole('button', { name: 'Agenda', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A sample calendar event' })).toBeVisible();
  await page.getByRole('button', { name: 'Week', exact: true }).click();
  await page.getByRole('button', { name: 'Month', exact: true }).click();
  await page.getByRole('button', { name: 'Subscribe to calendar' }).click();
  await expect(
    page.getByText('A downloaded .ics file is a one-time snapshot.', { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download .ics' })).toBeDisabled();
});
test('activities reveal notes and linked work; directory shows request details', async ({
  page,
}) => {
  await page.goto('/activities');
  await page.getByRole('button', { name: 'Read notes & next steps' }).first().click();
  await expect(page.getByRole('heading', { name: 'Meeting notes' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Decisions', exact: true })).toBeVisible();
  await page.goto('/feedback');
  await page.getByRole('tab', { name: /Submission directory/ }).click();
  await page
    .getByRole('button', { name: 'A simpler competition registration', exact: false })
    .first()
    .click();
  await expect(
    page.getByRole('heading', { name: 'A simpler competition registration' }),
  ).toBeVisible();
  await expect(page.getByLabel('Request review status')).toBeVisible();
});
test('admin can manage demo membership and change theme; protected APIs reject unauthenticated users', async ({
  page,
  request,
}) => {
  await page.getByRole('button', { name: 'Manage members', exact: true }).click();
  await page.getByRole('button', { name: 'Add member' }).click();
  await page.getByLabel('Member name').fill('Sample Viewer');
  await page.getByLabel('Verified Google email').fill('sample@example.invalid');
  await page.getByLabel('Role', { exact: true }).selectOption('viewer');
  await page.getByRole('button', { name: 'Save member' }).click();
  await expect(page.getByText('Sample Viewer', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Toggle color theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  for (const resource of [
    'tasks',
    'events',
    'activities',
    'feedback',
    'members',
    'wwc-participants',
    'wwc-questions',
  ]) {
    const response = await request.get(`/api/${resource}`);
    expect(response.status()).toBe(401);
  }
  const ics = await request.get('/api/calendar.ics');
  expect(ics.status()).toBe(503);
});
