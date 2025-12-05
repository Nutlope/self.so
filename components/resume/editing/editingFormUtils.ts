export function normalizeDate(value: string): string {
  const date = new Date(value);
  return isNaN(date.getTime()) ? "" : value; // return empty if invalid
}
