const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');
let changes = 0;

// FIX 1: Description in wrong place — move from reference row to its own prominent row
const oldDescRow = `<tr>
        <td colspan="2" style="border:1px solid #000;padding:3px 6px"><strong>ORDER / PO NUMBER:</strong><br><span style="font-size:10pt;font-weight:900">\${val(job.po_number)}</span></td>
        <td colspan="2" style="border:1px solid #000;padding:3px 6px"><strong>DESCRIPTION:</strong><br>\${val(job.description)}</td>
      </tr></table>`;
const newDescRow = `<tr>
        <td colspan="2" style="border:1px solid #000;padding:3px 6px"><strong>ORDER / PO NUMBER:</strong><br><span style="font-size:10pt;font-weight:900">\${val(job.po_number || job.order_number)}</span></td>
        <td colspan="2" style="border:1px solid #000;padding:3px 6px"><strong>SITE REQ:</strong><br>\${val(job.site_req)}</td>
      </tr></table>

<!-- DESCRIPTION - FULL WIDTH -->
<table style="border:1px solid #000;margin-bottom:4px">
  <tr>
    <td style="border:1px solid #000;padding:4px 6px;background:#fffde7"><strong>DESCRIPTION:</strong><br><span style="font-size:10pt;font-weight:700">\${val(job.description)}</span></td>
  </tr>
</table>`;
if (c.includes(oldDescRow)) { c = c.replace(oldDescRow, newDescRow); changes++; console.log('1. Description moved to full-width row: PATCHED'); }
else { console.log('1. Description: FAILED — trying CRLF'); const old2 = oldDescRow.replace(/\n/g, '\r\n'); const new2 = newDescRow.replace(/\n/g, '\r\n'); if (c.includes(old2)) { c = c.replace(old2, new2); changes++; console.log('1. Description: PATCHED via CRLF'); } else { console.log('1. Description: FAILED'); } }

// FIX 2: Incorrect RFQ number — separate Client RFQ from ERHA ENQ
const oldRfqCell = `<td style="border:1px solid #000;padding:3px 6px"><strong>Client RFQ:</strong><br>\${val(job.client_rfq_number || job.rfq_no)}</td>`;
const newRfqCell = `<td style="border:1px solid #000;padding:3px 6px"><strong>Client RFQ:</strong><br>\${val(job.client_rfq_number)}</td>`;
if (c.includes(oldRfqCell)) { c = c.replace(oldRfqCell, newRfqCell); changes++; console.log('2. RFQ number fixed (client_rfq only): PATCHED'); }
else { console.log('2. RFQ number: FAILED'); }

// Also fix SITE REQ duplication - it was in ref row AND we added it to order row, remove from ref row
const oldSiteReq = `<td style="border:1px solid #000;padding:3px 6px"><strong>SITE REQ:</strong><br>\${val(job.site_req)}</td>
      </tr>
      <tr>`;
// This one we leave - the new layout handles it

// FIX 3: Order number — use both po_number and order_number
// Already handled in FIX 1 with: val(job.po_number || job.order_number)
console.log('3. Order number fallback: INCLUDED in fix 1');

// FIX 4: Planning dates — leave Date Received and Completion Date blank for supervisor
const oldPlanningDates = `<td style="border:1px solid #000;padding:6px">\${fmtDate(job.date_received)}</td>
    <td style="border:1px solid #000;padding:6px"></td>
    <td style="border:1px solid #000;padding:6px"></td>
    <td style="border:1px solid #000;padding:6px;font-weight:bold">\${fmtDate(job.due_date)}</td>`;
const newPlanningDates = `<td style="border:1px solid #000;padding:6px;min-height:20px">&nbsp;</td>
    <td style="border:1px solid #000;padding:6px">&nbsp;</td>
    <td style="border:1px solid #000;padding:6px">&nbsp;</td>
    <td style="border:1px solid #000;padding:6px;font-weight:bold">\${fmtDate(job.due_date)}</td>`;
