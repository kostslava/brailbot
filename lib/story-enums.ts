export const STORY_THEMES = [
  "adventure",
  "mystery",
  "romance",
  "comedy",
  "horror",
  "history",
  "nature",
  "motivational",
] as const;

export const STORY_AGE_GROUPS = ["children", "teen", "adult"] as const;

export const STORY_MOODS = [
  "uplifting",
  "dark",
  "funny",
  "emotional",
  "neutral",
] as const;

export type StoryTheme = (typeof STORY_THEMES)[number];
export type StoryAgeGroup = (typeof STORY_AGE_GROUPS)[number];
export type StoryMood = (typeof STORY_MOODS)[number];

function normalize<T extends readonly string[]>(
  value: string,
  allowed: T,
  fallback: T[number],
): T[number] {
  const v = value.trim().toLowerCase().replace(/\s+/g, "_");
  if ((allowed as readonly string[]).includes(v)) {
    return v as T[number];
  }
  return fallback;
}

export function coerceClassification(input: {
  theme: string;
  age_group: string;
  mood: string;
  summary: string;
  clean_text: string;
}): {
  theme: StoryTheme;
  age_group: StoryAgeGroup;
  mood: StoryMood;
  summary: string;
  clean_text: string;
} {
  return {
    theme: normalize(input.theme, STORY_THEMES, "adventure"),
    age_group: normalize(input.age_group, STORY_AGE_GROUPS, "adult"),
    mood: normalize(input.mood, STORY_MOODS, "neutral"),
    summary: input.summary.trim(),
    clean_text: input.clean_text.trim(),
  };
}
