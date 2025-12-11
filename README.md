# 🏀 Sesh

A simple app for tracking your weekly basketball sessions - scores, stats, and teams.

## Features

- **King of the Court** - Track rotating games where winners stay on
- **Live Scoring** - +1/+2/+3 basketball scoring with player faces
- **Team Management** - Create teams with custom names and colors
- **Player Stats** - Track points, wins, games, and scoring breakdown
- **Leaderboards** - See who's leading
- **Host System** - Delegate session management to trusted members
- **Simple Login** - Players login with their full name

## Getting Started

### 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Create a storage bucket called `avatars` (make it public)

### 2. Configure Environment

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run the App

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## How It Works

**Admin:**
1. Create squad → Add players → Create sessions → Run live scoring

**Players:**
1. Login with name → See team → View stats

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase
