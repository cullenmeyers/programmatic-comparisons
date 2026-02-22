"use client";

import * as React from "react";
import type { CategoryGateSpec } from "@/content/categoryGates/types";

type Mode = "one" | "two";

function getToolEntry(gate: CategoryGateSpec, name: string) {
  return gate.tools.find((tool) => tool.name === name);
}

function verdictText(fails: boolean) {
  return fails ? "Fails this filter" : "Usually safe for this focus";
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: string[];
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-black/55">
        {label}
      </span>
      <select
        className="w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Select a tool...</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function CategoryGateClient({ gate }: { gate: CategoryGateSpec }) {
  const [mode, setMode] = React.useState<Mode>("one");
  const lensName = gate.uiConstraintName ?? gate.constraintLabel;

  const toolNames = React.useMemo(
    () => gate.tools.map((tool) => tool.name).sort((a, b) => a.localeCompare(b)),
    [gate.tools]
  );

  const [onePick, setOnePick] = React.useState<string>("");
  const [aPick, setAPick] = React.useState<string>("");
  const [bPick, setBPick] = React.useState<string>("");

  const oneEntry = onePick ? getToolEntry(gate, onePick) : undefined;
  const aEntry = aPick ? getToolEntry(gate, aPick) : undefined;
  const bEntry = bPick ? getToolEntry(gate, bPick) : undefined;
  const twoReady = !!aPick && !!bPick && aPick !== bPick;

  let twoSummary: { headline: string; detail?: string } | null = null;
  if (twoReady && aEntry && bEntry) {
    if (aEntry.fails && !bEntry.fails) {
      twoSummary = {
        headline: `${aPick} fails first for this focus.`,
        detail: `Pick ${bPick} if you want the option less likely to become work.`,
      };
    } else if (bEntry.fails && !aEntry.fails) {
      twoSummary = {
        headline: `${bPick} fails first for this focus.`,
        detail: `Pick ${aPick} if you want the option less likely to become work.`,
      };
    } else if (aEntry.fails && bEntry.fails) {
      twoSummary = {
        headline: "Both fail this filter for this focus.",
        detail: "Use the comparison page decision rule to choose the lesser risk.",
      };
    } else {
      twoSummary = {
        headline: "Neither is flagged by this filter.",
        detail: "Use the comparison page decision rule to break the tie.",
      };
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setMode("one")}
          className={`rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 ${
            mode === "one"
              ? "border-black/25 bg-black/[0.06] text-black"
              : "border-black/10 bg-white text-black/75 hover:bg-black/[0.03]"
          }`}
        >
          Pick 1 tool
        </button>
        <button
          type="button"
          onClick={() => setMode("two")}
          className={`rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 ${
            mode === "two"
              ? "border-black/25 bg-black/[0.06] text-black"
              : "border-black/10 bg-white text-black/75 hover:bg-black/[0.03]"
          }`}
        >
          Compare 2 tools
        </button>
      </div>

      {mode === "one" && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-black/90">
            Which tool are you considering?
          </p>
          <SelectField
            label="Tool"
            value={onePick}
            onChange={setOnePick}
            options={toolNames}
          />

          <div className="rounded-lg border border-black/10 bg-black/[0.02] p-4 text-sm text-black/75">
            {!onePick && <p>Make a selection to see whether it passes this filter.</p>}

            {onePick && oneEntry && (
              <div className="space-y-2">
                <p className="font-medium text-black/90">{verdictText(oneEntry.fails)}</p>
                {oneEntry.fails ? (
                  <div className="space-y-1">
                    <p>
                      {onePick} is likely to create extra friction under{" "}
                      <span className="font-medium">{lensName}</span>.
                    </p>
                    {oneEntry.note && (
                      <p className="text-black/70">
                        <span className="font-medium">Why:</span> {oneEntry.note}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-black/70">
                    It is not flagged by this filter for this focus.
                  </p>
                )}
              </div>
            )}

            {onePick && !oneEntry && (
              <p>
                This tool is not mapped yet for this category. Add it to the
                filter tool list when ready.
              </p>
            )}
          </div>
        </div>
      )}

      {mode === "two" && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-black/90">Compare two tools</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Tool A" value={aPick} onChange={setAPick} options={toolNames} />
            <SelectField label="Tool B" value={bPick} onChange={setBPick} options={toolNames} />
          </div>

          <div className="rounded-lg border border-black/10 bg-black/[0.02] p-4 text-sm text-black/75">
            {!twoReady && <p>Select two different tools to see which fails first.</p>}

            {twoReady && (!aEntry || !bEntry) && (
              <p>One or both tools are not mapped yet. Add them to this filter list.</p>
            )}

            {twoReady && aEntry && bEntry && twoSummary && (
              <div className="space-y-3">
                <p className="font-medium text-black/90">{twoSummary.headline}</p>
                {twoSummary.detail && <p className="text-black/70">{twoSummary.detail}</p>}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-black/10 bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-black/55">Tool A</p>
                    <p className="mt-1 font-medium text-black/90">{aPick}</p>
                    <p className="mt-2">{verdictText(aEntry.fails)}</p>
                    {aEntry.fails && aEntry.note && (
                      <p className="mt-1 text-black/70">
                        <span className="font-medium">Why:</span> {aEntry.note}
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg border border-black/10 bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-black/55">Tool B</p>
                    <p className="mt-1 font-medium text-black/90">{bPick}</p>
                    <p className="mt-2">{verdictText(bEntry.fails)}</p>
                    {bEntry.fails && bEntry.note && (
                      <p className="mt-1 text-black/70">
                        <span className="font-medium">Why:</span> {bEntry.note}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
