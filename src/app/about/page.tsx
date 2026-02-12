import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "What Decision Clarities is, who it’s for, and how the comparisons are written.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">About</h1>
        <p className="text-base leading-7 text-black/75">
          Decision Clarities is a library of constraint-based tool comparisons.
          Each page answers a simple question:{" "}
          <span className="font-medium text-black/85">
            given a specific constraint, which tool fails first?
          </span>
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">What this site is</h2>
        <ul className="list-disc pl-5 space-y-2 text-black/80 leading-7">
          <li>
            A fast way to choose between two tools when you already know your situation
            (persona) and your main constraint.
          </li>
          <li>
            A decision-first format: verdict → decision rule → failure modes → quick rules.
          </li>
          <li>
            A growing reference library with internal links between related comparisons.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">What this site is not</h2>
        <ul className="list-disc pl-5 space-y-2 text-black/80 leading-7">
          <li>Not a generic “best tool” list.</li>
          <li>Not a feature checklist or pricing roundup.</li>
          <li>Not a replacement for official documentation.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">How comparisons are written</h2>
        <p className="text-black/80 leading-7">
          Each comparison is framed around one non-negotiable constraint (for example:
          low tolerance for setup, time scarcity, fear of breaking things, zero maintenance).
          The page focuses on practical failure modes and the simplest rule that decides.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Corrections & suggestions</h2>
        <p className="text-black/80 leading-7">
          If something is inaccurate, outdated, or missing, send a note and include the URL of
          the page. I’ll update it.
        </p>
        <Link
          href="/contact"
          className="text-sm text-black/75 hover:text-black underline-offset-4 hover:underline"
        >
          Contact →
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Browse comparisons</h2>
        <Link
          href="/compare"
          className="text-sm text-black/75 hover:text-black underline-offset-4 hover:underline"
        >
          View all comparisons →
        </Link>
      </section>
    </main>
  );
}
