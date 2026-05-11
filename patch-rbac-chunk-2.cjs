// patch-rbac-chunk-2.cjs
//
// ADR-009 Phase 1 RBAC — Chunk 2: swap six existing inline role gates
// to use the canWrite() helper from Chunk 1.
//
// REPLACEMENTS (ordered: most-specific first to avoid substring collisions)
//
//   1. PODetailModal       Log Delivery, parenthesised: (CHARLES || HENDRIK)
//   2. PurchaseOrdersTab   Log Delivery, unparen:        CHARLES || HENDRIK
//   3. RFQCard             Send-for-Approval:            (HENDRIK || JUANIC) on currentRole
//   4. RFQDetailPanel      Send-for-Approval:            (HENDRIK || JUANIC) on role
//   5. PR approve/reject   + PO close:                   HENDRIK on currentRole (×2)
//   6. Assign Quoter gate:                               HENDRIK on role (×1)
//
// SAFETY
//   - Pre-flight: counts every pattern up front (sequentially applied on a
//     dry-run copy). Aborts before any write if any count doesn't match.
//   - Chunk 1 prerequisite: aborts if helpers (canWriteRFQ / TIER_BY_ROLE)
//     are missing — Chunk 2 cannot run without them.
//   - Idempotency guard: aborts if Chunk 2 already applied (counts the
//     canWrite() call-sites; 4+ means already done).
//   - Backup: src/App.tsx.bak.chunk2 written before write.
//
// USAGE (CMD, from project root):
//   node patch-rbac-chunk-2.cjs
//
// POST-RUN
//   git diff src/App.tsx
//   npm run build
//   npm run dev      # smoke: Jeanic can now do Log Delivery, PR approve, PO close, Assign Quoter
//   git add -p src/App.tsx patch-rbac-chunk-2.cjs
//   git commit -m "ADR-009 Chunk 2: six existing gate swaps to use canWrite helper"

const fs = require('fs')
const path = require('path')

const APP_TSX = path.join('src', 'App.tsx')
const BACKUP = APP_TSX + '.bak.chunk2'

if (!fs.existsSync(APP_TSX)) {
  console.error(`ERROR: ${APP_TSX} not found. Run from project root.`)
  process.exit(1)
}

let source = fs.readFileSync(APP_TSX, 'utf8')
const originalSource = source

// ---------------------------------------------------------------------------
// Chunk 1 prerequisite check
// ---------------------------------------------------------------------------
if (!source.includes('canWriteRFQ') || !source.includes('TIER_BY_ROLE')) {
  console.error('ABORT: Chunk 1 has not been applied.')
  console.error('       Helpers (canWriteRFQ / TIER_BY_ROLE) not found in src/App.tsx.')
  console.error('       Apply Chunk 1 first: node patch-rbac-chunk-1.cjs')
  process.exit(1)
}

function abort(reason) {
  console.error(`ABORT: ${reason}`)
  console.error('No changes written. Original file untouched.')
  process.exit(1)
}

// Count literal substring occurrences (regex-free, no escaping concerns)
function count(str, sub) {
  return str.split(sub).length - 1
}

