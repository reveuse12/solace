import { expect, test } from "@playwright/test";

test("signed-out visitors see the public landing page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/127\.0\.0\.1:\d+\/$/);
  await expect(page.getByText("Make space for")).toBeVisible();
  await expect(page.getByRole("button", { name: "Begin your practice" })).toBeVisible();
});

test("PWA manifest is served with Solace metadata", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBeTruthy();
  const manifest = await response.json();
  expect(manifest.name).toBe("Solace");
  expect(manifest.display).toBe("standalone");
});

test("profile API rejects anonymous writes", async ({ request }) => {
  const response = await request.post("/api/profile", { data: { displayName: "Unauthenticated" } });
  expect(response.status()).toBe(401);
});

test("account export rejects anonymous access", async ({ request }) => {
  const response = await request.get("/api/account/export");
  expect(response.status()).toBe(401);
});

test("account deletion rejects anonymous access", async ({ request }) => {
  const response = await request.delete("/api/account/data");
  expect(response.status()).toBe(401);
});

test("sign-in page exposes the expected Clerk entry points", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page).toHaveTitle(/Solace/);
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});

test("account restore rejects anonymous access", async ({ request }) => {
  const response = await request.post("/api/account/data", { data: { data: { profiles: [] } } });
  expect(response.status()).toBe(401);
});
