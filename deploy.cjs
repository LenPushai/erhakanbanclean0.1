const fs=require('fs');fs.writeFileSync('src/App.tsx',fs.readFileSync(process.argv[2]));console.log('Done'); 
