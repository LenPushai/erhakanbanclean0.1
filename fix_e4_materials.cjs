const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
console.log('Total lines:', lines.length);

const R = '\r';

// ── 1. ADD MATERIALS STATE after savingSign state ──────────────────────────
let stateInsertLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('setSavingSign') && lines[i].includes('useState(false)')) {
    stateInsertLine = i;
    break;
  }
}
if (stateInsertLine === -1) { console.log('ERROR: state anchor not found'); process.exit(1); }
console.log('State insert after line:', stateInsertLine + 1);

const matState = [
  "  const [jobMaterials, setJobMaterials] = React.useState<any[]>([])" + R,
  "  const [loadingMaterials, setLoadingMaterials] = React.useState(false)" + R,
  "  const [showMatModal, setShowMatModal] = React.useState(false)" + R,
  "  const [matForm, setMatForm] = React.useState({ description: '', quantity: '', unit: 'EA', logged_by: '' })" + R,
  "  const [savingMat, setSavingMat] = React.useState(false)" + R,
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
  "    setJobMaterials(prev => prev.filter(m => m.id !== id))" + R,
  "  }" + R,
];

lines.splice(stateInsertLine + 1, 0, ...matState);
console.log('Materials state inserted. Lines now:', lines.length);

// ── 2. ADD useEffect for materials after QC useEffect ─────────────────────
let qcEffectLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('loadQCCheckpoints()') && lines[i].includes('useEffect')) {
    qcEffectLine = i;
    break;
  }
}
if (qcEffectLine > -1) {
  const matEffect = [
    "  React.useEffect(() => { if (activeTab === 'materials') loadMaterials() }, [activeTab, loadMaterials])" + R,
  ];
  lines.splice(qcEffectLine + 1, 0, ...matEffect);
  console.log('Materials useEffect inserted after line:', qcEffectLine + 1);
}

// ── 3. REPLACE MATERIALS TAB (lines 2907-2924 shifted by splices) ─────────
let matTabStart = -1;
let matTabEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("MATERIALS TAB")) { matTabStart = i + 1; }
  if (matTabStart > -1 && matTabEnd === -1 && i > matTabStart && lines[i].includes("        )}\r") && lines[i+1] && lines[i+1].trim() === '\r') {
    matTabEnd = i;
    break;
  }
}
console.log('Materials tab start:', matTabStart + 1, 'end:', matTabEnd + 1);

if (matTabStart === -1 || matTabEnd === -1) {
  console.log('ERROR: Materials tab boundaries not found');
  process.exit(1);
}

