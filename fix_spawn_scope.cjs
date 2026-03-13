const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/App.tsx');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');
let pass = 0;

// Find handleSpawnJob wherever it currently is and remove it
let spawnStart = -1, spawnEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const handleSpawnJob = async')) { spawnStart = i; }
  if (spawnStart >= 0 && spawnEnd === -1 && i > spawnStart + 2) {
    if (lines[i].trim() === '}' && lines[i+1] !== undefined && lines[i+1].trim() === '') {
      spawnEnd = i;
      break;
    }
  }
}

if (spawnStart === -1) { console.log('FAIL: handleSpawnJob not found'); process.exit(1); }
console.log('Found handleSpawnJob at lines', spawnStart+1, '-', spawnEnd+1);

// Extract the block
const spawnBlock = lines.splice(spawnStart, spawnEnd - spawnStart + 2); // +2 for blank line
console.log('Extracted', spawnBlock.length, 'lines');
pass++;

// Now find spawning state inside JobDetailPanel and insert handleSpawnJob after showMsg
const showMsgIdx = lines.findIndex(l => l.includes("const showMsg = (m: string)"));
if (showMsgIdx === -1) { console.log('FAIL: showMsg not found'); process.exit(1); }
console.log('Inserting after showMsg at line', showMsgIdx+1);

// Insert spawn block after showMsg function (3 lines: const + body + closing })
lines.splice(showMsgIdx + 3, 0, '', ...spawnBlock.filter(l => l.trim() !== '' || true));
pass++;

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
const out = fs.readFileSync(filePath, 'utf8');
console.log('');
console.log('Total lines:', out.split('\n').length);

// Verify handleSpawnJob is now inside JobDetailPanel
const outLines = out.split('\n');
const jdpIdx = outLines.findIndex(l => l.includes('function JobDetailPanel'));
const spawnIdx = outLines.findIndex(l => l.includes('const handleSpawnJob'));
const createDirectIdx = outLines.findIndex(l => l.includes('function CreateDirectJobModal'));
console.log('JobDetailPanel at line:', jdpIdx+1);
console.log('handleSpawnJob at line:', spawnIdx+1);
console.log('CreateDirectJobModal at line:', createDirectIdx+1);
console.log(spawnIdx > jdpIdx && spawnIdx < createDirectIdx ? 'PASS: handleSpawnJob is inside JobDetailPanel' : 'FAIL: wrong scope');
console.log('Done - run: npx vite --force');
