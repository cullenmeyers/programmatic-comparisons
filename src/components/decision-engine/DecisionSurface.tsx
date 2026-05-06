"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import { cx } from "@/components/ui/classnames";
import {
  deriveDecisionDirection,
  findMatchingDecisionSurfaces,
  formatOppositePull,
  type CoreConstraint,
  type DecisionEngineData,
} from "./decisionEngine";

export type { DecisionEngineData } from "./decisionEngine";

type DecisionSurfaceProps = {
  data: DecisionEngineData;
};

function renderList(items: string[]) {
  return (
    <ul className="space-y-2 text-sm leading-6 text-black/70">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function DecisionSurface({ data }: DecisionSurfaceProps) {
  const [selectedPhrase, setSelectedPhrase] = useState<string | null>(null);

  const selectedIntent =
    data.intent_map.find((item) => item.phrase === selectedPhrase) ?? null;

  const selectedConstraints = selectedIntent
    ? selectedIntent.mapped_constraints
        .map((constraintId) =>
          data.core_constraints.find((constraint) => constraint.id === constraintId)
        )
        .filter((constraint): constraint is CoreConstraint => Boolean(constraint))
    : [];

  const matchingPersonas = selectedIntent
    ? data.derived_personas.filter((persona) =>
        selectedIntent.mapped_constraints.some(
          (constraintId) =>
            persona.primary_constraints.includes(constraintId) ||
            persona.secondary_constraints.includes(constraintId)
        )
      )
    : [];

  const matchingDecisionSurfaces = selectedIntent
    ? findMatchingDecisionSurfaces(data, selectedIntent.mapped_constraints)
    : [];

  const decisionDirection =
    selectedIntent && matchingDecisionSurfaces.length > 0
      ? deriveDecisionDirection(data, selectedConstraints, matchingDecisionSurfaces)
      : null;

  const constraintNames = new Map(
    data.core_constraints.map((constraint) => [constraint.id, constraint.name])
  );

  return (
    <div className="content-stack gap-8">
      <section className="content-stack gap-4">
        <SectionHeading
          title="Intent signals"
          subtitle="Start with the constraint language users naturally reach for."
        />
        <div className="grid gap-3 md:grid-cols-2">
          {data.intent_map.map((intent) => {
            const isSelected = intent.phrase === selectedPhrase;

            return (
              <button
                key={intent.phrase}
                type="button"
                onClick={() => setSelectedPhrase(intent.phrase)}
                className={cx(
                  "rounded-xl border bg-white p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30",
                  isSelected
                    ? "border-black bg-black text-white"
                    : "border-black/10 text-black hover:border-black/20"
                )}
              >
                <p
                  className={cx(
                    "text-sm font-medium",
                    isSelected ? "text-white" : "text-black"
                  )}
                >
                  {intent.phrase}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {!selectedIntent ? (
        <Card className="border-dashed border-black/15">
          <p className="text-sm text-black/65">
            Select a constraint to see the decision pattern.
          </p>
        </Card>
      ) : (
        <div className="content-stack gap-6">
          <section className="content-stack gap-3">
            <SectionHeading title="Selected intent" />
            <Card className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                  Phrase
                </p>
                <p className="text-base font-medium text-black">{selectedIntent.phrase}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                  Normalized meaning
                </p>
                <p className="text-sm leading-6 text-black/70">
                  {selectedIntent.normalized_meaning}
                </p>
              </div>
            </Card>
          </section>

          <section className="content-stack gap-3">
            <SectionHeading title="Core constraints" />
            <div className="grid gap-4">
              {selectedConstraints.map((constraint) => (
                <Card key={constraint.id} className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                      Constraint
                    </p>
                    <h3 className="text-lg font-semibold text-black">{constraint.name}</h3>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                        Definition
                      </p>
                      <p className="text-sm leading-6 text-black/70">
                        {constraint.definition}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                        Friction pattern
                      </p>
                      <p className="text-sm leading-6 text-black/70">
                        {constraint.friction_pattern}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                        Failure trigger
                      </p>
                      <p className="text-sm leading-6 text-black/70">
                        {constraint.failure_trigger}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                        Opposite pull
                      </p>
                      <p className="text-sm leading-6 text-black/70">
                        {formatOppositePull(constraint.opposite_pull, constraintNames)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <section className="content-stack gap-3">
            <SectionHeading title="Matching decision surfaces" />
            <div className="grid gap-4">
              {matchingDecisionSurfaces.map((surface) => (
                <Card key={surface.id} className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                      Surface
                    </p>
                    <h3 className="text-lg font-semibold text-black">{surface.name}</h3>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                      Core problem
                    </p>
                    <p className="text-sm leading-6 text-black/70">
                      {surface.core_problem}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                        Decision question
                      </p>
                      <p className="text-sm leading-6 text-black/70">
                        {surface.decision_question}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                        Dominant failure pattern
                      </p>
                      <p className="text-sm leading-6 text-black/70">
                        {surface.dominant_failure_pattern}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {decisionDirection ? (
            <section className="content-stack gap-3">
              <SectionHeading title="Decision direction" />
              <Card className="space-y-5">
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                    Tools tend to survive here when they:
                  </p>
                  {renderList(decisionDirection.survivingMechanisms)}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                    Tools tend to fail here when they:
                  </p>
                  {renderList(decisionDirection.failureMechanisms)}
                  <p className="text-sm leading-6 text-black/70">
                    Failure pattern: {decisionDirection.failurePatterns.join(" ")}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                    Primary tradeoff
                  </p>
                  <p className="text-sm leading-6 text-black/70">
                    {decisionDirection.primaryTradeoff}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                    Constraint pressure
                  </p>
                  <p className="text-sm leading-6 text-black/70">
                    {decisionDirection.constraintPressure}
                  </p>
                </div>
              </Card>
            </section>
          ) : null}

          <section className="content-stack gap-3">
            <SectionHeading title="Matching persona bundles" />
            <div className="grid gap-4 lg:grid-cols-2">
              {matchingPersonas.map((persona) => (
                <Card key={persona.persona} className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                      Persona
                    </p>
                    <h3 className="text-lg font-semibold text-black">{persona.persona}</h3>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                      Dominant failure fear
                    </p>
                    <p className="text-sm leading-6 text-black/70">
                      {persona.dominant_failure_fear}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                      Typical user language
                    </p>
                    {renderList(persona.typical_user_language)}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
