// Browser-side wrappers around the /api/ai/* routes. The Anthropic key lives on
// the server (ANTHROPIC_API_KEY); nothing here talks to Anthropic directly.
import type { AnalysisResult, AppSettings, IdentityOption, ImportedResume, MasterResume } from "@/types";
import type { ImportSource } from "@/server/anthropic";

export type { ImportSource };

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status}).`);
  return data;
}

export function analyzeBullets(jd: string, master: MasterResume, settings: AppSettings): Promise<AnalysisResult> {
  if (!master.experiences.length) throw new Error("Add at least one role in your Bullet Bank first.");
  if (!jd.trim()) throw new Error("Paste a job description first.");
  return post("/api/ai/analyze", { jd, master, model: settings.model, rules: settings.rules });
}

export interface IdentityInput {
  jd: string;
  jobTitle: string;
  company: string;
  selectedBullets: { role: string; company: string; text: string }[];
  masterSummary: string;
  settings: AppSettings;
}

export function generateIdentity({ settings, ...rest }: IdentityInput): Promise<IdentityOption[]> {
  return post("/api/ai/identity", { ...rest, model: settings.model, rules: settings.rules });
}

export interface IngestArgs {
  source: ImportSource;
  note: string;
  master: MasterResume;
  settings: AppSettings;
  prior?: ImportedResume | null;
  answers?: Record<string, string>;
}

/** Turn any career document into a reviewable proposal (see server/anthropic.ts → ingest). */
export function ingest({ settings, ...rest }: IngestArgs): Promise<ImportedResume> {
  return post("/api/ai/ingest", { ...rest, model: settings.model });
}

// ─── File readers ────────────────────────────────────────────────────────────

/** Browser File → base64 body (no data: prefix, no newlines). */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export const ACCEPTED_RESUME_FILES = ".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.webp";

/** Turn an uploaded resume file into something the import route accepts. */
export async function readResumeFile(file: File): Promise<ImportSource> {
  const name = file.name.toLowerCase();
  const ext = name.slice(name.lastIndexOf(".") + 1);

  if (ext === "pdf") return { kind: "pdf", base64: await fileToBase64(file) };

  if (ext === "docx") {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    if (!value.trim()) throw new Error("That Word file has no readable text.");
    return { kind: "text", text: value };
  }

  if (ext === "txt" || ext === "md") return { kind: "text", text: await file.text() };

  const imageTypes: Record<string, Extract<ImportSource, { kind: "image" }>["mediaType"]> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
  };
  const mediaType = imageTypes[ext];
  if (mediaType) return { kind: "image", mediaType, base64: await fileToBase64(file) };

  throw new Error("Unsupported file type. Use PDF, Word (.docx), text, or an image.");
}
