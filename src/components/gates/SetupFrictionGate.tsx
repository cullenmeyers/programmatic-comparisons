"use client";

import { useMemo, useState } from "react";

type Props = {
  xName: string;
  yName: string;
  variant?: "embed" | "page";
  disabled?: boolean;
  lockedMessage?: string;
};

type Choice = "X" | "Y" | "Neither";

export default function SetupFrictionGate({
  xName,
  yName,
  variant = "embed",
  disabled = false,
  lockedMessage,
}: Props) {
  const [choice, setChoice] = useState<Choice>("Neither");

  const output = useMemo(() => {
    if (choice === "X") {
      return [
        `${xName} exceeds your setup tolerance.`,
        `Eliminate ${xName} and continue evaluation with ${yName}.`,
      ];
    }
    if (choice === "Y") {
      return [
        `${yName} exceeds your setup tolerance.`,
        `Eliminate ${yName} and continue evaluation with ${xName}.`,
      ];
    }
    return [
      `Neither tool exceeds your setup tolerance.`,
      `Proceed to the next evaluation gate.`,
    ];
  }, [choice, xName, yName]);

  const containerClass =
    variant === "embed"
      ? "rounded-2xl border border-black/10 bg-black/[0.02] p-6 space-y-3"
      : "rounded-2xl border border-black/10 bg-white p-6 space-y-4";

  const questionClass =
    variant === "embed"
      ? "mt-2 space-y-2"
      : "rounded-xl border border-black/10 bg-black/[0.02] p-4 space-y-3";

  const effectiveOutput =
    disabled && lockedMessage
      ? [lockedMessage, ""] // keep 2-line structure without changing layout
      : output;

  return (
    <section className={containerClass}>
      <div className="space-y-1">
        <div className="text-sm uppercase tracking-wide text-black/55">
          Gate 2
        </div>
        <h2 className="text-xl font-semibold tracking-tight">
          Setup Friction Gate
        </h2>
        <p className="text-sm leading-6 text-black/65">
          Pick the option that feels like too much setup or configuration to
          get value quickly.
        </p>
      </div>

      <div className={questionClass}>
        <div className="text-sm font-medium text-black/75">
          Which tool is too heavy to set up right now?
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={`sfg-${xName}-${yName}`}
              value="X"
              checked={choice === "X"}
              onChange={() => setChoice("X")}
              disabled={disabled}
            />
            <span className="text-black/80">{xName} is too heavy</span>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={`sfg-${xName}-${yName}`}
              value="Y"
              checked={choice === "Y"}
              onChange={() => setChoice("Y")}
              disabled={disabled}
            />
            <span className="text-black/80">{yName} is too heavy</span>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={`sfg-${xName}-${yName}`}
              value="Neither"
              checked={choice === "Neither"}
              onChange={() => setChoice("Neither")}
              disabled={disabled}
            />
            <span className="text-black/80">Neither feels heavy</span>
          </label>
        </div>

        {disabled && (
          <div className="pt-2 text-xs text-black/55">
            Locked because an earlier gate eliminated an option.
          </div>
        )}
      </div>

      {variant === "embed" ? (
        <div className="mt-2 space-y-1">
          <div className="text-xs uppercase tracking-wide text-black/55">
            Output
          </div>
          <p className="leading-7 text-black/85">{effectiveOutput[0]}</p>
          {effectiveOutput[1] ? (
            <p className="leading-7 text-black/85">{effectiveOutput[1]}</p>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-black/10 bg-black/[0.02] p-4 space-y-2">
          <div className="text-xs uppercase tracking-wide text-black/55">
            Output
          </div>
          <p className="leading-7 text-black/85">{effectiveOutput[0]}</p>
          {effectiveOutput[1] ? (
            <p className="leading-7 text-black/85">{effectiveOutput[1]}</p>
          ) : null}
        </div>
      )}
    </section>
  );
}

