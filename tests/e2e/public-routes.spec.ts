import { expect, test } from "@playwright/test";

test.describe("public entry points", () => {
  test("landing page exposes the product entry point", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Know what you know.")).toBeVisible();
    await expect(page.getByRole("link", { name: /start for free/i })).toBeVisible();
  });

  test("login and signup pages render", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: "Build your skill map" })).toBeVisible();
  });
});
