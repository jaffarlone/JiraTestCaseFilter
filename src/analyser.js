// analyser.js
// Handles test case relevance analysis and classification logic
// Author: Jaffar Zahid Lone — Senior QA Engineer
// v3.1 — Added structural traceability: overlapping tests kept when they
//         cover distinct structural perspectives (error boundaries, exception
//         conditions, high-risk paths) even if functionally similar.

// ─────────────────────────────────────────────────────────────────
// DEPRECATED TECHNOLOGY LIST
// Add any legacy tech your project no longer uses
// ─────────────────────────────────────────────────────────────────

const DEPRECATED_TECH = [
  "flash",
  "internet explorer",
  " ie ",
  "twilio v1",
  "silverlight",
  "java applet",
  "jquery mobile",
  "angularjs 1.",
  "ie11",
  "ie10",
  "ie9",
];

// ─────────────────────────────────────────────────────────────────
// STRUCTURAL RISK SIGNALS
// Keywords that indicate a test covers a structural/risk perspective
// rather than a purely functional happy path
// ─────────────────────────────────────────────────────────────────

const STRUCTURAL_RISK_SIGNALS = [
  // Error boundary & exception conditions
  "invalid",
  "error",
  "exception",
  "fail",
  "failure",
  "boundary",
  "edge case",
  "negative",
  "unauthor",
  "forbidden",
  "reject",
  "denied",
  // High-risk structural paths
  "concurrent",
  "race condition",
  "timeout",
  "overflow",
  "null",
  "empty",
  "missing",
  "expired",
  "corrupt",
  "malformed",
  "injection",
  "xss",
  "sql",
  "security",
  // Performance and load structural tests
  "load",
  "stress",
  "spike",
  "volume",
  "maximum",
  "minimum",
  "limit",
];

// ─────────────────────────────────────────────────────────────────
// ANALYSE BATCH — Compare Against User Stories
// ─────────────────────────────────────────────────────────────────

export async function analyseTestCaseRelevance(testCases, userStories) {
  // Build keyword pool from all active user stories
  const storyKeywords = userStories.flatMap((s) =>
    s.title
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3) // ignore short words like "the", "can", "a"
  );

  // Track titles for duplicate detection
  const seenTitles = new Map();

  // Track functional groupings for structural overlap detection
  // Key: normalised functional area (e.g. "booking", "payment")
  // Value: array of test case IDs already classified as KEEP in that area
  const functionalGroups = new Map();

  const results = testCases.map((tc) => {
    const titleLower = tc.title.toLowerCase();
    const titleWords = titleLower
      .split(/\s+/)
      .filter((w) => w.length > 3);
    const year = parseInt(tc.last_updated.split("-")[0]);
    const overlap = titleWords.filter((w) => storyKeywords.includes(w));

    // ── Check 1: Deprecated Technology ──
    const isDeprecated = DEPRECATED_TECH.some((tech) =>
      titleLower.includes(tech)
    );

    // ── Check 2: Exact Duplicate Detection ──
    const normalised = titleLower.replace(/\s+/g, " ").trim();
    const isDuplicate = seenTitles.has(normalised);
    if (!isDuplicate) seenTitles.set(normalised, tc.id);

    // ── Check 3: Age + No Story Match ──
    const currentYear = new Date().getFullYear();
    const isOutdated = currentYear - year > 3 && overlap.length === 0;

    // ── Check 4: Structural Risk Signal ──
    // Detects whether this test covers a structural/risk perspective
    // (error boundaries, exception conditions, security, performance limits)
    // even if it overlaps functionally with another test case
    const hasStructuralSignal = STRUCTURAL_RISK_SIGNALS.some((signal) =>
      titleLower.includes(signal)
    );

    // Detect functional area from overlapping story keywords
    const functionalArea = overlap.slice(0, 2).join("_") || "general";

    // ── Classification Logic ──

    if (isDeprecated) {
      return {
        id: tc.id,
        title: tc.title,
        classification: "REMOVE",
        reason: "References deprecated technology — no longer relevant",
        confidence: "HIGH",
        structural_keep_reason: null,
      };
    }

    if (isDuplicate) {
      return {
        id: tc.id,
        title: tc.title,
        classification: "REMOVE",
        reason: `Exact duplicate of ${seenTitles.get(normalised)} — same scenario already covered`,
        confidence: "HIGH",
        structural_keep_reason: null,
      };
    }

    if (isOutdated) {
      return {
        id: tc.id,
        title: tc.title,
        classification: "ARCHIVE",
        reason: `Last updated ${tc.last_updated} — no matching active user story found`,
        confidence: "MEDIUM",
        structural_keep_reason: null,
      };
    }

    if (overlap.length >= 2) {
      // Check if another test in the same functional area is already KEEP
      const existingKeepInArea = functionalGroups.get(functionalArea);

      if (existingKeepInArea && hasStructuralSignal) {
        // Functionally overlapping BUT covers a distinct structural/risk
        // perspective — both should be kept, with explicit reason surfaced
        const structuralReason = buildStructuralKeepReason(titleLower);

        functionalGroups.set(functionalArea, [
          ...(functionalGroups.get(functionalArea) || []),
          tc.id,
        ]);

        return {
          id: tc.id,
          title: tc.title,
          classification: "KEEP",
          reason: `Maps to active user story — matching keywords: ${overlap.join(", ")}`,
          confidence: "HIGH",
          structural_keep_reason: structuralReason,
          note: `Functionally overlaps with ${existingKeepInArea[0]} but retained — covers a distinct structural/risk perspective. Reviewer: verify this addresses a unique error boundary or exception condition not covered by the other test.`,
        };
      } else {
        // First KEEP in this functional area — straightforward
        functionalGroups.set(functionalArea, [tc.id]);

        return {
          id: tc.id,
          title: tc.title,
          classification: "KEEP",
          reason: `Directly maps to active user story — matching keywords: ${overlap.join(", ")}`,
          confidence: "HIGH",
          structural_keep_reason: null,
        };
      }
    }

    if (overlap.length === 1) {
      return {
        id: tc.id,
        title: tc.title,
        classification: "UPDATE",
        reason: `Partially relevant — weak match on: ${overlap.join(", ")}. Needs review against current requirements`,
        confidence: "MEDIUM",
        structural_keep_reason: null,
      };
    }

    return {
      id: tc.id,
      title: tc.title,
      classification: "ARCHIVE",
      reason: "No matching user story found — candidate for archiving",
      confidence: "LOW",
      structural_keep_reason: null,
    };
  });

  return {
    status: "success",
    batch_size: testCases.length,
    results,
    summary: {
      keep: results.filter((r) => r.classification === "KEEP").length,
      archive: results.filter((r) => r.classification === "ARCHIVE").length,
      remove: results.filter((r) => r.classification === "REMOVE").length,
      update: results.filter((r) => r.classification === "UPDATE").length,
      structural_keeps: results.filter(
        (r) => r.classification === "KEEP" && r.structural_keep_reason
      ).length,
    },
  };
}

