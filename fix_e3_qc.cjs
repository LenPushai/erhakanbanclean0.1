const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

console.log('Total lines:', lines.length);

// ── 1. ADD QC STATE after the jobWorkers state block ──────────────────────
// Find: const [savingWorker, setSavingWorker] = React.useState(false)
let stateInsertLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('setSavingWorker') && lines[i].includes('useState(false)')) {
    stateInsertLine = i;
    break;
  }
}
if (stateInsertLine === -1) { console.log('ERROR: state anchor not found'); process.exit(1); }
console.log('State insert after line:', stateInsertLine + 1);

const R = '\r';
const qcState = [
  "  const [qcCheckpoints, setQcCheckpoints] = React.useState<any[]>([])" + R,
  "  const [loadingQC, setLoadingQC] = React.useState(false)" + R,
  "  const [showSignModal, setShowSignModal] = React.useState<number|null>(null)" + R,
  "  const [signerName, setSignerName] = React.useState('')" + R,
  "  const [savingSign, setSavingSign] = React.useState(false)" + R,
  "" + R,
  "  const QC_DESCRIPTIONS = [" + R,
  "    'Mark out all material and check prior to cutting'," + R,
  "    'Cut all material, deburr holes, dress and remove all sharp edges'," + R,
  "    'Assy and inspect prior to welding (water passes if applicable)'," + R,
  "    'Do welding complete as per WPS?'," + R,
  "    'Do a pressure test on water cooled unit if applicable?'," + R,
  "    'Clean all spatter and ensure NO sharp edges on workpiece'," + R,
  "    'Do 100% dimensional and visual inspection prior to painting'," + R,
  "    'Stamp and paint as required'," + R,
  "    'Final inspection - Sticker, Sign, Paperwork, Ready for delivery'," + R,
  "  ]" + R,
  "" + R,
  "  const loadQCCheckpoints = React.useCallback(async () => {" + R,
  "    setLoadingQC(true)" + R,
  "    const sb = (await import('./lib/supabase')).supabase" + R,
  "    const { data } = await sb.from('job_qc_checkpoints').select('*').eq('job_id', job.id).order('checkpoint_number')" + R,
  "    if (data && data.length > 0) {" + R,
  "      setQcCheckpoints(data)" + R,
  "    } else {" + R,
  "      const inserts = QC_DESCRIPTIONS.map((desc, i) => ({" + R,
  "        job_id: job.id," + R,
  "        checkpoint_number: i + 1," + R,
  "        description: desc," + R,
  "        signed_off: false," + R,
  "      }))" + R,
  "      const { data: created } = await sb.from('job_qc_checkpoints').insert(inserts).select()" + R,
  "      if (created) setQcCheckpoints(created)" + R,
  "    }" + R,
  "    setLoadingQC(false)" + R,
  "  }, [job.id])" + R,
  "" + R,
  "  const handleSignOff = async (checkpointId: string) => {" + R,
  "    if (!signerName.trim()) return" + R,
  "    setSavingSign(true)" + R,
  "    const sb = (await import('./lib/supabase')).supabase" + R,
  "    const { data } = await sb.from('job_qc_checkpoints').update({" + R,
  "      signed_off: true," + R,
  "      signed_off_by: signerName.trim()," + R,
  "      signed_off_at: new Date().toISOString()," + R,
  "    }).eq('id', checkpointId).select().single()" + R,
  "    if (data) {" + R,
  "      setQcCheckpoints(prev => prev.map(c => c.id === checkpointId ? data : c))" + R,
  "    }" + R,
  "    setSavingSign(false)" + R,
  "    setShowSignModal(null)" + R,
  "    setSignerName('')" + R,
  "  }" + R,
];

lines.splice(stateInsertLine + 1, 0, ...qcState);
console.log('QC state inserted. Lines now:', lines.length);

// Recalculate QC tab position after splice
let qcTabStart = -1;
let qcTabEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("activeTab === 'qc' && (")) { qcTabStart = i; }
  if (qcTabStart > -1 && qcTabEnd === -1 && i > qcTabStart && lines[i].trim() === ')}\r') {
    qcTabEnd = i;
    break;
  }
}
console.log('QC tab start:', qcTabStart + 1, 'end:', qcTabEnd + 1);

// Also add useEffect to load QC when tab changes
// Find the useEffect for workers (loadWorkers) and add loadQC after it
let workerEffectLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('loadWorkers()') && lines[i+1] && lines[i+1].includes('}, [job.id'))  {
    workerEffectLine = i + 1;
    break;
  }
}
if (workerEffectLine > -1) {
  const qcEffect = [
    "" + R,
    "  React.useEffect(() => {" + R,
    "    if (activeTab === 'qc') loadQCCheckpoints()" + R,
    "  }, [activeTab, loadQCCheckpoints])" + R,
  ];
  lines.splice(workerEffectLine + 1, 0, ...qcEffect);
  console.log('QC useEffect inserted after line:', workerEffectLine + 1);
}

// Recalculate again after second splice
qcTabStart = -1; qcTabEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("activeTab === 'qc' && (")) { qcTabStart = i; }
  if (qcTabStart > -1 && qcTabEnd === -1 && i > qcTabStart + 2 && lines[i].includes("        )}\r") && !lines[i].includes('activeTab')) {
    qcTabEnd = i;
    break;
  }
}
console.log('QC tab recalculated — start:', qcTabStart + 1, 'end:', qcTabEnd + 1);

