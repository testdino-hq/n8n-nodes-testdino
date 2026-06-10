# Releasing — publish a new version to npm

This package is published to npm by the **Publish** GitHub Action
(`.github/workflows/publish.yml`). The workflow triggers **only when a Git tag
matching `*.*.*` is pushed** (e.g. `0.1.6`). Pushing code to `main` alone does
**not** publish — you must push a version tag.

> Important: the tag must have **NO `v` prefix**. The trigger is `*.*.*`, so
> `0.1.6` works but `v0.1.6` will NOT fire the workflow.

---

## Full flow — first step to last

### 1. Make sure `main` is clean and up to date

```bash
git checkout main
git pull origin main
git status        # should be clean before you start
```

### 2. Verify the build and lint pass

```bash
npm install       # if node_modules is missing
npm run build
npm run lint
```

Both must succeed. `dist/` is gitignored and rebuilt by the workflow — you do
not commit it.

### 3. Bump the version

`npm version` updates `package.json` + `package-lock.json` and creates a commit
**and a tag**. Use `--tag-version-prefix=""` so the tag is `0.1.6`, not
`v0.1.6` (required for the workflow trigger):

```bash
npm version patch --tag-version-prefix=""    # 0.1.5 -> 0.1.6
# or: minor / major
```

If you instead edited the version in `package.json` by hand, commit it and
create the tag manually:

```bash
git add package.json package-lock.json
git commit -m "Release 0.1.6"
git tag 0.1.6           # NO "v" prefix
```

### 4. Push the commit

```bash
git push origin main
```

### 5. Push the tag — THIS is what triggers publish

The tag is a separate ref; pushing `main` does not push tags. Push the tag
explicitly:

```bash
git push origin 0.1.6
```

(Or push commit + tag together: `git push origin main --follow-tags`.)

### 6. Watch the Publish workflow

```bash
gh run list --workflow=Publish --limit 3
gh run watch
```

When it finishes `success`, the new version is live on npm:
`@testdino/n8n-nodes-testdino`.

---

## What the workflow does

On a tag push it runs (`publish.yml`):

1. `npm ci` — clean install
2. `npm run release` → `n8n-node release` — prerelease build + publish to npm
   using the `NPM_TOKEN` repo secret.

So `dist/` is built in CI; you don't push it.

---

## One-liner (once `--tag-version-prefix` is set)

Set the no-`v` prefix once for this repo so you never forget:

```bash
npm config set tag-version-prefix "" --location project
```

Then each release is:

```bash
npm version patch && git push origin main --follow-tags
```

---

## Prerequisites / gotchas

- **`NPM_TOKEN` secret** must exist in GitHub repo Settings → Secrets → Actions.
- **Tag prefix:** `*.*.*`, no `v`. A `v`-prefixed tag silently does nothing.
- **Pushing `main` ≠ publishing.** Only the tag push publishes.
- **Version must be new.** npm rejects republishing an existing version, so
  always bump first.
- If a tag was created but the workflow didn't run, the tag was likely never
  pushed to the remote — check with `git ls-remote --tags origin` and push it:
  `git push origin <version>`.
</content>
