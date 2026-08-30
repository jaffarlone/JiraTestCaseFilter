// reporter.js
// Generates cleanup reports in JSON and readable text format
// Author: Jaffar Zahid Lone — Senior QA Engineer
// v2.0 — Added confidence scoring and historical override reporting

import fs from "fs";
import path from "path";

export async function generateCleanupReport(
  totalAnalysed,
  keep,
  archive,
  remove,
  update,
  humanReview = [],
  historicalOverrides = []
) {
  const reductionPct = Math.round(
    ((archive.length + remove.length) / totalAnalysed) * 100
  );

  const timeSavedMins = (archive.length + remove.length) * 3;
  const timeSavedHours = Math.round(timeSavedMins / 60);

  const report = {
    generated_at: new Date().toISOString(),
    generated_by: "Jaffar Zahid Lone — QA Test Case Filter Agent v2.0",
    summary: {
      total_analysed: totalAnalysed,
      keep: keep.length,
      archive: archive.length,
      remove: remove.length,
      update: update.length,
      reduction_percentage: `${reductionPct}%`,
      estimated_manual_review_time_saved: `${timeSavedHours} hours`,
      confidence_layer: {
        auto_actioned: totalAnalysed - humanReview.length,
        flagged_for_human_review: humanReview.length,
        historical_keep_overrides: historicalOverrides.length,
      },
    },
    details: {
      keep,
      archive,
      remove,
      update,
      human_review_required: humanReview,
      historical_overrides: historicalOverrides,
    },
    recommendations: [
      "Review HUMAN REVIEW list before any action is taken — agent confidence was low",
      "Historical override test cases are protected — do not archive or remove without QA Lead approval",
      "Move ARCHIVE test cases to a /legacy folder in TestRail",
      "Permanently delete REMOVE test cases after team sign-off",
      "Assign UPDATE test cases to QA engineers for rewriting this sprint",
      "Run this agent monthly to keep the test suite current",
      "Link all KEEP test cases to their corresponding Jira user stories",
    ],
    next_steps: {
      immediate: "Review HUMAN REVIEW list with QA Lead — these need a human decision",
      this_sprint: "Rewrite all UPDATE test cases against current user stories",
      protect: "Never remove HISTORICAL OVERRIDE test cases without checking defect history",
      ongoing: "Schedule monthly agent runs to maintain suite hygiene",
    },
  };

  // Save JSON report
  const reportsDir = path.join(process.cwd(), "reports");
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

  const timestamp = Date.now();
  const jsonPath = path.join(reportsDir, `cleanup_report_${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  // Save readable text report
  const textReport = `
═══════════════════════════════════════════════════════════
  QA TEST CASE CLEANUP REPORT — v2.0
  Generated : ${new Date().toLocaleString()}
  By        : Jaffar Zahid Lone — QA Test Case Filter Agent
═══════════════════════════════════════════════════════════

SUMMARY
───────────────────────────────────────────────────────────
  Total Analysed              : ${totalAnalysed}
  Keep                     ✅ : ${keep.length}
  Archive                  ⚠️  : ${archive.length}
  Remove                   ❌ : ${remove.length}
  Update                   🔄 : ${update.length}
  Suite Reduced               : ${reductionPct}%
  Manual Review Saved         : ~${timeSavedHours} hours

CONFIDENCE LAYER
───────────────────────────────────────────────────────────
  Auto-Actioned               : ${totalAnalysed - humanReview.length}
  Flagged for Human Review 👤 : ${humanReview.length}
  Historical KEEP Overrides 🏆: ${historicalOverrides.length}

DETAILS
───────────────────────────────────────────────────────────
  KEEP (${keep.length}):
${keep.map((id) => `    ✅ ${id}`).join("\n") || "    None"}

  ARCHIVE (${archive.length}):
${archive.map((id) => `    ⚠️  ${id}`).join("\n") || "    None"}

  REMOVE (${remove.length}):
${remove.map((id) => `    ❌ ${id}`).join("\n") || "    None"}

  UPDATE (${update.length}):
${update.map((id) => `    🔄 ${id}`).join("\n") || "    None"}

HISTORICAL KEEP OVERRIDES 🏆
───────────────────────────────────────────────────────────
  These test cases caught real production bugs in the last
  12 months. They are protected regardless of story mapping.
  DO NOT remove without QA Lead approval.

${historicalOverrides.map((id) => `    🏆 ${id}`).join("\n") || "    None"}

FLAGGED FOR HUMAN REVIEW 👤
───────────────────────────────────────────────────────────
  Agent confidence was LOW on these classifications.
  A QA engineer must review these before any action is taken.
  The agent recommends but does NOT action these automatically.

${humanReview.map((id) => `    👤 ${id}`).join("\n") || "    None"}

RECOMMENDATIONS
───────────────────────────────────────────────────────────
${report.recommendations.map((r) => `  • ${r}`).join("\n")}

═══════════════════════════════════════════════════════════
`;

  const textPath = path.join(reportsDir, `cleanup_report_${timestamp}.txt`);
  fs.writeFileSync(textPath, textReport);

  // Print to console
  console.log(textReport);
  console.log(`📄 JSON report saved : ${jsonPath}`);
  console.log(`📄 Text report saved : ${textPath}`);

  return report;
}
