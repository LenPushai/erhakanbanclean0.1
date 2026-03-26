const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const oldStr = `        <div className="grid grid-cols-2 gap-4 text-sm">
          {job.site_req && <div><span className="text-xs text-gray-500 block">Site Req / PO</span><span className="font-medium">{job.site_req}</span></div>}
          {job.rfq_no && <div><span className="text-xs text-gray-500 block">RFQ No</span><span className="font-medium text-blue-600">{job.rfq_no}</span></div>}
          {job.due_date && <div><span className="text-xs text-gray-500 block">Due Date</span><span className="font-medium">{new Date(job.due_date).toLocaleDateString('en-ZA')}</span></div>}
          {job.created_at && <div><span className="text-xs text-gray-500 block">Created</span><span className="font-medium">{new Date(job.created_at).toLocaleDateString('en-ZA')}</span></div>}
          {job.parent_job_id && <div><span className="text-xs text-gray-500 block">Parent Job</span><span className="font-medium text-purple-600">{job.rfq_no || job.parent_job_id.slice(0,8)}</span></div>}
        </div>`;

const newStr = `        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Client Information</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-xs text-gray-500 block">Client</span><span className="font-semibold text-gray-900">{job.client_name || '—'}</span></div>
            <div><span className="text-xs text-gray-500 block">RFQ No</span><span className="font-semibold text-blue-600">{job.rfq_no || '—'}</span></div>
            <div><span className="text-xs text-gray-500 block">Contact Person</span><span className="font-medium">{(job as any).contact_person || '—'}</span></div>
            <div><span className="text-xs text-gray-500 block">Contact Phone</span><span className="font-medium">{(job as any).contact_phone || '—'}</span></div>
            <div><span className="text-xs text-gray-500 block">Site / PO</span><span className="font-medium">{(job as any).site_req || '—'}</span></div>
            <div><span className="text-xs text-gray-500 block">Due Date</span><span className="font-medium text-red-600">{job.due_date ? new Date(job.due_date).toLocaleDateString('en-ZA') : '—'}</span></div>
            <div><span className="text-xs text-gray-500 block">Date Received</span><span className="font-medium">{(job as any).date_received ? new Date((job as any).date_received).toLocaleDateString('en-ZA') : '—'}</span></div>
            <div><span className="text-xs text-gray-500 block">Priority</span><span className={\`font-bold text-xs px-2 py-0.5 rounded \${job.priority === 'URGENT' ? 'bg-red-100 text-red-700' : job.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}\`}>{job.priority}</span></div>
            {(job as any).operating_entity && <div><span className="text-xs text-gray-500 block">Operating Entity</span><span className="font-medium">{(job as any).operating_entity}</span></div>}
            {job.parent_job_id && <div><span className="text-xs text-gray-500 block">Parent Job</span><span className="font-medium text-purple-600">{job.rfq_no || job.parent_job_id.slice(0,8)}</span></div>}
          </div>
          {(job as any).special_requirements && (
            <div><span className="text-xs text-gray-500 block mb-1">Special Requirements</span>
            <p className="text-sm text-gray-800 bg-white rounded px-2 py-1 border border-blue-100">{(job as any).special_requirements}</p></div>
          )}
        </div>`;

if (content.includes(oldStr.split('\n')[0].trim())) {
  const updated = content.replace(oldStr, newStr);
  if (updated !== content) {
    fs.writeFileSync('src/App.tsx', updated, 'utf8');
    console.log('PASS: Client info section added to JobDetailPanel');
  } else {
    console.log('FAIL: String match failed - CRLF issue likely');
    // Try CRLF version
    const crlfOld = oldStr.replace(/\n/g, '\r\n');
    const updated2 = content.replace(crlfOld, newStr);
    if (updated2 !== content) {
      fs.writeFileSync('src/App.tsx', updated2, 'utf8');
      console.log('PASS: Fixed with CRLF match');
    } else {
      console.log('FAIL: Both LF and CRLF failed');
    }
  }
} else {
  console.log('FAIL: Target string not found in file');
}
