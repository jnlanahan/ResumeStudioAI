import type { ImportChange, ImportedResume, MasterResume } from "@/types";
import { newId } from "@/lib/utils";

const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
const hasText = (list: string[], text: string) => list.some((x) => norm(x) === norm(text));
const union = (existing: string[], incoming: string[]) => {
  const out = [...existing];
  for (const item of incoming) {
    const t = item.trim();
    if (t && !hasText(out, t)) out.push(t);
  }
  return out;
};

/**
 * Fold an imported resume into the master. Pure: returns the new master plus a
 * list of changes for the user to review before committing.
 *
 * Rules: never overwrite non-empty text the user already has; matching bullets
 * become variants instead of duplicates; lists are unioned case-insensitively.
 */
export function mergeImport(master: MasterResume, imported: ImportedResume): { master: MasterResume; changes: ImportChange[] } {
  const changes: ImportChange[] = [];
  const next: MasterResume = structuredClone(master);

  // Contact — fill blanks only.
  const c = next.contact;
  const ic = imported.contact;
  const filled: string[] = [];
  if (!c.fullName && ic.fullName) { c.fullName = ic.fullName; filled.push("name"); }
  if (!c.email && ic.email) { c.email = ic.email; filled.push("email"); }
  if (!c.phone && ic.phone) { c.phone = ic.phone; filled.push("phone"); }
  if (!c.location && ic.location) { c.location = ic.location; filled.push("location"); }
  for (const link of ic.links) {
    if (!link.url && !link.label) continue;
    const dup = c.links.some((l) => (link.url && norm(l.url) === norm(link.url)) || (!link.url && norm(l.label) === norm(link.label)));
    if (!dup) { c.links.push({ id: newId(), label: link.label, url: link.url }); filled.push(`link: ${link.label || link.url}`); }
  }
  if (!next.headline && imported.headline) { next.headline = imported.headline; filled.push("headline"); }
  if (!next.summary && imported.summary) { next.summary = imported.summary; filled.push("summary"); }
  if (filled.length) changes.push({ kind: "contact", label: "Profile filled in", detail: filled.join(", ") });

  // Experiences + bullets.
  for (const ie of imported.experiences) {
    let exp = ie.matchExperienceId ? next.experiences.find((e) => e.id === ie.matchExperienceId) : undefined;
    if (!exp) {
      exp = {
        id: newId(),
        company: ie.company,
        role: ie.role,
        location: ie.location,
        startDate: ie.startDate,
        endDate: ie.endDate,
        bullets: [],
      };
      next.experiences.push(exp);
      changes.push({ kind: "new-role", label: `${ie.role || "Untitled role"} · ${ie.company}` });
    } else {
      if (!exp.company) exp.company = ie.company;
      if (!exp.role) exp.role = ie.role;
      if (!exp.location) exp.location = ie.location;
      if (!exp.startDate) exp.startDate = ie.startDate;
      if (!exp.endDate) exp.endDate = ie.endDate;
    }
    const roleLabel = `${exp.role || "Untitled role"} · ${exp.company}`;

    for (const ib of ie.bullets) {
      const text = ib.text.trim();
      if (!text) continue;
      const target = ib.matchBulletId ? exp.bullets.find((b) => b.id === ib.matchBulletId) : undefined;
      if (target) {
        const before = target.variants.length;
        const all = [text, ...ib.variants].filter((v) => norm(v) !== norm(target.text));
        target.variants = union(target.variants, all);
        if (target.variants.length > before) {
          changes.push({
            kind: "variant",
            label: roleLabel,
            detail: `${target.variants.length - before} alternate phrasing(s) added to: “${target.text.slice(0, 80)}${target.text.length > 80 ? "…" : ""}”`,
          });
        }
      } else if (!exp.bullets.some((b) => norm(b.text) === norm(text) || hasText(b.variants, text))) {
        exp.bullets.push({ id: newId(), text, variants: union([], ib.variants.filter((v) => norm(v) !== norm(text))) });
        changes.push({ kind: "new-bullet", label: roleLabel, detail: text });
      }
    }
  }

  // Education / certifications — add if not already present.
  for (const ed of imported.education) {
    if (!ed.school && !ed.degree) continue;
    const dup = next.education.some((e) => norm(e.school) === norm(ed.school) && norm(e.degree) === norm(ed.degree));
    if (dup) continue;
    next.education.push({ id: newId(), ...ed });
    changes.push({ kind: "new-education", label: `${ed.degree} · ${ed.school}` });
  }
  for (const cert of imported.certifications) {
    if (!cert.name) continue;
    if (next.certifications.some((x) => norm(x.name) === norm(cert.name))) continue;
    next.certifications.push({ id: newId(), ...cert, url: "" });
    changes.push({ kind: "new-certification", label: cert.name });
  }

  const addList = (key: "skills" | "tools" | "additional", incoming: string[]) => {
    const before = next[key].length;
    next[key] = union(next[key], incoming);
    const added = next[key].length - before;
    if (added) changes.push({ kind: key, label: `${added} ${key === "additional" ? "additional line(s)" : key} added`, detail: next[key].slice(before).join(", ") });
  };
  addList("skills", imported.skills);
  addList("tools", imported.tools);
  addList("additional", imported.additional);

  return { master: next, changes };
}
