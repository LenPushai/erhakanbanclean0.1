$content = @'
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
app.post('/send', async (req, res) => {
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer re_Q3RKYakG_9yGoARH977FNLhwF2rG9Y8vk',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    const d = await r.json();
    res.json(d);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.listen(3001, () => console.log('Email server running on port 3001'));
'@
[System.IO.File]::WriteAllText('email-server.js', $content, [System.Text.Encoding]::ASCII)
Write-Host "Done"
