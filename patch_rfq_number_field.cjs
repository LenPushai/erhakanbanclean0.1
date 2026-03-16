const fs = require('fs');

const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Add RFQ Number as first prominent field before the grid
const oldSection = `            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Operating Entity</label>`;

const newSection = `            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">RFQ Number <span className="text-red-500">*</span></label>
              <input type="text" value={form.rfq_no} onChange={e => set('rfq_no', e.target.value)} placeholder="e.g. ENQ-26-001" className="w-full border-2 border-blue-400 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-400 mt-1">Enter the ERHA RFQ / Enquiry number — this will appear on the card</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Operating Entity</label>`;

if (content.includes(oldSection)) {
  content = content.replace(oldSection, newSection);
  console.log('PASS: RFQ Number field added');
} else {
  console.log('FAIL: section not found');
}

// Make sure rfq_no is in the initial form state
// Find the form initialisation
const formInit = `rfq_no: '',`;
if (!content.includes(formInit)) {
  // Try to find where form state is set and add rfq_no
  console.log('INFO: check rfq_no is in form state already');
} else {
  console.log('PASS: rfq_no already in form state');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done - run: npx vite --force');
