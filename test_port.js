const net = require("net");

console.log("Checking if port 5432 on Neon database is reachable...");
const socket = net.createConnection(5432, "ep-sparkling-surf-ao6bogzf-pooler.c-2.ap-southeast-1.aws.neon.tech");

socket.setTimeout(5000);

socket.on("connect", () => {
    console.log("SUCCESS: Port 5432 is open and reachable!");
    socket.end();
});

socket.on("timeout", () => {
    console.log("TIMEOUT: Connection to port 5432 timed out. (Port is likely blocked by firewall/ISP)");
    socket.destroy();
});

socket.on("error", (err) => {
    console.log("ERROR: Connection failed with error:", err.message);
});
