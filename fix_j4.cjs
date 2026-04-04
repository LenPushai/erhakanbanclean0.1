const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

const old1 = "      <strong>Approved date:</strong> 2022/12/06<br>\r\n      <strong>Revision:</strong> 1<br>\r\n      <strong>Next Revision date:</strong> 2023/12/06<br>\r\n      <strong>Form no:</strong> QCL JC 001\r";
const new1 = "      <strong>Client:</strong> ${val(job.client_name)}<br>\r\n      <strong>Date Received:</strong> ${val(job.date_received)}<br>\r\n      <strong>Due Date:</strong> ${val(job.due_date)}\r";

if (c.includes(old1)) {
  c = c.replace(old1, new1);
  console.log('J4 OK - QC dates removed');
} else {
  console.log('J4 WARN - still not found, dumping lines 306-311');
  const l = c.split('\n');
  [305,306,307,308,309,310].forEach(i => console.log(i+1+': '+JSON.stringify(l[i])));
}

fs.writeFileSync('src/App.tsx', c, 'utf8');
const final = fs.readFileSync('src/App.tsx', 'utf8');
console.log('QC dates gone:', !final.includes('2022/12/06'));
console.log('Done');
