"use client";

import Link from "next/link";
import { useState } from "react";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import { cx } from "@/components/ui/classnames";
import {
  deriveDecisionDirection,
  findMatchingEvidencePatterns,
  findMatchingPairwiseEvidence,
  findMatchingDecisionSurfaces,
  formatOppositePull,
  getSupportedCategoryMechanisms,
  summarizeCurrentEvidenceSignal,
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

function joinCompact(items: string[]) {
  if (items.length === 0) {
    return "";
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export default function DecisionSurface({ data }: DecisionSurfaceProps) {
  const [selectedPhrase, setSelectedPhrase] = useState<string | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const supportedCategories = getSupportedCategoryMechanisms(data.categories);

  const selectedIntent =
    data.intent_map.find((item) => item.phrase === selectedPhrase) ?? null;
  const selectedCategory =
    supportedCategories.find((category) => category.slug === selectedCategorySlug) ?? null;

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
    ? findMatchingDecisionSurfaces(data, selectedIntent)
    : [];
  const matchingEvidencePatterns = selectedIntent
    ? findMatchingEvidencePatterns(
        data.evidence_patterns,
        selectedIntent.mapped_constraints,
        selectedCategory?.category ?? null
      )
    : [];
  const matchingPairwiseEvidence = selectedIntent
    ? findMatchingPairwiseEvidence(
        data.resolution_rules,
        selectedIntent.mapped_constraints,
        selectedCategory?.category ?? null
      )
    : [];

  const decisionDirection =
    selectedIntent && matchingDecisionSurfaces.length > 0
      ? deriveDecisionDirection(
          data,
          selectedConstraints,
          matchingDecisionSurfaces,
          selectedIntent.mapped_constraints,
          selectedCategory
        )
      : null;
  const currentEvidenceSignal =
    matchingPairwiseEvidence.length >= 2
      ? summarizeCurrentEvidenceSignal(matchingPairwiseEvidence)
      : null;

  const constraintNames = new Map(
    data.core_constraints.map((constraint) => [constraint.id, constraint.name])
  );
  const selectedConstraintNames = selectedConstraints.map((constraint) => constraint.name);
  const evidenceSignalGroupCount = currentEvidenceSignal
    ? currentEvidenceSignal.survivingTools.length +
      currentEvidenceSignal.eliminatedTools.length
    : null;
  const decisionMeaning =
    decisionDirection &&
    decisionDirection.survivingMechanisms.length > 0 &&
    decisionDirection.failureMechanisms.length > 0
      ? `This points toward mechanisms that reduce ${joinCompact(
          decisionDirection.survivingMechanisms
        )} and away from mechanisms that create ${joinCompact(
          decisionDirection.failureMechanisms
        )}.`
      : null;

  return (
    <div className="content-stack gap-8">
      <section className="content-stack gap-4">
        <SectionHeading
          title="What are you choosing for?"
          subtitle="Pick the statement that sounds most like your situation."
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

      <section className="content-stack gap-4">
        <SectionHeading
          title="Tool category (optional)"
          subtitle="Optionally narrow the evaluation to a tool category."
        />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => setSelectedCategorySlug(null)}
            className={cx(
              "rounded-xl border bg-white p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30",
              selectedCategorySlug === null
                ? "border-black bg-black text-white"
                : "border-black/10 text-black hover:border-black/20"
            )}
          >
            <p
              className={cx(
                "text-sm font-medium",
                selectedCategorySlug === null ? "text-white" : "text-black"
              )}
            >
              All categories
            </p>
          </button>

          {supportedCategories.map((category) => {
            const isSelected = category.slug === selectedCategorySlug;

            return (
              <button
                key={category.slug}
                type="button"
                onClick={() => setSelectedCategorySlug(category.slug)}
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
                  {category.category}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {!selectedIntent ? (
        <Card className="border-dashed border-black/15">
          <p className="text-sm text-black/65">
            Select a statement to see what to look for.
          </p>
        </Card>
      ) : (
        <div className="content-stack gap-6">
          {decisionDirection ? (
            <section className="content-stack gap-3">
              <SectionHeading title="What to look for" />
              <Card className="space-y-5">
                <p className="text-sm leading-6 text-black/70">
                  Use this as a filter: prefer tools that match these traits,
                  and be cautious of tools that show this failure pattern.
                </p>

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

                {selectedCategory && decisionDirection.categoryMechanismEffects.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                      Category-specific mechanism effects
                    </p>
                    {renderList(decisionDirection.categoryMechanismEffects)}
                  </div>
                ) : null}

                {selectedCategory && decisionDirection.categoryTypicalFailures.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                      Category-specific typical failures
                    </p>
                    {renderList(decisionDirection.categoryTypicalFailures)}
                  </div>
                ) : null}

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
                    What matters most here
                  </p>
                  <p className="text-sm leading-6 text-black/70">
                    {decisionDirection.constraintPressure}
                  </p>
                </div>
              </Card>
            </section>
          ) : null}

          {currentEvidenceSignal ? (
            <section className="content-stack gap-3">
              <SectionHeading title="What matched comparisons suggest" />
              <Card className="space-y-5">
                <p className="text-sm leading-6 text-black/70">
                  This only summarizes matched pairwise evidence from existing
                  ToolPicker comparisons.
                </p>
                <p className="text-sm leading-6 text-black/70">
                  These are examples from matched comparisons, not a best-tools
                  list.
                </p>

                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                    Tools that survive in matched comparisons
                  </p>
                  <div className="grid gap-4">
                    {currentEvidenceSignal.survivingTools.map((group) => (
                      <div
                        key={group.tool}
                        className="rounded-xl border border-black/10 bg-black/[0.02] p-4"
                      >
                        <p className="text-sm font-medium text-black">{group.tool}</p>
                        <p className="mt-1 text-sm leading-6 text-black/70">
                          appears in {group.count} matched comparisons
                        </p>
                        <div className="mt-3 space-y-1">
                          <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                            Source comparisons
                          </p>
                          <div className="flex flex-wrap gap-3">
                            {group.sourceComparisonSlugs.map((slug) => (
                              <Link
                                key={`${group.tool}-${slug}`}
                                href={`/compare/${slug}`}
                                className="text-sm font-medium text-black underline underline-offset-4"
                              >
                                /compare/{slug}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                    Tools that fail first in matched comparisons
                  </p>
                  <div className="grid gap-4">
                    {currentEvidenceSignal.eliminatedTools.map((group) => (
                      <div
                        key={group.tool}
                        className="rounded-xl border border-black/10 bg-black/[0.02] p-4"
                      >
                        <p className="text-sm font-medium text-black">{group.tool}</p>
                        <p className="mt-1 text-sm leading-6 text-black/70">
                          fails first in {group.count} matched comparisons
                        </p>
                        <div className="mt-3 space-y-1">
                          <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                            Failure triggers
                          </p>
                          {renderList(group.failureTriggers)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </section>
          ) : (
            <Card className="border-dashed border-black/15">
              <p className="text-sm leading-6 text-black/65">
                Not enough matched pairwise evidence yet.
              </p>
            </Card>
          )}

          <section className="content-stack gap-3">
            <SectionHeading title="Why this result" />
            <Card className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                    You said
                  </p>
                  <p className="text-sm leading-6 text-black/70">{selectedIntent.phrase}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                    What ToolPicker inferred
                  </p>
                  <p className="text-sm leading-6 text-black/70">
                    {selectedConstraintNames.length > 0
                      ? joinCompact(selectedConstraintNames)
                      : "No mapped constraints."}
                  </p>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                    Tool category
                  </p>
                  {selectedCategory ? (
                    <div className="space-y-1 text-sm leading-6 text-black/70">
                      <p>{selectedCategory.category}</p>
                      {decisionDirection?.categoryMechanismEffects.length ? (
                        <p>
                          Mechanism effects:{" "}
                          {joinCompact(decisionDirection.categoryMechanismEffects)}
                        </p>
                      ) : null}
                      {decisionDirection?.categoryTypicalFailures.length ? (
                        <p>
                          Typical failures:{" "}
                          {joinCompact(decisionDirection.categoryTypicalFailures)}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm leading-6 text-black/70">
                      No category selected, so the trace uses general constraint
                      patterns.
                    </p>
                  )}
                </div>

                <div className="space-y-1 md:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                    Where tools usually break
                  </p>
                  <p className="text-sm leading-6 text-black/70">
                    {decisionDirection?.constraintPressure ??
                      "No failure pressure summary is available yet."}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                    Evidence attached
                  </p>
                  <p className="text-sm leading-6 text-black/70">
                    {matchingPairwiseEvidence.length} matched pairwise evidence rule
                    {matchingPairwiseEvidence.length === 1 ? "" : "s"}
                    {evidenceSignalGroupCount !== null
                      ? `, ${evidenceSignalGroupCount} current evidence signal group${
                          evidenceSignalGroupCount === 1 ? "" : "s"
                        }`
                      : ""}
                    .
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                    Decision meaning
                  </p>
                  <p className="text-sm leading-6 text-black/70">
                    {decisionMeaning ??
                      "This summarizes the current decision direction without introducing a new result."}
                  </p>
                </div>
              </div>
            </Card>
          </section>

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

          {selectedCategory ? (
            <section className="content-stack gap-3">
              <SectionHeading title="How this category usually fails" />
              <Card className="space-y-5">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                    Category
                  </p>
                  <p className="text-base font-medium text-black">{selectedCategory.category}</p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                      Sensitive constraints
                    </p>
                    {renderList(
                      selectedCategory.sensitive_constraints.map(
                        (constraintId) => constraintNames.get(constraintId) ?? constraintId
                      )
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                      Dominant mechanisms
                    </p>
                    {renderList(selectedCategory.dominant_mechanisms)}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                      Common friction patterns
                    </p>
                    {renderList(selectedCategory.common_friction_patterns)}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                      Common failure patterns
                    </p>
                    {renderList(selectedCategory.common_failure_patterns)}
                  </div>
                </div>
              </Card>
            </section>
          ) : null}

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
            <SectionHeading title="Decision lens" />
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

          <section className="content-stack gap-3">
            <SectionHeading title="Repeated patterns in existing comparisons" />
            <Card className="space-y-5">
              <p className="text-sm leading-6 text-black/70">
                These patterns are derived from existing ToolPicker comparisons.
              </p>

              {matchingEvidencePatterns.length === 0 ? (
                <p className="text-sm leading-6 text-black/65">
                  No evidence patterns match this intent and category filter yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {matchingEvidencePatterns.map(({ pattern }) => (
                    <div
                      key={pattern.id}
                      className="rounded-xl border border-black/10 bg-black/[0.02] p-4"
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                          Pattern
                        </p>
                        <p className="text-sm font-medium text-black">
                          {pattern.pattern_name}
                        </p>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div className="space-y-1">
                          <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                            Repeated mechanism
                          </p>
                          <p className="text-sm leading-6 text-black/70">
                            {pattern.repeated_mechanism}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                            Repeated friction
                          </p>
                          <p className="text-sm leading-6 text-black/70">
                            {pattern.repeated_friction}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                            Repeated failure
                          </p>
                          <p className="text-sm leading-6 text-black/70">
                            {pattern.repeated_failure}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                            Survival direction
                          </p>
                          <p className="text-sm leading-6 text-black/70">
                            {pattern.survival_direction}
                          </p>
                        </div>

                        <div className="space-y-1 md:col-span-2">
                          <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                            Representative comparisons
                          </p>
                          <div className="flex flex-wrap gap-3">
                            {pattern.representative_comparisons.map((slug) => (
                              <Link
                                key={`${pattern.id}-${slug}`}
                                href={`/compare/${slug}`}
                                className="text-sm font-medium text-black underline underline-offset-4"
                              >
                                /compare/{slug}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>

          <section className="content-stack gap-3">
            <SectionHeading title="Matched comparison examples" />
            <Card className="space-y-5">
              <p className="text-sm leading-6 text-black/70">
                These are pairwise rules from existing ToolPicker comparisons. They are
                evidence for the decision direction, not universal tool advice.
              </p>

              {matchingPairwiseEvidence.length === 0 ? (
                <p className="text-sm leading-6 text-black/65">
                  No pairwise evidence matches this intent and category filter yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {matchingPairwiseEvidence.map(({ rule }) => (
                    <div
                      key={rule.id}
                      className="rounded-xl border border-black/10 bg-black/[0.02] p-4"
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1">
                          <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                            Comparison
                          </p>
                          <p className="text-sm font-medium text-black">
                            {rule.surviving_tool} vs {rule.eliminated_tool}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                            Category
                          </p>
                          <p className="text-sm leading-6 text-black/70">{rule.category}</p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                            Persona
                          </p>
                          <p className="text-sm leading-6 text-black/70">{rule.persona}</p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                            What fails first
                          </p>
                          <p className="text-sm leading-6 text-black/70">
                            {rule.eliminated_tool}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div className="space-y-1">
                          <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                            Why it fails
                          </p>
                          <p className="text-sm leading-6 text-black/70">
                            {rule.failure_mechanism} {rule.failure_trigger}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                            Why the other survives
                          </p>
                          <p className="text-sm leading-6 text-black/70">
                            {rule.survival_reason}
                          </p>
                        </div>

                        <div className="space-y-1 md:col-span-2">
                          <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                            Tradeoff introduced
                          </p>
                          <p className="text-sm leading-6 text-black/70">
                            {rule.tradeoff_introduced}
                          </p>
                        </div>

                        <div className="space-y-1 md:col-span-2">
                          <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                            Source comparison
                          </p>
                          <Link
                            href={`/compare/${rule.source_comparison_slug}`}
                            className="text-sm font-medium text-black underline underline-offset-4"
                          >
                            /compare/{rule.source_comparison_slug}
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>

          <section className="content-stack gap-3">
            <SectionHeading title="Similar user situations" />
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
