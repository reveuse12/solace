const tables = ["profiles", "desires", "intentions", "reflections", "visualizations", "listening_progress", "favorites", "reminders"];
export function validateBackup(value: unknown): { data: Record<string, Record<string, unknown>[]> } {
  if (!value || typeof value !== "object" || !("data" in value) || !value.data || typeof value.data !== "object" || Array.isArray(value.data)) throw new Error("Choose a Solace JSON backup exported from your account.");
  const source = value.data as Record<string, unknown>; const data: Record<string, Record<string, unknown>[]> = {};
  let count = 0;
  for (const key of tables) {
    if (!(key in source)) continue;
    if (!Array.isArray(source[key])) throw new Error(`The backup's ${key} section is invalid.`);
    if (source[key].length > 10000) throw new Error("The backup is too large to restore on this phone.");
    data[key] = source[key].map((row: unknown) => {
      if (!row || typeof row !== "object" || Array.isArray(row)) throw new Error("The backup contains an invalid record.");
      const result = { ...(row as Record<string, unknown>) };
      delete result.clerk_user_id;
      return result;
    });
    count += data[key].length;
  }
  if (count > 50000) throw new Error("The backup is too large to restore on this phone.");
  if (!count) throw new Error("This backup has no supported records to restore.");
  return { data };
}
