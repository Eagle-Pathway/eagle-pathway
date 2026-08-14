# Workspace Guidelines & Deployment Rules

## Secret & Credential Security Rule

> [!CAUTION]
> **STRICT SECURITY & ACCURACY MANDATE**
> - **NEVER** hardcode API keys, Supabase service role secrets, anon keys, or credentials directly in source code or fallback strings under any circumstances.
> - **NEVER** guess or invent business account numbers, bank details, phone numbers, merchant IDs, or official credentials. **ALWAYS** ask the user directly for their exact official details before placing constants in code or configuration.
> - Always read credentials strictly from environment variables (`process.env.*`).

---

## User-Friendly UI & Error Message Rule

> [!IMPORTANT]
> **STRICT USER EXPERIENCE MANDATE**
> - **NEVER** expose raw technical error strings (e.g., Supabase `AuthApiError`, `PGRST*`, `unique constraint`, SQL errors, or raw code exceptions) directly to the user in any Alert, Modal, Toast, or UI text.
> - **ALWAYS** route errors through `showError()` or `getErrorMessage()` from `@/utils/errorHandler`, or use explicit, polite, human-readable UI messages tailored for non-technical users.
> - Ensure every code change, form validation, success alert, and empty state uses clear, positive, and actionable user-facing language.

---

## Strict Planning Mandate Rule

> [!IMPORTANT]
> **STRICT PLANNING MANDATE**
> - **NEVER** make source code changes, database modifications, or file edits for non-trivial features or fixes without FIRST presenting a clear implementation plan artifact and obtaining explicit user review and approval.

---

## Supabase SQL Migration Notification Rule

> [!IMPORTANT]
> **STRICT DATABASE MIGRATION MANDATE**
> - **ALWAYS** notify the user explicitly whenever any new database migration or SQL script is required for Supabase.
> - **ALWAYS** present the exact, formatted SQL code block in your response and instruct the user to run it in the Supabase Dashboard SQL Editor before proceeding.
> - Never assume database migrations execute automatically.

---

## Pre-Push Verification & User Testing Rule

> [!IMPORTANT]
> **STRICT USER TESTING BEFORE COMMIT & PUSH MANDATE**
> - **NEVER** commit, push code changes to GitHub, or deploy Over-The-Air (OTA) updates without FIRST making the code changes locally, asking the user to manually test and verify the changes, and obtaining explicit user approval to commit and push/deploy.
> - **ALWAYS** wait for explicit user green-light/approval after local changes are ready and verified.

---

## Pre-Push CI & Vercel Build Verification Rule

> [!IMPORTANT]
> **STRICT PRE-PUSH CI & VERCEL BUILD MANDATE**
> - **NEVER** push code changes to GitHub without FIRST running all CI, type checks, unit tests, and production build checks locally across both projects:
>   1. Mobile (`eagle-pathway-mobile`): Run `npx tsc --noEmit` and `npx vitest run`.
>   2. Admin (`eagle-pathway-admin`): Run `npm run build` (to ensure Vercel deployments succeed with zero build/type errors).
> - All checks MUST pass locally with 0 errors before pushing code to GitHub.

---

## Mobile App Deployment Workflow

Whenever you make new code changes, bug fixes, or UI updates to the mobile app (`eagle-pathway-mobile`), follow this workflow:

### Step 1: Verify Code & Tests
Before presenting to the user, run type checking and unit tests:
```bash
# 1. Type check
npx tsc --noEmit
# 2. Run unit tests
npx vitest run
```

### Step 2: Request User Local Testing & Approval
Present the changes to the user and wait for explicit confirmation/approval before committing or deploying.

### Step 3: Deploy Instant Over-The-Air (OTA) Update
Once user approves:
```bash
eas update --channel production --message "Brief summary of what you changed"
```

### Step 4: Commit & Push to GitHub
Save all changes cleanly to Git:
```bash
git add .
git commit -m "feat/fix: description of changes"
git push origin main
```

### Step 5: Build New Play Store Bundle (Only If Native Dependencies Changed)
Only required if adding new native Android npm packages or modifying `app.json` native settings:
```bash
eas build --platform android --profile production
```
Upload generated `.aab` file to Google Play Console $\rightarrow$ Closed Testing.

