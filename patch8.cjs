const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const old = "ClipboardList, Briefcase, ChevronRight, Factory, Building2, Calendar, Hash, RefreshCw, ArrowDownToLine, ArrowUpFromLine, X, Mail, FileText, Paperclip, Send, Plus }";
const fix = "ClipboardList, Briefcase, ChevronRight, Factory, Building2, Calendar, Hash, RefreshCw, ArrowDownToLine, ArrowUpFromLine, X, Mail, FileText, Paperclip, Send, Plus, Check }";

if (content.includes(old)) {
  content = content.replace(old, fix);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('PASS: Check added to imports');
} else {
  console.log('FAIL: import line not found');
}
console.log('Done - run: npx vite --force');
