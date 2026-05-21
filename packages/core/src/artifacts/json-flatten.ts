export interface FlattenedField {
  path: string;
  value: string;
  isRationale: boolean;
}

const RATIONALE_KEY_RE = /rationale|summary|narrative|thesis|intent|description/i;

function isRationaleKey(path: string): boolean {
  const segment = path.split(".").pop() ?? path;
  return RATIONALE_KEY_RE.test(segment);
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "object" ? JSON.stringify(item) : String(item)))
      .join("; ");
  }
  return JSON.stringify(value);
}

function walk(
  value: unknown,
  path: string,
  out: FlattenedField[],
): void {
  if (value === null || value === undefined) return;

  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, path ? `${path}[${index}]` : `[${index}]`, out));
    return;
  }

  if (typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const childPath = path ? `${path}.${key}` : key;
      walk(child, childPath, out);
    }
    return;
  }

  const text = formatValue(value);
  if (!text) return;
  out.push({
    path,
    value: text,
    isRationale: isRationaleKey(path) || text.length >= 80,
  });
}

/** Semantic flatten: field path, scalar value, rationale-heavy strings for search units. */
export function flattenJsonForIndex(
  data: unknown,
  options?: { includeNonRationaleScalars?: boolean },
): FlattenedField[] {
  const includeAll = options?.includeNonRationaleScalars ?? true;
  const fields: FlattenedField[] = [];
  walk(data, "", fields);

  return fields.filter((field) => {
    if (!field.path) return false;
    if (field.isRationale) return true;
    return includeAll && field.value.length > 0 && field.value.length <= 200;
  });
}

export function flattenedFieldsToIndexText(fields: readonly FlattenedField[]): string[] {
  return fields.map((field) => {
    const prefix = field.isRationale ? "[rationale]" : "[field]";
    return `${prefix} ${field.path}: ${field.value}`;
  });
}
