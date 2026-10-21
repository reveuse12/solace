import { expect, test } from "@playwright/test";

const authState = process.env.PLAYWRIGHT_AUTH_STATE;

test.describe("authenticated customer journey", () => {
  test.skip(!authState, "Set PLAYWRIGHT_AUTH_STATE to a dedicated Clerk test-user storage state to run this journey.");
  test.use({ storageState: authState });

  test("onboards, saves practice data, and reaches account controls", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Make this space yours|Profile & settings/)).toBeVisible();
    await page.getByLabel("Display name").fill("Playwright Customer");
    await page.getByLabel(/privacy terms/i).check();
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText(/Profile saved|Good evening/)).toBeVisible();
    await page.getByRole("button", { name: "Reflect" }).click();
    await page.getByPlaceholder("What are you noticing today?").fill("I made space for a meaningful pause.");
    await page.getByRole("button", { name: "Save reflection" }).click();
    await expect(page.getByText("I made space for a meaningful pause.")).toBeVisible();
    await page.getByRole("button", { name: "Edit" }).click();
    await page.getByPlaceholder("What are you noticing today?").fill("I made space and returned to myself.");
    await page.getByRole("button", { name: "Update reflection" }).click();
    await expect(page.getByText("I made space and returned to myself.")).toBeVisible();
    await page.getByRole("button", { name: "Profile" }).click();
    await expect(page.getByText("Data management")).toBeVisible();
    await expect(page.getByRole("link", { name: "Export my data" })).toBeVisible();
  });
});
