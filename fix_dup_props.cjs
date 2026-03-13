const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/App.tsx');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Find the JobBoard render line
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<JobBoard jobs={jobs}') && lines[i].includes('onCardClick') && lines[i].includes('selectedId')) {
    console.log('Found at line:', i + 1);
    console.log('Before:', lines[i]);
    // Replace the whole line with clean version
    lines[i] = "             : <JobBoard jobs={jobs} loading={jobsLoading} onStatusChange={handleJobStatusChange} onPrintCard={handlePrintJobCard} onCardClick={setSelectedJob} selectedId={selectedJob?.id} />}";
    console.log('After:', lines[i]);
    break;
  }
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Done - run: npx vite --force');
