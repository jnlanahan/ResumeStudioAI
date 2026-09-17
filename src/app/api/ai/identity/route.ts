import { z } from "zod";
import { jsonRoute, modelField, rulesSchema } from "@/server/http";
import { generateIdentity } from "@/server/anthropic";

export const maxDuration = 300;

const Body = z.object({
  jd: z.string(),
  jobTitle: z.string(),
  company: z.string(),
  selectedBullets: z.array(z.object({ role: z.string(), company: z.string(), text: z.string() })),
  masterSummary: z.string(),
  model: modelField,
  rules: rulesSchema,
});

export const POST = jsonRoute(Body, generateIdentity);
