const fs = require('fs');
let l = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
const R = '\r';

// Find savingMat state line to insert after
let insertAfter = -1;
for (let i = 0; i < l.length; i++) {
  if (l[i].includes('setSavingMat') && l[i].includes('useState(false)')) {
    insertAfter = i; break;
  }
}
console.log('Insert after line:', insertAfter + 1);

const newFunctions = [
  "" + R,
  "  const MAT_UNITS = ['EA', 'M', 'KG', 'L', 'M2', 'M3', 'SET', 'HR', 'PCS']" + R,
  "" + R,
  "  const loadMaterials = React.useCallback(async () => {" + R,
  "    setLoadingMaterials(true)" + R,
  "    const sb = (await import('./lib/supabase')).supabase" + R,
  "    const { data } = await sb.from('job_materials').select('*').eq('job_id', job.id).order('logged_at', { ascending: false })" + R,
  "    if (data) setJobMaterials(data)" + R,
  "    setLoadingMaterials(false)" + R,
  "  }, [job.id])" + R,
  "" + R,
  "  const handleLogMaterial = async () => {" + R,
  "    if (!matForm.description.trim() || !matForm.quantity) return" + R,
  "    setSavingMat(true)" + R,
  "    const sb = (await import('./lib/supabase')).supabase" + R,
  "    const { data } = await sb.from('job_materials').insert({" + R,
  "      job_id: job.id," + R,
  "      description: matForm.description.trim()," + R,
  "      quantity: parseFloat(matForm.quantity)," + R,
  "      unit: matForm.unit," + R,
  "      logged_by: matForm.logged_by.trim() || null," + R,
  "      logged_at: new Date().toISOString()," + R,
  "    }).select().single()" + R,
  "    if (data) setJobMaterials(prev => [data, ...prev])" + R,
  "    setSavingMat(false)" + R,
  "    setShowMatModal(false)" + R,
  "    setMatForm({ description: '', quantity: '', unit: 'EA', logged_by: '' })" + R,
  "  }" + R,
  "" + R,
  "  const handleDeleteMaterial = async (id: string) => {" + R,
  "    const sb = (await import('./lib/supabase')).supabase" + R,
  "    await sb.from('job_materials').delete().eq('id', id)" + R,
  "    setJobMaterials(prev => prev.filter((m: any) => m.id !== id))" + R,
  "  }" + R,
  "" + R,
];

l.splice(insertAfter + 1, 0, ...newFunctions);
fs.writeFileSync('src/App.tsx', l.join('\n'), 'utf8');
console.log('Functions inserted OK, new count:', l.length);
console.log('Has handleLogMaterial:', l.some(x => x.includes('const handleLogMaterial')));
console.log('Has handleDeleteMaterial:', l.some(x => x.includes('const handleDeleteMaterial')));
console.log('Has MAT_UNITS const:', l.some(x => x.includes('const MAT_UNITS')));
