const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
lines.forEach((x, i) => {
  if (
    x.includes('handleCreate') ||
    x.includes('enqNumber') ||
    x.includes('Create RFQ') ||
    x.includes('rfq_received') ||
    x.includes('emailRFQCreated') ||
    x.includes('emailQuoterAssigned') ||
    x.includes('emailQuoteReady')
  ) {
    console.log(i+1 + ': ' + x);
  }
});
