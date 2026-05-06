// US-J4: Convert Compiled By field to a system_dropdowns-backed dropdown
// on both JobDetailPanel (currently hardcoded 2-option select) and
// DirectJob form (currently free-text input).
//
// Date: 2026-05-05
// Tag:  hotfix-jeanic4-compiled-by-dropdown-2026-05-05
//
// Edits (4 total):
//   1) JDP: insert compiledByOptions hook after actionTypeOptions (~line 1360)
//   2) JDP: replace hardcoded <option> block with .map() + legacy fallback
//   3) DJ:  insert compiledByOptions hook after actionTypeOptions (~line 1871)
//   4) DJ:  replace free-text <input> with <select> + .map() + legacy fallback
//
// Source of truth for options: public.system_dropdowns rows where
// dropdown_type='compiled_by'. Seeded by supabase/usj4_compiled_by_dropdown_seed.sql.
// Hardcoded fallback (Cherise, Jeanic, Hendrik) preserves UI behavior if the
// query returns 0 rows (same as the action_types and media_received pattern).
//
// Idempotency sentinel: presence of substring useDropdownOptions('compiled_by'
//   - if found, patch has already been applied; exit clean.

const fs = require('fs');
const path = require('path');
const FILE = path.join('src', 'App.tsx');

let src = fs.readFileSync(FILE, 'utf8');

// Detect original line endings (Windows working trees are typically CRLF
// after Git checkout with core.autocrlf=true). Normalize to LF for anchor
// matching, then restore the original EOL on write.
const originalEol = src.includes('\r\n') ? '\r\n' : '\n';
if (originalEol === '\r\n') {
  src = src.replace(/\r\n/g, '\n');
}

// Idempotency check
if (src.includes("useDropdownOptions('compiled_by'")) {
  console.log('[J4] already applied — useDropdownOptions(\'compiled_by\' found in src/App.tsx');
  process.exit(0);
}

let edits = 0;
function replace(label, anchor, replacement) {
  if (!src.includes(anchor)) {
    console.error('[J4] FAIL anchor missed: ' + label);
    process.exit(1);
  }
  src = src.replace(anchor, replacement);
  edits++;
  console.log('[J4] OK  ' + label);
}

// ---------------------------------------------------------------------
// 1) JDP — insert compiledByOptions hook after actionTypeOptions
//    Anchor uniqueness: the JobDetailPanel function signature on the
//    line preceding actionTypeOptions is unique to this component.
// ---------------------------------------------------------------------
replace(
  '#1 JDP compiledByOptions hook (after line 1360)',
  "function JobDetailPanel({ job, parentJobNumber, activeEntity, onClose, onUpdate }: { job: Job; parentJobNumber?: string; activeEntity: OperatingEntity; onClose: () => void; onUpdate: (j: Job) => void }) {\n  const actionTypeOptions = useDropdownOptions('action_types', ACTIONS_LIST_FALLBACK)\n",
  "function JobDetailPanel({ job, parentJobNumber, activeEntity, onClose, onUpdate }: { job: Job; parentJobNumber?: string; activeEntity: OperatingEntity; onClose: () => void; onUpdate: (j: Job) => void }) {\n  const actionTypeOptions = useDropdownOptions('action_types', ACTIONS_LIST_FALLBACK)\n  const compiledByOptions = useDropdownOptions('compiled_by', ['Cherise', 'Jeanic', 'Hendrik'])\n"
);

// ---------------------------------------------------------------------
// 2) JDP — replace hardcoded <option> block with .map() + legacy fallback
// ---------------------------------------------------------------------
replace(
  '#2 JDP <option> block (lines 1600-1602)',
  '            <option value="">Select...</option>\n            <option value="Cherise">Cherise</option>\n            <option value="Jeanic">Jeanic</option>\n',
  '            <option value="">Select...</option>\n            {compiledByOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}\n            {compiledBy && !compiledByOptions.includes(compiledBy) && (\n              <option value={compiledBy}>{compiledBy}</option>\n            )}\n'
);

// ---------------------------------------------------------------------
// 3) DJ — insert compiledByOptions hook after actionTypeOptions
//    Anchor uniqueness: actionTypeOptions immediately followed by
//    selectedActions state is unique to the DirectJob component
//    (other useDropdownOptions callsites are followed by different state).
// ---------------------------------------------------------------------
replace(
  '#3 DJ compiledByOptions hook (after line 1871)',
  "  const actionTypeOptions = useDropdownOptions('action_types', ACTIONS_LIST_FALLBACK)\n  const [selectedActions, setSelectedActions] = React.useState<Set<string>>(new Set())\n",
  "  const actionTypeOptions = useDropdownOptions('action_types', ACTIONS_LIST_FALLBACK)\n  const compiledByOptions = useDropdownOptions('compiled_by', ['Cherise', 'Jeanic', 'Hendrik'])\n  const [selectedActions, setSelectedActions] = React.useState<Set<string>>(new Set())\n"
);

// ---------------------------------------------------------------------
// 4) DJ — replace free-text <input> with <select> (single-line, indigo
//    theme matching the neighboring Priority <select> on the line above)
// ---------------------------------------------------------------------
replace(
  '#4 DJ <input> -> <select> (line 2000)',
  '            <div><label className="block text-xs font-medium text-gray-600 mb-1">Compiled By</label><input value={compiledBy} onChange={e => setCompiledBy(e.target.value)} placeholder="Name..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>\n',
  '            <div><label className="block text-xs font-medium text-gray-600 mb-1">Compiled By</label><select value={compiledBy} onChange={e => setCompiledBy(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"><option value="">Select...</option>{compiledByOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}{compiledBy && !compiledByOptions.includes(compiledBy) && (<option value={compiledBy}>{compiledBy}</option>)}</select></div>\n'
);

// Restore original line endings before writing
if (originalEol === '\r\n') {
  src = src.replace(/\n/g, '\r\n');
}
fs.writeFileSync(FILE, src);
console.log('[J4] applied ' + edits + ' edits to ' + FILE + ' (eol=' + (originalEol === '\r\n' ? 'CRLF' : 'LF') + ')');