import { test, expect } from "@playwright/test";

test.describe("Graph Explorer smoke", () => {
  test("page loads with toolbar and filters", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator("mat-toolbar")).toContainText("Knowledge Graph Explorer", {
      timeout: 30_000,
    });
    await expect(page.getByLabel("Filtros do grafo")).toBeVisible();
    await expect(page.getByRole("button", { name: "Recarregar grafo" })).toBeVisible();
  });

  test("graph canvas renders when API is available", async ({ page, request }) => {
    const apiBase = process.env["PLAYWRIGHT_API_URL"] ?? "http://localhost:3001/api/v1";
    const health = await request.get(`${apiBase}/health`).catch(() => null);
    test.skip(!health?.ok(), "API not running");

    await page.goto("/");
    await page.getByRole("button", { name: "Recarregar grafo" }).click();
    await expect(page.locator(".graph-host canvas")).toBeVisible({ timeout: 30_000 });
  });

  test("clicking a node opens detail sidenav when graph has nodes", async ({
    page,
    request,
  }) => {
    const apiBase = process.env["PLAYWRIGHT_API_URL"] ?? "http://localhost:3001/api/v1";
    const graphRes = await request.get(`${apiBase}/graph`).catch(() => null);
    test.skip(!graphRes?.ok(), "API not running");
    const graph = (await graphRes!.json()) as { nodes: { id: string }[] };
    test.skip(!graph.nodes?.length, "empty graph corpus");

    await page.goto("/");
    await page.getByRole("button", { name: "Recarregar grafo" }).click();
    await expect(page.locator(".graph-host canvas")).toBeVisible({ timeout: 30_000 });

    const box = await page.locator(".graph-host").boundingBox();
    if (!box) {
      test.skip(true, "canvas not laid out");
      return;
    }
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page.locator("mat-sidenav")).toHaveAttribute("ng-reflect-opened", "true", {
      timeout: 10_000,
    }).catch(async () => {
      await expect(page.locator(".detail-sidenav")).toBeVisible();
    });
  });
});
