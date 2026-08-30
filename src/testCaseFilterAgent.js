// testCaseFilterAgent.js
// AI Agent that scans Jira user stories and filters legacy test cases
// Built with Claude API
// Author: Jaffar Zahid Lone — Senior QA Engineer
// Run with: node src/testCaseFilterAgent.js

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { getJiraUserStories, getTestCasesBatch } from "./jiraClient.js";
import { analyseTestCaseRelevance, classifyTestCase, getDefectHistory } from "./analyser.js";
import { generateCleanupReport } from "./reporter.js";

const client = new Anthropic();

// ─────────────────────────────────────────
// TOOLS
// ─────────────────────────────────────────

const tools = [
  {
    name: "get_jira_user_stories",
    description:
      "Fetches all active user stories from Jira for the current product version.",
    input_schema: {
      type: "object",
      properties: {
        project_key: {
          type: "string",
          description: "Jira project key e.g. EH for EonHealth",
        },
        status: {
          type: "string",
          description: "Filter by status",
          enum: ["Active", "Done", "In Progress", "All"],
        },
      },
      required: ["project_key"],
    },
  },
  {
    name: "get_test_cases_batch",
    description:
      "Fetches a batch of manual test cases from TestRail for analysis.",
    input_schema: {
      type: "object",
      properties: {
        batch_number: {
          type: "number",
          description: "Batch number to fetch — processes 100 at a time",
        },
        total_batches: {
          type: "number",
          description: "Total number of batches to process",
        },
      },
      required: ["batch_number", "total_batches"],
    },
  },
  {
    name: "analyse_test_case_relevance",
    description:
      "Analyses a batch of test cases against current user stories and classifies each one.",
    input_schema: {
      type: "object",
      properties: {
        test_cases: {
          type: "array",
          items: { type: "object" },
          description: "List of test cases to analyse",
        },
        user_stories: {
          type: "array",
          items: { type: "object" },
          description: "Current active user stories to compare against",
        },
      },
      required: ["test_cases", "user_stories"],
    },
  },
  {
    name: "classify_test_case",
    description:
      "Classifies a single test case as Keep, Archive, Remove, or Update.",
    input_schema: {
      type: "object",
      properties: {
        test_case_id: {
          type: "string",
          description: "Unique ID of the test case",
        },
        test_case_title: {
          type: "string",
          description: "Title of the test case",
        },
        classification: {
          type: "string",
          enum: ["KEEP", "ARCHIVE", "REMOVE", "UPDATE"],
          description: "Classification decision",
        },
        reason: {
          type: "string",
          description: "Reason for the classification",
        },
        linked_user_story: {
          type: "string",
          description: "The user story this test case maps to if relevant",
        },
      },
      required: [
        "test_case_id",
        "test_case_title",
        "classification",
        "reason",
      ],
    },
  },
  {
    name: "generate_cleanup_report",
    description:
      "Generates a full cleanup report showing what to keep, archive, remove, and update.",
    input_schema: {
      type: "object",
      properties: {
        total_analysed: {
          type: "number",
          description: "Total test cases analysed",
        },
        keep: {
          type: "array",
          items: { type: "string" },
          description: "Test case IDs to keep",
        },
        archive: {
          type: "array",
          items: { type: "string" },
          description: "Test case IDs to archive",
        },
        remove: {
          type: "array",
          items: { type: "string" },
          description: "Test case IDs to remove",
        },
        update: {
          type: "array",
          items: { type: "string" },
          description: "Test case IDs that need updating",
        },
      },
      required: ["total_analysed", "keep", "archive", "remove", "update"],
    },
  },
];

// ─────────────────────────────────────────
// TOOL DISPATCHER
// ─────────────────────────────────────────

