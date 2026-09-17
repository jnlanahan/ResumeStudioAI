import { z } from "zod";
import { jsonRoute, modelField, rulesSchema } from "@/server/http";
import { analyzeBullets } from "@/server/anthropic";
import type { MasterResume } from "@/types";

export const maxDuration = 300;

const Body = z.object({
  jd: z.string(),
  master: z.custom<MasterResume>((v) => typeof v === "object" && v !== null && Array.isArray((v as MasterResume).experiences)),
  model: modelField,
  rules: rulesSchema,
});

export const POST = jsonRoute(Body, analyzeBullets);
