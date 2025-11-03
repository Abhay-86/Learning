

---

# 🧠 Git Standards and Conventions (with Tutorial)

*(Full updated document with tutorial included)*

---

## 📌 Purpose

To ensure consistency, clarity, and collaboration in the development workflow, this document defines the Git usage standards and conventions for our startup’s engineering team. It standardizes our approach to commits, branching, pull requests (PRs), and merging to optimize for speed, traceability, and reliability.

---


```
1. General Guidelines
2. Branching Strategy
    2.1 Branch Naming Conventions
    2.2 Branch Types
3. Commit Message Guidelines
4. Pull Requests (PRs)
    4.1 PR Template
    4.2 PR Review Guidelines
5. Merge Strategy
6. Tagging & Releases
7. Do’s and Don’ts
8. Git Tutorial (Step-by-Step Guide)
```
---

## 1. General Guidelines

* **main** branch must always be deployable.
* Always work on a **separate feature/fix branch**.
* Use **pull requests** for all merges into main.
* Keep branches **short-lived** and focused on one concern.
* Ensure **CI passes** before merging.
* Keep history clean and readable (use **rebase** before merge if necessary).

---

## 2. Branching Strategy

We use a **trunk-based development strategy** with short-lived branches off of `main`.

### 2.1 Branch Naming Conventions

**Format:**

```
<type>/<issue-id>-<short-description>
```

**Types:**

| Type     | Description                               |
| -------- | ----------------------------------------- |
| feat     | New feature                               |
| fix      | Bug fix                                   |
| chore    | Maintenance (e.g., updating dependencies) |
| docs     | Documentation updates                     |
| test     | Adding or updating tests                  |
| refactor | Code refactoring                          |
| ci       | CI/CD configuration changes               |

**Examples:**

```
feat/123-user-login
fix/456-dropdown-not-working
docs/101-api-doc-update
```

---

### 2.2 Branch Types

| Branch    | Purpose                     |
| --------- | --------------------------- |
| main      | Production-ready code       |
| dev       | Optional staging branch     |
| feature/* | New features                |
| fix/*     | Bug fixes                   |
| hotfix/*  | Urgent fixes for production |
| release/* | Prepares production release |

---

## 3. Commit Message Guidelines

**Format:**

```
<type>(scope): short summary
<blank line>
body (optional)
<blank line>
footer (optional)
```

**Examples:**

```
feat(auth): add JWT authentication middleware

Added middleware to generate and verify JWT tokens.
Refactored authController to use new middleware.

Closes #123
```

---

## 4. Pull Requests (PRs)

* Every change must go through a **PR**.
* Keep PRs **small and atomic**.
* PR title should match the **branch description**.
* Link related issue: `Closes #123`.
* Assign reviewers and add labels.

---

### 4.1 PR Template (`.github/PULL_REQUEST_TEMPLATE.md`)

```markdown
## 🚀 What does this PR do?
> Short summary of the changes made

## ✅ Checklist
- [ ] Tests added/updated
- [ ] Docs updated
- [ ] No console errors/warnings
- [ ] CI/CD passes

## 📌 Related Issues
Closes #___

## 💬 Notes
> Any additional context or implementation details
```

---

### 4.2 PR Review Guidelines

* Use inline comments for feedback.
* Approve only when:

  * Code is **well-tested**
  * Code **matches the style**
  * Code **solves the intended problem**

---

## 5. Merge Strategy

* Use **Squash and Merge** for all PRs (default).
* Benefit: one commit per feature/fix → clean history.
* Always rebase before merging:

```bash
git fetch origin
git rebase origin/main
```

---

## 6. Tagging & Releases

Use **Semantic Versioning**:
`MAJOR.MINOR.PATCH`

| Type  | Meaning          |
| ----- | ---------------- |
| MAJOR | Breaking changes |
| MINOR | New features     |
| PATCH | Bug fixes        |

Tag releases:

```bash
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0
```

Maintain a `CHANGELOG.md` or GitHub Releases page.

---

## 7. Do’s and Don’ts

✅ **Do**

* Write clear, concise commit messages
* Keep PRs small and focused
* Review code kindly but critically
* Rebase frequently

❌ **Don’t**

* Commit directly to main
* Push code without tests
* Leave PRs unreviewed
* Merge without CI passing

---

## 8. 🧩 Git Tutorial (Step-by-Step Guide)

This section provides practical commands and examples for developers new to Git or joining the project.

---

### 🔹 Step 1: Clone the repository

```bash
git clone https://github.com/<org>/<repo>.git
cd <repo>
```

---

### 🔹 Step 2: Check the current branch

```bash
git branch
```

You should be on `main` or `dev`.
Always start new work from `main` (or `dev` if staging is used).

---

### 🔹 Step 3: Pull the latest changes before starting work

```bash
git pull origin main
```

or

```bash
git pull origin dev
```

---

### 🔹 Step 4: Create a new branch for your task

```bash
# Format: type/issueId-description
git checkout -b feat/123-add-user-login
```

This creates and switches to a new branch.

---

### 🔹 Step 5: Make your code changes

Edit files, add new ones, and test locally.

---

### 🔹 Step 6: Stage and commit your changes

```bash
git add .
git commit -m "feat(auth): add login endpoint for users"
```

---

### 🔹 Step 7: Rebase with the latest main before pushing

```bash
git fetch origin
git rebase origin/main
```

Resolve conflicts if prompted, then:

```bash
git rebase --continue
```

---

### 🔹 Step 8: Push your branch

```bash
git push origin feat/123-add-user-login
```

If it’s your first push, you may need:

```bash
git push -u origin feat/123-add-user-login
```

---

### 🔹 Step 9: Create a Pull Request (PR)

1. Go to GitHub → open your repo.
2. You’ll see a “Compare & Pull Request” button.
3. Fill out the PR Template:

   * Title (same as branch)
   * Description (what’s changed)
   * Linked issue (e.g., “Closes #123”)
4. Assign reviewers.
5. Wait for review and CI checks to pass.

---

### 🔹 Step 10: Merge the PR

* Reviewer merges using **“Squash and Merge”** option.
* The feature branch can now be deleted.

---

### 🔹 Step 11: Pull the updated main

After merge:

```bash
git checkout main
git pull origin main
```

---

### 🔹 Step 12: Optional – Tag a release

```bash
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0
```

---

### 🧭 Quick Reference Summary

| Action      | Command                                      |
| ----------- | -------------------------------------------- |
| Clone repo  | `git clone <repo-url>`                       |
| New branch  | `git checkout -b feat/101-something`         |
| Pull latest | `git pull origin main`                       |
| Stage files | `git add .`                                  |
| Commit      | `git commit -m "feat(scope): message"`       |
| Rebase      | `git fetch origin && git rebase origin/main` |
| Push branch | `git push -u origin feat/...`                |
| Merge PR    | Done via GitHub → Squash and Merge           |
| Tag release | `git tag -a vX.Y.Z -m "message"`             |

---
