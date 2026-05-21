import type { Brief } from "./schema.js";
import type { PackSectionId } from "./sections.js";

export interface FacetSearchPlan {
  sectionId: PackSectionId;
  queries: string[];
  docTypes: string[];
  /** Pipeline modules when sourcing from artifacts/artifacts (no agent facets). */
  modules?: readonly string[];
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

/** Default artifact root for delivery packs (B4U and similar). */
export const ARTIFACTS_PATH_PREFIX = "artifacts/artifacts/";

/**
 * Maps a landing brief into per-section search facets (queries, doc filters, entity hints).
 * When `artifactsOnly` is true, plans target `artifacts/artifacts/` modules instead of corpus doc_types.
 */
export function planFacets(brief: Brief, options?: { artifactsOnly?: boolean }): FacetSearchPlan[] {
  if (options?.artifactsOnly) {
    return planArtifactFacets(brief);
  }
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

function planArtifactFacets(brief: Brief): FacetSearchPlan[] {
  const { product, audience, goal, tone } = brief;
  const gtmModules = ["opportunity", "add-venture"] as const;
  const brandModules = ["brand-aid"] as const;
  const allModules = [...gtmModules, ...brandModules];

  const plans: FacetSearchPlan[] = [
    {
      sectionId: "hero",
      queries: [
        `tagline manifesto ${product} sports intelligence`,
        `posicionamento editorial ${tone}`,
        `executive summary ${product}`,
      ],
      docTypes: [],
      modules: [...gtmModules, "brand-aid"],
      entityTypes: ["Product"],
      priority: 15,
    },
    {
      sectionId: "value_prop",
      queries: [
        `proposta de valor ${product}`,
        `value pillars anti-positioning não somos casa de apostas`,
        `positioning statement ${audience}`,
      ],
      docTypes: [],
      modules: gtmModules,
      entityTypes: ["Product", "ICP"],
      priority: 20,
    },
    {
      sectionId: "social_proof",
      queries: [
        `TAM SAM métricas score oportunidade revenue subs`,
        `key metrics year 1 critique score approved`,
        `market size venture dossier`,
      ],
      docTypes: [],
      modules: [...gtmModules],
      entityTypes: ["Metric", "ProofPoint"],
      priority: 15,
    },
    {
      sectionId: "features",
      queries: [
        `features inteligência consolidada IA transparente comunidade`,
        `feed personalizado deep dives widgets`,
        `business model subscription API`,
      ],
      docTypes: [],
      modules: gtmModules,
      entityTypes: ["Feature"],
      priority: 20,
    },
    {
      sectionId: "objections",
      queries: [
        `riscos compliance jogo responsável regulação`,
        `não somos casa de apostas tipster objeções`,
        `kill criteria validation`,
      ],
      docTypes: [],
      modules: gtmModules,
      entityTypes: ["Objection"],
      priority: 10,
    },
    {
      sectionId: "pricing",
      queries: [
        `WTP premium R$ subscription ARPU pricing hypothesis`,
        `year 1 revenue target subs`,
      ],
      docTypes: [],
      modules: gtmModules,
      entityTypes: ["PricingTier"],
      priority: 10,
      optional: shouldOmitPricing(brief),
    },
    {
      sectionId: "cta",
      queries: [
        `waitlist manifesto fase 90 dias ${goal}`,
        `go to market launch beachhead Brasil`,
      ],
      docTypes: [],
      modules: gtmModules,
      entityTypes: [],
      priority: 5,
    },
    {
      sectionId: "seo_meta",
      queries: [
        `brand narrative category sports intelligence platform`,
        `naming B4U tagline inteligência`,
        `design tokens typography colors`,
      ],
      docTypes: [],
      modules: allModules,
      entityTypes: [],
      priority: 5,
    },
  ];

  return plans.filter((plan) => !(plan.optional && plan.sectionId === "pricing" && shouldOmitPricing(brief)));
}
