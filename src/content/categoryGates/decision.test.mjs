import assert from "node:assert/strict";
import test from "node:test";
import { getGateOutcome, getPairDecision } from "./decision.ts";

const unknown = { name: "Clockify", fails: false, note: "" };
const preliminary = {
  name: "Accelo",
  fails: true,
  note: "Takes too much daily effort",
};
const evidence = {
  sourceUrl: "https://example.com/source",
  sourceTitle: "Product documentation",
  attribution: "Vendor documentation, reviewed against this constraint",
  reviewedAt: "2026-10-20",
};

test("time-tracking legacy pass is unknown", () => {
  assert.equal(getGateOutcome("time-tracking-tools", unknown), "unknown");
});

test("time-tracking legacy failure note is only a preliminary concern", () => {
  assert.equal(
    getGateOutcome("time-tracking-tools", preliminary),
    "preliminary-concern"
  );
});

test("inferred legacy wins cannot prove suitability", () => {
  assert.equal(
    getGateOutcome("time-tracking-tools", { name: "Inferred winner", fails: false }),
    "unknown"
  );
});

test("two unknown tools produce no winner", () => {
  assert.equal(
    getPairDecision("time-tracking-tools", unknown, { ...unknown, name: "Toggl Track" }).winner,
    null
  );
});

test("a preliminary concern versus unknown produces no winner", () => {
  assert.equal(
    getPairDecision("time-tracking-tools", preliminary, unknown).winner,
    null
  );
});

test("verified outcomes require complete reviewable evidence", () => {
  assert.equal(
    getGateOutcome("time-tracking-tools", {
      ...unknown,
      assessment: {
        status: "verified-fit",
        validated: true,
        evidence: { ...evidence, sourceUrl: "" },
      },
    }),
    "unknown"
  );
  assert.equal(
    getGateOutcome("time-tracking-tools", {
      ...unknown,
      assessment: { status: "verified-fit", validated: false, evidence },
    }),
    "unknown"
  );
  assert.equal(
    getGateOutcome("time-tracking-tools", {
      ...unknown,
      assessment: { status: "verified-fit", validated: true, evidence },
    }),
    "verified-fit"
  );
});

test("complete verified fit versus concern can produce a winner", () => {
  const fit = {
    ...unknown,
    assessment: { status: "verified-fit", validated: true, evidence },
  };
  const concern = {
    ...preliminary,
    assessment: { status: "verified-concern", validated: true, evidence },
  };
  assert.equal(getPairDecision("time-tracking-tools", fit, concern).winner, "first");
});

test("other categories retain legacy boolean behavior", () => {
  assert.equal(getGateOutcome("task-managers", unknown), "verified-fit");
  assert.equal(getGateOutcome("task-managers", preliminary), "verified-concern");
  assert.equal(getPairDecision("task-managers", unknown, preliminary).winner, "first");
});
