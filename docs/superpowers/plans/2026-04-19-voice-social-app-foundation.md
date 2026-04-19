# Voice Social App Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first testable foundation for the voice social app: Expo native app shell, Supabase schema, typed client, auth/onboarding flow, feed shell, composer shell, and initial tests.

**Architecture:** This plan creates the mobile app and backend contract first. Supabase owns auth, Postgres, storage metadata, and feed data; the Expo app owns navigation, auth UI, onboarding, feed surfaces, and composer states. The self-hosted moderation worker is intentionally planned as the next phase after the database contract and post states exist.

**Tech Stack:** Expo React Native, TypeScript, Expo Router, Supabase JS, Postgres SQL migrations, Jest, React Native Testing Library.

---

## Scope Split

The approved design covers several independent subsystems: mobile app, Supabase backend, moderation worker, recommendation ranking, and admin tools. This plan implements the foundation slice only:

- Expo app scaffold and project commands.
- Supabase schema, enums, RLS policies, and seed topics.
- Typed Supabase client and environment handling.
- Auth, onboarding interests, home feeds, profile shell, and composer shell.
- Unit tests for ranking helpers, status visibility, and onboarding validation.

Separate plans should follow for:

- Moderation worker with `faster-whisper`, Detoxify, topic extraction, and job claiming.
- Real audio upload and playback integration.
- Admin moderation interface.
- Advanced recommendation iterations after listen-event data exists.

## File Structure

Create or modify these files:

- Create: `package.json` through Expo scaffold.
- Create: `app.json`
- Create: `babel.config.js`
- Create: `jest.config.js`
- Create: `tsconfig.json`
- Create: `.env.example`
- Create: `app/_layout.tsx`
- Create: `app/(auth)/login.tsx`
- Create: `app/(auth)/onboarding.tsx`
- Create: `app/(tabs)/_layout.tsx`
- Create: `app/(tabs)/index.tsx`
- Create: `app/(tabs)/following.tsx`
- Create: `app/(tabs)/compose.tsx`
- Create: `app/(tabs)/profile.tsx`
- Create: `src/components/PostCard.tsx`
- Create: `src/components/TopicChip.tsx`
- Create: `src/features/auth/authState.ts`
- Create: `src/features/feed/feedRanking.ts`
- Create: `src/features/feed/postVisibility.ts`
- Create: `src/features/onboarding/interests.ts`
- Create: `src/lib/env.ts`
- Create: `src/lib/supabase.ts`
- Create: `src/styles/theme.ts`
- Create: `supabase/migrations/202604190001_initial_schema.sql`
- Create: `tests/feedRanking.test.ts`
- Create: `tests/postVisibility.test.ts`
- Create: `tests/interests.test.ts`
- Modify: `.gitignore`
- Modify: `AGENTS.md` only if project commands need documentation and the file is tracked or the user explicitly asks to include it in the implementation commit.

## Task 1: Scaffold Expo App And Commands

**Files:**
- Create: `package.json`
- Create: `app.json`
- Create: `babel.config.js`
- Create: `tsconfig.json`
- Modify: `.gitignore`

- [ ] **Step 1: Scaffold the app**

Run:

```bash
npx create-expo-app@latest . --template blank-typescript
```

Expected: Expo creates a TypeScript app in the repository root. If the command refuses because files already exist, create a temporary app in `/tmp/yap-expo-template`, copy the generated app files manually, and keep existing `docs/`, `.gitignore`, `.codex`, and `AGENTS.md` untouched.

- [ ] **Step 2: Install runtime dependencies**

Run:

```bash
npm install expo-router @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill expo-av expo-file-system expo-constants
```

Expected: dependencies are added to `package.json`.

- [ ] **Step 3: Install test dependencies**

Run:

```bash
npm install --save-dev jest jest-expo @testing-library/react-native @testing-library/jest-native react-test-renderer
```

Expected: dev dependencies are added to `package.json`.

- [ ] **Step 4: Install path alias dependency**

Run:

```bash
npm install --save-dev babel-plugin-module-resolver
```

Expected: `babel-plugin-module-resolver` is added to `devDependencies`.

- [ ] **Step 5: Configure package entry and scripts**

Modify `package.json` so `main` and scripts include:

```json
{
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "test": "jest",
    "test:watch": "jest --watch",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 6: Configure Expo Router entry**

Replace `app.json` with:

```json
{
  "expo": {
    "name": "Yap",
    "slug": "yap",
    "scheme": "yap",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "plugins": ["expo-router"],
    "experiments": {
      "typedRoutes": true
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "app.yap.mobile"
    },
    "android": {
      "package": "app.yap.mobile"
    }
  }
}
```

- [ ] **Step 7: Configure Babel**

Replace `babel.config.js` with:

```js
module.exports = function babelConfig(api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'expo-router/babel',
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
          },
        },
      ],
    ],
  };
};
```

- [ ] **Step 8: Configure TypeScript**

Replace `tsconfig.json` with:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["app", "src", "tests", "expo-env.d.ts"]
}
```

