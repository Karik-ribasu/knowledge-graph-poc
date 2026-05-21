export interface DeliveryManifest {
  deliveryId: string;
  startupName: string | null;
  deliveredAt: string | null;
  modules: string[];
  ventureId: string | null;
  opportunityId: string | null;
  handoffChain: Array<{ from: string; to: string; gate: string; status: string }>;
  imagePromptFiles: string[];
}

export function parseDeliveryManifest(raw: unknown): DeliveryManifest {
  const data = raw as Record<string, unknown>;
  const venture = (data.venture as Record<string, unknown> | undefined) ?? {};
  const handoffs = Array.isArray(data.handoff_chain) ? data.handoff_chain : [];

  return {
    deliveryId: String(data.delivery_id ?? ""),
    startupName: typeof data.startup_name === "string" ? data.startup_name : null,
    deliveredAt: typeof data.delivered_at === "string" ? data.delivered_at : null,
    modules: Array.isArray(data.modules)
      ? data.modules.filter((m): m is string => typeof m === "string")
      : [],
    ventureId: typeof venture.venture_id === "string" ? venture.venture_id : null,
    opportunityId: typeof venture.opportunity_id === "string" ? venture.opportunity_id : null,
    handoffChain: handoffs
      .filter((h): h is Record<string, unknown> => typeof h === "object" && h !== null)
      .map((h) => ({
        from: String(h.from ?? ""),
        to: String(h.to ?? ""),
        gate: String(h.gate ?? ""),
        status: String(h.status ?? ""),
      })),
    imagePromptFiles: Array.isArray(data.image_prompt_files)
      ? data.image_prompt_files.filter((p): p is string => typeof p === "string")
      : [],
  };
}
