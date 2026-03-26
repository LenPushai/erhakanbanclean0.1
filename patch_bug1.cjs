const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// Change 1: add editRfqDirection state after editNotes line
const notesIdx = lines.findIndex(l => l.includes('editNotes') && l.includes('useState'));
lines.splice(notesIdx + 1, 0, "  const [editRfqDirection, setEditRfqDirection] = React.useState(rfq.rfq_direction || 'INCOMING')\r");

// Change 2: add rfq_direction to save payload
const saveIdx = lines.findIndex(l => l.includes('special_requirements: editSpecialReqs'));
if (saveIdx === -1) { console.error('ERROR: save line not found'); process.exit(1); }
lines[saveIdx] = lines[saveIdx].replace(
  'special_requirements: editSpecialReqs',
  'rfq_direction: editRfqDirection, special_requirements: editSpecialReqs'
);

// Change 3: add Direction toggle UI before Priority select
const prioIdx = lines.findIndex(l => l.includes('editPriority') && l.includes('label') && l.includes('Priority'));
if (prioIdx === -1) { console.error('ERROR: priority UI line not found'); process.exit(1); }
const dirUI = [
  '              <div>\r',
  '                <label className="text-xs text-gray-500 block mb-1">Direction</label>\r',
  '                <div className="flex gap-2">\r',
  '                  {([\'INCOMING\',\'OUTGOING\']).map(d => (\r',
  '                    <button key={d} type="button" onClick={() => setEditRfqDirection(d)}\r',
  '                      className={`flex-1 py-1 rounded text-xs font-semibold border-2 transition-all ${\r',
  '                        editRfqDirection === d ? \'border-blue-500 bg-blue-50 text-blue-700\' : \'border-gray-200 text-gray-400 hover:border-gray-300\'}`}>\r',
  '                      {d}\r',
  '                    </button>\r',
  '                  ))}\r',
  '                </div>\r',
  '              </div>\r',
];
lines.splice(prioIdx, 0, ...dirUI);

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Bug1 patch complete:');
console.log('  [1] editRfqDirection state added at line ' + (notesIdx + 2));
console.log('  [2] rfq_direction added to save payload');
console.log('  [3] Direction toggle UI inserted before Priority');
