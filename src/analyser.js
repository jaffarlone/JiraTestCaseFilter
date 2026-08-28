// analyser.js
// Handles test case relevance analysis and classification logic
// Author: Jaffar Zahid Lone — Senior QA Engineer

// ─────────────────────────────────────────
// DEPRECATED TECHNOLOGY LIST
// Add any legacy tech your project no longer uses
// ─────────────────────────────────────────

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

// ─────────────────────────────────────────
// ANALYSE BATCH — Compare Against User Stories
// ─────────────────────────────────────────

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

    // ── Check 2: Duplicate Detection ──
    const normalised = titleLower.replace(/\s+/g, " ").trim();
    const isDuplicate = seenTitles.has(normalised);
    if (!isDuplicate) seenTitles.set(normalised, tc.id);

    // ── Check 3: Age + No Story Match ──
    const currentYear = new Date().getFullYear();
    const isOutdated = currentYear - year > 3 && overlap.length === 0;

    // ── Classification Logic ──
    if (isDeprecated) {
      return {
        id: tc.id,
        title: tc.title,
        classification: "REMOVE",
        reason: `References deprecated technology — no longer relevant`,
        confidence: "HIGH",
      };
    }

    if (isDuplicate) {
      return {
        id: tc.id,
        title: tc.title,
        classification: "REMOVE",
        reason: `Duplicate of ${seenTitles.get(normalised)} — same scenario already covered`,
        confidence: "HIGH",
      };
    }

    if (isOutdated) {
      return {
        id: tc.id,
        title: tc.title,
        classification: "ARCHIVE",
        reason: `Last updated ${tc.last_updated} — no matching active user story found`,
        confidence: "MEDIUM",
      };
    }

    if (overlap.length >= 2) {
      return {
        id: tc.id,
        title: tc.title,
        classification: "KEEP",
        reason: `Directly maps to active user story — matching keywords: ${overlap.join(", ")}`,
        confidence: "HIGH",
      };
    }

    if (overlap.length === 1) {
      return {
        id: tc.id,
        title: tc.title,
        classification: "UPDATE",
        reason: `Partially relevant — weak match on: ${overlap.join(", ")}. Needs review against current requirements`,
        confidence: "MEDIUM",
      };
    }

    return {
      id: tc.id,
      title: tc.title,
      classification: "ARCHIVE",
      reason: "No matching user story found — candidate for archiving",
      confidence: "LOW",
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
    },
  };
}

// ─────────────────────────────────────────
// CLASSIFY — Single Test Case
// ─────────────────────────────────────────

export async function classifyTestCase(
  testCaseId,
  testCaseTitle,
  classification,
  reason,
  linkedUserStory = null
) {
  return {
    status: "classified",
    test_case_id: testCaseId,
    test_case_title: testCaseTitle,
    classification,
    reason,
    linked_user_story: linkedUserStory,
    classified_at: new Date().toISOString(),
  };
}
