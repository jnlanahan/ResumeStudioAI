import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, FileUp, Loader2, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import { ACCEPTED_RESUME_FILES, importResume, readResumeFile } from "@/services/claude";
import { mergeImport } from "@/lib/merge";
import type { ImportChange, MasterResume } from "@/types";

type Phase = "input" | "loading" | "review";

interface Group {
  title: string;
  isNewRole: boolean;
  items: ImportChange[];
}

export function ImportResumeModal({ onClose }: { onClose: () => void }) {
  const master = useStore((s) => s.master);
  const settings = useStore((s) => s.settings);
  const setMaster = useStore((s) => s.setMaster);

  const [file, setFile] = useState<File | null>(null);
  const [showPaste, setShowPaste] = useState(false);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ master: MasterResume; changes: ImportChange[] } | null>(null);

  const canRun = !!file || text.trim().length > 0;

  const run = async () => {
    setError(null);
    setPhase("loading");
    try {
      const source = file ? await readResumeFile(file) : ({ kind: "text", text } as const);
      const imported = await importResume(source, master, settings);
      setResult(mergeImport(master, imported));
      setPhase("review");
    } catch (e) {
      setError((e as Error).message);
      setPhase("input");
    }
  };

  const apply = () => {
    if (!result) return;
    setMaster(result.master);
    onClose();
  };

  const counts = result
    ? {
        roles: result.changes.filter((c) => c.kind === "new-role").length,
        bullets: result.changes.filter((c) => c.kind === "new-bullet").length,
        variants: result.changes.filter((c) => c.kind === "variant").length,
      }
    : null;

  // Group changes by role so a big first import reads as a short list, not a wall.
  const groups = useMemo<Group[]>(() => {
    if (!result) return [];
    const byRole = new Map<string, Group>();
    const other: ImportChange[] = [];
    for (const c of result.changes) {
      if (c.kind === "new-role" || c.kind === "new-bullet" || c.kind === "variant") {
        const g = byRole.get(c.label) ?? { title: c.label, isNewRole: false, items: [] };
        if (c.kind === "new-role") g.isNewRole = true;
        else g.items.push(c);
        byRole.set(c.label, g);
      } else {
        other.push(c);
      }
    }
    const list = [...byRole.values()];
    if (other.length) list.push({ title: "Profile, education & skills", isNewRole: false, items: other });
    return list;
  }, [result]);

  return (
    <div className="scrim no-print" onClick={phase === "loading" ? undefined : onClose}>
      <div className="modal" style={{ width: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <FileUp size={16} style={{ color: "var(--accent)" }} />
          <h3>Import a resume</h3>
          {phase !== "loading" && (
            <button className="modal-x" onClick={onClose}>
              <X size={15} />
            </button>
          )}
        </div>

        {phase === "input" && (
          <>
            <div style={{ padding: "16px 20px" }}>
              <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>
                Claude reads the resume, fills your profile, groups bullets that say the same thing in different
                words, and skips anything already in your bank. You review the changes before they're saved.
              </p>

              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  padding: "28px 16px",
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
                    <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>
                      Drop your resume here, or click to choose a file
                    </span>
                    <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>PDF, Word (.docx), plain text, or a photo/screenshot</span>
                  </>
                )}
              </label>

              {!file && (
                <div style={{ marginTop: 12 }}>
                  {showPaste ? (
                    <textarea
                      className="field-textarea-native"
                      style={{ minHeight: 180 }}
                      placeholder="Paste the full text of your resume…"
                      value={text}
                      autoFocus
                      onChange={(e) => setText(e.target.value)}
                    />
                  ) : (
                    <button
                      onClick={() => setShowPaste(true)}
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 12.5, color: "var(--accent)", textDecoration: "underline" }}
                    >
                      No file? Paste the text instead
                    </button>
                  )}
                </div>
              )}

              {error && (
                <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444", fontSize: 13 }}>
                  {error}
                </div>
              )}
            </div>
            <div className="modal-foot" style={{ justifyContent: "flex-end" }}>
              <button className="btn btn-ghost btn-sm" onClick={onClose}>
                Cancel
              </button>
              <button className="btn btn-gold btn-sm" disabled={!canRun} onClick={run}>
                Read resume
              </button>
            </div>
          </>
        )}

        {phase === "loading" && (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <Loader2 size={26} style={{ color: "var(--accent)", margin: "0 auto 14px", animation: "spin 1s linear infinite" }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>Reading your resume…</div>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--ink-3)" }}>
              Grouping duplicate bullets and matching against your bank. Usually 30–90 seconds.
            </p>
          </div>
        )}

        {phase === "review" && result && counts && (
          <>
            <div style={{ padding: "16px 20px", maxHeight: "60vh", overflow: "auto" }}>
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <Stat n={counts.roles} label="new roles" />
                <Stat n={counts.bullets} label="new bullets" />
                <Stat n={counts.variants} label="merged as alternates" />
              </div>

              {result.changes.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--ink-3)" }}>
                  Nothing new — everything in this resume is already in your bank.
                </p>
              ) : (
                <>
                  <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--ink-3)" }}>
                    Only what's new is listed. Expand a role to see the details; nothing already in your bank is touched.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {groups.map((g) => (
                      <ChangeGroup key={g.title} group={g} />
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="modal-foot" style={{ justifyContent: "flex-end", paddingTop: 12, borderTop: "1px solid var(--line)" }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setPhase("input");
                  setResult(null);
                }}
              >
                Back
              </button>
              <button className="btn btn-gold btn-sm" disabled={result.changes.length === 0} onClick={apply}>
                <Check size={14} /> Apply to my bank
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ChangeGroup({ group }: { group: Group }) {
  const { title, isNewRole, items } = group;
  const [open, setOpen] = useState(false);
  const count = (kind: ImportChange["kind"]) => items.filter((c) => c.kind === kind).length;
  const plural = (n: number, word: string) => `${n} ${word}${n !== 1 ? "s" : ""}`;
  const parts = [
    isNewRole ? "new role" : null,
    count("new-bullet") ? plural(count("new-bullet"), "new bullet") : null,
    count("variant") ? plural(count("variant"), "alternate") : null,
  ].filter(Boolean);
  const summary = parts.length ? parts.join(" · ") : plural(items.length, "change");

  return (
    <div style={{ borderRadius: 10, border: "1px solid var(--line)", background: "var(--panel-2)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={items.length === 0}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "none", border: "none", cursor: items.length ? "pointer" : "default", textAlign: "left" }}
      >
        <span style={{ color: "var(--ink-3)", flexShrink: 0, visibility: items.length ? "visible" : "hidden" }}>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {title}
        </span>
        <span style={{ fontSize: 11.5, color: isNewRole ? "var(--accent)" : "var(--ink-3)", flexShrink: 0 }}>{summary}</span>
      </button>
      {open && items.length > 0 && (
        <div style={{ padding: "0 12px 10px 34px", display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((c, i) => (
            <div key={i} style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.5 }}>
              <span className="chip" style={{ fontSize: 10, padding: "1px 7px", cursor: "default", marginRight: 6 }}>
                {KIND_LABEL[c.kind]}
              </span>
              {c.detail ?? c.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const KIND_LABEL: Record<ImportChange["kind"], string> = {
  "new-role": "New role",
  "new-bullet": "New bullet",
  variant: "Alternate",
  "new-education": "Education",
  "new-certification": "Certification",
  skills: "Skills",
  tools: "Tools",
  additional: "Additional",
  contact: "Profile",
};

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div style={{ flex: 1, padding: "10px 12px", borderRadius: 10, background: "var(--panel-2)", border: "1px solid var(--line)" }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: n ? "var(--accent)" : "var(--ink-3)" }}>{n}</div>
      <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{label}</div>
    </div>
  );
}
