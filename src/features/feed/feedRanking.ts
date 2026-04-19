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

  return (
    topicScore + followScore + engagementScore + completionScore + freshnessScore - safetyPenalty
  );
}
