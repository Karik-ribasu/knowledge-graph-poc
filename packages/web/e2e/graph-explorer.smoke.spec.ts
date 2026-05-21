import { test, expect } from "@playwright/test";

test.describe("Graph Explorer smoke", () => {
  test("page loads with toolbar and filters", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator("mat-toolbar")).toContainText("Knowledge Graph Explorer", {
      timeout: 30_000,
    });
    await expect(page.getByRole("button", { name: "Filtros" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Explorador de corpus" })).toBeVisible();
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

  test("search opens detail sidenav when graph has nodes", async ({ page, request }) => {
    const apiBase = process.env["PLAYWRIGHT_API_URL"] ?? "http://localhost:3001/api/v1";
    const graphRes = await request.get(`${apiBase}/graph`).catch(() => null);
    test.skip(!graphRes?.ok(), "API not running");
    const graph = (await graphRes!.json()) as { nodes: { label: string; type: string }[] };
    const gtm = graph.nodes?.find(
      (n) => !["File", "Document", "Folder", "Section", "Chunk"].includes(n.type),
    );
    test.skip(!gtm, "no GTM nodes in graph");

    await page.goto("/");
    await page.getByRole("button", { name: "Recarregar grafo" }).click();
    await expect(page.locator(".graph-host canvas")).toBeVisible({ timeout: 30_000 });

    const label = gtm!.label.slice(0, 8);
    await page.getByRole("combobox", { name: "Buscar nó" }).fill(label);
    await page.getByRole("option").first().click();
    await expect(page.locator("mat-sidenav.mat-drawer-opened")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("kg-node-detail-sidenav")).toBeVisible();
  });
});
