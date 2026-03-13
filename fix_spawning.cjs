const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/App.tsx');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Find JobDetailPanel and add spawning state after the msg state
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("const [msg, setMsg] = React.useState('')") && 
      lines[i-10] && lines.slice(Math.max(0,i-15), i).some(l => l.includes('function JobDetailPanel'))) {
    if (!lines[i+1].includes('spawning')) {
      lines.splice(i + 1, 0, "  const [spawning, setSpawning] = React.useState<string | null>(null)");
      console.log('PASS: spawning state added at line', i + 2);
    } else {
      console.log('PASS: spawning already exists');
    }
    break;
  }
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Done - run: npx vite --force');
