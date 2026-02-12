import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Decision Clarities for corrections, suggestions, or inquiries.",
};

// TODO: replace this with your real email
const CONTACT_EMAIL = "cullen.meyers.work@gmail.com";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Contact</h1>
        <p className="text-base leading-7 text-black/75">
          Use this for corrections, suggestions, or questions about a specific page.
        </p>
      </header>

      <section className="rounded-2xl border border-black/10 bg-black/[0.02] p-6 space-y-3">
        <div className="text-sm uppercase tracking-wide text-black/55">Email</div>
        <p className="text-black/80 leading-7">
          <a
            className="underline underline-offset-4 hover:opacity-90"
            href={`mailto:${CONTACT_EMAIL}`}
          >
            {CONTACT_EMAIL}
          </a>
        </p>
        <p className="text-sm text-black/65 leading-6">
          Tip: include the link to the comparison page you’re referencing.
        </p>
      </section>
    </main>
  );
}
