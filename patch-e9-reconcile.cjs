const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');
const crlf = c.includes('\r\n');
const nl = crlf ? '\r\n' : '\n';
let changes = 0;

// 1. Add 'reconcile' to activeTab type
const oldType = `<'workers'|'time'|'qc'|'materials'>('workers')`;
const newType = `<'workers'|'time'|'qc'|'materials'|'reconcile'>('workers')`;
if (c.includes(oldType)) {
  c = c.replace(oldType, newType);
  changes++;
  console.log('1. ActiveTab type: PATCHED');
} else {
  console.log('1. ActiveTab type: SKIPPED (already done or not found)');
}

// 2. Find and add Reconcile to the tabs array
// Look for the pattern where tabs are defined (Workers, Time, QC, Materials)
const matTabPattern = `{ key: 'materials', label: 'Materials' }`;
const matTabPatternAlt = `{key:'materials',label:'Materials'}`;
const reconcileTab = `, { key: 'reconcile', label: 'Reconcile' }`;

if (c.includes(matTabPattern) && !c.includes(`'reconcile'`)) {
  c = c.replace(matTabPattern, matTabPattern + reconcileTab);
  changes++;
  console.log('2. Tabs array: PATCHED');
} else if (c.includes(matTabPatternAlt) && !c.includes(`'reconcile'`)) {
  c = c.replace(matTabPatternAlt, matTabPatternAlt + reconcileTab);
  changes++;
  console.log('2. Tabs array: PATCHED (alt)');
} else {
  // Try a more flexible search
  const tabsMatch = c.match(/materials['"],\s*label:\s*['"]Materials['"]\s*\}/);
  if (tabsMatch && !c.includes(`'reconcile'`)) {
    c = c.replace(tabsMatch[0], tabsMatch[0] + reconcileTab);
    changes++;
    console.log('2. Tabs array: PATCHED (flex)');
  } else {
    console.log('2. Tabs array: SKIPPED - need manual check');
  }
}

// 3. Add reconcile state variables after loadingMaterials state
const matStateMarker = `const [loadingMaterials, setLoadingMaterials] = React.useState(false)`;
if (c.includes(matStateMarker) && !c.includes('reconcileData')) {
  const reconcileStates = [
    `  const [reconcileData, setReconcileData] = React.useState<any[]>([])`,
    `  const [reconcileFileName, setReconcileFileName] = React.useState('')`,
    `  const [reconciling, setReconciling] = React.useState(false)`,
    `  const reconcileFileRef = React.useRef<HTMLInputElement>(null)`,
  ].join(nl);
  c = c.replace(matStateMarker, matStateMarker + nl + reconcileStates);
  changes++;
  console.log('3. Reconcile state vars: PATCHED');
} else {
  console.log('3. Reconcile state vars: SKIPPED');
}

// 4. Add reconcile tab content after materials tab closing
// Insert between end of materials tab and Workshop Notes
const insertMarker = `{/* WORKSHOP NOTES`;
if (c.includes(insertMarker) && !c.includes('RECONCILE TAB')) {
  const reconcileTabContent = `
        {/* RECONCILE TAB */}
        {activeTab === 'reconcile' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1d3461' }}>Quote Reconciliation</div>
                <div style={{ fontSize: '12px', color: '#8896a8', marginTop: '2px' }}>Compare Pastel quoted values against actual execution</div>
              </div>
              <button onClick={() => reconcileFileRef.current?.click()}
                style={{ padding: '10px 20px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Upload Pastel Export
              </button>
              <input ref={reconcileFileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setReconcileFileName(file.name)
                  const reader = new FileReader()
                  reader.onload = (ev) => {
                    const text = ev.target?.result as string
                    const lines = text.trim().split('\\n')
                    if (lines.length < 2) return
                    const headers = lines[0].split(',').map((h: string) => h.trim().replace(/^"|"$/g, ''))
                    const rows = lines.slice(1).map((line: string) => {
                      const vals = line.split(',').map((v: string) => v.trim().replace(/^"|"$/g, ''))
                      const row: any = {}
                      headers.forEach((h: string, i: number) => { row[h] = vals[i] || '' })
                      return row
                    }).filter((r: any) => r.LineItem || r.Description)
                    setReconcileData(rows)
                  }
                  reader.readAsText(file)
                }} />
            </div>

            {reconcileFileName && (
              <div style={{ padding: '10px 16px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#7c3aed' }}>
                Loaded: <strong>{reconcileFileName}</strong> — {reconcileData.length} line items
              </div>
            )}

            {reconcileData.length > 0 ? (
              <div style={{ background: 'white', border: '1px solid #dde3ec', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead><tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Line Item</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Quoted Qty</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Quoted Price</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Quoted Total</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Actual Qty</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>Variance</th>
                  </tr></thead>
                  <tbody>{reconcileData.map((row: any, i: number) => {
                    const quotedQty = parseFloat(row.Quantity || row.Qty || '0')
                    const quotedPrice = parseFloat(row.UnitPrice || row.Price || '0')
                    const quotedTotal = quotedQty * quotedPrice
                    // Match against actual materials logged in E4
                    const actualMat = jobMaterials.find((m: any) => m.description?.toLowerCase().includes((row.Description || row.LineItem || '').toLowerCase().slice(0, 10)))
                    const actualQty = actualMat ? actualMat.quantity : 0
                    const actualTotal = actualQty * quotedPrice
                    const variance = actualTotal - quotedTotal
                    const varianceColor = variance > 0 ? '#dc2626' : variance < 0 ? '#16a34a' : '#64748b'
                    return (
                      <tr key={i} style={{ borderTop: i > 0 ? '1px solid #f1f5f9' : 'none' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1d3461' }}>{row.Description || row.LineItem || '-'}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', color: '#64748b' }}>{quotedQty}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b' }}>R {quotedPrice.toFixed(2)}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: '#1d3461' }}>R {quotedTotal.toFixed(2)}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: actualMat ? '#1d3461' : '#cbd5e1' }}>{actualMat ? actualQty : '—'}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: varianceColor }}>
                          {actualMat ? (variance > 0 ? '+' : '') + 'R ' + variance.toFixed(2) : '—'}
                        </td>
                      </tr>
                    )
                  })}</tbody>
                </table>
                <div style={{ padding: '14px', background: '#f8fafc', borderTop: '1px solid #dde3ec', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#8896a8' }}>
                    Quoted Total: <strong style={{ color: '#1d3461' }}>R {reconcileData.reduce((s: number, r: any) => s + (parseFloat(r.Quantity || r.Qty || '0') * parseFloat(r.UnitPrice || r.Price || '0')), 0).toFixed(2)}</strong>
                  </span>
                  <span style={{ fontSize: '11px', color: '#8896a8' }}>Variance = Actual - Quoted (Red = overrun, Green = saving)</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8896a8', fontSize: '13px' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>📊</div>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>No Pastel data loaded</div>
                <div>Upload a Pastel quote export CSV to compare against actual materials logged on this job</div>
                <div style={{ marginTop: '12px', fontSize: '11px', color: '#b0b8c8' }}>Expected columns: Description, Quantity, UnitPrice</div>
              </div>
            )}
          </div>
        )}

`;
  c = c.replace(insertMarker, reconcileTabContent + nl + '        ' + insertMarker);
  changes++;
  console.log('4. Reconcile tab content: PATCHED');
} else {
  console.log('4. Reconcile tab content: SKIPPED');
}

fs.writeFileSync('src/App.tsx', c, 'utf8');
console.log(`\nTotal patches: ${changes}`);
console.log('Lines:', c.split(nl).length);