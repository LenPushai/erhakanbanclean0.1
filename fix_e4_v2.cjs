const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
console.log('Total lines:', lines.length);

// Find exact start and end
let start = -1, end = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('MATERIALS TAB')) start = i + 1;
  if (start > -1 && end === -1 && i > start && lines[i].includes("        )}\r") && lines[i+1] && lines[i+1].trim() === '\r') {
    end = i; break;
  }
}
console.log('Start:', start+1, 'End:', end+1);
if (start === -1 || end === -1) {
  // fallback: hardcode based on search
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('MATERIALS TAB')) { start = i+1; end = i+18; break; }
  }
  console.log('Fallback ? start:', start+1, 'end:', end+1);
}

const R = '\r';
const newTab = [
"        {activeTab === 'materials' && (" + R,
"          <div style={{ position: 'relative' }}>" + R,
"            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>" + R,
"              <div><div style={{ fontSize: '16px', fontWeight: 700, color: '#1d3461' }}>Materials Used</div><div style={{ fontSize: '12px', color: '#8896a8', marginTop: '2px' }}>Log materials consumed against this job</div></div>" + R,
"              <button onClick={() => setShowMatModal(true)} style={{ background: '#1d3461', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>+ Log Material</button>" + R,
"            </div>" + R,
"            {loadingMaterials ? (<div style={{ textAlign: 'center', padding: '40px', color: '#8896a8', fontSize: '13px' }}>Loading...</div>) : jobMaterials.length === 0 ? (" + R,
"              <div style={{ background: 'white', border: '1px solid #dde3ec', borderRadius: '8px', padding: '48px', textAlign: 'center' }}><div style={{ fontSize: '14px', fontWeight: 600, color: '#1d3461', marginBottom: '4px' }}>No materials logged yet</div><div style={{ fontSize: '12px', color: '#8896a8' }}>Click Log Material to record materials consumed on this job</div></div>" + R,
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
"                  <tbody>{jobMaterials.map((m, i) => (" + R,
"                    <tr key={m.id} style={{ borderTop: i > 0 ? '1px solid #f1f5f9' : 'none' }}>" + R,
"                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1d3461' }}>{m.description}</td>" + R,
"                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: '#1d3461' }}>{m.quantity}</td>" + R,
"                      <td style={{ padding: '12px 14px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>{m.unit}</td>" + R,
"                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '12px' }}>{m.logged_by || '-'}</td>" + R,
"                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '12px' }}>{m.logged_at ? new Date(m.logged_at).toLocaleString('en-ZA', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</td>" + R,
"                      <td style={{ padding: '12px 14px', textAlign: 'center' }}><button onClick={() => handleDeleteMaterial(m.id)} style={{ background: 'none', border: 'none', color: '#e24b4a', cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}>x</button></td>" + R,
"                    </tr>" + R,
"                  ))}</tbody>" + R,
"                  <tfoot><tr style={{ borderTop: '2px solid #e2e8f0', background: '#f8fafc' }}><td colSpan={5} style={{ padding: '10px 14px', fontWeight: 700, color: '#1d3461', fontSize: '12px' }}>Total items: {jobMaterials.length}</td><td></td></tr></tfoot>" + R,
"                </table>" + R,
"              </div>" + R,
"            )}" + R,
"            {showMatModal && (" + R,
"              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, borderRadius: '12px' }}>" + R,
"                <div style={{ background: 'white', borderRadius: '10px', padding: '28px', width: '360px' }}>" + R,
"                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#1d3461', marginBottom: '18px' }}>Log Material</div>" + R,
"                  <div style={{ marginBottom: '12px' }}><label style={{ fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>Description *</label><input type='text' value={matForm.description} onChange={e => setMatForm(f => ({...f, description: e.target.value}))} placeholder='e.g. 50x50x3 SHS Steel' style={{ width: '100%', border: '1px solid #dde3ec', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', boxSizing: 'border-box' }} autoFocus /></div>" + R,
"                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>" + R,
"                    <div><label style={{ fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>Quantity *</label><input type='number' value={matForm.quantity} onChange={e => setMatForm(f => ({...f, quantity: e.target.value}))} placeholder='0' min='0' step='0.01' style={{ width: '100%', border: '1px solid #dde3ec', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', boxSizing: 'border-box' }} /></div>" + R,
"                    <div><label style={{ fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>Unit</label><select value={matForm.unit} onChange={e => setMatForm(f => ({...f, unit: e.target.value}))} style={{ width: '100%', border: '1px solid #dde3ec', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', boxSizing: 'border-box' }}>{MAT_UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select></div>" + R,
"                  </div>" + R,
"                  <div style={{ marginBottom: '20px' }}><label style={{ fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>Logged by</label><input type='text' value={matForm.logged_by} onChange={e => setMatForm(f => ({...f, logged_by: e.target.value}))} placeholder='Your name...' style={{ width: '100%', border: '1px solid #dde3ec', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', boxSizing: 'border-box' }} /></div>" + R,
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

lines.splice(start, end - start + 1, ...newTab);
fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('E4 done ? new line count:', lines.length);
