/**
 * Compare dotted version strings (e.g. 1.0.3 vs 1.0.10).
 */
export function isVersionLessThan(current: string, minimum: string): boolean {
  const parse = (value: string) =>
    value
      .trim()
      .split('.')
      .map((part) => parseInt(part.replace(/[^0-9].*$/, ''), 10) || 0);

  const currentParts = parse(current);
  const minimumParts = parse(minimum);
  const length = Math.max(currentParts.length, minimumParts.length);

  for (let index = 0; index < length; index += 1) {
    const currentPart = currentParts[index] ?? 0;
    const minimumPart = minimumParts[index] ?? 0;

    if (currentPart < minimumPart) {
      return true;
    }

    if (currentPart > minimumPart) {
      return false;
    }
  }

  return false;
}
