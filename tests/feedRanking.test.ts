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
