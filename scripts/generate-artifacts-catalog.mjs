import { readFileSync, writeFileSync, mkdirSync, statSync, readdirSync } from "node:fs";
import { join, dirname, relative } from "node:path";

const ROOT = "artifacts/artifacts";
const OUT = "docs/artifacts-catalog";

function classify(rel, content) {
  const ext = rel.split(".").pop()?.toLowerCase() ?? "";
  const base = rel.replace(/\\/g, "/");
  let tipo = "Artefato desconhecido";
  if (base.endsWith(".png")) {
    tipo = "Asset binário — imagem PNG (saída Ideogram)";
  } else if (base.endsWith(".image-prompt.md")) {
    tipo = "Image-prompt — frontmatter YAML + prompt para geração de imagem";
  } else if (ext === "json") {
    if (base.includes("critique")) tipo = "JSON — resultado de crítica / quality gate";
    else if (base.includes("summary") || base.includes("manifest"))
      tipo = "JSON — manifesto ou resumo de workflow";
    else if (base.includes("dossier")) tipo = "JSON — dossiê agregado / manifest executivo";
    else if (base.includes("intake")) tipo = "JSON — intake / briefing interpretado";
    else if (base.includes("tokens") || base.includes("strategy") || base.includes("naming"))
      tipo = "JSON — dados estruturados de marca/negócio";
    else if (base.includes("score") || base.includes("ranked") || base.includes("research"))
      tipo = "JSON — scoring, ranking ou pesquisa estruturada";
    else tipo = "JSON estruturado — saída de agente";
  } else if (ext === "md") {
    if (base.includes("README")) tipo = "Documentação de entrega / índice do corpus";
    else if (base.includes("pdf")) tipo = "Markdown — export PDF simulado do dossiê";
    else if (base.includes("vol-")) tipo = "Markdown — volume narrativo do dossiê de venture";
    else if (base.includes("outline") || base.includes("brief"))
      tipo = "Markdown — brief ou outline editorial";
    else tipo = "Markdown narrativo ou analítico";
  }

  const parts = base.split("/");
  const module =
    parts.length === 1 && base.endsWith(".md") ? "_delivery" : (parts[0] ?? "");
  const agentIdx = parts.indexOf("agents");
  const agent = agentIdx >= 0 ? parts[agentIdx + 1] : null;
  const wfIdx = parts.indexOf("workflows");
  const workflow = wfIdx >= 0 ? parts[wfIdx + 1] : null;

  const padroes = [];
  if (ext === "json") {
    try {
      const j = JSON.parse(content);
      padroes.push(`Chaves de topo: ${Object.keys(j).slice(0, 12).join(", ")}`);
      if (Array.isArray(j.agents_executed))
        padroes.push(`Lista agents_executed (${j.agents_executed.length} itens)`);
      if (j.handoff_chain) padroes.push("Cadeia handoff_chain entre módulos");
      if (j.volume_artifacts) padroes.push("Mapa volume_artifacts vol_0…vol_8");
      if (j.opportunities_found) padroes.push("Array opportunities_found[]");
    } catch {
      padroes.push("JSON (preview não parseável)");
    }
  } else if (content.startsWith("---")) {
    padroes.push("Frontmatter YAML no topo");
  } else if (/^# Volume/m.test(content)) {
    padroes.push("Cabeçalho # Volume N — …");
    padroes.push(`Seções H2: ${(content.match(/^## /gm) || []).length}`);
  } else if (/^# /m.test(content)) {
    padroes.push("Título H1 Markdown");
    padroes.push(`Seções H2: ${(content.match(/^## /gm) || []).length}`);
  }

  let papel = `Módulo **${module}**`;
  if (agent) papel += ` → agente \`${agent}\``;
  if (workflow) papel += ` → workflow \`${workflow}\``;
  if (base.endsWith(".png")) {
    papel += " → binário gerado do .image-prompt.md pareado (Ideogram v3)";
  }
  if (module === "opportunity") {
    papel += " → discovery; handoff para add-venture (score ≥ 75)";
  }
  if (module === "add-venture") {
    papel += " → dossiê 8 volumes + crítica; handoff para brand-aid";
  }
  if (module === "brand-aid") {
    papel += " → identidade de marca pós-dossier aprovado";
  }

  const indexacao = [];
  if (ext === "json") {
    indexacao.push(
      "Indexar campos escalares e arrays; considerar companion .md se ingest aceitar só Markdown",
    );
  }
  if (ext === "md" && base.includes("vol-")) {
    indexacao.push("Chunk por seção H2; entidades GTM (Product, Persona, Competitor, Feature)");
  }
  if (base.endsWith(".image-prompt.md")) {
    indexacao.push("Indexar frontmatter + prompt; PNG via output_file (sem embedding de pixels)");
  }
  if (base.endsWith(".png")) {
    indexacao.push("Metadados via .image-prompt.md pareado");
  }
  indexacao.push("Correlacionar venture_id v-b4u-bet-001, opportunity_id opp-b4u-bet-2026-001");

  return { tipo, padroes, papel, indexacao, moduleName: module, agent };
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

const files = walk(ROOT)
  .map((f) => relative(ROOT, f).replace(/\\/g, "/"))
  .sort();

let count = 0;
for (const rel of files) {
  let content = "";
  if (!rel.endsWith(".png")) {
    try {
      content = readFileSync(join(ROOT, rel), "utf8").slice(0, 12000);
    } catch {
      content = "";
    }
  }
  const { tipo, padroes, papel, indexacao, moduleName } = classify(rel, content);
  const outRel = rel.replace(/\.(json|png)$/i, ".md").replace(/\.image-prompt\.md$/i, ".image-prompt.md");
  const outPath = join(OUT, outRel);
  mkdirSync(dirname(outPath), { recursive: true });

  const depth = outRel.split("/").length - 1;
  const up = "../".repeat(depth + 2);
  const sourceHref = `${up}artifacts/artifacts/${rel}`;

  const agentLine = rel.includes("/agents/")
    ? `agent: ${rel.split("/")[2]}`
    : rel.includes("/workflows/")
      ? `workflow: ${rel.split("/")[2]}`
      : "role: meta";

  const body = `# Catálogo — \`${rel}\`

> Análise para indexação no knowledge graph. Fonte: [\`artifacts/artifacts/${rel}\`](${sourceHref})

## Tipo de conteúdo

${tipo}

## Padrões estruturais

${padroes.length ? padroes.map((p) => `- ${p}`).join("\n") : "- Ver arquivo fonte"}

## Papel no pipeline

${papel}

## Dicas para indexação

${indexacao.map((p) => `- ${p}`).join("\n")}

## Metadados sugeridos

\`\`\`yaml
source_path: artifacts/artifacts/${rel}
module: ${moduleName}
${agentLine}
venture_id: v-b4u-bet-001
opportunity_id: opp-b4u-bet-2026-001
brand_name: B4U.bet
\`\`\`
`;
  writeFileSync(outPath, body, "utf8");
  count++;
}

console.log(`Wrote ${count} catalog files under ${OUT}/`);
