const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const oldCard = `                  <p className="text-xs font-bold text-green-600">{job.job_number || 'Pending'}</p>`;
const newCard = `                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-bold text-green-600">{job.job_number || 'Pending'}</p>
                    {job.entry_type === 'DIRECT' && <span className="text-xs font-bold px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded">DIRECT</span>}
                  </div>`;

if (content.includes(oldCard)) {
  content = content.replace(oldCard, newCard);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('PASS: DIRECT badge added');
} else {
  console.log('FAIL: target string not found');
}
console.log('Done - run: npx vite --force');
