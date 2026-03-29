"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type { ArticleSearchResult } from "@/lib/article-search";
import { formatDate } from "@/lib/articles";

type SuggestionsPayload = {
  recent: {
    slug: string;
    title: string;
    published_at: string;
    tags: string[] | null;
  }[];
  popularTags: string[];
};

type ArticleSearchDialogProps = {
  open: boolean;
  onClose: () => void;
};

const DEBOUNCE_MS = 280;

function shouldRunSearch(trimmed: string): boolean {
  if (trimmed.length === 0) return false;
  const hasHashOrTag =
    /#./.test(trimmed) ||
    /\btag:/i.test(trimmed);
  if (hasHashOrTag) return true;
  return trimmed.length >= 2;
}

export function ArticleSearchDialog({
  open,
  onClose,
}: ArticleSearchDialogProps) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ArticleSearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionsPayload | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchSuggestions = useCallback(async () => {
    try {
      const res = await fetch("/api/search?suggestions=1");
      if (!res.ok) throw new Error("suggestions");
      const data = (await res.json()) as SuggestionsPayload;
      setSuggestions(data);
    } catch {
      setSuggestions({ recent: [], popularTags: [] });
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    setQuery("");
    setResults([]);
    setSelected(-1);
    setError(false);
    void fetchSuggestions();

    const t = requestAnimationFrame(() =>
      inputRef.current?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(t);
  }, [open, fetchSuggestions]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const trimmed = query.trim();
    if (!shouldRunSearch(trimmed)) {
      setResults([]);
      setLoading(false);
      setSelected(-1);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      setError(false);

      const params = new URLSearchParams({ q: trimmed });
      fetch(`/api/search?${params}`, { signal: ac.signal })
        .then(async (res) => {
          if (!res.ok) throw new Error("search");
          const data = (await res.json()) as { results: ArticleSearchResult[] };
          setResults(data.results ?? []);
          setSelected(data.results?.length ? 0 : -1);
        })
        .catch((err) => {
          if (err?.name === "AbortError") return;
          setError(true);
          setResults([]);
        })
        .finally(() => setLoading(false));
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [open, query]);

  const resultTargets = results.map(
    (r) => `/articles/${encodeURIComponent(r.slug)}`,
  );

  const onResultKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter" && selected >= 0 && selected < results.length) {
      e.preventDefault();
      window.location.href = resultTargets[selected]!;
    }
  };

  const appendTagFilter = (tag: string) => {
    setQuery((q) => {
      const base = q.trim();
      const next = base ? `${base} #${tag}` : `#${tag}`;
      return next;
    });
    inputRef.current?.focus({ preventScroll: true });
  };

  if (!open) return null;

  // Portal to body so stacking is not capped by Header (z-40). Reader chrome uses z-index up to 70 in globals.css.
  const overlay = (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:p-4 sm:pt-[12vh]"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="flex h-[100dvh] w-full flex-col overflow-hidden bg-surface/95 shadow-[var(--float-shadow)] sm:h-auto sm:max-h-[min(75vh,40rem)] sm:max-w-2xl sm:rounded-[1.5rem] sm:border sm:border-border/80"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onResultKeyDown}
      >
        <div className="shrink-0 border-b border-border/60 bg-surface/95 px-3 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="ml-1 shrink-0 text-foreground-tertiary"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索文章、标签或正文…"
              autoComplete="off"
              spellCheck={false}
              className="flex-1 bg-transparent py-4 text-[1.05rem] text-foreground outline-none placeholder:text-foreground-tertiary"
              aria-labelledby={titleId}
            />
            <button
              type="button"
              className="shrink-0 rounded-full bg-surface-muted/80 px-3.5 py-1.5 text-sm font-medium text-foreground-secondary transition-colors hover:bg-border/60 sm:hidden"
              onClick={onClose}
            >
              取消
            </button>
            <div className="hidden shrink-0 items-center gap-1 text-[0.7rem] text-foreground-tertiary sm:flex">
              <kbd className="rounded border border-border/60 bg-surface-muted/50 px-1.5 py-0.5 font-sans">ESC</kbd>
            </div>
          </div>
        </div>
        <span id={titleId} className="sr-only">
          找一篇文章
        </span>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2 sm:px-3">
          {loading && (
            <p className="px-2 py-8 text-center text-sm text-foreground-secondary">
              搜索中…
            </p>
          )}

          {!loading && error && (
            <p className="px-2 py-8 text-center text-sm text-foreground-secondary">
              暂时无法搜索，请稍后再试。
            </p>
          )}

          {!loading &&
            !error &&
            query.trim().length > 0 &&
            shouldRunSearch(query.trim()) &&
            results.length === 0 && (
              <p className="px-2 py-10 text-center text-sm text-foreground-secondary">
                没有找到匹配的文章，换个词或标签试试。
              </p>
            )}

          {!loading && !error && results.length > 0 && (
            <ul className="space-y-1" role="listbox" aria-label="搜索结果">
              {results.map((r, i) => (
                <li key={r.id} role="option" aria-selected={i === selected}>
                  <Link
                    href={`/articles/${encodeURIComponent(r.slug)}`}
                    onClick={onClose}
                    className={`block cursor-pointer rounded-[1rem] p-3 transition-colors duration-150 sm:p-4 ${
                      i === selected
                        ? "bg-accent-soft/80"
                        : "hover:bg-accent-soft/40"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2 text-[0.7rem] text-foreground-tertiary">
                      <span className="reader-stat tabular-nums">
                        {formatDate(r.published_at)}
                      </span>
                      {r.match_reason && (
                        <span className="rounded-full border border-border/60 bg-surface-muted/80 px-2 py-0.5 text-foreground-secondary">
                          {r.match_reason}
                        </span>
                      )}
                      <span className="tabular-nums text-foreground-tertiary">
                        约 {r.reading_time_minutes} 分钟
                      </span>
                    </div>
                    {r.matched_tags.length > 0 && (
                      <div
                        className="mt-2 flex flex-wrap gap-1"
                        aria-label="匹配标签"
                      >
                        {r.matched_tags.map((t) => (
                          <span key={t} className="tag-compact">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="font-display mt-2 text-[1.05rem] font-semibold leading-snug text-foreground">
                      {r.title}
                    </p>
                    {r.snippet && (
                      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-foreground-secondary">
                        {r.snippet}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {!loading &&
            !error &&
            (!query.trim() || !shouldRunSearch(query.trim())) &&
            suggestions && (
              <div className="space-y-6 px-2 py-4">
                {suggestions.popularTags.length > 0 && (
                  <div>
                    <p className="section-kicker text-[0.65rem]">常见标签</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {suggestions.popularTags.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => appendTagFilter(t)}
                          className="tag-compact cursor-pointer transition-colors duration-200 hover:bg-accent-light/80"
                        >
                          #{t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {suggestions.recent.length > 0 && (
                  <div>
                    <p className="section-kicker text-[0.65rem]">最近更新</p>
                    <ul className="mt-2 space-y-1">
                      {suggestions.recent.map((a) => (
                        <li key={a.slug}>
                          <Link
                            href={`/articles/${encodeURIComponent(a.slug)}`}
                            onClick={onClose}
                            className="block cursor-pointer rounded-lg px-3 py-2.5 text-sm text-foreground-secondary transition-colors duration-200 hover:bg-accent-soft hover:text-foreground"
                          >
                            {a.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
        </div>

        <div className="hidden shrink-0 items-center justify-between border-t border-border/60 bg-surface-muted/30 px-4 py-3 sm:flex">
          <div className="flex items-center gap-4 text-[0.7rem] text-foreground-tertiary">
            <span className="flex items-center gap-1.5">
              <kbd className="rounded border border-border/60 bg-surface-muted/50 px-1.5 py-0.5 font-sans">↑</kbd>
              <kbd className="rounded border border-border/60 bg-surface-muted/50 px-1.5 py-0.5 font-sans">↓</kbd>
              <span>选择</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="rounded border border-border/60 bg-surface-muted/50 px-1.5 py-0.5 font-sans">Enter</kbd>
              <span>打开</span>
            </span>
          </div>
          <div className="text-[0.7rem] text-foreground-tertiary">
            支持 <span className="text-foreground-secondary">#标签</span> 或 <span className="text-foreground-secondary">“短语”</span>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