- [ ] **Step 9: Update `.gitignore`**

Ensure `.gitignore` contains:

```gitignore
.superpowers/
node_modules/
.expo/
dist/
coverage/
.env
```

- [ ] **Step 10: Commit scaffold**

Run:

```bash
git add package.json package-lock.json app.json babel.config.js tsconfig.json .gitignore
git commit -m "Scaffold Expo app foundation"
```

Expected: commit succeeds with Expo foundation files.

## Task 2: Add Test Harness And Pure Domain Helpers

**Files:**
- Create: `jest.config.js`
- Create: `src/features/feed/postVisibility.ts`
- Create: `src/features/feed/feedRanking.ts`
- Create: `src/features/onboarding/interests.ts`
- Create: `tests/postVisibility.test.ts`
- Create: `tests/feedRanking.test.ts`
- Create: `tests/interests.test.ts`

- [ ] **Step 1: Add Jest config**

Create `jest.config.js`:

```js
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/tests/**/*.test.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|expo(nent)?|@expo(nent)?/.*|expo-.*|@expo/.*|@supabase/.*)/)',
  ],
};
```

- [ ] **Step 2: Write failing post visibility tests**

Create `tests/postVisibility.test.ts`:

```ts
import { canAppearInFeed } from '../src/features/feed/postVisibility';

describe('canAppearInFeed', () => {
  it('allows only published posts in public feeds', () => {
    expect(canAppearInFeed({ status: 'published' })).toBe(true);
    expect(canAppearInFeed({ status: 'processing' })).toBe(false);
    expect(canAppearInFeed({ status: 'needs_review' })).toBe(false);
    expect(canAppearInFeed({ status: 'rejected' })).toBe(false);
    expect(canAppearInFeed({ status: 'processing_failed' })).toBe(false);
  });
});
```

- [ ] **Step 3: Run the failing post visibility test**

Run:

```bash
npm test -- tests/postVisibility.test.ts
```

Expected: FAIL because `src/features/feed/postVisibility.ts` does not exist.

- [ ] **Step 4: Implement post visibility helper**

Create `src/features/feed/postVisibility.ts`:

```ts
export type PostStatus =
  | 'processing'
  | 'published'
  | 'rejected'
  | 'needs_review'
  | 'processing_failed';

type FeedVisibilityInput = {
  status: PostStatus;
};

export function canAppearInFeed(post: FeedVisibilityInput): boolean {
  return post.status === 'published';
}
```

- [ ] **Step 5: Verify post visibility passes**

Run:

```bash
npm test -- tests/postVisibility.test.ts
```

Expected: PASS.

- [ ] **Step 6: Write failing ranking tests**

Create `tests/feedRanking.test.ts`:

```ts
import { scorePostForUser } from '../src/features/feed/feedRanking';

describe('scorePostForUser', () => {
  it('rewards topic matches, engagement, completion, freshness, and safety', () => {
    const score = scorePostForUser({
      userInterestTopicIds: ['tech', 'music'],
      followedAuthorIds: ['creator-a'],
      now: new Date('2026-04-19T12:00:00.000Z'),
      post: {
        authorId: 'creator-a',
        topicIds: ['tech'],
        likeCount: 10,
        replyCount: 2,
        repostCount: 1,
        listenCompletionRate: 0.8,
        safetyScore: 0.05,
        publishedAt: new Date('2026-04-19T10:00:00.000Z'),
      },
    });

    expect(score).toBeGreaterThan(80);
  });

  it('downranks unsafe posts even with engagement', () => {
    const safeScore = scorePostForUser({
      userInterestTopicIds: ['tech'],
      followedAuthorIds: [],
      now: new Date('2026-04-19T12:00:00.000Z'),
      post: {
        authorId: 'creator-a',
        topicIds: ['tech'],
        likeCount: 2,
        replyCount: 1,
        repostCount: 0,
        listenCompletionRate: 0.5,
        safetyScore: 0.05,
        publishedAt: new Date('2026-04-19T11:00:00.000Z'),
      },
    });

    const unsafeScore = scorePostForUser({
      userInterestTopicIds: ['tech'],
      followedAuthorIds: [],
      now: new Date('2026-04-19T12:00:00.000Z'),
      post: {
        authorId: 'creator-a',
        topicIds: ['tech'],
        likeCount: 200,
        replyCount: 50,
        repostCount: 20,
        listenCompletionRate: 0.9,
        safetyScore: 0.95,
        publishedAt: new Date('2026-04-19T11:00:00.000Z'),
      },
    });

    expect(unsafeScore).toBeLessThan(safeScore);
  });
});
```

