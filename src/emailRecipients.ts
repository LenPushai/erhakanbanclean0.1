// Single source of truth for ERHA people and their mailboxes.
// Consumed by App.tsx INTERNAL_DIRECTORY, emailService.ts routing, and
// SignaturePage NAME_FROM_EMAIL.
//
// Keys are proper-case display names and must match ROLE_DISPLAY_NAMES in
// App.tsx - canWriteRFQ compares them against rfq.assigned_quoter_name.
//
// 4 Aug 2026: extended to every ERHA mailbox so any of them can be chosen
// as a recipient in the Communication Panel. Automatic notification
// routing is defined separately in emailService.ts.
//
// Deferred to a later change request: logistics@erha.co.za (Kobus) and
// admin@erha.co.za (Franci) - both have mailboxes but no role in the app.
//
// Len is kept here so he can be picked deliberately in the composer, but
// he is on no automatic notification.
export const PEOPLE = {
  Hendrik: 'hendrik@erha.co.za',
  Jeanic:  'pa@erha.co.za',
  Cherise: 'reception@erha.co.za',
  Dewald:  'dewald@erha.co.za',
  Jaco:    'jaco@erha.co.za',
  Sonja:   'buyer@erha.co.za',
  Charles: 'shopstore@erha.co.za',
  Zach:    'zach@erha.co.za',
  Gideon:  'sitestores@erha.co.za',
  Elsje:   'siteadmin@erha.co.za',
  Alwyn:   'safety@erha.co.za',
  Kobus:   'logistics@erha.co.za',
  Franci:  'admin@erha.co.za',
  Len:     'lenklopper03@gmail.com',
  Noreply: 'noreply@erha.co.za',
} as const

export const DEFAULT_REPLY_TO = PEOPLE.Jeanic

// Reverse map: email -> display name. Consumers must not assume every
// PEOPLE entry is a valid signer (e.g. Noreply). Every address above is
// unique, so this map is unambiguous - do not introduce a shared mailbox
// without revisiting it, since Object.fromEntries is last-write-wins.
export const EMAIL_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(PEOPLE).map(([name, email]) => [email, name])
)
