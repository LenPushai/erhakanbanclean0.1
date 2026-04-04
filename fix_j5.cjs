const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

const old1 = "        {job.description && (\r\n          <div>\r\n            <label className=\"block text-xs font-medium text-gray-500 mb-1\">Description</label>\r\n            <p className=\"text-sm text-gray-800 bg-gray-50 rounded-lg px-3 py-2\">{job.description}</p>\r\n          </div>\r\n        )}\r\n        <div>\r\n          <label className=\"block text-xs font-medium text-gray-500 mb-1\">Compiled By</label>";

const new1 = "        {job.description && (\r\n          <div>\r\n            <label className=\"block text-xs font-medium text-gray-500 mb-1\">Description</label>\r\n            <p className=\"text-sm text-gray-800 bg-gray-50 rounded-lg px-3 py-2\">{job.description}</p>\r\n          </div>\r\n        )}\r\n        <div>\r\n          <label className=\"block text-xs font-medium text-gray-500 mb-1\">Drawing Number</label>\r\n          <input type=\"text\" defaultValue={job.drawing_number || ''} onBlur={async (e) => { await supabase.from('jobs').update({ drawing_number: e.target.value || null }).eq('id', job.id) }} placeholder=\"DWG-001\" className=\"w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500\" />\r\n        </div>\r\n        <div>\r\n          <label className=\"block text-xs font-medium text-gray-500 mb-1\">Compiled By</label>";

if (c.includes(old1)) {
  c = c.replace(old1, new1);
  console.log('J5 OK - Drawing number field added');
} else {
  console.log('J5 WARN - not found');
}

fs.writeFileSync('src/App.tsx', c, 'utf8');
const final = fs.readFileSync('src/App.tsx', 'utf8');
console.log('Has drawing input:', final.includes('Drawing Number'));
console.log('Done');