if (qcTabStart === -1 || qcTabEnd === -1) {
  console.log('ERROR: QC tab boundaries not found');
  process.exit(1);
}

const newQCTab = [
  "        {activeTab === 'qc' && (" + R,
  "          <div>" + R,
  "            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>" + R,
  "              <div>" + R,
  "                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1d3461' }}>QC Holding Points</div>" + R,
  "                <div style={{ fontSize: '12px', color: '#8896a8', marginTop: '2px' }}>9 checkpoints - digital replacement for paper signature</div>" + R,
  "              </div>" + R,
  "              <div style={{ background: qcCheckpoints.filter(c=>c.signed_off).length === 9 ? '#dcfce7' : '#e8ecf4', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 700, color: qcCheckpoints.filter(c=>c.signed_off).length === 9 ? '#16a34a' : '#1d3461' }}>" + R,
  "                {qcCheckpoints.filter(c=>c.signed_off).length} of 9 complete" + R,
  "              </div>" + R,
  "            </div>" + R,
  "            {loadingQC ? (" + R,
  "              <div style={{ textAlign: 'center', padding: '40px', color: '#8896a8', fontSize: '13px' }}>Loading checkpoints...</div>" + R,
  "            ) : (" + R,
  "              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>" + R,
  "                {(qcCheckpoints.length > 0 ? qcCheckpoints : QC_DESCRIPTIONS.map((d,i)=>({ id: String(i), checkpoint_number: i+1, description: d, signed_off: false }))).map((cp: any) => (" + R,
  "                  <div key={cp.id} style={{ background: 'white', border: cp.signed_off ? '1px solid #4db848' : '1px solid #dde3ec', borderRadius: '8px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>" + R,
  "                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: cp.signed_off ? '#4db848' : '#e8ecf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: cp.signed_off ? 'white' : '#1d3461', flexShrink: 0 }}>{cp.checkpoint_number}</div>" + R,
  "                    <div style={{ flex: 1 }}>" + R,
  "                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1d3461', lineHeight: 1.4 }}>{cp.description}</div>" + R,
  "                      {cp.signed_off ? (" + R,
  "                        <div style={{ fontSize: '11px', color: '#4db848', marginTop: '4px', fontWeight: 600 }}>" + R,
  "                          Signed by {cp.signed_off_by} &bull; {cp.signed_off_at ? new Date(cp.signed_off_at).toLocaleString('en-ZA', { dateStyle: 'short', timeStyle: 'short' }) : ''}" + R,
  "                        </div>" + R,
  "                      ) : (" + R,
  "                        <div style={{ fontSize: '11px', color: '#8896a8', marginTop: '3px' }}>Awaiting sign-off</div>" + R,
  "                      )}" + R,
  "                    </div>" + R,
  "                    {!cp.signed_off && (" + R,
  "                      <button onClick={() => setShowSignModal(cp.id)} style={{ background: '#4db848', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>Sign Off</button>" + R,
  "                    )}" + R,
  "                    {cp.signed_off && (" + R,
  "                      <div style={{ background: '#dcfce7', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: 700, color: '#16a34a', flexShrink: 0 }}>Signed</div>" + R,
  "                    )}" + R,
  "                  </div>" + R,
  "                ))}" + R,
  "              </div>" + R,
  "            )}" + R,
  "            {showSignModal !== null && (" + R,
  "              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, borderRadius: '12px' }}>" + R,
  "                <div style={{ background: 'white', borderRadius: '10px', padding: '28px', width: '320px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>" + R,
  "                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#1d3461', marginBottom: '6px' }}>Sign Off Checkpoint</div>" + R,
  "                  <div style={{ fontSize: '12px', color: '#8896a8', marginBottom: '18px' }}>Enter your full name to confirm this checkpoint is complete.</div>" + R,
  "                  <input" + R,
  "                    type='text'" + R,
  "                    value={signerName}" + R,
  "                    onChange={e => setSignerName(e.target.value)}" + R,
  "                    placeholder='Your full name...'" + R,
  "                    style={{ width: '100%', border: '1px solid #dde3ec', borderRadius: '6px', padding: '10px 12px', fontSize: '13px', marginBottom: '16px', boxSizing: 'border-box' }}" + R,
  "                    autoFocus" + R,
  "                  />" + R,
  "                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>" + R,
  "                    <button onClick={() => { setShowSignModal(null); setSignerName('') }} style={{ border: '1px solid #dde3ec', background: 'white', borderRadius: '6px', padding: '9px 18px', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>" + R,
  "                    <button onClick={() => handleSignOff(showSignModal as unknown as string)} disabled={savingSign || !signerName.trim()} style={{ background: savingSign || !signerName.trim() ? '#ccc' : '#4db848', color: 'white', border: 'none', borderRadius: '6px', padding: '9px 18px', fontSize: '13px', fontWeight: 700, cursor: savingSign || !signerName.trim() ? 'not-allowed' : 'pointer' }}>{savingSign ? 'Saving...' : 'Confirm Sign-Off'}</button>" + R,
  "                  </div>" + R,
  "                </div>" + R,
  "              </div>" + R,
  "            )}" + R,
  "          </div>" + R,
  "        )}" + R,
];

lines.splice(qcTabStart, qcTabEnd - qcTabStart + 1, ...newQCTab);
fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('E3 QC tab replaced OK — new line count:', lines.length);
console.log('Has sign-off modal:', lines.some(l => l.includes('Confirm Sign-Off')));
console.log('Has QC descriptions:', lines.some(l => l.includes('Mark out all material')));
