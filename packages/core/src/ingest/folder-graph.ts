import { basename } from "node:path";
import { folderIdFromPath } from "../domain/ids.js";
import { edgeIdFromParts } from "../domain/ids.js";
import type { EdgeRecord, NodeRecord } from "../domain/types.js";
import { folderPrefixesForFile } from "../corpus/path-utils.js";
import type { GraphStore } from "../ports/graph-store.js";

const ensuredFolders = new Set<string>();

export function resetFolderCache(): void {
  ensuredFolders.clear();
}

/** Create Folder nodes and contains edges along the path to a file. */
export async function ensureFolderChain(
  filePath: string,
  store: GraphStore,
): Promise<{ nodesWritten: number; edgesWritten: number }> {
  let nodesWritten = 0;
  let edgesWritten = 0;
  const prefixes = folderPrefixesForFile(filePath);

  for (let i = 0; i < prefixes.length; i++) {
    const dirPath = prefixes[i]!;
    if (ensuredFolders.has(dirPath)) continue;
    ensuredFolders.add(dirPath);

    const folderId = folderIdFromPath(dirPath);
    const folderNode: NodeRecord = {
      nodeId: folderId,
      nodeType: "Folder",
      label: basename(dirPath) || dirPath,
      properties: { path: dirPath, name: basename(dirPath) || dirPath },
    };
    await store.upsertNode(folderNode);
    nodesWritten += 1;

    if (i > 0) {
      const parentPath = prefixes[i - 1]!;
      const parentId = folderIdFromPath(parentPath);
      const edge: EdgeRecord = {
        edgeId: edgeIdFromParts(parentId, folderId, "contains"),
        sourceId: parentId,
        targetId: folderId,
        edgeType: "contains",
      };
      await store.upsertEdge(edge);
      edgesWritten += 1;
    }
  }

  return { nodesWritten, edgesWritten };
}

export async function linkFileToParentFolder(
  filePath: string,
  fileNodeId: string,
  store: GraphStore,
): Promise<number> {
  const prefixes = folderPrefixesForFile(filePath);
  const parentPath = prefixes.length > 0 ? prefixes[prefixes.length - 1] : null;
  if (!parentPath) return 0;

  const parentId = folderIdFromPath(parentPath);
  const edge: EdgeRecord = {
    edgeId: edgeIdFromParts(parentId, fileNodeId, "contains"),
    sourceId: parentId,
    targetId: fileNodeId,
    edgeType: "contains",
  };
  await store.upsertEdge(edge);
  return 1;
}
