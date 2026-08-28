// reporter.js
// Generates cleanup reports in JSON and readable text format
// Author: Jaffar Zahid Lone — Senior QA Engineer

import fs from "fs";
import path from "path";

export async function generateCleanupReport(
  totalAnalysed,
  keep,
  archive,
  remove,
  update
) {
  const reductionPct = Math.round(
    ((archive.length + remove.length) / totalAnalysed) * 100
  );

  const timeSavedMins = (archive.length + remove.length) * 3;
  const timeSavedHours = Math.round(timeSavedMins / 60);

  const report = {
    generated_at: new Date().toISOString(),
    generated_by: "Jaffar Zahid Lone — QA Test Case Filter Agent",
    summary: {
      total_analysed: totalAnalysed,
      keep: keep.length,
      archive: archive.length,
      remove: remove.length,
      update: update.length,
      reduction_percentage: `${reductionPct}%`,
      estimated_manual_review_time_saved: `${timeSavedHours} hours`,
    },
    details: {
      keep,
      archive,
      remove,
      update,
    },
    recommendations: [
      "Move ARCHIVE test cases to a /legacy folder in TestRail",
      "Permanently delete REMOVE test cases after team sign-off",
      "Assign UPDATE test cases to QA engineers for rewriting this sprint",
      "Run this agent monthly to keep the test suite current",
      "Link all KEEP test cases to their corresponding Jira user stories",
    ],
    next_steps: {
      immediate: "Review REMOVE list with QA Lead before permanent deletion",
      this_sprint: "Rewrite all UPDATE test cases against current user stories",
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
  QA TEST CASE CLEANUP REPORT
  Generated: ${new Date().toLocaleString()}
  By: Jaffar Zahid Lone — QA Test Case Filter Agent
═══════════════════════════════════════════════════════════

SUMMARY
───────────────────────────────────────────────────────────
  Total Analysed          : ${totalAnalysed}
  Keep                 ✅ : ${keep.length}
  Archive              ⚠️  : ${archive.length}
  Remove               ❌ : ${remove.length}
  Update               🔄 : ${update.length}
  Suite Reduced           : ${reductionPct}%
  Manual Review Saved     : ~${timeSavedHours} hours

DETAILS
───────────────────────────────────────────────────────────
  KEEP (${keep.length}):
${keep.map((id) => `    ✅ ${id}`).join("\n")}

  ARCHIVE (${archive.length}):
${archive.map((id) => `    ⚠️  ${id}`).join("\n")}

  REMOVE (${remove.length}):
${remove.map((id) => `    ❌ ${id}`).join("\n")}

  UPDATE (${update.length}):
${update.map((id) => `    🔄 ${id}`).join("\n")}

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
