"use client";

import { useEffect } from "react";

const RETURN_FLAG_KEY = "compare:return-intent";
const SCROLL_Y_KEY = "compare:scroll-y";
const OPEN_CATEGORY_IDS_KEY = "compare:open-category-ids";

function getDetailsForCategoryId(id: string): HTMLDetailsElement | null {
  const section = document.getElementById(id);
  if (!section) return null;
  return section.querySelector(":scope > details");
}

function openCategoryById(id: string) {
  if (!id) return;
  const details = getDetailsForCategoryId(id);
  if (details) details.open = true;
}

function saveCompareIndexState() {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(RETURN_FLAG_KEY, "1");
    window.sessionStorage.setItem(SCROLL_Y_KEY, String(window.scrollY));

    const openCategoryIds = Array.from(
      document.querySelectorAll<HTMLDetailsElement>("section[id] > details[open]")
    )
      .map((details) => details.parentElement?.id || "")
      .filter(Boolean);

    window.sessionStorage.setItem(
      OPEN_CATEGORY_IDS_KEY,
      JSON.stringify(openCategoryIds)
    );
  } catch {
    // Best effort only: ignore storage failures.
  }
}

function restoreOpenCategories() {
  if (typeof window === "undefined") return;

  try {
    const raw = window.sessionStorage.getItem(OPEN_CATEGORY_IDS_KEY);
    if (!raw) return;
    const ids = JSON.parse(raw) as string[];
    ids.forEach((id) => openCategoryById(id));
  } catch {
    // Best effort only: ignore malformed state.
  }
}

function restoreScrollPositionIfReturning() {
  if (typeof window === "undefined") return;

  try {
    const shouldRestore = window.sessionStorage.getItem(RETURN_FLAG_KEY) === "1";
    if (!shouldRestore) return;

    const rawY = window.sessionStorage.getItem(SCROLL_Y_KEY);
    const y = rawY ? Number(rawY) : 0;
    const scrollY = Number.isFinite(y) ? y : 0;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY, behavior: "auto" });
      });
    });

    window.sessionStorage.removeItem(RETURN_FLAG_KEY);
    window.sessionStorage.removeItem(SCROLL_Y_KEY);
  } catch {
    // Best effort only: ignore storage failures.
  }
}

function openCategoryFromCurrentHash() {
  if (typeof window === "undefined") return;
  const id = decodeURIComponent(window.location.hash.replace(/^#/, ""));
  openCategoryById(id);
}

function isCompareDetailPath(pathname: string) {
  return pathname.startsWith("/compare/") && pathname !== "/compare/";
}

export default function ComparePageBehavior() {
  useEffect(() => {
    restoreOpenCategories();
    openCategoryFromCurrentHash();
    restoreScrollPositionIfReturning();

    const onHashChange = () => openCategoryFromCurrentHash();

    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest("a");
      if (!anchor) return;

      const rawHref = anchor.getAttribute("href") || "";

      if (rawHref.startsWith("#")) {
        const id = decodeURIComponent(rawHref.replace(/^#/, ""));
        openCategoryById(id);
        return;
      }

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;
      if (!isCompareDetailPath(url.pathname)) return;

      saveCompareIndexState();
    };

    window.addEventListener("hashchange", onHashChange);
    document.addEventListener("click", onDocumentClick, true);

    return () => {
      window.removeEventListener("hashchange", onHashChange);
      document.removeEventListener("click", onDocumentClick, true);
    };
  }, []);

  return null;
}
