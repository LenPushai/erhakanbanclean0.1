$file = "src\App.tsx"
$lines = Get-Content $file

# ── STEP 1: Add user + authLoading state after line 214 ──
$insert1 = @(
  "  const [user, setUser] = useState<any>(null)",
  "  const [authLoading, setAuthLoading] = useState(true)"
)
$lines = $lines[0..213] + $insert1 + $lines[214..($lines.Length-1)]

# ── STEP 2: Find the first useEffect line and insert auth useEffect before it ──
$authEffect = @(
  "  // Auth session check",
  "  useEffect(() => {",
  "    supabase.auth.getSession().then(({ data: { session } }) => {",
  "      setUser(session?.user ?? null)",
  "      setAuthLoading(false)",
  "    })",
  "    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {",
  "      setUser(session?.user ?? null)",
  "    })",
  "    return () => subscription.unsubscribe()",
  "  }, [])",
  ""
)
$firstUseEffect = -1
for ($i = 0; $i -lt $lines.Length; $i++) {
  if ($lines[$i] -match "^\s+useEffect\(") {
    $firstUseEffect = $i
    break
  }
}
$lines = $lines[0..($firstUseEffect-1)] + $authEffect + $lines[$firstUseEffect..($lines.Length-1)]

# ── STEP 3: Find the return ( line and insert auth guard + login screen before it ──
$loginScreen = @(
  "  // Auth guard",
  "  if (authLoading) return (",
  "    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#f7f8fb', fontFamily:'sans-serif', color:'#1d3461', fontSize:'14px' }}>",
  "      Loading...",
  "    </div>",
  "  )",
  "",
  "  if (!user) return (",
  "    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#f7f8fb', fontFamily:'sans-serif' }}>",
  "      <div style={{ background:'white', border:'1px solid #dde3ec', borderRadius:'8px', padding:'40px 48px', width:'360px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>",
  "        <div style={{ textAlign:'center', marginBottom:'28px' }}>",
  "          <div style={{ width:'44px', height:'44px', background:'#4db848', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', color:'white', fontWeight:700, fontSize:'18px' }}>E</div>",
  "          <div style={{ fontSize:'18px', fontWeight:700, color:'#1d3461', marginBottom:'4px' }}>ERHA Operations</div>",
  "          <div style={{ fontSize:'12px', color:'#8896a8' }}>Meld aan om voort te gaan</div>",
  "        </div>",
  "        <LoginForm onLogin={setUser} />",
  "      </div>",
  "    </div>",
  "  )",
  ""
)
$returnLine = -1
for ($i = 0; $i -lt $lines.Length; $i++) {
  if ($lines[$i] -match "^\s+return \(") {
    $returnLine = $i
    break
  }
}
$lines = $lines[0..($returnLine-1)] + $loginScreen + $lines[$returnLine..($lines.Length-1)]

# ── STEP 4: Find the export default line and insert LoginForm component before it ──
$loginComponent = @(
  "// ── Login Form Component ──────────────────────────────────────────────────",
  "function LoginForm({ onLogin }: { onLogin: (user: any) => void }) {",
  "  const [email, setEmail] = React.useState('')",
  "  const [password, setPassword] = React.useState('')",
  "  const [error, setError] = React.useState<string | null>(null)",
  "  const [loading, setLoading] = React.useState(false)",
  "",
  "  const handleLogin = async () => {",
  "    setLoading(true)",
  "    setError(null)",
  "    const { data, error } = await supabase.auth.signInWithPassword({ email, password })",
  "    if (error) {",
  "      setError('Ongeldige e-pos of wagwoord')",
  "      setLoading(false)",
  "    } else {",
  "      onLogin(data.user)",
  "    }",
  "  }",
  "",
  "  const inputStyle: React.CSSProperties = {",
  "    width:'100%', padding:'10px 12px', border:'1px solid #dde3ec',",
  "    borderRadius:'6px', fontSize:'13px', color:'#1d3461',",
  "    outline:'none', fontFamily:'sans-serif', marginBottom:'12px',",
  "    boxSizing:'border-box' as any",
  "  }",
  "",
  "  return (",
  "    <div>",
  "      <div style={{ marginBottom:'6px', fontSize:'11px', fontWeight:600, color:'#4a5568', textTransform:'uppercase', letterSpacing:'0.06em' }}>E-posadres</div>",
  "      <input",
  "        type='email'",
  "        value={email}",
  "        onChange={e => setEmail(e.target.value)}",
  "        onKeyDown={e => e.key === 'Enter' && handleLogin()}",
  "        placeholder='jou@erha.co.za'",
  "        style={inputStyle}",
  "      />",
  "      <div style={{ marginBottom:'6px', fontSize:'11px', fontWeight:600, color:'#4a5568', textTransform:'uppercase', letterSpacing:'0.06em' }}>Wagwoord</div>",
  "      <input",
  "        type='password'",
  "        value={password}",
  "        onChange={e => setPassword(e.target.value)}",
  "        onKeyDown={e => e.key === 'Enter' && handleLogin()}",
  "        placeholder='••••••••'",
  "        style={{ ...inputStyle, marginBottom:'16px' }}",
  "      />",
  "      {error && <div style={{ fontSize:'12px', color:'#e05c5c', marginBottom:'12px', textAlign:'center' }}>{error}</div>}",
  "      <button",
  "        onClick={handleLogin}",
  "        disabled={loading}",
  "        style={{",
  "          width:'100%', padding:'11px', background: loading ? '#8ec88b' : '#4db848',",
  "          color:'white', border:'none', borderRadius:'6px', fontSize:'13px',",
  "          fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer',",
  "          fontFamily:'sans-serif', letterSpacing:'0.04em'",
  "        }}",
  "      >",
  "        {loading ? 'Besig...' : 'Aanmeld'}",
  "      </button>",
  "      <div style={{ textAlign:'center', marginTop:'20px', fontSize:'11px', color:'#8896a8' }}>ERHA Operations · PUSH AI · Spreuke 16:3</div>",
  "    </div>",
  "  )",
  "}",
  ""
)
$exportLine = -1
for ($i = 0; $i -lt $lines.Length; $i++) {
  if ($lines[$i] -match "^export default App") {
    $exportLine = $i
    break
  }
}
$lines = $lines[0..($exportLine-1)] + $loginComponent + $lines[$exportLine..($lines.Length-1)]

# ── STEP 5: Add logout button to the header ──
# Find the header area — look for the board selector tabs line
$headerLogout = @(
  "            {/* Logout */}",
  "            <button",
  "              onClick={async () => { await supabase.auth.signOut(); setUser(null) }}",
  "              style={{",
  "                padding:'6px 14px', background:'transparent', border:'1px solid rgba(255,255,255,0.3)',",
  "                borderRadius:'4px', color:'white', fontSize:'11px', cursor:'pointer',",
  "                fontWeight:600, letterSpacing:'0.04em'",
  "              }}",
  "            >",
  "              Afmeld · {user?.email?.split('@')[0]}",
  "            </button>"
)
$headerTarget = -1
for ($i = 0; $i -lt $lines.Length; $i++) {
  if ($lines[$i] -match "activeBoard === 'rfq'" -and $lines[$i] -match "onClick") {
    $headerTarget = $i
    break
  }
}
$lines = $lines[0..($headerTarget-1)] + $headerLogout + $lines[$headerTarget..($lines.Length-1)]

# ── Write file ──
$lines | Set-Content $file -Encoding UTF8
Write-Host "Auth patch applied successfully. Lines: $($lines.Length)"