- [ ] **Step 7: Run the failing ranking tests**

Run:

```bash
npm test -- tests/feedRanking.test.ts
```

Expected: FAIL because `src/features/feed/feedRanking.ts` does not exist.

- [ ] **Step 8: Implement ranking helper**

Create `src/features/feed/feedRanking.ts`:

```ts
type RankablePost = {
  authorId: string;
  topicIds: string[];
  likeCount: number;
  replyCount: number;
  repostCount: number;
  listenCompletionRate: number;
  safetyScore: number;
  publishedAt: Date;
};

type ScorePostInput = {
  userInterestTopicIds: string[];
  followedAuthorIds: string[];
  now: Date;
  post: RankablePost;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function hoursSince(now: Date, publishedAt: Date): number {
  return Math.max(0, (now.getTime() - publishedAt.getTime()) / 3_600_000);
}

export function scorePostForUser(input: ScorePostInput): number {
  const { userInterestTopicIds, followedAuthorIds, now, post } = input;
  const interestMatches = post.topicIds.filter((topicId) =>
    userInterestTopicIds.includes(topicId),
  ).length;
  const topicScore = Math.min(interestMatches, 3) * 22;
  const followScore = followedAuthorIds.includes(post.authorId) ? 18 : 0;
  const engagementScore =
    Math.log1p(post.likeCount) * 4 +
    Math.log1p(post.replyCount) * 6 +
    Math.log1p(post.repostCount) * 5;
  const completionScore = clamp(post.listenCompletionRate, 0, 1) * 20;
  const freshnessScore = Math.max(0, 16 - hoursSince(now, post.publishedAt) * 0.75);
  const safetyPenalty = clamp(post.safetyScore, 0, 1) * 120;

  return topicScore + followScore + engagementScore + completionScore + freshnessScore - safetyPenalty;
}
```

- [ ] **Step 9: Verify ranking tests pass**

Run:

```bash
npm test -- tests/feedRanking.test.ts
```

Expected: PASS.

- [ ] **Step 10: Write failing interests tests**

Create `tests/interests.test.ts`:

```ts
import { CONTROLLED_TOPICS, normalizeSelectedInterests } from '../src/features/onboarding/interests';

describe('normalizeSelectedInterests', () => {
  it('keeps only known unique topics', () => {
    expect(normalizeSelectedInterests(['tech', 'music', 'tech', 'unknown'])).toEqual([
      'tech',
      'music',
    ]);
  });

  it('exposes controlled topics for onboarding', () => {
    expect(CONTROLLED_TOPICS).toContainEqual({ id: 'tech', label: 'Tech' });
    expect(CONTROLLED_TOPICS).toContainEqual({ id: 'other', label: 'Other' });
  });
});
```

- [ ] **Step 11: Run failing interests tests**

Run:

```bash
npm test -- tests/interests.test.ts
```

Expected: FAIL because `src/features/onboarding/interests.ts` does not exist.

- [ ] **Step 12: Implement interests helper**

Create `src/features/onboarding/interests.ts`:

```ts
export type ControlledTopic = {
  id: string;
  label: string;
};

export const CONTROLLED_TOPICS: ControlledTopic[] = [
  { id: 'tech', label: 'Tech' },
  { id: 'music', label: 'Music' },
  { id: 'sports', label: 'Sports' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'comedy', label: 'Comedy' },
  { id: 'business', label: 'Business' },
  { id: 'news', label: 'News' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'education', label: 'Education' },
  { id: 'health', label: 'Health' },
  { id: 'culture', label: 'Culture' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'local', label: 'Local' },
  { id: 'other', label: 'Other' },
];

const topicIds = new Set(CONTROLLED_TOPICS.map((topic) => topic.id));

export function normalizeSelectedInterests(selectedTopicIds: string[]): string[] {
  return Array.from(new Set(selectedTopicIds)).filter((topicId) => topicIds.has(topicId));
}
```

- [ ] **Step 13: Run all tests**

Run:

```bash
npm test
npm run typecheck
```

Expected: all tests and TypeScript checks pass.

- [ ] **Step 14: Commit domain helpers**

Run:

```bash
git add jest.config.js src/features tests
git commit -m "Add feed and onboarding domain helpers"
```

Expected: commit succeeds.

## Task 3: Add Supabase Schema Contract

**Files:**
- Create: `supabase/migrations/202604190001_initial_schema.sql`

- [ ] **Step 1: Create initial schema migration**

