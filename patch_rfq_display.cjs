const fs = require('fs');

const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const old = "rfq.enq_number || rfq.rfq_no || '-'";
const neu = "rfq.client_rfq_number || rfq.enq_number || rfq.rfq_no || '-'";

const count = (content.split(old)).length - 1;
content = content.split(old).join(neu);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Replaced', count, 'occurrences - PASS');
console.log('Run: npx vite --force');
