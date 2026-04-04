const fs = require('fs');

// ADD 4 NEW FUNCTIONS TO emailService.ts
let e = fs.readFileSync('src/emailService.ts', 'utf8');

const newFunctions = `
export async function emailJobStarted(job: any) {
  const subject = \`? Job Started ? \${job.job_number}\`
  const html = \`<div style="max-width:600px;margin:0 auto">
    <div style="\${headerStyle}"><h2 style="margin:0">? Job Started</h2></div>
    <div style="\${bodyStyle}">
      <p style="margin-bottom:16px">A job has been started on the workshop floor.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
        \${infoRow('Job Number', job.job_number)}
        \${infoRow('Client', job.client_name)}
        \${infoRow('Description', job.description)}
        \${infoRow('Due Date', job.due_date)}
        \${infoRow('Priority', job.priority)}
      </table>
      \${footer}
    </div>
  </div>\`
  await sendEmail(ALL, subject, html)
}

export async function emailJobQCCheck(job: any) {
  const subject = \`?? QC Check Required ? \${job.job_number}\`
  const html = \`<div style="max-width:600px;margin:0 auto">
    <div style="\${headerStyle}"><h2 style="margin:0">?? QC Check Required</h2></div>
    <div style="\${bodyStyle}">
      <p style="margin-bottom:16px">A job is ready for quality control inspection.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
        \${infoRow('Job Number', job.job_number)}
        \${infoRow('Client', job.client_name)}
        \${infoRow('Description', job.description)}
        \${infoRow('Due Date', job.due_date)}
      </table>
      <p style="color:#d97706;font-weight:600;margin-top:16px">Action Required: Complete all 9 QC holding points before marking complete.</p>
      \${footer}
    </div>
  </div>\`
  await sendEmail(ALL, subject, html)
}

export async function emailJobComplete(job: any) {
  const subject = \`? Job Complete ? \${job.job_number}\`
  const html = \`<div style="max-width:600px;margin:0 auto">
    <div style="\${headerStyle}"><h2 style="margin:0">? Job Complete</h2></div>
    <div style="\${bodyStyle}">
      <p style="margin-bottom:16px">A job has been completed and is ready for dispatch.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
        \${infoRow('Job Number', job.job_number)}
        \${infoRow('Client', job.client_name)}
        \${infoRow('Description', job.description)}
        \${infoRow('Due Date', job.due_date)}
      </table>
      <p style="color:#16a34a;font-weight:600;margin-top:16px">Action Required: Arrange delivery and capture invoice in Pastel.</p>
      \${footer}
    </div>
  </div>\`
  await sendEmail(ALL, subject, html)
}

export async function emailJobDispatched(job: any) {
  const subject = \`?? Job Dispatched ? \${job.job_number}\`
  const html = \`<div style="max-width:600px;margin:0 auto">
    <div style="\${headerStyle}"><h2 style="margin:0">?? Job Dispatched</h2></div>
    <div style="\${bodyStyle}">
      <p style="margin-bottom:16px">A job has been dispatched to the client.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
        \${infoRow('Job Number', job.job_number)}
        \${infoRow('Client', job.client_name)}
        \${infoRow('Description', job.description)}
      </table>
      \${footer}
    </div>
  </div>\`
  await sendEmail(ALL, subject, html)
}
`;

e = e + newFunctions;
fs.writeFileSync('src/emailService.ts', e, 'utf8');
console.log('4 workshop email functions added');

// WIRE INTO handleWorkshopStatusChange in App.tsx
let c = fs.readFileSync('src/App.tsx', 'utf8');

// Add imports
c = c.replace(
  "import { emailRFQCreated, emailQuoterAssigned, emailQuoteReady, emailOrderWon, emailJobInReview, emailJobReadyToPrint, emailJobPrinted, emailChildJobSpawned } from './emailService'",
  "import { emailRFQCreated, emailQuoterAssigned, emailQuoteReady, emailOrderWon, emailJobInReview, emailJobReadyToPrint, emailJobPrinted, emailChildJobSpawned, emailJobStarted, emailJobQCCheck, emailJobComplete, emailJobDispatched } from './emailService'"
);
console.log('Import updated:', c.includes('emailJobDispatched'));

// Wire triggers into handleWorkshopStatusChange
const oldHandler = "const handleWorkshopStatusChange = async (jobId: string, newStatus: string) => {";
const newHandler = `const handleWorkshopStatusChange = async (jobId: string, newStatus: string) => {`;

// Find the status update success block and add email triggers
c = c.replace(
  "fetchWorkshopJobs()\n    } catch",
  `fetchWorkshopJobs()
      // Email triggers
      const updatedJob = workshopJobs.find((j:any) => j.id === jobId)
      if (updatedJob) {
        if (newStatus === 'IN_PROGRESS') emailJobStarted(updatedJob)
        if (newStatus === 'QUALITY_CHECK') emailJobQCCheck(updatedJob)
        if (newStatus === 'COMPLETE') emailJobComplete(updatedJob)
        if (newStatus === 'DISPATCHED') emailJobDispatched(updatedJob)
      }
    } catch`
);
console.log('Email triggers wired:', c.includes('emailJobStarted(updatedJob)'));

fs.writeFileSync('src/App.tsx', c, 'utf8');
console.log('Done');