Create `supabase/migrations/202604190001_initial_schema.sql`:

```sql
create type public.post_status as enum (
  'processing',
  'published',
  'rejected',
  'needs_review',
  'processing_failed'
);

create type public.moderation_decision as enum (
  'approved',
  'rejected',
  'escalated'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-zA-Z0-9_]{3,24}$'),
  display_name text not null check (char_length(display_name) between 1 and 60),
  bio text not null default '' check (char_length(bio) <= 180),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.topics (
  id text primary key,
  label text not null unique,
  created_at timestamptz not null default now()
);

insert into public.topics (id, label) values
  ('tech', 'Tech'),
  ('music', 'Music'),
  ('sports', 'Sports'),
  ('gaming', 'Gaming'),
  ('comedy', 'Comedy'),
  ('business', 'Business'),
  ('news', 'News'),
  ('lifestyle', 'Lifestyle'),
  ('education', 'Education'),
  ('health', 'Health'),
  ('culture', 'Culture'),
  ('relationships', 'Relationships'),
  ('local', 'Local'),
  ('other', 'Other');

create table public.profile_interests (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  topic_id text not null references public.topics(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (profile_id, topic_id)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_post_id uuid references public.posts(id) on delete cascade,
  audio_path text not null,
  duration_ms integer not null check (duration_ms > 0 and duration_ms <= 300000),
  transcript text,
  language text,
  status public.post_status not null default 'processing',
  safety_score numeric(5,4) not null default 0 check (safety_score >= 0 and safety_score <= 1),
  moderation_summary text,
  published_at timestamptz,
  like_count integer not null default 0 check (like_count >= 0),
  reply_count integer not null default 0 check (reply_count >= 0),
  repost_count integer not null default 0 check (repost_count >= 0),
  listen_count integer not null default 0 check (listen_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_posts_have_publish_time check (
    (status = 'published' and published_at is not null)
    or (status <> 'published')
  )
);

create table public.post_topics (
  post_id uuid not null references public.posts(id) on delete cascade,
  topic_id text not null references public.topics(id) on delete restrict,
  confidence numeric(5,4) not null check (confidence >= 0 and confidence <= 1),
  primary key (post_id, topic_id)
);

create table public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag text not null check (char_length(tag) between 2 and 40),
  confidence numeric(5,4) not null check (confidence >= 0 and confidence <= 1),
  primary key (post_id, tag)
);

create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint users_cannot_follow_themselves check (follower_id <> following_id)
);

create table public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table public.reposts (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 80),
  details text not null default '' check (char_length(details) <= 500),
  created_at timestamptz not null default now(),
  constraint report_has_target check (
    (post_id is not null and profile_id is null)
    or (post_id is null and profile_id is not null)
  )
);

create table public.listen_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  post_id uuid not null references public.posts(id) on delete cascade,
  listened_ms integer not null check (listened_ms >= 0),
  completion_rate numeric(5,4) not null check (completion_rate >= 0 and completion_rate <= 1),
  created_at timestamptz not null default now()
);

create table public.moderation_reviews (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  reviewer_id uuid references public.profiles(id) on delete set null,
  decision public.moderation_decision,
  notes text not null default '' check (char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index posts_published_at_idx on public.posts (published_at desc) where status = 'published';
create index posts_author_published_idx on public.posts (author_id, published_at desc) where status = 'published';
create index posts_parent_idx on public.posts (parent_post_id);
create index post_topics_topic_idx on public.post_topics (topic_id, confidence desc);
create index listen_events_user_created_idx on public.listen_events (user_id, created_at desc);
create index moderation_reviews_pending_idx on public.moderation_reviews (created_at asc) where decision is null;

alter table public.profiles enable row level security;
alter table public.topics enable row level security;
alter table public.profile_interests enable row level security;
alter table public.posts enable row level security;
alter table public.post_topics enable row level security;
alter table public.post_tags enable row level security;
alter table public.follows enable row level security;
alter table public.likes enable row level security;
alter table public.reposts enable row level security;
alter table public.reports enable row level security;
alter table public.listen_events enable row level security;
alter table public.moderation_reviews enable row level security;

create policy "profiles are readable" on public.profiles for select using (true);
create policy "users insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "topics are readable" on public.topics for select using (true);

create policy "users read own interests" on public.profile_interests for select using (auth.uid() = profile_id);
create policy "users manage own interests" on public.profile_interests for insert with check (auth.uid() = profile_id);
create policy "users remove own interests" on public.profile_interests for delete using (auth.uid() = profile_id);

create policy "published posts are readable" on public.posts for select using (status = 'published');
create policy "users create processing posts" on public.posts for insert with check (
  auth.uid() = author_id and status = 'processing'
);
create policy "users read own posts" on public.posts for select using (auth.uid() = author_id);

create policy "published post topics are readable" on public.post_topics for select using (
  exists (
    select 1 from public.posts
    where posts.id = post_topics.post_id and posts.status = 'published'
  )
);

create policy "published post tags are readable" on public.post_tags for select using (
  exists (
    select 1 from public.posts
    where posts.id = post_tags.post_id and posts.status = 'published'
  )
);

create policy "follows are readable" on public.follows for select using (true);
create policy "users follow as themselves" on public.follows for insert with check (auth.uid() = follower_id);
create policy "users unfollow as themselves" on public.follows for delete using (auth.uid() = follower_id);

create policy "likes are readable" on public.likes for select using (true);
create policy "users like as themselves" on public.likes for insert with check (auth.uid() = user_id);
create policy "users unlike as themselves" on public.likes for delete using (auth.uid() = user_id);

create policy "reposts are readable" on public.reposts for select using (true);
create policy "users repost as themselves" on public.reposts for insert with check (auth.uid() = user_id);
create policy "users remove reposts as themselves" on public.reposts for delete using (auth.uid() = user_id);

create policy "users create reports" on public.reports for insert with check (auth.uid() = reporter_id);
create policy "users read own reports" on public.reports for select using (auth.uid() = reporter_id);

create policy "users create own listen events" on public.listen_events for insert with check (
  auth.uid() = user_id or user_id is null
);

create policy "moderation reviews hidden from clients" on public.moderation_reviews for select using (false);
```

