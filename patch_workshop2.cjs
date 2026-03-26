const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// 1. Add handleWorkshopStatusChange before the return statement of App()
const returnIdx = lines.findIndex(l => l.trim() === 'return (' && lines[lines.indexOf(l)-1] && lines.indexOf(l) > 400);
const workshopHandler = [
  "  const handleWorkshopStatusChange = async (jobId: string, newStatus: string) => {\r",
  "    try {\r",
  "      const updates: any = { workshop_status: newStatus }\r",
  "      if (newStatus === 'IN_PROGRESS') updates.time_started_at = new Date().toISOString()\r",
  "      await supabase.from('jobs').update(updates).eq('id', jobId)\r",
  "      if (newStatus === 'DISPATCHED') {\r",
  "        const job = workshopJobs.find(j => j.id === jobId)\r",
  "        if (job?.rfq_id) {\r",
  "          await supabase.from('rfqs').update({ status: 'JOB_CREATED' }).eq('id', job.rfq_id)\r",
  "          emailOrderWon({ id: job.rfq_id, description: job.description || '' } as any)\r",
  "        }\r",
  "      }\r",
  "      fetchWorkshopJobs()\r",
  "    } catch (e: any) { alert('Error: ' + e.message) }\r",
  "  }\r",
  "\r",
];
lines.splice(returnIdx, 0, ...workshopHandler);
console.log('[1] handleWorkshopStatusChange added at ' + (returnIdx + 1));

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Workshop patch phase 2 complete');
