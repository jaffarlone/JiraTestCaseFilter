# 🤖 Jira Test Case Filter Agent

An AI-powered agent built with the **Claude API** that intelligently scans your Jira user stories and filters thousands of legacy manual test cases — automatically classifying each one as Keep, Archive, Remove, or Update.

**Author:** Jaffar Zahid Lone — Senior QA Engineer | 24+ Years Experience  
**Built with:** Claude API (Anthropic) | Node.js | Jira REST API | TestRail API

---

## 🎯 The Problem

Over the years QA teams accumulate thousands of manual test cases. Many become:
- **Obsolete** — features no longer exist
- **Outdated** — written for deprecated technologies (Flash, IE, old APIs)
- **Duplicated** — same scenario covered multiple times
- **Unmapped** — no longer tied to any active user story

Manually reviewing 5000+ test cases takes weeks. This agent does it in minutes.

---

## ✅ The Solution

The agent:
1. **Fetches all active user stories** from Jira
2. **Processes test cases in batches** of 100 from TestRail
3. **Analyses relevance** of each test case against current user stories
4. **Classifies each test case** using AI-powered decision logic
5. **Generates a full cleanup report** with recommendations

---

## 📊 Classification Logic

| Classification | Criteria | Action |
|---|---|---|
| ✅ **KEEP** | Directly maps to an active Jira user story | Leave as is — link to story |
| ⚠️ **ARCHIVE** | Was valid but feature no longer active or 3+ years old with no match | Move to /legacy folder |
| ❌ **REMOVE** | Deprecated technology, duplicate, or completely irrelevant | Delete after team sign-off |
| 🔄 **UPDATE** | Partially relevant but needs rewriting against current requirements | Assign to QA engineer |

---

## 🗂️ Project Structure

```
jira-test-case-filter/
├── src/
│   ├── testCaseFilterAgent.js   # Main agent — agentic loop
│   ├── jiraClient.js            # Jira and TestRail API communication
│   ├── analyser.js              # Classification logic
│   └── reporter.js              # Report generation
├── config/
│   └── .env.example             # Environment variable template
├── tests/
│   └── agent.test.js            # Agent unit tests
├── reports/                     # Generated cleanup reports (gitignored)
├── .gitignore
├── package.json
└── README.md
```

---

## ⚙️ Setup

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/qa-ai-agents.git
cd qa-ai-agents/jira-test-case-filter
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp config/.env.example .env
```

Edit `.env` and add your credentials:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key
JIRA_BASE_URL=https://yourcompany.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_TOKEN=your_jira_api_token
TESTRAIL_BASE_URL=https://yourcompany.testrail.io
TESTRAIL_EMAIL=your-email@company.com
TESTRAIL_TOKEN=your_testrail_token
TESTRAIL_SUITE_ID=your_suite_id
```

### 4. Run the Agent

```bash
npm start
```

### 5. Run Tests

```bash
npm test
```

---

## 🖥️ Sample Output

```
============================================================
  🤖 TEST CASE FILTER AGENT STARTED
  Project       : EH
  Test Cases    : 5000
  Batch Size    : 100 per batch
  Total Batches : 50
============================================================

--- Agent Turn 1 ---
🔧 Tool: get_jira_user_stories         ✅
--- Agent Turn 2 ---
🔧 Tool: get_test_cases_batch          ✅
--- Agent Turn 3 ---
🔧 Tool: analyse_test_case_relevance   ✅
--- Agent Turn 4 ---
🔧 Tool: classify_test_case TC-001     ✅ KEEP
🔧 Tool: classify_test_case TC-002     ✅ REMOVE (Flash deprecated)
🔧 Tool: classify_test_case TC-003     ✅ KEEP
🔧 Tool: classify_test_case TC-004     ✅ REMOVE (Twilio v1 deprecated)
🔧 Tool: classify_test_case TC-005     ✅ KEEP

═══════════════════════════════════════════════════════════
  QA TEST CASE CLEANUP REPORT
═══════════════════════════════════════════════════════════

  Total Analysed          : 5000
  Keep                 ✅ : 2100
  Archive              ⚠️  : 1500
  Remove               ❌ : 1100
  Update               🔄 :  300
  Suite Reduced           : 52%
  Manual Review Saved     : ~130 hours
```

---

## 🔌 Real API Integration

To connect to your real Jira and TestRail — uncomment the real API code in `src/jiraClient.js`:

**Jira:**
```javascript
const response = await fetch(
  `${JIRA_BASE_URL}/rest/api/3/search?jql=project=${projectKey} AND issuetype=Story AND status=Active`,
  { headers: { Authorization: `Basic ${btoa(`${JIRA_EMAIL}:${JIRA_TOKEN}`)}` } }
);
```

**TestRail:**
```javascript
const response = await fetch(
  `${TESTRAIL_BASE_URL}/index.php?/api/v2/get_cases/${TESTRAIL_SUITE_ID}&limit=100&offset=${offset}`,
  { headers: { Authorization: `Basic ${btoa(`${TESTRAIL_EMAIL}:${TESTRAIL_TOKEN}`)}` } }
);
```

---

## 🚀 GitHub Actions — Run Monthly Automatically

```yaml
# .github/workflows/test-case-filter.yml
name: Monthly Test Case Cleanup

on:
  schedule:
    - cron: '0 9 1 * *'  # Runs at 9am on the 1st of every month
  workflow_dispatch:       # Also allows manual trigger

jobs:
  filter:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
        working-directory: jira-test-case-filter
      - name: Run Test Case Filter Agent
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          JIRA_TOKEN: ${{ secrets.JIRA_TOKEN }}
          TESTRAIL_TOKEN: ${{ secrets.TESTRAIL_TOKEN }}
        run: npm start
        working-directory: jira-test-case-filter
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **Claude API (Anthropic)** | AI-powered test case classification |
| **Node.js** | JavaScript runtime |
| **Jira REST API** | Fetching active user stories |
| **TestRail API** | Fetching manual test cases |
| **GitHub Actions** | Monthly automated runs |

---

## 📈 Business Value

| Metric | Without Agent | With Agent |
|---|---|---|
| Time to review 5000 test cases | 6–8 weeks manual | Minutes |
| Human hours saved | — | ~130 hours |
| Suite size reduction | 0% | ~50% |
| Accuracy | Human error prone | AI consistent |
| Frequency | Never / rarely | Monthly automated |

---

## 📄 Licence

MIT — Free to use, modify, and distribute.

---

*Built as part of the QA AI Agents portfolio — demonstrating practical AI implementation in software quality assurance.*