- [ ] **Step 2: Validate migration locally**

Run:

```bash
npx supabase db reset
```

Expected: local Supabase applies the migration successfully. If Supabase CLI is not installed, install it or use the project's chosen Supabase workflow before continuing.

- [ ] **Step 3: Commit schema**

Run:

```bash
git add supabase/migrations/202604190001_initial_schema.sql
git commit -m "Add initial Supabase schema"
```

Expected: commit succeeds.

## Task 4: Add Environment And Supabase Client

**Files:**
- Create: `.env.example`
- Create: `src/lib/env.ts`
- Create: `src/lib/supabase.ts`

- [ ] **Step 1: Create environment example**

Create `.env.example`:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 2: Create environment loader**

Create `src/lib/env.ts`:

```ts
type PublicEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

function readRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getPublicEnv(): PublicEnv {
  return {
    supabaseUrl: readRequiredEnv('EXPO_PUBLIC_SUPABASE_URL'),
    supabaseAnonKey: readRequiredEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  };
}
```

- [ ] **Step 3: Create Supabase client**

Create `src/lib/supabase.ts`:

```ts
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import { getPublicEnv } from './env';

const env = getPublicEnv();

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

- [ ] **Step 4: Typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit environment and client**

Run:

```bash
git add .env.example src/lib
git commit -m "Add Supabase client configuration"
```

Expected: commit succeeds.

## Task 5: Add Navigation Shell And Theme

**Files:**
- Create: `app/_layout.tsx`
- Create: `app/(tabs)/_layout.tsx`
- Create: `src/styles/theme.ts`

- [ ] **Step 1: Create theme**

Create `src/styles/theme.ts`:

```ts
export const theme = {
  colors: {
    background: '#f8f3ea',
    surface: '#fffaf1',
    ink: '#1e1a16',
    muted: '#766b5f',
    border: '#e4d6c3',
    accent: '#d64f2a',
    accentDark: '#8f2f18',
    positive: '#19744b',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    md: 16,
    lg: 24,
  },
};
```

- [ ] **Step 2: Create root layout**

Create `app/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { theme } from '@/styles/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: theme.colors.background },
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.ink,
        }}
      >
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/onboarding" options={{ title: 'Choose interests' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
```

- [ ] **Step 3: Create tab layout**

Create `app/(tabs)/_layout.tsx`:

```tsx
import { Tabs } from 'expo-router';

