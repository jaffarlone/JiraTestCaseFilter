// analyser.js
// Handles test case relevance analysis and classification logic
// Author: Jaffar Zahid Lone — Senior QA Engineer
// v2.0 — Added confidence scoring layer and historical context module

// ─────────────────────────────────────────
// CONFIDENCE THRESHOLDS
// Classifications below LOW_CONFIDENCE_THRESHOLD
// are flagged for human review instead of actioned automatically
// ─────────────────────────────────────────

const CONFIDENCE_SCORES = {
  HIGH: 3,    // Agent is certain — action automatically
  MEDIUM: 2,  // Agent is fairly sure — action with note
  LOW: 1,     // Agent is uncertain — flag for human review
};

const LOW_CONFIDENCE_THRESHOLD = CONFIDENCE_SCORES.LOW;

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
// HISTORICAL CONTEXT MODULE
// If a test case caught a production bug in the
// last 12 months it gets a KEEP override regardless
// of story mapping — past failure value is a strong signal
// ─────────────────────────────────────────

export async function getDefectHistory(projectKey) {
  // ── REAL IMPLEMENTATION ──
  // Uncomment when connected to real Jira:
  //
  // const twelveMonthsAgo = new Date();
  // twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  //
  // const jql = `project=${projectKey}
  //   AND issuetype=Bug
  //   AND status=Done
  //   AND resolved >= "${twelveMonthsAgo.toISOString().split('T')[0]}"`;
  //
  // const url = `${process.env.JIRA_BASE_URL}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=1000`;
  // const credentials = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_TOKEN}`).toString("base64");
  //
  // const response = await fetch(url, {
  //   headers: { Authorization: `Basic ${credentials}` }
  // });
  //
  // const data = await response.json();
  // return data.issues.map(issue => ({
  //   bugId: issue.key,
  //   title: issue.fields.summary,
  //   resolvedDate: issue.fields.resolutiondate,
  //   linkedTestCases: issue.fields.customfield_testcases || [],
  // }));

  // ── MOCK DATA (remove when using real Jira) ──
  return [
    {
      bugId: "BUG-441",
      title: "Doctor patient history not loading correctly",
      resolvedDate: "2025-11-15",
      linkedTestCases: ["TC-003"],
    },
    {
      bugId: "BUG-389",
      title: "Billing report export failing for large datasets",
      resolvedDate: "2025-09-22",
      linkedTestCases: ["TC-005", "TC-010"],
    },
    {
      bugId: "BUG-512",
      title: "Appointment confirmation email not sent",
      resolvedDate: "2026-01-10",
      linkedTestCases: ["TC-006"],
    },
  ];
}

function buildHistoricalKeepSet(defectHistory) {
  // Build a set of test case IDs that caught real bugs in the last 12 months
  const keepSet = new Set();
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  defectHistory.forEach((defect) => {
    const resolvedDate = new Date(defect.resolvedDate);
    if (resolvedDate >= twelveMonthsAgo) {
      defect.linkedTestCases.forEach((tcId) => keepSet.add(tcId));
    }
  });

  return keepSet;
}

// ─────────────────────────────────────────
// CONFIDENCE SCORING LAYER
// Evaluates how confident the agent is in its classification
// Low confidence → flagged for human review
// ─────────────────────────────────────────

function calculateConfidence(factors) {
  const {
    isDeprecated,
    isDuplicate,
    isOutdated,
    overlapCount,
    hasHistoricalValue,
    yearAge,
  } = factors;

  // High confidence scenarios — agent is certain
  if (isDeprecated) return "HIGH";
  if (isDuplicate) return "HIGH";
  if (hasHistoricalValue) return "HIGH";
  if (overlapCount >= 3) return "HIGH";

  // Medium confidence scenarios — agent is fairly sure
  if (overlapCount === 2) return "MEDIUM";
  if (isOutdated && overlapCount === 0) return "MEDIUM";
  if (overlapCount === 1 && yearAge <= 2) return "MEDIUM";

  // Low confidence — flag for human review
  return "LOW";
}

// ─────────────────────────────────────────
// ANALYSE BATCH — Compare Against User Stories
// ─────────────────────────────────────────

