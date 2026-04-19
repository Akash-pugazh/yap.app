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
