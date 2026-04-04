const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

let startLine = -1;
let endLine = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Clock in/out per worker per job')) {
    startLine = i - 2;
    console.log('Found start at line:', startLine + 1);
  }
  if (startLine > -1 && endLine === -1 && lines[i].includes('clock them in from the Workers tab')) {
    endLine = i + 2;
    console.log('Found end at line:', endLine + 1);
  }
}

if (startLine === -1 || endLine === -1) {
  console.log('Could not find markers - dumping lines 2690-2716:');
  for (let i = 2689; i <= 2715; i++) {
    console.log((i+1) + ': ' + JSON.stringify(lines[i]));
  }
  process.exit(1);
}

const R = '\r';
const newBlock = [
  "          <div>" + R,
  "            <div style={{ marginBottom: '20px' }}>" + R,
  "              <div style={{ fontSize: '16px', fontWeight: 700, color: '#1d3461' }}>Time Tracking</div>" + R,
  "              <div style={{ fontSize: '12px', color: '#8896a8', marginTop: '2px' }}>Actual hours per worker per job</div>" + R,
  "            </div>" + R,
  "            {(() => {" + R,
  "              const totalMinutes = jobWorkers.reduce((sum, w) => sum + (w.total_minutes || 0), 0)" + R,
  "              const clockedIn = jobWorkers.filter(w => w.clocked_in_at && !w.clocked_out_at)" + R,
  "              const totalH = Math.floor(totalMinutes / 60)" + R,
  "              const totalM = totalMinutes % 60" + R,
  "              return (" + R,
  "                <>" + R,
  "                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>" + R,
  "                    {[" + R,
  "                      { l: 'Total Workers', v: jobWorkers.length.toString() }," + R,
  "                      { l: 'Currently Clocked In', v: clockedIn.length.toString() }," + R,
  "                      { l: 'Total Hours', v: totalMinutes > 0 ? totalH + 'h ' + totalM + 'm' : '0h 0m' }" + R,
  "                    ].map((s, i) => (" + R,
  "                      <div key={i} style={{ background: 'white', border: '1px solid #dde3ec', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>" + R,
  "                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{s.l}</div>" + R,
  "                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#1d3461' }}>{s.v}</div>" + R,
  "                      </div>" + R,
  "                    ))}" + R,
  "                  </div>" + R,
  "                  {jobWorkers.length === 0 ? (" + R,
  "                    <div style={{ background: 'white', border: '1px solid #dde3ec', borderRadius: '8px', padding: '48px', textAlign: 'center' }}>" + R,
  "                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#1d3461', marginBottom: '4px' }}>No workers assigned yet</div>" + R,
  "                      <div style={{ fontSize: '12px', color: '#8896a8' }}>Assign workers from the Workers tab to start tracking time</div>" + R,
  "                    </div>" + R,
  "                  ) : (" + R,
  "                    <div style={{ background: 'white', border: '1px solid #dde3ec', borderRadius: '8px', overflow: 'hidden' }}>" + R,
  "                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>" + R,
  "                        <thead>" + R,
  "                          <tr style={{ background: '#f8fafc' }}>" + R,
  "                            <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Worker</th>" + R,
  "                            <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Clock No</th>" + R,
  "                            <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Clocked In</th>" + R,
  "                            <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Clocked Out</th>" + R,
  "                            <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Hours</th>" + R,
  "                            <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Amount</th>" + R,
  "                            <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Status</th>" + R,
  "                          </tr>" + R,
  "                        </thead>" + R,
  "                        <tbody>" + R,
  "                          {jobWorkers.map((w, i) => {" + R,
  "                            const mins = w.total_minutes || 0" + R,
  "                            const h = Math.floor(mins / 60)" + R,
  "                            const m = mins % 60" + R,
  "                            const isIn = w.clocked_in_at && !w.clocked_out_at" + R,
  "                            return (" + R,
  "                              <tr key={w.id} style={{ borderTop: i > 0 ? '1px solid #f1f5f9' : 'none' }}>" + R,
  "                                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1d3461' }}>{w.worker_name}</td>" + R,
  "                                <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '12px' }}>{w.clock_number || '-'}</td>" + R,
  "                                <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '12px' }}>{w.clocked_in_at ? new Date(w.clocked_in_at).toLocaleString('en-ZA', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</td>" + R,
  "                                <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '12px' }}>{w.clocked_out_at ? new Date(w.clocked_out_at).toLocaleString('en-ZA', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</td>" + R,
  "                                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: '#1d3461' }}>{mins > 0 ? h + 'h ' + m + 'm' : '-'}</td>" + R,
  "                                <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b', fontSize: '12px' }}>{w.payment_amount ? 'R ' + parseFloat(w.payment_amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 }) : '-'}</td>" + R,
  "                                <td style={{ padding: '12px 14px', textAlign: 'center' }}>" + R,
  "                                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, background: isIn ? '#dcfce7' : '#f1f5f9', color: isIn ? '#16a34a' : '#64748b' }}>" + R,
  "                                    {isIn ? 'CLOCKED IN' : w.clocked_out_at ? 'COMPLETE' : 'ASSIGNED'}" + R,
  "                                  </span>" + R,
  "                                </td>" + R,
  "                              </tr>" + R,
  "                            )" + R,
  "                          })}" + R,
  "                        </tbody>" + R,
  "                        <tfoot>" + R,
  "                          <tr style={{ borderTop: '2px solid #e2e8f0', background: '#f8fafc' }}>" + R,
  "                            <td colSpan={4} style={{ padding: '10px 14px', fontWeight: 700, color: '#1d3461', fontSize: '12px' }}>TOTALS</td>" + R,
  "                            <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#1d3461' }}>{totalH}h {totalM}m</td>" + R,
  "                            <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#1d3461' }}>R {jobWorkers.reduce((s, w) => s + (parseFloat(w.payment_amount) || 0), 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>" + R,
  "                            <td></td>" + R,
  "                          </tr>" + R,
  "                        </tfoot>" + R,
  "                      </table>" + R,
  "                    </div>" + R,
  "                  )}" + R,
  "                </>" + R,
  "              )" + R,
  "            })()}" + R,
  "          </div>",
];

lines.splice(startLine, endLine - startLine + 1, ...newBlock);
fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('E2 Time tab replaced OK');
console.log('New line count:', lines.length);
