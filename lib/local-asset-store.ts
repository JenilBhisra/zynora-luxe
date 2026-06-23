/**
 * lib/local-asset-store.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * File-based fallback store for site asset overrides.
 * Used when the Neon DB is unavailable (quota exceeded / offline).
 *
 * Assets are saved to: /data/site-assets.json
 * This file is excluded from git (.gitignore) to prevent committing overrides.
 * On production (Vercel), the DB is used; this is only a local dev fallback.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs from "fs";
import path from "path";

const STORE_PATH = path.join(process.cwd(), "data", "site-assets.json");

function ensureStoreDir() {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

export function readLocalAssets(): Record<string, string> {
    try {
        ensureStoreDir();
        if (!fs.existsSync(STORE_PATH)) return {};
        const raw = fs.readFileSync(STORE_PATH, "utf-8");
        return JSON.parse(raw) as Record<string, string>;
    } catch {
        return {};
    }
}

export function writeLocalAsset(key: string, url: string): void {
    try {
        ensureStoreDir();
        const current = readLocalAssets();
        current[key] = url;
        fs.writeFileSync(STORE_PATH, JSON.stringify(current, null, 2), "utf-8");
        console.log(`[LocalAssetStore] Saved asset override: ${key} → ${url}`);
    } catch (err) {
        console.error("[LocalAssetStore] Failed to write asset override:", err);
    }
}
