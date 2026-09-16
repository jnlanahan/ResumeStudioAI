import { useRef, useState } from "react";
import { Download, Eye, EyeOff, LayoutTemplate, ListOrdered, Lock, Save, Sparkles, Upload } from "lucide-react";
import { MODELS, useStore } from "@/store/useStore";
import { PageHeader } from "@/components/PageHeader";
import { TEMPLATES } from "@/templates";
import { clamp } from "@/lib/utils";

export default function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const master = useStore((s) => s.master);
  const library = useStore((s) => s.library);
  const restoreBackup = useStore((s) => s.restoreBackup);

  const [draftKey, setDraftKey] = useState(settings.apiKey);
  const [showKey, setShowKey] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const saveKey = () => {
    setSettings({ apiKey: draftKey.trim() });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
  };

  const exportBackup = () => {
    const data = { app: "resume-studio-ai", version: 3, exportedAt: new Date().toISOString(), master, library, rules: settings.rules };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resume-studio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      if (!data?.master || !Array.isArray(data.library)) throw new Error("Not a Resume Studio backup file.");
      if (!confirm("Replace your current profile, bullet bank, and library with this backup?")) return;
      restoreBackup(data);
      setBackupMsg("Backup restored.");
    } catch (e) {
      setBackupMsg(`Couldn't restore: ${(e as Error).message}`);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
      setTimeout(() => setBackupMsg(null), 4000);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Configure once, tailor forever"
        description="Your API key, template, and formatting rules. Stored only in this browser."
      />

      <div className="canvas" style={{ maxWidth: 680 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* API key */}
          <section className="panel">
            <div className="panel-head">
              <Lock size={15} style={{ color: "var(--accent)", flexShrink: 0 }} />
              <h3>Anthropic API key</h3>
            </div>
            <div className="panel-pad">
              <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>
                Get one at{" "}
                <a
                  href="https://console.anthropic.com/"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "var(--accent)", textDecoration: "underline" }}
                >
                  console.anthropic.com
                </a>
                . Stored locally — never sent anywhere except directly to Anthropic.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <input
                    className="field-native"
                    style={{ paddingRight: 44, fontFamily: "var(--font-mono)", fontSize: 12 }}
                    type={showKey ? "text" : "password"}
                    value={draftKey}
                    onChange={(e) => setDraftKey(e.target.value)}
                    placeholder="sk-ant-…"
                    onKeyDown={(e) => { if (e.key === "Enter") saveKey(); }}
                  />
                  <button
                    onClick={() => setShowKey((v) => !v)}
                    style={{
                      position: "absolute",
                      inset: "0 0 0 auto",
                      width: 42,
                      display: "grid",
                      placeItems: "center",
                      color: "var(--ink-3)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <button onClick={saveKey} className="btn btn-gold btn-sm">
                  <Save size={14} /> {savedFlash ? "Saved!" : "Save"}
                </button>
              </div>

              <div style={{ marginTop: 20 }}>
                <label className="field-label">Model</label>
                <select
                  className="field-native"
                  value={settings.model}
                  onChange={(e) => setSettings({ model: e.target.value })}
                >
                  {MODELS.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Template */}
          <section className="panel">
            <div className="panel-head">
              <LayoutTemplate size={15} style={{ color: "var(--accent)", flexShrink: 0 }} />
              <h3>Resume template</h3>
              <span className="sub">Default layout for new tailored resumes. You can switch per resume on the preview step.</span>
            </div>
            <div className="panel-pad" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {TEMPLATES.map((t) => {
                const active = settings.template === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSettings({ template: t.id })}
                    style={{
                      textAlign: "left",
                      padding: "14px",
                      borderRadius: 12,
                      border: "2px solid " + (active ? "var(--accent)" : "var(--line)"),
                      background: active ? "var(--accent-soft)" : "var(--panel)",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)", marginBottom: 4 }}>{t.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-2)", lineHeight: 1.45 }}>{t.description}</div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Format rules */}
          <section className="panel">
            <div className="panel-head">
              <ListOrdered size={15} style={{ color: "var(--accent)", flexShrink: 0 }} />
              <h3>Format rules</h3>
              <span className="sub">Hard limits enforced on every tailored resume.</span>
            </div>
            <div className="panel-pad">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                <RuleRow
                  label="Max bullets per role"
                  value={settings.rules.maxBulletsPerRole}
                  min={2}
                  max={12}
                  onChange={(v) => setSettings({ rules: { ...settings.rules, maxBulletsPerRole: v } })}
                />
                <RuleRow
                  label="Max characters per bullet"
                  value={settings.rules.maxBulletChars}
                  min={80}
                  max={250}
                  onChange={(v) => setSettings({ rules: { ...settings.rules, maxBulletChars: v } })}
                />
                <RuleRow
                  label="Max skills shown"
                  value={settings.rules.maxSkills}
                  min={4}
                  max={30}
                  onChange={(v) => setSettings({ rules: { ...settings.rules, maxSkills: v } })}
                />
                <RuleRow
                  label="Summary sentences"
                  value={settings.rules.summarySentences}
                  min={1}
                  max={5}
                  onChange={(v) => setSettings({ rules: { ...settings.rules, summarySentences: v } })}
                />
              </div>
            </div>
          </section>

          {/* Backup */}
          <section className="panel">
            <div className="panel-head">
              <Download size={15} style={{ color: "var(--accent)", flexShrink: 0 }} />
              <h3>Backup</h3>
              <span className="sub">Everything lives in this browser. Export a file so clearing your browser never loses your bank.</span>
            </div>
            <div className="panel-pad" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-sm" onClick={exportBackup}>
                <Download size={14} /> Export backup
              </button>
              <button className="btn btn-sm" onClick={() => fileRef.current?.click()}>
                <Upload size={14} /> Restore from backup
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) importBackup(f); }}
              />
              {backupMsg && <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{backupMsg}</span>}
              <span style={{ fontSize: 11.5, color: "var(--ink-3)", width: "100%" }}>
                Your API key is not included in backups.
              </span>
            </div>
          </section>

          {/* How tailoring works */}
          <section className="panel">
            <div className="panel-head">
              <Sparkles size={15} style={{ color: "var(--accent)", flexShrink: 0 }} />
              <h3>How tailoring works</h3>
            </div>
            <div className="panel-pad">
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  "The model receives your bullet bank and the job description.",
                  "It picks the most relevant existing bullets per role and chooses the best phrasing you've already written — never new facts.",
                  "Layout comes from a fixed template you choose; the content shape is identical every time and print-ready.",
                  "Nothing leaves your browser except direct calls to the Anthropic API.",
                ].map((line, i) => (
                  <li key={i} style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>
                    <span style={{ color: "var(--accent)", flexShrink: 0, marginTop: 1 }}>·</span>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function RuleRow({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span className="field-label">{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <input
          type="range"
          style={{
            flex: 1,
            accentColor: "var(--gold-3)",
            height: 4,
          }}
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <input
          type="number"
          className="field-native"
          style={{ width: 64, textAlign: "center" }}
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value) || min, min, max))}
        />
      </div>
    </label>
  );
}
