# Setup Guide: Linking a GitHub Repo & Jira Board

This guide walks through connecting a GitHub repository and Jira board to VeloX so it can analyze PRs and display sprint context.

---

## Part 1: GitHub Repository Setup

### 1.1 Prerequisites
- A GitHub repository you own or have admin access to (or at least webhook permissions)
- A GitHub Personal Access Token (PAT) with `repo` and `read:user` scopes (optional, but recommended for reading PR metadata)
- VeloX backend deployed and accessible at a public URL (e.g. `https://velox-api.onrender.com`)

### 1.2 Backend Environment Variables

Set these in your backend's `.env` or Render/deployment dashboard:

```env
# GitHub webhook secret (any strong random string, 32+ chars recommended)
GITHUB_WEBHOOK_SECRET=your-random-webhook-secret-here

# GitHub Personal Access Token (optional but recommended)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**How to create a GitHub Personal Access Token:**
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. Click "Generate new token"
3. Name: `velox-pr-analysis`
4. Expiration: 90 days or Custom
5. Resource owner: Your GitHub account or org
6. Permissions:
   - **Repository permissions**: `Contents: read` (to fetch PR diffs and commit metadata)
   - **Account permissions**: `User: read` (optional, to read author info)
7. Click "Generate token"
8. Copy the token and store it in `GITHUB_TOKEN`

### 1.3 Frontend: Link the Repository

1. **Open the app** and navigate to `/connect` (or click "Link a project" in the UI)
2. **Enter your repository** in the format `owner/repo`
   - Example: `abdelrahman-omran/VeloX`
   - The app validates the format and stores it locally in your browser
3. **Click "Save project"**
   - The repo is now linked in your local project store

### 1.4 GitHub Webhook Setup

GitHub needs to push PR events to your VeloX backend. Here's how to set it up:

**In your GitHub repository:**
1. Go to **Settings** → **Webhooks** → **Add webhook**
2. Fill in the form:
   - **Payload URL**: `https://your-backend-url/webhooks/github`
     - Example: `https://velox-api.onrender.com/webhooks/github`
   - **Content type**: `application/json`
   - **Secret**: Paste your `GITHUB_WEBHOOK_SECRET` value (the random string from step 1.2)
   - **Which events would you like to trigger this webhook?** → Select "Let me select individual events"
   - **Events to enable:**
     - ✅ Pull requests
   - **Active**: ✅ (checked)
3. Click **"Add webhook"**

### 1.5 Verify the Webhook

After creating the webhook, GitHub sends a test delivery. Check that it succeeds:

1. In the webhook settings, scroll to **Recent Deliveries**
2. Click on the most recent delivery (should be seconds ago)
3. Look for a green checkmark and **Response: 200** (or **202 Accepted**)
   - 200/202 = success
   - 4xx/5xx = error (check backend logs)

**Common issues:**
- **404 Not Found**: Webhook URL is wrong or backend isn't reachable
- **401/403 Forbidden**: Secret mismatch or missing `GITHUB_WEBHOOK_SECRET` env var
- **500 Server Error**: Backend crashed; check logs for details

### 1.6 Test with a Real PR

Once the webhook is verified:

1. **Create or update a PR** in your linked repository (or reopen an old one)
2. **GitHub sends a webhook** to VeloX with the PR event
3. **Backend processes it:**
   - Stores the PR in the database
   - Queues it for AI scoring (if Gemini API is configured)
4. **Frontend polls `/api/prs/active`** and shows it in the triage queue

You should see the PR appear in the app within seconds (or up to a minute if AI scoring is running).

---

## Part 2: Jira Board Setup

### 2.1 Prerequisites
- A Jira Cloud workspace (not Jira Server or Data Center)
- Admin or project lead access to at least one board
- A Jira API token (app password in Jira Cloud)

### 2.2 Get Your Jira Board ID

**In Jira:**
1. Open your board in Jira (e.g., `https://your-company.atlassian.net/software/c/projects/YOUR_PROJECT/boards/123`)
2. The **board ID** is in the URL after `/boards/`
   - Example: `https://your-company.atlassian.net/software/c/projects/VELOX/boards/42` → board ID is `42`

### 2.3 Create a Jira API Token

**In Jira Cloud (not Server/Data Center):**

