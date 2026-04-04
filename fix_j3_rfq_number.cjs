const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

// FIX 1 ? Add client_rfq_number to job insert
const old1 = `        operating_entity: rfq.operating_entity || null,`;
const new1 = `        operating_entity: rfq.operating_entity || null,
        client_rfq_number: rfq.client_rfq_number || null,`;
if (c.includes(old1)) {
  c = c.replace(old1, new1);
  console.log('FIX 1 OK - client_rfq_number added to job insert');
} else {
  console.log('FIX 1 WARN - target not found');
}

// FIX 2 ? Print card: replace rfq_no with client_rfq_number
const old2 = `<td style="border:1px solid #000;padding:3px 6px"><strong>RFQ:</strong><br>${'$'}{val(job.rfq_no)}</td>`;
const new2 = `<td style="border:1px solid #000;padding:3px 6px"><strong>Client RFQ:</strong><br>${'$'}{val(job.client_rfq_number || job.rfq_no)}</td>`;
if (c.includes(old2)) {
  c = c.replace(old2, new2);
  console.log('FIX 2 OK - print card RFQ field updated');
} else {
  console.log('FIX 2 WARN - target not found');
}

// FIX 3 ? Job detail panel: show client_rfq_number label
const old3 = `{job.rfq_no && <div><span className="text-xs text-gray-500 block">RFQ No</span><span className="font-medium text-blue-600">{job.rfq_no}</span></div>}`;
const new3 = `{(job.client_rfq_number || job.rfq_no) && <div><span className="text-xs text-gray-500 block">Client RFQ No</span><span className="font-medium text-blue-600">{job.client_rfq_number || job.rfq_no}</span></div>}`;
if (c.includes(old3)) {
  c = c.replace(old3, new3);
  console.log('FIX 3 OK - job detail panel RFQ label updated');
} else {
  console.log('FIX 3 WARN - target not found');
}

fs.writeFileSync('src/App.tsx', c, 'utf8');
console.log('Done');
