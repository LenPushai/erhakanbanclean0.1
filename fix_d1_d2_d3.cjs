const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

// D1+D2 ? Add drawingNumber and rfqReference state after hasDrawing state
const old1 = "const [hasDrawing, setHasDrawing] = React.useState(false)\r\n  const [actions,";
const new1 = "const [hasDrawing, setHasDrawing] = React.useState(false)\r\n  const [drawingNumber, setDrawingNumber] = React.useState('')\r\n  const [rfqReference, setRfqReference] = React.useState('')\r\n  const [directAttachments, setDirectAttachments] = React.useState<Array<{name:string;path:string;size:number}>>( [])\r\n  const [uploadingDirect, setUploadingDirect] = React.useState(false)\r\n  const [actions,";

if (c.includes(old1)) {
  c = c.replace(old1, new1);
  console.log('State added OK');
} else {
  console.log('State WARN - not found');
}

// Add drawing_number, client_rfq_number to insert
const old2 = "has_drawing: hasDrawing,\r\n        action_manufacture:";
const new2 = "has_drawing: hasDrawing,\r\n        drawing_number: drawingNumber.trim() || null,\r\n        client_rfq_number: rfqReference.trim() || null,\r\n        action_manufacture:";
if (c.includes(old2)) {
  c = c.replace(old2, new2);
  console.log('Insert fields OK');
} else {
  console.log('Insert WARN - not found');
}

// D1+D2 ? Add drawing number + RFQ reference fields before Notes
const old3 = "<div className=\"flex items-center gap-2\"><input type=\"checkbox\" id=\"djDrawing\" checked={hasDrawing} onChange={e => setHasDrawing(e.target.checked)} className=\"w-4 h-4\" /><label htmlFor=\"djDrawing\" className=\"text-sm text-gray-700\">Drawing / Sketches Attached</label></div>\r\n        <div><label className=\"block text-xs font-medium text-gray-600 mb-1\">Notes</label>";
const new3 = "<div className=\"flex items-center gap-2\"><input type=\"checkbox\" id=\"djDrawing\" checked={hasDrawing} onChange={e => setHasDrawing(e.target.checked)} className=\"w-4 h-4\" /><label htmlFor=\"djDrawing\" className=\"text-sm text-gray-700\">Drawing / Sketches Attached</label></div>\r\n        <div className=\"grid grid-cols-2 gap-4\">\r\n          <div><label className=\"block text-xs font-medium text-gray-600 mb-1\">Drawing Number</label><input value={drawingNumber} onChange={e => setDrawingNumber(e.target.value)} placeholder=\"DWG-001\" className=\"w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500\" /></div>\r\n          <div><label className=\"block text-xs font-medium text-gray-600 mb-1\">RFQ Reference (optional)</label><input value={rfqReference} onChange={e => setRfqReference(e.target.value)} placeholder=\"Client RFQ number...\" className=\"w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500\" /></div>\r\n        </div>\r\n        <div>\r\n          <label className=\"block text-xs font-medium text-gray-600 mb-2\">Attachments</label>\r\n          <div className=\"border-2 border-dashed border-gray-200 rounded-lg p-4 text-center\">\r\n            <input type=\"file\" multiple id=\"directFileUpload\" className=\"hidden\" onChange={async (e) => {\r\n              const files = Array.from(e.target.files || [])\r\n              if (!files.length) return\r\n              setUploadingDirect(true)\r\n              const uploaded: Array<{name:string;path:string;size:number}> = []\r\n              for (const file of files) {\r\n                const path = `direct/${Date.now()}_${file.name}`\r\n                const { error } = await supabase.storage.from('rfq-attachments').upload(path, file)\r\n                if (!error) uploaded.push({ name: file.name, path, size: file.size })\r\n              }\r\n              setDirectAttachments(a => [...a, ...uploaded])\r\n              setUploadingDirect(false)\r\n            }} />\r\n            <label htmlFor=\"directFileUpload\" className=\"cursor-pointer text-sm text-indigo-600 hover:underline\">{uploadingDirect ? 'Uploading...' : '+ Add files'}</label>\r\n          </div>\r\n          {directAttachments.length > 0 && <div className=\"mt-2 space-y-1\">{directAttachments.map((a,i) => <div key={i} className=\"flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1\"><span>{a.name}</span><button onClick={() => setDirectAttachments(x => x.filter((_,idx)=>idx!==i))} className=\"text-red-400 hover:text-red-600 ml-2\">?</button></div>)}</div>}\r\n        </div>\r\n        <div><label className=\"block text-xs font-medium text-gray-600 mb-1\">Notes</label>";

if (c.includes(old3)) {
  c = c.replace(old3, new3);
  console.log('JSX fields OK');
} else {
  console.log('JSX WARN - not found');
}

fs.writeFileSync('src/App.tsx', c, 'utf8');
console.log('Done');
