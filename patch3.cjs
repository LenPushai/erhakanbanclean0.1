const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, 'src', 'App.tsx')
const modalFile = path.join(__dirname, 'modal.tsx')

let c = fs.readFileSync(file, 'utf8')
const modalContent = fs.readFileSync(modalFile, 'utf8')
console.log('App.tsx:', c.split('\n').length, 'lines')
console.log('modal.tsx:', modalContent.split('\n').length, 'lines')

let patched = 0

// 1. Add showCreateDirectJob + selectedJob state
const oldState = "  const [showCreateModal, setShowCreateModal] = useState(false)"
const newState = "  const [showCreateModal, setShowCreateModal] = useState(false)\n  const [showCreateDirectJob, setShowCreateDirectJob] = useState(false)\n  const [selectedJob, setSelectedJob] = useState(null)"

if (!c.includes('showCreateDirectJob')) {
  if (c.includes(oldState)) {
    c = c.replace(oldState, newState)
    console.log('1. State: PATCHED')
    patched++
  } else { console.log('1. State: NOT FOUND'); process.exit(1) }
} else { console.log('1. State: already present') }

// 2. Add New Job button
const oldBtn = "            {activeBoard === 'rfq' && (\n              <button onClick={() => setShowCreateModal(true)} className=\"flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors\">\n                <Plus size={15} />New Work Order\n              </button>\n            )}"
const newBtn = oldBtn + "\n            {activeBoard === 'job' && (\n              <button onClick={() => setShowCreateDirectJob(true)} className=\"flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors\">\n                <Plus size={15} />New Job\n              </button>\n            )}"

if (!c.includes('showCreateDirectJob(true)')) {
  if (c.includes(oldBtn)) {
    c = c.replace(oldBtn, newBtn)
    console.log('2. New Job button: PATCHED')
    patched++
  } else { console.log('2. New Job button: NOT FOUND'); process.exit(1) }
} else { console.log('2. New Job button: already present') }

// 3. Add modal render
const oldModal = "      {showCreateModal && <CreateRFQModal onClose={() => setShowCreateModal(false)} onCreated={handleRFQCreated} />}"
const newModal = oldModal + "\n      {showCreateDirectJob && <CreateDirectJobModal onClose={() => setShowCreateDirectJob(false)} onCreated={() => { setShowCreateDirectJob(false); fetchJobs() }} />}"

if (!c.includes('CreateDirectJobModal')) {
  if (c.includes(oldModal)) {
    c = c.replace(oldModal, newModal)
    console.log('3. Modal render: PATCHED')
    patched++
  } else { console.log('3. Modal render: NOT FOUND'); process.exit(1) }
} else { console.log('3. Modal render: already present') }

// 4. Insert modal component before // CREATE RFQ MODAL
const insertPoint = '// CREATE RFQ MODAL'
if (!c.includes('function CreateDirectJobModal')) {
  if (c.includes(insertPoint)) {
    c = c.replace(insertPoint, modalContent + insertPoint)
    console.log('4. Modal component: PATCHED')
    patched++
  } else { console.log('4. Modal component: INSERT POINT NOT FOUND'); process.exit(1) }
} else { console.log('4. Modal component: already present') }

fs.writeFileSync(file, c, 'utf8')
console.log('')
console.log('Patched', patched, 'locations')
console.log('Written', c.split('\n').length, 'lines')
console.log('')
console.log('Done! Run: npx vite --force')
