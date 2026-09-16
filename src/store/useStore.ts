import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppSettings,
  Bullet,
  Certification,
  Education,
  Experience,
  Link,
  MasterResume,
  TailoredResume,
} from "@/types";
import { newId } from "@/lib/utils";

interface AppState {
  master: MasterResume;
  library: TailoredResume[];
  settings: AppSettings;

  setMaster: (master: MasterResume) => void;
  updateMaster: (patch: Partial<MasterResume>) => void;
  addExperience: () => void;
  updateExperience: (id: string, patch: Partial<Experience>) => void;
  removeExperience: (id: string) => void;
  addBullet: (experienceId: string) => void;
  updateBullet: (experienceId: string, bulletId: string, text: string) => void;
  removeBullet: (experienceId: string, bulletId: string) => void;
  addVariant: (experienceId: string, bulletId: string, text: string) => void;
  updateVariant: (experienceId: string, bulletId: string, index: number, text: string) => void;
  removeVariant: (experienceId: string, bulletId: string, index: number) => void;
  /** Swap a variant into the primary slot; the old primary becomes a variant. */
  promoteVariant: (experienceId: string, bulletId: string, index: number) => void;
  addEducation: () => void;
  updateEducation: (id: string, patch: Partial<Education>) => void;
  removeEducation: (id: string) => void;
  addLink: () => void;
  updateLink: (id: string, patch: Partial<Link>) => void;
  removeLink: (id: string) => void;
  addCertification: () => void;
  updateCertification: (id: string, patch: Partial<Certification>) => void;
  removeCertification: (id: string) => void;

  saveTailored: (resume: TailoredResume) => void;
  removeTailored: (id: string) => void;
  renameTailored: (id: string, label: string) => void;

  setSettings: (patch: Partial<AppSettings>) => void;
  /** Restore from a backup file. The API key is never part of a backup. */
  restoreBackup: (data: { master: MasterResume; library: TailoredResume[]; rules?: AppSettings["rules"] }) => void;
}

export const DEFAULT_MODEL = "claude-opus-5";
export const MODELS = [
  { id: "claude-opus-5", label: "Opus 5 — best quality (recommended)" },
  { id: "claude-sonnet-5", label: "Sonnet 5 — faster, cheaper" },
  { id: "claude-haiku-4-5", label: "Haiku 4.5 — fastest" },
];

export const blankMaster = (): MasterResume => ({
  contact: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    links: [],
  },
  headline: "",
  summary: "",
  experiences: [],
  education: [],
  certifications: [],
  skills: [],
  tools: [],
  additional: [],
  updatedAt: new Date().toISOString(),
});

const defaultSettings = (): AppSettings => ({
  apiKey: "",
  model: DEFAULT_MODEL,
  template: "classic",
  rules: {
    maxBulletsPerRole: 4,
    maxBulletChars: 150,
    maxSkills: 12,
    summarySentences: 3,
  },
});

/** Bring an older persisted master up to the current shape. */
export function normalizeMaster(raw: Partial<MasterResume> | undefined): MasterResume {
  const base = blankMaster();
  if (!raw) return base;
  return {
    ...base,
    ...raw,
    contact: { ...base.contact, ...(raw.contact ?? {}), links: raw.contact?.links ?? [] },
    experiences: (raw.experiences ?? []).map((e) => ({
      ...e,
      bullets: (e.bullets ?? []).map((b) => ({ ...b, variants: b.variants ?? [] })),
    })),
    education: (raw.education ?? []).map((ed) => ({ ...ed, location: ed.location ?? "" })),
    certifications: raw.certifications ?? [],
    skills: raw.skills ?? [],
    tools: raw.tools ?? [],
    additional: raw.additional ?? [],
    headline: raw.headline ?? "",
    summary: raw.summary ?? "",
  };
}

const touch = (master: MasterResume): MasterResume => ({ ...master, updatedAt: new Date().toISOString() });

