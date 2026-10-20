/**
 * Utility to extract clean, consistent initials from full names,
 * stripping academic titles and honorifics (e.g. Dr., Prof., S.Pd., M.Pd., etc.)
 */
export function getUserInitials(name?: string): string {
  if (!name || typeof name !== 'string') return 'U';

  // 1. Remove academic degrees after comma (e.g. ", S.Pd., M.Pd.", ", M.Kom.", ", Ph.D.")
  let cleanName = name.split(',')[0].trim();

  // 2. Remove common Indonesian prefix titles (Prof., Dr., Dra., Drs., Ir., H., Hj., K.H., Ust.)
  const titleRegex = /^(prof\.?|dr\.?|dra\.?|drs\.?|ir\.?|h\.?|hj\.?|k\.h\.?|ust\.?)\s+/i;
  while (titleRegex.test(cleanName)) {
    cleanName = cleanName.replace(titleRegex, '').trim();
  }

  // 3. Extract words containing letters
  const words = cleanName
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z]/g, ''))
    .filter((w) => w.length > 0);

  if (words.length >= 2) {
    // First letter of first name + first letter of second name
    return (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }

  // Fallback to alphanumeric characters
  const fallback = name.replace(/[^a-zA-Z]/g, '');
  return (fallback.substring(0, 2) || 'U').toUpperCase();
}
