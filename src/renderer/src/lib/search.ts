export interface TextMatch {
  readonly start: number;
  readonly end: number;
}

export const findTextMatches = (value: string, query: string): readonly TextMatch[] => {
  if (!query) return [];
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const expression = new RegExp(escaped, "giu");
  return Array.from(value.matchAll(expression), (match) => ({
    start: match.index,
    end: match.index + match[0].length,
  }));
};
