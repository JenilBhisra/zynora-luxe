const fs = require("fs");
const path = require("path");

const htmlPath = path.join(__dirname, "../.next/server/app/index.html");
if (!fs.existsSync(htmlPath)) {
  console.log("HTML file not found. Please run a build first.");
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, "utf-8");
console.log(`HTML File size: ${(html.length / 1024 / 1024).toFixed(2)} MB (${html.length} bytes)`);

// Find script tags
const scriptRegex = /<script([\s\S]*?)>([\s\S]*?)<\/script>/gi;
let match;
const scriptTags = [];
while ((match = scriptRegex.exec(html)) !== null) {
  scriptTags.push({
    attributes: match[1],
    contentLength: match[2].length,
    snippet: match[2].substring(0, 100) + "..."
  });
}

console.log(`\nFound ${scriptTags.length} script tags.`);
scriptTags.sort((a, b) => b.contentLength - a.contentLength);
console.log("Top 10 largest script tags:");
scriptTags.slice(0, 10).forEach((t, i) => {
  console.log(`[${i+1}] Length: ${(t.contentLength / 1024).toFixed(2)} KB | Attributes: ${t.attributes.trim().substring(0, 100)}`);
  console.log(`    Snippet: ${t.snippet}`);
});

// Let's search for base64 patterns in the HTML
const base64Regex = /data:image\/[a-zA-Z]+;base64,[a-zA-Z0-9+/=]+/g;
const base64Matches = html.match(base64Regex) || [];
console.log(`\nFound ${base64Matches.length} inline base64 images in HTML.`);
const sortedBase64 = base64Matches.map(m => m.length).sort((a, b) => b - a);
console.log("Top 5 largest base64 images size in KB:");
sortedBase64.slice(0, 5).forEach((size, i) => {
  console.log(`- ${i+1}: ${(size / 1024).toFixed(2)} KB`);
});

// Search for __NEXT_DATA__ or similar hydration JSON
const rscRegex = /self\.__next_f\.push\(([\s\S]*?)\)/g;
let rscMatch;
let totalRscLength = 0;
const rscChunks = [];
while ((rscMatch = rscRegex.exec(html)) !== null) {
  totalRscLength += rscMatch[1].length;
  rscChunks.push(rscMatch[1]);
}
console.log(`\nTotal Next.js flight data (__next_f) size in HTML: ${(totalRscLength / 1024 / 1024).toFixed(2)} MB`);
console.log(`Number of flight data chunks: ${rscChunks.length}`);
rscChunks.sort((a, b) => b.length - a.length);
console.log("Top 5 largest flight data chunks:");
rscChunks.slice(0, 5).forEach((c, i) => {
  console.log(`- Chunk ${i+1}: ${(c.length / 1024).toFixed(2)} KB | Snippet: ${c.substring(0, 150)}...`);
});
