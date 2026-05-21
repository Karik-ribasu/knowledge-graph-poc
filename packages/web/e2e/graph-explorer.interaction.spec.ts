import { test, expect } from "@playwright/test";

const apiBase = process.env["PLAYWRIGHT_API_URL"] ?? "http://localhost:3001/api/v1";

async function loadGraph(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: "Recarregar grafo" }).click();
  await expect(page.locator(".graph-host canvas")).toBeVisible({ timeout: 30_000 });
  // Wait for force simulation to settle (onEngineStop freezes layout).
  await page.waitForTimeout(4000);
}

test.describe("Graph Explorer interactions", () => {
  test.beforeEach(async ({ request }) => {
    const health = await request.get(`${apiBase}/health`).catch(() => null);
    test.skip(!health?.ok(), "API not running at " + apiBase);
  });

  test("toolbar and dark-theme shell are visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("mat-toolbar")).toContainText("Knowledge Graph Explorer");
    await expect(page.getByRole("button", { name: "Filtros" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Explorador de corpus" })).toBeVisible();
    const toolbarBg = await page.locator("mat-toolbar").evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    expect(toolbarBg).toMatch(/rgb\(37, 37, 38\)|#252526/i);
  });

  test("graph stays visible after hover over canvas center", async ({ page }) => {
    await loadGraph(page);
    const box = await page.locator(".graph-host").boundingBox();
    expect(box).toBeTruthy();
    const cx = box!.x + box!.width * 0.55;
    const cy = box!.y + box!.height * 0.45;
    await page.mouse.move(cx, cy);
    await page.waitForTimeout(400);
    await expect(page.locator(".graph-host canvas")).toBeVisible();
    const tooltip = page.locator(".hover-card[role='tooltip']");
    const tooltipVisible = await tooltip.isVisible().catch(() => false);
    if (tooltipVisible) {
      await expect(tooltip).toContainText(/tipo|id/i);
    }
    await page.waitForTimeout(600);
    await expect(page.locator(".graph-host canvas")).toBeVisible();
  });

  test("layout settles and simulation freezes", async ({ page }) => {
    await loadGraph(page);
    await expect(page.locator(".canvas-wrap[data-simulation-frozen]")).toBeAttached({
      timeout: 20_000,
    });
  });

  test("search pick opens detail sidenav", async ({ page, request }) => {
    const graphRes = await request.get(`${apiBase}/graph`);
    const graph = (await graphRes.json()) as { nodes: { id: string; label: string; type: string }[] };
    const gtm = graph.nodes?.find(
      (n) => !["File", "Document", "Folder", "Section", "Chunk"].includes(n.type),
    );
    test.skip(!gtm, "no GTM nodes in graph");

    await loadGraph(page);
    const label = gtm!.label.slice(0, 8);
    await page.getByRole("combobox", { name: "Buscar nó" }).fill(label);
    await page.getByRole("option").first().click();
    await expect(page.locator("mat-sidenav.mat-drawer-opened")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator("kg-node-detail-sidenav")).toBeVisible();
  });
});
