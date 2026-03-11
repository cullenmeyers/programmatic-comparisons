import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "What Decision Clarities is, how to use it, and how the decision system works.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">About</h1>
        <p className="text-base leading-7 text-black/75">
          Decision Clarities is a decision-first library of software
          comparisons built around one practical question:{" "}
          <span className="font-medium text-black/85">
            under a real constraint, which tool fails first?
          </span>
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">What this site is</h2>
        <ul className="list-disc pl-5 space-y-2 text-black/80 leading-7">
          <li>
            A structured way to choose faster when comparing endless features is
            the wrong job.
          </li>
          <li>
            A library of pairwise comparisons, broader comparison directories,
            and category paths built to narrow the field quickly.
          </li>
          <li>
            A deterministic format centered on deciding rules, failure modes,
            and clear verdicts.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">How to use it</h2>
        <ul className="list-disc pl-5 space-y-2 text-black/80 leading-7">
          <li>Read a pairwise comparison when you already have two options in mind.</li>
          <li>Browse all comparisons when you want to scan the full directory.</li>
          <li>Open a category hub when you want a narrower starting point.</li>
          <li>Use quick filters to eliminate options faster before reading deeper.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">What this site is not</h2>
        <ul className="list-disc pl-5 space-y-2 text-black/80 leading-7">
          <li>Not a generic best-tools list.</li>
          <li>Not a feature matrix.</li>
          <li>Not a pricing roundup.</li>
          <li>Not a substitute for testing a tool yourself when the stakes are high.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">How comparisons are written</h2>
        <p className="text-black/80 leading-7">
          Each page starts from a real constraint: setup tolerance, maintenance
          load, switching cost, fear of breaking things, time scarcity, or
          another friction that actually decides the outcome. The structure
          stays narrow on purpose: identify the deciding rule, show the failure
          mode, and give a clear verdict.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Corrections & suggestions</h2>
        <p className="text-black/80 leading-7">
          If a page is inaccurate, outdated, or missing an important detail,
          send a note and include the page URL so it can be reviewed quickly.
        </p>
        <Link
          href="/contact"
          className="text-sm text-black/75 hover:text-black underline-offset-4 hover:underline"
        >
          Contact -&gt;
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Explore</h2>
        <div className="flex flex-col gap-2">
          <Link
            href="/compare"
            className="text-sm text-black/75 hover:text-black underline-offset-4 hover:underline"
          >
            View all comparisons -&gt;
          </Link>
          <Link
            href="/tools"
            className="text-sm text-black/75 hover:text-black underline-offset-4 hover:underline"
          >
            Browse category filters -&gt;
          </Link>
        </div>
      </section>
    </main>
  );
}
