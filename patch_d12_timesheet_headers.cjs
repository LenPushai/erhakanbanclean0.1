// patch_d12_timesheet_headers.cjs
// D12: Weekly Timesheet header had Sat and Sun missing colspan="2" and missing NT subheaders.
const fs = require('fs');
const path = require('path');

const FILE = path.join('src', 'App.tsx');
const original = fs.readFileSync(FILE, 'utf8');

if (original.includes('<th colspan="2">Sat</th><th colspan="2">Sun</th>')) {
    console.log('SKIP: D12 already patched');
    process.exit(0);
}

// Change 1: header row 1 — add colspan="2" to Sat and Sun
const C1_OLD = '<th colspan="2">Fri</th><th>Sat</th><th>Sun</th><th colspan="2">Total</th>';
const C1_NEW = '<th colspan="2">Fri</th><th colspan="2">Sat</th><th colspan="2">Sun</th><th colspan="2">Total</th>';

// Change 2: header row 2 — fix Sat/Sun subheaders from "OT OT" to "NT OT" "NT OT"
const C2_OLD = '<th>NT</th><th>OT</th><th>NT</th><th>OT</th><th>NT</th><th>OT</th><th>NT</th><th>OT</th><th>NT</th><th>OT</th><th>OT</th><th>OT</th><th>NT</th><th>OT</th>';
const C2_NEW = '<th>NT</th><th>OT</th><th>NT</th><th>OT</th><th>NT</th><th>OT</th><th>NT</th><th>OT</th><th>NT</th><th>OT</th><th>NT</th><th>OT</th><th>NT</th><th>OT</th><th>NT</th><th>OT</th>';

let patched = original;
let count = 0;

if (patched.includes(C1_OLD)) {
    patched = patched.replace(C1_OLD, C1_NEW);
    count++;
    console.log('OK: change 1 applied (Sat/Sun colspan="2" added)');
} else {
    console.error('FAIL: change 1 anchor not found');
    process.exit(1);
}

if (patched.includes(C2_OLD)) {
    patched = patched.replace(C2_OLD, C2_NEW);
    count++;
    console.log('OK: change 2 applied (NT subheaders added for Sat and Sun)');
} else {
    console.error('FAIL: change 2 anchor not found');
    process.exit(1);
}

fs.writeFileSync(FILE, patched, 'utf8');
console.log('OK: ' + count + ' changes applied');
console.log('Next: npm run build && npx vercel --prod');