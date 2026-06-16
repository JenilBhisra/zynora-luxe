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

    content = content.replace(/import\s+{\s*authOptions\s*}\s+from\s+['"]@\/lib\/auth['"];?\n?/g, '');
    content = content.replace(/import\s+{\s*(.*?),?\s*authOptions\s*,?\s*(.*?)\s*}\s+from\s+['"]@\/lib\/auth['"];?/g, 'import { $1 $2 } from "@/lib/auth";');
    content = content.replace(/getServerSession\(authOptions\)/g, 'getServerSession()');

    if (content !== original) {
        fs.writeFileSync(file, content);
        changed++;
        console.log(`Updated ${file}`);
    }
}
console.log(`Finished. Updated ${changed} files.`);
