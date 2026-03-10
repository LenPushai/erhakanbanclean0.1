const fs = require('fs'); 
const content = fs.readFileSync('src/App.tsx', 'utf8'); 
const updated = content.replace(/function JobBoardPlaceholder\(\)[\s\S]*?\n\}/, newComponent); 
fs.writeFileSync('src/App.tsx', updated, 'ascii'); 
console.log('Done - lines:', updated.split('\n').length); 
