import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, FileUp, HelpCircle, Loader2, RefreshCw, Trash2, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import { PageHeader } from "@/components/PageHeader";
import { ACCEPTED_RESUME_FILES, ingest, readResumeFile } from "@/services/claude";
import { mergeImport } from "@/lib/merge";
import { cn, formatDateLong, newId } from "@/lib/utils";
import type { ImportChange, ImportedResume, SourceKind } from "@/types";

type Phase = "idle" | "loading" | "review";

const KIND_LABEL: Record<SourceKind, string> = {
  resume: "Resume",
  evaluation: "Evaluation",
  notes: "Notes",
  other: "Document",
};

export default function ImportPage() {
  const master = useStore((s) => s.master);
  const settings = useStore((s) => s.settings);
  const setMaster = useStore((s) => s.setMaster);
  const sources = useStore((s) => s.sources);
  const addSource = useStore((s) => s.addSource);
  const removeSource = useStore((s) => s.removeSource);

  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<ImportedResume | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [applied, setApplied] = useState<string | null>(null);

  const sourceName = file?.name ?? (text.trim() ? `Pasted text (${new Date().toLocaleDateString()})` : "");
  const canRun = !!file || text.trim().length > 0;

  const run = async (prior?: ImportedResume) => {
    setError(null);
    setPhase("loading");
    try {
      const source = file ? await readResumeFile(file) : ({ kind: "text", text } as const);
      const next = await ingest({ source, note, master, settings, prior: prior ?? null, answers: prior ? answers : undefined });
      setProposal(next);
      setAnswers({});
      setExcluded(new Set());
      setPhase("review");
    } catch (e) {
      setError((e as Error).message);
      setPhase(prior ? "review" : "idle");
    }
  };

  // The proposal the user will actually apply: unchecked bullets removed, edits kept.
  const effective = useMemo<ImportedResume | null>(() => {
    if (!proposal) return null;
    return {
      ...proposal,
      experiences: proposal.experiences
        .map((e, ei) => ({ ...e, bullets: e.bullets.filter((_, bi) => !excluded.has(`${ei}-${bi}`)) }))
        .filter((e) => e.bullets.length || !e.matchExperienceId),
    };
  }, [proposal, excluded]);

  const preview = useMemo(() => (effective ? mergeImport(master, effective) : null), [master, effective]);
  const profileChanges = preview?.changes.filter((c) => !["new-role", "new-bullet", "variant"].includes(c.kind)) ?? [];
  const unanswered = proposal?.questions.filter((q) => !answers[q.id]?.trim()) ?? [];

  const apply = () => {
    if (!preview || !proposal) return;
    setMaster(preview.master);
    const n = (k: ImportChange["kind"]) => preview.changes.filter((c) => c.kind === k).length;
    addSource({
      id: newId(),
      name: sourceName || "Untitled source",
      kind: proposal.sourceType,
      addedAt: new Date().toISOString(),
      roles: n("new-role"),
      bullets: n("new-bullet"),
      variants: n("variant"),
      profileFields: profileChanges.length,
    });
    setApplied(`${preview.changes.length} change${preview.changes.length !== 1 ? "s" : ""} applied from ${sourceName || "your source"}.`);
    reset();
  };

  const reset = () => {
    setProposal(null);
    setAnswers({});
    setExcluded(new Set());
    setFile(null);
    setText("");
    setNote("");
    setPhase("idle");
  };

  const updateBullet = (ei: number, bi: number, value: string) =>
    setProposal((p) =>
      p
        ? {
            ...p,
            experiences: p.experiences.map((e, i) =>
              i === ei ? { ...e, bullets: e.bullets.map((b, j) => (j === bi ? { ...b, text: value } : b)) } : e
            ),
          }
        : p
    );

  const toggleBullet = (key: string) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  return (
    <>
      <PageHeader
        eyebrow="Import"
        title="Add anything about your career"
        description="A resume, a performance review, notes, a LinkedIn export, an award — Claude sorts it into your profile and bullet bank, skips what you already have, and asks when it's unsure."
      />

      <div className="canvas" style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 860 }}>
        {applied && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 10, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", fontSize: 13, color: "var(--ink)" }}>
            <Check size={15} style={{ color: "#16a34a" }} /> {applied}
            <button onClick={() => setApplied(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--ink-3)", cursor: "pointer" }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── Input ── */}
        {phase === "idle" && (
          <section className="panel panel-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                padding: "30px 16px",
                borderRadius: 12,
                border: "1.5px dashed " + (file ? "var(--accent)" : "var(--line-strong)"),
                background: "var(--panel-2)",
                cursor: "pointer",
                textAlign: "center",
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f) {
                  setFile(f);
                  setError(null);
                }
              }}
            >
              <input
                type="file"
                accept={ACCEPTED_RESUME_FILES}
                style={{ display: "none" }}
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setError(null);
                }}
              />
              <FileUp size={22} style={{ color: file ? "var(--accent)" : "var(--ink-3)" }} />
              {file ? (
                <>
                  <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>{file.name}</span>
                  <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>Click or drop to choose a different file</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>Drop a file here, or click to choose one</span>
                  <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>PDF, Word (.docx), plain text, or a photo/screenshot</span>
                </>
              )}
            </label>

            {!file && (
              <textarea
                className="field-textarea-native"
                style={{ minHeight: 120 }}
                placeholder="…or paste text here: a paragraph about a project, feedback from a manager, bullets you jotted down."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            )}

            <input
              className="field-native"
              placeholder="Optional note — e.g. “my 2024 performance review at EY” or “these all happened at JPMorgan”"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            {error && (
              <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444", fontSize: 13 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn btn-gold" disabled={!canRun} onClick={() => run()}>
                <FileUp size={15} /> Read it
              </button>
            </div>
          </section>
        )}

        {/* ── Loading ── */}
        {phase === "loading" && (
          <section className="panel" style={{ padding: "56px 20px", textAlign: "center" }}>
            <Loader2 size={26} style={{ color: "var(--accent)", margin: "0 auto 14px", animation: "spin 1s linear infinite" }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>Reading {sourceName || "your source"}…</div>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--ink-3)" }}>
              Sorting into profile and bullet bank, grouping duplicates, checking against what you already have. Usually 30–90 seconds.
            </p>
          </section>
        )}

        {/* ── Review ── */}
        {phase === "review" && proposal && effective && preview && (
          <>
            <section className="panel panel-pad" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="chip" style={{ cursor: "default" }}>{KIND_LABEL[proposal.sourceType]}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{sourceName}</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>{proposal.sourceSummary}</p>
              <div style={{ display: "flex", gap: 10 }}>
                <Stat n={preview.changes.filter((c) => c.kind === "new-role").length} label="new roles" />
                <Stat n={preview.changes.filter((c) => c.kind === "new-bullet").length} label="new bullets" />
                <Stat n={preview.changes.filter((c) => c.kind === "variant").length} label="alternates" />
                <Stat n={profileChanges.length} label="profile updates" />
              </div>
              {error && (
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444", fontSize: 13 }}>
                  {error}
                </div>
              )}
            </section>

            {proposal.questions.length > 0 && (
              <section className="panel">
                <div className="panel-head">
                  <HelpCircle size={15} style={{ color: "var(--accent)", flexShrink: 0 }} />
                  <h3>Claude needs a few answers</h3>
                  <span className="sub">Answer what you can, then update. You can also apply as-is and fix by hand later.</span>
                </div>
                <div className="panel-pad" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {proposal.questions.map((q) => (
                    <div key={q.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.5 }}>{q.question}</span>
                      {q.choices.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {q.choices.map((c) => (
                            <button
                              key={c}
                              className={cn("btn btn-sm", answers[q.id] === c && "btn-gold")}
                              onClick={() => setAnswers((a) => ({ ...a, [q.id]: c }))}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      )}
                      <input
                        className="field-native"
                        placeholder={q.choices.length ? "Or type a different answer" : "Your answer"}
                        value={answers[q.id] ?? ""}
                        onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                      />
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      className="btn btn-sm"
                      disabled={unanswered.length === proposal.questions.length}
                      onClick={() => run(proposal)}
                    >
                      <RefreshCw size={13} /> Update with my answers
                    </button>
                  </div>
                </div>
              </section>
            )}

            {profileChanges.length > 0 && (
              <section className="panel">
                <div className="panel-head">
                  <h3>Master Profile</h3>
                  <span className="sub">Only blanks get filled and only new items are added — nothing you typed is overwritten.</span>
                </div>
                <div className="panel-pad" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {profileChanges.map((c, i) => (
                    <div key={i} style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 600, color: "var(--ink)" }}>{c.label}</span>
                      {c.detail ? ` — ${c.detail}` : ""}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {proposal.experiences.length > 0 && (
              <section className="panel">
                <div className="panel-head">
                  <h3>Bullet Bank</h3>
                  <span className="sub">Uncheck anything you don't want. Edit wording inline — especially bullets marked “drafted”.</span>
                </div>
                <div className="panel-pad" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {proposal.experiences.map((e, ei) => {
                    const existing = e.matchExperienceId ? master.experiences.find((x) => x.id === e.matchExperienceId) : undefined;
                    return (
                      <RoleGroup
                        key={ei}
                        title={`${e.role || "Untitled role"} · ${e.company || "Unknown employer"}`}
                        badge={existing ? "existing role" : "new role"}
                        isNew={!existing}
                        count={e.bullets.filter((_, bi) => !excluded.has(`${ei}-${bi}`)).length}
                      >
                        {e.bullets.map((b, bi) => {
                          const key = `${ei}-${bi}`;
                          const on = !excluded.has(key);
                          const matched = b.matchBulletId ? existing?.bullets.find((x) => x.id === b.matchBulletId) : undefined;
                          const alreadyHave = matched && matched.text.trim().toLowerCase() === b.text.trim().toLowerCase();
                          return (
                            <div key={key} style={{ display: "flex", gap: 10, alignItems: "flex-start", opacity: on ? 1 : 0.45 }}>
                              <input type="checkbox" checked={on} onChange={() => toggleBullet(key)} style={{ marginTop: 10, accentColor: "var(--accent)", width: 15, height: 15, flexShrink: 0 }} />
                              <div style={{ flex: 1 }}>
                                <textarea
                                  className="field-textarea-native"
                                  rows={2}
                                  style={{ minHeight: 40, fontSize: 12.5 }}
                                  value={b.text}
                                  onChange={(ev) => updateBullet(ei, bi, ev.target.value)}
                                />
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4, fontSize: 11, color: "var(--ink-3)" }}>
                                  {b.drafted && <span className="chip" style={{ fontSize: 10, padding: "1px 7px", cursor: "default", color: "var(--accent)" }}>drafted — check the facts</span>}
                                  {matched && !alreadyHave && <span>alternate phrasing of: “{matched.text.slice(0, 70)}{matched.text.length > 70 ? "…" : ""}”</span>}
                                  {alreadyHave && <span>already in your bank — will be skipped</span>}
                                  {b.variants.length > 0 && <span>+{b.variants.length} alternate{b.variants.length !== 1 ? "s" : ""}</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </RoleGroup>
                    );
                  })}
                </div>
              </section>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <button className="btn btn-ghost btn-sm" onClick={reset}>
                <X size={14} /> Discard
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {unanswered.length > 0 && (
                  <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
                    {unanswered.length} question{unanswered.length !== 1 ? "s" : ""} unanswered — you can still apply.
                  </span>
                )}
                <button className="btn btn-gold" disabled={preview.changes.length === 0} onClick={apply}>
                  <Check size={15} /> Apply {preview.changes.length} change{preview.changes.length !== 1 ? "s" : ""}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── History ── */}
        {phase === "idle" && (
          <section className="panel">
            <div className="panel-head">
              <h3>What you've added</h3>
              <span className="sub">{sources.length ? `${sources.length} source${sources.length !== 1 ? "s" : ""}` : "Nothing yet"}</span>
            </div>
            {sources.length > 0 && (
              <div className="panel-pad" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sources.map((r) => (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--panel-2)" }}>
                    <span className="chip" style={{ cursor: "default", flexShrink: 0 }}>{KIND_LABEL[r.kind]}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                        {formatDateLong(r.addedAt)} · {[
                          r.roles ? `${r.roles} role${r.roles !== 1 ? "s" : ""}` : null,
                          r.bullets ? `${r.bullets} bullet${r.bullets !== 1 ? "s" : ""}` : null,
                          r.variants ? `${r.variants} alternate${r.variants !== 1 ? "s" : ""}` : null,
                          r.profileFields ? `${r.profileFields} profile update${r.profileFields !== 1 ? "s" : ""}` : null,
                        ].filter(Boolean).join(", ") || "no changes"}
                      </div>
                    </div>
                    <button className="b-act danger" title="Remove from history (keeps the data it added)" onClick={() => removeSource(r.id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
}

function RoleGroup({ title, badge, isNew, count, children }: { title: string; badge: string; isNew: boolean; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ borderRadius: 10, border: "1px solid var(--line)", background: "var(--panel-2)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <span style={{ color: "var(--ink-3)", flexShrink: 0 }}>{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
        <span style={{ fontSize: 11, color: isNew ? "var(--accent)" : "var(--ink-3)", flexShrink: 0 }}>{badge} · {count} bullet{count !== 1 ? "s" : ""}</span>
      </button>
      {open && <div style={{ padding: "0 12px 12px", display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>}
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div style={{ flex: 1, padding: "8px 12px", borderRadius: 10, background: "var(--panel-2)", border: "1px solid var(--line)" }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: n ? "var(--accent)" : "var(--ink-3)" }}>{n}</div>
      <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{label}</div>
    </div>
  );
}
