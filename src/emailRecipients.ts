// US-035 single source of truth people directory.
// Codifies 2026-05-13 routing decisions. App.tsx
// INTERNAL_DIRECTORY, emailService.ts ALL, and
// SignaturePage NAME_FROM_EMAIL all consume PEOPLE.
// Keys are capitalized to match display labels used by
// INTERNAL_DIRECTORY and the manager-stage pre-fill in
// SignaturePage. FROM_EMAIL flip to PEOPLE.Noreply is
// deferred to the US-022 DNS unblock.

export const PEOPLE = {
  Hendrik: 'hendrik@erha.co.za',
  Jeanic:  'pa@erha.co.za',
  Cherise: 'cherise@erha.co.za',
  Dewald:  'dewald@erha.co.za',
  Jaco:    'jaco@erha.co.za',
  Len:     'lenklopper03@gmail.com',
  Noreply: 'noreply@erha.co.za',
} as const

export const DEFAULT_REPLY_TO = PEOPLE.Jeanic

// Reverse map: email -> display name. Consumers must not assume
// every PEOPLE entry is a valid signer (e.g. Noreply).
export const EMAIL_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(PEOPLE).map(([name, email]) => [email, name])
)