// ─────────────────────────────────────────────────────────────────
// BUILD STRUCTURAL KEEP REASON
// Generates a human-readable explanation of why a functionally
// overlapping test is still retained based on structural signals
// ─────────────────────────────────────────────────────────────────

function buildStructuralKeepReason(titleLower) {
  if (
    titleLower.includes("invalid") ||
    titleLower.includes("error") ||
    titleLower.includes("exception") ||
    titleLower.includes("fail")
  ) {
    return "STRUCTURAL_KEEP: Covers error boundary or exception condition — tests a failure path not covered by the functionally similar test. Both perspectives (success path + failure path) are required for complete coverage.";
  }

  if (
    titleLower.includes("unauthor") ||
    titleLower.includes("forbidden") ||
    titleLower.includes("denied") ||
    titleLower.includes("security") ||
    titleLower.includes("injection") ||
    titleLower.includes("xss")
  ) {
    return "STRUCTURAL_KEEP: Covers a security boundary condition — tests access control or injection risk that functional tests do not address. High-risk path warrants independent test case.";
  }

  if (
    titleLower.includes("concurrent") ||
    titleLower.includes("race") ||
    titleLower.includes("load") ||
    titleLower.includes("stress") ||
    titleLower.includes("volume")
  ) {
    return "STRUCTURAL_KEEP: Covers a performance or concurrency boundary — tests system behaviour under load or race conditions that functional tests cannot simulate.";
  }

  if (
    titleLower.includes("null") ||
    titleLower.includes("empty") ||
    titleLower.includes("missing") ||
    titleLower.includes("boundary") ||
    titleLower.includes("edge")
  ) {
    return "STRUCTURAL_KEEP: Covers a data boundary or edge case — tests behaviour with null, empty, or extreme values not exercised by the standard functional test.";
  }

  if (
    titleLower.includes("expired") ||
    titleLower.includes("timeout") ||
    titleLower.includes("corrupt") ||
    titleLower.includes("malformed")
  ) {
    return "STRUCTURAL_KEEP: Covers a data integrity or state boundary — tests behaviour with corrupted, expired, or malformed input that the functional test does not cover.";
  }

  return "STRUCTURAL_KEEP: Covers a distinct structural risk perspective from the functionally similar test. Reviewer should verify this addresses a unique error boundary, exception condition, or high-risk path before archiving.";
}

// ─────────────────────────────────────────────────────────────────
// CLASSIFY — Single Test Case
// ─────────────────────────────────────────────────────────────────

export async function classifyTestCase(
  testCaseId,
  testCaseTitle,
  classification,
  reason,
  linkedUserStory = null,
  structuralKeepReason = null
) {
  return {
    status: "classified",
    test_case_id: testCaseId,
    test_case_title: testCaseTitle,
    classification,
    reason,
    linked_user_story: linkedUserStory,
    structural_keep_reason: structuralKeepReason,
    classified_at: new Date().toISOString(),
  };
}