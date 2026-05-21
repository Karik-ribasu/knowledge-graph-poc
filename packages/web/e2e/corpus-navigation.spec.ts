import { test, expect } from "@playwright/test";

const apiBase = process.env["PLAYWRIGHT_API_URL"] ?? "http://localhost:3001/api/v1";

test.describe("Corpus navigation", () => {
  test.beforeEach(async ({ request }) => {
    const health = await request.get(`${apiBase}/health`).catch(() => null);
    test.skip(!health?.ok(), "API not running");
  });

  test("corpus tree and file panel are visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Explorador de corpus" })).toBeVisible();
    await page.getByRole("button", { name: "Recarregar grafo" }).click();
    await expect(page.locator(".graph-host canvas")).toBeVisible({ timeout: 30_000 });
  });

  test("selecting a file loads content panel", async ({ page, request }) => {
    const tree = await request.get(`${apiBase}/corpus/tree`);
    test.skip(!tree.ok(), "corpus tree unavailable");
    const root = (await tree.json()) as {
      children?: { kind: string; path: string; name: string }[];
    };
    const file = findFirstFile(root);
    test.skip(!file, "no files in corpus tree");

    await page.goto("/");
    await page.getByRole("button", { name: file!.name, exact: true }).click();
    await expect(page.locator(".file-header")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(".file-body")).toBeVisible();
    await expect(page.locator(".graph-host canvas")).toBeVisible();
  });

  test("clicking a chunk line highlights chunk in content panel", async ({ page, request }) => {
    const tree = await request.get(`${apiBase}/corpus/tree`);
    test.skip(!tree.ok(), "corpus tree unavailable");
    const root = (await tree.json()) as {
      children?: { kind: string; path: string; name: string }[];
    };
    const file = findFileWithChunkLines(root, request);
    test.skip(!file, "no file with chunk line anchors");

    await page.goto("/");
    await page
      .locator("button.tree-row")
      .filter({ hasText: file!.name })
      .first()
      .click();
    await expect(page.locator(".file-body")).toBeVisible({ timeout: 10_000 });
    const chunkLine = page.locator(".line.chunk-line").first();
    test.skip((await chunkLine.count()) === 0, "no chunk lines rendered");
    await chunkLine.click();
    await expect(page.locator(".line.chunk-selected")).toHaveCount(1, { timeout: 5000 });
  });
});

function findFirstFile(
  node: { kind?: string; path?: string; name?: string; children?: unknown[] },
): { name: string; path: string } | null {
  if (node.kind === "file" && node.path && node.name) {
    return { name: node.name, path: node.path };
  }
  for (const child of node.children ?? []) {
    const found = findFirstFile(child as { kind?: string; path?: string; name?: string; children?: unknown[] });
    if (found) return found;
  }
  return null;
}

async function findFileWithChunkLines(
  node: { kind?: string; path?: string; name?: string; children?: unknown[] },
  request: import("@playwright/test").APIRequestContext,
): Promise<{ name: string; path: string } | null> {
  if (node.kind === "file" && node.path && node.name) {
    const res = await request.get(`${apiBase}/files/${encodeURIComponent(node.path)}`);
    if (res.ok()) {
      const body = (await res.json()) as {
        chunks: { startLine: number; endLine: number }[];
      };
      const hasRange = body.chunks?.some((c) => c.endLine > c.startLine);
      if (hasRange) return { name: node.name, path: node.path };
    }
  }
  for (const child of node.children ?? []) {
    const found = await findFileWithChunkLines(
      child as { kind?: string; path?: string; name?: string; children?: unknown[] },
      request,
    );
    if (found) return found;
  }
  return null;
}
