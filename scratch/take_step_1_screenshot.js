const puppeteer = require("puppeteer");
const path = require("path");

const SCREENSHOT_DIR = __dirname;
const VIEWPORTS = [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 390, height: 800 }
];

async function capture() {
    console.log("Launching browser...");
    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    try {
        const page = await browser.newPage();
        
        for (const vp of VIEWPORTS) {
            console.log(`Setting viewport: ${vp.name} (${vp.width}x${vp.height})`);
            await page.setViewport({ width: vp.width, height: vp.height });

            console.log("Navigating to Step 1 Diamond selection page...");
            await page.goto("http://localhost:3000/customizer/step-1-diamond", { waitUntil: "networkidle2" });
            
            // Wait for data fetching and animations
            await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000)));

            const screenshotPath = path.join(SCREENSHOT_DIR, `step_1_diamond_${vp.name}.png`);
            await page.screenshot({ path: screenshotPath });
            console.log(`Saved screenshot: ${screenshotPath}`);
        }
    } catch (err) {
        console.error("Error during screenshot capture:", err);
    } finally {
        await browser.close();
    }
}

capture().catch(console.error);
