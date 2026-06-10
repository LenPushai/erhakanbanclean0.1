// Single source of truth for the quote-PDF filename rule (R3-03).
//
// One rule everywhere — matchers, UI banners, audit logs, and user
// messages must all agree: a PDF is "the quote PDF" when its filename
// CONTAINS the Pastel quote number, case-insensitive, with both sides
// trimmed, and the file has a .pdf extension. The previous strict
// "filename starts with quote-" rule lived only in the UI and disagreed
// with the server matchers, producing false "not right" warnings.

export function quotePdfMatches(
  fileName: string | null | undefined,
  quoteNumber: string | null | undefined,
): boolean {
  const name = String(fileName || '').trim().toLowerCase()
  const needle = String(quoteNumber || '').trim().toLowerCase()
  if (!name || !needle) return false
  if (!name.endsWith('.pdf')) return false
  return name.includes(needle)
}

// Returns the newest matching attachment, or null. Newest wins via
// created_at (descending); rows without created_at fall back to input
// order, so callers that pre-sort still get their first match.
export function findQuotePdf<T extends { file_name?: string | null; created_at?: string | null }>(
  attachments: T[] | null | undefined,
  quoteNumber: string | null | undefined,
): T | null {
  if (!attachments || attachments.length === 0) return null
  const matches = attachments.filter((a) => quotePdfMatches(a.file_name, quoteNumber))
  if (matches.length === 0) return null
  matches.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
  return matches[0]
}