export async function analyseTestCaseRelevance(
  testCases,
  userStories,
  defectHistory = []
) {
  // Build keyword pool from all active user stories
  const storyKeywords = userStories.flatMap((s) =>
    s.title
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );

  // Build historical keep set from defect history
  const historicalKeepSet = buildHistoricalKeepSet(defectHistory);

  // Track titles for duplicate detection
  const seenTitles = new Map();

  const currentYear = new Date().getFullYear();

  const results = testCases.map((tc) => {
    const titleLower = tc.title.toLowerCase();
    const titleWords = titleLower.split(/\s+/).filter((w) => w.length > 3);
    const year = parseInt(tc.last_updated.split("-")[0]);
    const yearAge = currentYear - year;
    const overlap = titleWords.filter((w) => storyKeywords.includes(w));

    // ── Check 1: Historical Value Override ──
    // If this test caught a real bug in the last 12 months
    // it gets an unconditional KEEP regardless of story mapping
    const hasHistoricalValue = historicalKeepSet.has(tc.id);
    if (hasHistoricalValue) {
      return {
        id: tc.id,
        title: tc.title,
        classification: "KEEP",
        confidence: "HIGH",
        override: "HISTORICAL_VALUE",
        reason: `KEEP OVERRIDE — This test case caught a production bug in the last 12 months. Historical failure value overrides story mapping check.`,
        requires_human_review: false,
      };
    }

    // ── Check 2: Deprecated Technology ──
    const isDeprecated = DEPRECATED_TECH.some((tech) =>
      titleLower.includes(tech)
    );

    // ── Check 3: Duplicate Detection ──
    const normalised = titleLower.replace(/\s+/g, " ").trim();
    const isDuplicate = seenTitles.has(normalised);
    if (!isDuplicate) seenTitles.set(normalised, tc.id);

    // ── Check 4: Age + No Story Match ──
    const isOutdated = yearAge > 3 && overlap.length === 0;

    // ── Calculate Confidence Score ──
    const confidence = calculateConfidence({
      isDeprecated,
      isDuplicate,
      isOutdated,
      overlapCount: overlap.length,
      hasHistoricalValue,
      yearAge,
    });

    const requiresHumanReview =
      CONFIDENCE_SCORES[confidence] <= LOW_CONFIDENCE_THRESHOLD;

    // ── Classification Logic ──
    if (isDeprecated) {
      return {
        id: tc.id,
        title: tc.title,
        classification: "REMOVE",
        confidence,
        reason: "References deprecated technology — no longer relevant",
        requires_human_review: requiresHumanReview,
      };
    }

    if (isDuplicate) {
      return {
        id: tc.id,
        title: tc.title,
        classification: "REMOVE",
        confidence,
        reason: `Duplicate of ${seenTitles.get(normalised)} — same scenario already covered`,
        requires_human_review: requiresHumanReview,
      };
    }

    if (isOutdated) {
      return {
        id: tc.id,
        title: tc.title,
        classification: "ARCHIVE",
        confidence,
        reason: `Last updated ${tc.last_updated} — no matching active user story found`,
        requires_human_review: requiresHumanReview,
      };
    }

    if (overlap.length >= 2) {
      return {
        id: tc.id,
        title: tc.title,
        classification: "KEEP",
        confidence,
        reason: `Directly maps to active user story — matching keywords: ${overlap.join(", ")}`,
        requires_human_review: requiresHumanReview,
      };
    }

    if (overlap.length === 1) {
      return {
        id: tc.id,
        title: tc.title,
        classification: "UPDATE",
        confidence,
        reason: `Partially relevant — weak match on: ${overlap.join(", ")}. Needs review against current requirements`,
        requires_human_review: requiresHumanReview,
      };
    }

    // Low confidence — no story match, not outdated enough to archive confidently
    return {
      id: tc.id,
      title: tc.title,
      classification: "ARCHIVE",
      confidence: "LOW",
      reason: "No matching user story found — low confidence, flagged for human review",
      requires_human_review: true,
    };
  });

  // Separate high confidence from low confidence results
  const humanReviewRequired = results.filter((r) => r.requires_human_review);
  const actionable = results.filter((r) => !r.requires_human_review);

  return {
    status: "success",
    batch_size: testCases.length,
    results,
    summary: {
      keep: results.filter((r) => r.classification === "KEEP").length,
      archive: results.filter((r) => r.classification === "ARCHIVE").length,
      remove: results.filter((r) => r.classification === "REMOVE").length,
      update: results.filter((r) => r.classification === "UPDATE").length,
      historical_overrides: results.filter((r) => r.override === "HISTORICAL_VALUE").length,
      requires_human_review: humanReviewRequired.length,
      auto_actionable: actionable.length,
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
