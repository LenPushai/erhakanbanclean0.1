// patch_d10_d4_print_actions.cjs (v3)
// D10: Print template's hardcoded action list misses newer dropdown values
// D4:  "WELDING FOOD" -> "WELDING RODS" typo
const fs = require('fs');
const path = require('path');

const FILE = path.join('src', 'App.tsx');
const original = fs.readFileSync(FILE, 'utf8');

if (original.includes('D10 hotfix: render union of legacy booleans and dynamic JSONB')) {
    console.log('SKIP: patch already present');
    process.exit(0);
}

let patched = original;
let appliedCount = 0;

// CHANGE 1 (D10) — Replace hardcoded action grid with dynamic union renderer
const C1_RE = /<div class="actions-grid"><div class="action-cell \$\{job\.action_manufacture[\s\S]*?Installation<\/div><\/div>/;

const C1_NEW = `<div class="actions-grid">\${(() => {
    // D10 hotfix: render union of legacy booleans and dynamic JSONB so newer
    // dropdown values (Machining, Supply, Prepare Material, Other) print.
    const allLabels = ['Manufacture','Service','Repair','Modify','Cut','Sandblast','Paint','Installation','Machining','Supply','Prepare Material','Other'];
    const j = job;
    const labelToBool = {
      'Manufacture': j.action_manufacture, 'Service': j.action_service,
      'Repair': j.action_repair, 'Modify': j.action_modify, 'Cut': j.action_cut,
      'Sandblast': j.action_sandblast, 'Paint': j.action_paint,
      'Installation': j.action_installation, 'Machining': j.action_machining,
      'Prepare Material': j.action_prepare_material, 'Other': j.action_other,
    };
    const labelAliases = { 'Cut': ['Cut','Cutting'], 'Modify': ['Modify','Modification'] };
    const dynamic = Array.isArray(j.actions_required_dynamic) ? j.actions_required_dynamic : [];
    const isTicked = (label) => {
      if (labelToBool[label]) return true;
      const aliases = labelAliases[label] || [label];
      return aliases.some(a => dynamic.includes(a));
    };
    return allLabels.map(label =>
      '<div class="action-cell ' + (isTicked(label)?'checked':'unchecked') + '">' + (isTicked(label)?'<span class=chk>&#10003;</span>':'&#9744;') + ' ' + label + '</div>'
    ).join('');
  })()}</div>`;

if (C1_RE.test(patched)) {
    patched = patched.replace(C1_RE, C1_NEW);
    appliedCount++;
    console.log('OK: change 1 applied (D10 dynamic action grid)');
} else {
    console.error('FAIL: change 1 regex did not match');
    console.error('Run line-758-dump.cjs to inspect the actual bytes');
    process.exit(1);
}

// CHANGE 2 (D4) — Fix "WELDING FOOD" typo
const C2_OLD = 'ALL WELDING FOOD MUST BE DRIED PRIOR TO WELDING.';
const C2_NEW = 'ALL WELDING RODS MUST BE DRIED PRIOR TO WELDING.';

if (patched.includes(C2_OLD)) {
    patched = patched.replace(C2_OLD, C2_NEW);
    appliedCount++;
    console.log('OK: change 2 applied (D4 WELDING RODS typo fix)');
} else {
    console.error('FAIL: change 2 anchor not found (D4)');
    process.exit(1);
}

if (patched === original) {
    console.error('FAIL: no changes applied');
    process.exit(1);
}

fs.writeFileSync(FILE, patched, 'utf8');
console.log('OK: ' + appliedCount + ' changes applied to src/App.tsx');
console.log('Next: npm run build && npx vercel --prod');