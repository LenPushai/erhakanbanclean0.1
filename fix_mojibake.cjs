// fix_mojibake.cjs
// ERHA Operations — Mojibake Fix on Job Execution Panel
// Run from project root: node fix_mojibake.cjs

const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'App.tsx');

console.log('🔧 ERHA Mojibake Fix (byte-level) Started');
console.log(`Target: ${filePath}\n`);

// 1. Read the entire file as raw Buffer (preserves exact bytes + all CRLF endings)
let buffer = fs.readFileSync(filePath);
const originalSize = buffer.length;

console.log(`✅ File read as raw bytes (${originalSize} bytes, Windows CRLF preserved)`);

// 2. Mojibake byte sequences (exact bytes present in the file)
// These are the UTF-8 bytes of the mojibake characters â†0 and Â·
const mojibakeBackBytes = Buffer.from([195, 162, 226, 128, 160, 48]);   // â†0
const mojibakeDotBytes  = Buffer.from([195, 130, 194, 183]);           // Â·

// Correct UTF-8 byte sequences
const correctBackBytes = Buffer.from([226, 134, 144]);   // ←
const correctDotBytes  = Buffer.from([194, 183]);        // ·

// Helper: replace all occurrences of a byte pattern (byte-level, no string decoding)
function replaceBytes(source, search, replace) {
  let result = source;
  let pos = 0;
  let count = 0;

  while ((pos = result.indexOf(search, pos)) !== -1) {
    result = Buffer.concat([
      result.slice(0, pos),
      replace,
      result.slice(pos + search.length)
    ]);
    pos += replace.length;
    count++;
  }
  return { buffer: result, count };
}

// 3. Perform the fixes
let { buffer: fixedBuffer, count: backCount } = replaceBytes(buffer, mojibakeBackBytes, correctBackBytes);
let { buffer: finalBuffer, count: dotCount } = replaceBytes(fixedBuffer, mojibakeDotBytes, correctDotBytes);

console.log('\n🔄 Replacements completed:');
console.log(`   • ← Back button : ${backCount} occurrence(s) fixed`);
console.log(`   • · separator   : ${dotCount} occurrence(s) fixed`);

// 4. Write the file back (exact same line endings, no encoding conversion)
fs.writeFileSync(filePath, finalBuffer);

console.log(`\n✅ File written back successfully (${finalBuffer.length} bytes)`);

// 5. Verification
const verificationText = finalBuffer.toString('utf8');
const backFixed = verificationText.includes('← Back');
const dotFixed = verificationText.includes('·');

console.log('\n🔍 VERIFICATION:');
console.log(`   Back button label → ${backFixed ? '✅ ← Back' : '❌ still broken'}`);
console.log(`   Client separator  → ${dotFixed ? '✅ ·' : '❌ still broken'}`);

if (backFixed && dotFixed) {
  console.log('\n🎉 SUCCESS! Mojibake has been completely fixed.');
  console.log('   → Commit src/App.tsx and redeploy to Vercel.');
  console.log('   → The Job Execution Panel will now show ← Back and · correctly.');
} else {
  console.log('\n⚠️  One or both fixes were not detected. Check the file manually.');
}

console.log('\nScript finished.');