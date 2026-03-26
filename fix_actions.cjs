const fs = require('fs');
let t = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Insert actions state after compiledBy state
const insert = [
  '  const [actions, setActions] = React.useState<Record<string,boolean>>({',
  '    action_manufacture: !!(job as any).action_manufacture,',
  '    action_service:     !!(job as any).action_service,',
  '    action_repair:      !!(job as any).action_repair,',
  '    action_sandblast:   !!(job as any).action_sandblast,',
  '    action_paint:       !!(job as any).action_paint,',
  '    action_installation:!!(job as any).action_installation,',
  '    action_cut:         !!(job as any).action_cut,',
  '    action_modify:      !!(job as any).action_modify,',
  '    action_other:       !!(job as any).action_other,',
  '  })'
].join('\r\n') + '\r\n';

t = t.replace(
  '  const [compiledBy, setCompiledBy]',
  insert + '  const [compiledBy, setCompiledBy]'
);

// 2. Replace defaultChecked with controlled checked
t = t.replace(
  'defaultChecked={!!(job as any)[key]}',
  'checked={!!actions[key]}'
);

// 3. Wire setActions into onChange
t = t.replace(
  'onChange={async (e) => { await supabase.from(\'jobs\').update({ [key]: e.target.checked }).eq(\'id\', job.id) }}',
  'onChange={async (e) => { setActions(a=>({...a,[key]:e.target.checked})); await supabase.from(\'jobs\').update({ [key]: e.target.checked }).eq(\'id\', job.id) }}'
);

fs.writeFileSync('src/App.tsx', t);
console.log('Done - actions state + controlled checkboxes patched');
