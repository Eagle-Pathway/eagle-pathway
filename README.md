# 🦅 Eagle Pathway — Complete Setup Guide

## Tech Stack
- **React Native** (Expo SDK 51)
- **Expo Router** v3 (file-based navigation)
- **Supabase** (Auth + PostgreSQL + Storage + Realtime)
- **Zustand** (state management)
- **TypeScript** (full type safety)

---

## Prerequisites

Install these before starting:

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | https://nodejs.org |
| npm | 9+ | comes with Node |
| Expo CLI | latest | `npm install -g expo-cli` |
| EAS CLI | latest | `npm install -g eas-cli` |
| Git | any | https://git-scm.com |

For Android testing:
- **Android Studio** → https://developer.android.com/studio
- Or install **Expo Go** on your Android phone

---

## Step 1 — Supabase Setup

### 1.1 Create a Supabase project

1. Go to https://supabase.com and sign up (free)
2. Click **New Project**
3. Fill in:
   - **Name**: `eagle-pathway`
   - **Database Password**: choose a strong password (save it!)
   - **Region**: choose closest to Ethiopia (e.g. Europe West)
4. Click **Create new project** — wait ~2 minutes

### 1.2 Get your API keys

1. In your Supabase dashboard, go to **Settings → API**
2. Copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon/public key** (long JWT string)
3. Keep these — you'll need them in Step 3

### 1.3 Run the database schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Open the file `supabase_schema.sql` from this project
4. Copy the entire contents and paste into the SQL editor
5. Click **Run** (green button)
6. You should see: `Success. No rows returned`

This creates all tables, RLS policies, storage buckets, and seeds 5 sample scholarships.

### 1.4 Enable Phone Auth (OTP)

1. Go to **Authentication → Providers**
2. Find **Phone** and click to expand
3. Toggle **Enable Phone Provider** to ON
4. For testing, you can use **Twilio** (free trial) or enable **Phone confirmations disabled** for local testing
5. Click **Save**

> **For local dev without Twilio**: Go to **Authentication → Settings** → scroll to **Phone Auth** → enable "Enable phone confirmations" = OFF. This lets you use any OTP code `123456` for testing.

### 1.5 Configure Email Auth (optional)

1. Go to **Authentication → Providers → Email**
2. Enable if you want email sign-in as backup

---

## Step 2 — Clone & Install

```bash
# 1. Copy the project folder (the one you downloaded)
cd eagle-pathway

# 2. Install dependencies
npm install

# 3. Install Expo modules (if needed)
npx expo install
```

---

## Step 3 — Environment Variables

```bash
# Create your .env file
cp .env.example .env
```

Open `.env` and fill in your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

> **Important**: The `EXPO_PUBLIC_` prefix is required — Expo only exposes env vars with this prefix to the app.

---

## Step 4 — Run the App

### Option A — Expo Go (fastest, no setup needed)

```bash
npx expo start
```

Then:
1. Install **Expo Go** on your Android phone from Google Play Store
2. Scan the QR code shown in your terminal
3. The app opens on your phone instantly

### Option B — Android Emulator (requires Android Studio)

```bash
# Start an emulator in Android Studio first, then:
npx expo start --android
```

### Option C — Web (limited, for UI testing only)

```bash
npx expo start --web
```

---

## Step 5 — Build for Android (APK)

### 5.1 Local build (no EAS account needed)

```bash
# Install build tools
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build APK for local testing
eas build --platform android --profile preview --local
```

This creates an `.apk` file you can install directly on any Android phone.

### 5.2 EAS Cloud build (recommended for production)

```bash
# Login to EAS
eas login

# Build APK in the cloud (free tier available)
eas build --platform android --profile preview
```

Download the APK from the EAS dashboard and share it.

---

## Project Structure

