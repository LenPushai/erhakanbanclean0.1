const fs = require('fs');
let l = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
const R = '\r';
const newState = [
  "  const [jobMaterials, setJobMaterials] = React.useState<any[]>([])" + R,
  "  const [loadingMaterials, setLoadingMaterials] = React.useState(false)" + R,
  "  const [showMatModal, setShowMatModal] = React.useState(false)" + R,
  "  const [matForm, setMatForm] = React.useState({ description: '', quantity: '', unit: 'EA', logged_by: '' })" + R,
  "  const [savingMat, setSavingMat] = React.useState(false)" + R,
];
l.splice(2494, 0, ...newState);
fs.writeFileSync('src/App.tsx', l.join('\n'), 'utf8');
console.log('State inserted OK, new count:', l.length);
console.log('Verify:', fs.readFileSync('src/App.tsx','utf8').includes('setJobMaterials'));
