// agent.test.js
// Basic tests for the Test Case Filter Agent
// Author: Jaffar Zahid Lone — Senior QA Engineer

import { analyseTestCaseRelevance, classifyTestCase } from "../src/analyser.js";

// ─────────────────────────────────────────
// TEST DATA
// ─────────────────────────────────────────

const mockUserStories = [
  {
    id: "EH-101",
    title: "Patient can book appointment online",
    status: "Active",
  },
  {
    id: "EH-102",
    title: "Doctor can view patient history",
    status: "Active",
  },
];

const mockTestCases = [
  {
    id: "TC-001",
    title: "Verify patient can book appointment",
    module: "Appointments",
    last_updated: "2024-01-15",
    steps: "1. Go to booking 2. Select doctor 3. Confirm",
  },
  {
    id: "TC-002",
    title: "Verify Flash UI booking flow",
    module: "Flash UI",
    last_updated: "2019-03-10",
    steps: "1. Open Flash 2. Book",
  },
  {
    id: "TC-003",
    title: "Verify old payment gateway v1",
    module: "Payments",
    last_updated: "2017-05-20",
    steps: "1. Go to payment 2. Submit",
  },
];

// ─────────────────────────────────────────
// SIMPLE TEST RUNNER
// ─────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   ${error.message}`);
    failed++;
  }
}

function expect(value) {
  return {
    toBe: (expected) => {
      if (value !== expected)
        throw new Error(`Expected ${expected} but got ${value}`);
    },
    toContain: (expected) => {
      if (!value.includes(expected))
        throw new Error(`Expected "${value}" to contain "${expected}"`);
    },
    toBeGreaterThan: (expected) => {
      if (value <= expected)
        throw new Error(`Expected ${value} to be greater than ${expected}`);
    },
  };
}

// ─────────────────────────────────────────
// RUN TESTS
// ─────────────────────────────────────────

async function runTests() {
  console.log(`\n${"=".repeat(50)}`);
  console.log("  🧪 RUNNING AGENT TESTS");
  console.log(`${"=".repeat(50)}\n`);

  // Test 1 — Analyse returns correct number of results
  const result = await analyseTestCaseRelevance(
    mockTestCases,
    mockUserStories
  );

  test("Analyse returns results for all test cases", () => {
    expect(result.results.length).toBe(mockTestCases.length);
  });

  // Test 2 — Flash UI detected as deprecated
  test("Flash UI test case classified as REMOVE", () => {
    const flashResult = result.results.find((r) => r.id === "TC-002");
    expect(flashResult.classification).toBe("REMOVE");
  });

  // Test 3 — Active appointment test kept
  test("Active appointment test case classified as KEEP", () => {
    const keepResult = result.results.find((r) => r.id === "TC-001");
    expect(keepResult.classification).toBe("KEEP");
  });

  // Test 4 — Old test with no story match archived
  test("Old test case with no story match classified as ARCHIVE", () => {
    const archiveResult = result.results.find((r) => r.id === "TC-003");
    expect(["ARCHIVE", "REMOVE"]).toContain(archiveResult.classification);
  });

  // Test 5 — Classification function works
  test("classifyTestCase returns correct structure", async () => {
    const classified = await classifyTestCase(
      "TC-001",
      "Test title",
      "KEEP",
      "Maps to active story",
      "EH-101"
    );
    expect(classified.status).toBe("classified");
    expect(classified.classification).toBe("KEEP");
  });

  // Test 6 — Summary counts are correct
  test("Summary total matches results length", () => {
    const total =
      result.summary.keep +
      result.summary.archive +
      result.summary.remove +
      result.summary.update;
    expect(total).toBe(mockTestCases.length);
  });

  console.log(`\n${"─".repeat(50)}`);
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log(`${"─".repeat(50)}\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch(console.error);
