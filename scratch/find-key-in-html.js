const fs = require("fs");
const path = require("path");

const htmlPath = path.join(__dirname, "../.next/server/app/index.html");
if (!fs.existsSync(htmlPath)) {
  console.log("HTML not found. Run next build first.");
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, "utf-8");
console.log("HTML length:", html.length);

const testKeys = ["hero-slide-2", "hero-slide-3", "diamond-shape-hover-heart"];
for (const key of testKeys) {
  const index = html.indexOf(key);
  console.log(`Index of "${key}":`, index);
  if (index !== -1) {
    console.log(`Context of "${key}":`);
    console.log(html.substring(Math.max(0, index - 200), Math.min(html.length, index + 300)));
    console.log("\n-------------------\n");
  }
}
