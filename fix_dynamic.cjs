const fs = require('fs');

// Fix homepage
let t1 = fs.readFileSync('src/app/(public)/page.jsx', 'utf8');
if (!t1.includes('force-dynamic')) {
  t1 = 'export const dynamic = "force-dynamic"\n\n' + t1;
  fs.writeFileSync('src/app/(public)/page.jsx', t1);
  console.log('Done - page.jsx');
} else {
  console.log('Already done - page.jsx');
}

// Fix inventory page
let t2 = fs.readFileSync('src/app/(public)/inventory/page.jsx', 'utf8');
if (!t2.includes('force-dynamic')) {
  t2 = 'export const dynamic = "force-dynamic"\n\n' + t2;
  fs.writeFileSync('src/app/(public)/inventory/page.jsx', t2);
  console.log('Done - inventory/page.jsx');
} else {
  console.log('Already done - inventory/page.jsx');
}
