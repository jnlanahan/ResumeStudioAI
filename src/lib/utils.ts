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
  const left = formatMonthYear(start);
  const right = end ? formatMonthYear(end) : "Present";
  if (!left && !right) return "";
  if (!left) return right;
  return `${left} – ${right}`;
}

function formatMonthYear(input: string): string {
  if (!input) return "";
  const date = new Date(input.length === 7 ? `${input}-01` : input);
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
