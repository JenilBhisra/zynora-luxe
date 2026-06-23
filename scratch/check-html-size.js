const fs = require("fs");
const path = require("path");

const htmlPath = path.join(__dirname, "../.next/server/app/index.html");
if (fs.existsSync(htmlPath)) {
  const stats = fs.statSync(htmlPath);
  console.log("HTML file size:", (stats.size / 1024 / 1024).toFixed(2), "MB (" + stats.size + " bytes)");
} else {
  console.log("HTML file not found at:", htmlPath);
}

const rscPath = path.join(__dirname, "../.next/server/app/index.rsc");
if (fs.existsSync(rscPath)) {
  const stats = fs.statSync(rscPath);
  console.log("RSC file size:", (stats.size / 1024 / 1024).toFixed(2), "MB (" + stats.size + " bytes)");
}
