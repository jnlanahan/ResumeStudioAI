// Shared by client (Settings dropdown) and server (request validation).
export const DEFAULT_MODEL = "claude-opus-5";

export const MODELS = [
  { id: "claude-opus-5", label: "Opus 5 — best quality (recommended)" },
  { id: "claude-sonnet-5", label: "Sonnet 5 — faster, cheaper" },
  { id: "claude-haiku-4-5", label: "Haiku 4.5 — fastest" },
] as const;

export const MODEL_IDS = MODELS.map((m) => m.id);
