import type { ExtractedEntity, ExtractedRelation, GtmExtractionResult, ParsedMarkdown } from "../domain/types.js";
import type { GtmEdgeType, GtmNodeType } from "../graph/ontology.js";

const FRONTMATTER_LIST_KEYS: Record<string, GtmNodeType> = {
  competitors: "Competitor",
  competitor: "Competitor",
  objections: "Objection",
  objection: "Objection",
  features: "Feature",
  feature: "Feature",
  proof_points: "ProofPoint",
  proof_point: "ProofPoint",
  pricing_tiers: "PricingTier",
  pricing_tier: "PricingTier",
  channels: "Channel",
  channel: "Channel",
  metrics: "Metric",
  metric: "Metric",
};

const FRONTMATTER_SCALAR_KEYS: Record<string, GtmNodeType> = {
  product: "Product",
  icp: "ICP",
  persona: "Persona",
  phase: "Phase",
};

function coerceStringArray(value: unknown): string[] {
  if (typeof value === "string" && value.trim()) return [value.trim()];
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : null))
    .filter((item): item is string => Boolean(item));
}

function pushEntity(
  entities: ExtractedEntity[],
  nodeType: GtmNodeType,
  name: string,
  docId: string,
  path: string,
): void {
  entities.push({
    nodeType,
    name,
    properties: { source_doc_id: docId, source_path: path },
  });
}

function pushRelation(
  relations: ExtractedRelation[],
  edgeType: GtmEdgeType,
  sourceType: GtmNodeType,
  sourceName: string,
  targetType: GtmNodeType,
  targetName: string,
  docId: string,
): void {
  relations.push({
    edgeType,
    sourceType,
    sourceName,
    targetType,
    targetName,
    properties: { source_doc_id: docId },
  });
}

/** Map YAML frontmatter keys to GTM entities and typed edges. */
export function extractFromFrontmatter(parsed: ParsedMarkdown, docId: string): GtmExtractionResult {
  const fm = parsed.frontmatter;
  const entities: ExtractedEntity[] = [];
  const relations: ExtractedRelation[] = [];

  let productName: string | null = null;
  let icpName: string | null = null;

  for (const [key, nodeType] of Object.entries(FRONTMATTER_SCALAR_KEYS)) {
    const raw = fm[key];
    if (typeof raw !== "string" || !raw.trim()) continue;
    const name = raw.trim();
    pushEntity(entities, nodeType, name, docId, parsed.relativePath);
    if (nodeType === "Product") productName = name;
    if (nodeType === "ICP") icpName = name;
  }

  const listNames: Partial<Record<GtmNodeType, string[]>> = {};

  for (const [key, nodeType] of Object.entries(FRONTMATTER_LIST_KEYS)) {
    const values = coerceStringArray(fm[key]);
    if (values.length === 0) continue;
    listNames[nodeType] = [...(listNames[nodeType] ?? []), ...values];
    for (const name of values) {
      pushEntity(entities, nodeType, name, docId, parsed.relativePath);
    }
  }

  const defaultProduct =
    productName ??
    (typeof fm.title === "string" && parsed.docType === "business" ? "NexusFlow" : null);
  if (defaultProduct && !productName) {
    productName = defaultProduct;
    pushEntity(entities, "Product", defaultProduct, docId, parsed.relativePath);
  }

  if (productName && icpName) {
    pushRelation(relations, "targetsICP", "Product", productName, "ICP", icpName, docId);
  }

  if (productName && listNames.Competitor?.length) {
    for (const competitor of listNames.Competitor) {
      pushRelation(relations, "competesWith", "Product", productName, "Competitor", competitor, docId);
    }
  }

  if (productName && listNames.Feature?.length) {
    for (const feature of listNames.Feature) {
      pushRelation(relations, "hasFeature", "Product", productName, "Feature", feature, docId);
    }
  }

  if (listNames.Feature?.length && listNames.Objection?.length) {
    for (const feature of listNames.Feature) {
      for (const objection of listNames.Objection) {
        pushRelation(
          relations,
          "addressesObjection",
          "Feature",
          feature,
          "Objection",
          objection,
          docId,
        );
      }
    }
  }

  if (listNames.Feature?.length && listNames.ProofPoint?.length) {
    for (const feature of listNames.Feature) {
      for (const proof of listNames.ProofPoint) {
        pushRelation(relations, "supportedBy", "Feature", feature, "ProofPoint", proof, docId);
      }
    }
  }

  if (productName && listNames.PricingTier?.length) {
    for (const tier of listNames.PricingTier) {
      pushRelation(relations, "pricedAs", "Product", productName, "PricingTier", tier, docId);
    }
  }

  if (productName && listNames.Channel?.length) {
    for (const channel of listNames.Channel) {
      pushRelation(
        relations,
        "distributedVia",
        "Product",
        productName,
        "Channel",
        channel,
        docId,
      );
    }
  }

  if (productName && listNames.Metric?.length) {
    for (const metric of listNames.Metric) {
      pushRelation(relations, "measuredBy", "Metric", metric, "Product", productName, docId);
    }
  }

  const phaseName =
    typeof fm.phase === "string"
      ? fm.phase
      : typeof fm.roadmap_phase === "string"
        ? fm.roadmap_phase
        : null;
  if (phaseName) {
    pushEntity(entities, "Phase", phaseName, docId, parsed.relativePath);
    if (productName) {
      pushRelation(relations, "belongsToPhase", "Product", productName, "Phase", phaseName, docId);
    }
  }

  return { entities, relations };
}
