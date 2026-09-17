import { z } from "zod";
import { jsonRoute, modelField } from "@/server/http";
import { ingest } from "@/server/anthropic";
import type { ImportedResume, MasterResume } from "@/types";

export const maxDuration = 300;

const Body = z.object({
  source: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("pdf"), base64: z.string().min(1) }),
    z.object({
      kind: z.literal("image"),
      mediaType: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]),
      base64: z.string().min(1),
    }),
    z.object({ kind: z.literal("text"), text: z.string().min(1) }),
  ]),
  note: z.string().default(""),
  master: z.custom<MasterResume>((v) => typeof v === "object" && v !== null && Array.isArray((v as MasterResume).experiences)),
  model: modelField,
  prior: z.custom<ImportedResume>((v) => typeof v === "object" && v !== null).nullable().optional(),
  answers: z.record(z.string(), z.string()).optional(),
});

export const POST = jsonRoute(Body, ingest);
