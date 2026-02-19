import Link from "next/link";
import { listTools } from "@/lib/gates/registry";

export const metadata = {
  title: "Tools | Decision Clarities",
  description:
    "Small decision tools that help you pick the right software faster — no accounts, no dashboards.",
};

export default function ToolsIndexPage() {
  const tools = listTools();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Tools</h1>
        <p className="text-black/70 leading-7">
          Quick, single-purpose gates you can run when you’re stuck deciding
          between two tools.
        </p>
      </header>

      <div className="space-y-4">
        {tools.map((t) => (
          <div
            key={t.id}
            className="rounded-2xl border border-black/10 bg-white p-5 space-y-2"
          >
            <div className="text-sm uppercase tracking-wide text-black/55">
              {t.badge}
            </div>

            <div className="text-lg font-semibold tracking-tight">{t.name}</div>

            <p className="text-sm leading-6 text-black/70">{t.description}</p>

            <Link
              className="inline-block text-sm underline underline-offset-4 text-black/75 hover:text-black"
              href={`/tools/${t.slug}`}
            >
              Open tool →
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