import { theme } from '@/styles/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.ink,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'For You' }} />
      <Tabs.Screen name="following" options={{ title: 'Following' }} />
      <Tabs.Screen name="compose" options={{ title: 'Record' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
```

- [ ] **Step 4: Typecheck navigation**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit navigation shell**

Run:

```bash
git add app src/styles/theme.ts
git commit -m "Add native navigation shell"
```

Expected: commit succeeds.

## Task 6: Add Auth And Onboarding Screens

**Files:**
- Create: `src/features/auth/authState.ts`
- Create: `app/(auth)/login.tsx`
- Create: `app/(auth)/onboarding.tsx`

- [ ] **Step 1: Create auth helpers**

Create `src/features/auth/authState.ts`:

```ts
import { supabase } from '@/lib/supabase';

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}
```

- [ ] **Step 2: Create login screen**

Create `app/(auth)/login.tsx`:

```tsx
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { signInWithEmail, signUpWithEmail } from '@/features/auth/authState';
import { theme } from '@/styles/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(mode: 'login' | 'signup') {
    setLoading(true);
    const result =
      mode === 'login'
        ? await signInWithEmail(email.trim(), password)
        : await signUpWithEmail(email.trim(), password);
    setLoading(false);

    if (result.error) {
      Alert.alert('Auth failed', result.error.message);
      return;
    }

    router.replace('/(auth)/onboarding');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Yap</Text>
      <Text style={styles.subtitle}>A social feed where every post has a voice.</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder="Email"
        style={styles.input}
        value={email}
      />
      <TextInput
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
      />
      <Pressable disabled={loading} onPress={() => submit('login')} style={styles.primaryButton}>
        <Text style={styles.primaryText}>Log in</Text>
      </Pressable>
      <Pressable disabled={loading} onPress={() => submit('signup')} style={styles.secondaryButton}>
        <Text style={styles.secondaryText}>Create account</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  logo: {
    color: theme.colors.ink,
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: -3,
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 18,
    marginBottom: theme.spacing.xl,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    color: theme.colors.ink,
    fontSize: 16,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  primaryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  secondaryText: {
    color: theme.colors.accentDark,
    fontSize: 16,
    fontWeight: '700',
  },
});
```

- [ ] **Step 3: Create onboarding screen**

Create `app/(auth)/onboarding.tsx`:

```tsx
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CONTROLLED_TOPICS, normalizeSelectedInterests } from '@/features/onboarding/interests';
import { supabase } from '@/lib/supabase';
import { theme } from '@/styles/theme';

