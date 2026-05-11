// patch-rbac-chunk-1.cjs
//
// ADR-009 Phase 1 RBAC — Chunk 1 (CRLF-aware)
//   1. Insert RoleTier + TIER_BY_ROLE + getTier + canWrite + canWriteRFQ
//      helpers immediately after the ROLE_DISPLAY_NAMES constant.
//   2. Remove the six dormant role entries from the RoleSelector inline
//      array (SONJA, CHARLES, JACO, ELSJE, ALWYN, ZACH).
//   3. Correct Cherise's entry: label 'Reception' → 'Administration',
//      initials 'RC' → 'AD' (color preserved).
//
// USAGE (CMD, from project root):
//   node patch-rbac-chunk-1.cjs
//
// SAFETY
//   - Idempotent: aborts cleanly if Chunk 1 already applied
//   - Defensive: aborts and aborts before writing if any anchor doesn't match
//   - Backup written to src/App.tsx.bak before write
//   - EOL-aware: detects CRLF vs LF and emits matching line endings
//   - BOM-safe: regexes don't operate at file-start; UTF-8 BOM preserved
//
// POST-RUN
//   git diff src/App.tsx     # review every change
//   npm run build            # verify TypeScript compiles
//   npm run dev              # picker should show 4 roles; Cherise = "AD"
//   git add -p src/App.tsx   # selective stage (plus this script)
//   git commit -m "ADR-009 Chunk 1: helpers + RoleSelector trim + Cherise label"

const fs = require('fs')
const path = require('path')

const APP_TSX = path.join('src', 'App.tsx')
const BACKUP = APP_TSX + '.bak'

// ---------------------------------------------------------------------------
// Pre-flight
// ---------------------------------------------------------------------------

if (!fs.existsSync(APP_TSX)) {
  console.error(`ERROR: ${APP_TSX} not found. Run from project root.`)
  process.exit(1)
}

let source = fs.readFileSync(APP_TSX, 'utf8')
const originalSource = source

// Detect file's line ending. WebStorm/Windows projects typically use CRLF.
// All inserted text and all anchor regexes must honour this to avoid
// mixed-EOL pollution and to avoid silent anchor mismatch.
const EOL = source.includes('\r\n') ? '\r\n' : '\n'

// Normalize a template-literal text block (which always uses \n in source)
// to match the file's actual EOL convention.
function toFileEol(text) {
  return EOL === '\n' ? text : text.replace(/\n/g, EOL)
}

// Idempotency guard — abort if Chunk 1 already applied
if (source.includes('const TIER_BY_ROLE') || source.includes('canWriteRFQ')) {
  console.error('ABORT: Chunk 1 already applied (TIER_BY_ROLE or canWriteRFQ found).')
  console.error('Nothing to do. Inspect git history if this is unexpected.')
  process.exit(1)
}

function abort(reason) {
  console.error(`ABORT: ${reason}`)
  console.error('No changes written. Original file untouched.')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Edit 1 — insert helpers after ROLE_DISPLAY_NAMES
// Anchor regex uses \r?\n so it matches whether the file is LF or CRLF.
// ---------------------------------------------------------------------------

const HELPERS_ANCHOR = /(  ZACH: 'Zach',\r?\n\})/

const HELPERS_TEMPLATE = `

// ───────────────────────────────────────────────────────────
// Phase 1 RBAC (ADR-009)
// Three-tier role model — single source of truth for write permissions.
// FULL    : HENDRIK, JUANIC — all write actions
// QUOTER  : DEWALD          — RFQ writes scoped to his assigned RFQs
// READER  : CHERISE         — no writes anywhere
//
// Dormant roles (SONJA, CHARLES, JACO, ELSJE, ALWYN, ZACH) are
// intentionally absent from TIER_BY_ROLE. getTier() returns null for
// them, which denies all writes via the canWrite* helpers below. They
// remain in VALID_ROLES for backward compatibility with legacy data.
// ───────────────────────────────────────────────────────────

type RoleTier = 'FULL' | 'QUOTER' | 'READER'

const TIER_BY_ROLE: Record<string, RoleTier> = {
  HENDRIK: 'FULL',
  JUANIC:  'FULL',
  DEWALD:  'QUOTER',
  CHERISE: 'READER',
}

function getTier(role: string | null): RoleTier | null {
  return role ? (TIER_BY_ROLE[role] ?? null) : null
}

// Generic write gate. FULL tier only. Used for non-RFQ surfaces:
// Workshop, Settings, Procurement, Supplier/Client CRUD, Job-level edits,
// Direct Job creation, Jarison import.
function canWrite(role: string | null): boolean {
  return getTier(role) === 'FULL'
}

// RFQ-specific write gate. FULL tier always, plus QUOTER (DEWALD) when the
// RFQ is assigned to him. The match is case-sensitive against the
// proper-case string ('Dewald'), NOT the uppercase role key ('DEWALD').
function canWriteRFQ(role: string | null, rfq: { assigned_quoter_name?: string | null }): boolean {
  const tier = getTier(role)
  if (tier === 'FULL') return true
  if (tier === 'QUOTER' && role === 'DEWALD' && rfq.assigned_quoter_name === 'Dewald') return true
  return false
}
`

