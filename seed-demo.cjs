const { createClient } = require('@supabase/supabase-js')
const sb = createClient(
  'https://lvaqqqyjqtguozmdjmfn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2YXFxcXlqcXRndW96bWRqbWZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MTk2NzYsImV4cCI6MjA4NDA5NTY3Nn0._a09PreXgLIXSrSIqCdetmfgJDVvV3kN-aNa0myax7g'
)

async function seed() {
  console.log('Seeding demo data...\n')

  // ── RFQ 1: Rand Water — NEW ──
  const { data: rfq1 } = await sb.from('rfqs').insert({
    rfq_no: 'ENQ-26-001', enq_number: 'ENQ-26-001',
    client_name: 'Rand Water Vereeniging', description: 'Supply and install new pump station piping',
    priority: 'HIGH', status: 'NEW',
    request_date: '2026-04-03', required_date: '2026-04-30',
  }).select().single()
  console.log('✅ RFQ1:', rfq1?.rfq_no, '— NEW')

  // ── RFQ 2: Sasol — ASSIGNED ──
  const { data: rfq2 } = await sb.from('rfqs').insert({
    rfq_no: 'ENQ-26-002', enq_number: 'ENQ-26-002',
    client_name: 'Sasol Sasolburg', description: 'Reactor vessel maintenance and repair',
    priority: 'URGENT', status: 'ASSIGNED', assigned_quoter: 'Dewald',
    request_date: '2026-04-02', required_date: '2026-04-18',
  }).select().single()
  console.log('✅ RFQ2:', rfq2?.rfq_no, '— ASSIGNED to Dewald')

  // ── RFQ 3: ArcelorMittal — QUOTED ──
  const { data: rfq3 } = await sb.from('rfqs').insert({
    rfq_no: 'ENQ-26-003', enq_number: 'ENQ-26-003',
    client_name: 'ArcelorMittal Vanderbijlpark', description: 'Conveyor system structural steelwork',
    priority: 'MEDIUM', status: 'QUOTED', assigned_quoter: 'Jaco',
    quote_number: 'Q-26-001', quote_value_excl: 185000,
    request_date: '2026-03-28', required_date: '2026-05-15',
  }).select().single()
  console.log('✅ RFQ3:', rfq3?.rfq_no, '— QUOTED R185,000')

  // Add line items to RFQ3
  await sb.from('rfq_line_items').insert([
    { rfq_id: rfq3.id, description: 'Structural steel H-beams 254x146', quantity: 12, uom: 'Each', unit_price: 8500, line_total: 102000, sort_order: 0 },
    { rfq_id: rfq3.id, description: 'Base plates 400x400x20mm', quantity: 24, uom: 'Each', unit_price: 1200, line_total: 28800, sort_order: 1 },
    { rfq_id: rfq3.id, description: 'Fabrication and welding labour', quantity: 120, uom: 'Hour', unit_price: 450, line_total: 54000, sort_order: 2 },
  ])

  // ── JOB 1: Natref — PENDING ──
  const { data: job1 } = await sb.from('jobs').insert({
    job_number: 'JOB-26-001', client_name: 'Natref Sasolburg',
    description: 'Heat exchanger tube bundle replacement',
    priority: 'HIGH', status: 'PENDING', entry_type: 'DIRECT',
    date_received: '2026-04-03', due_date: '2026-04-22',
    compiled_by: 'Juanic',
  }).select().single()
  console.log('✅ JOB1:', job1?.job_number, '— PENDING')

  // ── JOB 2: Omnia — IN_REVIEW ──
  const { data: job2 } = await sb.from('jobs').insert({
    job_number: 'JOB-26-002', client_name: 'Omnia Sasolburg',
    description: 'Agitator shaft manufacturing and balancing',
    priority: 'MEDIUM', status: 'IN_REVIEW', entry_type: 'DIRECT',
    date_received: '2026-04-01', due_date: '2026-04-28',
    compiled_by: 'Cherise', has_drawing: true, drawing_number: 'DWG-AG-2026-01',
  }).select().single()
  console.log('✅ JOB2:', job2?.job_number, '— IN_REVIEW')

  // Add line items to Job 2
  await sb.from('job_line_items').insert([
    { job_id: job2.id, description: 'EN8 Bright bar 100mm dia x 2000mm', quantity: 1, uom: 'Each', status: 'PENDING', sort_order: 0, cost_price: 0, sell_price: 0, line_total: 0, can_spawn_job: true },
    { job_id: job2.id, description: 'Dynamic balancing', quantity: 1, uom: 'Each', status: 'PENDING', sort_order: 1, cost_price: 0, sell_price: 0, line_total: 0, can_spawn_job: true },
    { job_id: job2.id, description: 'CNC machining to drawing', quantity: 1, uom: 'Set', status: 'PENDING', sort_order: 2, cost_price: 0, sell_price: 0, line_total: 0, can_spawn_job: true },
  ])

  // ── JOB 3: Columbus — READY_TO_PRINT ──
  const { data: job3 } = await sb.from('jobs').insert({
    job_number: 'JOB-26-003', client_name: 'Columbus Stainless Middelburg',
    description: 'Stainless steel chute liners fabrication',
    priority: 'NORMAL', status: 'READY_TO_PRINT', entry_type: 'DIRECT',
    date_received: '2026-03-29', due_date: '2026-04-25',
    compiled_by: 'Juanic', action_cut: true, action_manufacture: true, action_paint: true,
  }).select().single()
  console.log('✅ JOB3:', job3?.job_number, '— READY_TO_PRINT')

  // ── JOB 4: Sappi — WORKSHOP NOT_STARTED (with workers) ──
  const { data: job4 } = await sb.from('jobs').insert({
    job_number: 'JOB-26-004', client_name: 'Sappi Ngodwana',
    description: 'Pulp digester access platform fabrication',
    priority: 'HIGH', status: 'PRINTED', entry_type: 'DIRECT',
    workshop_status: 'NOT_STARTED',
    date_received: '2026-03-27', due_date: '2026-04-20',
    compiled_by: 'Juanic', action_manufacture: true, action_sandblast: true, action_paint: true,
  }).select().single()
  console.log('✅ JOB4:', job4?.job_number, '— WORKSHOP NOT_STARTED')

  await sb.from('job_workers').insert([
    { job_id: job4.id, worker_name: 'MM MODISE', clock_number: 'C001', pay_method: 'EFT', payment_amount: 350 },
    { job_id: job4.id, worker_name: 'LC MATHANG', clock_number: 'C002', pay_method: 'EFT', payment_amount: 350 },
  ])
  console.log('   → 2 workers assigned')

  // ── JOB 5: Eskom — WORKSHOP IN_PROGRESS (workers clocked in + materials) ──
  const startTime = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3 hours ago
  const { data: job5 } = await sb.from('jobs').insert({
    job_number: 'JOB-26-005', client_name: 'Eskom Lethabo',
    description: 'Boiler tube replacement and welding',
    priority: 'URGENT', status: 'PRINTED', entry_type: 'DIRECT',
    workshop_status: 'IN_PROGRESS', time_started_at: startTime,
    date_received: '2026-03-25', due_date: '2026-04-12',
    compiled_by: 'Cherise', action_manufacture: true, action_repair: true, action_cut: true,
  }).select().single()
  console.log('✅ JOB5:', job5?.job_number, '— WORKSHOP IN_PROGRESS')

  await sb.from('job_workers').insert([
    { job_id: job5.id, worker_name: 'K NYIDE', clock_number: 'C003', pay_method: 'EFT', payment_amount: 400, clocked_in_at: startTime },
    { job_id: job5.id, worker_name: 'TI NTSHALA', clock_number: 'C004', pay_method: 'EFT', payment_amount: 400, clocked_in_at: startTime },
    { job_id: job5.id, worker_name: 'LE MOLEFE', clock_number: 'C005', pay_method: 'Cash', payment_amount: 380, clocked_in_at: startTime },
  ])
  console.log('   → 3 workers clocked in')

  await sb.from('job_materials').insert([
    { job_id: job5.id, description: 'Boiler tube 51mm x 5mm seamless', quantity: 6, unit: 'M', notes: 'K NYIDE' },
    { job_id: job5.id, description: 'Welding rods E7018 3.15mm', quantity: 2, unit: 'KG', notes: 'TI NTSHALA' },
    { job_id: job5.id, description: 'Grinding discs 115mm', quantity: 4, unit: 'EA', notes: 'K NYIDE' },
  ])
  console.log('   → 3 materials logged')

  // ── JOB 6: Thermitec — WORKSHOP QUALITY_CHECK (all 9 QC signed) ──
  const { data: job6 } = await sb.from('jobs').insert({
    job_number: 'JOB-26-006', client_name: 'Thermitec Sasolburg',
    description: 'Cooling tower fan blade repair and balance',
    priority: 'MEDIUM', status: 'PRINTED', entry_type: 'DIRECT',
    workshop_status: 'QUALITY_CHECK',
    time_started_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    date_received: '2026-03-22', due_date: '2026-04-15',
    compiled_by: 'Juanic', action_repair: true, action_sandblast: true, action_paint: true,
  }).select().single()
  console.log('✅ JOB6:', job6?.job_number, '— WORKSHOP QUALITY_CHECK')

  const qcDescs = [
    'Mark out all material and check prior to cutting',
    'Cut all material, deburr holes, dress and remove all sharp edges',
    'Assy and inspect prior to welding (water passes if applicable)',
    'Do welding complete as per WPS?',
    'Do a pressure test on water cooled unit if applicable?',
    'Clean all spatter and ensure NO sharp edges on workpiece',
    'Do 100% dimensional and visual inspection prior to painting',
    'Stamp and paint as required',
    'Final inspection - Sticker, Sign, Paperwork, Ready for delivery',
  ]
  const qcInserts = qcDescs.map((desc, i) => ({
    job_id: job6.id, checkpoint_number: i + 1, description: desc,
    signed_off: true, signed_off_by: i < 5 ? 'Dewald' : 'Hendrik',
    signed_off_at: new Date(Date.now() - (9 - i) * 60 * 60 * 1000).toISOString(),
  }))
  await sb.from('job_qc_checkpoints').insert(qcInserts)
  console.log('   → 9/9 QC checkpoints signed')

  await sb.from('job_workers').insert([
    { job_id: job6.id, worker_name: 'TIMOTHY SMITH', clock_number: 'C006', pay_method: 'EFT', payment_amount: 420, clocked_in_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), clocked_out_at: new Date(Date.now() - 32 * 60 * 60 * 1000).toISOString(), total_minutes: 960 },
  ])
  console.log('   → 1 worker completed (16h)')

  // ── JOB 7: Cape Gate — WORKSHOP COMPLETE (ready for dispatch) ──
  const { data: job7 } = await sb.from('jobs').insert({
    job_number: 'JOB-26-007', client_name: 'Cape Gate Vanderbijlpark',
    description: 'Wire drawing die holder manufacturing',
    priority: 'NORMAL', status: 'PRINTED', entry_type: 'DIRECT',
    workshop_status: 'COMPLETE',
    time_started_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    date_received: '2026-03-20', due_date: '2026-04-10',
    compiled_by: 'Cherise', action_manufacture: true, action_cut: true,
  }).select().single()
  console.log('✅ JOB7:', job7?.job_number, '— WORKSHOP COMPLETE')

  const qcInserts7 = qcDescs.map((desc, i) => ({
    job_id: job7.id, checkpoint_number: i + 1, description: desc,
    signed_off: true, signed_off_by: 'Jaco',
    signed_off_at: new Date(Date.now() - (72 - i * 4) * 60 * 60 * 1000).toISOString(),
  }))
  await sb.from('job_qc_checkpoints').insert(qcInserts7)

  await sb.from('job_workers').insert([
    { job_id: job7.id, worker_name: 'GEORGE HUMAN', clock_number: 'C007', pay_method: 'EFT', payment_amount: 450, clocked_in_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), clocked_out_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), total_minutes: 1440 },
    { job_id: job7.id, worker_name: 'TN TLALI', clock_number: 'C008', pay_method: 'Cash', payment_amount: 380, clocked_in_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), clocked_out_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), total_minutes: 1440 },
  ])

  await sb.from('job_materials').insert([
    { job_id: job7.id, description: 'Tool steel D2 round bar 80mm', quantity: 2, unit: 'M', notes: 'GEORGE HUMAN' },
    { job_id: job7.id, description: 'Carbide inserts CNMG 120408', quantity: 10, unit: 'EA', notes: 'TN TLALI' },
    { job_id: job7.id, description: 'Cutting oil 5L', quantity: 1, unit: 'EA', notes: 'GEORGE HUMAN' },
    { job_id: job7.id, description: 'Surface grinding coolant', quantity: 2, unit: 'L', notes: 'TN TLALI' },
  ])
  console.log('   → 2 workers completed, 4 materials logged, 9/9 QC signed')

  console.log('\n🎯 DEMO DATA SEEDED SUCCESSFULLY')
  console.log('─────────────────────────────────')
  console.log('RFQ Board:      3 RFQs (New, Assigned, Quoted)')
  console.log('Job Board:      3 Jobs (Pending, In Review, Ready to Print)')
  console.log('Workshop Board: 4 Jobs (Not Started, In Progress, Quality Check, Complete)')
  console.log('Workers:        8 assigned across 4 workshop jobs')
  console.log('Materials:      7 items logged')
  console.log('QC Checkpoints: 18 signed (2 jobs with 9/9)')
  console.log('─────────────────────────────────')
  console.log('Ready for Wednesday demo! 🔥')
}

seed().catch(e => console.error('SEED ERROR:', e.message))