export default function OnboardingScreen() {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);

  function toggleTopic(topicId: string) {
    setSelectedTopicIds((current) =>
      current.includes(topicId)
        ? current.filter((id) => id !== topicId)
        : [...current, topicId],
    );
  }

  async function finishOnboarding() {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;

    if (!userId) {
      return;
    }

    await supabase.from('profiles').upsert({
      id: userId,
      username: username.trim(),
      display_name: displayName.trim() || username.trim(),
    });

    const interests = normalizeSelectedInterests(selectedTopicIds);
    await supabase.from('profile_interests').upsert(
      interests.map((topicId) => ({
        profile_id: userId,
        topic_id: topicId,
      })),
    );

    router.replace('/(tabs)');
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Tune your first feed</Text>
      <Text style={styles.subtitle}>Pick the voices and topics you want to hear first.</Text>
      <TextInput
        onChangeText={setUsername}
        placeholder="Username"
        style={styles.input}
        value={username}
      />
      <TextInput
        onChangeText={setDisplayName}
        placeholder="Display name"
        style={styles.input}
        value={displayName}
      />
      <View style={styles.topicGrid}>
        {CONTROLLED_TOPICS.map((topic) => {
          const selected = selectedTopicIds.includes(topic.id);
          return (
            <Pressable
              key={topic.id}
              onPress={() => toggleTopic(topic.id)}
              style={[styles.topicButton, selected && styles.topicButtonSelected]}
            >
              <Text style={[styles.topicText, selected && styles.topicTextSelected]}>
                {topic.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable onPress={finishOnboarding} style={styles.primaryButton}>
        <Text style={styles.primaryText}>Enter Yap</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  title: {
    color: theme.colors.ink,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 17,
    marginBottom: theme.spacing.lg,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    color: theme.colors.ink,
    fontSize: 16,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  topicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  topicButton: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  topicButtonSelected: {
    backgroundColor: theme.colors.ink,
    borderColor: theme.colors.ink,
  },
  topicText: {
    color: theme.colors.ink,
    fontWeight: '700',
  },
  topicTextSelected: {
    color: '#ffffff',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  primaryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});
```

- [ ] **Step 4: Run checks**

Run:

```bash
npm test
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit auth and onboarding**

Run:

```bash
git add app src/features/auth supabase/migrations/202604190001_initial_schema.sql
git commit -m "Add auth and onboarding screens"
```

Expected: commit succeeds.

## Task 7: Add Feed And Post Card Shell

**Files:**
- Create: `src/components/TopicChip.tsx`
- Create: `src/components/PostCard.tsx`
- Create: `app/(tabs)/index.tsx`
- Create: `app/(tabs)/following.tsx`

- [ ] **Step 1: Create topic chip component**

Create `src/components/TopicChip.tsx`:

```tsx
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/styles/theme';

type TopicChipProps = {
  label: string;
};

export function TopicChip({ label }: TopicChipProps) {
  return (
    <View style={styles.chip}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: '#f1dfc9',
    borderRadius: 999,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  text: {
    color: theme.colors.accentDark,
    fontSize: 12,
    fontWeight: '800',
  },
});
```

- [ ] **Step 2: Create post card component**

Create `src/components/PostCard.tsx`:

```tsx
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/styles/theme';
import { TopicChip } from './TopicChip';

export type FeedPost = {
  id: string;
  creatorName: string;
  handle: string;
  durationLabel: string;
  transcriptPreview: string;
  topicLabels: string[];
  likeCount: number;
  replyCount: number;
  repostCount: number;
};

type PostCardProps = {
  post: FeedPost;
};

export function PostCard({ post }: PostCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.creator}>{post.creatorName}</Text>
          <Text style={styles.handle}>@{post.handle}</Text>
        </View>
        <Text style={styles.duration}>{post.durationLabel}</Text>
      </View>
      <View style={styles.waveform}>
        <Text style={styles.waveformText}>voice waveform</Text>
      </View>
      <Text style={styles.transcript} numberOfLines={2}>
        {post.transcriptPreview}
      </Text>
      <View style={styles.topicRow}>
        {post.topicLabels.map((label) => (
          <TopicChip key={label} label={label} />
        ))}
      </View>
      <View style={styles.actions}>
        <Pressable>
          <Text style={styles.actionText}>Like {post.likeCount}</Text>
        </Pressable>
        <Pressable>
          <Text style={styles.actionText}>Reply {post.replyCount}</Text>
        </Pressable>
        <Pressable>
          <Text style={styles.actionText}>Repost {post.repostCount}</Text>
        </Pressable>
        <Pressable>
          <Text style={styles.actionText}>Report</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  creator: {
    color: theme.colors.ink,
    fontSize: 17,
    fontWeight: '800',
  },
  handle: {
    color: theme.colors.muted,
  },
  duration: {
    color: theme.colors.muted,
    fontWeight: '700',
  },
  waveform: {
    alignItems: 'center',
    backgroundColor: '#261b14',
    borderRadius: theme.radius.md,
    height: 72,
    justifyContent: 'center',
    marginVertical: theme.spacing.md,
  },
  waveformText: {
    color: '#f7d19c',
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  transcript: {
    color: theme.colors.ink,
    fontSize: 15,
    lineHeight: 21,
  },
  topicRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  actionText: {
    color: theme.colors.accentDark,
    fontWeight: '800',
  },
});
```

- [ ] **Step 3: Create For You feed screen**

Create `app/(tabs)/index.tsx`:

```tsx
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { FeedPost, PostCard } from '@/components/PostCard';
import { theme } from '@/styles/theme';

const SAMPLE_POSTS: FeedPost[] = [
  {
    id: 'post-1',
    creatorName: 'Maya Chen',
    handle: 'maya',
    durationLabel: '0:42',
    transcriptPreview: 'I think voice posts make social apps feel more human because tone finally comes through.',
    topicLabels: ['Tech', 'Culture'],
    likeCount: 18,
    replyCount: 4,
    repostCount: 2,
  },
  {
    id: 'post-2',
    creatorName: 'Dev Patel',
    handle: 'devp',
    durationLabel: '1:08',
    transcriptPreview: 'Quick thought on building better morning routines without turning your life into a spreadsheet.',
    topicLabels: ['Lifestyle', 'Health'],
    likeCount: 9,
    replyCount: 3,
    repostCount: 1,
  },
];

export default function ForYouScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>For You</Text>
        <Text style={styles.title}>Fresh voices matched to your interests.</Text>
      </View>
      {SAMPLE_POSTS.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  hero: {
    marginBottom: theme.spacing.lg,
  },
  kicker: {
    color: theme.colors.accent,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.ink,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -1,
  },
});
```

- [ ] **Step 4: Create Following feed screen**

Create `app/(tabs)/following.tsx`:

```tsx
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/styles/theme';

export default function FollowingScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.emptyState}>
        <Text style={styles.title}>Follow people to build this feed.</Text>
        <Text style={styles.body}>
          The Following feed will show published voice posts from creators you follow.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  emptyState: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.lg,
  },
  title: {
    color: theme.colors.ink,
    fontSize: 24,
    fontWeight: '900',
  },
  body: {
    color: theme.colors.muted,
    fontSize: 16,
    lineHeight: 22,
    marginTop: theme.spacing.sm,
  },
});
```

- [ ] **Step 5: Run checks**

Run:

```bash
npm test
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit feed shell**

Run:

```bash
git add app src/components
git commit -m "Add voice feed shell"
```

Expected: commit succeeds.

## Task 8: Add Composer And Profile Shells

**Files:**
- Create: `app/(tabs)/compose.tsx`
- Create: `app/(tabs)/profile.tsx`

- [ ] **Step 1: Create composer shell**

Create `app/(tabs)/compose.tsx`:

```tsx
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/styles/theme';

type ComposerState = 'idle' | 'recording' | 'preview' | 'submitting' | 'processing';

export default function ComposeScreen() {
  const [state, setState] = useState<ComposerState>('idle');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Record a yap</Text>
      <Text style={styles.subtitle}>Voice is the post. Transcript and moderation happen after upload.</Text>
      <View style={styles.recorder}>
        <Text style={styles.stateText}>{state}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable onPress={() => setState('recording')} style={styles.primaryButton}>
          <Text style={styles.primaryText}>Start recording</Text>
        </Pressable>
        <Pressable onPress={() => setState('preview')} style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>Stop and preview</Text>
        </Pressable>
        <Pressable onPress={() => setState('processing')} style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>Submit for review</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  title: {
    color: theme.colors.ink,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  recorder: {
    alignItems: 'center',
    backgroundColor: '#241811',
    borderRadius: 140,
    height: 240,
    justifyContent: 'center',
    marginVertical: theme.spacing.lg,
    width: 240,
  },
  stateText: {
    color: '#ffd49a',
    fontSize: 20,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  actions: {
    gap: theme.spacing.md,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  primaryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.md,
  },
  secondaryText: {
    color: theme.colors.accentDark,
    fontSize: 16,
    fontWeight: '900',
  },
});
```

- [ ] **Step 2: Create profile shell**

Create `app/(tabs)/profile.tsx`:

```tsx
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { signOut } from '@/features/auth/authState';
import { theme } from '@/styles/theme';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>Y</Text>
      </View>
      <Text style={styles.name}>Your profile</Text>
      <Text style={styles.handle}>@username</Text>
      <View style={styles.stats}>
        <Text style={styles.stat}>0 followers</Text>
        <Text style={styles.stat}>0 following</Text>
        <Text style={styles.stat}>0 yaps</Text>
      </View>
      <Text style={styles.body}>Published voice posts will appear here after moderation.</Text>
      <Pressable onPress={signOut} style={styles.signOutButton}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: theme.colors.ink,
    borderRadius: 44,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 42,
    fontWeight: '900',
  },
  name: {
    color: theme.colors.ink,
    fontSize: 32,
    fontWeight: '900',
    marginTop: theme.spacing.md,
  },
  handle: {
    color: theme.colors.muted,
    fontSize: 16,
  },
  stats: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginVertical: theme.spacing.lg,
  },
  stat: {
    color: theme.colors.ink,
    fontWeight: '800',
  },
  body: {
    color: theme.colors.muted,
    fontSize: 16,
    lineHeight: 22,
  },
  signOutButton: {
    alignItems: 'center',
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
  },
  signOutText: {
    color: theme.colors.accentDark,
    fontWeight: '900',
  },
});
```

- [ ] **Step 3: Run checks**

Run:

```bash
npm test
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit composer and profile shell**

Run:

```bash
git add app
git commit -m "Add composer and profile shells"
```

Expected: commit succeeds.

## Task 9: Document Commands

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Update command documentation**

Modify the Build, Test, and Development Commands section in `AGENTS.md` to include:

```md
- `npm install` to install dependencies.
- `npm run start` to start Expo.
- `npm run ios` to run the iOS target through Expo.
- `npm run android` to run the Android target through Expo.
- `npm test` to run Jest tests.
- `npm run typecheck` to run TypeScript checks.
```

- [ ] **Step 2: Run checks**

Run:

```bash
npm test
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit docs**

Run:

```bash
git add AGENTS.md
git commit -m "Document Expo development commands"
```

Expected: commit succeeds. If `AGENTS.md` is intentionally kept untracked by the user, skip this commit and report that command documentation still needs a tracked README or approved AGENTS.md commit.

## Final Verification

- [ ] **Step 1: Check repository state**

Run:

```bash
git status --short
```

Expected: only intentional untracked local files remain.

- [ ] **Step 2: Run full verification**

Run:

```bash
npm test
npm run typecheck
```

Expected: all tests and type checks pass.

- [ ] **Step 3: Start Expo**

Run:

```bash
npm run start
```

Expected: Expo starts and shows QR/dev-server instructions. Stop the server after confirming startup.

- [ ] **Step 4: Summarize phase completion**

Report:

```text
Foundation phase complete: Expo app scaffolded, Supabase schema contract added, auth/onboarding/feed/composer/profile shells implemented, and domain tests passing.
Next recommended plan: moderation worker and real audio upload pipeline.
```
