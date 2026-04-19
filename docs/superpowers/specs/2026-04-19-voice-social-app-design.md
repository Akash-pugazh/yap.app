# Voice Social App Design

## Overview

Build a native iOS and Android voice-first social app using Expo React Native. The product is similar to a microblogging social network, but the primary content format is voice. Users create voice posts, listen to posts in personalized feeds, follow creators, like posts, repost posts, and reply with voice.

Text is not a user posting format in the MVP. Transcripts exist for moderation, search, accessibility, topic detection, and recommendation metadata.

## Product Scope

The MVP includes:

- Native iOS and Android app through Expo React Native.
- Supabase auth, profiles, Postgres data, and audio storage.
- Self-hosted open-source worker for transcription, moderation, topic detection, and publish decisions.
- Voice posts and voice-only replies.
- For You, Following, and Profile feeds.
- Likes, reposts, reports, follows, and listen tracking.
- Hybrid topic detection with controlled primary topics and generated secondary tags.
- Minimal protected admin/moderation review surface.

The MVP excludes:

- Trending feed.
- Text posts.
- Direct messages.
- Paid subscriptions.
- Heavy ML recommendation models before usage data exists.

## Architecture

The system has four main parts:

- Expo React Native app: handles native mobile UI, auth screens, recording, playback, feeds, post detail, profiles, and social actions.
- Supabase: handles authentication, Postgres tables, row-level security, private audio storage, and feed queries.
- Self-hosted processing worker: downloads pending audio, transcribes it, moderates the transcript, detects topics/tags, and updates post status.
- Recommendation layer: starts as explainable ranking using stored topic, social, engagement, freshness, and safety signals.

Supabase Edge Functions can be used for lightweight API glue, but heavier speech-to-text and toxicity models should run in the separate worker because they require more compute and operational control.

## Posting Flow

1. User records a voice post or voice reply in the Expo app.
2. App previews playback and lets the user delete or re-record.
3. App uploads the audio to a private `pending-audio` Supabase Storage bucket.
4. App creates a `posts` row with `status = 'processing'`.
5. Worker claims the pending post.
6. Worker transcribes audio with an open-source speech-to-text engine, initially `faster-whisper`.
7. Worker applies deterministic safety rules and Detoxify toxicity scoring to the transcript.
8. Worker detects controlled primary topics and generated secondary tags from the transcript.
9. Worker updates the post to `published`, `rejected`, `needs_review`, or `processing_failed`.
10. Only `published` posts are visible in app feeds.

Replies use the same flow as top-level posts. A reply is represented by a `posts` row with `parent_post_id` set.

## Moderation And Safety

Moderation happens before public visibility. Uploaded audio is private until the worker publishes the post.

Moderation uses:

- Rule-based checks for obvious banned phrases, spam patterns, threats, and known unsafe terms.
- Detoxify scoring for toxicity-related categories on the transcript.
- Transcription confidence and language detection as review signals.
- User reports after publication.
- Manual review for uncertain posts and reported content.

Decision rules:

- Safe posts are published.
- Clearly unsafe posts are rejected.
- Borderline posts go to `needs_review`.
- Processing failures produce `processing_failed` and can be retried by the worker or an admin.
- Reports can create moderation review entries and downrank or hide content depending on severity.

## Topics And Recommendations

Topic detection is hybrid:

- Controlled primary topics support ranking and analytics.
- Generated secondary tags preserve nuance from the transcript.

Initial controlled topics:

- Tech
- Music
- Sports
- Gaming
- Comedy
- Business
- News
- Lifestyle
- Education
- Health
- Culture
- Relationships
- Local
- Other

The For You feed starts with explainable ranking rather than a heavy ML recommender. Ranking inputs include:

- User-selected interests from onboarding.
- Controlled topics detected from transcripts.
- Generated tags.
- Follow affinity.
- Creator affinity from previous listening behavior.
- Listen events and completion rate.
- Likes, replies, and reposts.
- Freshness.
- Safety score and report state.

