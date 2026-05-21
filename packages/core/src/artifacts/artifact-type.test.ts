import { describe, expect, it } from "vitest";
import {
  detectArtifactType,
  extractModule,
  normalizeVolumeArtifactPath,
} from "./artifact-type.js";

describe("detectArtifactType", () => {
  it("classifies delivery manifest", () => {
    expect(
      detectArtifactType("artifacts/artifacts/_meta/delivery-manifest.json"),
    ).toBe("manifest");
  });

  it("classifies vol-* markdown as volume-md", () => {
    expect(
      detectArtifactType(
        "artifacts/artifacts/add-venture/agents/opportunity-analyst-vol1/vol-1-opportunity-diagnosis.md",
      ),
    ).toBe("volume-md");
  });

  it("classifies image prompt and png", () => {
    expect(
      detectArtifactType("artifacts/artifacts/brand-aid/agents/logo-study/logo-concept-radar.image-prompt.md"),
    ).toBe("image-prompt");
    expect(
      detectArtifactType("artifacts/artifacts/brand-aid/agents/logo-study/logo-concept-radar.png"),
    ).toBe("image");
  });

  it("classifies generic json", () => {
    expect(
      detectArtifactType("artifacts/artifacts/add-venture/agents/briefing-interpreter/vol-0-intake.json"),
    ).toBe("json");
  });
});

describe("extractModule", () => {
  it("returns first segment under artifacts/artifacts", () => {
    expect(extractModule("artifacts/artifacts/opportunity/agents/scoring/opportunity-score.json")).toBe(
      "opportunity",
    );
    expect(extractModule("artifacts/artifacts/brand-aid/agents/naming/naming-shortlist.json")).toBe(
      "brand-aid",
    );
  });
});

describe("normalizeVolumeArtifactPath", () => {
  it("prefixes dossier refs with artifacts/artifacts", () => {
    expect(normalizeVolumeArtifactPath("artifacts/add-venture/agents/briefing-interpreter/vol-0-intake.json")).toBe(
      "artifacts/artifacts/add-venture/agents/briefing-interpreter/vol-0-intake.json",
    );
  });
});
