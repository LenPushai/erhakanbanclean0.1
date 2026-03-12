const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/App.tsx');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Remove the SECOND occurrence of selectedJob state
let count = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const [selectedJob, setSelectedJob] = useState')) {
    count++;
    if (count === 2) {
      lines.splice(i, 1);
      console.log('PASS: duplicate selectedJob removed at line', i + 1);
      break;
    }
  }
}
if (count < 2) console.log('No duplicate found - already clean');

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Done - run: npx vite --force');
