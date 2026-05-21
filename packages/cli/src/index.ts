#!/usr/bin/env node
import {
  loadBriefFromFile,
  readStdinUtf8,
  runExpandUseCase,
  runIndexUseCase,
  runIngestUseCase,
  runIngestArtifactsUseCase,
  runPackUseCase,
  runSearchUseCase,
} from "./wiring.js";
import { parseBriefJson } from "@kg/core";

function printHelp(): void {
  console.log(`kg — Knowledge Graph POC CLI

Usage:
  kg ingest [path]              Ingest markdown corpus (updates lexical tsvector)
  kg ingest-artifacts [path]    Ingest delivery artifacts (default: artifacts/artifacts)
  kg index [options]            Embed chunks and store in pgvector
  kg search <query> [options]   Hybrid search (dense + BM25 + RRF)
  kg expand --from <seed>       Graph expansion from doc/entity (1-2 hops)
  kg pack [options]             Build ContextPack from brief JSON (default: artifacts only)
  kg --help                     Show this help

Options (pack):
  --brief <path|->              Brief JSON file, or "-" / omit for stdin
  --corpus                      Include legacy corpus/ paths (default: artifacts/artifacts only)

Options (expand):
  --from <doc:id|entity:Type:slug>   Seed node (required)
  --hops <1|2>                       Traversal depth (default: 2)

Environment (ingest):
  ENTITY_EXTRACTOR   rules | cursor | none (default: rules)

Options (index / search):
  --provider <hash|transformers|openai>   Embedding provider (default: EMBEDDING_PROVIDER or hash)

Options (search):
  --doc-type <business|market|technical>   Filter by document type
  --module <opportunity|add-venture|brand-aid>   Filter artifact paths by module (repeatable)

Environment:
  DATABASE_URL       PostgreSQL connection string
  KG_WORKSPACE       Workspace root (default: current directory)
  EMBEDDING_PROVIDER Default provider when --provider omitted
  OPENAI_API_KEY     Required for --provider openai
`);
}

function readFlag(argv: readonly string[], name: string): string | undefined {
  const index = argv.indexOf(name);
  if (index === -1) return undefined;
  return argv[index + 1];
}

async function loadBrief(argv: readonly string[]): Promise<ReturnType<typeof parseBriefJson>> {
  const briefPath = readFlag(argv, "--brief");

  if (briefPath && briefPath !== "-") {
    return loadBriefFromFile(briefPath);
  }

  const { stdin: input } = await import("node:process");
  if (briefPath === "-" || !input.isTTY) {
    const raw = await readStdinUtf8();
    if (!raw) {
      throw new Error("Expected brief JSON on stdin or via --brief <file>");
    }
    return parseBriefJson(JSON.parse(raw) as unknown);
  }

  throw new Error("Usage: kg pack --brief brief.json  (or pipe JSON to stdin)");
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const [command, arg, ...rest] = argv;

  if (!command || command === "--help" || command === "-h") {
    printHelp();
    process.exit(0);
  }

  try {
    if (command === "ingest") {
      const { workspaceRoot, corpusDir, stats } = await runIngestUseCase(arg);
      console.log(
        JSON.stringify(
          {
            ok: true,
            workspaceRoot,
            corpusDir,
            lexicalIndex: "updated on chunk upsert",
            ...stats,
          },
          null,
          2,
        ),
      );
      process.exit(0);
    }

    if (command === "ingest-artifacts") {
      const { workspaceRoot, artifactsDir, stats } = await runIngestArtifactsUseCase(arg);
      console.log(
        JSON.stringify(
          {
            ok: true,
            workspaceRoot,
            artifactsDir,
            lexicalIndex: "updated on chunk upsert",
            ...stats,
          },
          null,
          2,
        ),
      );
      process.exit(0);
    }

    if (command === "index") {
      const result = await runIndexUseCase(readFlag(rest, "--provider"));
      console.log(JSON.stringify({ ok: true, ...result }, null, 2));
      process.exit(0);
    }

    if (command === "search") {
      if (!arg) {
        throw new Error('Usage: kg search "<query>" [--doc-type market] [--provider hash]');
      }
      const moduleFlags = rest.filter((_v, i) => rest[i - 1] === "--module");
      const result = await runSearchUseCase(arg, {
        docType: readFlag(rest, "--doc-type"),
        module: moduleFlags.length > 0 ? moduleFlags : undefined,
        providerName: readFlag(rest, "--provider"),
      });
      console.log(JSON.stringify({ ok: true, ...result, count: result.results.length }, null, 2));
      process.exit(0);
    }

    if (command === "expand") {
      const fromRaw = readFlag(argv.slice(1), "--from");
      if (!fromRaw) {
        throw new Error("Usage: kg expand --from doc:<docId> [--hops 2]");
      }
      const hopsRaw = readFlag(argv.slice(1), "--hops");
      const hops = hopsRaw ? Number.parseInt(hopsRaw, 10) : 2;
      const result = await runExpandUseCase(fromRaw, { hops });
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    }

    if (command === "pack") {
      const brief = await loadBrief(argv.slice(1));
      const useCorpus = argv.slice(1).includes("--corpus");
      const { pack, meta } = await runPackUseCase(brief, readFlag(argv.slice(1), "--provider"), {
        artifactsOnly: !useCorpus,
      });
      console.log(JSON.stringify({ ok: true, ...meta, pack }, null, 2));
      process.exit(0);
    }

    console.error(`Unknown command: ${command}. Run 'kg --help'.`);
    process.exit(1);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ ok: false, error: message }));
    process.exit(1);
  }
}

await main();
