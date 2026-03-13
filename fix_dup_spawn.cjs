const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/App.tsx');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Find both occurrences of handleSpawnJob
const occurrences = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const handleSpawnJob = async')) occurrences.push(i);
}
console.log('Found handleSpawnJob at lines:', occurrences.map(i => i+1));

if (occurrences.length < 2) { console.log('No duplicate found'); process.exit(0); }

// Remove the SECOND occurrence and its block
const start = occurrences[1];
// Find end of this function - look for closing } followed by blank line or next const
let end = start;
let depth = 0;
let started = false;
for (let i = start; i < lines.length; i++) {
  for (const ch of lines[i]) {
    if (ch === '{') { depth++; started = true; }
    if (ch === '}') depth--;
  }
  if (started && depth === 0) { end = i; break; }
}
// Also remove trailing blank line
if (lines[end+1] && lines[end+1].trim() === '') end++;

console.log('Removing lines', start+1, 'to', end+1);
lines.splice(start, end - start + 1);

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Total lines:', lines.length);
console.log('Done - run: npx vite --force');
