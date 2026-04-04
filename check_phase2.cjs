const fs = require('fs');
const c = fs.readFileSync('src/App.tsx', 'utf8');
const hasMojibake = c.includes('\u00f0\u009f"?') || c.includes('\u00e2\u0086') || c.includes('\u00c3\u00a2');
console.log('Has mojibake:', hasMojibake);
console.log('App lines:', c.split('\n').length);
console.log('Has WorkerAssign:', c.includes('handleAssignWorker'));
console.log('Has ClockIn:', c.includes('handleClockIn'));
console.log('Has CASUAL_WORKERS:', c.includes('CASUAL_WORKERS'));
