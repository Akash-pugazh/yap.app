import {
  CONTROLLED_TOPICS,
  normalizeSelectedInterests,
} from '../src/features/onboarding/interests';

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