The system stores listen events from day one so future recommendation versions can add collaborative filtering, embedding search, and creator/topic affinity models after enough real usage exists.

## App Screens

### Onboarding And Auth

Users can sign up, log in, choose a username, add profile details, and select interests. Selected interests seed the For You feed before behavior data exists.

### Home

Home contains For You and Following tabs.

Post cards are audio-first and include:

- Creator identity.
- Topic chips.
- Waveform or progress display.
- Play/pause controls.
- Duration.
- Optional transcript preview.
- Like, voice reply, repost, report, and share actions.

### Composer

The composer supports tap-to-record or press-and-hold recording, preview playback, delete/re-record, and submit. After submission, the app shows processing state until the worker publishes, rejects, or flags the post for review.

### Post Detail

Post detail shows the full voice post, transcript, social actions, replies, and a voice reply composer. Voice replies are moderated through the same pipeline as posts.

### Profile

Profiles show bio information, follower/following counts, follow/unfollow action, voice posts, and optionally replies.

### Admin Moderation

The protected moderation surface shows posts with `needs_review` or report escalations. Reviewers can play audio, read transcripts, inspect moderation scores and detected topics, approve, reject, or take account-level action.

## Data Model

Core tables:

- `profiles`: public user profile data linked to Supabase auth users.
- `posts`: top-level voice posts and voice replies.
- `topics`: controlled primary topic list.
- `post_topics`: detected topic assignments with confidence.
- `post_tags`: generated secondary tags.
- `follows`: follower graph.
- `likes`: post likes.
- `reposts`: repost relationships.
- `reports`: user reports against posts or profiles.
- `listen_events`: playback and completion events for recommendation signals.
- `moderation_reviews`: manual review queue entries and outcomes.

Important `posts` fields:

- `id`
- `author_id`
- `parent_post_id`
- `audio_path`
- `duration_ms`
- `transcript`
- `language`
- `status`
- `safety_score`
- `published_at`
- `like_count`
- `reply_count`
- `repost_count`
- `listen_count`

Post statuses:

- `processing`
- `published`
- `rejected`
- `needs_review`
- `processing_failed`

## Privacy And Access Control

Pending and rejected audio must not be publicly accessible. Published audio should be served through signed URLs or policy-protected storage access. Feed queries must only return `published` posts.

Transcripts are stored because they are required for safety, search, accessibility, and recommendations. The app can collapse transcript previews by default if the intended experience should remain voice-first.

Row-level security should enforce:

- Users can manage their own profile.
- Users can create their own posts.
- Public users can read only published posts.
- Users cannot directly publish posts by bypassing worker decisions.
- Admin-only roles can access moderation queues and unsafe content.

## Error Handling

The app should distinguish recording, upload, submitted, processing, published, rejected, review, and failed states.

If upload fails, the app lets the user retry or discard locally. If upload succeeds but processing fails, the post remains hidden and moves to `processing_failed`. The worker can retry failed jobs. Admins can inspect repeated failures.

If transcription confidence is too low, moderation is uncertain, or topic detection fails in a way that affects safety, the post goes to `needs_review` rather than publishing automatically.

## Testing Strategy

Testing should cover:

- Auth and profile setup.
- Interest selection and profile persistence.
- Recording and upload state transitions.
- Worker status transitions for publish, reject, review, and failure.
- Feed visibility rules, especially that unpublished posts never appear.
- Voice replies using the same processing pipeline as posts.
- For You ranking using topics, interests, follows, listen events, freshness, and safety.
- Reports creating moderation review entries.
- Admin approve and reject outcomes.

## Open Implementation Notes

Use Expo React Native for the mobile app. Use Supabase for auth, database, and storage. Use a self-hosted worker for `faster-whisper`, Detoxify, rule checks, and topic extraction. Start ranking with clear database-backed scoring and store behavior events for later recommendation upgrades.