const newMatTab = [
  "        {activeTab === 'materials' && (" + R,
  "          <div>" + R,
  "            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>" + R,
  "              <div>" + R,
  "                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1d3461' }}>Materials Used</div>" + R,
  "                <div style={{ fontSize: '12px', color: '#8896a8', marginTop: '2px' }}>Log materials consumed against this job</div>" + R,
  "              </div>" + R,
  "              <button onClick={() => setShowMatModal(true)} style={{ background: '#1d3461', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>+ Log Material</button>" + R,
  "            </div>" + R,
  "            {loadingMaterials ? (" + R,
  "              <div style={{ textAlign: 'center', padding: '40px', color: '#8896a8', fontSize: '13px' }}>Loading materials...</div>" + R,
  "            ) : jobMaterials.length === 0 ? (" + R,
  "              <div style={{ background: 'white', border: '1px solid #dde3ec', borderRadius: '8px', padding: '48px', textAlign: 'center' }}>" + R,
  "                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1d3461', marginBottom: '4px' }}>No materials logged yet</div>" + R,
  "                <div style={{ fontSize: '12px', color: '#8896a8' }}>Click Log Material to record materials consumed on this job</div>" + R,
  "              </div>" + R,
  "            ) : (" + R,
  "              <div style={{ background: 'white', border: '1px solid #dde3ec', borderRadius: '8px', overflow: 'hidden' }}>" + R,
  "                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>" + R,
  "                  <thead><tr style={{ background: '#f8fafc' }}>" + R,
  "                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Description</th>" + R,
  "                    <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Qty</th>" + R,
  "                    <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Unit</th>" + R,
  "                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Logged by</th>" + R,
  "                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Date</th>" + R,
  "                    <th style={{ padding: '10px 14px', width: '40px' }}></th>" + R,
  "                  </tr></thead>" + R,
  "                  <tbody>" + R,
  "                    {jobMaterials.map((m, i) => (" + R,
  "                      <tr key={m.id} style={{ borderTop: i > 0 ? '1px solid #f1f5f9' : 'none' }}>" + R,
  "                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1d3461' }}>{m.description}</td>" + R,
  "                        <td style={{ padding: '12px 14px', textAlign: 'center', color: '#1d3461', fontWeight: 700 }}>{m.quantity}</td>" + R,
  "                        <td style={{ padding: '12px 14px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>{m.unit}</td>" + R,
  "                        <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '12px' }}>{m.logged_by || '-'}</td>" + R,
  "                        <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '12px' }}>{m.logged_at ? new Date(m.logged_at).toLocaleString('en-ZA', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</td>" + R,
  "                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>" + R,
  "                          <button onClick={() => handleDeleteMaterial(m.id)} style={{ background: 'none', border: 'none', color: '#e24b4a', cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}>x</button>" + R,
  "                        </td>" + R,
  "                      </tr>" + R,
  "                    ))}" + R,
  "                  </tbody>" + R,
  "                  <tfoot><tr style={{ borderTop: '2px solid #e2e8f0', background: '#f8fafc' }}>" + R,
  "                    <td colSpan={5} style={{ padding: '10px 14px', fontWeight: 700, color: '#1d3461', fontSize: '12px' }}>Total items logged: {jobMaterials.length}</td>" + R,
  "                    <td></td>" + R,
  "                  </tr></tfoot>" + R,
  "                </table>" + R,
  "              </div>" + R,
  "            )}" + R,
  "            {showMatModal && (" + R,
  "              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, borderRadius: '12px' }}>" + R,
  "                <div style={{ background: 'white', borderRadius: '10px', padding: '28px', width: '360px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>" + R,
  "                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#1d3461', marginBottom: '18px' }}>Log Material</div>" + R,
  "                  <div style={{ marginBottom: '12px' }}>" + R,
  "                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '5px' }}>Description *</label>" + R,
  "                    <input type='text' value={matForm.description} onChange={e => setMatForm(f => ({...f, description: e.target.value}))} placeholder='e.g. 50x50x3 SHS Steel' style={{ width: '100%', border: '1px solid #dde3ec', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', boxSizing: 'border-box' }} autoFocus />" + R,
  "                  </div>" + R,
  "                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>" + R,
  "                    <div>" + R,
  "                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '5px' }}>Quantity *</label>" + R,
  "                      <input type='number' value={matForm.quantity} onChange={e => setMatForm(f => ({...f, quantity: e.target.value}))} placeholder='0' min='0' step='0.01' style={{ width: '100%', border: '1px solid #dde3ec', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', boxSizing: 'border-box' }} />" + R,
  "                    </div>" + R,
  "                    <div>" + R,
  "                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '5px' }}>Unit</label>" + R,
  "                      <select value={matForm.unit} onChange={e => setMatForm(f => ({...f, unit: e.target.value}))} style={{ width: '100%', border: '1px solid #dde3ec', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', boxSizing: 'border-box' }}>" + R,
  "                        {MAT_UNITS.map(u => <option key={u} value={u}>{u}</option>)}" + R,
  "                      </select>" + R,
  "                    </div>" + R,
  "                  </div>" + R,
  "                  <div style={{ marginBottom: '20px' }}>" + R,
  "                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '5px' }}>Logged by</label>" + R,
  "                    <input type='text' value={matForm.logged_by} onChange={e => setMatForm(f => ({...f, logged_by: e.target.value}))} placeholder='Your name...' style={{ width: '100%', border: '1px solid #dde3ec', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', boxSizing: 'border-box' }} />" + R,
  "                  </div>" + R,
  "                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>" + R,
  "                    <button onClick={() => { setShowMatModal(false); setMatForm({ description: '', quantity: '', unit: 'EA', logged_by: '' }) }} style={{ border: '1px solid #dde3ec', background: 'white', borderRadius: '6px', padding: '9px 18px', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>" + R,
  "                    <button onClick={handleLogMaterial} disabled={savingMat || !matForm.description.trim() || !matForm.quantity} style={{ background: savingMat || !matForm.description.trim() || !matForm.quantity ? '#ccc' : '#1d3461', color: 'white', border: 'none', borderRadius: '6px', padding: '9px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>{savingMat ? 'Saving...' : 'Log Material'}</button>" + R,
  "                  </div>" + R,
  "                </div>" + R,
  "              </div>" + R,
  "            )}" + R,
  "          </div>" + R,
  "        )}" + R,
];

lines.splice(matTabStart, matTabEnd - matTabStart + 1, ...newMatTab);
fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('E4 Materials tab replaced OK — new line count:', lines.length);
console.log('Has log modal:', lines.some(l => l.includes('Log Material')));
console.log('Has delete:', lines.some(l => l.includes('handleDeleteMaterial')));
