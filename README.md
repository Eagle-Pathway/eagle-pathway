# Eagle Pathway

A monorepo for the Eagle Pathway ecosystem, managed via npm workspaces.

## Structure

- **`eagle-pathway-admin`** — Internal admin dashboard (Next.js)
- **`eagle-pathway-mobile`** — Student and tutor mobile app (Expo + React Native)
- **`packages/eagle-shared`** — Shared utilities and types

*(Note: The marketing website, `eagle-pathway-web`, is hosted in a separate, independent repository).*

## Tech Stack

- **Admin**: Next.js, React, Tailwind CSS, TypeScript
- **Mobile**: Expo, React Native, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation
Install dependencies for all workspaces from the root directory:
```bash
npm install
```

### Development
Start the admin dashboard:
```bash
npm run dev -w eagle-pathway-admin
```

Start the mobile app:
```bash
npm run start -w eagle-pathway-mobile
```
