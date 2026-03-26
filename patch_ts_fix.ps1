$content = @'
const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// Fix newLineItems type annotation
const newLineIdx = lines.findIndex(l => l.includes('setNewLineItems') && l.includes('useState') && !l.includes('type'));
if (newLineIdx > -1) {
  lines[newLineIdx] = lines[newLineIdx].replace(
    'React.useState([])',
    "React.useState<{description:string;quantity:number;uom:string;item_type:string}[]>([])"
  );
  console.log('[1] newLineItems typed at ' + (newLineIdx + 1));
}

// Fix removeNewLine param type
const removeIdx = lines.findIndex(l => l.includes('const removeNewLine') && l.includes('(i)'));
if (removeIdx > -1) {
  lines[removeIdx] = lines[removeIdx].replace('(i)', '(i:number)');
  console.log('[2] removeNewLine typed at ' + (removeIdx + 1));
}

// Fix updateNewLine param types
const updateIdx = lines.findIndex(l => l.includes('const updateNewLine') && l.includes('(i,field,val)'));
if (updateIdx > -1) {
  lines[updateIdx] = lines[updateIdx].replace('(i,field,val)', '(i:number,field:string,val:any)');
  console.log('[3] updateNewLine typed at ' + (updateIdx + 1));
}

// Fix catch err type
const catchIdx = lines.findIndex(l => l.includes("catch(err)") && l.includes('err.message'));
if (catchIdx > -1) {
  lines[catchIdx] = lines[catchIdx].replace('catch(err)', 'catch(err:any)');
  console.log('[4] catch typed at ' + (catchIdx + 1));
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('TS fix patch complete');
'@

Set-Content -Path "patch_ts_fix.cjs" -Value $content -Encoding ASCII
Write-Host "patch_ts_fix.cjs written - running now..."
node patch_ts_fix.cjs