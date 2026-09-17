import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, Briefcase, ChevronDown, ChevronRight, FileUp, Plus, Trash2, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import { PageHeader } from "@/components/PageHeader";
import { formatRange, cn } from "@/lib/utils";
import type { Bullet } from "@/types";

export default function BulletBankPage() {
  const master = useStore((s) => s.master);
  const rules = useStore((s) => s.settings.rules);
  const addExperience = useStore((s) => s.addExperience);
  const updateExperience = useStore((s) => s.updateExperience);
  const removeExperience = useStore((s) => s.removeExperience);
  const addBullet = useStore((s) => s.addBullet);
  const updateBullet = useStore((s) => s.updateBullet);
  const removeBullet = useStore((s) => s.removeBullet);
  const addVariant = useStore((s) => s.addVariant);
  const updateVariant = useStore((s) => s.updateVariant);
  const removeVariant = useStore((s) => s.removeVariant);
  const promoteVariant = useStore((s) => s.promoteVariant);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const prevLengthRef = useRef(master.experiences.length);

  // Auto-expand newly added experiences
  useEffect(() => {
    if (master.experiences.length > prevLengthRef.current) {
      const newExp = master.experiences[master.experiences.length - 1];
      setExpanded((prev) => new Set([...prev, newExp.id]));
    }
    prevLengthRef.current = master.experiences.length;
  }, [master.experiences.length, master.experiences]);

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const totalBullets = master.experiences.reduce((n, e) => n + e.bullets.filter((b) => b.text.trim()).length, 0);
  const totalVariants = master.experiences.reduce((n, e) => n + e.bullets.reduce((m, b) => m + b.variants.length, 0), 0);

  return (
    <>
      <PageHeader
        eyebrow="Bullet Bank"
        title="Your experience & bullets"
        description={
          totalBullets
            ? `${totalBullets} bullets across ${master.experiences.length} roles${totalVariants ? `, with ${totalVariants} alternate phrasings` : ""}. Import another document to grow the bank.`
            : "Every role and bullet you've ever written. Import a resume or evaluation to start, then add or edit by hand."
        }
        actions={
          <>
            <Link href="/import" className="btn btn-sm">
              <FileUp size={14} /> Import
            </Link>
            <button className="btn btn-gold btn-sm" onClick={addExperience}>
              <Plus size={14} /> Add role
            </button>
          </>
        }
      />

      <div className="canvas" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {master.experiences.length === 0 ? (
          <div
            className="panel"
            style={{ padding: "64px 40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--raised)", display: "grid", placeItems: "center", marginBottom: 16 }}>
              <Briefcase size={20} style={{ color: "var(--ink-3)" }} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>No roles yet</div>
            <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "0 0 18px" }}>
              Import a resume, evaluation, or notes and Claude will build your bank, or add your first role by hand.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <Link href="/import" className="btn btn-gold btn-sm">
                <FileUp size={14} /> Import
              </Link>
              <button className="btn btn-sm" onClick={addExperience}>
                <Plus size={14} /> Add a role
              </button>
            </div>
          </div>
        ) : (
          master.experiences.map((exp) => {
            const isOpen = expanded.has(exp.id);
            const dateRange = formatRange(exp.startDate, exp.endDate);
            const count = exp.bullets.filter((b) => b.text.trim()).length;
            return (
              <div key={exp.id} className="panel">
                {/* Role header */}
                <div
                  className="panel-head"
                  style={{ cursor: "pointer", userSelect: "none" }}
                  onClick={() => toggleExpanded(exp.id)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                    <span style={{ color: "var(--ink-3)", flexShrink: 0 }}>
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {exp.role || <span style={{ color: "var(--ink-3)" }}>Untitled role</span>}
                        {exp.company && (
                          <span style={{ fontWeight: 400, color: "var(--ink-3)" }}> · {exp.company}</span>
                        )}
                      </div>
                      {dateRange && (
                        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 1 }}>{dateRange}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
                      {count} bullet{count !== 1 ? "s" : ""}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this role and all its bullets?")) removeExperience(exp.id);
                      }}
                      className="btn btn-danger btn-sm"
                      title="Delete role"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                {isOpen && (
                  <div className="panel-pad" style={{ borderTop: "1px solid var(--line)" }}>
                    {/* Role metadata */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                      <input
                        className="field-native"
                        placeholder="Company"
                        value={exp.company}
                        onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                      />
                      <input
                        className="field-native"
                        placeholder="Role / Title"
                        value={exp.role}
                        onChange={(e) => updateExperience(exp.id, { role: e.target.value })}
                      />
                      <input
                        className="field-native"
                        placeholder="Location (optional)"
                        value={exp.location}
                        onChange={(e) => updateExperience(exp.id, { location: e.target.value })}
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          className="field-native"
                          type="month"
                          value={exp.startDate}
                          onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
                          style={{ flex: 1 }}
                        />
                        <input
                          className="field-native"
                          type="month"
                          value={exp.endDate}
                          onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                          style={{ flex: 1 }}
                        />
                      </div>
                    </div>

                    {/* Bullets */}
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 8 }}>
                      Bullets
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {exp.bullets.map((b) => (
                        <BulletEditor
                          key={b.id}
                          bullet={b}
                          maxChars={rules.maxBulletChars}
                          onChange={(text) => updateBullet(exp.id, b.id, text)}
                          onRemove={() => removeBullet(exp.id, b.id)}
                          onAddVariant={() => addVariant(exp.id, b.id, "")}
                          onUpdateVariant={(i, text) => updateVariant(exp.id, b.id, i, text)}
                          onRemoveVariant={(i) => removeVariant(exp.id, b.id, i)}
                          onPromoteVariant={(i) => promoteVariant(exp.id, b.id, i)}
                        />
                      ))}
                      <button
                        onClick={() => addBullet(exp.id)}
                        className="btn btn-ghost btn-sm"
                        style={{ alignSelf: "flex-start" }}
                      >
                        <Plus size={14} /> Add bullet
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

function BulletEditor({
  bullet,
  maxChars,
  onChange,
  onRemove,
  onAddVariant,
  onUpdateVariant,
  onRemoveVariant,
  onPromoteVariant,
}: {
  bullet: Bullet;
  maxChars: number;
  onChange: (v: string) => void;
  onRemove: () => void;
  onAddVariant: () => void;
  onUpdateVariant: (index: number, v: string) => void;
  onRemoveVariant: (index: number) => void;
  onPromoteVariant: (index: number) => void;
}) {
  const { text, variants } = bullet;
  const [showVariants, setShowVariants] = useState(false);
  const over = text.length > maxChars;
  const open = showVariants || variants.some((v) => !v.trim());
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
      <span style={{ marginTop: 14, width: 6, height: 6, borderRadius: "50%", background: "var(--ink-3)", flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <textarea
          className={cn("field-textarea-native")}
          style={{ minHeight: 44, borderColor: over ? "var(--warn)" : undefined }}
          rows={2}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Action verb + what you did + measurable outcome…"
        />
        <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: over ? "var(--warn)" : "var(--ink-3)" }}>
          <span>
            {text.length}/{maxChars}{over && " — too long, will be trimmed"}
          </span>
          <button
            onClick={() => setShowVariants((v) => !v)}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: variants.length ? "var(--accent)" : "var(--ink-3)", fontSize: 11, fontWeight: 600 }}
          >
            {variants.length
              ? `${variants.length} alternate phrasing${variants.length !== 1 ? "s" : ""} ${open ? "▾" : "▸"}`
              : "+ alternate phrasing"}
          </button>
        </div>

        {(open || (!variants.length && showVariants)) && (
          <div style={{ marginTop: 8, marginLeft: 8, paddingLeft: 10, borderLeft: "2px solid var(--line)", display: "flex", flexDirection: "column", gap: 6 }}>
            {variants.map((v, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                <textarea
                  className="field-textarea-native"
                  style={{ minHeight: 38, fontSize: 12.5 }}
                  rows={2}
                  value={v}
                  onChange={(e) => onUpdateVariant(i, e.target.value)}
                  placeholder="Same accomplishment, different wording…"
                />
                <button className="b-act" title="Make this the primary wording" onClick={() => onPromoteVariant(i)} style={{ marginTop: 4 }}>
                  <ArrowUp size={13} />
                </button>
                <button className="b-act danger" title="Remove phrasing" onClick={() => onRemoveVariant(i)} style={{ marginTop: 4 }}>
                  <X size={13} />
                </button>
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => { onAddVariant(); setShowVariants(true); }}>
              <Plus size={13} /> Add phrasing
            </button>
          </div>
        )}
      </div>
      <button
        onClick={onRemove}
        className="btn btn-danger btn-sm"
        title="Delete bullet"
        style={{ marginTop: 4, flexShrink: 0 }}
      >
        <X size={13} />
      </button>
    </div>
  );
}
