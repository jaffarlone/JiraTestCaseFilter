// jiraClient.js
// Handles all Jira and TestRail API communication
// Author: Jaffar Zahid Lone — Senior QA Engineer

import dotenv from "dotenv";
dotenv.config();

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_TOKEN = process.env.JIRA_TOKEN;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const TESTRAIL_BASE_URL = process.env.TESTRAIL_BASE_URL;
const TESTRAIL_EMAIL = process.env.TESTRAIL_EMAIL;
const TESTRAIL_TOKEN = process.env.TESTRAIL_TOKEN;
const TESTRAIL_SUITE_ID = process.env.TESTRAIL_SUITE_ID;

// ─────────────────────────────────────────
// JIRA — Fetch Active User Stories
// ─────────────────────────────────────────

export async function getJiraUserStories(projectKey, status = "Active") {
  // ── REAL IMPLEMENTATION ──
  // Uncomment when connected to real Jira:
  //
  // const jql = `project=${projectKey} AND issuetype=Story AND status="${status}"`;
  // const url = `${JIRA_BASE_URL}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=1000`;
  // const credentials = Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString("base64");
  //
  // const response = await fetch(url, {
  //   headers: {
  //     Authorization: `Basic ${credentials}`,
  //     "Content-Type": "application/json",
  //   },
  // });
  //
  // const data = await response.json();
  // return {
  //   status: "success",
  //   project: projectKey,
  //   total_stories: data.total,
  //   user_stories: data.issues.map((issue) => ({
  //     id: issue.key,
  //     title: issue.fields.summary,
  //     status: issue.fields.status.name,
  //     description: issue.fields.description,
  //   })),
  // };

  // ── MOCK DATA (remove when using real Jira) ──
  return {
    status: "success",
    project: projectKey,
    total_stories: 4,
    user_stories: [
      {
        id: `${projectKey}-101`,
        title: "Patient can book appointment online",
        status: "Active",
        description:
          "As a patient I want to book a doctor appointment online so that I can schedule consultations easily",
      },
      {
        id: `${projectKey}-102`,
        title: "Doctor can view patient history",
        status: "Active",
        description:
          "As a doctor I want to view complete patient medical history so that I can make informed decisions",
      },
      {
        id: `${projectKey}-103`,
        title: "Admin can generate billing report",
        status: "Active",
        description:
          "As an admin I want to generate monthly billing reports so that I can track revenue",
      },
      {
        id: `${projectKey}-104`,
        title: "Patient receives appointment confirmation",
        status: "Active",
        description:
          "As a patient I want to receive email confirmation after booking so that I have a record",
      },
    ],
  };
}

// ─────────────────────────────────────────
// TESTRAIL — Fetch Test Cases in Batches
// ─────────────────────────────────────────

export async function getTestCasesBatch(
  batchNumber,
  totalBatches,
  batchSize = 100
) {
  // ── REAL IMPLEMENTATION ──
  // Uncomment when connected to real TestRail:
  //
  // const offset = batchNumber * batchSize;
  // const url = `${TESTRAIL_BASE_URL}/index.php?/api/v2/get_cases/${TESTRAIL_SUITE_ID}&limit=${batchSize}&offset=${offset}`;
  // const credentials = Buffer.from(`${TESTRAIL_EMAIL}:${TESTRAIL_TOKEN}`).toString("base64");
  //
  // const response = await fetch(url, {
  //   headers: {
  //     Authorization: `Basic ${credentials}`,
  //     "Content-Type": "application/json",
  //   },
  // });
  //
  // const data = await response.json();
  // return {
  //   status: "success",
  //   batch: batchNumber,
  //   total_batches: totalBatches,
  //   test_cases: data.cases.map((tc) => ({
  //     id: `TC-${tc.id}`,
  //     title: tc.title,
  //     module: tc.section?.name || "Unknown",
  //     last_updated: new Date(tc.updated_on * 1000).toISOString().split("T")[0],
  //     steps: tc.custom_steps || "",
  //   })),
  // };

  // ── MOCK DATA (remove when using real TestRail) ──
  const batches = {
    1: [
      {
        id: "TC-001",
        title: "Verify patient can book appointment",
        module: "Appointments",
        last_updated: "2024-01-15",
        steps: "1. Go to booking 2. Select doctor 3. Choose slot 4. Confirm",
      },
      {
        id: "TC-002",
        title: "Verify Flash UI booking flow",
        module: "Flash UI",
        last_updated: "2019-03-10",
        steps: "1. Open Flash UI 2. Click book 3. Submit",
      },
      {
        id: "TC-003",
        title: "Verify doctor views patient history",
        module: "Patient Records",
        last_updated: "2024-02-20",
        steps: "1. Login as doctor 2. Search patient 3. View history",
      },
      {
        id: "TC-004",
        title: "Verify SMS via old Twilio v1 API",
        module: "Notifications",
        last_updated: "2018-06-05",
        steps: "1. Book appointment 2. Check SMS via Twilio v1",
      },
      {
        id: "TC-005",
        title: "Verify billing report generation",
        module: "Admin",
        last_updated: "2024-03-01",
        steps: "1. Login admin 2. Go to reports 3. Generate billing",
      },
    ],
    2: [
      {
        id: "TC-006",
        title: "Verify appointment email confirmation",
        module: "Notifications",
        last_updated: "2024-01-20",
        steps: "1. Book appointment 2. Check email confirmation received",
      },
      {
        id: "TC-007",
        title: "Verify Internet Explorer compatibility",
        module: "Browser Compatibility",
        last_updated: "2017-08-12",
        steps: "1. Open IE 2. Navigate to app 3. Test booking",
      },
      {
        id: "TC-008",
        title: "Verify patient can book appointment",
        module: "Appointments",
        last_updated: "2023-11-05",
        steps: "1. Go to booking 2. Select doctor 3. Book",
      },
      {
        id: "TC-009",
        title: "Verify doctor edits patient notes",
        module: "Patient Records",
        last_updated: "2024-02-28",
        steps: "1. Login doctor 2. Open patient 3. Edit notes 4. Save",
      },
      {
        id: "TC-010",
        title: "Verify admin monthly billing PDF export",
        module: "Admin",
        last_updated: "2024-03-10",
        steps: "1. Login admin 2. Reports 3. Export PDF",
      },
    ],
  };

  return {
    status: "success",
    batch: batchNumber,
    total_batches: totalBatches,
    test_cases: batches[batchNumber] || [],
  };
}
