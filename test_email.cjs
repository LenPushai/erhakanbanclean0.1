const https = require('https');

const body = JSON.stringify({
  to: ['lenklopper03@gmail.com'],
  subject: 'ERHA Test Email',
  html: '<h2>ERHA Email Working!</h2><p>Edge function test.</p>'
});

const options = {
  hostname: 'lvaqqqyjqtguozmdjmfn.supabase.co',
  path: '/functions/v1/send-email',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
    if (res.statusCode === 200) console.log('SUCCESS - check your inbox!');
    else console.log('FAILED - see response above');
  });
});

req.on('error', e => console.error('Request error:', e.message));
req.write(body);
req.end();
