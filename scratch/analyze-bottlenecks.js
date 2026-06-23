const http = require("http");
const fs = require("fs");
const path = require("path");

function measure() {
  const url = "http://localhost:3001/";
  const start = Date.now();
  let ttfb = 0;

  const req = http.get(url, (res) => {
    res.once("data", () => {
      ttfb = Date.now() - start;
      console.log(`⏱️ TTFB: ${ttfb} ms`);
    });

    let body = "";
    res.on("data", (chunk) => {
      body += chunk;
    });

    res.on("end", () => {
      const totalTime = Date.now() - start;
      console.log(`⏱️ Total load time: ${totalTime} ms`);
      console.log(`📦 HTML payload size: ${(body.length / 1024 / 1024).toFixed(2)} MB (${body.length} bytes)`);

      // Analyze scripts
      const scripts = [];
      const scriptRegex = /<script\s+[^>]*src=["']([^"']+)["']/gi;
      let match;
      while ((match = scriptRegex.exec(body)) !== null) {
        scripts.push(match[1]);
      }
      console.log("\n📜 Injected Script Tags:");
      scripts.forEach(s => console.log(`- ${s}`));

      // Analyze stylesheets
      const styles = [];
      const styleRegex = /<link\s+[^>]*rel=["']stylesheet["']\s+[^>]*href=["']([^"']+)["']/gi;
      while ((match = styleRegex.exec(body)) !== null) {
        styles.push(match[1]);
      }
      console.log("\n🎨 Injected Stylesheets:");
      styles.forEach(s => console.log(`- ${s}`));

      // Check external resources sizes from .next
      console.log("\n📦 Client Bundle Chunk Sizes:");
      const staticDir = path.join(__dirname, "../.next/static");
      if (fs.existsSync(staticDir)) {
        let totalJSSize = 0;
        let totalCSSSize = 0;
        
        function recurse(dir) {
          const files = fs.readdirSync(dir);
          for (const file of files) {
            const full = path.join(dir, file);
            const stat = fs.statSync(full);
            if (stat.isDirectory()) {
              recurse(full);
            } else if (file.endsWith(".js")) {
              totalJSSize += stat.size;
            } else if (file.endsWith(".css")) {
              totalCSSSize += stat.size;
            }
          }
        }
        recurse(staticDir);
        console.log(`- Total JS chunks size in .next/static: ${(totalJSSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`- Total CSS chunks size in .next/static: ${(totalCSSSize / 1024).toFixed(2)} KB`);
      }
    });
  });

  req.on("error", (err) => {
    console.error("Error making request:", err);
  });
}

measure();
