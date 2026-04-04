const fs = require('fs');
let l = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
const R = '\r';

// FIX 1 ? Add missing useEffect after loadMaterials callback
let insertAfter = -1;
for (let i = 0; i < l.length; i++) {
  if (l[i].includes('loadQCCheckpoints()') && l[i].includes('useEffect')) {
    insertAfter = i; break;
  }
}
if (insertAfter > -1) {
  l.splice(insertAfter + 1, 0, "  React.useEffect(() => { if (activeTab === 'materials') loadMaterials() }, [activeTab, loadMaterials])" + R);
  console.log('useEffect inserted after line:', insertAfter + 1);
} else {
  console.log('WARN: QC useEffect not found for anchor');
}

// FIX 2 ? Fix insert to use correct column names (notes instead of logged_by, no logged_at)
let c = l.join('\n');

c = c.replace(
  "      logged_by: matForm.logged_by.trim() || null,\r\n      logged_at: new Date().toISOString(),",
  "      notes: matForm.logged_by.trim() || null,"
);

// FIX 3 ? Fix display to use created_at instead of logged_at, notes instead of logged_by
c = c.replace(
  "{m.logged_by || '-'}",
  "{m.notes || '-'}"
);
c = c.replace(
  "{m.logged_at ? new Date(m.logged_at).toLocaleString('en-ZA', { dateStyle: 'short', timeStyle: 'short' }) : '-'}",
  "{m.created_at ? new Date(m.created_at).toLocaleString('en-ZA', { dateStyle: 'short', timeStyle: 'short' }) : '-'}"
);

// FIX 4 ? Fix order query (no logged_at column)
c = c.replace(
  ".order('logged_at', { ascending: false })",
  ".order('created_at', { ascending: false })"
);

fs.writeFileSync('src/App.tsx', c, 'utf8');
const final = fs.readFileSync('src/App.tsx', 'utf8');
console.log('logged_at gone:', !final.includes('logged_at'));
console.log('notes used:', final.includes("notes: matForm.logged_by"));
console.log('useEffect present:', final.includes("loadMaterials()") && final.includes("useEffect"));
console.log('Done');
