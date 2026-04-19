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
