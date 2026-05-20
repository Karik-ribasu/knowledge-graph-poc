import type { Brief } from "./schema.js";
import type { PackSectionId } from "./sections.js";

export interface FacetSearchPlan {
  sectionId: PackSectionId;
  queries: string[];
  docTypes: string[];
  entityTypes: string[];
  priority: number;
  optional?: boolean;
}

const NO_PRICE_PATTERNS = [
  /n[aã]o\s+mencionar\s+pre[cç]o/i,
  /sem\s+pre[cç]o/i,
  /no\s+price/i,
  /hide\s+pricing/i,
];

function shouldOmitPricing(brief: Brief): boolean {
  return brief.constraints.some((c) => NO_PRICE_PATTERNS.some((re) => re.test(c)));
}

function isDevFacingAudience(audience: string): boolean {
  return /\b(cto|developer|engenharia|technical|devops|arquiteto)\b/i.test(audience);
}

/**
 * Maps a landing brief into per-section search facets (queries, doc filters, entity hints).
 */
export function planFacets(brief: Brief): FacetSearchPlan[] {
  const { product, audience, goal, tone, locale } = brief;
  const localeHint = locale.startsWith("pt") ? "português Brasil" : locale;

  const plans: FacetSearchPlan[] = [
    {
      sectionId: "hero",
      queries: [
        `headline proposta de valor ${product} para ${audience}`,
        `${product} posicionamento ${tone}`,
      ],
      docTypes: ["business", "market"],
      entityTypes: ["Product"],
      priority: 15,
    },
    {
      sectionId: "value_prop",
      queries: [
        `proposta de valor ${product} ${audience}`,
        `benefícios diferenciais ${product}`,
        `jobs to be done ${audience}`,
      ],
      docTypes: ["business"],
      entityTypes: ["Product", "ICP"],
      priority: 20,
    },
    {
      sectionId: "social_proof",
      queries: [
        `cases clientes métricas credibilidade ${product}`,
        `proof points resultados ${product}`,
      ],
      docTypes: ["market", "business"],
      entityTypes: ["ProofPoint", "Metric"],
      priority: 15,
    },
    {
      sectionId: "features",
      queries: [
        `features benefícios ${product} para ${audience}`,
        `módulos capacidades ${product}`,
      ],
      docTypes: ["business", "technical"],
      entityTypes: ["Feature"],
      priority: 20,
    },
    {
      sectionId: "objections",
      queries: [
        `objeções comuns ${product} respostas`,
        `dúvidas compra ${audience}`,
      ],
      docTypes: ["business", "market"],
      entityTypes: ["Objection"],
      priority: 10,
    },
    {
      sectionId: "pricing",
      queries: [`preços planos tiers ${product}`, `pricing ${product} enterprise`],
      docTypes: ["business"],
      entityTypes: ["PricingTier"],
      priority: 10,
      optional: shouldOmitPricing(brief),
    },
    {
      sectionId: "cta",
      queries: [
        `call to action ${goal} ${product}`,
        `próximo passo conversão ${goal}`,
      ],
      docTypes: ["business"],
      entityTypes: [],
      priority: 5,
    },
    {
      sectionId: "seo_meta",
      queries: [
        `SEO meta title description ${product} ${localeHint}`,
        `palavras-chave mercado ${product} ${audience}`,
      ],
      docTypes: ["market", "business"],
      entityTypes: [],
      priority: 5,
    },
  ];

  if (isDevFacingAudience(audience)) {
    const features = plans.find((p) => p.sectionId === "features");
    if (features) {
      features.queries.push(`segurança stack arquitetura ${product}`);
      features.docTypes = ["technical", "business"];
    }
  }

  return plans.filter((plan) => !(plan.optional && plan.sectionId === "pricing" && shouldOmitPricing(brief)));
}
