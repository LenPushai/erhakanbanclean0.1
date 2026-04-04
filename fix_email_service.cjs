const fs = require('fs');
let c = fs.readFileSync('src/emailService.ts', 'utf8');

if (c.includes('/api/send-email')) {
  console.log('URL already updated OK');
} else {
  c = c.replace('https://lvaqqqyjqtguozmdjmfn.supabase.co/functions/v1/send-email', '/api/send-email');
  console.log('URL updated to /api/send-email');
}

const lines = c.split('\n');
const cleaned = lines.filter(l =>
  !l.includes("'apikey'") &&
  !l.includes('"apikey"') &&
  !l.includes("'Authorization': 'Bearer eyJ") &&
  !l.includes('"Authorization": "Bearer eyJ')
);
c = cleaned.join('\n');
console.log('Supabase auth headers removed');

fs.writeFileSync('src/emailService.ts', c, 'utf8');

const final = fs.readFileSync('src/emailService.ts', 'utf8');
console.log('URL correct:', final.includes('/api/send-email'));
console.log('Supabase key gone:', !final.includes('lvaqqqyjqtguozmdjmfn'));
console.log('Done');
