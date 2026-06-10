# n8n-nodes-testdino

Use TestDino inside n8n workflows.

This community node package lets you connect n8n with TestDino, so you can trigger workflows from test-run events, fetch test analytics, generate reports, and automate QA or engineering workflows without writing custom API requests.

TestDino is an AI-powered test analytics platform for Playwright. It helps teams track test runs, debug failures, monitor flaky tests, and understand release quality.

## What you can do

With this package, you can:

* Trigger workflows when a TestDino run starts or finishes
* Send failed test-run alerts to Slack, Email, Jira, Linear, or GitHub
* Fetch test runs, test cases, specs, dashboards, analytics, usage, filters, and reports
* Generate PDF reports from TestDino
* Build daily or weekly QA reporting workflows
* Automate flaky-test and failure-triage workflows

## Package name

```bash
@testdino/n8n-nodes-testdino
```

## Installation

### Install from n8n

In n8n:

1. Open **Settings**
2. Go to **Community Nodes**
3. Select **Install**
4. Enter:

```bash
@testdino/n8n-nodes-testdino
```

5. Confirm the installation
6. Restart n8n if required

### Install manually on self-hosted n8n

For self-hosted n8n instances that support manual community-node installation, install the package from npm:

```bash
npm install @testdino/n8n-nodes-testdino
```

Then restart your n8n instance.

> Note: Availability in n8n Cloud depends on n8n community-node verification and your workspace settings.

## Requirements

* n8n with community nodes enabled
* Node.js 18 or later
* A TestDino account
* A TestDino project
* A TestDino Project Personal Access Token with the `public-api` scope

## Credentials

This package uses a TestDino Project Personal Access Token.

To create a token:

1. Open TestDino
2. Go to **Project Settings**
3. Open **API**
4. Create a Personal Access Token with the `public-api` scope
5. Copy the token

The token looks like this:

```text
tdp_...
```

In n8n:

1. Open **Credentials**
2. Create a new **TestDino API** credential
3. Paste your TestDino token
4. Save the credential
5. Use **Test** to verify the token

The project is resolved automatically from the token. You do not need to enter a project ID manually.

## Security

Keep your TestDino token private.

* Do not commit tokens to GitHub
* Do not paste tokens into workflow notes or public screenshots
* Rotate the token if it is exposed
* Use a project-scoped token with only the required scope

## Nodes included

This package includes two n8n nodes:

* **TestDino**
* **TestDino Trigger**

## TestDino node

Use the **TestDino** node to query TestDino data or generate reports.

### Available resources and operations

| Resource    | Operations                |
| ----------- | ------------------------- |
| Test Run    | Get, Get Many             |
| Test Case   | Get, Explore, Get History |
| Spec        | Get Many                  |
| Manual Test | Get, Get Many, Get Suites |
| Dashboard   | Get                       |
| Analytics   | Get Summary               |
| Usage       | Get                       |
| Filter      | Get                       |
| Report      | Generate PDF              |

### Pagination

List operations support **Return All**.

When enabled, the node automatically paginates through all available results.

## TestDino Trigger node

Use the **TestDino Trigger** node to start an n8n workflow when a TestDino test-run event occurs.

When the workflow is activated, the trigger automatically registers a webhook in TestDino. When the workflow is deactivated, the webhook is removed.

### Supported events

| Event        | When it runs              |
| ------------ | ------------------------- |
| Run Started  | A new test run is created |
| Run Finished | A test run completes      |

### Run finished filters

For the **Run Finished** event, you can filter by outcome:

| Filter        | Behavior                                 |
| ------------- | ---------------------------------------- |
| Any           | Runs for every completed test run        |
| Failures only | Runs only when the test run has failures |
| Passing only  | Runs only when the test run passes       |

This lets you avoid extra IF nodes for common failure-alert workflows.

### Webhook signing

TestDino signs webhook deliveries using HMAC-SHA256.

This helps verify that incoming webhook events came from TestDino.

### Webhook requirements

For trigger workflows, your n8n instance must have a reachable production webhook URL.

This is especially important for self-hosted n8n instances. If TestDino cannot reach your n8n webhook URL, trigger events will not be delivered.

