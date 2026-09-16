import { useMemo, useState } from "react";
import { Bookmark, Check, ChevronRight, Copy, Printer, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import { PageHeader } from "@/components/PageHeader";
import { ResumeDocument } from "@/components/ResumeDocument";
import { analyzeBullets, generateIdentity } from "@/services/claude";
import type {
  AnalysisResult,
  IdentityOption,
  RatedBullet,
  TailoredResume,
  TemplateId,
  TweakedExperience,
} from "@/types";
import { cn, newId } from "@/lib/utils";
import { TEMPLATES } from "@/templates";

type Step = 1 | 2 | 3 | 4 | 5;

const STEP_LABELS: Record<Step, string> = {
  1: "Job",
  2: "Bullets",
  3: "Identity",
  4: "Skills",
  5: "Preview",
};

// ─── Pizza Tracker ────────────────────────────────────────────────────────────

function PizzaTracker({
  current,
  maxReached,
  onNavigate,
}: {
  current: Step;
  maxReached: Step;
  onNavigate: (s: Step) => void;
}) {
  const steps = [1, 2, 3, 4, 5] as Step[];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28 }}>
      {steps.map((s, i) => {
        const isComplete = s < current;
        const isActive = s === current;
        const isClickable = s <= maxReached;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: s < 5 ? 1 : undefined }}>
            <button
              disabled={!isClickable}
              onClick={() => isClickable && onNavigate(s)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
                background: "none",
                border: "none",
                cursor: isClickable ? "pointer" : "default",
                padding: "0 4px",
                opacity: isClickable ? 1 : 0.4,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  border: "2px solid " + (isActive ? "var(--accent)" : isComplete ? "var(--accent)" : "var(--line)"),
                  background: isComplete ? "var(--accent)" : isActive ? "var(--accent-soft)" : "var(--panel)",
                  color: isComplete ? "var(--on-gold)" : isActive ? "var(--accent)" : "var(--ink-3)",
                  transition: "all .2s",
                }}
              >
                {isComplete ? <Check size={13} strokeWidth={2.5} /> : s}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "var(--ink)" : "var(--ink-3)",
                  whiteSpace: "nowrap",
                }}
              >
                {STEP_LABELS[s]}
              </span>
            </button>
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background: s < current ? "var(--accent)" : "var(--line)",
                  marginBottom: 18,
                  transition: "background .2s",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TailorPage() {
  const master = useStore((s) => s.master);
  const settings = useStore((s) => s.settings);
  const saveTailored = useStore((s) => s.saveTailored);

  // Step navigation
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [maxReached, setMaxReached] = useState<Step>(1);

  // Step 1
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jd, setJd] = useState("");

  // Step 2
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [included, setIncluded] = useState<Record<string, boolean>>({});
  const [tweakAccepted, setTweakAccepted] = useState<Record<string, boolean>>({});

  // Step 3
  const [identityOptions, setIdentityOptions] = useState<IdentityOption[]>([]);
  const [selectedIdentityIdx, setSelectedIdentityIdx] = useState(0);
  const [customHeadline, setCustomHeadline] = useState("");
  const [customSummary, setCustomSummary] = useState("");

  // Step 4
  const [skills, setSkills] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState("");

  // Step 5
  const [resumeLabel, setResumeLabel] = useState("");
  const [template, setTemplate] = useState<TemplateId>(settings.template);
  const [saved, setSaved] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasBullets = master.experiences.some((e) => e.bullets.some((b) => b.text.trim()));
  const hasKey = settings.apiKey.trim().length > 0;

  const goToStep = (s: Step) => {
    setCurrentStep(s);
    if (s > maxReached) setMaxReached(s);
  };

  // Effective bullet text (use tweak if accepted, else original)
  const effectiveText = (rated: RatedBullet): string => {
    if (rated.suggestedTweak && tweakAccepted[rated.bulletId]) {
      return rated.suggestedTweak;
    }
    const exp = master.experiences.find((e) => e.id === rated.experienceId);
    return exp?.bullets.find((b) => b.id === rated.bulletId)?.text ?? "";
  };

  // Step 1 → 2: analyze
  const handleAnalyze = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await analyzeBullets(jd, master, settings);
      setAnalysis(result);
      // Default inclusion: strong/medium = true, weak = false
      const inc: Record<string, boolean> = {};
      const acc: Record<string, boolean> = {};
      for (const rb of result.ratedBullets) {
        inc[rb.bulletId] = rb.rating !== "weak";
        acc[rb.bulletId] = false;
      }
      setIncluded(inc);
      setTweakAccepted(acc);
      goToStep(2);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2 → 3: generate identity
  const handleGenerateIdentity = async () => {
    setError(null);
    setLoading(true);
    try {
      const selectedBullets = (analysis?.ratedBullets ?? [])
        .filter((rb) => included[rb.bulletId] !== false)
        .map((rb) => {
          const exp = master.experiences.find((e) => e.id === rb.experienceId);
          return { role: exp?.role ?? "", company: exp?.company ?? "", text: effectiveText(rb) };
        });
      const options = await generateIdentity({ jd, jobTitle, company, selectedBullets, masterSummary: master.summary, settings });
      setIdentityOptions(options);
      setSelectedIdentityIdx(0);
      if (options[0]) {
        setCustomHeadline(options[0].headline);
        setCustomSummary(options[0].summary);
      }
      setSkills(analysis?.suggestedSkills ?? []);
      goToStep(3);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Assemble the tailored resume (memoized, excludes label for preview perf)
  const tailoredPreview = useMemo((): TailoredResume => {
    const experiences: TweakedExperience[] = master.experiences.map((exp) => {
      const bullets = (analysis?.ratedBullets ?? [])
        .filter((rb) => rb.experienceId === exp.id && included[rb.bulletId] !== false)
        .map((rb) => {
          const originalBullet = exp.bullets.find((b) => b.id === rb.bulletId);
          const original = originalBullet?.text ?? "";
          const tweaked = effectiveText(rb);
          return {
            originalId: rb.bulletId,
            original,
            tweaked,
            changed: tweaked !== original,
            rationale: rb.rationale,
          };
        });
      return { experienceId: exp.id, bullets };
    });
    return {
      id: "preview",
      label: "",
      jobTitle,
      company,
      jobDescription: jd,
      headline: customHeadline,
      summary: customSummary,
      experiences,
      skills,
      notes: "",
      template,
      createdAt: new Date().toISOString(),
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis, included, tweakAccepted, customHeadline, customSummary, skills, jobTitle, company, jd, template]);

  const handleSave = () => {
    saveTailored({
      ...tailoredPreview,
      id: newId(),
      label: resumeLabel.trim() || `${jobTitle}${company ? " — " + company : ""}`.trim() || "Untitled",
      createdAt: new Date().toISOString(),
    });
    setSaved(true);
  };

  const copyText = async () => {
    const lines: string[] = [];
    const c = master.contact;
    lines.push(c.fullName);
    if (customHeadline) lines.push(customHeadline);
    const linkParts = c.links.map((l) => l.label || l.url).filter(Boolean);
    lines.push([c.location, c.email, c.phone, ...linkParts].filter(Boolean).join(" • "));
    if (customSummary) lines.push("", "SUMMARY", customSummary);
    lines.push("", "EXPERIENCE");
    for (const te of tailoredPreview.experiences) {
      const exp = master.experiences.find((e) => e.id === te.experienceId);
      if (!exp || !te.bullets.length) continue;
      lines.push("", `${exp.role}${exp.company ? " · " + exp.company : ""}`);
      for (const b of te.bullets) lines.push(`• ${b.tweaked}`);
    }
    if (skills.length) lines.push("", "SKILLS", skills.join(" · "));
    if (master.education.length) {
      lines.push("", "EDUCATION");
      for (const ed of master.education) {
        lines.push(`${ed.degree}${ed.school ? " · " + ed.school : ""}`);
        if (ed.detail) lines.push(ed.detail);
      }
    }
    await navigator.clipboard.writeText(lines.join("\n"));
  };

  return (
    <>
      <PageHeader
        eyebrow="Tailor"
        title="Tailor your resume"
        description="Paste a job description and let AI rate your bullets, suggest tweaks, and draft your headline and summary."
        actions={
          currentStep === 5 && !loading ? (
            <>
              <button onClick={() => window.print()} className="btn btn-sm no-print">
                <Printer size={14} /> Print / PDF
              </button>
              <button onClick={copyText} className="btn btn-sm no-print">
                <Copy size={14} /> Copy text
              </button>
              <button
                onClick={handleSave}
                className={cn("btn btn-gold btn-sm no-print", saved ? "opacity-80" : "")}
                disabled={saved}
              >
                {saved ? <><Check size={14} /> Saved</> : <><Bookmark size={14} /> Save to library</>}
              </button>
            </>
          ) : null
        }
      />

      <div className="canvas">
        <PizzaTracker current={currentStep} maxReached={maxReached} onNavigate={goToStep} />

        {error && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#ef4444",
              fontSize: 13,
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            {error}
            <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── Step 1: Job Description ── */}
        {currentStep === 1 && (
          <StepPanel>
            {(!hasBullets || !hasKey) && (
              <div style={{ marginBottom: 20, padding: "12px 16px", borderRadius: 10, background: "var(--accent-soft)", border: "1px solid var(--accent-line)", fontSize: 13, color: "var(--ink-2)" }}>
                {!hasBullets ? (
                  <>Build your <Link href="/bullet-bank" style={{ color: "var(--accent)", textDecoration: "underline" }}>Bullet Bank</Link> first.</>
                ) : (
                  <>Add your API key in <Link href="/settings" style={{ color: "var(--accent)", textDecoration: "underline" }}>Settings</Link>.</>
                )}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <FieldGroup label="Job Title">
                <input
                  className="field-native"
                  placeholder="Senior Product Manager"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </FieldGroup>
              <FieldGroup label="Company">
                <input
                  className="field-native"
                  placeholder="Acme Corp"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </FieldGroup>
            </div>
            <FieldGroup label="Job Description">
              <textarea
                className="field-textarea-native"
                style={{ minHeight: 260 }}
                placeholder="Paste the full job description here…"
                value={jd}
                onChange={(e) => setJd(e.target.value)}
              />
            </FieldGroup>
            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
              <button
                className="btn btn-gold"
                disabled={!jd.trim() || !hasBullets || !hasKey || loading}
                onClick={handleAnalyze}
              >
                {loading ? "Analyzing…" : <><Sparkles size={15} /> Analyze my bullets</>}
              </button>
            </div>
          </StepPanel>
        )}

        {/* ── Step 2: Bullet Review ── */}
        {currentStep === 2 && analysis && (
          <StepPanel>
            <div style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 20, lineHeight: 1.5 }}>
              Your bullets are rated below. <strong>Strong</strong> and <strong>Medium</strong> are pre-selected. Toggle any bullet, and accept suggested rewording where it's accurate.
            </div>

            {master.experiences.map((exp) => {
              const expBullets = analysis.ratedBullets.filter((rb) => rb.experienceId === exp.id);
              if (!expBullets.length) return null;
              return (
                <div key={exp.id} style={{ marginBottom: 24 }}>
                  <div className="group-head" style={{ marginBottom: 10 }}>
                    <span style={{ fontWeight: 600, color: "var(--ink)" }}>{exp.role || "Untitled role"}</span>
                    {exp.company && <span style={{ color: "var(--ink-3)" }}> · {exp.company}</span>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {expBullets.map((rb) => {
                      const isIncluded = included[rb.bulletId] !== false;
                      const originalText = exp.bullets.find((b) => b.id === rb.bulletId)?.text ?? "";
                      return (
                        <div
                          key={rb.bulletId}
                          style={{
                            borderRadius: 10,
                            border: "1px solid " + (isIncluded ? "var(--accent-line)" : "var(--line)"),
                            background: isIncluded ? "linear-gradient(100deg, var(--accent-soft), transparent 80%)" : "var(--panel-2)",
                            padding: "12px 14px",
                            opacity: isIncluded ? 1 : 0.5,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                            <input
                              type="checkbox"
                              checked={isIncluded}
                              onChange={(e) => setIncluded((prev) => ({ ...prev, [rb.bulletId]: e.target.checked }))}
                              style={{ marginTop: 3, flexShrink: 0, accentColor: "var(--accent)", width: 15, height: 15 }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                <RatingBadge rating={rb.rating} />
                                <span style={{ fontSize: 12, color: "var(--ink-3)", fontStyle: "italic" }}>{rb.rationale}</span>
                              </div>
                              <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.5 }}>{originalText}</div>

                              {rb.suggestedTweak && rb.suggestedTweak !== originalText && (
                                <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 8, background: "var(--panel)", border: "1px solid var(--line)" }}>
                                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 6 }}>
                                    Suggested reword
                                  </div>
                                  <div style={{ fontSize: 13, color: "var(--ink-3)", textDecoration: "line-through", marginBottom: 3 }}>{originalText}</div>
                                  <div style={{ fontSize: 13, color: "var(--accent)", lineHeight: 1.5 }}>{rb.suggestedTweak}</div>
                                  <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, cursor: "pointer" }}>
                                    <input
                                      type="checkbox"
                                      checked={tweakAccepted[rb.bulletId] ?? false}
                                      onChange={(e) => setTweakAccepted((prev) => ({ ...prev, [rb.bulletId]: e.target.checked }))}
                                      style={{ accentColor: "var(--accent)", width: 14, height: 14 }}
                                    />
                                    <span style={{ fontSize: 12, color: "var(--ink-2)" }}>Wording change preserves meaning — use this version</span>
                                  </label>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 8 }}>
              <button
                className="btn btn-gold"
                disabled={loading}
                onClick={handleGenerateIdentity}
              >
                {loading ? "Generating…" : <>Continue to Identity <ChevronRight size={15} /></>}
              </button>
            </div>
          </StepPanel>
        )}

        {/* ── Step 3: Identity ── */}
        {currentStep === 3 && (
          <StepPanel>
            <div style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 20, lineHeight: 1.5 }}>
              Pick the positioning that fits best, then edit the headline and summary below.
            </div>

            {identityOptions.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginBottom: 24 }}>
                {identityOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedIdentityIdx(i);
                      setCustomHeadline(opt.headline);
                      setCustomSummary(opt.summary);
                    }}
                    style={{
                      textAlign: "left",
                      padding: "16px",
                      borderRadius: 12,
                      border: "2px solid " + (selectedIdentityIdx === i ? "var(--accent)" : "var(--line)"),
                      background: selectedIdentityIdx === i ? "var(--accent-soft)" : "var(--panel)",
                      cursor: "pointer",
                      transition: "border-color .15s, background .15s",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)", marginBottom: 6 }}>{opt.headline}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-2)", lineHeight: 1.55 }}>{opt.summary}</div>
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <FieldGroup label="Headline">
                <input
                  className="field-native"
                  value={customHeadline}
                  onChange={(e) => setCustomHeadline(e.target.value)}
                  placeholder="e.g. Product Leader with 8 Years in AI-Driven Experiences"
                />
              </FieldGroup>
              <FieldGroup label="Summary">
                <textarea
                  className="field-textarea-native"
                  style={{ minHeight: 100 }}
                  value={customSummary}
                  onChange={(e) => setCustomSummary(e.target.value)}
                  placeholder="2–3 sentence summary…"
                />
              </FieldGroup>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <button className="btn btn-gold" onClick={() => goToStep(4)}>
                Continue to Skills <ChevronRight size={15} />
              </button>
            </div>
          </StepPanel>
        )}

        {/* ── Step 4: Skills ── */}
        {currentStep === 4 && (
          <StepPanel>
            <div style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 16, lineHeight: 1.5 }}>
              These skills were derived from the job description. Remove any that don't apply or add others.
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <input
                className="field-native"
                style={{ flex: 1 }}
                value={skillDraft}
                placeholder="Add a skill and press Enter"
                onChange={(e) => setSkillDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const next = skillDraft.trim();
                    if (next && !skills.includes(next)) setSkills((prev) => [...prev, next]);
                    setSkillDraft("");
                  }
                }}
              />
              <button
                className="btn btn-sm"
                onClick={() => {
                  const next = skillDraft.trim();
                  if (next && !skills.includes(next)) setSkills((prev) => [...prev, next]);
                  setSkillDraft("");
                }}
              >
                Add
              </button>
            </div>
            {master.skills.some((s) => !skills.includes(s)) && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 6 }}>
                  From your profile — click to add
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {master.skills.filter((s) => !skills.includes(s)).map((s) => (
                    <button key={s} className="chip" style={{ opacity: 0.7 }} onClick={() => setSkills((prev) => [...prev, s])}>
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {skills.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--ink-3)" }}>No skills yet — add some above.</p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {skills.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSkills((prev) => prev.filter((x) => x !== s))}
                    className="chip"
                    title="Remove"
                  >
                    {s}
                    <X size={12} style={{ opacity: 0.6 }} />
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <button className="btn btn-gold" onClick={() => goToStep(5)}>
                Preview resume <ChevronRight size={15} />
              </button>
            </div>
          </StepPanel>
        )}

        {/* ── Step 5: Preview & Save ── */}
        {currentStep === 5 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="panel panel-pad" style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <FieldGroup label="Template" style={{ flexShrink: 0 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      className={cn("btn btn-sm", template === t.id && "btn-gold")}
                      onClick={() => setTemplate(t.id)}
                      title={t.description}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </FieldGroup>
              <FieldGroup label="Name this resume" style={{ flex: 1, minWidth: 220 }}>
                <input
                  className="field-native"
                  placeholder={`${jobTitle}${company ? " — " + company : ""}` || "My tailored resume"}
                  value={resumeLabel}
                  onChange={(e) => setResumeLabel(e.target.value)}
                />
              </FieldGroup>
              <div style={{ paddingTop: 22 }}>
                <button
                  className={cn("btn btn-gold", saved ? "opacity-80" : "")}
                  disabled={saved}
                  onClick={handleSave}
                >
                  {saved ? <><Check size={14} /> Saved to library</> : <><Bookmark size={14} /> Save to library</>}
                </button>
              </div>
            </div>
            <div style={{ overflow: "auto" }}>
              <div style={{ border: "1px solid var(--line)", borderRadius: 6, display: "inline-block" }}>
                <ResumeDocument master={master} tailored={tailoredPreview} rules={settings.rules} />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="panel panel-pad" style={{ display: "flex", flexDirection: "column", gap: 0, maxWidth: 760 }}>
      {children}
    </div>
  );
}

function FieldGroup({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

function RatingBadge({ rating }: { rating: "strong" | "medium" | "weak" }) {
  const map = {
    strong: { label: "Strong", bg: "rgba(34,197,94,0.15)", color: "#16a34a" },
    medium: { label: "Medium", bg: "rgba(234,179,8,0.15)", color: "#a16207" },
    weak:   { label: "Weak",   bg: "rgba(239,68,68,0.12)", color: "#dc2626" },
  };
  const { label, bg, color } = map[rating];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.04em",
        background: bg,
        color,
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}
