import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ButtonLink from "@/components/ui/ButtonLink";
import Card from "@/components/ui/Card";
import { listSystemSlugs, loadSystemDocBySlug } from "@/lib/system";

type Params = { slug: string };

export const dynamic = "force-static";

export async function generateStaticParams() {
  return listSystemSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = loadSystemDocBySlug(slug);

  if (!doc) {
    return {
      title: "System Signal | Decision Clarities",
      description: "Public system architecture and decision rules.",
    };
  }

  return {
    title: `${doc.title} | System Signal`,
    description: doc.summary ?? "Public system architecture and decision rules.",
  };
}

function formatDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(parsed);
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <section className="space-y-2 rounded-lg border border-black/10 bg-white p-4">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-black/55">
        {title}
      </h2>
      <p className="leading-7 text-black/82">{content}</p>
    </section>
  );
}

export default async function SystemDocPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const doc = loadSystemDocBySlug(slug);

  if (!doc) notFound();

  const isArchitecture = doc.type === "architecture";
  const topLine = isArchitecture
    ? doc.what_this_is ?? "Architecture note."
    : doc.what_changed ?? "Structural delta.";
  const stamp = formatDate(doc.date || doc.updated);

  return (
    <main className="site-container page-shell content-stack max-w-4xl">
      <div className="text-sm">
        <ButtonLink href="/system" variant="ghost" className="px-0 py-0">
          All system signals
        </ButtonLink>
      </div>

      <header className="max-w-3xl space-y-4">
        <p className="text-xs uppercase tracking-[0.18em] text-black/55">Public signal</p>
        <p className="text-xs uppercase tracking-wide text-black/55">
          {isArchitecture ? "Architecture" : "Delta"}
          {stamp ? ` | ${stamp}` : ""}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl">
          {doc.title}
        </h1>
        <p className="text-base leading-7 text-black/70">{topLine}</p>
      </header>

      <Card className="max-w-3xl space-y-4 bg-black/[0.02]">
        <p className="text-xs uppercase tracking-[0.14em] text-black/55">Core rule</p>
        <p className="text-base leading-7 text-black/88">{doc.rule}</p>
      </Card>

      <div className="content-stack gap-3 max-w-3xl">
        <Section title={isArchitecture ? "What this is" : "What changed"} content={topLine} />
        <Section title="Structural problem" content={doc.structural_problem} />
        <Section title="Tradeoff" content={doc.tradeoff} />
        <Section title="Failure mode before" content={doc.failure_mode} />
        <Section title="Structural impact" content={doc.structural_impact} />
      </div>
    </main>
  );
}
