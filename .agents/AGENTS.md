# Workspace Guidelines & Deployment Rules

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
