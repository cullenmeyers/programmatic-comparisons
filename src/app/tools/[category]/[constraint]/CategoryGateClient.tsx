"use client";

import * as React from "react";
import type { CategoryGateSpec } from "@/content/categoryGates/types";
import {
  getGateOutcome,
  getPairDecision,
  type GateOutcome,
} from "@/content/categoryGates/decision";

type Mode = "one" | "two";

function formatOutcome(outcome: GateOutcome) {
  switch (outcome) {
    case "verified-fit":
      return "Verified fit";
    case "verified-concern":
      return "Verified concern";
    case "preliminary-concern":
      return "Preliminary concern";
    default:
      return "Unknown";
  }
}

function getToolEntry(gate: CategoryGateSpec, name: string) {
  return gate.tools.find((tool) => tool.name === name);
}

function getConstraintFriction(constraintSlug: CategoryGateSpec["constraintSlug"]) {
  switch (constraintSlug) {
    case "setup-tolerance":
      return "front-loaded setup";
    case "maintenance-load":
      return "ongoing upkeep";
    case "switching-cost":
      return "high switching cost";
    case "time-scarcity":
      return "slow workflow overhead";
    case "ceiling-check":
      return "an early ceiling";
    case "fear-of-breaking":
      return "breakage and misconfiguration risk";
    case "feature-aversion":
      return "unnecessary complexity";
    default:
      return "this constraint";
  }
}

function getFailureSummary(
  constraintSlug: CategoryGateSpec["constraintSlug"],
  toolName: string
) {
  switch (constraintSlug) {
    case "setup-tolerance":
      return `${toolName} asks for too much setup before the basic job is ready.`;
    case "maintenance-load":
      return `${toolName} needs more ongoing upkeep to keep working cleanly.`;
    case "switching-cost":
      return `${toolName} takes more commitment to set up and unwind.`;
    case "time-scarcity":
      return `${toolName} takes too many steps for repeated day-to-day use.`;
    case "ceiling-check":
      return `${toolName} reaches its limits sooner as the workflow grows.`;
    case "fear-of-breaking":
      return `${toolName} is easier to misconfigure or break by mistake.`;
    case "feature-aversion":
      return `${toolName} adds more layers than this simple use case needs.`;
    default:
      return `${toolName} fails earlier under this constraint.`;
  }
}

function getSurvivalSummary(
  constraintSlug: CategoryGateSpec["constraintSlug"],
  toolName: string
) {
  switch (constraintSlug) {
    case "setup-tolerance":
      return `${toolName} gets you to a working result without heavy setup first.`;
    case "maintenance-load":
      return `${toolName} stays usable without much regular upkeep.`;
    case "switching-cost":
      return `${toolName} is easier to adopt without locking yourself in.`;
    case "time-scarcity":
      return `${toolName} keeps the day-to-day workflow short and direct.`;
    case "ceiling-check":
      return `${toolName} leaves more room before you hit real limits.`;
    case "fear-of-breaking":
      return `${toolName} is harder to mis-set in normal use.`;
    case "feature-aversion":
      return `${toolName} stays closer to the basic job with fewer extra layers.`;
    default:
      return `${toolName} is unlikely to fail early under this constraint.`;
  }
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
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-black/55">
        {label}
      </span>
      <div className="relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className="flex w-full items-center justify-between rounded-lg border border-black/15 bg-white px-3 py-2.5 text-left text-sm text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
          onClick={() => setIsOpen((open) => !open)}
          onBlur={(event) => {
            if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node)) {
              setIsOpen(false);
            }
          }}
        >
          <span className={value ? "text-black" : "text-black/55"}>
            {value || "Select a tool..."}
          </span>
          <span className="ml-3 text-black/45">{isOpen ? "▲" : "▼"}</span>
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-lg border border-black/10 bg-white shadow-lg">
            <ul className="max-h-60 overflow-y-auto py-1" role="listbox" tabIndex={-1}>
              <li>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm text-black/60 hover:bg-black/[0.04]"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange("");
                    setIsOpen(false);
                  }}
                >
                  Select a tool...
                </button>
              </li>
              {options.map((option) => (
                <li key={option}>
                  <button
                    type="button"
                    className={`block w-full px-3 py-2 text-left text-sm hover:bg-black/[0.04] ${
                      option === value ? "bg-black/[0.05] font-medium text-black" : "text-black/80"
                    }`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onChange(option);
                      setIsOpen(false);
                    }}
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </label>
  );
}

