import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/store/useStore";
import { tailorResume } from "@/services/claude";
import type { TailoredResume } from "@/types";

interface Props {
  onResult: (r: TailoredResume) => void;
  onLoadingChange?: (loading: boolean) => void;
  disabled?: boolean;
  disabledReason?: string;
}

const TARGET_CHARS = 1200;

export function TailorComposer({
  onResult,
  onLoadingChange,
  disabled = false,
  disabledReason,
}: Props) {
  const master = useStore((s) => s.master);
  const settings = useStore((s) => s.settings);

  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  const meterPct = useMemo(
    () => Math.min(100, Math.round((jd.length / TARGET_CHARS) * 100)),
    [jd.length]
  );
  const meterState =
    jd.length === 0 ? "empty" : jd.length < TARGET_CHARS * 0.5 ? "warm" : "ok";

  const canSubmit = !disabled && !loading && jd.trim().length > 40;

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const result = await tailorResume({
        master,
        jobDescription: jd,
        jobTitle,
        company,
        settings,
      });
      onResult(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <section className="composer" aria-label="Tailor a resume">
      <div className="composer__row">
        <span className="composer__num" aria-hidden>
          01
        </span>
        <div className="composer__body">
          <div className="composer__label">
            Target <em>— who you're writing this for</em>
          </div>
          <div className="composer__pair">
            <input
              className="composer__input"
              placeholder="Role, e.g. Staff Product Designer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              onKeyDown={onKeyDown}
              autoFocus
            />
            <input
              className="composer__input"
              placeholder="Company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              onKeyDown={onKeyDown}
            />
          </div>
        </div>
      </div>

      <div className="composer__row">
        <span className="composer__num" aria-hidden>
          02
        </span>
        <div className="composer__body">
          <div className="composer__label">
            Description <em>— paste the posting verbatim</em>
          </div>
          <textarea
            className="composer__textarea"
            placeholder="The whole posting. Responsibilities, requirements, the company's words. The more we have, the more precise the tweaks."
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
          />
          <div className="composer__meter" data-state={meterState}>
            <span>
              {jd.length.toLocaleString()} <span style={{ opacity: 0.6 }}>chars</span>
            </span>
            <div
              className="composer__meter-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={TARGET_CHARS}
              aria-valuenow={jd.length}
            >
              <div
                className="composer__meter-fill"
                style={{ width: `${meterPct}%` }}
              />
            </div>
            <span style={{ opacity: 0.7 }}>
              {jd.length < 40
                ? "needs more"
                : jd.length < TARGET_CHARS * 0.5
                  ? "thin — add more"
                  : "good"}
            </span>
          </div>
        </div>
      </div>

      <div className="composer__row">
        <span className="composer__num" aria-hidden>
          03
        </span>
        <div className="composer__body">
          <div className="composer__label">
            Tailor <em>— wording only, never meaning</em>
          </div>

          <button
            ref={ctaRef}
            className="composer__cta"
            data-loading={loading || undefined}
            onClick={submit}
            disabled={!canSubmit}
            aria-busy={loading}
          >
            <span className="composer__cta-label">
              {loading ? (
                "Tailoring"
              ) : (
                <>
                  Tailor <em>resume</em>
                </>
              )}
            </span>
            {!loading && <span className="composer__cta-arrow">→</span>}
          </button>

          {disabled && disabledReason && (
            <div className="composer__error" role="status">
              <span aria-hidden>!</span>
              <span>{disabledReason}</span>
            </div>
          )}
          {error && (
            <div className="composer__error" role="alert">
              <span aria-hidden>!</span>
              <span>{error}</span>
            </div>
          )}
          {!disabled && !error && (
            <p className="composer__hint">
              Press <kbd>⌘</kbd>
              <kbd>↵</kbd> to tailor.
              <span style={{ opacity: 0.6 }}>
                {jd.length < 40 && jd.length > 0
                  ? "Paste more of the posting first."
                  : null}
              </span>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
