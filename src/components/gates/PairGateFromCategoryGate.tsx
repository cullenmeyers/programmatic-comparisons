// src/components/gates/PairGateFromCategoryGate.tsx

import Link from "next/link";
import { getCategoryGate } from "@/content/categoryGates";

type Verdict = "X_FAILS" | "Y_FAILS" | "BOTH_FAIL" | "NEITHER_FAIL" | "UNKNOWN";

function verdictFromFails(xFails?: boolean, yFails?: boolean): Verdict {
  if (xFails === true && yFails === false) return "X_FAILS";
  if (yFails === true && xFails === false) return "Y_FAILS";
  if (xFails === true && yFails === true) return "BOTH_FAIL";
  if (xFails === false && yFails === false) return "NEITHER_FAIL";
  return "UNKNOWN";
}

function cleanEmbedTitle(s: string) {
  return (s || "").replace(/^Quick (Gate|Filter):\s*/i, "").trim();
}

export default function PairGateFromCategoryGate(props: {
  categorySlug?: string;
  constraintSlug?: string;
  xName: string;
  yName: string;
}) {
  const categorySlug = (props.categorySlug || "").trim();
  const constraintSlug = (props.constraintSlug || "").trim();

  // SYSTEM CONTRACT: slugs are required. No guessing.
  if (!categorySlug || !constraintSlug) return null;

  const gate = getCategoryGate(categorySlug, constraintSlug);
  if (!gate) return null;

  const title =
    cleanEmbedTitle(gate.embedBlockTitle) ||
    cleanEmbedTitle(gate.title) ||
    "Quick filter";

  const xEntry = gate.tools.find((t) => t.name === props.xName);
  const yEntry = gate.tools.find((t) => t.name === props.yName);

  const v = verdictFromFails(xEntry?.fails, yEntry?.fails);
  const gateHref = `/tools/${gate.categorySlug}/${gate.constraintSlug}`;

  const xNote = xEntry?.note?.trim();
  const yNote = yEntry?.note?.trim();

  return (
    <section className="mt-6 rounded-2xl border border-black/10 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wide text-black/55">
            Quick filter
          </div>

          <div className="text-lg font-semibold tracking-tight text-black/90">
            {title}
          </div>

        </div>

        <Link
          href={gateHref}
          className="text-sm text-black/75 underline underline-offset-4 hover:text-black"
        >
          Open full filter →
        </Link>
      </div>

      <div className="mt-4 space-y-2 text-sm leading-6 text-black/75">
        {v === "X_FAILS" && (
          <>
            <div>
              <span className="font-medium text-black/85">{props.xName}</span>{" "}
              fails first
              {xNote ? <span className="text-black/60"> ({xNote})</span> : null}.
            </div>
            <div>
              Choose{" "}
              <span className="font-medium text-black/85">{props.yName}</span>
              {yNote ? <span className="text-black/60"> ({yNote})</span> : null}.
            </div>
          </>
        )}

        {v === "Y_FAILS" && (
          <>
            <div>
              <span className="font-medium text-black/85">{props.yName}</span>{" "}
              fails first
              {yNote ? <span className="text-black/60"> ({yNote})</span> : null}.
            </div>
            <div>
              Choose{" "}
              <span className="font-medium text-black/85">{props.xName}</span>
              {xNote ? <span className="text-black/60"> ({xNote})</span> : null}.
            </div>
          </>
        )}

        {v === "BOTH_FAIL" && (
          <>
            <div>Both tools are flagged by this filter.</div>
            <div>Use the page’s verdict rule to decide which is the lesser risk.</div>
          </>
        )}

        {v === "NEITHER_FAIL" && (
          <>
            <div>Neither tool is flagged by this filter.</div>
            <div>Use the page’s verdict rule to break the tie.</div>
          </>
        )}

        {v === "UNKNOWN" && (
          <>
            <div>
              This filter exists, but one or both tools aren’t mapped yet for this
              category.
            </div>
            <div>Open the full filter and update the map when you’re ready.</div>
          </>
        )}
      </div>
    </section>
  );
}
