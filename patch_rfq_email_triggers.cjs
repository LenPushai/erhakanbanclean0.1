const fs = require('fs');

const filePath = 'src/App.tsx';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// 1. emailRFQCreated — fire after onCreated() at line 1260
const onCreatedIdx = lines.findIndex((l, i) => i > 1200 && l.includes('onCreated()') && lines[i+1].includes('onClose()'));
console.log('onCreated() at line:', onCreatedIdx + 1);
if (onCreatedIdx >= 0) {
  lines.splice(onCreatedIdx, 0, '      emailRFQCreated({ ...rfq, client_name: newClientName.trim() || form.client_id, description: form.description, priority: form.priority, request_date: form.request_date, required_date: form.required_date, rfq_no: enqNumber, client_rfq_number: form.client_rfq_number })');
  console.log('PASS: emailRFQCreated wired');
} else {
  console.log('FAIL: onCreated not found after RFQ insert');
}

// 2. emailQuoterAssigned — fire after handleAssign success at line ~1512
const assignSuccessIdx = lines.findIndex((l, i) => i > 1500 && l.includes('onUpdate(data)') && lines[i-5] && lines[i-5].includes('handleAssign'));
// Simpler - find onUpdate after the PENDING status update
let assignIdx = -1;
for (let i = 1500; i < 1550; i++) {
  if (lines[i] && lines[i].includes('onUpdate(data)') && lines[i-1] && lines[i-1].includes('if (error) throw error')) {
    assignIdx = i;
    break;
  }
}
console.log('handleAssign onUpdate at line:', assignIdx + 1);
if (assignIdx >= 0) {
  lines.splice(assignIdx, 0, '      emailQuoterAssigned(data, selectedQuoter)');
  console.log('PASS: emailQuoterAssigned wired');
} else {
  // fallback - find by context
  const handleAssignIdx = lines.findIndex(l => l.includes('const handleAssign = async'));
  console.log('handleAssign at line:', handleAssignIdx + 1);
  // find the onUpdate inside it
  for (let i = handleAssignIdx; i < handleAssignIdx + 15; i++) {
    if (lines[i] && lines[i].includes('onUpdate(data)')) {
      lines.splice(i, 0, '      emailQuoterAssigned(data, selectedQuoter)');
      console.log('PASS: emailQuoterAssigned wired (fallback)');
      break;
    }
  }
}

// 3. emailQuoteReady — fire after handleSaveQuote success
const saveQuoteIdx = lines.findIndex(l => l.includes("showMsg('Quote saved - card moved to Quoted')"));
console.log('handleSaveQuote showMsg at line:', saveQuoteIdx + 1);
if (saveQuoteIdx >= 0) {
  lines.splice(saveQuoteIdx, 0, '      emailQuoteReady(data)');
  console.log('PASS: emailQuoteReady wired');
} else {
  console.log('FAIL: Quote saved showMsg not found');
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('\nDone - run: npm run build');
