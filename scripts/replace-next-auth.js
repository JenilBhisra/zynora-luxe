const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
    if (!fs.existsSync(dir)) return filelist;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            filelist = walkSync(filepath, filelist);
        } else {
            if (filepath.endsWith('.tsx') || filepath.endsWith('.ts')) {
                filelist.push(filepath);
            }
        }
    }
    return filelist;
};

const appDir = path.join(__dirname, '../app');
const files = walkSync(appDir);

let changed = 0;
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.replace(/import\s+{\s*getServerSession\s*}\s+from\s+["']next-auth\/next["']/g, 'import { getServerSession } from "@/lib/auth"');
    content = content.replace(/import\s+{\s*getServerSession\s*}\s+from\s+["']next-auth["']/g, 'import { getServerSession } from "@/lib/auth"');

    if (content !== original) {
        fs.writeFileSync(file, content);
        changed++;
        console.log(`Updated ${file}`);
    }
}
console.log(`Finished. Updated ${changed} files.`);
