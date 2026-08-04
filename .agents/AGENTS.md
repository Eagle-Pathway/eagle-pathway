# Workspace Guidelines & Deployment Rules

## Secret & Credential Security Rule

> [!CAUTION]
> **STRICT SECURITY MANDATE**
> - **NEVER** hardcode API keys, Supabase service role secrets, anon keys, or credentials directly in source code or fallback strings under any circumstances.
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

## Pre-Push Verification & User Testing Rule

> [!IMPORTANT]
> **STRICT USER TESTING BEFORE PUSH MANDATE**
> - **NEVER** push code changes to GitHub or deploy Over-The-Air (OTA) updates without FIRST making the changes locally, asking the user to manually test and verify the fix, and obtaining explicit user approval to push/deploy.

---

## Mobile App Deployment Workflow

Whenever you make new code changes, bug fixes, or UI updates to the mobile app (`eagle-pathway-mobile`), follow this workflow:

### Step 1: Verify Code & Tests
Before deploying, run type checking and unit tests:
```bash
# 1. Type check
npx tsc --noEmit
# 2. Run unit tests
npx vitest run
```

### Step 2: Deploy Instant Over-The-Air (OTA) Update
For any JavaScript, UI layout, screen, service, or store code changes, push the update directly to live users over-the-air:
```bash
eas update --channel production --message "Brief summary of what you changed"
```

### Step 3: Commit & Push to GitHub
Save all changes cleanly to Git:
```bash
git add .
git commit -m "feat/fix: description of changes"
git push origin main
```

### Step 4: Build New Play Store Bundle (Only If Native Dependencies Changed)
Only required if adding new native Android npm packages or modifying `app.json` native settings:
```bash
eas build --platform android --profile production
```
Upload generated `.aab` file to Google Play Console $\rightarrow$ Closed Testing.

