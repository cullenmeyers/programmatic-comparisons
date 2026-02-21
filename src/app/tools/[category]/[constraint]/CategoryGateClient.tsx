"use client";

import * as React from "react";
import type { CategoryGateSpec } from "@/content/categoryGates/types";

type Mode = "one" | "two";

function getToolEntry(gate: CategoryGateSpec, name: string) {
  return gate.tools.find((t) => t.name === name);
}

function verdictText(fails: boolean) {
  return fails ? "Fails this gate" : "Usually safe for this lens";
}

export default function CategoryGateClient({ gate }: { gate: CategoryGateSpec }) {
  const [mode, setMode] = React.useState<Mode>("one");
  const lensName = gate.uiConstraintName ?? gate.constraintLabel;

  const toolNames = React.useMemo(
    () => gate.tools.map((t) => t.name).sort((a, b) => a.localeCompare(b)),
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
    // Deterministic “fails first” logic
    if (aEntry.fails && !bEntry.fails) {
      twoSummary = {
        headline: `${aPick} fails first for this lens.`,
        detail: `Pick ${bPick} if you want the option that’s less likely to become work.`,
      };
    } else if (bEntry.fails && !aEntry.fails) {
      twoSummary = {
        headline: `${bPick} fails first for this lens.`,
        detail: `Pick ${aPick} if you want the option that’s less likely to become work.`,
      };
    } else if (aEntry.fails && bEntry.fails) {
      twoSummary = {
        headline: `Both fail this gate for this lens.`,
        detail: `Use your comparison page’s decision rule to choose the lesser evil.`,
      };
    } else {
      twoSummary = {
        headline: `Neither is flagged by this gate.`,
        detail: `Use the comparison page’s decision rule to break the tie.`,
      };
    }
  }

  return (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMode("one")}
          className={`rounded-full border px-3 py-1 text-sm ${
            mode === "one" ? "border-black/20 bg-black/[0.04]" : "border-black/10 bg-white"
          }`}
        >
          Pick 1 tool
        </button>
        <button
          type="button"
          onClick={() => setMode("two")}
          className={`rounded-full border px-3 py-1 text-sm ${
            mode === "two" ? "border-black/20 bg-black/[0.04]" : "border-black/10 bg-white"
          }`}
        >
          Compare 2 tools
        </button>
      </div>

      {/* Pick 1 */}
      {mode === "one" && (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-black/85">Which tool are you considering?</div>

          <select
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            value={onePick}
            onChange={(e) => setOnePick(e.target.value)}
          >
            <option value="">Select a tool…</option>
            {toolNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

          <div className="rounded-xl border border-black/10 bg-black/[0.02] p-4 text-sm text-black/75">
            {!onePick && <div>Make a selection to see whether it passes this gate.</div>}

            {onePick && oneEntry && (
              <div className="space-y-2">
                <div className="font-medium text-black/85">{verdictText(oneEntry.fails)}</div>

                {oneEntry.fails ? (
                  <div className="space-y-1">
                    <div>
                      {onePick} is likely to create extra friction under:{" "}
                      <span className="font-medium">{lensName}</span>.
                    </div>
                    {oneEntry.note && (
                      <div className="text-black/70">
                        <span className="font-medium text-black/75">Why:</span> {oneEntry.note}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-black/70">
                    It’s not flagged by this gate for this lens.
                  </div>
                )}
              </div>
            )}

            {onePick && !oneEntry && (
              <div>
                This tool isn’t mapped yet for this category. Add it to the gate’s tool list when
                you’re ready.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compare 2 */}
      {mode === "two" && (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-black/85">Compare two tools</div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wide text-black/55">Tool A</div>
              <select
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                value={aPick}
                onChange={(e) => setAPick(e.target.value)}
              >
                <option value="">Select…</option>
                {toolNames.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wide text-black/55">Tool B</div>
              <select
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                value={bPick}
                onChange={(e) => setBPick(e.target.value)}
              >
                <option value="">Select…</option>
                {toolNames.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-black/10 bg-black/[0.02] p-4 text-sm text-black/75">
            {!twoReady && <div>Select two different tools to see which fails first.</div>}

            {twoReady && (!aEntry || !bEntry) && (
              <div>
                One or both tools aren’t mapped yet. Add them to this gate’s tool list.
              </div>
            )}

            {twoReady && aEntry && bEntry && twoSummary && (
              <div className="space-y-3">
                <div className="font-medium text-black/85">{twoSummary.headline}</div>
                {twoSummary.detail && <div className="text-black/70">{twoSummary.detail}</div>}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-black/10 bg-white p-3">
                    <div className="text-xs uppercase tracking-wide text-black/55">Tool A</div>
                    <div className="mt-1 font-medium text-black/85">{aPick}</div>
                    <div className="mt-2 text-sm">{verdictText(aEntry.fails)}</div>
                    {aEntry.fails && aEntry.note && (
                      <div className="mt-1 text-sm text-black/70">
                        <span className="font-medium text-black/75">Why:</span> {aEntry.note}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-black/10 bg-white p-3">
                    <div className="text-xs uppercase tracking-wide text-black/55">Tool B</div>
                    <div className="mt-1 font-medium text-black/85">{bPick}</div>
                    <div className="mt-2 text-sm">{verdictText(bEntry.fails)}</div>
                    {bEntry.fails && bEntry.note && (
                      <div className="mt-1 text-sm text-black/70">
                        <span className="font-medium text-black/75">Why:</span> {bEntry.note}
                      </div>
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
