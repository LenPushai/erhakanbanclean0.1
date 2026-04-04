const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// Find the exact line with the Save Order button
let targetLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Save Order - Move to Order Won')) {
    targetLine = i;
    console.log('Found target at line:', i + 1, JSON.stringify(lines[i]));
    break;
  }
}

if (targetLine === -1) {
  console.log('ERROR - target not found');
  process.exit(1);
}

const R = '\r';

// Replace the single button line with two conditional buttons
const oldLine = lines[targetLine];
const indent = '        '; // 8 spaces

const newLines = [
  indent + '{status === \'QUOTED\' && (' + R,
  indent + '  <button onClick={async () => {' + R,
  indent + '    setSaving(true)' + R,
  indent + '    try {' + R,
  indent + '      const { data, error } = await supabase.from(\'rfqs\').update({ status: \'SENT_TO_CUSTOMER\' }).eq(\'id\', rfq.id).select(\'*, clients(company_name)\').single()' + R,
  indent + '      if (error) throw error' + R,
  indent + '      onUpdate(data)' + R,
  indent + '      import(\'./emailService\').then(({ emailQuoteReady }) => emailQuoteReady(data, rfq.assigned_quoter_name || \'\'))' + R,
  indent + '    } catch (err: any) { console.error(err) }' + R,
  indent + '    finally { setSaving(false) }' + R,
  indent + '  }} disabled={saving} className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">' + R,
  indent + '    {saving ? \'Saving...\' : \'Send Quote to Customer - Move to Sent\'}' + R,
  indent + '  </button>' + R,
  indent + ')}' + R,
  indent + '{status === \'SENT_TO_CUSTOMER\' && (' + R,
  indent + '  <button onClick={handleSaveOrder} disabled={saving} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">' + R,
  indent + '    {saving ? \'Saving...\' : \'Save Order - Move to Order Won\'}' + R,
  indent + '  </button>' + R,
  indent + ')}',
];

lines.splice(targetLine, 1, ...newLines);
fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Fix applied OK - new line count:', lines.length);
console.log('Verify QUOTED button:', lines.some(l => l.includes('Send Quote to Customer')));
console.log('Verify SENT button restricted:', lines.some(l => l.includes("status === 'SENT_TO_CUSTOMER' && (")));