```
eagle-pathway/
├── app/                          # Expo Router pages
│   ├── _layout.tsx               # Root layout (auth listener)
│   ├── index.tsx                 # Auth redirect
│   ├── (auth)/                   # Auth screens (no tab bar)
│   │   ├── _layout.tsx
│   │   ├── splash.tsx            # Welcome screen
│   │   ├── signup.tsx            # Create account
│   │   ├── login.tsx             # Sign in
│   │   └── otp.tsx               # OTP verification
│   ├── (tabs)/                   # Main app (with tab bar)
│   │   ├── _layout.tsx           # Tab bar config
│   │   ├── home.tsx              # Home dashboard
│   │   ├── tutors.tsx            # Tutor marketplace
│   │   ├── scholarships.tsx      # Scholarship list
│   │   ├── bookings.tsx          # My bookings
│   │   └── profile.tsx           # Profile
│   ├── tutor-profile.tsx         # Tutor detail
│   ├── booking.tsx               # Book a session
│   ├── scholarship-detail.tsx    # Scholarship detail
│   ├── packages.tsx              # Service packages
│   ├── apply.tsx                 # Application form
│   ├── tracker.tsx               # Application tracker
│   ├── progress.tsx              # My progress
│   ├── documents.tsx             # Document manager
│   ├── notifications.tsx         # Notifications
│   └── settings.tsx              # Settings
│
├── src/
│   ├── types/
│   │   └── index.ts              # All TypeScript types
│   ├── utils/
│   │   └── theme.ts              # Colors, spacing, typography
│   ├── services/
│   │   ├── supabase.ts           # Supabase client
│   │   ├── auth.ts               # Auth service
│   │   ├── tutors.ts             # Tutors service
│   │   ├── scholarships.ts       # Scholarships service
│   │   └── notifications.ts      # Push notifications
│   ├── store/
│   │   ├── authStore.ts          # User & auth state
│   │   └── appStore.ts           # Scholarships, bookings, etc.
│   ├── components/
│   │   └── common/
│   │       └── index.tsx         # Button, Pill, Avatar, etc.
│   └── screens/
│       ├── auth/
│       │   ├── SplashScreen.tsx
│       │   ├── SignupScreen.tsx
│       │   └── OTPScreen.tsx
│       ├── home/
│       │   └── HomeScreen.tsx
│       ├── tutors/
│       │   ├── TutorsScreen.tsx
│       │   ├── TutorProfileScreen.tsx
│       │   └── BookingScreen.tsx
│       ├── scholarships/
│       │   └── ScholarshipsScreen.tsx
│       └── index.tsx             # All other screens
│
├── supabase_schema.sql           # Complete DB schema
├── .env.example                  # Environment variables template
├── app.json                      # Expo config
├── babel.config.js
├── tsconfig.json
└── package.json
```

---

## Adding Sample Tutors (optional)

After setting up the database, go to Supabase **Table Editor → tutors** and add sample data, or run this SQL:

```sql
-- First create a test user in auth.users (do this via Supabase Auth UI)
-- Then insert their profile:

INSERT INTO users (id, full_name, phone, role, city) VALUES
  ('YOUR_USER_UUID', 'Yonas Tesfaye', '+251912345678', 'tutor', 'Addis Ababa');

INSERT INTO tutors (user_id, bio, subjects, grade_levels, hourly_rate, rating, total_reviews, total_sessions, response_rate, is_online, is_in_person, location, education, is_verified) VALUES
(
  'YOUR_USER_UUID',
  'MSc in Mathematics from AAU. Passionate about making complex topics accessible. Specialized in University Entrance Exam preparation with a 94% pass rate.',
  ARRAY['Mathematics', 'Physics', 'Statistics'],
  ARRAY['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'University'],
  400, 4.9, 87, 320, 95, true, true,
  'Addis Ababa',
  'MSc Mathematics, Addis Ababa University',
  true
);
```

---

## Common Issues & Fixes

### "Module not found" after npm install
```bash
npx expo install --fix
```

### Metro bundler cache issues
```bash
npx expo start --clear
```

### Supabase OTP not arriving
- For development, go to Supabase **Auth → Settings** and disable phone confirmations
- Use `123456` as test OTP code

### Android build failing
```bash
# Clean build
cd android && ./gradlew clean
cd ..
npx expo start --android
```

### TypeScript errors on path aliases
Make sure `babel-plugin-module-resolver` is installed:
```bash
npm install --save-dev babel-plugin-module-resolver
```

### expo-document-picker not working on Android
Add to `app.json` under `android.permissions`:
```json
"READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"
```

---

## Customizing the App

### Change brand colors
Edit `src/utils/theme.ts`:
```typescript
export const Colors = {
  blue: '#1E4D9B',    // ← change this to your brand color
  gold: '#C9A84C',    // ← change this to your accent color
  // ...
};
```

### Add a new screen
1. Create the component in `src/screens/`
2. Add a route file in `app/your-screen.tsx`:
```typescript
export { default } from '../src/screens/YourScreen';
```
3. Register in `app/_layout.tsx`:
```typescript
<Stack.Screen name="your-screen" />
```

### Connect WhatsApp for tutor chat
In `TutorProfileScreen.tsx`, the chat button can open WhatsApp:
```typescript
import { Linking } from 'react-native';

const openWhatsApp = (phone: string) => {
  const url = `whatsapp://send?phone=${phone}`;
  Linking.openURL(url);
};
```

### Add Telebirr payment
Integrate Telebirr API in `src/services/payments.ts` — their official SDK is at https://developer.ethiotelecom.et

---

## Production Checklist

Before going live:

- [ ] Set up Twilio for real SMS OTP in Supabase
- [ ] Replace `YOUR_SUPABASE_URL` and key in `.env`
- [ ] Enable RLS on all tables (already done in schema)
- [ ] Set up Supabase Edge Functions for push notifications
- [ ] Configure Firebase for FCM (push notifications)
- [ ] Add real app icon and splash screen images in `/assets`
- [ ] Update `app.json` with your real bundle ID and EAS project ID
- [ ] Run `eas build --platform android --profile production` for Play Store
- [ ] Add error tracking (e.g., Sentry) via `expo-sentry`

---

## Support

For questions about this codebase, refer to:
- **Expo docs**: https://docs.expo.dev
- **Expo Router**: https://expo.github.io/router
- **Supabase docs**: https://supabase.com/docs
- **React Native docs**: https://reactnative.dev

---

*Eagle Pathway — From Classroom to International Scholarship* 🦅
