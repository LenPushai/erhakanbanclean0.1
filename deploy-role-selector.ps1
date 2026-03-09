# deploy-role-selector.ps1
# Adds a "Who are you?" role selector screen on app load
# Juanic = no assign quoter | Hendrik = full access including assign quoter
# Run from project root: powershell -ExecutionPolicy Bypass -File deploy-role-selector.ps1

$appTsxPath = Join-Path $PSScriptRoot "src\App.tsx"

if (-not (Test-Path $appTsxPath)) {
    Write-Host "ERROR: App.tsx not found. Run from project root." -ForegroundColor Red
    exit 1
}

Write-Host "Reading App.tsx..." -ForegroundColor Cyan
$content = [System.IO.File]::ReadAllText($appTsxPath, [System.Text.Encoding]::UTF8)

# ── 1. ADD ROLE SELECTOR COMPONENT ───────────────────────────────────────────
$roleSelectorComponent = @'

// ── Role Selector Screen ──────────────────────────────────────────────────────
function RoleSelector({ onSelect }: { onSelect: (role: string) => void }) {
  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="bg-orange-500 px-8 py-6 text-center">
          <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-orange-500 font-black text-xl">ERHA</span>
          </div>
          <h1 className="text-white font-bold text-xl">Operations Board</h1>
          <p className="text-orange-100 text-sm mt-1">Who are you?</p>
        </div>
        <div className="p-6 space-y-3">
          <button
            onClick={() => onSelect('HENDRIK')}
            className="w-full flex items-center gap-4 px-5 py-4 border-2 border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all group"
          >
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0 group-hover:bg-orange-200">
              <span className="text-orange-600 font-bold text-sm">HK</span>
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Hendrik</p>
              <p className="text-xs text-gray-400">CEO - Full access</p>
            </div>
          </button>
          <button
            onClick={() => onSelect('JUANIC')}
            className="w-full flex items-center gap-4 px-5 py-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0 group-hover:bg-blue-200">
              <span className="text-blue-600 font-bold text-sm">JU</span>
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Juanic</p>
              <p className="text-xs text-gray-400">Admin - RFQ management</p>
            </div>
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 pb-4">PUSH AI Foundation</p>
      </div>
    </div>
  )
}

'@

# Insert RoleSelector before the first function that starts with "function App("
$appFnMarker = 'function App('
$insertIdx = $content.IndexOf($appFnMarker)
if ($insertIdx -lt 0) {
    Write-Host "ERROR: Could not find 'function App(' in App.tsx" -ForegroundColor Red
    exit 1
}
$content = $content.Substring(0, $insertIdx) + $roleSelectorComponent + $content.Substring($insertIdx)
Write-Host "RoleSelector component inserted." -ForegroundColor Green

# ── 2. ADD currentRole STATE TO App() ────────────────────────────────────────
$oldAppState = 'const [activeBoard, setActiveBoard] = useState<'
$newAppState = 'const [currentRole, setCurrentRole] = useState<string | null>(null)
  const [activeBoard, setActiveBoard] = useState<'

if ($content.IndexOf($oldAppState) -lt 0) {
    Write-Host "ERROR: Could not find activeBoard state in App()" -ForegroundColor Red
    exit 1
}
$content = $content.Replace($oldAppState, $newAppState)
Write-Host "currentRole state added to App()." -ForegroundColor Green

# ── 3. ADD ROLE SELECTOR RENDER AT START OF App() RETURN ─────────────────────
$oldReturn = '  return (
    <div className="flex h-screen'
