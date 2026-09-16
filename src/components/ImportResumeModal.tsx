import { useState } from "react";
import { Check, FileUp, Loader2, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import { fileToBase64, importResume } from "@/services/claude";
import { mergeImport } from "@/lib/merge";
import type { ImportChange, MasterResume } from "@/types";
import { cn } from "@/lib/utils";

type Phase = "input" | "loading" | "review";

export function ImportResumeModal({ onClose }: { onClose: () => void }) {
  const master = useStore((s) => s.master);
  const settings = useStore((s) => s.settings);
  const setMaster = useStore((s) => s.setMaster);

  const [tab, setTab] = useState<"pdf" | "text">("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ master: MasterResume; changes: ImportChange[] } | null>(null);

  const canRun = settings.apiKey.trim() && (tab === "pdf" ? !!file : text.trim().length > 0);

  const run = async () => {
    setError(null);
    setPhase("loading");
    try {
      const source =
        tab === "pdf" && file
          ? ({ kind: "pdf", base64: await fileToBase64(file) } as const)
          : ({ kind: "text", text } as const);
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
                Claude reads the resume, groups bullets that say the same thing in different words, and matches
                roles against what's already in your bank. You review every change before it's saved.
              </p>

              {!settings.apiKey.trim() && (
                <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, background: "var(--accent-soft)", border: "1px solid var(--accent-line)", fontSize: 13, color: "var(--ink-2)" }}>
                  Add your API key in Settings first.
                </div>
              )}

              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {(["pdf", "text"] as const).map((t) => (
                  <button
                    key={t}
                    className={cn("btn btn-sm", tab === t && "btn-gold")}
                    onClick={() => setTab(t)}
                  >
                    {t === "pdf" ? "Upload PDF" : "Paste text"}
                  </button>
                ))}
              </div>

              {tab === "pdf" ? (
                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    padding: "28px 16px",
                    borderRadius: 12,
                    border: "1.5px dashed var(--line-strong)",
                    background: "var(--panel-2)",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files[0];
                    if (f && f.type === "application/pdf") setFile(f);
                    else setError("Please drop a PDF file.");
                  }}
                >
                  <input
                    type="file"
                    accept="application/pdf"
                    style={{ display: "none" }}
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  <FileUp size={22} style={{ color: "var(--ink-3)" }} />
                  {file ? (
                    <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>{file.name}</span>
                  ) : (
                    <span style={{ fontSize: 13, color: "var(--ink-3)" }}>Drop a PDF here or click to choose</span>
                  )}
                </label>
              ) : (
                <textarea
                  className="field-textarea-native"
                  style={{ minHeight: 220 }}
                  placeholder="Paste the full text of your resume…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              )}

              {error && (
                <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444", fontSize: 13 }}>
                  {error}
                </div>
              )}
            </div>
            <div className="modal-foot" style={{ justifyContent: "flex-end" }}>
              <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
              <button className="btn btn-gold btn-sm" disabled={!canRun} onClick={run}>
                Read resume
              </button>
            </div>
          </>
        )}

        {phase === "loading" && (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <Loader2 size={26} className="spin" style={{ color: "var(--accent)", margin: "0 auto 14px", animation: "spin 1s linear infinite" }} />
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
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {result.changes.map((c, i) => (
                    <div
                      key={i}
                      style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--panel-2)" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="chip" style={{ fontSize: 10.5, padding: "2px 8px", cursor: "default" }}>
                          {KIND_LABEL[c.kind]}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{c.label}</span>
                      </div>
                      {c.detail && (
                        <div style={{ marginTop: 4, fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.5 }}>{c.detail}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-foot" style={{ justifyContent: "flex-end", paddingTop: 12, borderTop: "1px solid var(--line)" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setPhase("input"); setResult(null); }}>
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
