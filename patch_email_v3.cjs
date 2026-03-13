const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'emailService.ts');

// Read current file
let content = fs.readFileSync(filePath, 'utf8');

// Replace the sendEmail function to use Edge Function instead of Resend directly
const oldSendEmail = `async function sendEmail(to: string[], subject: string, html: string) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${RESEND_API_KEY}\`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    })
    const data = await res.json()
    if (!res.ok) console.error('Email error:', data)
    else console.log('Email sent:', subject)
  } catch (err) {
    console.error('Email send failed:', err)
  }
}`;

const newSendEmail = `async function sendEmail(to: string[], subject: string, html: string) {
  try {
    const res = await fetch('https://lvaqqqyjqtguozmdjmfn.supabase.co/functions/v1/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2YXFxcXlqcXRndW96bWRqbWZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MTk2NzYsImV4cCI6MjA4NDA5NTY3Nn0._a09PreXgLIXSrSIqCdetmfgJDVvV3kN-aNa0myax7g',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2YXFxcXlqcXRndW96bWRqbWZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MTk2NzYsImV4cCI6MjA4NDA5NTY3Nn0._a09PreXgLIXSrSIqCdetmfgJDVvV3kN-aNa0myax7g',
      },
      body: JSON.stringify({ to, subject, html }),
    })
    const data = await res.json()
    if (!res.ok) console.error('Email error:', data)
    else console.log('Email sent:', subject)
  } catch (err) {
    console.error('Email send failed:', err)
  }
}`;

if (content.includes("'https://api.resend.com/emails'")) {
  content = content.replace(oldSendEmail, newSendEmail);
  // fallback - just replace the URL if full match fails
  if (content.includes("'https://api.resend.com/emails'")) {
    content = content.replace(
      "'https://api.resend.com/emails'",
      "'https://lvaqqqyjqtguozmdjmfn.supabase.co/functions/v1/send-email'"
    );
    console.log('PASS: Resend URL replaced with Edge Function URL (URL-only replace)');
  } else {
    console.log('PASS: sendEmail function replaced with Edge Function version');
  }
} else {
  console.log('INFO: Resend URL not found - may already be updated');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done - run: npx vite --force');
console.log('Then test: move a job card to IN_REVIEW');
