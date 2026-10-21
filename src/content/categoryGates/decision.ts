import type { CategoryGateSpec } from "./types.ts";

export type GateOutcome =
  | "unknown"
  | "preliminary-concern"
  | "verified-fit"
  | "verified-concern";

type GateTool = CategoryGateSpec["tools"][number];

function hasReviewableEvidence(tool: GateTool) {
  const evidence = tool.assessment?.evidence;
  if (!evidence || tool.assessment?.validated !== true) return false;

  let sourceIsReviewable = false;
  try {
    const sourceUrl = new URL(evidence.sourceUrl);
    sourceIsReviewable =
      sourceUrl.protocol === "https:" || sourceUrl.protocol === "http:";
  } catch {
    sourceIsReviewable = false;
  }

  return Boolean(
    sourceIsReviewable &&
      evidence.sourceTitle.trim() &&
      evidence.attribution.trim() &&
      evidence.reviewedAt.trim()
  );
}

export function getGateOutcome(
  categorySlug: string,
  tool: GateTool
): GateOutcome {
  if (categorySlug !== "time-tracking-tools") {
    return tool.fails ? "verified-concern" : "verified-fit";
  }

  if (tool.assessment && hasReviewableEvidence(tool)) {
    return tool.assessment.status;
  }

  return tool.fails ? "preliminary-concern" : "unknown";
}

export function getPairDecision(
  categorySlug: string,
  first: GateTool,
  second: GateTool
) {
  const firstOutcome = getGateOutcome(categorySlug, first);
  const secondOutcome = getGateOutcome(categorySlug, second);

  if (firstOutcome === "verified-fit" && secondOutcome === "verified-concern") {
    return { winner: "first" as const, firstOutcome, secondOutcome };
  }

  if (secondOutcome === "verified-fit" && firstOutcome === "verified-concern") {
    return { winner: "second" as const, firstOutcome, secondOutcome };
  }

  return { winner: null, firstOutcome, secondOutcome };
}
