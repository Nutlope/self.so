export function normalizeDate(value: string | Date | null): string {
  if (value === null) return "";
  if (value instanceof Date) {
    return value.toISOString().split('T')[0]; // YYYY-MM-DD format
  }
  const date = new Date(value);
  return isNaN(date.getTime()) ? "" : value; // return empty if invalid
}
