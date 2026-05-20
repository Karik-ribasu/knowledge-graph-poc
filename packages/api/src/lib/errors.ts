export interface ApiErrorBody {
  error: string;
  code: string;
}

export function apiError(error: string, code: string): ApiErrorBody {
  return { error, code };
}

export function isZodLikeError(error: unknown): error is { issues: unknown[] } {
  return (
    typeof error === "object" &&
    error !== null &&
    "issues" in error &&
    Array.isArray((error as { issues: unknown[] }).issues)
  );
}
