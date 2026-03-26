const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

// Find the job insert in handleSaveOrder and add action mappings
// The insert has "is_parent: false," as the last field before closing
const oldStr = `        is_parent: false,
        is_child_job: false,
      }).select('id').single()`;

const newStr = `        is_parent: false,
        is_child_job: false,
        action_manufacture:    (rfq.actions_required||'').split(',').includes('MANUFACTURE'),
        action_service:        (rfq.actions_required||'').split(',').includes('SERVICE'),
        action_repair:         (rfq.actions_required||'').split(',').includes('REPAIR'),
        action_sandblast:      (rfq.actions_required||'').split(',').includes('SANDBLAST'),
        action_paint:          (rfq.actions_required||'').split(',').includes('PAINT'),
        action_installation:   (rfq.actions_required||'').split(',').includes('INSTALLATION'),
        action_cut:            (rfq.actions_required||'').split(',').includes('CUT'),
        action_modify:         (rfq.actions_required||'').split(',').includes('MODIFY'),
        action_other:          (rfq.actions_required||'').split(',').includes('OTHER'),
        action_prepare_material: (rfq.actions_required||'').split(',').includes('PREPARE MATERIAL'),
      }).select('id').single()`;

// Try LF first then CRLF
let updated = content.replace(oldStr, newStr);
if (updated !== content) {
  fs.writeFileSync('src/App.tsx', updated, 'utf8');
  console.log('PASS: Action mappings added to Order Won job insert (LF)');
} else {
  const crlfOld = oldStr.replace(/\n/g, '\r\n');
  updated = content.replace(crlfOld, newStr);
  if (updated !== content) {
    fs.writeFileSync('src/App.tsx', updated, 'utf8');
    console.log('PASS: Action mappings added to Order Won job insert (CRLF)');
  } else {
    console.log('FAIL: Target string not found');
    // Show context around is_child_job
    const lines = content.split('\n');
    lines.forEach((l, i) => {
      if (l.includes('is_child_job: false')) console.log(i+1 + ': ' + l);
    });
  }
}