$newReturn = '  if (!currentRole) return <RoleSelector onSelect={setCurrentRole} />

  return (
    <div className="flex h-screen'

if ($content.IndexOf($oldReturn) -lt 0) {
    Write-Host "ERROR: Could not find App() return statement" -ForegroundColor Red
    exit 1
}
$content = $content.Replace($oldReturn, $newReturn)
Write-Host "Role gate added to App() render." -ForegroundColor Green

# ── 4. PASS role TO RFQDetailPanel ───────────────────────────────────────────
$oldPanel = '<RFQDetailPanel rfq={selectedRFQ} onClose={() => setSelectedRFQ(null)} onUpdate={handleRFQUpdate} />'
$newPanel = '<RFQDetailPanel rfq={selectedRFQ} onClose={() => setSelectedRFQ(null)} onUpdate={handleRFQUpdate} role={currentRole} />'

if ($content.IndexOf($oldPanel) -lt 0) {
    Write-Host "ERROR: Could not find RFQDetailPanel usage" -ForegroundColor Red
    exit 1
}
$content = $content.Replace($oldPanel, $newPanel)
Write-Host "role prop passed to RFQDetailPanel." -ForegroundColor Green

# ── 5. UPDATE RFQDetailPanel SIGNATURE TO ACCEPT role PROP ───────────────────
$oldPanelFn = 'function RFQDetailPanel({ rfq, onClose, onUpdate }: { rfq: RFQ; onClose: () => void; onUpdate: (rfq: RFQ) => void })'
$newPanelFn = 'function RFQDetailPanel({ rfq, onClose, onUpdate, role }: { rfq: RFQ; onClose: () => void; onUpdate: (rfq: RFQ) => void; role: string | null })'

if ($content.IndexOf($oldPanelFn) -lt 0) {
    Write-Host "ERROR: Could not find RFQDetailPanel function signature" -ForegroundColor Red
    exit 1
}
$content = $content.Replace($oldPanelFn, $newPanelFn)
Write-Host "RFQDetailPanel signature updated." -ForegroundColor Green

# ── 6. GATE ASSIGN QUOTER SECTION BEHIND HENDRIK ROLE ────────────────────────
$oldAssignSection = '            {(rfq.status === ''NEW'' || rfq.status === ''PENDING'') && ('
$newAssignSection = '            {role === ''HENDRIK'' && (rfq.status === ''NEW'' || rfq.status === ''PENDING'') && ('

if ($content.IndexOf($oldAssignSection) -lt 0) {
    Write-Host "WARNING: Could not find assign quoter gate - may need manual check" -ForegroundColor Yellow
} else {
    $content = $content.Replace($oldAssignSection, $newAssignSection)
    Write-Host "Assign quoter gated to Hendrik only." -ForegroundColor Green
}

# ── 7. ADD ROLE INDICATOR TO SIDEBAR ─────────────────────────────────────────
$oldSidebarFooter = '<p className="text-gray-500 text-xs text-center py-3">PUSH AI Foundation</p>'
$newSidebarFooter = '<div className="px-4 py-3 border-t border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ' + "'" + '" + (currentRole === ' + "'" + 'HENDRIK' + "'" + ' ? ' + "'" + 'bg-orange-500 text-white' + "'" + ' : ' + "'" + 'bg-blue-500 text-white' + "'" + ')}">' + "'" + '{currentRole === ' + "'" + 'HENDRIK' + "'" + ' ? ' + "'" + 'HK' + "'" + ' : ' + "'" + 'JU' + "'" + '}</div>
            <div>
              <p className="text-white text-xs font-semibold">{currentRole === ' + "'" + 'HENDRIK' + "'" + ' ? ' + "'" + 'Hendrik' + "'" + ' : ' + "'" + 'Juanic' + "'" + '}</p>
              <button onClick={() => setCurrentRole(null)} className="text-gray-500 text-xs hover:text-gray-300">Switch user</button>
            </div>
          </div>
        </div>'

# Simpler approach - just add switch user button
$oldFooter = '<p className="text-gray-500 text-xs text-center py-3">PUSH AI Foundation</p>'
$newFooter = '<div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between">
          <p className="text-gray-500 text-xs">PUSH AI Foundation</p>
          <button onClick={() => setCurrentRole(null)} className="text-gray-500 text-xs hover:text-white transition-colors">Switch</button>
        </div>'

if ($content.IndexOf($oldFooter) -ge 0) {
    $content = $content.Replace($oldFooter, $newFooter)
    Write-Host "Switch user button added to sidebar." -ForegroundColor Green
}

# ── WRITE FILE ────────────────────────────────────────────────────────────────
[System.IO.File]::WriteAllText($appTsxPath, $content, [System.Text.Encoding]::ASCII)

Write-Host ""
Write-Host "Done! Role selector deployed." -ForegroundColor Green
Write-Host ""
Write-Host "What changed:" -ForegroundColor Cyan
Write-Host "  - App now shows Who are you? screen on load" -ForegroundColor White
Write-Host "  - Hendrik: sees Assign Quoter + full access" -ForegroundColor White
Write-Host "  - Juanic: sees everything except Assign Quoter" -ForegroundColor White
Write-Host "  - Switch user button in sidebar bottom left" -ForegroundColor White
Write-Host ""
Write-Host "Next: npm run dev" -ForegroundColor Yellow
