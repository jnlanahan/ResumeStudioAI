import { NextResponse } from "next/server";
import { z } from "zod";
import { MODEL_IDS } from "@/lib/models";

/** Shared request fields every AI route accepts. */
export const modelField = z.string().refine((m) => (MODEL_IDS as readonly string[]).includes(m), "Unknown model");

export const rulesSchema = z.object({
  maxBulletsPerRole: z.number().int().min(1).max(20),
  maxBulletChars: z.number().int().min(40).max(400),
  maxSkills: z.number().int().min(1).max(50),
  summarySentences: z.number().int().min(1).max(6),
});

/**
 * Wrap a route: validate the JSON body against `schema`, run `fn`, return JSON.
 * Validation problems → 400; anything thrown inside `fn` → 500 with its message.
 */
export function jsonRoute<S extends z.ZodType, R>(schema: S, fn: (body: z.infer<S>) => Promise<R>) {
  return async (request: Request) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: `Invalid request: ${parsed.error.issues[0]?.message ?? "bad input"}` }, { status: 400 });
    }
    try {
      return NextResponse.json(await fn(parsed.data));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}
