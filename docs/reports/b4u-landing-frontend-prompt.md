# Frontend generation prompt — B4U.bet landing (alta conversão)

> **Uso:** colar este prompt em um gerador de UI (v0, Cursor, Claude Artifacts, etc.) após validar o ContextPack via MCP (`kg_pack` + buscas do [roteiro](../12-roteiro-landing-via-grafo.md)).  
> **Fonte de verdade:** artefatos em `artifacts/artifacts/` (venture `v-b4u-bet-001`). **Sem referência a agentes** — apenas copy e tokens de entrega.

---

## Role

You are a senior product designer + frontend engineer specializing in **high-conversion B2C SaaS / media landing pages** (Stripe, Linear, Notion, Apple Sports editorial quality). Build a **single-page marketing site** in **pt-BR** (primary), responsive mobile-first, accessible WCAG AA.

---

## Product

**B4U.bet** — global sports intelligence hub born in Brazil. Unifies premium sports media, interpretive AI, stats, odds context, and moderated community. **Explicitly NOT** a betting house, tipster, or “guaranteed win” product.

**Category line:** Sports Intelligence Platform  
**Tagline (BR):** Inteligência antes do apito.  
**Tagline (EN export):** Intelligence before the whistle.

---

## Audience & goal

| | |
|---|---|
| **Primary persona** | “Intelligence Seekers” — torcedores/apostadores 25–44, BR urbano, renda média-alta, 80%+ mobile. Rejeitam tipsters óbvios; querem contexto completo para decidir com responsabilidade. |
| **JTBD** | “Me dê o quadro completo do jogo e do mercado para decidir com responsabilidade.” |
| **Conversion goal** | Waitlist / assinatura premium — **one primary CTA above the fold** + secondary “Como funciona”. |
| **Tone** | Confiante, editorial, transparente sobre IA; anti-clickbait; nunca predatório. |

---

## Design system (obrigatório)

```css
/* Colors — from design-tokens.json */
--bg-primary: #0B1220;      /* Pitch Deep */
--accent: #14B8A6;          /* Signal Teal — CTAs, data highlights */
--accent-gold: #F59E0B;     /* Insight Gold — sparingly, key metrics only */
--text-muted: #94A3B8;      /* Line Gray */
--surface-card: #1E293B;    /* Card Slate */
--success: #22C55E;
--error: #EF4444;

/* Typography */
--font-display: "Instrument Sans", system-ui, sans-serif;
--font-body: "Inter", system-ui, sans-serif;
--font-mono: "JetBrains Mono", monospace; /* stats, odds tables */

/* Layout */
--radius-sm: 6px;
--radius-md: 12px;
--radius-lg: 16px;
--spacing-base: 4px;
```

**Visual direction:** dark editorial premium; radar/data focal motifs; **no** cliché gambling (dice, coins, neon green casino). Logo lockup horizontal: icon (concentric radar + teal dot) + wordmark “B4U” + “.bet” lighter weight. Reference mood: agency sports data product, not bookmaker.

**Imagery:** use placeholders labeled `[hero: editorial sports intelligence dark]` and `[mobile app mock dark teal]`; aspect 16:9 hero, 9:16 optional mobile section.

---

## Page structure (conversion-optimized)

Build these sections **in order**. Each must have a clear hierarchy (H1 once, H2 per section).

### 1. Hero (above the fold)

- **H1:** Inteligência esportiva antes do apito. (or variant using tagline)
- **Subhead (1–2 lines):** Mídia premium, dados e IA interpretativa num só hub — sem promessa de resultado, sem sala de sinais.
- **Primary CTA:** `Entrar na lista de espera` (filled, Signal Teal on Pitch Deep)
- **Secondary CTA:** `Ver como funciona` (ghost)
- **Trust micro-line:** Score de oportunidade 82/100 · venture-scale · governança ética
- **Social proof strip (optional):** “Humanos + IA · Multi-source data · Jogo responsável”

### 2. Problem / agitation

- Headline: O mercado te vende palpite. Você precisa de **contexto**.
- 3 bullets: ruído de tipsters · casas que misturam editorial e aposta · IA opaca que “promete lucro”
- Short line: B4U separa editorial, educação probabilística e monetização com disclosure.

### 3. Solution / value pillars

Grid of **5 cards** (icons minimal, line style):

1. **Inteligência consolidada** — stats + odds + narrativa + tendências num feed personalizado  
2. **Credibilidade editorial** — humanos no loop; política anti-clickbait  
3. **IA transparente** — explica o porquê, não promete resultado  
4. **Comunidade moderada** — debates, não sala de sinais  
5. **Jogo responsável** — limites, conteúdo educativo  

