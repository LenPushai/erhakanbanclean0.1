const fs = require('fs');

const filePath = 'src/App.tsx';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Find the logoHtml line and replace with a simple non-conditional version
const logoHtmlIdx = lines.findIndex(l => l.includes('const logoHtml =') && l.includes('data:image/png;base64,'));
console.log('logoHtml at line:', logoHtmlIdx + 1);

if (logoHtmlIdx >= 0) {
  // Read logo
  let logoB64 = '';
  if (fs.existsSync('public/erha-logo.png')) {
    logoB64 = fs.readFileSync('public/erha-logo.png').toString('base64');
  }
  // Write as a simple const, no ternary - TypeScript won't complain
  if (logoB64) {
    lines[logoHtmlIdx] = `    const logoB64 = '${logoB64}'`;
    lines.splice(logoHtmlIdx + 1, 0, `    const logoHtml = '<img src="data:image/png;base64,' + logoB64 + '" alt="ERHA" style="height:50px">'`);
  } else {
    lines[logoHtmlIdx] = `    const logoHtml = '<div style="font-size:16pt;font-weight:900;color:#1e3a5f">ERHA</div>'`;
  }
  console.log('PASS: logoHtml fixed - no more ternary');
} else {
  console.log('FAIL: logoHtml line not found');
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Done - run: npm run build');
