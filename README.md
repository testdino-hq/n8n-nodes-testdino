# @testdino/n8n-nodes-testdino

[![npm version](https://img.shields.io/npm/v/@testdino/n8n-nodes-testdino.svg)](https://www.npmjs.com/package/@testdino/n8n-nodes-testdino)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

n8n community node for [TestDino](https://testdino.com) — automate workflows from Playwright test run events and query test analytics.

Trigger workflows when a test run starts or finishes, query test runs, test cases, specs, analytics, and usage, and generate PDF reports. Both nodes are usable as AI-agent tools inside n8n's AI Agent node.

## Installation

### From the n8n UI

1. Go to **Settings → Community Nodes → Install**.
2. Enter the package name and confirm:

   ```
   @testdino/n8n-nodes-testdino
   ```

3. Restart n8n if prompted.

Browse the node on [n8n's integrations directory](https://n8n.io/integrations/?q=testdino).

### Self-hosted (manual)

```bash
npm install @testdino/n8n-nodes-testdino
```

Then restart n8n.

**Requirements:** n8n with community nodes enabled · Node.js ≥ 18 · a TestDino account, project, and a `public-api`-scoped Personal Access Token.

## Credentials

The **TestDino API** credential holds one field — your Personal Access Token (PAT). The project is discovered from the token, so you never enter a project ID.

1. In TestDino, open **Project Settings → API**.
2. Create a Personal Access Token with the `public-api` scope.
3. Copy the token (format `tdp_…`). It is shown once.
4. In n8n, go to **Credentials → New → TestDino API**, paste the token, then **Save** and **Test**.

The **Test** button validates the token and resolves the bound project.

> One token connects one project. Store it in a password manager, never commit it to Git, and revoke tokens you no longer use.

## Nodes

This package ships two nodes and one credential type.

| Node | Type | Purpose |
| --- | --- | --- |
| **TestDino** | Action / query | Read runs, cases, specs, analytics, usage; generate PDF reports |
| **TestDino Trigger** | Webhook trigger | Start workflows on test run events |

### TestDino — resources & operations

| Resource | Operations |
| --- | --- |
| Test Run | Get, Get Many |
| Test Case | Get, Explore, Get History |
| Spec | Get Many |
| Manual Test | Get, Get Many, Get Suites |
| Dashboard | Get |
| Analytics | Get Summary |
| Usage | Get |
| Report | Generate PDF |

List operations support **Return All** (walk every page) or a **Limit** (single page). **Generate PDF** returns a binary file you can attach in a later node.

### TestDino Trigger — events

| Event | Fires when |
| --- | --- |
| Run Started | A new test run is created |
| Run Finished | A test run completes |

For **Run Finished**, set **Trigger On** to scope the event:

| Trigger On | Behavior |
| --- | --- |
| Any Outcome | Every finished run |
| Failures Only | Only runs with failures |
| Passing Only | Only runs with no failures |

The outcome filter is applied server-side, so failure-only alerts need no extra IF node. The node self-registers its webhook with TestDino when the workflow is activated, and the lifecycle is idempotent across n8n restarts.

> The n8n instance must expose a publicly reachable production webhook URL for events to arrive.

## Use as AI-agent tools

Both nodes set `usableAsTool: true`, so n8n's **AI Agent** node can call them directly. An agent can fetch recent failed runs, summarize release health, or generate a report on request. The operation descriptions double as the tool descriptions the agent reads.

## Example workflows

**Failed-run Slack alert**

```
TestDino Trigger (Run Finished, Failures only)
  → TestDino (Test Run, Get)
  → Slack
```

**Weekly quality report**

```
Schedule Trigger (Monday)
  → TestDino (Report, Generate PDF)
  → TestDino (Analytics, Get Summary)
  → Gmail
```

**Usage monitor**

```
Schedule Trigger (Daily)
  → TestDino (Usage, Get)
  → IF usage > 80%
  → Slack warning
```

## Troubleshooting

| Symptom | Checks |
| --- | --- |
| Credential test fails | Token starts with `tdp_`, copied in full, has the `public-api` scope, not revoked. |
| Trigger never fires | Workflow is **active**; production webhook URL is publicly reachable; no firewall blocking; token valid; outcome filter not excluding the run. |
| Node missing in n8n | Package installed; community nodes enabled; n8n restarted; package name exact. |
| Return All too slow | Disable Return All; use filters or a Limit instead. |

## Links

- Documentation: https://docs.testdino.com/integrations/automation/n8n
- API Reference: https://docs.testdino.com/api-reference/overview
- App: https://app.testdino.com
- Repository: https://github.com/testdino-hq/n8n-nodes-testdino
- Support: support@testdino.com

## License

[MIT](./LICENSE)