### 4. Differentiation (anti-positioning)

Two-column: **O que somos** vs **O que NÃO somos**

| Somos | Não somos |
|-------|-----------|
| Hub de inteligência esportiva | Casa de apostas |
| Educação probabilística | Site de palpites |
| Governança de afiliados | Robô que ganha |

Include one-line positioning: *Para quem exige contexto confiável, B4U une mídia premium, dados e IA — diferente porque separa editorial de monetização.*

### 5. Features (product)

- Personalized intelligence feed  
- Deep dives 3×/semana (BR football beachhead)  
- Creator widgets / data embeds  
- Community beta (moderated)  
- Premium tier hypothesis: R$ 39–59/mo aligned to sports streaming + paid newsletter  

Use monospace accents for sample stats/odds **as illustration only** (fake numbers OK with label “exemplo”).

### 6. Proof / metrics

Highlight band with **3–4 metrics** (Insight Gold numbers on dark):

- TAM US$ 4.2B · SAM US$ 890M  
- Year 1 target: US$ 1.8M revenue · 22k subs  
- CAC US$ 28 · LTV US$ 186 · payback 4 months  
- Opportunity score **82/100** — advance to venture structuring  

Small print: métricas do dossiê venture; sujeitas a validação.

### 7. How it works (3 steps)

1. **Descubra** — manifesto + waitlist  
2. **Consuma** — feed, deep dives, IA explicável  
3. **Decida com responsabilidade** — ferramentas de limite + disclosure em links comerciais  

### 8. Objections / FAQ (accordion)

- “Isso é casa de apostas?” → Não. Sports intelligence platform.  
- “A IA garante green?” → Não. Explica contexto; editores validam.  
- “Como ganham dinheiro?” → Subscription, ads qualificados, API SMB, afiliados governados — sempre com disclosure.  
- “Quem é o público?” → Intelligence Seekers 25–44 BR mobile-first.  

### 9. Brand narrative (emotional block)

Quote block (manifesto excerpt):

> Não somos casa de apostas. Somos a mesa onde estatística, jornalismo e tecnologia se encontram antes do apito inicial. A IA trabalha para você entender — não para adivinhar.

Archetype note (small): Sage + Explorer — sofisticado, direto, brasileiro-global.

### 10. Final CTA

Repeat primary CTA + email capture UI (single field + button).  
Footer links: Jogo responsável · Privacidade · Termos · Contato.

---

## Copy guardrails (legal & brand)

- **NEVER:** “ganhe com apostas”, “green garantido”, “robô lucrativo”, imagery of casino/dice.  
- **ALWAYS:** label AI-assisted content; affiliate disclosure mention; jogo responsável in footer.  
- **Messaging guardrails from GTM:** Nunca prometer resultado; IA labeled “Assistido por IA, validado por editores”.  
- **Locale:** pt-BR UI strings; EN tagline optional in subhero only.

---

## Technical output requirements

- Stack: **React + Tailwind** (or HTML/CSS single file if generator prefers).  
- Components: sticky nav (logo + CTAs), hero, feature grid, comparison table, metrics band, FAQ accordion, footer.  
- Animations: subtle fade/slide on scroll; respect `prefers-reduced-motion`.  
- Performance: no heavy video autoplay; optimize LCP (hero text + CSS first).  
- SEO: `<title>`, meta description, OG tags for “B4U.bet — Inteligência Esportiva”.  
- Accessibility: focus rings, contrast AA on teal/ dark, semantic landmarks.

---

## ContextPack integration (when MCP available)

After `kg_pack` with brief:

```json
{
  "product": "B4U.bet — hub de inteligência esportiva (mídia premium + dados + IA interpretativa). Não é casa de apostas.",
  "audience": "Torcedores 25-44 BR mobile-first — Intelligence Seekers",
  "goal": "Conversão waitlist premium",
  "tone": "Editorial premium, ético, transparente",
  "locale": "pt-BR",
  "constraints": ["Não prometer resultado", "Jogo responsável", "Tokens brand-aid"]
}
```

**Merge** `pack.facets.*.chunks[]` text into sections above — prefer add-venture vols 2–3–6, opportunity score, brand-aid design-tokens + creative-brief. **Ignore** any field named `agent` or `agents_executed`.

---

## Success criteria

- [ ] Primary CTA visible without scroll on mobile  
- [ ] Dark premium aesthetic matches tokens  
- [ ] Clear “not a betting house” within 5 seconds  
- [ ] At least 3 proof metrics above fold or in hero band  
- [ ] FAQ addresses top objection (betting house)  
- [ ] Lighthouse accessibility ≥ 90 (target)