const mapBullet = (s: AppState, experienceId: string, bulletId: string, fn: (b: Bullet) => Bullet) => ({
  master: touch({
    ...s.master,
    experiences: s.master.experiences.map((e) =>
      e.id === experienceId ? { ...e, bullets: e.bullets.map((b) => (b.id === bulletId ? fn(b) : b)) } : e
    ),
  }),
});

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      master: blankMaster(),
      library: [],
      settings: defaultSettings(),

      setMaster: (master) => set({ master: touch(master) }),
      updateMaster: (patch) => set((s) => ({ master: touch({ ...s.master, ...patch }) })),

      addExperience: () =>
        set((s) => ({
          master: touch({
            ...s.master,
            experiences: [
              ...s.master.experiences,
              {
                id: newId(),
                company: "",
                role: "",
                location: "",
                startDate: "",
                endDate: "",
                bullets: [{ id: newId(), text: "", variants: [] }],
              },
            ],
          }),
        })),
      updateExperience: (id, patch) =>
        set((s) => ({
          master: touch({
            ...s.master,
            experiences: s.master.experiences.map((e) => (e.id === id ? { ...e, ...patch } : e)),
          }),
        })),
      removeExperience: (id) =>
        set((s) => ({
          master: touch({ ...s.master, experiences: s.master.experiences.filter((e) => e.id !== id) }),
        })),
      addBullet: (experienceId) =>
        set((s) => ({
          master: touch({
            ...s.master,
            experiences: s.master.experiences.map((e) =>
              e.id === experienceId ? { ...e, bullets: [...e.bullets, { id: newId(), text: "", variants: [] }] } : e
            ),
          }),
        })),
      updateBullet: (experienceId, bulletId, text) =>
        set((s) => mapBullet(s, experienceId, bulletId, (b) => ({ ...b, text }))),
      removeBullet: (experienceId, bulletId) =>
        set((s) => ({
          master: touch({
            ...s.master,
            experiences: s.master.experiences.map((e) =>
              e.id === experienceId ? { ...e, bullets: e.bullets.filter((b) => b.id !== bulletId) } : e
            ),
          }),
        })),
      addVariant: (experienceId, bulletId, text) =>
        set((s) => mapBullet(s, experienceId, bulletId, (b) => ({ ...b, variants: [...b.variants, text] }))),
      updateVariant: (experienceId, bulletId, index, text) =>
        set((s) =>
          mapBullet(s, experienceId, bulletId, (b) => ({
            ...b,
            variants: b.variants.map((v, i) => (i === index ? text : v)),
          }))
        ),
      removeVariant: (experienceId, bulletId, index) =>
        set((s) =>
          mapBullet(s, experienceId, bulletId, (b) => ({
            ...b,
            variants: b.variants.filter((_, i) => i !== index),
          }))
        ),
      promoteVariant: (experienceId, bulletId, index) =>
        set((s) =>
          mapBullet(s, experienceId, bulletId, (b) => {
            const next = b.variants[index];
            if (next === undefined) return b;
            return { ...b, text: next, variants: b.variants.map((v, i) => (i === index ? b.text : v)) };
          })
        ),

      addEducation: () =>
        set((s) => ({
          master: touch({
            ...s.master,
            education: [
              ...s.master.education,
              { id: newId(), school: "", degree: "", location: "", startDate: "", endDate: "", detail: "" },
            ],
          }),
        })),
      updateEducation: (id, patch) =>
        set((s) => ({
          master: touch({
            ...s.master,
            education: s.master.education.map((e) => (e.id === id ? { ...e, ...patch } : e)),
          }),
        })),
      removeEducation: (id) =>
        set((s) => ({
          master: touch({ ...s.master, education: s.master.education.filter((e) => e.id !== id) }),
        })),

      addLink: () =>
        set((s) => ({
          master: touch({
            ...s.master,
            contact: {
              ...s.master.contact,
              links: [...s.master.contact.links, { id: newId(), label: "", url: "" }],
            },
          }),
        })),
      updateLink: (id, patch) =>
        set((s) => ({
          master: touch({
            ...s.master,
            contact: {
              ...s.master.contact,
              links: s.master.contact.links.map((l) => (l.id === id ? { ...l, ...patch } : l)),
            },
          }),
        })),
      removeLink: (id) =>
        set((s) => ({
          master: touch({
            ...s.master,
            contact: { ...s.master.contact, links: s.master.contact.links.filter((l) => l.id !== id) },
          }),
        })),

      addCertification: () =>
        set((s) => ({
          master: touch({
            ...s.master,
            certifications: [...s.master.certifications, { id: newId(), name: "", issuer: "", date: "", url: "" }],
          }),
        })),
      updateCertification: (id, patch) =>
        set((s) => ({
          master: touch({
            ...s.master,
            certifications: s.master.certifications.map((c) => (c.id === id ? { ...c, ...patch } : c)),
          }),
        })),
      removeCertification: (id) =>
        set((s) => ({
          master: touch({ ...s.master, certifications: s.master.certifications.filter((c) => c.id !== id) }),
        })),

      saveTailored: (resume) =>
        set((s) => {
          const existingIdx = s.library.findIndex((r) => r.id === resume.id);
          if (existingIdx >= 0) {
            const next = [...s.library];
            next[existingIdx] = resume;
            return { library: next };
          }
          return { library: [resume, ...s.library] };
        }),
      removeTailored: (id) => set((s) => ({ library: s.library.filter((r) => r.id !== id) })),
      renameTailored: (id, label) =>
        set((s) => ({ library: s.library.map((r) => (r.id === id ? { ...r, label } : r)) })),

      setSettings: (patch) =>
        set((s) => ({
          settings: {
            ...s.settings,
            ...patch,
            rules: { ...s.settings.rules, ...(patch.rules ?? {}) },
          },
        })),
      restoreBackup: (data) =>
        set((s) => ({
          master: normalizeMaster(data.master),
          library: (data.library ?? []).map((r) => ({ ...r, template: r.template ?? "classic" })),
          settings: data.rules ? { ...s.settings, rules: { ...s.settings.rules, ...data.rules } } : s.settings,
        })),
    }),
    {
      name: "resume-studio-ai-v2",
      version: 3,
      // Server renders a blank store; the client rehydrates after mount (see app/(app)/layout.tsx).
      skipHydration: true,
      migrate: (persisted, version) => {
        const state = persisted as Partial<AppState>;
        if (version < 3) {
          const settings = { ...defaultSettings(), ...(state.settings ?? {}) };
          if (!MODELS.some((m) => m.id === settings.model)) settings.model = DEFAULT_MODEL;
          return {
            ...state,
            master: normalizeMaster(state.master),
            library: (state.library ?? []).map((r) => ({ ...r, template: r.template ?? "modern" })),
            settings,
          };
        }
        return state;
      },
    }
  )
);
