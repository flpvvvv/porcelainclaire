"use client";

import { useCallback, useEffect, useState } from "react";
import { usePwaInstallOptional } from "@/components/PwaInstallProvider";

type PwaInstallCalloutProps = {
  /** Hero card vs article footer link row */
  layout?: "full" | "compact";
};

export function PwaInstallCallout({ layout = "full" }: PwaInstallCalloutProps) {
  const pwa = usePwaInstallOptional();
  const [iosSheetOpen, setIosSheetOpen] = useState(false);

  useEffect(() => {
    if (!iosSheetOpen) return;

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [iosSheetOpen]);

  useEffect(() => {
    if (!iosSheetOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIosSheetOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [iosSheetOpen]);

  const onPrimary = useCallback(async () => {
    if (!pwa) return;
    if (pwa.variant === "android" && pwa.canPromptInstall) {
      await pwa.promptInstall();
      return;
    }
    if (pwa.variant === "ios") {
      setIosSheetOpen(true);
    }
  }, [pwa]);

  if (!pwa?.ready || !pwa.showInstallCallout) return null;

  const sheet = iosSheetOpen && pwa.variant === "ios" && (
    <div
      className="reader-sheet"
      role="presentation"
      onClick={() => setIosSheetOpen(false)}
    >
      <div
        className="reader-sheet-panel max-h-[min(85vh,28rem)] pwa-install-sheet-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-install-sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 border-b border-border/70 bg-surface/95 px-5 py-4 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-kicker">添加到主屏幕</p>
              <h2
                id="pwa-install-sheet-title"
                className="font-display mt-2 text-lg font-semibold text-foreground"
              >
                将本站加入主屏幕
              </h2>
            </div>
            <button
              type="button"
              className="reader-dock-button cursor-pointer border border-border/70 px-3 text-sm"
              onClick={() => setIosSheetOpen(false)}
              aria-label="关闭"
            >
              关闭
            </button>
          </div>
        </div>
        <div className="space-y-4 px-5 py-5 text-sm leading-7 text-foreground-secondary">
          <ol className="list-decimal space-y-3 pl-5">
            <li>
              点击工具栏中的
              <span className="font-medium text-foreground"> 分享 </span>
              （Safari 为底栏方框向上箭头；Chrome 等为菜单中的分享）。
            </li>
            <li>
              选择
              <span className="font-medium text-foreground">
                {" "}
                添加到主屏幕
              </span>
              ，然后确认添加。
            </li>
          </ol>
          <p className="text-xs leading-6 text-foreground-tertiary">
            添加后，图标会出现在主屏幕上，打开时更接近独立阅读应用，没有浏览器地址栏。
          </p>
        </div>
      </div>
    </div>
  );

  if (layout === "compact") {
    return (
      <>
        <div className="flex flex-col gap-2 border-t border-border/60 pt-4 sm:border-t-0 sm:pt-0">
          <p className="section-kicker">在手机上阅读</p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onPrimary}
              className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-border/75 bg-surface/80 px-4 text-sm font-medium text-foreground-secondary transition-[border-color,color,background-color] duration-200 hover:border-border-strong hover:bg-accent-soft hover:text-foreground motion-reduce:transition-none"
            >
              添加到手机主屏
            </button>
            <button
              type="button"
              onClick={() => pwa.dismissCallout()}
              className="inline-flex min-h-11 cursor-pointer items-center rounded-full px-3 text-sm text-foreground-tertiary transition-colors hover:text-foreground-secondary"
            >
              稍后
            </button>
          </div>
        </div>
        {sheet}
      </>
    );
  }

  return (
    <>
      <div className="mt-6 max-w-xl">
        <div className="editorial-card rounded-[1.35rem] border border-border/80 p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1">
              <p className="section-kicker">在手机上阅读</p>
              <p className="mt-3 text-sm leading-7 text-foreground-secondary">
                把 Porcelain Claire 放到手机主屏，下次可以像打开一本书一样回来，界面更干净、少打扰。
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
              <button
                type="button"
                onClick={onPrimary}
                className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-accent-foreground shadow-[var(--float-shadow)] transition-colors hover:bg-accent-hover"
              >
                添加到手机主屏
              </button>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => pwa.dismissCallout()}
                  className="inline-flex min-h-11 cursor-pointer items-center rounded-full px-4 text-sm text-foreground-tertiary transition-colors hover:text-foreground-secondary"
                >
                  稍后
                </button>
                <button
                  type="button"
                  onClick={() => pwa.dismissCallout()}
                  className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full text-foreground-tertiary transition-colors hover:bg-accent-soft hover:text-foreground"
                  aria-label="关闭提示"
                >
                  <span aria-hidden className="text-lg leading-none">
                    ×
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {sheet}
    </>
  );
}
