import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { setEntry } from '../core/cache';
import { getTokens } from '../core/tokens';
import { calculateCacheVersion, agent } from '../core/utils';

type UploadOptions = {
  filePath?: string;
  fileUrl?: string;
  runtimeToken?: string;
  key?: string;
  version?: string;
};

/**
 * Upload an artifact to GitHub cache.
 *
 * Handles:
 *  - Local file (-f)
 *  - Remote URL (-u)
 *  - Embedded static file (default)
 *
 * @param filePath Local file path
 * @param fileUrl Remote file URL
 * @param token GitHub runtime token
 * @param key Cache key
 * @param version Cache version
 */
export async function uploadArtifact(opts: UploadOptions = {}) {
    let { filePath, fileUrl, runtimeToken, key, version } = opts;
  if (!runtimeToken) {
    const tokens = await getTokens();
    const runtimeToken = tokens.get('ACCESS_TOKEN');
  }

  if (!key || !version) {
    console.error('Error: Both cache key and version are required.');
    process.exit(1);
  }

  if(version){
    const hex64Regex = /^[a-f0-9]{64}$/i;
    if (!hex64Regex.test(version)) {
        version = await calculateCacheVersion(version.split(',').map(v => v.trim()).filter(v => v.length > 0));
    }
  }

  let archivePath: string;

  // 1️⃣ Remote URL
  if (fileUrl) {
    try {
      console.log(`Downloading artifact from URL: ${fileUrl}`);
      const response = await axios.get(fileUrl, { responseType: 'arraybuffer', httpsAgent: agent });
      archivePath = path.join(process.cwd(), path.basename(new URL(fileUrl).pathname));
      fs.writeFileSync(archivePath, Buffer.from(response.data));
      console.log(`Downloaded file saved to: ${archivePath}`);
    } catch (error) {
      console.error('Failed to download the file:', error);
      process.exit(1);
    }

  // 2️⃣ Local file
  } else if (filePath) {
    if (!fs.existsSync(filePath)) {
      console.error(`Local file does not exist: ${filePath}`);
      process.exit(1);
    }
    archivePath = path.resolve(filePath);

  // 3️⃣ Embedded static file
  } else {
    archivePath = path.join(process.cwd(), 'cache.zstd');
    const staticZstd = await loadStaticZstdFile();
    fs.writeFileSync(archivePath, Buffer.from(staticZstd));
    console.log(`Embedded artifact written to: ${archivePath}`);
  }

  try {
    console.log(`Setting cache entry with key: ${key}`);
    const success = await setEntry(archivePath, key, version, runtimeToken);
    if (success) {
      console.log('Cache entry set successfully ✅');
    } else {
      console.error('Failed to set cache entry ❌');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error setting cache entry:', error);
    process.exit(1);
  }
}


async function loadStaticZstdFile() {
  try {
    const zstdData = (await import(EMBEDDED_FETCH_MODE_VALUE)).default;
    console.log(`Zstd file loaded. Size: ${zstdData.byteLength} bytes`);
    return zstdData;
  } catch (error) {
    console.log(`Warning: zstd file not found. Skipping...`);
    return null;
  }
}