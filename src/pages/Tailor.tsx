import { useMemo, useState } from "react";
import { Bookmark, Check, Copy, Printer, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { PageHeader } from "@/components/PageHeader";
import { ResumeDocument } from "@/components/ResumeDocument";
import { TailorComposer } from "@/components/TailorComposer";
import type { TailoredResume } from "@/types";
import { cn } from "@/lib/utils";

export default function TailorPage() {
  const master = useStore((s) => s.master);
  const settings = useStore((s) => s.settings);
  const saveTailored = useStore((s) => s.saveTailored);

  const [result, setResult] = useState<TailoredResume | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [view, setView] = useState<"preview" | "diff">("preview");

  const ready = master.experiences.length > 0;
  const hasKey = settings.apiKey.trim().length > 0;

  const totalChanged = useMemo(() => {
    if (!result) return 0;
    return result.experiences.reduce((sum, e) => sum + e.bullets.filter((b) => b.changed).length, 0);
  }, [result]);

  const handleResult = (r: TailoredResume) => { setResult(r); setSaved(false); };

  const composerDisabledReason = !ready
    ? "Add at least one role with bullets in your master profile first."
    : !hasKey
    ? "Add your Anthropic API key in Settings to enable tailoring."
    : undefined;

  const save = () => { if (!result) return; saveTailored(result); setSaved(true); };

  const copyText = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(renderAsPlainText(result, master));
  };

  return (
    <>
      <PageHeader
        eyebrow="Tailor"
        title="One job, one tailored resume"
        description="Paste the job description. We tweak wording — never meaning — pick the best bullets, and write a focused summary."
        actions={
          result && !loading ? (
            <>
              <button onClick={() => window.print()} className="btn btn-sm no-print">
                <Printer size={14} /> Print / PDF
              </button>
              <button onClick={copyText} className="btn btn-sm no-print">
                <Copy size={14} /> Copy text
              </button>
              <button
                onClick={save}
                className={cn("btn btn-gold btn-sm no-print", saved ? "opacity-80" : "")}
                disabled={saved}
              >
                {saved ? <><Check size={14} /> Saved</> : <><Bookmark size={14} /> Save to library</>}
              </button>
            </>
          ) : null
        }
      />

      <div
        className="canvas"
        style={{ display: "grid", gridTemplateColumns: "460px minmax(0,1fr)", gap: 22, alignItems: "start" }}
      >
        {/* Left column: composer + stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <TailorComposer
            onResult={handleResult}
            onLoadingChange={setLoading}
            disabled={!ready || !hasKey}
            {...(composerDisabledReason ? { disabledReason: composerDisabledReason } : {})}
          />

          {(!ready || !hasKey) && (
            <p style={{ fontSize: 12, color: "var(--ink-3)", padding: "0 2px" }}>
              {!ready ? (
                <>Set up your <Link to="/profile" style={{ color: "var(--accent)", textDecoration: "underline" }}>master profile</Link> first.</>
              ) : (
                <>Add your key in <Link to="/settings" style={{ color: "var(--accent)", textDecoration: "underline" }}>Settings</Link>.</>
              )}
            </p>
          )}

          {result && (
            <div className="panel panel-pad" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", gap: 18, alignItems: "baseline" }}>
                <StatPill value={totalChanged} label={totalChanged === 1 ? "tweak" : "tweaks"} />
                <StatPill
                  value={result.experiences.reduce((s, e) => s + e.bullets.length, 0)}
                  label="bullets"
                />
              </div>
              {result.notes && (
                <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.55 }}>
                  <Sparkles size={13} style={{ display: "inline", marginRight: 6, color: "var(--accent)", verticalAlign: "text-bottom" }} />
                  {result.notes}
                </p>
              )}
              <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
                <ViewToggle active={view === "preview"} onClick={() => setView("preview")}>Preview</ViewToggle>
                <ViewToggle active={view === "diff"} onClick={() => setView("diff")}>Diff</ViewToggle>
              </div>
            </div>
          )}
        </div>

        {/* Right column: preview or diff */}
        <div style={{ minWidth: 0 }}>
          {!result && !loading && <Placeholder ready={ready && hasKey} />}
          {loading && <LoadingShimmer />}
          {result && view === "preview" && (
            <div style={{ overflow: "auto" }}>
              <div style={{ border: "1px solid var(--line)", borderRadius: 6, display: "inline-block" }}>
                <ResumeDocument master={master} tailored={result} rules={settings.rules} />
              </div>
            </div>
          )}
          {result && view === "diff" && <DiffView master={master} result={result} />}
        </div>
      </div>
    </>
  );
}

function StatPill({ value, label }: { value: number; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 5 }}>
      <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--ink)" }}>{value}</span>
      <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{label}</span>
    </span>
  );
}

function ViewToggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 32,
        borderRadius: 9,
        padding: "0 14px",
        fontSize: 12,
        fontWeight: 600,
        fontFamily: "var(--font-ui)",
        cursor: "pointer",
        border: "1px solid " + (active ? "var(--accent-line)" : "var(--line)"),
        background: active ? "var(--accent-soft)" : "var(--raised)",
        color: active ? "var(--ink)" : "var(--ink-2)",
        transition: "background .15s, color .15s, border-color .15s",
      }}
    >
      {children}
    </button>
  );
}

function Placeholder({ ready }: { ready: boolean }) {
  return (
    <div
      className="panel"
      style={{ padding: "64px 40px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", minHeight: 500, justifyContent: "center" }}
    >
      <div
        style={{
          width: 56, height: 56, borderRadius: 16,
          display: "grid", placeItems: "center", marginBottom: 20,
          background: "linear-gradient(155deg, var(--gold-1), var(--gold-3))",
          color: "var(--on-gold)",
          boxShadow: "0 16px 40px -16px rgba(0,0,0,0.8)",
        }}
      >
        <Sparkles size={24} />
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
        Your tailored resume will appear here
      </div>
      <p style={{ fontSize: 13.5, color: "var(--ink-3)", maxWidth: 380, lineHeight: 1.55, margin: 0 }}>
        {ready
          ? "Paste a job description on the left and hit Tailor. Same fixed format, every time."
          : "Once your master profile and API key are set up, your tailored resume will render here."}
      </p>
    </div>
  );
}

function LoadingShimmer() {
  return (
    <div className="panel panel-pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {[60, 40, 100, 85, 75, 55, 90].map((w, i) => (
        <div key={i} style={{ height: 12, borderRadius: 6, background: "var(--raised)", width: `${w}%`, animation: "pulse 1.6s ease-in-out infinite", animationDelay: `${i * 80}ms` }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.9} }`}</style>
    </div>
  );
}

function DiffView({
  master,
  result,
}: {
  master: ReturnType<typeof useStore.getState>["master"];
  result: TailoredResume;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="panel">
        <div className="panel-head"><h3>Summary</h3></div>
        <div className="panel-pad">
          <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--ink)", margin: 0 }}>{result.summary}</p>
          {master.summary && (
            <>
              <div className="divider" />
              <p style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 6 }}>Original</p>
              <p style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-3)", margin: 0 }}>{master.summary}</p>
            </>
          )}
        </div>
      </div>

      {result.experiences.map((te) => {
        const exp = master.experiences.find((e) => e.id === te.experienceId);
        if (!exp) return null;
        return (
          <div key={te.experienceId} className="panel">
            <div className="panel-head">
              <h3>
                {exp.role || "Role"}
                {exp.company && <span style={{ color: "var(--ink-3)", fontWeight: 400 }}> · {exp.company}</span>}
              </h3>
            </div>
            <div className="panel-pad" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {te.bullets.map((b) => (
                <div
                  key={b.originalId}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 11,
                    border: "1px solid " + (b.changed ? "var(--accent-line)" : "var(--line)"),
                    background: b.changed
                      ? "linear-gradient(100deg, var(--accent-soft), transparent 80%)"
                      : "var(--panel-2)",
                  }}
                >
                  <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ink)" }}>{b.tweaked}</div>
                  {b.changed && (
                    <>
                      <div style={{ fontSize: 12, color: "var(--ink-3)", textDecoration: "line-through", marginTop: 4 }}>{b.original}</div>
                      {b.rationale && (
                        <div style={{ fontSize: 11, color: "var(--accent)", fontStyle: "italic", marginTop: 5 }}>{b.rationale}</div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function renderAsPlainText(
  result: TailoredResume,
  master: ReturnType<typeof useStore.getState>["master"]
): string {
  const lines: string[] = [];
  const c = master.contact;
  lines.push(c.fullName);
  if (c.headline) lines.push(c.headline);
  lines.push([c.location, c.email, c.phone, c.linkUrl].filter(Boolean).join(" • "));
  if (result.summary) lines.push("", "SUMMARY", result.summary);
  if (result.experiences.length) {
    lines.push("", "EXPERIENCE");
    for (const te of result.experiences) {
      const exp = master.experiences.find((e) => e.id === te.experienceId);
      if (!exp) continue;
      lines.push("", `${exp.role}${exp.company ? " · " + exp.company : ""}${exp.location ? " · " + exp.location : ""}`);
      for (const b of te.bullets) lines.push(`• ${b.tweaked}`);
    }
  }
  if (result.skills?.length) lines.push("", "SKILLS", result.skills.join(" · "));
  if (master.education.length) {
    lines.push("", "EDUCATION");
    for (const ed of master.education) {
      lines.push(`${ed.degree}${ed.school ? " · " + ed.school : ""}`);
      if (ed.detail) lines.push(ed.detail);
    }
  }
  return lines.join("\n");
}