async function runTool(name, input) {
  switch (name) {
    case "get_jira_user_stories":
      return await getJiraUserStories(input.project_key, input.status);
    case "get_test_cases_batch":
      return await getTestCasesBatch(input.batch_number, input.total_batches);
    case "analyse_test_case_relevance":
      return await analyseTestCaseRelevance(
        input.test_cases,
        input.user_stories
      );
    case "classify_test_case":
      return await classifyTestCase(
        input.test_case_id,
        input.test_case_title,
        input.classification,
        input.reason,
        input.linked_user_story
      );
    case "generate_cleanup_report":
      return await generateCleanupReport(
        input.total_analysed,
        input.keep,
        input.archive,
        input.remove,
        input.update
      );
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ─────────────────────────────────────────
// MAIN AGENT LOOP
// ─────────────────────────────────────────

export async function runTestCaseFilterAgent(
  projectKey,
  totalTestCases = 5000
) {
  const totalBatches = Math.ceil(totalTestCases / 100);

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  🤖 TEST CASE FILTER AGENT STARTED`);
  console.log(`  Project       : ${projectKey}`);
  console.log(`  Test Cases    : ${totalTestCases}`);
  console.log(`  Batch Size    : 100 per batch`);
  console.log(`  Total Batches : ${totalBatches}`);
  console.log(`${"=".repeat(60)}\n`);

  // Fetch defect history upfront for historical context module
  console.log("📋 Fetching defect history for historical context analysis...");
  const defectHistory = await getDefectHistory(projectKey);
  console.log(`   Found ${defectHistory.length} resolved bugs in the last 12 months\n`);

  const messages = [
    {
      role: "user",
      content: `You are an intelligent QA cleanup agent — v2.0 with confidence scoring and historical context.

The project has ${totalTestCases} manual test cases accumulated over many years.
Many are obsolete, duplicated, or no longer relevant to current functionality.

Defect history loaded: ${defectHistory.length} bugs resolved in the last 12 months.
Test cases linked to these bugs will receive a KEEP override regardless of story mapping.

Your job:
1. Fetch all active user stories from Jira for project ${projectKey}
2. Fetch test cases in batches (process first 2 batches for this demo)
3. For each batch — analyse relevance against current user stories using the defect history context
4. Classify each test case as:
   - KEEP — directly maps to an active user story OR caught a production bug in last 12 months
   - ARCHIVE — was valid but feature no longer active or too old
   - REMOVE — obsolete, deprecated technology, or duplicate
   - UPDATE — partially relevant but needs rewriting
5. Apply confidence scoring — flag LOW confidence classifications for human review
6. Generate a final cleanup report including human review list and historical overrides

Classification rules:
- Historical value override → KEEP unconditionally (HIGH confidence)
- Deprecated technology → REMOVE (HIGH confidence)
- Duplicate test case → REMOVE (HIGH confidence)
- 3+ years old, no story match → ARCHIVE (MEDIUM confidence)
- Strong story keyword match (2+) → KEEP (HIGH/MEDIUM confidence)
- Weak story match (1 keyword) → UPDATE (MEDIUM confidence)
- No match, not clearly outdated → ARCHIVE but flag for HUMAN REVIEW (LOW confidence)

Begin now. Process 2 batches and generate the full cleanup report.`,
    },
  ];

  let turn = 0;

  while (true) {
    turn++;
    console.log(`\n--- Agent Turn ${turn} ---`);

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      tools,
      messages,
    });

    console.log(`Stop reason: ${response.stop_reason}`);

    if (response.stop_reason === "end_turn") {
      const finalText = response.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");

      console.log(`\n${"=".repeat(60)}`);
      console.log(`✅ AGENT COMPLETE`);
      console.log(`${"=".repeat(60)}`);
      console.log(finalText);
      break;
    }

    if (response.stop_reason === "tool_use") {
      const toolResults = [];

      for (const block of response.content) {
        if (block.type === "tool_use") {
          console.log(`🔧 Tool: ${block.name}`);

          try {
            const result = await runTool(block.name, block.input);
            const status =
              result.status || result.classification || "done";
            console.log(`   Result: ${status} ✅`);

            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: JSON.stringify(result),
            });
          } catch (error) {
            console.log(`   Error: ${error.message} ❌`);
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: JSON.stringify({ error: error.message }),
              is_error: true,
            });
          }
        }
      }

      messages.push({ role: "assistant", content: response.content });
      messages.push({ role: "user", content: toolResults });
    }
  }
}

// Run directly
runTestCaseFilterAgent("EH", 5000).catch(console.error);