1. Go to **your Jira workspace** → **Account settings** → **Security** → **API tokens** (or `https://id.atlassian.com/manage-profile/security/api-tokens`)
2. Click **"Create API token"**
3. Label: `velox-pr-analysis`
4. Click **"Create"**
5. **Copy the token immediately** (it's only shown once)

### 2.4 Backend Environment Variables

Set these in your backend's `.env` or Render/deployment dashboard:

```env
# Jira Cloud domain (without https://)
JIRA_DOMAIN=your-company.atlassian.net

# Email associated with your Jira account
JIRA_EMAIL=your-email@example.com

# The API token you just created
JIRA_API_TOKEN=your-jira-api-token-here

# The board ID from step 2.2
JIRA_BOARD_ID=42
```

### 2.5 Verify Jira Connection

Once env vars are set and the backend is redeployed:

1. **Open the VeloX frontend**
2. **Check the Sprint Analysis page** (if it exists, or check the API directly)
3. **Make a request** to `GET /api/jira/sprints`
   - If configured: returns active and upcoming sprints with issues
   - If not configured: returns mock data (demo mode)

**If it fails:**
- Check backend logs for auth errors
- Verify `JIRA_DOMAIN` doesn't have `https://` prefix
- Verify the email and token are correct (regenerate the token if unsure)
- Ensure your API token hasn't expired (they do after 1 year)

### 2.6 Understanding Sprint Data

VeloX fetches:
- **Active sprints** (currently running)
- **Future sprints** (upcoming)

For each sprint, it retrieves:
- Sprint name, start/end dates, goal
- All issues in the sprint with:
  - Issue key (e.g., `VEL-101`)
  - Summary
  - Status (To Do, In Progress, In Review, Done)
  - Assignee
  - Story points

This data is displayed in the **Sprint Analysis** view to give team leads context on capacity and burn-down.

---

## Part 3: Verification Checklist

- [ ] **GitHub webhook secret** is set in backend `.env` → `GITHUB_WEBHOOK_SECRET`
- [ ] **GitHub PAT** (optional) is set → `GITHUB_TOKEN`
- [ ] **GitHub webhook** is configured in repo settings pointing to `/webhooks/github`
- [ ] **Webhook test delivery** shows 200/202 response
- [ ] **Repository** is linked in VeloX frontend (`/connect`)
- [ ] **Test PR** created/updated in GitHub shows up in triage queue within 30 seconds
- [ ] **Jira domain** is set → `JIRA_DOMAIN` (no `https://`)
- [ ] **Jira email** is set → `JIRA_EMAIL`
- [ ] **Jira API token** is set → `JIRA_API_TOKEN`
- [ ] **Jira board ID** is set → `JIRA_BOARD_ID`
- [ ] **Jira API** responds with sprint data at `GET /api/jira/sprints`

---

## Part 4: Troubleshooting

### GitHub Webhook Not Triggering

**Symptom**: PR created but doesn't appear in VeloX within 2 minutes.

**Check:**
1. Go to GitHub repo → Settings → Webhooks → your webhook → Recent Deliveries
   - Look for red ❌ indicators
2. Click on a failed delivery to see the error response
3. **Common fixes:**
   - URL is wrong or backend is down → fix the URL or restart backend
   - Secret mismatch → regenerate webhook, copy secret correctly to `GITHUB_WEBHOOK_SECRET`
   - PR event not enabled → re-enable "Pull requests" in webhook settings

### Jira Not Showing Data

**Symptom**: Sprint data is mocked/empty instead of real.

**Check:**
1. Verify all 4 Jira env vars are set (no typos)
2. Test the Jira API manually:
   ```bash
   curl -u "your-email@example.com:JIRA_API_TOKEN" \
     "https://your-company.atlassian.net/rest/agile/1.0/board/42/sprint"
   ```
   - Should return JSON with sprints
   - If 401, token or email is wrong
   - If 403, user doesn't have access to board
   - If 404, board ID is wrong
3. Regenerate the Jira API token if it might be expired

### "Invalid repository" Error on `/connect`

**Symptom**: Can't save repo with error message.

**Fix:**
- Ensure format is exactly `owner/repo` (lowercase, no spaces, no `.git`)
- Example: `microsoft/vscode` ✅ | `Microsoft/VSCode` ✅ | `microsoft/vs-code` ✅ | `microsoft/vscode.git` ❌

---

## Part 5: Advanced: Custom Jira Field Mapping

By default, VeloX reads `customfield_10016` or `storyPoints` for story points. If your Jira instance uses a different custom field:

1. **Find your story point field ID:**
   ```bash
   curl -u "email:token" \
     "https://your-domain.atlassian.net/rest/api/3/field" | grep -i "points"
   ```
2. **Update `backend/app/api/jira.py` line 79-80** to use your field ID
3. **Redeploy the backend**

---

## Part 6: Next Steps

Once GitHub and Jira are linked:

1. **Open the triage page** (`/app`) to see PRs and sprints side-by-side
2. **Check PR scores** calculated by the AI agent
3. **Use sprint context** to understand capacity constraints
4. **Deep-link to specific PRs** via `/prs/{pr-id}` to share with the team
