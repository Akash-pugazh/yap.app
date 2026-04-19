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