export default function CategoryGateClient({ gate }: { gate: CategoryGateSpec }) {
  const [mode, setMode] = React.useState<Mode>("one");
  const constraintFriction = getConstraintFriction(gate.constraintSlug);

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
  const oneOutcome = oneEntry
    ? getGateOutcome(gate.categorySlug, oneEntry)
    : undefined;
  const twoReady = !!aPick && !!bPick && aPick !== bPick;
  const oneResultCardClassName = oneOutcome
    ? oneOutcome === "verified-concern"
      ? "border-red-200 bg-red-50 text-red-950"
      : oneOutcome === "verified-fit"
        ? "border-emerald-200 bg-emerald-50 text-emerald-950"
        : oneOutcome === "preliminary-concern"
          ? "border-amber-200 bg-amber-50 text-amber-950"
          : "border-black/10 bg-black/[0.02] text-black/75"
    : "border-black/10 bg-black/[0.02] text-black/75";

  const getCompareToolCardClassName = (outcome: GateOutcome) => {
    if (outcome === "verified-concern") return "border-red-200 bg-red-50 text-red-950";
    if (outcome === "verified-fit") return "border-emerald-200 bg-emerald-50 text-emerald-950";
    if (outcome === "preliminary-concern") return "border-amber-200 bg-amber-50 text-amber-950";
    return "border-black/10 bg-white text-black/75";
  };

  let twoSummary: {
    headline: string;
    detail: string;
    firstOutcome: GateOutcome;
    secondOutcome: GateOutcome;
    winner: "first" | "second" | null;
  } | null = null;
  if (twoReady && aEntry && bEntry) {
    const decision = getPairDecision(gate.categorySlug, aEntry, bEntry);
    if (decision.winner === "first") {
      twoSummary = { ...decision, headline: `Pick ${aPick} if you want to avoid ${constraintFriction}.`, detail: bEntry.note || getFailureSummary(gate.constraintSlug, bPick) };
    } else if (decision.winner === "second") {
      twoSummary = { ...decision, headline: `Pick ${bPick} if you want to avoid ${constraintFriction}.`, detail: aEntry.note || getFailureSummary(gate.constraintSlug, aPick) };
    } else {
      twoSummary = {
        ...decision,
        headline: gate.categorySlug === "time-tracking-tools"
          ? "There is not enough verified evidence to choose a winner."
          : decision.firstOutcome === "verified-concern"
            ? "Both tools fail early under this constraint."
            : "Neither tool is flagged to fail early here.",
        detail: gate.categorySlug === "time-tracking-tools"
          ? "Treat preliminary concerns as leads to verify, not proof that either tool is the better fit."
          : "Use the comparison page decision rule to break the tie.",
      };
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setMode("one")}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 ${
            mode === "one"
              ? "border-black bg-black text-white"
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

          <div
            className={`rounded-lg border p-4 text-sm ${oneResultCardClassName}`}
          >
            {!onePick && <p>Make a selection to see its evidence status for this filter.</p>}

            {onePick && oneEntry && (
              <div className="space-y-2">
                <p className="font-medium text-current">
                  {oneOutcome === "verified-concern"
                    ? "Verified concern"
                    : oneOutcome === "verified-fit"
                      ? "Verified fit"
                      : oneOutcome === "preliminary-concern"
                        ? "Preliminary concern"
                        : "Unknown"}
                </p>
                {oneOutcome === "verified-concern" ? (
                  <div className="space-y-1">
                    <p>{getFailureSummary(gate.constraintSlug, onePick)}</p>
                    {oneEntry.note && (
                      <p className="text-current/80">
                        That creates the kind of friction this filter is trying to avoid.
                      </p>
                    )}
                  </div>
                ) : oneOutcome === "verified-fit" ? (
                  <div className="space-y-1 text-current/80">
                    <p>{getSurvivalSummary(gate.constraintSlug, onePick)}</p>
                    <p>It avoids the patterns that usually cause tools to break here.</p>
                  </div>
                ) : oneOutcome === "preliminary-concern" ? (
                  <div className="space-y-1 text-current/80">
                    <p>{oneEntry.note || "A legacy mapping flagged a possible concern."}</p>
                    <p>This has not been verified with reviewable source evidence.</p>
                  </div>
                ) : (
                  <p className="text-current/80">No verified evidence establishes a fit or concern for this tool yet.</p>
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
            {!twoReady && <p>Select two different tools to compare their evidence status.</p>}

            {twoReady && (!aEntry || !bEntry) && (
              <p>One or both tools are not mapped yet. Add them to this filter list.</p>
            )}

            {twoReady && aEntry && bEntry && twoSummary && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-black/55">
                    Evidence comparison
                  </p>
                  {twoSummary.winner ? (
                    <ol className="mt-2 space-y-1 text-black/85">
                      {twoSummary.winner === "second" ? (
                        <>
                          <li>1. {aPick} (fails first)</li>
                          <li>2. {bPick} (survives longer)</li>
                        </>
                      ) : (
                        <>
                          <li>1. {bPick} (fails first)</li>
                          <li>2. {aPick} (survives longer)</li>
                        </>
                      )}
                    </ol>
                  ) : (
                    <p className="mt-2 text-black/70">
                      No verified failure order is available.
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-black/55">
                    Verdict
                  </p>
                  <p className="mt-2 font-medium text-current">{twoSummary.headline}</p>
                </div>

                {twoSummary.winner && twoSummary.detail && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-black/55">
                      Verified concern
                    </p>
                    <p className="mt-2 text-current/80">{twoSummary.detail}</p>
                  </div>
                )}

                {!twoSummary.winner && twoSummary.detail && (
                  <p className="text-current/80">{twoSummary.detail}</p>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div
                    className={`rounded-lg border p-3 ${getCompareToolCardClassName(twoSummary.firstOutcome)}`}
                  >
                    <p className="text-xs uppercase tracking-wide text-black/55">Tool A</p>
                    <p className="mt-1 font-medium text-current">{aPick}</p>
                    <p className="mt-2">{formatOutcome(twoSummary.firstOutcome)}</p>
                    {twoSummary.firstOutcome === "preliminary-concern" && aEntry.note && (
                      <p className="mt-1 text-current/80">{aEntry.note}</p>
                    )}
                  </div>

                  <div
                    className={`rounded-lg border p-3 ${getCompareToolCardClassName(twoSummary.secondOutcome)}`}
                  >
                    <p className="text-xs uppercase tracking-wide text-black/55">Tool B</p>
                    <p className="mt-1 font-medium text-current">{bPick}</p>
                    <p className="mt-2">{formatOutcome(twoSummary.secondOutcome)}</p>
                    {twoSummary.secondOutcome === "preliminary-concern" && bEntry.note && (
                      <p className="mt-1 text-current/80">{bEntry.note}</p>
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
