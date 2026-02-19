// src/components/gates/GatesEngine.tsx
"use client";

import { useCallback, useMemo, useState } from "react";
import NonNegotiableRequirementGate from "./NonNegotiableRequirementGate";
import LensScenarioGate from "./LensScenarioGate";
import PlatformEcosystemGate from "./PlatformEcosystemGate";
import ResultBar from "./ResultBar";

export type GateId = "non_negotiable" | "lens_scenario" | "platform_ecosystem";

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
};

type Eliminated = "none" | "x" | "y";
type EliminationSource = "none" | "non_negotiable" | "platform";

export default function GatesEngine({
  gateIds,
  xName,
  yName,
  winner,
  decisionRule,
  persona,
}: Props) {
  const [eliminated, setEliminated] = useState<Eliminated>("none");
  const [source, setSource] = useState<EliminationSource>("none");

  // NEW: Gate 2 “soft” recommendation (does not eliminate)
  const [suggested, setSuggested] = useState<string | null>(null);

  // NEW: ResultBar shouldn’t pretend anything happened until user interacts
  const [answeredAny, setAnsweredAny] = useState(false);

  const continueWith = useMemo(() => {
    if (eliminated === "x") return yName;
    if (eliminated === "y") return xName;
    return null;
  }, [eliminated, xName, yName]);

  const lockedMessage = continueWith
    ? `Decision already made: continue with ${continueWith}.`
    : undefined;

  // Gate 2 is “soft”: disable if ANY elimination exists
  const lensDisabled = eliminated !== "none";

  // Gate 3 can eliminate, but should be disabled if Gate 1 eliminated
  const platformDisabled = source === "non_negotiable" && eliminated !== "none";

  const handleNonNegotiableEliminate = useCallback(
    (who: "X" | "Y" | "None") => {
      setAnsweredAny(true);

      if (who === "X") {
        setEliminated("x");
        setSource("non_negotiable");
        return;
      }
      if (who === "Y") {
        setEliminated("y");
        setSource("non_negotiable");
        return;
      }

      // None: unlock everything
      setEliminated("none");
      setSource("none");
    },
    []
  );

  const handlePlatformEliminate = useCallback(
    (who: "x" | "y" | "none") => {
      setAnsweredAny(true);

      // If Gate 1 made a hard elimination, ignore ecosystem changes
      if (source === "non_negotiable" && eliminated !== "none") return;

      if (who === "x") {
        setEliminated("x");
        setSource("platform");
        return;
      }

      if (who === "y") {
        setEliminated("y");
        setSource("platform");
        return;
      }

      // Only clear if platform was the source
      if (source === "platform") {
        setEliminated("none");
        setSource("none");
      }
    },
    [source, eliminated]
  );

  // Gate 2 suggestion handler (soft)
  const handleLensSuggest = useCallback((next: string | null) => {
    setAnsweredAny(true);
    setSuggested(next);
  }, []);

  return (
    <div className="space-y-6">
      <ResultBar
        xName={xName}
        yName={yName}
        eliminated={eliminated}
        winner={winner}
        answeredAny={answeredAny}
        suggested={suggested}
      />

      {gateIds.map((id) => {
        if (id === "non_negotiable") {
          return (
            <NonNegotiableRequirementGate
              key={id}
              xName={xName}
              yName={yName}
              variant="embed"
              onEliminate={handleNonNegotiableEliminate}
            />
          );
        }

        if (id === "lens_scenario") {
          return (
            <LensScenarioGate
              key={id}
              xName={xName}
              yName={yName}
              winner={winner}
              decisionRule={decisionRule}
              persona={persona}
              variant="embed"
              disabled={lensDisabled}
              lockedMessage={lockedMessage}
              onSuggest={handleLensSuggest}
            />
          );
        }

        if (id === "platform_ecosystem") {
          return (
            <PlatformEcosystemGate
              key={id}
              xName={xName}
              yName={yName}
              variant="embed"
              disabled={platformDisabled}
              lockedMessage={lockedMessage}
              onEliminate={handlePlatformEliminate}
            />
          );
        }

        return null;
      })}
    </div>
  );
}







