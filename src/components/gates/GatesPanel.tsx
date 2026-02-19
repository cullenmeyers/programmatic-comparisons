"use client";

import { useState } from "react";
import GatesEngine, { type GateId } from "./GatesEngine";

type Winner = "x" | "y" | "depends";

type Persona =
  | "Beginner"
  | "Solo user"
  | "Student"
  | "Busy professional"
  | "Power user"
  | "Non-technical user"
  | "Minimalist";

type Props = {
  gateIds: GateId[];
  xName: string;
  yName: string;
  winner: Winner;
  decisionRule: string;
  persona: Persona;

  /** default: collapsed so people see the page content */
  defaultOpen?: boolean;
};

export default function GatesPanel({
  gateIds,
  xName,
  yName,
  winner,
  decisionRule,
  persona,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-2xl border border-black/10 bg-white">
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm uppercase tracking-wide text-black/55">
              Optional
            </div>
            <h2 className="text-lg font-semibold tracking-tight">
              Decision Gates
            </h2>
            <p className="text-sm leading-6 text-black/65">
              Use these to eliminate an option quickly based on your situation.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="shrink-0 rounded-xl border border-black/10 px-3 py-2 text-sm text-black/75 hover:text-black hover:border-black/20"
          >
            {open ? "Hide gates" : "Open gates"}
          </button>
        </div>

        {open && (
          <div className="pt-2">
            <GatesEngine
              gateIds={gateIds}
              xName={xName}
              yName={yName}
              winner={winner}
              decisionRule={decisionRule}
              persona={persona}
            />
          </div>
        )}
      </div>
    </section>
  );
}
