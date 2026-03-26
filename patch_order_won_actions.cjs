const fs = require('fs');

const content = fs.readFileSync('src/App.tsx', 'utf8');

const oldStr = `        is_parent: false,
        is_child_job: false,
      }).select('id').single()`;

const newStr = `        is_parent: false,
        is_child_job: false,
        action_manufacture: (rfq.actions_required || '').toUpperCase().includes('MANUFACTURE'),
        action_sandblast: (rfq.actions_required || '').toUpperCase().includes('SANDBLAST'),
        action_prepare_material: (rfq.actions_required || '').toUpperCase().includes('PREPARE'),
        action_service: (rfq.actions_required || '').toUpperCase().includes('SERVICE'),
        action_paint: (rfq.actions_required || '').toUpperCase().includes('PAINT'),
        action_repair: (rfq.actions_required || '').toUpperCase().includes('REPAIR'),
        action_installation: (rfq.actions_required || '').toUpperCase().includes('INSTALLATION'),
        action_cut: (rfq.actions_required || '').toUpperCase().includes('CUT'),
        action_modify: (rfq.actions_required || '').toUpperCase().includes('MODIFY'),
        action_other: (rfq.actions_required || '').toUpperCase().includes('OTHER'),
      }).select('id').single()`;

const crlfOld = oldStr.replace(/\n/g, '\r\n');
const crlfNew = newStr.replace(/\n/g, '\r\n');

let updated = content.replace(oldStr, newStr);
if (updated === content) {
  updated = content.replace(crlfOld, crlfNew);
  if (updated === content) {
    console.log('FAIL: string not found');
  } else {
    console.log('PASS: actions added (CRLF)');
  }
} else {
  console.log('PASS: actions added (LF)');
}

fs.writeFileSync('src/App.tsx', updated, 'utf8');
console.log('Done - run: npx vite --force');
