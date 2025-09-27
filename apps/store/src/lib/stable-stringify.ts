export function stableStringify(obj: Record<string, any>): string {
  const sorted = Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {} as Record<string, any>);

  return JSON.stringify(sorted);
}
