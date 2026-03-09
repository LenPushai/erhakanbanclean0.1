const fs = require('fs');
const path = require('path');
const root = 'C:\\Users\\lenkl\\WebstormProjects\\erhakanbanclean0.1';

const files = {
  'tailwind.config.js': `/** @type {import('tailwindcss').Config} */\nexport default {\n  content: [\n    "./index.html",\n    "./src/**/*.{js,ts,jsx,tsx}",\n  ],\n  theme: { extend: {} },\n  plugins: [],\n}\n`,
  'postcss.config.js': `export default {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n}\n`,
  'src/index.css': `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n`,
  '.env': `VITE_SUPABASE_URL=https://lvaqqqyjqtguozmdzmfn.supabase.co\nVITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2YXFxcXlqcXRndW96bWRqbWZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MTk2NzYsImV4cCI6MjA4NDA5NTY3Nn0._a09PreXgLIXSrSIqCdetmfgJDVvV3kN-aNa0myax7g\n`,
  'src/lib/supabase.ts': `import { createClient } from '@supabase/supabase-js'\n\nconst supabaseUrl = import.meta.env.VITE_SUPABASE_URL\nconst supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY\n\nexport const supabase = createClient(supabaseUrl, supabaseAnonKey)\n`,
};

for (const [rel, content] of Object.entries(files)) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'ascii');
  console.log('OK  ' + rel);
}
console.log('\nAll 5 files written. Now run: npm run dev');
