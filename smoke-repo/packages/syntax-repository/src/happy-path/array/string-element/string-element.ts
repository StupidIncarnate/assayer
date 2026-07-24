export function labelTags(tags: string[]): string[] {
  return tags.map((tag) => {
    if (tag === 'urgent') {
      return 'P1';
    }

    if (tag.length > 8) {
      return 'verbose';
    }

    return 'normal';
  });
}
