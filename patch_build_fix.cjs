const fs = require('fs');

const filePath = 'src/App.tsx';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// 1. Fix form.rfq_no — add rfq_no to the form initial state
const formInitIdx = lines.findIndex(l => l.includes('client_rfq_number:') && l.includes("''"));
console.log('Form init at line:', formInitIdx + 1);
if (formInitIdx >= 0) {
  // Check if rfq_no already in form state
  const formBlock = lines.slice(Math.max(0, formInitIdx - 20), formInitIdx + 5).join('\n');
  if (!formBlock.includes("rfq_no: ''")) {
    lines.splice(formInitIdx, 0, "    rfq_no: '',");
    console.log('PASS: rfq_no added to form state');
  } else {
    console.log('PASS: rfq_no already in form state');
  }
} else {
  console.log('FAIL: form init not found');
}

// 2. Fix logo - the inline base64 in the patch_job_card_print.cjs created a 
// massive string literal. Replace with a shorter reference approach.
// Find the logoHtml line in handlePrintJobCard
const logoHtmlIdx = lines.findIndex(l => l.includes("const logoHtml = '") && l.includes('data:image/png;base64,'));
console.log('logoHtml line:', logoHtmlIdx + 1);

if (logoHtmlIdx >= 0) {
  // Read the actual logo
  let logoB64 = '';
  if (fs.existsSync('public/erha-logo.png')) {
    logoB64 = fs.readFileSync('public/erha-logo.png').toString('base64');
  }
  const logoSrc = logoB64 ? `data:image/png;base64,${logoB64}` : '';
  
  if (logoSrc) {
    lines[logoHtmlIdx] = `    const logoHtml = \`<img src="${logoSrc}" alt="ERHA" style="height:50px">\``;
  } else {
    lines[logoHtmlIdx] = `    const logoHtml = '<div style="font-size:16pt;font-weight:900;color:#1e3a5f">ERHA</div>'`;
  }
  console.log('PASS: logoHtml fixed');
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Done - run: npm run build');