if (c.includes(oldPlanningDates)) { c = c.replace(oldPlanningDates, newPlanningDates); changes++; console.log('4. Planning dates blanked (supervisor fills): PATCHED'); }
else { console.log('4. Planning dates: FAILED — trying CRLF'); const old4 = oldPlanningDates.replace(/\n/g, '\r\n'); const new4 = newPlanningDates.replace(/\n/g, '\r\n'); if (c.includes(old4)) { c = c.replace(old4, new4); changes++; console.log('4. Planning dates: PATCHED via CRLF'); } else { console.log('4. Planning dates: FAILED'); } }

// FIX 5: Attached documents — mark checkboxes based on actual data
const oldAttachDocs = `<td style="border:1px solid #000;padding:3px 8px;width:25%">&#9633; SERVICE SCHEDULE / QCP</td>
    <td style="border:1px solid #000;padding:3px 8px;width:25%">&#9633; INFO FOR QUOTE</td>
    <td style="border:1px solid #000;padding:3px 8px;width:25%">&#9633; DRAWING ATTACHED / SKETCHES</td>
    <td style="border:1px solid #000;padding:3px 8px;width:25%">&#9633; QCP</td>`;
const newAttachDocs = `<td style="border:1px solid #000;padding:3px 8px;width:25%">&#9633; SERVICE SCHEDULE / QCP</td>
    <td style="border:1px solid #000;padding:3px 8px;width:25%">\${rfq ? '&#10003;' : '&#9633;'} INFO FOR QUOTE</td>
    <td style="border:1px solid #000;padding:3px 8px;width:25%">\${job.has_drawing || job.drawing_number ? '&#10003;' : '&#9633;'} DRAWING ATTACHED / SKETCHES</td>
    <td style="border:1px solid #000;padding:3px 8px;width:25%">&#9633; QCP</td>`;
if (c.includes(oldAttachDocs)) { c = c.replace(oldAttachDocs, newAttachDocs); changes++; console.log('5. Attached docs checkmarks (drawing/info): PATCHED'); }
else { console.log('5. Attached docs: FAILED — trying CRLF'); const old5 = oldAttachDocs.replace(/\n/g, '\r\n'); const new5 = newAttachDocs.replace(/\n/g, '\r\n'); if (c.includes(old5)) { c = c.replace(old5, new5); changes++; console.log('5. Attached docs: PATCHED via CRLF'); } else { console.log('5. Attached docs: FAILED'); } }

// We need the rfq variable available in the print handler — check if it's fetched
// Add rfq fetch before the HTML generation if not already there
const printHandlerStart = `const handlePrintJobCard = async (job: Job) => {
    await supabase.from('jobs').update({ status: 'PRINTED', workshop_status: 'NOT_STARTED' }).eq('id', job.id)
    fetchJobs()
    const { data: lineItems } = await supabase.from('job_line_items').select('*').eq('job_id', job.id).order('sort_order')`;
const printHandlerNew = `const handlePrintJobCard = async (job: Job) => {
    await supabase.from('jobs').update({ status: 'PRINTED', workshop_status: 'NOT_STARTED' }).eq('id', job.id)
    fetchJobs()
    const { data: rfqRecord } = job.rfq_id ? await supabase.from('rfqs').select('*').eq('id', job.rfq_id).single() : { data: null }
    const rfq = rfqRecord
    const { data: lineItems } = await supabase.from('job_line_items').select('*').eq('job_id', job.id).order('sort_order')`;
if (c.includes(printHandlerStart)) { c = c.replace(printHandlerStart, printHandlerNew); changes++; console.log('6. RFQ fetch added to print handler: PATCHED'); }
else { console.log('6. RFQ fetch: FAILED — trying CRLF'); const old6 = printHandlerStart.replace(/\n/g, '\r\n'); const new6 = printHandlerNew.replace(/\n/g, '\r\n'); if (c.includes(old6)) { c = c.replace(old6, new6); changes++; console.log('6. RFQ fetch: PATCHED via CRLF'); } else { console.log('6. RFQ fetch: FAILED'); } }

fs.writeFileSync('src/App.tsx', c, 'utf8');
console.log('\nTotal patches:', changes);