## Example workflows

### Send failed test runs to Slack

Use this workflow when your team wants instant visibility into broken test runs.

```text
TestDino Trigger
Run Finished, Failures only

→ TestDino
Test Run, Get

→ Slack
Send message to QA or engineering channel
```

Example Slack message:

```text
Test run failed

Project: Web App
Branch: main
Failed tests: 8
Duration: 6m 42s
Run: https://app.testdino.com/...
```

## Create a daily flaky-test digest

Use this workflow to review unstable tests every morning.

```text
Schedule Trigger
Every weekday morning

→ TestDino
Test Case, Explore

→ Code
Filter flaky tests

→ Slack or Email
Send digest to QA team
```

## Generate a weekly quality report

Use this workflow to share release-quality metrics with the team.

```text
Schedule Trigger
Every Monday

→ TestDino
Report, Generate PDF

→ TestDino
Analytics, Get Summary

→ Gmail
Send report to the team
```

## Create or update bug tickets for failures

Use this workflow to avoid duplicate bug tickets.

```text
TestDino Trigger
Run Finished, Failures only

→ TestDino
Test Run, Get

→ Jira or Linear
Search existing issue

→ IF
Issue exists?

→ Create issue or add comment
```

## Comment test results on a GitHub pull request

Use this workflow to keep pull requests updated with test status.

```text
TestDino Trigger
Run Finished

→ TestDino
Test Run, Get

→ IF
Run has pull request metadata?

→ GitHub
Create pull request comment
```

## Monitor usage limits

Use this workflow to avoid unexpected usage limits.

```text
Schedule Trigger
Daily

→ TestDino
Usage, Get

→ IF
Usage is above 80%

→ Slack
Send warning
```

## Common use cases

* Notify QA when a test run fails
* Send release-quality summaries to engineering leads
* Track flaky tests daily
* Generate weekly PDF reports
* Create Jira or Linear issues from failed tests
* Comment test results on pull requests
* Monitor project usage
* Build internal QA dashboards using n8n workflows

## Troubleshooting

### The credential test fails

Check that:

* The token starts with `tdp_`
* The token was copied completely
* The token has the `public-api` scope
* The token belongs to the correct TestDino project
* The token has not been revoked

### The trigger does not run

Check that:

* The n8n workflow is active
* Your n8n production webhook URL is publicly reachable
* Your self-hosted n8n instance is not blocked by firewall rules
* The TestDino token is valid
* The selected event matches the test-run event you expect
* For **Run Finished**, the outcome filter is not excluding the run

### The node does not appear in n8n

Check that:

* The package was installed successfully
* Community nodes are enabled in your n8n instance
* You restarted n8n after installation, if required
* The package name is exactly:

```bash
@testdino/n8n-nodes-testdino
```

### Return All takes too long

Large projects can contain many test runs or test cases.

If the workflow is slow, disable **Return All** and use filters, limits, or pagination where available.

## Development

Clone the repository:

```bash
git clone https://github.com/testdino-hq/n8n-nodes-testdino.git
cd n8n-nodes-testdino
```

Install dependencies:

```bash
npm install
```

Run lint checks:

```bash
npm run lint
```

Build the package:

```bash
npm run build
```

Run locally with n8n according to your n8n community-node development setup.

## Publishing

Before publishing a new version:

1. Update the package version
2. Run lint checks
3. Build the package
4. Test the node in n8n
5. Publish to npm

```bash
npm run lint
npm run build
npm publish --access public
```

If submitting for n8n verification, make sure the package follows n8n's current community-node verification guidelines.

## Support

For TestDino support:

* Email: [support@testdino.com](mailto:support@testdino.com)
* Docs: https://docs.testdino.com
* App: https://app.testdino.com

For n8n community-node installation help:

* n8n community nodes documentation: https://docs.n8n.io/integrations/community-nodes/installation/

## Links

* TestDino: https://testdino.com
* TestDino app: https://app.testdino.com
* TestDino docs: https://docs.testdino.com
* n8n: https://n8n.io
* n8n community nodes: https://docs.n8n.io/integrations/community-nodes/installation/

## License

MIT
