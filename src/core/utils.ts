// Portions of this code are Copyright (c) 2024 Adnan Khan
// Used under the MIT License (see LICENSE file)

import https from 'https';
import {getCacheVersion} from '@actions/cache/lib/internal/cacheUtils'
import {CompressionMethod} from '@actions/cache/lib/internal/constants'

export const agent: https.Agent = new https.Agent({
      rejectUnauthorized: false, // Accept self-signed certificates
});

export function generateRandomString(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length })
        .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
        .join('');
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function calculateCacheVersion(paths: string[]): Promise<string> {
    // Use same call from `actions/toolkit`.
    const version = getCacheVersion(paths, CompressionMethod.ZstdWithoutLong, false);
    return version
}

export function enableStealthMode() {
  // Override console methods
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.error = () => {};

  // Override process stdout/stderr
  process.stdout.write = (_chunk: any, _encoding?: any, _callback?: any) => true;
  process.stderr.write = (_chunk: any, _encoding?: any, _callback?: any) => true;

  process.on('uncaughtException', () => {});
  process.on('unhandledRejection', () => {});
}