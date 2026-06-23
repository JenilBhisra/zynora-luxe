const http = require("http");
const zlib = require("zlib");

const options = {
  hostname: "localhost",
  port: 3001,
  path: "/",
  method: "GET",
  headers: {
    "Accept-Encoding": "gzip"
  }
};

const req = http.request(options, (res) => {
  console.log(`Response Status: ${res.statusCode}`);
  console.log("Headers:", res.headers);

  let rawData = [];
  res.on("data", (chunk) => {
    rawData.push(chunk);
  });

  res.on("end", () => {
    const buffer = Buffer.concat(rawData);
    console.log(`\n📦 Gzipped Over-the-wire payload size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB (${buffer.length} bytes)`);

    // Let's verify decompression
    if (res.headers["content-encoding"] === "gzip") {
      zlib.gunzip(buffer, (err, decoded) => {
        if (err) {
          console.error("Failed to decompress:", err);
        } else {
          console.log(`🔓 Uncompressed size: ${(decoded.length / 1024 / 1024).toFixed(2)} MB (${decoded.length} bytes)`);
        }
      });
    } else {
      console.log("Response was not gzipped. Measuring raw buffer length.");
    }
  });
});

req.on("error", (err) => {
  console.error("Error making request:", err);
});

req.end();