// ---------------------------------------------------------------------------
// Idempotency guard — if helpers are already being CALLED in gate sites,
// Chunk 2 has been (or partially been) applied.
// Chunk 1 leaves 0 call-sites. Chunk 2 produces 7. Threshold 4 is safely
// in between.
// ---------------------------------------------------------------------------
const callSiteCount = count(source, 'canWrite(role)') + count(source, 'canWrite(currentRole)')
if (callSiteCount >= 4) {
  console.error('ABORT: Chunk 2 appears already applied.')
  console.error(`       canWrite() call-sites detected: ${callSiteCount} (expected 0 before Chunk 2).`)
  console.error('       Inspect git history if unexpected.')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Replacement definitions
// Order matters: more-specific (longer, with parens) patterns first.
// expectedCount is measured AT THE POINT OF EACH REPLACEMENT, not pre-flight.
// ---------------------------------------------------------------------------
const REPLACEMENTS = [
  {
    name: 'PODetailModal Log Delivery (parenthesised CHARLES|HENDRIK)',
    pattern: "(currentRole === 'CHARLES' || currentRole === 'HENDRIK')",
    replacement: 'canWrite(currentRole)',
    expectedCount: 1,
  },
  {
    name: 'PurchaseOrdersTab Log Delivery (unparen CHARLES|HENDRIK)',
    pattern: "currentRole === 'CHARLES' || currentRole === 'HENDRIK'",
    replacement: 'canWrite(currentRole)',
    expectedCount: 1,
  },
  {
    name: 'RFQCard Send-for-Approval (HENDRIK|JUANIC on currentRole)',
    pattern: "(currentRole === 'HENDRIK' || currentRole === 'JUANIC')",
    replacement: 'canWrite(currentRole)',
    expectedCount: 1,
  },
  {
    name: 'RFQDetailPanel Send-for-Approval (HENDRIK|JUANIC on role)',
    pattern: "(role === 'HENDRIK' || role === 'JUANIC')",
    replacement: 'canWrite(role)',
    expectedCount: 1,
  },
  {
    name: 'PR approve/reject + PO close (HENDRIK on currentRole)',
    pattern: "currentRole === 'HENDRIK'",
    replacement: 'canWrite(currentRole)',
    expectedCount: 2,
  },
  {
    name: 'Assign Quoter gate (HENDRIK on role)',
    pattern: "role === 'HENDRIK'",
    replacement: 'canWrite(role)',
    expectedCount: 1,
  },
]

// ---------------------------------------------------------------------------
// Dry run — apply sequentially on a copy, validate every expected count
// BEFORE any real write. If any step's count is off, abort.
// ---------------------------------------------------------------------------
let dryRun = source
for (const r of REPLACEMENTS) {
  const c = count(dryRun, r.pattern)
  if (c !== r.expectedCount) {
    abort(`Pre-flight pattern count mismatch.
       Step:     ${r.name}
       Pattern:  ${r.pattern}
       Expected: ${r.expectedCount}
       Found:    ${c}
       (App.tsx may have been modified since the audit. Inspect manually before retrying.)`)
  }
  dryRun = dryRun.split(r.pattern).join(r.replacement)
}

console.log('Pre-flight passed: all six expected pattern counts match.')

// ---------------------------------------------------------------------------
// Real run — same sequence, with post-replace residue checks
// ---------------------------------------------------------------------------
let applied = source
const summary = []
for (const r of REPLACEMENTS) {
  const before = count(applied, r.pattern)
  applied = applied.split(r.pattern).join(r.replacement)
  const after = count(applied, r.pattern)
  if (after !== 0) {
    abort(`Post-replace residue for "${r.name}": ${after} occurrences remain after replacement.`)
  }
  summary.push(`  ${before} × ${r.name}`)
}

// ---------------------------------------------------------------------------
// Write (backup first, then patched file)
// ---------------------------------------------------------------------------
fs.writeFileSync(BACKUP, originalSource, 'utf8')
fs.writeFileSync(APP_TSX, applied, 'utf8')

const totalCallSites = count(applied, 'canWrite(role)') + count(applied, 'canWrite(currentRole)')

console.log('')
console.log('Chunk 2 applied successfully.')
console.log('  Backup written:    ' + BACKUP)
console.log('  Patched:           ' + APP_TSX)
console.log('  Gate call-sites:   ' + totalCallSites + ' (expected 7)')
console.log('  Replacements:')
for (const line of summary) console.log(line)
console.log('')
console.log('Next steps:')
console.log('  git diff src/App.tsx')
console.log('  npm run build')
console.log('  npm run dev      # smoke: Jeanic can now do Log Delivery, PR approve, PO close, Assign Quoter')
console.log('  git add -p src/App.tsx patch-rbac-chunk-2.cjs')
console.log('  git commit -m "ADR-009 Chunk 2: six existing gate swaps to use canWrite helper"')
console.log('')
console.log('Manual rollback: cp ' + BACKUP + ' ' + APP_TSX)
