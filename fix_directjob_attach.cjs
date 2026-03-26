const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// Step 1: Add pendingFiles state after lineItems state
let lineItemsIdx = -1;
for (let i = 1018; i < 1030; i++) {
  if (lines[i] && lines[i].includes('setLineItems') && lines[i].includes('useState')) {
    lineItemsIdx = i; break;
  }
}
if (lineItemsIdx >= 0) {
  lines.splice(lineItemsIdx + 1, 0, "  const [pendingFiles, setPendingFiles] = React.useState<File[]>([]);\r");
  console.log('Step 1 done - pendingFiles state at line ' + (lineItemsIdx + 2));
} else { console.log('Step 1 WARNING - lineItems state not found'); }

// Step 2: Upload attachments before onCreated()
let onCreatedIdx = -1;
for (let i = 1062; i < 1085; i++) {
  if (lines[i] && lines[i].includes('onCreated()')) {
    onCreatedIdx = i; break;
  }
}
if (onCreatedIdx >= 0) {
  const uploadBlock = [
    "      if (pendingFiles.length > 0) {\r",
    "        for (const file of pendingFiles) {\r",
    "          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');\r",
    "          const filePath = `${job.id}/${Date.now()}-${safeName}`;\r",
    "          const { error: upErr } = await supabase.storage.from('rfq-attachments').upload(filePath, file);\r",
    "          if (!upErr) {\r",
    "            await supabase.from('job_attachments').insert({ job_id: job.id, file_name: file.name, file_path: filePath, file_size: file.size });\r",
    "          }\r",
    "        }\r",
    "      }\r",
  ];
  lines.splice(onCreatedIdx, 0, ...uploadBlock);
  console.log('Step 2 done - upload block inserted before onCreated()');
} else { console.log('Step 2 WARNING - onCreated() not found'); }

// Step 3: Add attachment UI before Notes section
let notesIdx = -1;
for (let i = 1130; i < 1220; i++) {
  if (lines[i] && lines[i].includes('Additional notes')) {
    notesIdx = i; break;
  }
}
// Find opening <div> of Notes block
let notesDivIdx = notesIdx;
if (notesIdx >= 0) {
  for (let j = notesIdx; j > notesIdx - 6; j--) {
    if (lines[j] && lines[j].match(/^\s+<div>/)) {
      notesDivIdx = j; break;
    }
  }
  const attachUI = [
    "          <div>\r",
    "            <label className=\"block text-xs font-medium text-gray-600 mb-1\">Attachments</label>\r",
    "            <label className=\"flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors border-gray-300 hover:border-blue-400 hover:bg-blue-50\">\r",
    "              <Paperclip size={16} className=\"text-gray-400\" />\r",
    "              <div><p className=\"text-sm font-medium text-gray-700\">Click to attach files</p><p className=\"text-xs text-gray-400\">Any file type — multiple allowed</p></div>\r",
    "              <input type=\"file\" multiple className=\"hidden\" onChange={(e) => {\r",
    "                if (e.target.files) setPendingFiles(prev => [...prev, ...Array.from(e.target.files!)]);\r",
    "                e.target.value = '';\r",
    "              }} />\r",
    "            </label>\r",
    "            {pendingFiles.length > 0 && (\r",
    "              <div className=\"space-y-1 mt-2\">\r",
    "                {pendingFiles.map((f, i) => (\r",
    "                  <div key={i} className=\"flex items-center justify-between px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-100\">\r",
    "                    <span className=\"text-xs font-medium text-blue-700 truncate\">{f.name}</span>\r",
    "                    <button type=\"button\" onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))} className=\"ml-2 text-red-400 hover:text-red-600\"><X size={12} /></button>\r",
    "                  </div>\r",
    "                ))}\r",
    "              </div>\r",
    "            )}\r",
    "          </div>\r",
  ];
  lines.splice(notesDivIdx, 0, ...attachUI);
  console.log('Step 3 done - attachment UI added before Notes at line ' + (notesDivIdx + 1));
} else { console.log('Step 3 WARNING - Notes textarea not found'); }

// Step 4: Make sure Paperclip is imported
const importLine = lines.findIndex(l => l && l.includes('import') && l.includes('lucide-react'));
if (importLine >= 0 && !lines[importLine].includes('Paperclip')) {
  lines[importLine] = lines[importLine].replace('} from \'lucide-react\'', ', Paperclip } from \'lucide-react\'');
  console.log('Step 4 done - Paperclip added to lucide imports');
} else if (importLine >= 0) {
  console.log('Step 4 - Paperclip already imported');
} else { console.log('Step 4 WARNING - lucide-react import not found'); }

fs.writeFileSync('src/App.tsx', lines.join('\n'));
console.log('ALL DONE - App.tsx saved');
