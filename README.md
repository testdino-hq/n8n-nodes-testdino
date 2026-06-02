# n8n-nodes-testdino

This is an [n8n](https://n8n.io) community node. It lets you use **[TestDino](https://testdino.com)** in your n8n workflows.

TestDino is an AI-powered test analytics platform for Playwright. This package lets you **react to test-run events** (a run started or finished) and **query your test data** (runs, test cases, specs, analytics, manual tests, usage, and reports) directly from n8n.

[Installation](#installation) · [Credentials](#credentials) · [Nodes & operations](#nodes--operations) · [Example workflows](#example-workflows) · [Resources](#resources)

## Installation

Follow the [community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/).

- **n8n Cloud / self-hosted (verified):** open the nodes panel, search **TestDino**, and install.
- **Self-hosted (manual):** Settings → Community Nodes → Install → enter `@testdino/n8n-nodes-testdino`.

## Credentials

You need a **TestDino Project Personal Access Token (PAT)**:

1. In TestDino, go to **[Project Settings → API](https://app.testdino.com)**.
2. Create a Personal Access Token with the **`public-api`** scope. It looks like `tdp_…` and is scoped to one project.
3. In n8n, create a **TestDino API** credential and paste the token. That's the only field — the project is resolved automatically from the token.

The **Test** button verifies the token and its scope.

## Nodes & operations

This package ships two nodes.

### TestDino (action)

Query TestDino data. Resources and operations:

| Resource | Operations |
| --- | --- |
| **Test Run** | Get, Get Many |
| **Test Case** | Get, Explore, Get History |
| **Spec** | Get Many |
| **Manual Test** | Get, Get Many, Get Suites |
| **Dashboard** | Get |
| **Analytics** | Get Summary |
| **Usage** | Get |
| **Filter** | Get |
| **Report** | Generate PDF |

List operations support **Return All** (pages through every result).

### TestDino Trigger

Starts a workflow when a TestDino run event occurs. It self-registers a webhook with TestDino when the workflow is activated and removes it on deactivation.

| Event | Fires when |
| --- | --- |
| **Run Started** | A new test run is created |
| **Run Finished** | A test run completes |

For **Run Finished** you can set an outcome filter — **Any**, **Failures only**, or **Passing only** — so the workflow only runs for the outcomes you care about (no extra IF node needed). Each delivery is signed (HMAC-SHA256) so you can verify it came from TestDino.

## Example workflows

Practical, multi-step automations for everyday QA and dev work.

### QA

- **Triage failures instantly** — *TestDino Trigger (Run Finished, Failures only)* → *TestDino (Test Run → Get, include errors)* → *Slack*: the moment a run fails, post the failing test names, error categories, and a link to the run in your QA channel.
- **Daily flaky-test digest** — *Schedule Trigger (every morning)* → *TestDino (Test Case → Explore)* → *Code (keep flaky)* → *Slack / Email*: start the day with a list of flaky tests to stabilize.
- **Weekly quality report** — *Schedule Trigger (Monday)* → *TestDino (Report → Generate PDF)* → *TestDino (Analytics → Get Summary)* → *Gmail*: email the team a PDF report plus the week's headline metrics.

### Dev

- **Auto-file a bug, no duplicates** — *TestDino Trigger (Run Finished, Failures only)* → *TestDino (Test Run → Get)* → *Jira / Linear (Search)* → *IF → Create or Comment*: open one ticket per failure and comment on the existing one instead of spamming new tickets.
- **Comment results back on the PR** — *TestDino Trigger (Run Finished)* → *TestDino (Test Run → Get)* → *IF (has PR)* → *GitHub (Create PR comment)*: post pass/fail counts and the run link straight onto the pull request.
- **Usage budget guard** — *Schedule Trigger* → *TestDino (Usage → Get)* → *IF (> 80%)* → *Slack*: get warned before you hit your plan's test-run limit.

## Compatibility

Requires **Node.js 18+** and a recent version of n8n.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [TestDino documentation](https://docs.testdino.com)
- [TestDino API reference](https://docs.testdino.com/api-reference/overview)

## Support

- **Email** — [support@testdino.com](mailto:support@testdino.com)
- **Docs** — [docs.testdino.com](https://docs.testdino.com)

## License

[MIT](LICENSE)
