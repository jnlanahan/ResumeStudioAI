import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Calendar, FileText, Pencil, Printer, Trash2, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import { PageHeader } from "@/components/PageHeader";
import { ResumeDocument } from "@/components/ResumeDocument";
import { formatDateLong } from "@/lib/utils";
import type { TailoredResume } from "@/types";

export default function LibraryPage() {
  const library = useStore((s) => s.library);
  const master = useStore((s) => s.master);
  const rules = useStore((s) => s.settings.rules);
  const removeTailored = useStore((s) => s.removeTailored);
  const renameTailored = useStore((s) => s.renameTailored);

  const [openId, setOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  const open = library.find((r) => r.id === openId) ?? null;

  return (
    <>
      <PageHeader
        eyebrow="Library"
        title="Every tailored version, saved"
        description="Your past tailoring runs. Reopen, reprint, or compare."
      />

      <div className="canvas">
        {library.length === 0 ? (
          <div
            className="panel"
            style={{ padding: "64px 40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}
          >
            <div className="file-ic" style={{ width: 52, height: 52, marginBottom: 16 }}>
              <FileText size={22} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>No saved resumes yet</div>
            <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}>
              Run a tailoring on the Tailor page and click "Save to library."
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {library.map((r) => (
              <motion.div
                key={r.id}
                onClick={() => setOpenId(r.id)}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.18 }}
                className="panel"
                style={{ padding: "18px", cursor: "pointer" }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                  {renamingId === r.id ? (
                    <input
                      autoFocus
                      className="field-native"
                      style={{ height: 34, fontSize: 13, fontWeight: 600, flex: 1 }}
                      value={renameDraft}
                      onChange={(e) => setRenameDraft(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={() => { renameTailored(r.id, renameDraft.trim() || r.label); setRenamingId(null); }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { renameTailored(r.id, renameDraft.trim() || r.label); setRenamingId(null); }
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                    />
                  ) : (
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)", lineHeight: 1.3 }}>
                        {r.label || "Untitled"}
                      </div>
                      {r.jobTitle && (
                        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 3 }}>
                          {r.jobTitle}{r.company ? ` · ${r.company}` : ""}
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setRenamingId(r.id); setRenameDraft(r.label); }}
                      className="b-act"
                      title="Rename"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); if (confirm("Delete this saved resume?")) removeTailored(r.id); }}
                      className="b-act danger"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                  {r.company && (
                    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--ink-3)" }}>
                      <Building2 size={12} /> {r.company}
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--ink-3)" }}>
                    <Calendar size={12} /> {formatDateLong(r.createdAt)}
                  </div>
                </div>

                {r.notes && (
                  <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--ink-2)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {r.notes}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <PreviewModal
            resume={open}
            master={master}
            rules={rules}
            onClose={() => setOpenId(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function PreviewModal({
  resume,
  master,
  rules,
  onClose,
}: {
  resume: TailoredResume;
  master: ReturnType<typeof useStore.getState>["master"];
  rules: ReturnType<typeof useStore.getState>["settings"]["rules"];
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="scrim no-print"
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 4 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "relative", maxWidth: "calc(100vw - 48px)" }}
      >
        <div
          style={{
            position: "absolute",
            top: -52,
            right: 0,
            display: "flex",
            gap: 10,
          }}
        >
          <button onClick={() => window.print()} className="btn btn-sm">
            <Printer size={14} /> Print / PDF
          </button>
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            <X size={14} /> Close
          </button>
        </div>
        <div style={{ border: "1px solid var(--line)", borderRadius: 6, overflow: "hidden" }}>
          <ResumeDocument master={master} tailored={resume} rules={rules} />
        </div>
      </motion.div>
    </motion.div>
  );
}