// Normalize the inserted block to the file's EOL before insertion. Without
// this, a CRLF-terminated file would receive a block of mixed line endings
// (the anchor's CRLF preserved via $1, but every line inside HELPERS using
// LF), causing noisy diffs and git autocrlf warnings.
const HELPERS = toFileEol(HELPERS_TEMPLATE)

if (!HELPERS_ANCHOR.test(source)) {
  abort('ROLE_DISPLAY_NAMES end marker not found. Has App.tsx been modified since the audit?')
}

source = source.replace(HELPERS_ANCHOR, `$1${HELPERS}`)

// ---------------------------------------------------------------------------
// Edit 2 — remove the six dormant role entries from RoleSelector
// Each regex tolerates leading whitespace and either LF or CRLF terminator.
// ---------------------------------------------------------------------------

const DORMANT_KEYS = ['SONJA', 'CHARLES', 'JACO', 'ELSJE', 'ALWYN', 'ZACH']

for (const key of DORMANT_KEYS) {
  const re = new RegExp(`^[ \\t]*\\{ key: '${key}',.*\\r?\\n`, 'm')
  if (!re.test(source)) {
    abort(`Dormant role entry for ${key} not found in RoleSelector.`)
  }
  source = source.replace(re, '')
}

// ---------------------------------------------------------------------------
// Edit 3 — Cherise label/initials correction (color preserved)
// No line-ending in this regex, so CRLF/LF doesn't matter.
// ---------------------------------------------------------------------------

const CHERISE_RE = /\{ key: 'CHERISE', label: 'Reception', initials: 'RC', color: '([^']+)' \},/

const cheriseMatch = source.match(CHERISE_RE)
if (!cheriseMatch) {
  abort('Cherise entry "Reception" not found. Already fixed or modified.')
}

source = source.replace(CHERISE_RE, `{ key: 'CHERISE', label: 'Administration', initials: 'AD', color: '$1' },`)
const preservedColor = cheriseMatch[1]

// ---------------------------------------------------------------------------
// Write (backup first, then patched file)
// ---------------------------------------------------------------------------

fs.writeFileSync(BACKUP, originalSource, 'utf8')
fs.writeFileSync(APP_TSX, source, 'utf8')

console.log('')
console.log('Chunk 1 applied successfully.')
console.log('  File EOL detected: ' + (EOL === '\r\n' ? 'CRLF' : 'LF'))
console.log('  Backup written:    ' + BACKUP)
console.log('  Patched:           ' + APP_TSX)
console.log('  Helpers inserted:  RoleTier, TIER_BY_ROLE, getTier, canWrite, canWriteRFQ')
console.log('  Dormant removed:   SONJA, CHARLES, JACO, ELSJE, ALWYN, ZACH (6 entries)')
console.log('  Cherise:           "Reception" → "Administration", "RC" → "AD" (color ' + preservedColor + ' preserved)')
console.log('')
console.log('Next steps:')
console.log('  git diff src/App.tsx')
console.log('  npm run build')
console.log('  npm run dev      # picker should show 4 roles; Cherise badge = AD')
console.log('  git add -p src/App.tsx patch-rbac-chunk-1.cjs')
console.log('  git commit -m "ADR-009 Chunk 1: helpers + RoleSelector trim + Cherise label"')
console.log('')
console.log('Manual rollback: cp ' + BACKUP + ' ' + APP_TSX)
