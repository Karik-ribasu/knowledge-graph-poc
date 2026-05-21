import { z } from "zod";

export const corpusTreeNodeSchema: z.ZodType<CorpusTreeNode> = z.lazy(() =>
  z.object({
    name: z.string(),
    path: z.string(),
    kind: z.enum(["folder", "file"]),
    nodeId: z.string().optional(),
    children: z.array(corpusTreeNodeSchema).optional(),
  }),
);

export const chunkAnchorSchema = z.object({
  chunkId: z.string(),
  sectionId: z.string(),
  heading: z.string(),
  startLine: z.number().int().positive(),
  endLine: z.number().int().positive(),
});

export const fileContentDtoSchema = z.object({
  path: z.string(),
  docId: z.string(),
  fileNodeId: z.string(),
  rawMarkdown: z.string(),
  title: z.string().nullable(),
  docType: z.string().nullable(),
  chunks: z.array(chunkAnchorSchema),
});

export interface CorpusTreeNode {
  name: string;
  path: string;
  kind: "folder" | "file";
  nodeId?: string;
  children?: CorpusTreeNode[];
}

export type ChunkAnchorDTO = z.infer<typeof chunkAnchorSchema>;
export type FileContentDTO = z.infer<typeof fileContentDtoSchema>;
