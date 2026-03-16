const fs = require('fs');

const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');
let count = 0;

function replace(old, neu, label) {
  if (content.includes(old)) {
    content = content.replace(old, neu);
    console.log('PASS:', label);
    count++;
  } else {
    console.log('FAIL:', label);
  }
}

// 1. Rename nav label
replace(
  'label="Work Order Board" description="Work Order pipeline"',
  'label="RFQ Board" description="RFQ pipeline"',
  'Nav label renamed'
);

// 2. Rename board heading
replace(
  `{activeBoard === 'rfq' ? 'Work Order Board' : 'Job Board'}`,
  `{activeBoard === 'rfq' ? 'RFQ Board' : 'Job Board'}`,
  'Board heading renamed'
);

// 3. Rename board subtitle
replace(
  `{activeBoard === 'rfq' ? 'Work Order to job creation - sales pipeline' : 'Job created to paid - project tracking'}`,
  `{activeBoard === 'rfq' ? 'RFQ to job creation - sales pipeline' : 'Job created to paid - project tracking'}`,
  'Board subtitle renamed'
);

// 4. Rename New Work Order button
replace(
  `New Work Order`,
  `New RFQ`,
  'New button renamed'
);

// 5. Rename breadcrumb
replace(
  `{activeBoard === 'rfq' ? 'Work Order Board' : 'Job Board'}`,
  `{activeBoard === 'rfq' ? 'RFQ Board' : 'Job Board'}`,
  'Breadcrumb renamed'
);

// 6. Rename modal title
replace(
  `<h2 className="text-lg font-bold text-gray-900">New Work Order</h2>`,
  `<h2 className="text-lg font-bold text-gray-900">New RFQ</h2>`,
  'Modal title renamed'
);

// 7. Rename save button
replace(
  `{saving ? 'Creating...' : 'Create Work Order'}`,
  `{saving ? 'Creating...' : 'Create RFQ'}`,
  'Save button renamed'
);

// 8. Rename Work Order Details section header in RFQ detail panel
replace(
  `<p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Work Order Details</p>`,
  `<p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">RFQ Details</p>`,
  'Section header renamed'
);

// 9. Remove auto-generated WO number - replace with manual RFQ number input
// The auto-gen block creates WO-26-XXXX, we remove it and use form.rfq_no instead
replace(
  `const enqNumber = \`WO-26-\${String((count || 0) + 1).padStart(4, '0')}\``,
  `const enqNumber = form.rfq_no || \`ENQ-\${String((count || 0) + 1).padStart(4, '0')}\``,
  'Auto WO number replaced with form input'
);

// 10. Fix card label - "Work Order No" → "RFQ No"
replace(
  `<span className="text-xs text-gray-500 block">Work Order No</span>`,
  `<span className="text-xs text-gray-500 block">RFQ No</span>`,
  'Card label renamed'
);

// 11. Direct job modal subtitle
replace(
  `<p className="text-indigo-200 text-xs mt-0.5">Direct Work Order (No RFQ)</p>`,
  `<p className="text-indigo-200 text-xs mt-0.5">Direct Job (No RFQ)</p>`,
  'Direct job subtitle renamed'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log(`\n${count} replacements made`);
console.log('Now check the New RFQ modal - we need to add an RFQ Number input field');
console.log('Run: node -e "const l=require(\'fs\').readFileSync(\'src/App.tsx\',\'utf8\').split(\'\\n\');l.forEach((x,i)=>{if(x.includes(\'Description\')&&i>1050&&i<1120)console.log(i+1+\': \'+x)})"');
