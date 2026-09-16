import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function formatRange(start: string, end: string): string {
  if (!start && !end) return "";
  const left = formatMonthYear(start);
  const right = end ? formatMonthYear(end) : "Present";
  if (!left && !right) return "";
  if (!left) return right;
  return `${left} – ${right}`;
}

function formatMonthYear(input: string): string {
  if (!input) return "";
  // Parse YYYY-MM(-DD) as local time; `new Date("2026-01")` is UTC and shifts a month back in US zones.
  const m = /^(\d{4})-(\d{2})/.exec(input);
  const date = m ? new Date(Number(m[1]), Number(m[2]) - 1, 1) : new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function formatDateLong(input: string): string {
  if (!input) return "";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
