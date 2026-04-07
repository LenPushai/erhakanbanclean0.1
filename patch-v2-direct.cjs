const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

const startMarker = 'const html = `<!DOCTYPE html>';
const endMarker = 'const win = window.open';

const s = c.indexOf(startMarker);
const e = c.indexOf(endMarker);

if (s === -1 || e === -1) {
  console.log('FAILED: start=' + s + ' end=' + e);
  process.exit(1);
}

console.log('Found range:', s, 'to', e, '(' + (e - s) + ' chars)');

const newTemplate = fs.readFileSync('jobcard-v2-template.html', 'utf8');
const before = c.substring(0, s);
const after = c.substring(e);

c = before + 'const html = `' + newTemplate + '`;\n    ' + after;

fs.writeFileSync('src/App.tsx', c, 'utf8');
console.log('✅ V2 Job Card injected');
console.log('Verify:', c.includes('job-hero') ? '✅ hero' : '❌', c.includes('hdr-logo') ? '✅ header' : '❌', c.includes('page2') ? '✅ page2' : '❌');
