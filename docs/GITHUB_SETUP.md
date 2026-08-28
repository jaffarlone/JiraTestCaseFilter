# 🐙 GitHub Setup — Complete Commands

## Step 1 — Configure Git (First Time Only)

```bash
git config --global user.name "Jaffar Zahid Lone"
git config --global user.email "your-email@gmail.com"
```

---

## Step 2 — Navigate to Project Folder

```bash
cd qa-ai-agents/jira-test-case-filter
```

---

## Step 3 — Install Dependencies

```bash
npm install
```

---

## Step 4 — Set Up Environment Variables

```bash
cp config/.env.example .env
# Open .env and add your API keys
```

---

## Step 5 — Initialise Git

```bash
git init
git add .
git status
```

---

## Step 6 — Create GitHub Repository

```
1. Go to github.com
2. Click + → New Repository
3. Name: qa-ai-agents
4. Set to Public
5. Do NOT tick "Add README" — we already have one
6. Click Create Repository
```

---

## Step 7 — Connect and Push

```bash
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/qa-ai-agents.git
git commit -m "Initial commit — Jira Test Case Filter Agent"
git branch -M main
git push -u origin main
```

---

## Step 8 — Verify on GitHub

```
https://github.com/YOUR_USERNAME/qa-ai-agents
```

You should see:
- ✅ README.md displayed on homepage
- ✅ src/ folder with all agent files
- ✅ tests/ folder
- ✅ config/ folder
- ✅ package.json
- ❌ .env (hidden — protected)
- ❌ node_modules (hidden — protected)

---

## Step 9 — Future Updates

```bash
# After any code change
git add .
git commit -m "Your descriptive message here"
git push
```

---

## ⚠️ Common Issues

| Issue | Fix |
|---|---|
| Push rejected | `git pull origin main --rebase` then push again |
| Password prompt | Use GitHub Personal Access Token as password |
| Main not found | Try `git push -u origin master` |
| Permission denied | Check GitHub credentials in git config |

---

## 🔑 GitHub Personal Access Token

If git push asks for a password:

```
1. GitHub → Settings → Developer Settings
2. Personal Access Tokens → Tokens (Classic)
3. Generate New Token
4. Select: repo (full control)
5. Copy token — use as password when prompted
```
