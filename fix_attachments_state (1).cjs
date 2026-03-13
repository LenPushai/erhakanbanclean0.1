const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/App.tsx');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Find the lineItems state inside JobDetailPanel
const lineItemsIdx = lines.findIndex(l => l.includes("const [lineItems, setLineItems] = React.useState<any[]>([])"));
console.log('lineItems state at line:', lineItemsIdx + 1);

if (lineItemsIdx === -1) { console.log('FAIL: lineItems state not found'); process.exit(1); }

// Check if attachments already exists nearby
const nearby = lines.slice(lineItemsIdx, lineItemsIdx + 5).join('\n');
if (nearby.includes('attachments, setAttachments')) {
  console.log('PASS: attachments state already exists');
} else {
  lines.splice(lineItemsIdx + 1, 0, "  const [attachments, setAttachments] = React.useState<any[]>([])");
  console.log('PASS: attachments state added at line', lineItemsIdx + 2);
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Total lines:', lines.length);
console.log('Done - run: npx vite --force');
